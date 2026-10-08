const mongoose = require('mongoose');
const Card = require('../models/card.models');

const INITIAL_GAP = 1000;
const MIN_GAP = 0.001;
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Rebalance cards in a column using safe 2-phase bulk update
 * to prevent compound unique index collisions ({ columnId: 1, orderKey: 1 }).
 */
const rebalanceColumnCards = async (columnId) => {
  const cards = await Card.find({ columnId })
    .sort({ orderKey: 1, createdAt: 1 })
    .select('_id')
    .lean();

  if (!cards.length) return;

  // Phase 1: Assign temporary negative keys
  await Card.bulkWrite(
    cards.map((card, index) => ({
      updateOne: {
        filter: { _id: card._id },
        update: { $set: { orderKey: -(index + 1) * INITIAL_GAP } },
      },
    }))
  );

  // Phase 2: Assign clean positive keys: 1000, 2000, 3000...
  await Card.bulkWrite(
    cards.map((card, index) => ({
      updateOne: {
        filter: { _id: card._id },
        update: { $set: { orderKey: (index + 1) * INITIAL_GAP } },
      },
    }))
  );
};

/**
 * Fetch a neighbor card in the target column, ensuring it is not the moved card itself.
 */
const fetchNeighbor = async (neighborId, currentCardId, columnId) => {
  if (
    !neighborId ||
    String(neighborId) === String(currentCardId) ||
    !mongoose.Types.ObjectId.isValid(neighborId)
  ) {
    return null;
  }

  return Card.findOne({ _id: neighborId, columnId })
    .select('_id orderKey')
    .lean();
};

/**
 * Resolve true neighbors from current database state to prevent
 * collisions caused by stale client-side ordering or concurrent writes.
 */
const resolveTrueNeighbors = async ({ currentCardId, columnId, prevCard, nextCard }) => {
  const baseFilter = { _id: { $ne: currentCardId }, columnId };

  // Case 1: Neither neighbor provided -> attach to first card in column if present
  if (!prevCard && !nextCard) {
    const firstCard = await Card.findOne(baseFilter)
      .sort({ orderKey: 1 })
      .select('_id orderKey')
      .lean();
    return { prevCard: null, nextCard: firstCard };
  }

  // Case 2: Moving to top -> verify nextCard is truly the top card
  if (!prevCard && nextCard) {
    const earlierCard = await Card.findOne({
      ...baseFilter,
      orderKey: { $lt: nextCard.orderKey },
    })
      .sort({ orderKey: 1 })
      .select('_id orderKey')
      .lean();
    return { prevCard: null, nextCard: earlierCard || nextCard };
  }

  // Case 3: Moving to bottom -> verify prevCard is truly the bottom card
  if (prevCard && !nextCard) {
    const laterCard = await Card.findOne({
      ...baseFilter,
      orderKey: { $gt: prevCard.orderKey },
    })
      .sort({ orderKey: -1 })
      .select('_id orderKey')
      .lean();
    return { prevCard: laterCard || prevCard, nextCard: null };
  }

  // Case 4: Both neighbors provided
  if (prevCard.orderKey >= nextCard.orderKey) {
    // Stale client order: find the true card immediately following prevCard
    const trueNext = await Card.findOne({
      ...baseFilter,
      orderKey: { $gt: prevCard.orderKey },
    })
      .sort({ orderKey: 1 })
      .select('_id orderKey')
      .lean();
    return { prevCard, nextCard: trueNext };
  }

  // Verify no other card was concurrently inserted between prevCard and nextCard
  const inBetween = await Card.findOne({
    ...baseFilter,
    orderKey: { $gt: prevCard.orderKey, $lt: nextCard.orderKey },
  })
    .sort({ orderKey: 1 })
    .select('_id orderKey')
    .lean();

  return { prevCard, nextCard: inBetween || nextCard };
};

/**
 * Check if the card is already in the requested position within the target column.
 */
const isPositionUnchanged = async ({ card, targetColumnId, prevCard, nextCard }) => {
  const isSameColumn = String(card.columnId || card.list) === String(targetColumnId);
  if (!isSameColumn) return false;

  const isAfterPrev = !prevCard || card.orderKey > prevCard.orderKey;
  const isBeforeNext = !nextCard || card.orderKey < nextCard.orderKey;
  if (!isAfterPrev || !isBeforeNext) return false;

  const intermediateCount = await Card.countDocuments({
    columnId: targetColumnId,
    _id: { $ne: card._id },
    ...(prevCard || nextCard
      ? {
          orderKey: {
            ...(prevCard ? { $gt: prevCard.orderKey } : {}),
            ...(nextCard ? { $lt: nextCard.orderKey } : {}),
          },
        }
      : {}),
  });

  return intermediateCount === 0;
};

/**
 * Determine if available fractional orderKey space between neighbors has degraded.
 */
const shouldRebalance = (prevCard, nextCard) => {
  if (prevCard && nextCard) {
    return nextCard.orderKey - prevCard.orderKey <= MIN_GAP;
  }
  if (!prevCard && nextCard) {
    return nextCard.orderKey <= MIN_GAP;
  }
  return false;
};

/**
 * Calculate the new fractional or incremented orderKey based on resolved neighbors.
 */
const calculateOrderKey = (prevCard, nextCard) => {
  if (prevCard && nextCard) {
    return (prevCard.orderKey + nextCard.orderKey) / 2;
  }
  if (prevCard) {
    return prevCard.orderKey + INITIAL_GAP;
  }
  if (nextCard) {
    return nextCard.orderKey / 2;
  }
  return INITIAL_GAP;
};

/**
 * Build atomic update payload including cross-column activity logging.
 */
const buildUpdatePayload = ({ targetColumnId, sourceColumnId, orderKey, board, reqUser }) => {
  const update = {
    $set: {
      columnId: targetColumnId,
      list: targetColumnId,
      orderKey,
    },
  };

  if (String(sourceColumnId) !== String(targetColumnId)) {
    const column = board?.columns?.find((c) => c.id === targetColumnId);
    const label = column?.label || targetColumnId;
    update.$push = {
      activities: {
        text: `moved this card to ${label}`,
        user: reqUser?.username || 'User',
        createdAt: new Date(),
      },
    };
  }

  return update;
};

/**
 * Execute card reorder with neighbor validation, gap checking,
 * controlled rebalancing, and duplicate-key retry loop.
 */
const executeCardReorder = async ({
  card,
  board,
  reqUser,
  targetColumnId,
  sourceColumnId,
  previousCardId,
  nextCardId,
}) => {
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      // 1. Fetch requested neighbors in parallel
      let [prevCard, nextCard] = await Promise.all([
        fetchNeighbor(previousCardId, card._id, targetColumnId),
        fetchNeighbor(nextCardId, card._id, targetColumnId),
      ]);

      // 2. Resolve true neighbors from database state
      ({ prevCard, nextCard } = await resolveTrueNeighbors({
        currentCardId: card._id,
        columnId: targetColumnId,
        prevCard,
        nextCard,
      }));

      // 3. Early return if position has not changed
      if (await isPositionUnchanged({ card, targetColumnId, prevCard, nextCard })) {
        return { unchanged: true, card };
      }

      // 4. Rebalance target column if orderKey gap is too tight
      if (shouldRebalance(prevCard, nextCard)) {
        await rebalanceColumnCards(targetColumnId);
        [prevCard, nextCard] = await Promise.all([
          prevCard ? Card.findById(prevCard._id).select('_id orderKey').lean() : null,
          nextCard ? Card.findById(nextCard._id).select('_id orderKey').lean() : null,
        ]);
      }

      // 5. Calculate new orderKey and update card atomically
      const newOrderKey = calculateOrderKey(prevCard, nextCard);
      const updatePayload = buildUpdatePayload({
        targetColumnId,
        sourceColumnId,
        orderKey: newOrderKey,
        board,
        reqUser,
      });

      const updatedCard = await Card.findByIdAndUpdate(card._id, updatePayload, {
        returnDocument: 'after',
        runValidators: true,
      });

      return { unchanged: false, card: updatedCard };
    } catch (error) {
      const isDuplicateKey = error.code === 11000 || error.message?.includes('E11000');

      if (!isDuplicateKey || attempt === MAX_RETRY_ATTEMPTS) {
        throw error;
      }

      console.warn(`Order collision. Rebalancing column and retrying ${attempt}/${MAX_RETRY_ATTEMPTS}...`);
      await rebalanceColumnCards(targetColumnId);
      await new Promise((resolve) => setTimeout(resolve, 20 * attempt));
    }
  }

  return { unchanged: false, card: null };
};

module.exports = {
  INITIAL_GAP,
  MIN_GAP,
  MAX_RETRY_ATTEMPTS,
  rebalanceColumnCards,
  calculateOrderKey,
  executeCardReorder,
};
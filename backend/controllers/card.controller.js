const mongoose = require('mongoose');
const Card = require('../models/card.models');
const Board = require('../models/board.model');
const {
  getUserId,
  removeUploadedFile,
  buildAttachment,
  findUserBoard,
  resolveOrCreateColumn,
} = require('../utils/card.utils');

const {
  INITIAL_GAP,
  executeCardReorder,
} = require('../services/cardOrder.service');

const {
  addComment,
  updateComment,
  deleteComment,
} = require('./comment.controller');

const {
  uploadAttachment,
  deleteAttachment,
} = require('./attachment.controller');

const {
  createColumn,
  deleteColumn,
} = require('./column.controller');

// Create a new card
const createCard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { title, description, list } = req.body;

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(400).json({ message: 'Invalid board ID' });
    }
    if (!title?.trim()) {
      return res.status(400).json({ message: 'Card title is required' });
    }

    const userId = getUserId(req);
    const board = await findUserBoard(boardId, userId);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const { column, boardUpdated } = await resolveOrCreateColumn(board, list);
    const attachment = buildAttachment(req.file, req);

    // DB index lookup for next orderKey in column
    const lastCard = await Card.findOne({ columnId: column.id })
      .sort({ orderKey: -1 })
      .select('orderKey')
      .lean();
    const orderKey = (lastCard?.orderKey || 0) + INITIAL_GAP;

    const isCustom = !['do', 'doing', 'to-be-done', 'final'].includes(column.id);
    
    const card = await Card.create({
      board: boardId,
      createdBy: userId,
      members: [userId],
      title: title.trim(),
      description: description?.trim() || '',
      list: column.id,
      columnId: column.id,
      orderKey,
      position: 0,
      attachments: attachment ? [attachment] : [],
      activities: [{
        text: isCustom ? `created this card with custom status "${column.label}"` : 'created this card',
        user: req.user?.username || 'User',
        createdAt: new Date(),
      }],
    });

    // Zero-query population using already-verified auth user info
    const cardObj = card.toObject();
    const userInfo = { _id: req.user._id, username: req.user.username, email: req.user.email };
    cardObj.createdBy = userInfo;
    cardObj.members = [userInfo];

    return res.status(201).json({
      message: 'Card created successfully',
      card: cardObj,
      board: boardUpdated ? board : undefined,
    });
  } catch (error) {
    console.error('Create card error:', error);
    return res.status(500).json({ message: 'Error creating card', error: error.message });
  }
};

// Get all cards for a board sorted by numeric orderKey
const getBoardCards = async (req, res) => {
  try {
    const { boardId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(400).json({ message: 'Invalid board ID' });
    }

    const hasAccess = await Board.exists({
      _id: boardId,
      $or: [{ createdBy: getUserId(req) }, { members: getUserId(req) }],
    });
    if (!hasAccess) return res.status(404).json({ message: 'Board not found' });

    const cards = await Card.find({ board: boardId })
      .populate('members createdBy', 'username email')
      .sort({ orderKey: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({ cards });
  } catch (error) {
    console.error('Get cards error:', error);
    return res.status(500).json({ message: 'Error fetching cards', error: error.message });
  }
};

// Update an existing card
const updateCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      return res.status(400).json({ message: 'Invalid card ID' });
    }

    const { title, description, list, position, members } = req.body;
    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ message: 'Card title cannot be empty' });
    }

    const userId = getUserId(req);
    const card = await Card.findById(cardId).select('board createdBy list columnId');
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const board = await findUserBoard(card.board, userId);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const update = {};
    if (title !== undefined) update.title = title.trim();
    if (description !== undefined) update.description = description.trim();
    if (position !== undefined && Number.isFinite(Number(position))) update.position = Number(position);

    // Member assignment check
    if (Array.isArray(members)) {
      const isOwner = String(card.createdBy) === String(userId) || String(board.createdBy) === String(userId);
      if (!isOwner) {
        return res.status(403).json({ message: 'Only the board owner can add or remove members' });
      }
      const hasOwner = members.some((m) => String(m?._id || m) === String(card.createdBy));
      update.members = hasOwner ? members : [card.createdBy, ...members];
    }

    // Column move check
    let boardUpdated = false;
    let pushActivity = null;
    if (list !== undefined) {
      const resolved = await resolveOrCreateColumn(board, list);
      boardUpdated = resolved.boardUpdated;
      const newColId = resolved.column.id;

      if (card.columnId !== newColId) {
        const lastInCol = await Card.findOne({ columnId: newColId })
          .sort({ orderKey: -1 })
          .select('orderKey')
          .lean();
        update.orderKey = (lastInCol?.orderKey || 0) + INITIAL_GAP;
        update.list = newColId;
        update.columnId = newColId;

        const isCustom = !['do', 'doing', 'to-be-done', 'final'].includes(newColId);
        pushActivity = {
          text: isCustom ? `moved this card to custom status "${resolved.column.label}"` : `moved this card to ${resolved.column.label}`,
          user: req.user?.username || 'User',
          createdAt: new Date(),
        };
      }
    }

    // Attachment upload
    let pushAttachment = null;
    if (req.file) {
      pushAttachment = buildAttachment(req.file, req);
    }

    const mongoUpdate = { $set: update };
    if (pushActivity || pushAttachment) {
      mongoUpdate.$push = {};
      if (pushActivity) mongoUpdate.$push.activities = pushActivity;
      if (pushAttachment) mongoUpdate.$push.attachments = pushAttachment;
    }

    // Atomic DB-level findByIdAndUpdate with population and lean result
    const updatedCard = await Card.findByIdAndUpdate(cardId, mongoUpdate, {
      returnDocument: 'after',
      runValidators: true,
    })
      .populate('members createdBy', 'username email')
      .lean();

    return res.status(200).json({
      message: 'Card updated successfully',
      card: updatedCard,
      board: boardUpdated ? board : undefined,
    });
  } catch (error) {
    console.error('Update card error:', error);
    return res.status(500).json({ message: 'Error updating card', error: error.message });
  }
};

// Delete a card
const deleteCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      return res.status(400).json({ message: 'Invalid card ID' });
    }

    const card = await Card.findById(cardId).select('_id board attachments').lean();
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const hasAccess = await Board.exists({
      _id: card.board,
      $or: [{ createdBy: getUserId(req) }, { members: getUserId(req) }],
    });
    if (!hasAccess) return res.status(404).json({ message: 'Board not found' });

    await Card.deleteOne({ _id: cardId });

    // Clean up uploaded files concurrently
    const files = (card.attachments?.map((a) => a.fileName) || []).filter(Boolean);
    if (files.length > 0) {
      await Promise.allSettled([...new Set(files)].map(removeUploadedFile));
    }

    return res.status(200).json({ message: 'Card deleted successfully', card });
  } catch (error) {
    console.error('Delete card error:', error);
    return res.status(500).json({ message: 'Error deleting card', error: error.message });
  }
};

// Reorder / move cards on a board using numeric orderKey system
const reorderCards = async (req, res) => {
  try {
    const boardId = req.params.boardId || req.params.id;
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(400).json({ message: 'Invalid board ID' });
    }

    const board = await findUserBoard(boardId, getUserId(req));
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const cardId = req.body.cardId || req.body._id;

    // Targeted single-card move with numeric orderKey
    if (cardId) {
      const card = await Card.findOne({ _id: cardId, board: boardId });
      if (!card) return res.status(404).json({ message: 'Card not found' });

      const { unchanged, card: updatedCard } = await executeCardReorder({
        card,
        board,
        reqUser: req.user,
        targetColumnId: req.body.targetColumnId || req.body.list || card.columnId || card.list,
        sourceColumnId: req.body.sourceColumnId || card.columnId || card.list,
        previousCardId: req.body.previousCardId,
        nextCardId: req.body.nextCardId,
      });

      if (unchanged) {
        await card.populate('members createdBy', 'username email');
        return res.status(200).json({ message: 'Card position unchanged', card });
      }

      if (!updatedCard) {
        return res.status(409).json({ message: 'Concurrent reorder conflict. Please refresh the board and try again.' });
      }

      await updatedCard.populate('members createdBy', 'username email');
      return res.status(200).json({ message: 'Card position updated successfully', card: updatedCard });
    }

    // Backward compatibility: bulk update
    if (Array.isArray(req.body.cards)) {
      const bulkOps = req.body.cards.map((item) => ({
        updateOne: {
          filter: { _id: item._id, board: boardId },
          update: {
            $set: {
              ...(item.list ? { list: item.list, columnId: item.list } : {}),
              ...(Number.isFinite(item.orderKey) ? { orderKey: item.orderKey } : {}),
              ...(Number.isFinite(item.position) ? { position: item.position } : {}),
            },
          },
        },
      }));

      if (bulkOps.length > 0) {
        await Card.bulkWrite(bulkOps, { ordered: false });
      }
      return res.status(200).json({ message: 'Cards reordered successfully' });
    }

    return res.status(400).json({ message: 'cardId or cards array is required' });
  } catch (error) {
    console.error('Reorder cards error:', error);
    return res.status(500).json({ message: 'Error reordering cards', error: error.message });
  }
};

module.exports = {
  createCard,
  getBoardCards,
  updateCard,
  deleteCard,
  reorderCards,
  createColumn,
  deleteColumn,
  addComment,
  updateComment,
  deleteComment,
  uploadAttachment,
  deleteAttachment,
};

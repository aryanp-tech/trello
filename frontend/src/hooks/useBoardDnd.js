import { useRef, useState, useCallback, useEffect } from "react";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCenter,
  closestCorners,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";

// Helper: Resolve column ID from an 'over' target
const getColumnIdFromOver = (over, allCards = []) => {
  if (!over) return null;
  const overData = over.data?.current;

  if (overData?.type === "Card") {
    return overData.card?.columnId || overData.card?.list || null;
  }
  if (overData?.type === "Column") {
    return overData.column?.id || null;
  }

  const idStr = String(over.id);
  if (idStr.startsWith("col-cards-")) return idStr.replace("col-cards-", "");
  if (idStr.startsWith("col-")) return idStr.replace("col-", "");

  const matchedCard = allCards.find((c) => String(c._id) === idStr);
  if (matchedCard) return matchedCard.columnId || matchedCard.list;

  return idStr;
};

/**
 * Custom hook for board drag-and-drop (columns & cards).
 * Performance Highlights:
 * 1. Card-first precision collision detection (eliminates container vs card flicker/lag).
 * 2. Snappy 3px pointer activation constraint.
 * 3. Zero API calls while dragging/hovering.
 * 4. Safe state updates with cardsRef preventing stale closure re-renders.
 */
export const useBoardDnd = ({
  columns = [],
  cards = [],
  setCards,
  onReorderCards,
  onReorderColumns,
}) => {
  const [activeItem, setActiveItem] = useState(null);
  const dragStartRef = useRef(null);
  const cardsRef = useRef(cards);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columnIds = columns.map((col) => `col-${col.id}`);

  // Card-first collision detection:
  // - Columns only collide with column headers
  // - When dragging a card: prioritize card targets under pointer over column wrappers
  const collisionDetection = useCallback(
    (args) => {
      if (activeItem?.type === "Column") {
        return closestCorners({
          ...args,
          droppableContainers: args.droppableContainers.filter(
            (c) => String(c.id).startsWith("col-") && !String(c.id).startsWith("col-cards-")
          ),
        });
      }

      // Check all pointer collisions
      const pointerCollisions = pointerWithin(args);
      if (pointerCollisions.length > 0) {
        // Prioritize specific card item under pointer
        const cardCollisions = pointerCollisions.filter(
          (c) => !String(c.id).startsWith("col-")
        );
        if (cardCollisions.length > 0) {
          return cardCollisions;
        }

        // If not over any card, check column droppable container (col-cards-)
        const colCardCollisions = pointerCollisions.filter(
          (c) => String(c.id).startsWith("col-cards-")
        );
        if (colCardCollisions.length > 0) {
          return colCardCollisions;
        }

        return pointerCollisions;
      }

      // Fallback: closestCenter on card containers or column card droppables
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          (c) => !String(c.id).startsWith("col-") || String(c.id).startsWith("col-cards-")
        ),
      });
    },
    [activeItem]
  );

  // 1. Drag Start: store picked item & snapshot
  const handleDragStart = (event) => {
    const activeData = event.active.data?.current;
    if (!activeData) return;

    if (activeData.type === "Column") {
      setActiveItem({ type: "Column", column: activeData.column });
      dragStartRef.current = null;
    } else if (activeData.type === "Card") {
      const card = activeData.card;
      setActiveItem({ type: "Card", card });

      const sourceListId = card.columnId || card.list;
      const currentCards = cardsRef.current || cards;
      const colCards = currentCards.filter((c) => (c.columnId || c.list) === sourceListId);

      dragStartRef.current = {
        cardId: card._id,
        sourceList: sourceListId,
        sourceIndex: colCards.findIndex((c) => c._id === card._id),
        snapshot: currentCards,
      };
    }
  };

  // 2. Drag Over: update visual positions across columns in real-time
  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data?.current;
    if (activeData?.type !== "Card") return;

    const currentCards = cardsRef.current || cards;
    const overColumnId = getColumnIdFromOver(over, currentCards);
    if (!overColumnId) return;

    // Check if dragging within the SAME column
    const activeCard = currentCards.find((c) => c._id === active.id);
    const sourceList = activeCard?.columnId || activeCard?.list;
    if (sourceList === overColumnId) {
      // SortableContext handles same-column sorting via CSS transforms without state updates
      return;
    }

    setCards((prev) => {
      const activeIdx = prev.findIndex((c) => c._id === active.id);
      if (activeIdx === -1) return prev;

      const currentCard = prev[activeIdx];
      const curSourceList = currentCard.columnId || currentCard.list;
      if (curSourceList === overColumnId) return prev;

      // Cross-column movement:
      const overData = over.data?.current;
      const isOverCard = overData?.type === "Card";

      const updatedCard = {
        ...currentCard,
        list: overColumnId,
        columnId: overColumnId,
      };
      const remainingCards = prev.filter((c) => c._id !== active.id);

      let insertIdx;
      if (isOverCard) {
        const overCardIdx = remainingCards.findIndex((c) => c._id === over.id);
        if (overCardIdx !== -1) {
          const isBelow =
            over.rect &&
            active.rect?.current?.translated &&
            active.rect.current.translated.top > over.rect.top + over.rect.height / 2;
          insertIdx = isBelow ? overCardIdx + 1 : overCardIdx;
        } else {
          insertIdx = remainingCards.length;
        }
      } else {
        // Dropped over column container: place at end of that column
        const lastInCol = remainingCards.findLastIndex(
          (c) => (c.columnId || c.list) === overColumnId
        );
        insertIdx = lastInCol !== -1 ? lastInCol + 1 : remainingCards.length;
      }

      const safeIdx = Math.min(Math.max(0, insertIdx), remainingCards.length);
      const next = [...remainingCards];
      next.splice(safeIdx, 0, updatedCard);
      cardsRef.current = next;
      return next;
    });
  };

  // 3. Drag Cancel: restore pre-drag state with 0 API calls
  const handleDragCancel = () => {
    if (dragStartRef.current?.snapshot) {
      setCards(dragStartRef.current.snapshot);
      cardsRef.current = dragStartRef.current.snapshot;
    }
    dragStartRef.current = null;
    setActiveItem(null);
  };

  // 4. Drag End: commit changes only upon drop release
  const handleDragEnd = (event) => {
    const { active, over } = event;
    const dragStart = dragStartRef.current;
    const currentActive = activeItem;
    dragStartRef.current = null;
    setActiveItem(null);

    // Dropped outside a valid drop target
    if (!over) {
      if (dragStart?.snapshot) {
        setCards(dragStart.snapshot);
        cardsRef.current = dragStart.snapshot;
      }
      return;
    }

    // Column move
    if (currentActive?.type === "Column") {
      const fromId = currentActive.column.id;
      const toId =
        over.data?.current?.column?.id ||
        String(over.id).replace("col-cards-", "").replace("col-", "");

      if (fromId && toId && fromId !== toId) {
        const fromIdx = columns.findIndex((c) => c.id === fromId);
        const toIdx = columns.findIndex((c) => c.id === toId);

        if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
          const nextColumns = arrayMove(columns, fromIdx, toIdx);
          onReorderColumns?.({ columnId: fromId, newIndex: toIdx }, nextColumns);
        }
      }
      return;
    }

    // Card move
    if (currentActive?.type === "Card" && dragStart) {
      const currentCards = cardsRef.current || cards;
      const targetColumnId = getColumnIdFromOver(over, currentCards);
      if (!targetColumnId) {
        if (dragStart.snapshot) {
          setCards(dragStart.snapshot);
          cardsRef.current = dragStart.snapshot;
        }
        return;
      }

      const latestCards = cardsRef.current || cards;
      const activeIdx = latestCards.findIndex((c) => c._id === active.id);
      if (activeIdx === -1) return;

      let nextCards = [...latestCards];
      const activeCard = {
        ...nextCards[activeIdx],
        list: targetColumnId,
        columnId: targetColumnId,
      };
      const isOverCard = over.data?.current?.type === "Card";

      if (isOverCard && active.id !== over.id) {
        const overIdx = nextCards.findIndex((c) => c._id === over.id);
        if (overIdx !== -1) {
          nextCards[activeIdx] = activeCard;
          nextCards = arrayMove(nextCards, activeIdx, overIdx);
        }
      } else if (!isOverCard) {
        // Dropped on column container (not on a specific card):
        // Place at the bottom of target column
        const lastInCol = nextCards.findLastIndex(
          (c) => (c.columnId || c.list) === targetColumnId && c._id !== active.id
        );
        if (lastInCol !== -1 && activeIdx < lastInCol) {
          nextCards[activeIdx] = activeCard;
          nextCards = arrayMove(nextCards, activeIdx, lastInCol);
        } else {
          nextCards[activeIdx] = activeCard;
        }
      } else {
        nextCards[activeIdx] = activeCard;
      }

      // Calculate final position in target column
      const targetColCards = nextCards.filter(
        (c) => (c.columnId || c.list) === targetColumnId
      );
      const newPosition = targetColCards.findIndex((c) => c._id === active.id);

      const changedColumn = dragStart.sourceList !== targetColumnId;
      const changedPosition = dragStart.sourceIndex !== newPosition;

      // Same position in same column: restore pre-drag snapshot, no API calls
      if (!changedColumn && !changedPosition) {
        const snapshot = dragStart.snapshot || latestCards;
        cardsRef.current = snapshot;
        setCards(snapshot);
        return;
      }

      const previousCard =
        newPosition > 0 ? targetColCards[newPosition - 1] : null;
      const nextCard =
        newPosition < targetColCards.length - 1
          ? targetColCards[newPosition + 1]
          : null;

      cardsRef.current = nextCards;
      setCards(nextCards);

      // Trigger persistence with targeted orderKey information outside state updater
      onReorderCards?.(
        {
          cardId: activeCard._id,
          sourceColumnId: dragStart.sourceList,
          targetColumnId: targetColumnId,
          previousCardId: previousCard?._id || null,
          nextCardId: nextCard?._id || null,
          newPosition: Math.max(0, newPosition),
        },
        nextCards
      );
    }
  };

  return {
    sensors,
    activeItem,
    columnIds,
    collisionDetection,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
};

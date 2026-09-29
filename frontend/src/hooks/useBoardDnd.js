import { useRef, useState, useCallback } from "react";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  closestCorners,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";

// Helper: Resolve column ID from an 'over' target
const getColumnIdFromOver = (over, allCards = []) => {
  if (!over) return null;
  const overData = over.data?.current;

  if (overData?.type === "Card" && overData.card?.list) {
    return overData.card.list;
  }
  if (overData?.type === "Column" && overData.column?.id) {
    return overData.column.id;
  }

  const idStr = String(over.id);
  if (idStr.startsWith("col-cards-")) return idStr.replace("col-cards-", "");
  if (idStr.startsWith("col-")) return idStr.replace("col-", "");

  const matchedCard = allCards.find((c) => String(c._id) === idStr);
  if (matchedCard) return matchedCard.list;

  return idStr;
};

/**
 * Custom hook for board drag-and-drop (columns & cards).
 * Guarantees:
 * 1. Zero API calls while dragging/hovering.
 * 2. API triggers only on drop release when column or position actually changes.
 * 3. Restores state cleanly with 0 API calls if canceled or dropped in the same spot.
 * 4. Multi-container collision detection using pointer-first precision.
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columnIds = columns.map((col) => `col-${col.id}`);

  // Multi-container collision detection strategy:
  // - Columns only collide with column headers
  // - Cards prioritize pointer position, then bounding box, then closest corners
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

      const pointerCollisions = pointerWithin(args);
      if (pointerCollisions.length > 0) return pointerCollisions;

      const rectCollisions = rectIntersection(args);
      if (rectCollisions.length > 0) return rectCollisions;

      return closestCorners(args);
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

      const colCards = cards.filter((c) => c.list === card.list);
      dragStartRef.current = {
        cardId: card._id,
        sourceList: card.list,
        sourceIndex: colCards.findIndex((c) => c._id === card._id),
        snapshot: cards,
      };
    }
  };

  // 2. Drag Over: update visual positions across columns in real-time
  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data?.current;
    if (activeData?.type !== "Card") return;

    const overColumnId = getColumnIdFromOver(over, cards);
    if (!overColumnId) return;

    setCards((prev) => {
      const activeIdx = prev.findIndex((c) => c._id === active.id);
      if (activeIdx === -1) return prev;

      const currentCard = prev[activeIdx];
      const sourceList = currentCard.list;

      // When dragging within the SAME column, do not modify state in dragOver.
      // SortableContext handles same-column sorting visually without state mutation.
      if (sourceList === overColumnId) return prev;

      // Cross-column movement:
      const overData = over.data?.current;
      const isOverCard = overData?.type === "Card";

      const updatedCard = { ...currentCard, list: overColumnId };
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
        // Over column droppable container: place at end of that column
        const lastInCol = remainingCards.findLastIndex((c) => c.list === overColumnId);
        insertIdx = lastInCol !== -1 ? lastInCol + 1 : remainingCards.length;
      }

      const safeIdx = Math.min(Math.max(0, insertIdx), remainingCards.length);
      const next = [...remainingCards];
      next.splice(safeIdx, 0, updatedCard);
      return next;
    });
  };

  // 3. Drag Cancel: restore pre-drag state with 0 API calls
  const handleDragCancel = () => {
    if (dragStartRef.current?.snapshot) {
      setCards(dragStartRef.current.snapshot);
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
      if (dragStart?.snapshot) setCards(dragStart.snapshot);
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
      const targetColumnId = getColumnIdFromOver(over, cards);
      if (!targetColumnId) {
        if (dragStart.snapshot) setCards(dragStart.snapshot);
        return;
      }

      setCards((latestCards) => {
        const activeIdx = latestCards.findIndex((c) => c._id === active.id);
        if (activeIdx === -1) return latestCards;

        let nextCards = [...latestCards];
        const activeCard = { ...nextCards[activeIdx], list: targetColumnId };
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
            (c) => c.list === targetColumnId && c._id !== active.id
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
        const targetColCards = nextCards.filter((c) => c.list === targetColumnId);
        const newPosition = targetColCards.findIndex((c) => c._id === active.id);

        const changedColumn = dragStart.sourceList !== targetColumnId;
        const changedPosition = dragStart.sourceIndex !== newPosition;

        // Same position in same column: restore pre-drag snapshot, no API calls
        if (!changedColumn && !changedPosition) {
          return dragStart.snapshot || latestCards;
        }

        // Trigger persistence
        onReorderCards?.(
          {
            cardId: activeCard._id,
            sourceColumnId: dragStart.sourceList,
            targetColumnId: targetColumnId,
            newPosition: Math.max(0, newPosition),
          },
          nextCards
        );

        return nextCards;
      });
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

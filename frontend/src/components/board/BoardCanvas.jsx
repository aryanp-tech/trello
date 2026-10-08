import React, { useMemo } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useBoardPan } from "../../hooks/useBoardPan";
import { useBoardDnd } from "../../hooks/useBoardDnd";
import BoardColumn from "./BoardColumn";
import { CardOverlay, ColumnOverlay } from "./BoardOverlays";


const BoardCanvas = React.memo(({
  columns = [],
  cards = [],
  setCards,
  onReorderCards,
  onReorderColumns,
  onCardOpen,
  onRename,
  onDeleteColumn,
  onCreateCard,
  onAddColumn,
}) => {
  const {
    boardScrollRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useBoardPan();

  // All drag-and-drop state, sensors, and event handlers managed in separated hook
  const {
    sensors,
    activeItem,
    columnIds,
    collisionDetection,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useBoardDnd({
    columns,
    cards,
    setCards,
    onReorderCards,
    onReorderColumns,
  });

  // Group cards by column in a single O(N) pass for optimal rendering performance
  const columnCardsMap = useMemo(() => {
    const map = {};
    columns.forEach((col) => {
      map[col.id] = [];
    });
    cards.forEach((card) => {
      const colId = card.columnId || card.list;
      if (map[colId]) {
        map[colId].push(card);
      } else {
        map[colId] = [card];
      }
    });
    return map;
  }, [columns, cards]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        ref={boardScrollRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="board-scrollbar flex h-full cursor-grab items-start gap-3 overflow-x-auto pb-4 active:cursor-grabbing select-none"
      >
        <SortableContext
          items={columnIds}
          strategy={horizontalListSortingStrategy}
        >
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              cards={columnCardsMap[column.id] || []}
              onCardOpen={onCardOpen}
              onRename={onRename}
              onDelete={onDeleteColumn}
              onCreateCard={onCreateCard}
            />
          ))}
        </SortableContext>

        <button
          type="button"
          onClick={onAddColumn}
          className="h-12 w-72 shrink-0 rounded-xl border border-slate-200/90 bg-white/80 hover:bg-white text-slate-800 px-4 text-left text-sm font-semibold shadow-sm hover:shadow transition-all dark:border-transparent dark:bg-[#477fba] dark:hover:bg-[#5798d5] dark:text-white"
        >
          ＋ Add another list
        </button>
      </div>

      {/* Visual drag overlay preview with instantaneous zero-lag drop physics */}
      <DragOverlay dropAnimation={null}>
        {activeItem?.type === "Card" && (
          <CardOverlay card={activeItem.card} />
        )}
        {/* Whole column selected and picked with all its cards and full UI */}
        {activeItem?.type === "Column" && (
          <ColumnOverlay
            column={activeItem.column}
            cards={columnCardsMap[activeItem.column.id] || []}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
});

export default BoardCanvas;

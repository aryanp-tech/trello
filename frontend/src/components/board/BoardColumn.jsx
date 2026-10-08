import React, { useState, useRef, useEffect, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SortableCardItem from "./SortableCardItem";

const BoardColumn = React.memo(({
  column,
  cards = [],
  onCardOpen,
  onRename,
  onDelete,
  onCreateCard,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `col-${column.id}`,
    data: {
      type: "Column",
      column,
    },
  });

  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: `col-cards-${column.id}`,
    data: {
      type: "Column",
      column,
    },
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close options menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${column.label}" and all cards inside it?`)) {
      onDelete(column);
    }
  };

  const cardIds = useMemo(() => cards.map((card) => card._id), [cards]);

  return (
    <section
      ref={setNodeRef}
      style={style}
      className="w-72 shrink-0 self-start flex flex-col max-h-[calc(100vh-130px)] rounded-xl border border-slate-200/90 bg-[#ebecf0] dark:border-[#33353a] dark:bg-[#101214] p-2 shadow-sm"
    >
      {/* Column Header with drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="shrink-0 flex cursor-grab items-center justify-between gap-2 rounded-md px-3 py-2 active:cursor-grabbing select-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRename(column);
          }}
          className="font-semibold text-slate-800 dark:text-[#dcdfe4] hover:text-blue-600 dark:hover:text-[#65a6ff] text-left truncate text-sm"
        >
          {column.label}
        </button>
        <div
          ref={menuRef}
          className="relative flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-sm font-medium text-slate-500 dark:text-[#9fadbc]">{cards.length}</span>
          <button
            type="button"
            className="rounded p-1 text-base leading-none text-slate-500 hover:bg-slate-300/60 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer"
            aria-label={`Options for ${column.label}`}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-10 w-36 rounded-md border border-slate-200 bg-white dark:border-[#454548] dark:bg-[#2b2b2e] p-1 shadow-xl animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  handleDelete();
                }}
                className="block w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-200 dark:hover:bg-[#3b3b3e]"
              >
                Delete list
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards List with SortableContext */}
      <SortableContext
        items={cardIds}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setDroppableNodeRef}
          className={`column-scrollbar flex-1 min-h-[48px] overflow-y-auto overflow-x-hidden space-y-2 py-1 pr-1 rounded-lg transition-colors ${
            isOver ? "bg-black/5 dark:bg-white/5" : ""
          }`}
        >
          {cards.map((card) => (
            <SortableCardItem
              key={card._id}
              card={card}
              onCardOpen={onCardOpen}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add a card button */}
      <button
        type="button"
        onClick={() => onCreateCard(column.id)}
        className="shrink-0 mt-1 flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-300/60 hover:text-slate-900 dark:text-[#9fadbc] dark:hover:bg-white/10 dark:hover:text-[#dcdfe4] transition-colors text-left"
      >
        <span className="text-base leading-none">＋</span> Add a card
      </button>
    </section>
  );
});

export default BoardColumn;

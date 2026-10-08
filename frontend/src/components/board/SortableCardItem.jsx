import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getCardDetailsSummary } from "../card/cardUtils";
import CardBadges from "./CardBadges";

// Individual sortable card item within a column
export const SortableCardItem = React.memo(({ card, onCardOpen }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card._id,
    data: {
      type: "Card",
      card,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.2 : 1,
  };

  const { coverImageUrl, coverVideoUrl, commentsCount, attachmentsCount } =
    getCardDetailsSummary(card);

  const members = card.members || [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onCardOpen(card)}
      className="group relative block w-full cursor-grab rounded-lg border border-slate-200 bg-white dark:border-[#383d47]/70 dark:bg-[#22272b] text-left text-sm hover:border-slate-300 dark:hover:border-white/20 active:cursor-grabbing shadow-sm hover:shadow select-none overflow-hidden transition-colors"
    >
      {/* Card Cover Image or Video */}
      {coverImageUrl ? (
        <div className="w-full max-h-44 overflow-hidden bg-black/5 dark:bg-black/30 border-b border-slate-100 dark:border-white/5">
          <img
            src={coverImageUrl}
            alt={card.title || "Card cover"}
            className="w-full h-36 sm:h-40 object-cover object-center block pointer-events-none"
            loading="lazy"
          />
        </div>
      ) : coverVideoUrl ? (
        <div className="relative w-full max-h-44 overflow-hidden bg-black border-b border-slate-100 dark:border-white/5 flex items-center justify-center">
          <video
            src={coverVideoUrl}
            preload="metadata"
            muted
            playsInline
            className="w-full h-36 sm:h-40 object-cover object-center block pointer-events-none opacity-85"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <span className="rounded-full bg-black/60 p-2 text-white shadow-md">
              <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </div>
          <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white tracking-wider">
            VIDEO
          </span>
        </div>
      ) : null}

      {/* Card Info Section */}
      <div className="p-2.5 flex flex-col gap-1.5">
        <div className="text-base font-bold text-slate-900 dark:text-white break-words leading-tight tracking-tight">
          {card.title}
        </div>

        {/* Badges: Comments Count, Attachments Count & Assigned Member Avatars */}
        <CardBadges
          commentsCount={commentsCount}
          attachmentsCount={attachmentsCount}
          members={members}
        />
      </div>
    </div>
  );
});

export default SortableCardItem;

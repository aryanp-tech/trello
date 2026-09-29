import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getCardDetailsSummary } from "../card/cardUtils";
import CardBadges from "./CardBadges";

// Individual sortable card item within a column
export const SortableCardItem = ({ card, onCardOpen }) => {
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
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.25 : 1,
  };

  const { coverImageUrl, commentsCount, attachmentsCount } =
    getCardDetailsSummary(card);

  const members = card.members || [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onCardOpen(card)}
      className="group relative block w-full cursor-grab rounded-lg border border-slate-200 bg-white dark:border-[#383d47]/70 dark:bg-[#22272b] text-left text-sm hover:border-slate-300 dark:hover:border-white/20 active:cursor-grabbing transition-all duration-150 shadow-sm hover:shadow select-none overflow-hidden"
    >
      {/* Card Cover Image */}
      {coverImageUrl && (
        <div className="w-full max-h-44 overflow-hidden bg-black/5 dark:bg-black/30 border-b border-slate-100 dark:border-white/5">
          <img
            src={coverImageUrl}
            alt={card.title || "Card cover"}
            className="w-full h-36 sm:h-40 object-cover object-center block pointer-events-none"
            loading="lazy"
          />
        </div>
      )}

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
};

export default SortableCardItem;

// Drag overlay preview for a single card
export const CardOverlay = ({ card }) => {
  if (!card) return null;
  return (
    <div className="w-72 rounded-lg border-2 border-blue-500 bg-white dark:bg-[#303237] px-3 py-2.5 text-left text-sm shadow-2xl rotate-2 select-none pointer-events-none ring-4 ring-blue-500/25">

      <div className="text-base font-bold text-slate-900 dark:text-white break-words tracking-tight">
        {card.title}
      </div>

      {((card.attachments && card.attachments.length > 0) ||
        card.attachment?.url ||
        (card.comments && card.comments.length > 0))
        && (
          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 dark:text-white/50 border-t border-slate-100 dark:border-white/10 pt-1.5">
            {((card.attachments && card.attachments.length > 0) ||
              card.attachment?.url) && (
                <span className="flex items-center gap-1">
                  <span>📎</span>
                  <span>{card.attachments?.length || 1}</span>
                </span>
              )}

            {card.comments && card.comments.length > 0
              && (
                <span className="flex items-center gap-1">
                  <span>💬</span>
                  <span>{card.comments.length}</span>
                </span>
              )}
          </div>
        )}
    </div>
  );
};

// Drag overlay preview for whole column with all its cards
export const ColumnOverlay = ({ column, cards = [] }) => {
  if (!column) return null;
  return (
    <div className="w-72 shrink-0 self-start rounded-xl border-2 border-blue-500 bg-[#ebecf0] dark:bg-[#191a1d] p-2 shadow-2xl rotate-1 opacity-95 select-none pointer-events-none ring-4 ring-blue-500/25">
      {/* Full column header */}
      <div className="flex items-center justify-between gap-2 rounded-md px-3 py-2 bg-white/80 dark:bg-[#22242a] shadow-sm">
        <span className="font-semibold text-slate-900 dark:text-white truncate">
          {column.label}
        </span>
        <span className="text-sm text-slate-500 dark:text-white/70">{cards.length}</span>
      </div>

      {/* Cards inside the column */}
      <div className="space-y-2 py-2 max-h-[60vh] overflow-hidden">
        {cards.map((card) => (
          <div
            key={card._id}
            className="block w-full rounded-md border border-slate-200 bg-white dark:border-[#3b3d42] dark:bg-[#303237] px-3 py-2.5 text-left text-sm text-slate-900 dark:text-white shadow-sm"
          >
            <div className="text-base font-bold text-slate-900 dark:text-white break-words tracking-tight">
              {card.title}
            </div>
            {((card.attachments && card.attachments.length > 0) ||
              card.attachment?.url ||
              (card.comments && card.comments.length > 0)) && (
                <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 dark:text-white/50 border-t border-slate-100 dark:border-white/5 pt-1.5">
                  {((card.attachments && card.attachments.length > 0) ||
                    card.attachment?.url) && (
                      <span className="flex items-center gap-1">
                        <span>📎</span>
                        <span>{card.attachments?.length || 1}</span>
                      </span>
                    )}
                  {card.comments && card.comments.length > 0 && (
                    <span className="flex items-center gap-1">
                      <span>💬</span>
                      <span>{card.comments.length}</span>
                    </span>
                  )}
                </div>
              )}
          </div>
        ))}
      </div>

      <div className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-500 dark:text-white/60">
        ＋ Add a card
      </div>
    </div>
  );
};

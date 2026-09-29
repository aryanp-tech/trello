import { forwardRef } from "react";

const CardMentionDropdown = forwardRef(({
  mentionQuery,
  cardMembers = [],
  filteredMembers = [],
  selectedIndex,
  onSelectMember,
}, ref) => {
  if (mentionQuery === null) return null;

  return (
    <div
      ref={ref}
      className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-[#3b424e] dark:bg-[#1a1d22]"
    >
      <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 dark:text-white/50 uppercase tracking-wider border-b border-slate-100 dark:border-white/10 mb-1">
        Card Members
      </div>
      {filteredMembers.length === 0 ? (
        <div className="px-2 py-2 text-xs text-slate-400 dark:text-white/40 italic">
          {cardMembers.length === 0
            ? "No other members on this card"
            : "No matching card members"}
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {filteredMembers.map((member, index) => {
            const isSelected = index === selectedIndex;
            const name = member.username || member.email || "Member";
            const initials = name.slice(0, 2).toUpperCase();
            return (
              <button
                key={member._id || index}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectMember(member);
                }}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition ${
                  isSelected
                    ? "bg-blue-600 text-white font-medium"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
                }`}
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/20 text-[10px] font-bold dark:text-blue-300 uppercase">
                  {initials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate font-medium">{name}</span>
                  {member.email && member.username && (
                    <span className="truncate text-[10px] text-slate-400 dark:opacity-60">
                      {member.email}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

CardMentionDropdown.displayName = "CardMentionDropdown";

export default CardMentionDropdown;

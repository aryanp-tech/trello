import { useEffect, useRef } from "react";

const CardMembersBar = ({
  card,
  boardMembers = [],
  onToggleMember,
  canManageMembers = false,
  showDropdown,
  setShowDropdown,
  inviteEmail,
  setInviteEmail,
  inviting,
  inviteStatus,
  handleInviteNewMember,
}) => {
  const memberDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showDropdown &&
        memberDropdownRef.current &&
        !memberDropdownRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown, setShowDropdown]);

  const isMemberAssigned = (memberId) => {
    return (card.members || []).some((m) => String(m?._id || m) === String(memberId));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/60">
        Members
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {(card.members || []).map((m, idx) => {
          const memberObj =
            typeof m === "object" && m !== null
              ? m
              : boardMembers.find((b) => String(b._id) === String(m)) || {
                  _id: m,
                  username: "Member",
                };
          const name = memberObj.username || memberObj.email || "Member";
          const initials = name.slice(0, 2).toUpperCase();
          const cardOwnerId = String(card.createdBy?._id || card.createdBy || "");
          const isOwner = cardOwnerId && String(memberObj._id) === cardOwnerId;

          return (
            <div
              key={memberObj._id || idx}
              className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs text-blue-800 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-200 transition"
              title={isOwner ? `${name} (Owner)` : name}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white uppercase">
                {initials}
              </div>
              <span className="font-medium text-sm">{name}</span>
              {isOwner && (
                <span className="rounded bg-blue-100 text-blue-700 px-1 py-0.2 text-[9px] font-semibold dark:bg-blue-500/30 dark:text-blue-300 uppercase">
                  Owner
                </span>
              )}
              {canManageMembers && onToggleMember && !isOwner && (
                <button
                  type="button"
                  onClick={() => onToggleMember(memberObj._id)}
                  className="ml-0.5 text-blue-600 hover:text-blue-900 dark:text-blue-300 dark:hover:text-white font-bold"
                  title="Remove member"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}

        {/* Single Blue Invite Button with unified dropdown - ONLY VISIBLE TO OWNER */}
        {canManageMembers && (
          <div ref={memberDropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500 transition shadow-sm"
            title="Invite or assign members to card"
          >
            <span>+</span>
            <span>Invite</span>
          </button>

          {showDropdown && (
            <div className="absolute left-0 top-full mt-1.5 z-50 w-72 sm:w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-[#3b424e] dark:bg-[#1a1d22] animate-in fade-in zoom-in-95 duration-100">
              <div className="mb-2.5 flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-2">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Members & Invites
                </span>
                <button
                  type="button"
                  onClick={() => setShowDropdown(false)}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white transition text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Section 1: Board Members Toggle */}
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/60">
                Assign Board Members
              </div>
              {boardMembers.length === 0 ? (
                <div className="px-1 py-2 text-xs text-slate-400 dark:text-white/40 text-center">
                  No members on this board
                </div>
              ) : (
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-0.5 mb-3">
                  {boardMembers.map((bm) => {
                    const cardOwnerId = String(card.createdBy?._id || card.createdBy || "");
                    const isOwner = cardOwnerId && String(bm._id) === cardOwnerId;
                    const assigned = isOwner || isMemberAssigned(bm._id);
                    return (
                      <button
                        key={bm._id}
                        type="button"
                        disabled={isOwner}
                        onClick={() => {
                          if (!isOwner) onToggleMember?.(bm._id);
                        }}
                        className={`flex items-center justify-between rounded px-2 py-1.5 text-left text-xs transition ${
                          isOwner
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-600/30 dark:text-blue-200 font-semibold cursor-default"
                            : assigned
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-600/20 dark:text-blue-300 font-medium"
                              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-[#2d333b] text-[10px] font-bold dark:text-white uppercase">
                            {(bm.username || bm.email || "M").slice(0, 2)}
                          </span>
                          <span className="truncate">{bm.username || bm.email}</span>
                          {isOwner && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-300 font-normal">
                              (Owner)
                            </span>
                          )}
                        </div>
                        {assigned && <span className="text-blue-600 dark:text-blue-400 font-bold ml-1">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Section 2: Invite by Email */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-[#373c44]">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/60">
                  Invite New Member
                </div>
                <p className="mb-2 text-[11px] leading-relaxed text-slate-400 dark:text-white/50">
                  Send an email invite to collaborate directly on this card.
                </p>
                <form onSubmit={handleInviteNewMember} className="flex flex-col gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none dark:border-[#3b424e] dark:bg-[#121417] dark:text-white dark:placeholder-white/40 transition"
                  />
                  <div className="flex items-center justify-end gap-2 pt-0.5">
                    <button
                      type="submit"
                      disabled={inviting || !inviteEmail.trim()}
                      className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                    >
                      {inviting ? "Sending..." : "Send Invite"}
                    </button>
                  </div>
                  {inviteStatus && (
                    <div
                      className={`rounded px-2 py-1 text-[11px] font-medium ${
                        inviteStatus.type === "success"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50"
                          : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/50"
                      }`}
                    >
                      {inviteStatus.message}
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default CardMembersBar;

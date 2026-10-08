import { useState, useRef, useEffect, useMemo } from "react";

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-violet-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-indigo-600",
  "bg-teal-600",
  "bg-pink-600",
];

const getAvatarColor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getInitials = (name = "") => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const BoardMembersBar = ({ board, currentUser, onInvite, onRemoveMember }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Check if current user is the board owner
  const ownerId = board?.createdBy
    ? typeof board.createdBy === "object"
      ? String(board.createdBy._id)
      : String(board.createdBy)
    : "";
  const currentUserId = String(currentUser?._id || currentUser?.id || "");
  const isOwner = Boolean(ownerId && currentUserId && ownerId === currentUserId);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Aggregate and deduplicate all members working on this board
  const membersList = useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. Board Creator / Owner
    const owner = board?.createdBy;
    if (owner) {
     
      const ownerId = typeof owner === "object" ? String(owner._id) : String(owner);
     
      const isCurrent =
        String(currentUser?._id || currentUser?.id) === ownerId;
     
        const username =
        (typeof owner === "object" ? owner.username : null) ||
        (isCurrent ? currentUser?.username : null) ||
        "Owner";
     
        const email =
        (typeof owner === "object" ? owner.email : null) ||
        (isCurrent ? currentUser?.email : null) ||
        "";

      seen.add(ownerId);
      list.push({
        _id: ownerId,
        username,
        email,
        isOwner: true,
        isCurrent,
      });
    }

    // 2. Board Members
    (board?.members || []).forEach((m) => {
      const mId = typeof m === "object" ? String(m._id) : String(m);
      if (!seen.has(mId)) {
        seen.add(mId);

        const isCurrent =
          String(currentUser?._id || currentUser?.id) === mId;

        const username =
          (typeof m === "object" ? m.username : null) ||
          (isCurrent ? currentUser?.username : null) ||
          "Member";
          
        const email =
          (typeof m === "object" ? m.email : null) ||
          (isCurrent ? currentUser?.email : null) ||
          "";
            
        list.push({
          _id: mId,
          username,
          email,
          isOwner: false,
          isCurrent,
        });
      }
    });

    return list;
  }, [board?.createdBy, board?.members, currentUser]);

  const maxVisibleAvatars = 4;
  const visibleMembers = membersList.slice(0, maxVisibleAvatars);
  const remainingCount = membersList.length - maxVisibleAvatars;

  return (
    <div className=" inline-flex items-center z-999" ref={dropdownRef}>
      {/* Combined Button: Avatars Preview + Member Count + Invite Action */}
      <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm gap-1 dark:border-white/10 dark:bg-[#25282e] transition-colors">
        {/* Left part: Avatars + count (click to view all members) */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-100 dark:hover:bg-white/5 transition text-xs text-slate-700 dark:text-white group"
          title="View all people working on this board"
          aria-expanded={isOpen}
        >
          {/* Overlapping Avatar Stack */}
          <div className="flex -space-x-2 overflow-hidden items-center">
            {visibleMembers.map((member) => (
              <div
                key={member._id}
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#25282e] shrink-0 ${getAvatarColor(
                  member.username
                )}`}
                title={`${member.username}${member.isOwner ? " (Owner)" : ""}`}
              >
                {getInitials(member.username)}
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-white text-[10px] font-bold ring-2 ring-white dark:ring-[#25282e] shrink-0">
                +{remainingCount}
              </div>
            )}
          </div>

          <span className="font-semibold text-slate-700 group-hover:text-slate-900 dark:text-slate-200 dark:group-hover:text-white">
            {membersList.length}
          </span>
          <span className="text-[10px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200">▾</span>
        </button>

        {/* Right part: Combined Invite Button (Owner only) */}
        {isOwner && onInvite && (
          <>
            <div className="h-4 w-px bg-slate-200 dark:bg-white/15" />
            <button
              type="button"
              onClick={onInvite}
              className="flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-500 px-2.5 py-1 text-xs font-semibold text-white transition shadow"
              title="Invite someone to this board"
            >
              <span>＋</span>
              <span>Invite</span>
            </button>
          </>
        )}
      </div>

      {/* Dropdown Menu showing all members */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xl dark:border-[#3b3d43] dark:bg-[#222428] animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Board Members</span>
              <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 dark:border-transparent dark:bg-blue-600/30 dark:text-blue-400 px-2 py-0.5 text-xs font-semibold">
                {membersList.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 text-sm leading-none"
              aria-label="Close members dropdown"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            People with access to collaborate on this board:
          </p>

          {/* Members List */}
          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
            {membersList.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${getAvatarColor(
                      member.username
                    )}`}
                  >
                    {getInitials(member.username)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {member.username}
                      </span>
                      {member.isCurrent && (
                        <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                          (You)
                        </span>
                      )}
                    </div>
                    {member.email && (
                      <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {member.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Role Badge & Owner Remove Action */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {member.isOwner ? (
                    <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400">
                      Owner
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 px-2 py-0.5 text-[11px] font-medium dark:border-transparent dark:bg-slate-700/60 dark:text-slate-300">
                      Member
                    </span>
                  )}

                  {/* Remove button: only visible to board owner for non-owner members */}
                  {isOwner && !member.isOwner && onRemoveMember && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Remove "${member.username}" from this board?`)) {
                          onRemoveMember(member._id);
                        }
                      }}
                      className="rounded p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition text-xs leading-none"
                      title={`Remove ${member.username} from board`}
                      aria-label={`Remove ${member.username}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardMembersBar;

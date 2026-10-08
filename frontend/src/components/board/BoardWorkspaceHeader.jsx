import React, { useState, useRef, useEffect } from "react";
import BoardMembersBar from "./BoardMembersBar";
import ThemeToggle from "../common/ThemeToggle";

const BoardWorkspaceHeader = React.memo(({
  board,
  user,
  onBack,
  onProfile,
  onMembers,
  onRemoveMember,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!profileOpen) return;

    const handlePointerDown = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

  return (
    <div className="relative z-20 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur-md dark:border-[#34363a] dark:bg-[#202225] transition-colors">
      {/* Top Left: Back, Profile Toggle, and Board Title */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100 hover:text-slate-900 dark:border-transparent dark:bg-[#303338] dark:text-white/80 dark:hover:bg-[#3b3e44] transition"
        >
          Back
        </button>

        {/* Profile Toggle Menu */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c45aa9] text-sm font-bold text-white shadow hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-purple-400"
            aria-label="Open profile toggle"
            aria-expanded={profileOpen}
          >
            {user?.username?.charAt(0)?.toUpperCase() || "U"}
          </button>

          {profileOpen && (
            <div className="absolute left-0 mt-2 z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-[#3b3d43] dark:bg-[#222428] animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center gap-3 pb-3 mb-2 border-b border-slate-100 dark:border-white/10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c45aa9] text-base font-bold text-white shadow">
                  {user?.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {user?.username || "User"}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {user?.email || ""}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onProfile?.();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10 transition text-left"
                >
                  <span>👤</span>
                  <span>View Account Profile</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <h1 className="truncate text-xl font-bold text-slate-900 dark:text-white max-w-[200px] sm:max-w-xs md:max-w-md">
          {board.title}
        </h1>
      </div>

      {/* Top Right: Theme Toggle & Combined Members & Invite button */}
      <div className="flex items-center gap-2.5">
        <ThemeToggle />
        <BoardMembersBar
          board={board}
          currentUser={user}
          onInvite={onMembers}
          onRemoveMember={onRemoveMember}
        />
      </div>
    </div>
  );
});

export default BoardWorkspaceHeader;

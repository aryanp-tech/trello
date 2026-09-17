const BoardWorkspaceHeader = ({
  board,
  user,
  onBack,
  onProfile,
  onMembers,
}) => {

  //board workspace header component that displays the board title, user profile button, and members button
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#34363a] bg-[#202225] px-3 py-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md bg-[#303338] px-3 py-2 text-sm text-white/80 hover:bg-[#3b3e44]"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onProfile}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c45aa9] text-sm font-bold"
          aria-label="Open profile"
        >
          {user?.username?.charAt(0)?.toUpperCase() || "U"}
        </button>
      </div>

      <h1 className="truncate text-xl font-bold">{board.title}</h1>

      <button
        type="button"
        onClick={onMembers}
        className="flex items-center gap-2 rounded-md bg-[#363941] px-3 py-2 text-sm font-semibold text-white/90 hover:bg-[#444750]"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span>{board.members?.length || 1}</span>
        <span className="hidden sm:inline">Members</span>
      </button>
    </div>
  );
};

export default BoardWorkspaceHeader;

import defaultBoardBg from "../../assets/Board_workspace_BG.png";

const BoardCard = ({
  board,
  menuOpen,
  onOpen,
  onMenuToggle,
  onEdit,
  onDelete,
}) => {
  const style = {
    backgroundImage: `url(${board.backgroundImage || defaultBoardBg})`,
  };

  return (
    <article className="group relative overflow-visible rounded-lg border border-slate-200 bg-white shadow-sm transition-colors dark:border-white/10 dark:bg-white/[0.03] dark:backdrop-blur-sm">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="h-24 rounded-t-lg bg-cover bg-center" style={style} />
      </button>

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-white/10 dark:bg-black/20">
        <button
          type="button"
          onClick={onOpen}
          className="truncate text-left text-sm font-medium text-slate-800 dark:text-[#d8d8dc] flex-1 hover:underline"
        >
          {board.title}
        </button>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={onMenuToggle}
            className="rounded p-1 text-lg leading-none text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:text-[#aaaab0] dark:hover:bg-[#3b3b3e] dark:hover:text-white"
            aria-label={`Options for ${board.title}`}
          >
            ⋯
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 z-10 w-28 rounded-md border border-slate-200 bg-white p-1 shadow-xl dark:border-[#454548] dark:bg-[#2b2b2e]">
              <button
                type="button"
                onClick={onEdit}
                className="block w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-[#dedee3] dark:hover:bg-[#3b3b3e]"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={onDelete}
                className="block w-full rounded px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:text-[#ff9da5] dark:hover:bg-[#3b3b3e]"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default BoardCard;

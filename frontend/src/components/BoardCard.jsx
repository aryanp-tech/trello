const BoardCard = ({
  board,
  menuOpen,
  onOpen,
  onMenuToggle,
  onEdit,
  onDelete,
}) => {
  const style = {
    backgroundColor: "transparent",
    backgroundImage: board.backgroundImage
      ? `url(${board.backgroundImage})`
      : "linear-gradient(135deg, #20252b 0%, #334155 52%, #1f766d 100%)",
  };


  //main individual card for each board
  //also give edit and delete options for each board
  return (
    <article className="group relative overflow-visible rounded-lg border border-white/10 bg-white/[0.03] shadow-sm backdrop-blur-sm">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="h-24 rounded-t-lg bg-cover bg-center" style={style} />
        <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-black/20 px-3 py-3">
          <h2 className="truncate text-sm font-medium text-[#d8d8dc]">
            {board.title}
          </h2>
        </div>
      </button>
      <div className="relative">
        <button
          type="button"
          onClick={onMenuToggle}
          className="rounded p-1 text-lg leading-none text-[#aaaab0] hover:bg-[#3b3b3e] hover:text-white"
          aria-label={`Options for ${board.title}`}
        >
          ⋯
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 z-10 w-28 rounded-md border border-[#454548] bg-[#2b2b2e] p-1 shadow-xl">
            <button
              type="button"
              onClick={onEdit}
              className="block w-full rounded px-3 py-2 text-left text-sm text-[#dedee3] hover:bg-[#3b3b3e]"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="block w-full rounded px-3 py-2 text-left text-sm text-[#ff9da5] hover:bg-[#3b3b3e]"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

export default BoardCard;

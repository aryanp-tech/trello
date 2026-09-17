const BoardColumn = ({
  column,
  cards,
  onCardOpen,
  onCardDragStart,
  onCardDragEnd,
  onDrop,
  onRename,
  onDelete,
  onCreateCard,
}) => {
  const handleDelete = () => {
    if (window.confirm(`Delete "${column.label}" and all cards inside it?`)) {
      onDelete(column)
    }
  }

  // The BoardColumn component represents a single column in the board
  //map for each card in the column and display them as buttons
  return (
    <section
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDrop(column.id)}
      className="w-72 shrink-0 self-start rounded-xl border border-[#33353a] bg-[#191a1d] p-2"
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => onRename(column)}
          className="font-semibold hover:text-[#65a6ff]"
        >
          {column.label}
        </button>
        <div className="relative flex items-center gap-1">
          <span className="text-sm text-white/70">{cards.length}</span>
          <details className="group">
            <summary className="list-none rounded p-1 text-lg leading-none text-white/60 hover:bg-white/10 hover:text-white" aria-label={`Options for ${column.label}`}>⋯</summary>
            <div className="absolute right-0 top-8 z-10 w-36 rounded-md border border-[#454548] bg-[#2b2b2e] p-1 shadow-xl">
              <button type="button" onClick={handleDelete} className="block w-full rounded px-3 py-2 text-left text-sm text-red-200 hover:bg-[#3b3b3e]">Delete list</button>
            </div>
          </details>
        </div>
      </div>
      <div className="space-y-2">
        {cards.map((card) => (
          <button
            key={card._id}
            type="button"
            draggable
            onDragStart={() => onCardDragStart(card)}
            onDragEnd={onCardDragEnd}
            onClick={() => onCardOpen(card)}
            className="block w-full cursor-grab rounded-md border border-[#3b3d42] bg-[#303237] px-3 py-3 text-left text-sm hover:bg-[#3a3c42] active:cursor-grabbing"
          >
            {card.title}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onCreateCard}
        className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-white/75 hover:bg-white/10"
      >
        ＋ Add a card
      </button>
    </section>
  );
};

export default BoardColumn;

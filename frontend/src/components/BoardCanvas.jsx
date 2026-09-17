import { useBoardPan } from "../hooks/useBoardPan";
import BoardColumn from "./BoardColumn";

const BoardCanvas = ({
  columns,
  cards,
  onCardOpen,
  onCardDragStart,
  onCardDragEnd,
  onDrop,
  onRename,
  onDeleteColumn,
  onCreateCard,
  onAddColumn,
}) => {
  const {
    boardScrollRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useBoardPan();

  return (
// The main canvas for the board, allowing horizontal scrolling and panning

    <div
      ref={boardScrollRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="board-scrollbar flex min-h-[calc(100vh-160px)] cursor-grab items-start gap-3 overflow-x-auto pb-0 active:cursor-grabbing"
    >
        {/* // Rendering each column in the board and passing necessary props for card management */}
      {columns.map((column) => (
        <BoardColumn
          key={column.id}
          column={column}
          cards={cards.filter((card) => card.list === column.id)}
          onCardOpen={onCardOpen}
          onCardDragStart={onCardDragStart}
          onCardDragEnd={onCardDragEnd}
          onDrop={onDrop}
          onRename={onRename}
          onDelete={onDeleteColumn}
          onCreateCard={onCreateCard}
        />
      ))}
      <button
        type="button"
        onClick={onAddColumn}
        className="h-12 w-72 shrink-0 rounded-xl bg-[#477fba] px-4 text-left text-sm font-semibold text-white hover:bg-[#5798d5]"
      >
        ＋ Add another list
      </button>
    </div>
  );
};

export default BoardCanvas;

const BoardFormModal = ({
  editingBoard,
  title,
  saving,
  onTitleChange,
  onSubmit,
  onClose,
}) => {

  // editing name of board or deleting the board, with use of 3 dots menu 
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-lg bg-[#2b2b2e] p-5 shadow-2xl"
      >
        <h2 className="mb-4 text-lg font-semibold text-white">
          {editingBoard ? "Update board" : "Create board"}
        </h2>

        <input
          autoFocus
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Board title"
          className="w-full rounded-md border border-[#55555a] bg-[#202022] px-3 py-2 text-sm text-white outline-none focus:border-[#5798f5]"
          maxLength={80}
          required
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm text-[#c2c2c6] hover:bg-[#3b3b3e]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="rounded-md bg-[#5798f5] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BoardFormModal;

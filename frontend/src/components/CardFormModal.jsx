const CardFormModal = ({
  editingCard,
  title,
  description,
  saving,
  onTitleChange,
  onDescriptionChange,
  onFileChange,
  onSubmit,
  onClose,
}) => {

  //create new card or edit existing card, with title, description, and optional file attachmentx 
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg rounded-xl bg-[#28292c] p-5 shadow-2xl"
      >
        <h2 className="mb-4 text-lg font-semibold">
          {editingCard ? "Edit card" : "Create card"}
        </h2>

        {/* // Input fields for card title, description, and file attachment */}
        <input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Card title"
          className="mb-3 w-full rounded-md bg-[#17181a] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          required
        />
        <textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="Description"
          rows="5"
          className="mb-3 w-full resize-y rounded-md bg-[#17181a] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="file"
          onChange={(event) => onFileChange(event.target.files?.[0] || null)}
          className="mb-5 w-full text-sm text-white/80 file:mr-3 file:rounded-md file:border-0 file:bg-white/15 file:px-3 file:py-2 file:text-white"
        />

        {/* // Buttons for canceling or submitting the form */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm text-white/75 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : editingCard
                ? "Save changes"
                : "Create card"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CardFormModal;

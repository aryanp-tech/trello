import { useEffect } from "react";

const AddColumnModal = ({
  columnName,
  onColumnNameChange,
  onSubmit,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // creating new card taking one inputs title
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-[#3a3c42] dark:bg-[#202225] text-slate-800 dark:text-white transition-colors"
      >
        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Add column</h2>
        <input
          autoFocus
          value={columnName}
          onChange={(event) => onColumnNameChange(event.target.value)}
          placeholder="Column name"
          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 dark:border-transparent dark:bg-[#303237] dark:text-white dark:focus:ring-blue-400"
          required
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-white/75 dark:hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition"
          >
            Add column
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddColumnModal;

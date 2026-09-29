import { useEffect } from "react";
import CardListField from "./card/CardListField";

const CardFormModal = ({
  title,
  description,
  list = "",
  saving,
  onTitleChange,
  onDescriptionChange,
  onListChange,
  onFileChange,
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#3a3c42] dark:bg-[#28292c] text-slate-800 dark:text-white transition-colors"
      >
        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Create card</h2>

        {/* Card title */}
        <input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Card title"
          className="mb-3 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 dark:border-transparent dark:bg-[#17181a] dark:text-white dark:focus:ring-blue-400"
          required
        />

        {/* List / Status Field */}
        <CardListField
          list={list}
          onListChange={onListChange}
        />

        {/* Description */}
        <textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="Description"
          rows="4"
          className="mb-3 w-full resize-y rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 dark:border-transparent dark:bg-[#17181a] dark:text-white dark:focus:ring-blue-400"
        />

        {/* File attachment */}
        <input
          type="file"
          onChange={(event) => onFileChange(event.target.files?.[0] || null)}
          className="mb-5 w-full text-sm text-slate-600 dark:text-white/80 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 hover:file:bg-slate-200 file:text-slate-700 dark:file:bg-white/15 dark:file:text-white file:px-3 file:py-2 file:text-xs file:font-semibold cursor-pointer"
        />

        {/* Form action buttons */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-white/75 dark:hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="rounded-md bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50 transition"
          >
            {saving ? "Saving..." : "Create card"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CardFormModal;

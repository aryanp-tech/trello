import { useMemo } from "react";
import { getMergedColumnOptions } from "./cardUtils";

// Reusable card status field with all board columns and custom manual input
const CardListField = ({ list = "", columns = [], onListChange }) => {
  const availableOptions = useMemo(() => {
    if (columns && columns.length > 0) {
      return columns;
    }
    return getMergedColumnOptions();
  }, [columns]);

  // Determine if list matches an existing option
  const matchedOption = availableOptions.find(
    (opt) =>
      opt.id === list ||
      opt.label.toLowerCase() === String(list).toLowerCase()
  );

  // If matched an existing column option, leave manual input blank
  const customInputValue = matchedOption ? "" : list;

  const handleOptionClick = (optId) => {
    if (onListChange) {
      onListChange(optId);
    }
  };

  const handleCustomChange = (e) => {
    if (onListChange) {
      onListChange(e.target.value);
    }
  };

  return (
    <div className="mb-3">
      <div className="mb-1">
        <label className="text-xs font-semibold text-slate-700 dark:text-white/70">
          List / Status ({availableOptions.length} columns)
        </label>
      </div>

      {/* Board columns options */}
      <div className="mb-2 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto column-scrollbar">
        {availableOptions.map((opt) => {
          const isSelected =
            matchedOption?.id === opt.id ||
            list === opt.id ||
            String(list).toLowerCase() === opt.label.toLowerCase();

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleOptionClick(opt.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                isSelected
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80 dark:border-transparent dark:bg-[#17181a] dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Manual write input for custom status */}
      <input
        value={customInputValue}
        onChange={handleCustomChange}
        placeholder="write your custom status"
        className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 dark:border-transparent dark:bg-[#17181a] dark:text-white dark:focus:ring-blue-400"
      />
    </div>
  );
};

export default CardListField;

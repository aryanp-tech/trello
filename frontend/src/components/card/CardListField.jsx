import { getMergedColumnOptions } from "./cardUtils";

// Normalize check for preset options
const getPresetMatch = (val) => {
  if (!val) return null;
  const normalized = String(val).toLowerCase().replace(/-\d+$/, '').trim();
  if (normalized === "do" || normalized === "todo") return "do";
  if (normalized === "doing") return "doing";
  if (normalized === "to-be-done" || normalized === "to be done") return "to-be-done";
  if (normalized === "final" || normalized === "done") return "final";
  return null;
};

// Reusable card status field with the 4 standard suggestions and custom manual input
const CardListField = ({ list = "", onListChange }) => {
  const suggestions = getMergedColumnOptions();
  const selectedPreset = getPresetMatch(list);

  // If a preset is active, keep custom input empty so the placeholder shows
  // Only if the user entered a custom text does the input show that custom text
  const customInputValue = selectedPreset ? "" : list;

  const handlePresetClick = (optId) => {
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
          List / Status
        </label>
      </div>

      {/* 4 standard suggestions */}
      <div className="mb-2 flex flex-wrap gap-1.5">
        {suggestions.map((opt) => {
          const isSelected = selectedPreset === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handlePresetClick(opt.id)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
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

      {/* Manual write input with requested placeholder */}
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

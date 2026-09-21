import { getMergedColumnOptions } from "./cardUtils";

//write custom status and input section for status in card

const CardListField = ({ list = "", columns = [], onListChange }) => {
  const mergedOptions = getMergedColumnOptions(columns);

  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-semibold text-white/70">
        List / Status
      </label>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {mergedOptions.map((opt) => {
          const isSelected =
            list === opt.id ||
            list?.toLowerCase() === opt.label.toLowerCase();
          return (
            <button
              key={opt.id || opt.label}
              type="button"
              onClick={() => onListChange && onListChange(opt.id || opt.label)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                isSelected
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-[#17181a] text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <input
        value={list}
        onChange={(event) => onListChange && onListChange(event.target.value)}
        placeholder="Or type custom status/list name..."
        className="w-full rounded-md bg-[#17181a] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>
  );
};

export default CardListField;


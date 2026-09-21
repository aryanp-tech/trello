import { useState } from "react";
import { getMergedColumnOptions } from "./cardUtils";

//component for card statuss..
//like done, final, working or any custom status

const CardListSelector = ({ currentColumn, columns = [], onSelectColumn }) => {
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [manualInput, setManualInput] = useState("");

  const mergedOptions = getMergedColumnOptions(columns);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    onSelectColumn(manualInput.trim());
    setManualInput("");
    setColumnMenuOpen(false);
  };

  const isCurrentColumn = (col) => {
    if (!currentColumn) return false;
    return (
      col.id === currentColumn.id ||
      col.label.toLowerCase() === (currentColumn.label || "").toLowerCase()
    );
  };

  return (
    <div className="relative">
      {/* Dropdown trigger button */}
      <button
        type="button"
        onClick={() => setColumnMenuOpen(!columnMenuOpen)}
        className="flex items-center gap-1.5 rounded bg-[#2b313a] px-3 py-1.5 text-xs font-semibold text-[#c7d1db] hover:bg-[#343b46] hover:text-white transition"
      >
        <span>{currentColumn?.label || "List"}</span>
        <svg
          className="w-3.5 h-3.5 opacity-75"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {columnMenuOpen && (
        <div className="absolute left-0 top-9 z-50 w-64 rounded-lg border border-[#3b424e] bg-[#22272e] p-2.5 shadow-2xl">
          {/* Manual input: user can write whatever they want */}
          <div className="mb-2.5">
            <div className="px-1 py-1 text-[11px] font-semibold text-white/60 uppercase tracking-wider">
              Write custom status / list
            </div>
            <form onSubmit={handleManualSubmit} className="flex gap-1.5 mt-1">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="e.g. In Review, Blocked..."
                className="w-full rounded border border-[#444c56] bg-[#161a1f] px-2.5 py-1.5 text-xs text-white placeholder-white/35 focus:border-blue-500 focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="shrink-0 rounded bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-40 transition"
              >
                Set
              </button>
            </form>
          </div>

          {/* Options list */}
          <div className="border-t border-[#373d47] pt-2">
            <div className="px-1 py-1 text-[11px] font-semibold text-white/50 uppercase tracking-wider">
              Options
            </div>
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {mergedOptions.map((col) => {
                const active = isCurrentColumn(col);
                return (
                  <button
                    key={col.id || col.label}
                    type="button"
                    onClick={() => {
                      setColumnMenuOpen(false);
                      onSelectColumn(col.id || col.label);
                    }}
                    className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-xs transition ${
                      active
                        ? "bg-blue-600/30 text-blue-300 font-semibold"
                        : "text-[#c7d1db] hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span>{col.label}</span>
                    {active && <span className="text-blue-400">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardListSelector;


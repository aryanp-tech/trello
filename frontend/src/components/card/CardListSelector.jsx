import { useEffect, useRef, useState, useMemo } from "react";
import { getMergedColumnOptions, formatStatusLabel } from "./cardUtils";

// Component for card status selection with all board columns and custom manual input
const CardListSelector = ({ currentColumn, columns = [], onSelectColumn }) => {
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (columnMenuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setColumnMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [columnMenuOpen]);

  // Display all columns from the current board (with fallback to default options if none exist)
  const availableColumns = useMemo(() => {
    if (columns && columns.length > 0) {
      return columns;
    }
    return getMergedColumnOptions();
  }, [columns]);

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
      col.label?.toLowerCase() === currentColumn.label?.toLowerCase() ||
      col.label?.toLowerCase() === currentColumn.id?.toLowerCase()
    );
  };

  const displayLabel = formatStatusLabel(currentColumn?.label || currentColumn?.id);

  return (
    <div ref={menuRef} className="relative">
      {/* Dropdown trigger button */}
      <button
        type="button"
        onClick={() => setColumnMenuOpen(!columnMenuOpen)}
        className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100 hover:text-slate-900 dark:border-transparent dark:bg-[#2b313a] dark:text-[#c7d1db] dark:hover:bg-[#343b46] dark:hover:text-white transition"
        title="Change list / status"
      >
        <span>{displayLabel}</span>
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
        <div className="absolute left-0 top-9 z-50 w-64 rounded-lg border border-slate-200 bg-white p-2.5 shadow-xl dark:border-[#3b424e] dark:bg-[#22272e] animate-in fade-in zoom-in-95 duration-100">
          {/* Manual input: create/move to custom status */}
          <div className="mb-2.5">
            <form onSubmit={handleManualSubmit} className="flex gap-1.5">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="write your custom status"
                className="w-full rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none dark:border-[#444c56] dark:bg-[#161a1f] dark:text-white dark:placeholder-white/35"
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

          {/* List all board columns */}
          <div className="border-t border-slate-100 dark:border-[#373d47] pt-2">
            <div className="px-1 py-1 text-[11px] font-semibold text-slate-400 dark:text-white/50 uppercase tracking-wider">
              All Columns ({availableColumns.length})
            </div>
            <div className="space-y-0.5 mt-1 max-h-60 overflow-y-auto column-scrollbar">
              {availableColumns.map((col) => {
                const active = isCurrentColumn(col);
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => {
                      setColumnMenuOpen(false);
                      onSelectColumn(col.id || col.label);
                    }}
                    className={`flex w-full items-center justify-between rounded px-2.5 py-2 text-left text-xs transition ${
                      active
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-600/30 dark:text-blue-300 font-semibold"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-[#c7d1db] dark:hover:bg-white/10 dark:hover:text-white"
                    }`}
                  >
                    <span className="truncate">{col.label}</span>
                    {active && <span className="text-blue-600 dark:text-blue-400 font-bold ml-2">✓</span>}
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

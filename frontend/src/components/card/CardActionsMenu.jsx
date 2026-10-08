import { useEffect, useRef, useState } from "react";

//component for card navbar, like card status, and close and option buttons

const CardActionsMenu = ({ onDeleteCard, onClose }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="flex items-center gap-1.5">
     
      {/* 3-dots Menu Button */}
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white transition text-sm font-bold leading-none"
          title="More actions"
        >
          ⋯
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-8 z-50 w-48 rounded-lg border border-slate-200 bg-white dark:border-[#3b424e] dark:bg-[#22272e] p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 dark:text-white/50 uppercase tracking-wider">
              Actions
            </div>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onDeleteCard();
              }}
              className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/20 dark:hover:text-red-300 transition"
            >
              <span>🗑️</span> Delete card
            </button>
          </div>
        )}
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="rounded p-1.5 text-lg leading-none text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white transition"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
};

export default CardActionsMenu;

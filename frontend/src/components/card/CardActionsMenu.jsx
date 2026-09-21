import { useState } from "react";

//component for card navbar, like card status, and close and option buttons

const CardActionsMenu = ({ onDeleteCard, onClose }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-1.5">
     
      {/* 3-dots Menu Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition text-sm font-bold leading-none"
          title="More actions"
        >
          ⋯
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-8 z-50 w-48 rounded-lg border border-[#3b424e] bg-[#22272e] p-1.5 shadow-2xl">
            <div className="px-2.5 py-1 text-[11px] font-semibold text-white/50 uppercase tracking-wider">
              Actions
            </div>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onDeleteCard();
              }}
              className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs text-red-400 hover:bg-red-500/20 hover:text-red-300 transition"
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
        className="rounded p-1.5 text-lg leading-none text-white/60 hover:bg-white/10 hover:text-white transition"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
};

export default CardActionsMenu;


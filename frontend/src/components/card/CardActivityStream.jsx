import { formatTimestamp } from "./cardUtils";

const CardActivityStream = ({ activities = [] }) => {
  if (!activities || activities.length === 0) return null;

  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  return (
    <div className="flex flex-col gap-2 border-t border-slate-100 dark:border-white/10 pt-3">
      <div className="text-[11px] font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wider">
        Activity
      </div>
      {sortedActivities.map((act, i) => (
        <div
          key={act._id || i}
          className="flex items-start gap-2 text-xs text-slate-600 dark:text-white/60"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-700 text-[11px] font-bold text-white uppercase shadow-sm">
            {act.user?.charAt(0) || "U"}
          </div>
          <div className="pt-0.5">
            <span className="font-semibold text-slate-800 dark:text-white/80">
              {act.user}{" "}
            </span>
            <span>{act.text}</span>
            <span className="ml-1.5 text-[10px] text-slate-400 dark:text-white/40">
              {formatTimestamp(act.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardActivityStream;

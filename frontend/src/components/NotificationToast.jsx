import { useEffect } from "react";

const NotificationToast = ({ notification, onClose }) => {
  useEffect(() => {
    if (!notification) return undefined;

    const timeoutId = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [notification, onClose]);

  if (!notification) return null;

  const isError = notification.type === "error";

  //notification for email send message
  return (
    <div
      className={`fixed right-5 top-5 z-50 flex w-[min(22rem,calc(100vw-2.5rem))] items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl ${isError ? "border-red-400/30 bg-[#3a2025] text-red-100" : "border-emerald-400/30 bg-[#18352d] text-emerald-100"}`}
      role="status"
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isError ? "bg-red-400/20 text-red-200" : "bg-emerald-400/20 text-emerald-200"}`}
      >
        {isError ? "!" : "✓"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {isError ? "Something went wrong" : "Success"}
        </p>
        <p className="mt-0.5 text-xs text-white/70">{notification.message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-lg leading-none text-white/50 hover:text-white"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default NotificationToast;

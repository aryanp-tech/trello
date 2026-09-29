import { useEffect } from "react";
import { formatFileSize } from "./cardUtils";

const isImageAttachment = (att) => {
  if (!att) return false;
  if (att.mimeType?.startsWith("image/")) return true;
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(
    att.fileName || att.originalName || att.url || ""
  );
};

const isPdfAttachment = (att) => {
  if (!att) return false;
  if (att.mimeType === "application/pdf") return true;
  return /\.pdf$/i.test(att.fileName || att.originalName || att.url || "");
};

const isVideoAttachment = (att) => {
  if (!att) return false;
  if (att.mimeType?.startsWith("video/")) return true;
  return /\.(mp4|webm|ogg|mov|m4v|mkv)$/i.test(
    att.fileName || att.originalName || att.url || ""
  );
};

const isAudioAttachment = (att) => {
  if (!att) return false;
  if (att.mimeType?.startsWith("audio/")) return true;
  return /\.(mp3|wav|ogg|m4a|aac)$/i.test(
    att.fileName || att.originalName || att.url || ""
  );
};

const AttachmentPreviewModal = ({ attachment, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!attachment?.url) return null;

  const isImage = isImageAttachment(attachment);
  const isPdf = isPdfAttachment(attachment);
  const isVideo = isVideoAttachment(attachment);
  const isAudio = isAudioAttachment(attachment);
  const fileName =
    attachment.originalName || attachment.fileName || "Attachment";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#181a1f] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-[#1f2228] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <span className="text-lg">
              {isImage ? "🖼️" : isPdf ? "📄" : isVideo ? "🎬" : isAudio ? "🎵" : "📎"}
            </span>
            <div className="min-w-0">
              <h3
                className="truncate text-sm font-semibold text-slate-900 dark:text-white"
                title={fileName}
              >
                {fileName}
              </h3>
              {attachment.size && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {formatFileSize(attachment.size)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* In-place download button (no target=_blank) */}
            <a
              href={attachment.url}
              download={fileName}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-[#282c34] dark:text-slate-200 dark:hover:bg-[#323640] transition"
              title="Download file"
            >
              <span>⬇</span>
              <span>Download</span>
            </a>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white transition"
              aria-label="Close preview"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-5 overflow-auto bg-slate-100/60 dark:bg-black/40">
          {isImage && (
            <img
              src={attachment.url}
              alt={fileName}
              className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-lg"
            />
          )}

          {isPdf && (
            <iframe
              src={attachment.url}
              title={fileName}
              className="w-full h-[75vh] rounded-lg border border-slate-200 bg-white dark:border-slate-800"
            />
          )}

          {isVideo && (
            <video
              controls
              autoPlay
              playsInline
              src={attachment.url}
              className="max-h-[75vh] max-w-full rounded-lg shadow-lg bg-black"
            />
          )}

          {isAudio && (
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-[#20242c]">
              <p className="mb-3 text-center text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                {fileName}
              </p>
              <audio controls autoPlay src={attachment.url} className="w-full" />
            </div>
          )}

          {!isImage && !isPdf && !isVideo && !isAudio && (
            <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl dark:bg-blue-950/40">
                📄
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  {fileName}
                </p>
                {attachment.size && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatFileSize(attachment.size)}
                  </p>
                )}
              </div>
              <p className="max-w-xs text-xs text-slate-500 dark:text-slate-400">
                This file format cannot be previewed inline. You can download it directly to view on your device.
              </p>
              <a
                href={attachment.url}
                download={fileName}
                className="mt-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-500 transition"
              >
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachmentPreviewModal;

import { useState } from "react";
import { formatFileSize } from "./cardUtils";
import AttachmentPreviewModal from "./AttachmentPreviewModal";

const CommentAttachment = ({ attachment }) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!attachment?.url) return null;

  const isImage =
    attachment.mimeType?.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(
      attachment.fileName || attachment.originalName || ""
    );

  const isVideo =
    attachment.mimeType?.startsWith("video/") ||
    /\.(mp4|webm|ogg|mov|m4v|mkv)$/i.test(
      attachment.fileName || attachment.originalName || ""
    );

  return (
    <>
      <div className="mt-2 border-t border-slate-200/80 dark:border-white/10 pt-2">
        {isImage ? (
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="group relative block max-w-xs overflow-hidden rounded-lg border border-slate-200 dark:border-white/10 hover:opacity-95 transition focus:outline-none"
            title="Click to preview image"
          >
            <img
              src={attachment.url}
              alt={attachment.originalName || "Comment image"}
              className="max-h-44 rounded-lg object-contain bg-slate-100 dark:bg-black/30"
            />
          </button>
        ) : isVideo ? (
          <div className="group relative block max-w-xs sm:max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-black/5 dark:border-white/10 dark:bg-black/40 shadow-sm">
            <div
              onClick={() => setPreviewOpen(true)}
              className="cursor-pointer relative flex items-center justify-center bg-black overflow-hidden h-36 sm:h-44"
              title="Click to play video"
            >
              <video
                src={attachment.url}
                preload="metadata"
                playsInline
                className="w-full h-full object-contain pointer-events-none"
              />
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition flex items-center justify-center">
                <span className="rounded-full bg-blue-600/90 p-2.5 text-white shadow-lg group-hover:scale-110 group-hover:bg-blue-500 transition flex items-center justify-center">
                  <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </div>
              <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white tracking-wide">
                MP4
              </span>
            </div>
            <div className="flex items-center justify-between p-2 text-xs bg-white dark:bg-[#1a1d21]">
              <span
                className="truncate font-semibold text-slate-800 dark:text-slate-200 max-w-[200px]"
                title={attachment.originalName || "Video attachment"}
              >
                {attachment.originalName || "Video attachment"}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-white/50 shrink-0 ml-2">
                {formatFileSize(attachment.size)}
              </span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100/80 px-2.5 py-1.5 text-xs text-blue-600 hover:bg-slate-200 dark:border-transparent dark:bg-black/30 dark:text-blue-300 dark:hover:bg-black/50 transition"
            title="Click to preview file"
          >
            <span>📎</span>
            <span className="truncate font-medium">{attachment.originalName || "Attached file"}</span>
            <span className="text-[10px] text-slate-500 dark:text-white/50">
              ({formatFileSize(attachment.size)})
            </span>
          </button>
        )}
      </div>

      {previewOpen && (
        <AttachmentPreviewModal
          key={attachment?.url}
          attachment={attachment}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
};

export default CommentAttachment;

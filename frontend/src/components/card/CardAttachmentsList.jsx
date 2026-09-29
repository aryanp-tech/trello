import { useState } from "react";
import { formatFileSize, formatTimestamp } from "./cardUtils";
import AttachmentPreviewModal from "./AttachmentPreviewModal";

const CardAttachmentsList = ({
  allAttachments = [],
  cardId,
  onDeleteAttachment,
}) => {
  const [previewAttachment, setPreviewAttachment] = useState(null);

  const imageAttachments = allAttachments.filter(
    (att) =>
      att.mimeType?.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.fileName || att.originalName || "")
  );

  const otherAttachments = allAttachments.filter(
    (att) =>
      !(
        att.mimeType?.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.fileName || att.originalName || "")
      )
  );

  if (allAttachments.length === 0) return null;

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Attached image preview */}
        {imageAttachments.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-white/70">
              Attached Image{imageAttachments.length > 1 ? "s" : ""}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {imageAttachments.map((imgAtt, idx) => (
                <div
                  key={imgAtt._id || idx}
                  className="group relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-[#343942] dark:bg-black/40 flex items-center justify-center p-1.5 cursor-pointer shadow-sm hover:shadow transition"
                  onClick={() => setPreviewAttachment(imgAtt)}
                  title="Click to view image"
                >
                  <img
                    src={imgAtt.url}
                    alt={imgAtt.originalName || "Description image"}
                    className="max-h-72 w-full rounded-lg object-contain"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
                    <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white shadow">
                      🔍 Preview
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAttachment(cardId, imgAtt._id || imgAtt.fileName);
                    }}
                    className="absolute top-3 right-3 rounded-md bg-black/75 px-2.5 py-1 text-xs font-medium text-red-300 opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition shadow z-10"
                    title="Remove image"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Non-image attachment files list */}
        {otherAttachments.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-white/70">
              Attached Files
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {otherAttachments.map((att, idx) => {
                const attId = att._id || att.fileName || idx;
                return (
                  <div
                    key={attId}
                    className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-[#343942] dark:bg-[#16181c] shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    <div
                      onClick={() => setPreviewAttachment(att)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-[#2b313a] text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase cursor-pointer hover:opacity-80 transition"
                      title="Click to preview file"
                    >
                      {att.originalName?.split(".").pop()?.slice(0, 4) || "FILE"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        onClick={() => setPreviewAttachment(att)}
                        className="truncate text-xs font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                        title={att.originalName || att.fileName || "File"}
                      >
                        {att.originalName || att.fileName || "File"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-white/50">
                        {formatFileSize(att.size)} • {formatTimestamp(att.createdAt)}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setPreviewAttachment(att)}
                          className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:underline"
                        >
                          Preview
                        </button>
                        {att.url && (
                          <a
                            href={att.url}
                            download={att.originalName}
                            className="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:underline"
                            title="Download to your device"
                          >
                            Download
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteAttachment(cardId, att._id || att.fileName)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {previewAttachment && (
        <AttachmentPreviewModal
          attachment={previewAttachment}
          onClose={() => setPreviewAttachment(null)}
        />
      )}
    </>
  );
};

export default CardAttachmentsList;

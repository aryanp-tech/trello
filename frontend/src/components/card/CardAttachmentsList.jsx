import React, { useState, useMemo } from "react";
import { formatFileSize, formatTimestamp, downloadFileBlob } from "./cardUtils";
import AttachmentPreviewModal from "./AttachmentPreviewModal";

const getCleanPath = (str = "") => {
  if (!str || typeof str !== "string") return "";
  return str.split("?")[0].split("#")[0].toLowerCase();
};

const CardAttachmentsList = React.memo(({
  allAttachments = [],
  cardId,
  onDeleteAttachment,
}) => {
  const [previewAttachment, setPreviewAttachment] = useState(null);

  // Filter and categorize attachments using useMemo to avoid repeated parsing
  const { validAttachments, imageAttachments, videoAttachments, otherAttachments } =
    useMemo(() => {
      const valid = (allAttachments || []).filter(
        (att) => Boolean(att && att.url && String(att.url).trim())
      );

      const images = [];
      const videos = [];
      const others = [];

      valid.forEach((att) => {
        const target = getCleanPath(att.fileName || att.originalName || att.url || "");
        const isImg =
          att.mimeType?.startsWith("image/") ||
          /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|avif)$/i.test(target);
        const isVid =
          att.mimeType?.startsWith("video/") ||
          /\.(mp4|webm|ogg|mov|m4v|mkv)$/i.test(target);

        if (isImg) {
          images.push(att);
        } else if (isVid) {
          videos.push(att);
        } else {
          others.push(att);
        }
      });

      return {
        validAttachments: valid,
        imageAttachments: images,
        videoAttachments: videos,
        otherAttachments: others,
      };
    }, [allAttachments]);

  if (validAttachments.length === 0) return null;

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Attached image preview */}
        {imageAttachments.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-white/70 flex items-center gap-1.5">
              <span>🖼️</span>
              <span>Attached Image{imageAttachments.length > 1 ? "s" : ""}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {imageAttachments.map((imgAtt, idx) => (
                <div
                  key={imgAtt._id || idx}
                  className="group relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-[#343942] dark:bg-black/40 flex flex-col p-2 shadow-sm hover:shadow transition"
                >
                  <div
                    className="relative w-full h-44 sm:h-48 overflow-hidden rounded-lg bg-slate-100 dark:bg-black/60 flex items-center justify-center cursor-pointer"
                    onClick={() => setPreviewAttachment(imgAtt)}
                    title="Click to view full image"
                  >
                    <img
                      src={imgAtt.url}
                      alt={imgAtt.originalName || "Attached image"}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        if (e.currentTarget.nextElementSibling) {
                          e.currentTarget.nextElementSibling.classList.remove("hidden");
                          e.currentTarget.nextElementSibling.classList.add("flex");
                        }
                      }}
                      className="max-h-full max-w-full object-contain transition duration-200 group-hover:scale-[1.02]"
                    />
                    <div className="hidden flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <span className="text-3xl mb-1">🖼️</span>
                      <span className="text-xs font-medium">Image preview unavailable</span>
                    </div>
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
                      <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white shadow">
                        🔍 Preview
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs px-1">
                    <div className="min-w-0 pr-2">
                      <p
                        className="truncate font-semibold text-slate-800 dark:text-white"
                        title={imgAtt.originalName || imgAtt.fileName || "Image"}
                      >
                        {imgAtt.originalName || imgAtt.fileName || "Image"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-white/50">
                        {formatFileSize(imgAtt.size)}
                        {imgAtt.createdAt ? ` • ${formatTimestamp(imgAtt.createdAt)}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewAttachment(imgAtt)}
                        className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:underline"
                      >
                        Preview
                      </button>
                      {imgAtt.url && (
                        <button
                          type="button"
                          onClick={() => downloadFileBlob(imgAtt.url, imgAtt.originalName || "image.jpg")}
                          className="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:underline"
                          title="Download image"
                        >
                          Download
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete "${imgAtt.originalName || imgAtt.fileName || 'image'}"?`)) {
                            onDeleteAttachment(cardId, imgAtt._id || imgAtt.fileName);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:underline"
                        title="Delete image"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attached video preview (MP4, etc.) */}
        {videoAttachments.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-white/70 flex items-center gap-1.5">
              <span>🎬</span>
              <span>Attached Video{videoAttachments.length > 1 ? "s" : ""}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {videoAttachments.map((vidAtt, idx) => (
                <div
                  key={vidAtt._id || idx}
                  className="group relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-[#343942] dark:bg-black/40 flex flex-col p-2 shadow-sm hover:shadow transition"
                >
                  <div
                    className="relative w-full h-44 sm:h-48 overflow-hidden rounded-lg bg-black flex items-center justify-center cursor-pointer"
                    onClick={() => setPreviewAttachment(vidAtt)}
                    title="Click to view full video"
                  >
                    <video
                      src={vidAtt.url}
                      preload="metadata"
                      playsInline
                      className="w-full h-full object-contain pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition flex items-center justify-center">
                      <span className="rounded-full bg-blue-600/90 text-white p-3 shadow-lg group-hover:scale-110 group-hover:bg-blue-500 transition flex items-center justify-center">
                        <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </div>
                    <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white tracking-wide">
                      MP4 VIDEO
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs px-1">
                    <div className="min-w-0 pr-2">
                      <p
                        className="truncate font-semibold text-slate-800 dark:text-white"
                        title={vidAtt.originalName || vidAtt.fileName || "Video"}
                      >
                        {vidAtt.originalName || vidAtt.fileName || "Video"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-white/50">
                        {formatFileSize(vidAtt.size)}
                        {vidAtt.createdAt ? ` • ${formatTimestamp(vidAtt.createdAt)}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewAttachment(vidAtt)}
                        className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:underline"
                      >
                        Play
                      </button>
                      {vidAtt.url && (
                        <button
                          type="button"
                          onClick={() => downloadFileBlob(vidAtt.url, vidAtt.originalName || "video.mp4")}
                          className="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:underline"
                          title="Download video"
                        >
                          Download
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete "${vidAtt.originalName || vidAtt.fileName || 'video'}"?`)) {
                            onDeleteAttachment(cardId, vidAtt._id || vidAtt.fileName);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:underline"
                        title="Delete video"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Non-media attachment files list */}
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
                          <button
                            type="button"
                            onClick={() => downloadFileBlob(att.url, att.originalName || "file")}
                            className="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:underline"
                            title="Download to your device"
                          >
                            Download
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete "${att.originalName || att.fileName || 'file'}"?`)) {
                              onDeleteAttachment(cardId, att._id || att.fileName);
                            }
                          }}
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
          key={previewAttachment?.url || previewAttachment?._id}
          attachment={previewAttachment}
          onClose={() => setPreviewAttachment(null)}
          onDelete={() => {
            onDeleteAttachment(cardId, previewAttachment._id || previewAttachment.fileName);
            setPreviewAttachment(null);
          }}
        />
      )}
    </>
  );
});

export default CardAttachmentsList;

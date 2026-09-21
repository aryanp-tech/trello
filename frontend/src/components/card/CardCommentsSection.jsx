import { useRef, useState } from "react";
import { formatFileSize, formatTimestamp } from "./cardUtils";

//component for card comments, add, update and delete commonts..

const CardCommentsSection = ({
  card,
  currentUser,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}) => {
  const [commentText, setCommentText] = useState("");
  const [commentFile, setCommentFile] = useState(null);
  const [commentSaving, setCommentSaving] = useState(false);

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  const commentTextareaRef = useRef(null);
  const commentFileInputRef = useRef(null);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() && !commentFile) return;

    try {
      setCommentSaving(true);
      await onAddComment(card._id, commentText.trim(), commentFile);
      setCommentText("");
      setCommentFile(null);
    } catch (err) {
      console.error("Add comment error:", err);
    } finally {
      setCommentSaving(false);
    }
  };

  const handleSaveEditComment = async (commentId) => {
    if (!editingCommentText.trim()) return;
    try {
      await onUpdateComment(card._id, commentId, editingCommentText.trim());
      setEditingCommentId(null);
      setEditingCommentText("");
    } catch (err) {
      console.error("Edit comment error:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        await onDeleteComment(card._id, commentId);
      } catch (err) {
        console.error("Delete comment error:", err);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header: Comments and Activity (clean text, no hide/show details button) */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white">
          Comments and activity
        </div>
      </div>

      {/* Comment Composer without text formatting tools */}
      <form onSubmit={handleSubmitComment} className="flex flex-col gap-2">
        <div className="rounded-lg border border-[#373c44] bg-[#16181c] p-3 focus-within:border-blue-500 transition">
          <textarea
            ref={commentTextareaRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            className="w-full resize-y bg-transparent text-sm text-white placeholder-white/40 outline-none leading-relaxed no-scrollbar"
          />

          {/* Attached File Chip */}
          {commentFile && (
            <div className="mt-2 flex items-center justify-between rounded bg-[#1a2130] px-3 py-1.5 text-xs">
              <div className="flex items-center gap-2 truncate text-blue-300">
                <span>📎</span>
                <span className="truncate font-medium">{commentFile.name}</span>
                <span className="text-white/50">
                  ({formatFileSize(commentFile.size)})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCommentFile(null)}
                className="ml-2 text-white/50 hover:text-white"
                title="Remove file"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            type="submit"
            disabled={commentSaving || (!commentText.trim() && !commentFile)}
            className="rounded bg-[#579dff] px-4 py-1.5 text-xs font-semibold text-[#091e42] hover:bg-[#85b8ff] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {commentSaving ? "Saving..." : "Save"}
          </button>

          {/* Attach file to comment button */}
          <button
            type="button"
            onClick={() => commentFileInputRef.current?.click()}
            className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs text-[#c7d1db] hover:bg-white/10 hover:text-white transition ${
              commentFile ? "text-blue-400" : ""
            }`}
            title="Attach file"
          >
            <span>📎</span>
            <span>Attach file</span>
          </button>
          <input
            ref={commentFileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => setCommentFile(e.target.files?.[0] || null)}
          />
        </div>
      </form>

      {/* Stream of Comments & Activities */}
      <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar pr-1">
        {/* Activity entries */}
        {card.activities && card.activities.length > 0 && (
          <div className="flex flex-col gap-2">
            {card.activities.map((act, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs text-white/60"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-800 text-[11px] font-bold text-white uppercase">
                  {act.user?.charAt(0) || "U"}
                </div>
                <div className="pt-0.5">
                  <span className="font-semibold text-white/80">
                    {act.user}{" "}
                  </span>
                  <span>{act.text}</span>
                  <span className="ml-1.5 text-[10px] text-white/40">
                    {formatTimestamp(act.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comments List */}
        {card.comments && card.comments.length > 0 ? (
          card.comments.map((cmt) => {
            const isAuthor =
              currentUser &&
              (cmt.author === currentUser.id ||
                cmt.author === currentUser._id ||
                cmt.authorName === currentUser.username);

            const isEditingThis = editingCommentId === cmt._id;

            return (
              <div key={cmt._id} className="flex items-start gap-2.5">
                {/* Avatar */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00a3bf] text-xs font-bold text-[#091e42] uppercase shadow-sm">
                  {cmt.authorName?.charAt(0) || "A"}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-bold text-white">
                      {cmt.authorName || "User"}
                    </span>
                    <span className="text-[11px] text-white/50">
                      {formatTimestamp(cmt.createdAt)}
                    </span>
                    {cmt.updatedAt && (
                      <span className="text-[10px] text-white/40 italic">
                        (edited)
                      </span>
                    )}
                  </div>

                  {/* Comment Box */}
                  {isEditingThis ? (
                    <div className="mt-1 flex flex-col gap-2 rounded-lg border border-blue-500 bg-[#16181c] p-2.5">
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        rows={3}
                        className="w-full bg-transparent text-sm text-white outline-none resize-y no-scrollbar"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveEditComment(cmt._id)}
                          className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingCommentText("");
                          }}
                          className="rounded px-2.5 py-1 text-xs text-white/60 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 rounded-lg border border-[#323940] bg-[#22272b] p-3 text-sm text-white/90 shadow-sm whitespace-pre-wrap leading-relaxed">
                      {cmt.text}

                      {/* Comment attachment preview */}
                      {cmt.attachment?.url && (
                        <div className="mt-2 border-t border-white/10 pt-2">
                          {cmt.attachment.mimeType?.startsWith("image/") ? (
                            <a
                              href={cmt.attachment.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={cmt.attachment.url}
                                alt={cmt.attachment.originalName}
                                className="max-h-40 rounded object-contain border border-white/10"
                              />
                            </a>
                          ) : (
                            <a
                              href={cmt.attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              download={cmt.attachment.originalName}
                              className="flex items-center gap-2 rounded bg-black/30 px-2.5 py-1.5 text-xs text-blue-300 hover:bg-black/40"
                            >
                              <span>📎</span>
                              <span className="truncate">
                                {cmt.attachment.originalName}
                              </span>
                              <span className="text-[10px] text-white/50">
                                ({formatFileSize(cmt.attachment.size)})
                              </span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions: @, Edit, Delete */}
                  {!isEditingThis && (
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-white/50 pl-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCommentText(
                            (prev) => `${prev} @${cmt.authorName} `,
                          );
                          commentTextareaRef.current?.focus();
                        }}
                        className="hover:text-white hover:underline"
                      >
                        @
                      </button>
                      {isAuthor && (
                        <>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(cmt._id);
                              setEditingCommentText(cmt.text);
                            }}
                            className="hover:text-white hover:underline"
                          >
                            Edit
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(cmt._id)}
                            className="text-red-400 hover:text-red-300 hover:underline"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center text-xs text-white/40 italic">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
};

export default CardCommentsSection;

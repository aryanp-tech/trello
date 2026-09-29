import { formatTimestamp } from "./cardUtils";
import CommentAttachment from "./CommentAttachment";

const renderCommentContent = (text) => {
  if (!text) return null;
  const parts = text.split(/(@[a-zA-Z0-9_.-]+)/g);
  return parts.map((part, index) => {
    if (part.startsWith("@")) {
      return (
        <span
          key={index}
          className="inline-flex items-center rounded bg-blue-500/20 dark:bg-blue-500/30 px-1 py-0.5 font-semibold text-blue-600 dark:text-blue-300 text-xs"
        >
          {part}
        </span>
      );
    }
    return part;
  });
};

const CommentItem = ({
  cmt,
  currentUser,
  isEditingThis,
  editingCommentText,
  setEditingCommentText,
  handleSaveEditComment,
  setEditingCommentId,
  handleDeleteComment,
  setCommentText,
  commentTextareaRef,
}) => {
  const isAuthor =
    currentUser &&
    (cmt.author === currentUser.id ||
      cmt.author === currentUser._id ||
      cmt.authorName === currentUser.username);

  return (
    <div className="group relative flex items-start gap-2.5 rounded-lg p-1.5 transition hover:bg-white/[0.02]">
      {/* Author Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00a3bf] text-xs font-bold text-[#091e42] uppercase shadow-sm">
        {cmt.authorName?.charAt(0) || "A"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-bold text-slate-900 dark:text-white">
            {cmt.authorName || "User"}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-white/50">
            {formatTimestamp(cmt.createdAt)}
          </span>
          {cmt.updatedAt && (
            <span className="text-[10px] text-slate-400 dark:text-white/40 italic">
              (edited)
            </span>
          )}
        </div>

        {/* Comment Box */}
        {isEditingThis ? (
          <div className="mt-1 flex flex-col gap-2 rounded-lg border border-blue-500 bg-slate-50 dark:bg-[#16181c] p-2.5">
            <textarea
              value={editingCommentText}
              onChange={(e) => setEditingCommentText(e.target.value)}
              rows={3}
              className="w-full bg-transparent text-sm text-slate-900 dark:text-white outline-none resize-y no-scrollbar"
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
                className="rounded px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 dark:border-[#323940] dark:bg-[#22272b] dark:text-white/90 shadow-sm whitespace-pre-wrap leading-relaxed">
            {renderCommentContent(cmt.text)}
            <CommentAttachment attachment={cmt.attachment} />
          </div>
        )}

        {/* Actions: @, Edit, Delete */}
        {!isEditingThis && (
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-white/50 pl-1">
            <button
              type="button"
              onClick={() => {
                setCommentText(
                  (prev) => (prev ? `${prev} @${cmt.authorName} ` : `@${cmt.authorName} `)
                );
                commentTextareaRef.current?.focus();
              }}
              className="hover:text-blue-600 dark:hover:text-blue-400 font-semibold flex items-center gap-0.5"
              title={`Reply to @${cmt.authorName}`}
            >
              <span>@</span>
              <span>{cmt.authorName}</span>
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
                  className="hover:text-slate-800 dark:hover:text-white hover:underline"
                >
                  Edit
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleDeleteComment(cmt._id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline"
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
};

export default CommentItem;

import { useEffect, useRef, useState } from "react";
import { formatFileSize } from "./cardUtils";
import CommentItem from "./CommentItem";
import CardMentionDropdown from "./CardMentionDropdown";
import CardActivityStream from "./CardActivityStream";

// Component for card comments, composer, mention autocomplete, and activity stream
const CardCommentsSection = ({
  card,
  boardMembers = [],
  currentUser,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}) => {
  const [commentText, setCommentText] = useState("");
  const [commentFile, setCommentFile] = useState(null);
  const [commentSaving, setCommentSaving] = useState(false);

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  const commentTextareaRef = useRef(null);
  const commentFileInputRef = useRef(null);
  const mentionDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        mentionQuery !== null &&
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(e.target) &&
        commentTextareaRef.current &&
        !commentTextareaRef.current.contains(e.target)
      ) {
        setMentionQuery(null);
        setMentionStartIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mentionQuery]);

  const comments = card.comments || [];

  // Resolve members assigned to this specific card (ensuring card owner is always included)
  const memberList = [...(card.members || [])];
  const ownerObj = card.createdBy;
  const ownerId = String(ownerObj?._id || ownerObj || "");

  if (ownerId && !memberList.some((m) => String(m?._id || m) === ownerId)) {
    memberList.unshift(ownerObj);
  }

  const currentUserId = String(currentUser?._id || currentUser?.id || "");
  const currentUsername = (currentUser?.username || "").toLowerCase();

  const cardMembers = memberList
    .map((m) => {
      if (typeof m === "object" && m !== null) {
        return m;
      }
      const found = (boardMembers || []).find((b) => String(b._id) === String(m));
      return found || { _id: m, username: "Member" };
    })
    .filter((m) => {
      // Exclude logged-in user so they don't see themselves in the @ mention list
      const memberId = String(m._id || "");
      const memberUsername = (m.username || "").toLowerCase();
      if (currentUserId && memberId === currentUserId) return false;
      if (currentUsername && memberUsername === currentUsername) return false;
      return true;
    });

  const filteredMembers =
    mentionQuery !== null
      ? cardMembers.filter((m) => {
          const name = (m.username || m.email || "").toLowerCase();
          return name.includes(mentionQuery);
        })
      : [];

  const handleCommentChange = (e) => {
    const val = e.target.value;
    setCommentText(val);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9._-]*)$/);

    if (match) {
      const query = match[1];
      const atIndex = textBeforeCursor.lastIndexOf("@");
      setMentionQuery(query.toLowerCase());
      setMentionStartIndex(atIndex);
      setMentionSelectedIndex(0);
    } else {
      setMentionQuery(null);
      setMentionStartIndex(-1);
    }
  };

  const handleSelectMember = (member) => {
    const name = member.username || member.email?.split("@")[0] || "member";
    if (mentionStartIndex === -1) return;
    const cursor = commentTextareaRef.current?.selectionStart || mentionStartIndex;
    const before = commentText.slice(0, mentionStartIndex);
    const after = commentText.slice(cursor);
    const insertText = `@${name} `;
    const newText = `${before}${insertText}${after}`;

    setCommentText(newText);
    setMentionQuery(null);
    setMentionStartIndex(-1);

    setTimeout(() => {
      if (commentTextareaRef.current) {
        commentTextareaRef.current.focus();
        const newPos = before.length + insertText.length;
        commentTextareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (mentionQuery === null) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionSelectedIndex((prev) =>
        filteredMembers.length > 0 ? (prev + 1) % filteredMembers.length : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionSelectedIndex((prev) =>
        filteredMembers.length > 0
          ? (prev - 1 + filteredMembers.length) % filteredMembers.length
          : 0
      );
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (filteredMembers.length > 0 && filteredMembers[mentionSelectedIndex]) {
        e.preventDefault();
        handleSelectMember(filteredMembers[mentionSelectedIndex]);
      }
    } else if (e.key === "Escape") {
      setMentionQuery(null);
      setMentionStartIndex(-1);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() && !commentFile) return;

    try {
      setCommentSaving(true);
      await onAddComment(card._id, commentText.trim(), commentFile);
      setCommentText("");
      setCommentFile(null);
      setMentionQuery(null);
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
      {/* Header: Comments and Activity */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">
          Comments and activity
        </div>
      </div>

      {/* Comment Composer */}
      <form onSubmit={handleSubmitComment} className="flex flex-col gap-2">
        <div className="relative rounded-lg border border-slate-200 bg-slate-50 p-3 focus-within:border-blue-500 focus-within:bg-white dark:border-[#373c44] dark:bg-[#16181c] transition">
          <textarea
            ref={commentTextareaRef}
            value={commentText}
            onChange={handleCommentChange}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment... (type @ to mention card members)"
            rows={3}
            className="w-full resize-y bg-transparent text-sm text-slate-900 placeholder:text-slate-400 dark:text-white dark:placeholder-white/40 outline-none leading-relaxed no-scrollbar"
          />

          {/* Autocomplete dropdown for members on this card: positioned below input */}
          <CardMentionDropdown
            ref={mentionDropdownRef}
            mentionQuery={mentionQuery}
            cardMembers={cardMembers}
            filteredMembers={filteredMembers}
            selectedIndex={mentionSelectedIndex}
            onSelectMember={handleSelectMember}
          />

          {/* Attached File Chip */}
          {commentFile && (
            <div className="mt-2 flex items-center justify-between rounded bg-blue-50 dark:bg-[#1a2130] px-3 py-1.5 text-xs border border-blue-200/60 dark:border-transparent">
              <div className="flex items-center gap-2 truncate text-blue-700 dark:text-blue-300">
                <span>📎</span>
                <span className="truncate font-medium">{commentFile.name}</span>
                <span className="text-slate-500 dark:text-white/50">
                  ({formatFileSize(commentFile.size)})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCommentFile(null)}
                className="ml-2 text-slate-400 hover:text-slate-700 dark:text-white/50 dark:hover:text-white"
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
            className="rounded bg-blue-600 hover:bg-blue-500 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
          >
            {commentSaving ? "Saving..." : "Save"}
          </button>

          {/* Attach file to comment button */}
          <button
            type="button"
            onClick={() => commentFileInputRef.current?.click()}
            className={`flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-transparent dark:text-[#c7d1db] dark:hover:bg-white/10 dark:hover:text-white transition shadow-sm ${
              commentFile ? "text-blue-600 font-semibold" : ""
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
        {/* Comments List */}
        {comments.length > 0 ? (
          <div className="flex flex-col gap-2">
            {comments.map((cmt) => (
              <CommentItem
                key={cmt._id}
                cmt={cmt}
                currentUser={currentUser}
                isEditingThis={editingCommentId === cmt._id}
                editingCommentText={editingCommentText}
                setEditingCommentText={setEditingCommentText}
                handleSaveEditComment={handleSaveEditComment}
                setEditingCommentId={setEditingCommentId}
                handleDeleteComment={handleDeleteComment}
                setCommentText={setCommentText}
                commentTextareaRef={commentTextareaRef}
              />
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-white/40 italic">
            No comments yet. Be the first to comment!
          </div>
        )}

        {/* Activity Stream */}
        <CardActivityStream activities={card.activities} />
      </div>
    </div>
  );
};

export default CardCommentsSection;

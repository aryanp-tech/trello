import { useRef, useState } from "react";
import CardMembersBar from "./CardMembersBar";
import CardAttachmentsList from "./CardAttachmentsList";

// Clean, modular card description section
const CardDescriptionSection = ({
  card,
  boardMembers = [],
  onToggleMember,
  onInviteMember,
  canManageMembers = false,
  title,
  setTitle,
  onTitleBlur,
  savingTitle,
  description,
  setDescription,
  onSaveDescription,
  savingDesc,
  allAttachments,
  onUploadAttachment,
  onDeleteAttachment,
}) => {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handleInviteNewMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !onInviteMember) return;
    try {
      setInviting(true);
      setInviteStatus(null);
      await onInviteMember(inviteEmail.trim(), card._id);
      setInviteEmail("");
      setInviteStatus({ type: "success", message: "Invitation sent!" });
      setTimeout(() => setInviteStatus(null), 3500);
    } catch (err) {
      setInviteStatus({ type: "error", message: err.message || "Failed to invite" });
    } finally {
      setInviting(false);
    }
  };

  const handleCancelDescription = () => {
    setDescription(card.description || "");
    setIsEditingDescription(false);
  };

  const handleSave = async () => {
    await onSaveDescription();
    setIsEditingDescription(false);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await onUploadAttachment(card._id, file);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Title Section */}
      <div className="w-full">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={onTitleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          className="w-full rounded border border-transparent bg-transparent px-1 py-1 text-2xl font-bold text-slate-900 hover:border-slate-300 focus:border-blue-500 focus:bg-slate-50 dark:text-white dark:hover:border-[#3b424e] dark:focus:border-blue-500 dark:focus:bg-[#131518] focus:outline-none transition"
          placeholder="Card title"
        />
        {savingTitle && (
          <span className="text-[11px] text-blue-500 pl-1">Saving title...</span>
        )}
      </div>

      {/* Card Members & Invite Dropdown */}
      <CardMembersBar
        card={card}
        boardMembers={boardMembers}
        onToggleMember={onToggleMember}
        canManageMembers={canManageMembers}
        showDropdown={showMemberDropdown}
        setShowDropdown={setShowMemberDropdown}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        inviting={inviting}
        inviteStatus={inviteStatus}
        handleInviteNewMember={handleInviteNewMember}
      />

      {/* Description Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">Description</div>
          <div className="flex items-center gap-2">
            {/* File Upload button inside description */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-transparent dark:bg-[#2b313a] dark:text-[#c7d1db] dark:hover:bg-[#38404c] dark:hover:text-white transition shadow-sm"
            >
              <span>📎</span>
              <span>Upload file</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />

            {description && !isEditingDescription && (
              <button
                type="button"
                onClick={() => setIsEditingDescription(true)}
                className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-transparent dark:bg-[#2b313a] dark:text-[#c7d1db] dark:hover:bg-[#38404c] dark:hover:text-white transition shadow-sm"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Description textarea */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 focus-within:border-blue-500 focus-within:bg-white dark:border-[#373c44] dark:bg-[#16181c] transition">
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setIsEditingDescription(true);
            }}
            onFocus={() => setIsEditingDescription(true)}
            placeholder="Add a more detailed description..."
            rows={4}
            className="w-full resize-y bg-transparent text-sm text-slate-900 placeholder:text-slate-400 dark:text-white dark:placeholder-white/40 outline-none leading-relaxed"
          />
        </div>

        {/* Save / Cancel Description Controls */}
        {isEditingDescription && (
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={savingDesc}
              className="rounded bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition shadow-sm"
            >
              {savingDesc ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={handleCancelDescription}
              className="rounded px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Attachments Section */}
        <CardAttachmentsList
          allAttachments={allAttachments}
          cardId={card._id}
          onDeleteAttachment={onDeleteAttachment}
        />
      </div>
    </div>
  );
};

export default CardDescriptionSection;


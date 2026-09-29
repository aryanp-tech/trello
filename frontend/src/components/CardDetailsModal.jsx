import { useState } from "react";
import CardModalHeader from "./card/CardModalHeader";
import CardDescriptionSection from "./card/CardDescriptionSection";
import CardCommentsSection from "./card/CardCommentsSection";

const CardDetailsModal = ({
  card,
  board,
  columns = [],
  currentUser,
  onUpdateCard,
  onInviteMember,
  onUploadAttachment,
  onDeleteAttachment,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onDelete,
  onClose,
}) => {
  const [title, setTitle] = useState(card.title || "");
  const [description, setDescription] = useState(card.description || "");
  const [savingTitle, setSavingTitle] = useState(false);
  const [savingDesc, setSavingDesc] = useState(false);

  // Compute unique board members from board object
  const allBoardMembers = [];
  if (board?.createdBy) allBoardMembers.push(board.createdBy);
  if (Array.isArray(board?.members)) allBoardMembers.push(...board.members);

  const memberMap = new Map();
  for (const m of allBoardMembers) {
    const id = m?._id ? String(m._id) : String(m);
    if (id && !memberMap.has(id)) {
      memberMap.set(id, typeof m === "object" ? m : { _id: id, username: id });
    }
  }
  const effectiveBoardMembers = Array.from(memberMap.values());

  const cardOwnerId = String(card.createdBy?._id || card.createdBy || "");
  const boardOwnerId = String(board?.createdBy?._id || board?.createdBy || "");
  const currentUserId = String(currentUser?._id || currentUser?.id || "");
  const canManageMembers = Boolean(
    currentUserId && (currentUserId === boardOwnerId || currentUserId === cardOwnerId)
  );

  const handleToggleMember = async (memberId) => {
    if (!canManageMembers) return;
    const targetIdStr = String(memberId);
    // Card owner cannot be removed
    if (cardOwnerId && targetIdStr === cardOwnerId) return;

    const currentMemberIds = (card.members || []).map((m) => String(m?._id || m));
    const exists = currentMemberIds.includes(targetIdStr);
    const nextMembers = exists
      ? currentMemberIds.filter((id) => id !== targetIdStr)
      : [...currentMemberIds, memberId];
    await onUpdateCard(card._id, { members: nextMembers });
  };

  const [prevCard, setPrevCard] = useState({ id: card._id, title: card.title, description: card.description });
  if (card._id !== prevCard.id || card.title !== prevCard.title || card.description !== prevCard.description) {
    setPrevCard({ id: card._id, title: card.title, description: card.description });
    setTitle(card.title || "");
    setDescription(card.description || "");
  }

  // Current column
  const currentColumn =
    columns.find(
      (c) => c.id === card.list || c.label.toLowerCase() === (card.list || "").toLowerCase()
    ) || { id: card.list, label: card.list };

  // Save title on blur or Enter
  const handleTitleBlur = async () => {
    if (!title.trim() || title.trim() === card.title) {
      setTitle(card.title);
      return;
    }
    try {
      setSavingTitle(true);
      await onUpdateCard(card._id, { title: title.trim() });
    } catch (err) {
      console.error(err);
      setTitle(card.title);
    } finally {
      setSavingTitle(false);
    }
  };

  // Change list/column (supports selecting preset option or writing custom name)
  const handleSelectColumn = async (colIdOrName) => {
    if (!colIdOrName) return;
    if (
      colIdOrName === card.list ||
      colIdOrName === currentColumn?.id ||
      colIdOrName.toLowerCase?.() === currentColumn?.label?.toLowerCase?.()
    ) {
      return;
    }
    try {
      await onUpdateCard(card._id, { list: colIdOrName });
    } catch (err) {
      console.error(err);
    }
  };

  // Save description
  const handleSaveDescription = async () => {
    try {
      setSavingDesc(true);
      await onUpdateCard(card._id, { description: description.trim() });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingDesc(false);
    }
  };

  // Delete card with confirmation prompt
  const handleDeleteCard = async () => {
    if (window.confirm(`Delete card "${card.title}"? This cannot be undone.`)) {
      onDelete();
    }
  };

  // Collect all card attachments
  const allAttachments = [];
  if (card.attachments && Array.isArray(card.attachments) && card.attachments.length > 0) {
    allAttachments.push(...card.attachments);
  } else if (card.attachment?.url) {
    allAttachments.push(card.attachment);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto no-scrollbar"
      onClick={onClose}
    >
      <div
        className="relative my-6 flex w-full max-w-5xl flex-col rounded-xl border border-slate-200 bg-white text-slate-800 dark:border-[#373c44] dark:bg-[#1d2127] dark:text-[#d6d9dc] shadow-2xl overflow-hidden max-h-[92vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar header */}
        <CardModalHeader
          currentColumn={currentColumn}
          onSelectColumn={handleSelectColumn}
          onDeleteCard={handleDeleteCard}
          onClose={onClose}
        />

        {/* 2-Column body */}
        <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto p-4 sm:p-6 gap-6 flex-1 no-scrollbar">
          {/* Left Column: Title, clean description, in-description file upload & image */}
          <div className="md:col-span-7">
            <CardDescriptionSection
              card={card}
              boardMembers={effectiveBoardMembers}
              onToggleMember={handleToggleMember}
              onInviteMember={onInviteMember}
              canManageMembers={canManageMembers}
              title={title}
              setTitle={setTitle}
              onTitleBlur={handleTitleBlur}
              savingTitle={savingTitle}
              description={description}
              setDescription={setDescription}
              onSaveDescription={handleSaveDescription}
              savingDesc={savingDesc}
              allAttachments={allAttachments}
              onUploadAttachment={onUploadAttachment}
              onDeleteAttachment={onDeleteAttachment}
            />
          </div>

          {/* Right Column: Comments & Activity stream with rich toolbar */}
          <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-slate-200 dark:border-[#2d323b] md:pl-6 pt-4 md:pt-0">
            <CardCommentsSection
              card={card}
              boardMembers={effectiveBoardMembers}
              currentUser={currentUser}
              onAddComment={onAddComment}
              onUpdateComment={onUpdateComment}
              onDeleteComment={onDeleteComment}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetailsModal;

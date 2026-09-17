const CardDetailsModal = ({ card, onEdit, onDelete, onClose }) => {
  const renderAttachment = () => {
    if (!card.attachment?.url) return null;
    if (card.attachment.mimeType?.startsWith("image/")) {
      return (
        <img
          src={card.attachment.url}
          alt={card.attachment.originalName}
          className="max-h-64 w-full rounded-md object-contain"
        />
      );
    }
    return (
      <a
        href={card.attachment.url}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-[#65a6ff] underline"
      >
        {card.attachment.originalName}
      </a>
    );
  };

  //for individual card details like each note, allowing users to view, edit, or delete the card, as well as view any attachments associated with it
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <article
        className="w-full max-w-xl rounded-xl bg-[#28292c] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold">{card.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xl text-white/60 hover:text-white"
            aria-label="Close card"
          >
            ×
          </button>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6 text-white/80">
          {card.description || "No description added."}
        </p>
        {card.attachment?.url && (
          <div className="mt-5">{renderAttachment()}</div>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="mr-2 mt-6 rounded-md bg-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/15"
        >
          Edit card
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="mt-6 rounded-md bg-red-500/20 px-3 py-2 text-sm text-red-200 hover:bg-red-500/30"
        >
          Delete card
        </button>
      </article>
    </div>
  );
};

export default CardDetailsModal;

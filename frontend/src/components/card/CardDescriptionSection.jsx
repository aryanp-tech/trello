import { useRef, useState } from "react";
import { formatFileSize, formatTimestamp } from "./cardUtils";

//component for card description section, including title, description, and attachments

const CardDescriptionSection = ({
  card,
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
  const fileInputRef = useRef(null);

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

  // Filter image attachments and non-image attachments
  const imageAttachments = allAttachments.filter(
    (att) =>
      att.mimeType?.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp)$/i.test(att.fileName || att.originalName)
  );

  const otherAttachments = allAttachments.filter(
    (att) =>
      !(
        att.mimeType?.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|webp)$/i.test(att.fileName || att.originalName)
      )
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Title Section (Clean, no emoji) */}
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
          className="w-full rounded border border-transparent bg-transparent px-1 py-1 text-2xl font-bold text-white transition hover:border-[#3b424e] focus:border-blue-500 focus:bg-[#131518] focus:outline-none"
          placeholder="Card title"
        />
        {savingTitle && (
          <span className="text-[11px] text-blue-400 pl-1">Saving title...</span>
        )}
      </div>

      {/* Description Section (directly after title, simple & clean, no formatting toolbar) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Description</div>
          <div className="flex items-center gap-2">
           
            {/* File Upload button inside description */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 rounded bg-[#2b313a] px-2.5 py-1 text-xs text-[#c7d1db] hover:bg-[#38404c] hover:text-white transition"
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
                className="rounded bg-[#2b313a] px-2.5 py-1 text-xs text-[#c7d1db] hover:bg-[#38404c] hover:text-white transition"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/*  description textarea  */}
        <div className="rounded-lg border border-[#373c44] bg-[#16181c] p-3 focus-within:border-blue-500 transition">
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setIsEditingDescription(true);
            }}
            onFocus={() => setIsEditingDescription(true)}
            placeholder="Add a more detailed description..."
            rows={4}
            className="w-full resize-y bg-transparent text-sm text-white placeholder-white/40 outline-none leading-relaxed"
          />
        </div>

        {/* Save / Cancel Description Controls */}
        {isEditingDescription && (
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={savingDesc}
              className="rounded bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition"
            >
              {savingDesc ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={handleCancelDescription}
              className="rounded px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Display attached image(s) directly inside description section prominently */}
        {imageAttachments.length > 0 && (
          <div className="mt-3 flex flex-col gap-3">
            <div className="text-xs font-medium text-white/70">Attached Image</div>
            {imageAttachments.map((imgAtt, idx) => (
              <div
                key={imgAtt._id || idx}
                className="group relative w-full overflow-hidden rounded-xl border border-[#343942] bg-black/40 flex items-center justify-center p-1"
              >
                <img
                  src={imgAtt.url}
                  alt={imgAtt.originalName || "Description image"}
                  className="max-h-96 w-full rounded-lg object-contain"
                />
                <button
                  type="button"
                  onClick={() =>
                    onDeleteAttachment(card._id, imgAtt._id || imgAtt.fileName)
                  }
                  className="absolute top-3 right-3 rounded bg-black/75 px-2.5 py-1 text-xs font-medium text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition"
                  title="Remove image"
                >
                  Delete image
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Other attached files (PDF, ZIP, DOC, etc.) inside description */}
        {otherAttachments.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            <div className="text-xs font-medium text-white/70">Attached Files</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {otherAttachments.map((att, idx) => {
                const attId = att._id || att.fileName || idx;
                return (
                  <div
                    key={attId}
                    className="flex items-center gap-2.5 rounded-lg border border-[#343942] bg-[#16181c] p-2.5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#2b313a] text-[11px] font-bold text-blue-300 uppercase">
                      {att.originalName?.split(".").pop()?.slice(0, 4) || "FILE"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-medium text-white">
                        {att.originalName || att.fileName || "File"}
                      </p>
                      <p className="text-[11px] text-white/50">
                        {formatFileSize(att.size)} • {formatTimestamp(att.createdAt)}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-[11px]">
                        {att.url && (
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            download={att.originalName}
                            className="text-blue-400 hover:underline"
                          >
                            Download
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteAttachment(card._id, att._id || att.fileName)}
                          className="text-red-400 hover:underline"
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
    </div>
  );
};

export default CardDescriptionSection;


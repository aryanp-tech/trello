// Format file size nicely
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Format timestamp relatively (just now, 5m ago, etc.)
export const formatTimestamp = (dateString) => {
  if (!dateString) return "just now";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
  });
};

// Standard 4 preset options for cards - only these 4 are suggested
export const PRESET_OPTIONS = ["Do", "Doing", "To Be Done", "Final"];

// Only return the exact 4 suggestions - never add any extra columns
export const getMergedColumnOptions = () => [
  { id: "do", label: "Do" },
  { id: "doing", label: "Doing" },
  { id: "to-be-done", label: "To Be Done" },
  { id: "final", label: "Final" },
];

// Clean & format status/column labels nicely, eliminating legacy timestamp IDs
export const formatStatusLabel = (val) => {
  if (!val) return "List";
  const str = String(val).trim();
  if (/^\d+$/.test(str)) return "Do";
  const clean = str.replace(/[-_]\d+$/, "").trim();
  const lower = clean.toLowerCase();
  if (lower === "do" || lower === "todo") return "Do";
  if (lower === "doing") return "Doing";
  if (lower === "to-be-done" || lower === "to be done") return "To Be Done";
  if (lower === "final" || lower === "done") return "Final";
  return clean || "Do";
};

// Helper to determine if a status is custom (not one of the 4 standard suggestions)
export const isCustomStatus = (statusOrColumn) => {
  if (!statusOrColumn) return false;
  const raw = typeof statusOrColumn === "string"
    ? statusOrColumn
    : (statusOrColumn.label || statusOrColumn.id || "");
  const normalized = formatStatusLabel(raw);
  return !["Do", "Doing", "To Be Done", "Final"].includes(normalized);
};

// Extract media cover and counts for card preview
export const getCardDetailsSummary = (card) => {
  if (!card) {
    return {
      coverImageUrl: null,
      commentsCount: 0,
      attachmentsCount: 0,
      hasDescription: false,
    };
  }

  const allAttachments = Array.isArray(card.attachments)
    ? card.attachments
    : card.attachment?.url
    ? [card.attachment]
    : [];

  const imageAttachment = allAttachments.find(
    (att) =>
      att?.mimeType?.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|avif)$/i.test(
        att?.fileName || att?.originalName || att?.url || ""
      )
  );

  const videoAttachment = allAttachments.find(
    (att) =>
      att?.mimeType?.startsWith("video/") ||
      /\.(mp4|webm|ogg|mov|m4v|mkv)$/i.test(
        att?.fileName || att?.originalName || att?.url || ""
      )
  );

  return {
    coverImageUrl: card.coverImage || card.cover || imageAttachment?.url || null,
    coverVideoUrl: videoAttachment?.url || null,
    commentsCount: Array.isArray(card.comments) ? card.comments.length : 0,
    attachmentsCount: allAttachments.length,
    hasDescription: Boolean(card.description && card.description.trim()),
  };
};

// Helper for user initials
export const getInitials = (name) => {
  if (!name) return "U";
  return name.slice(0, 2).toUpperCase();
};

// Helper for avatar background colors
export const getAvatarColor = (name = "") => {
  const colors = [
    "bg-blue-600",
    "bg-emerald-600",
    "bg-purple-600",
    "bg-amber-600",
    "bg-pink-600",
    "bg-cyan-600",
    "bg-indigo-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Safely resolve attachment URLs (handles relative paths, localhost differences, etc.)
export const getFullAttachmentUrl = (url = "") => {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const host = typeof window !== "undefined" && window.location ? window.location.hostname : "localhost";
  return `http://${host}:5000${cleanPath}`;
};

// Safe in-place download via blob to avoid cross-origin navigation
export const downloadFileBlob = async (rawUrl, fallbackName = "download") => {
  const url = getFullAttachmentUrl(rawUrl);
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fallbackName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.warn("Direct blob download failed, falling back:", err.message);
    const a = document.createElement("a");
    a.href = url;
    a.download = fallbackName;
    a.target = "_self";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};



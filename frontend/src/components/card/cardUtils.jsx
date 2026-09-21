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

// Standard preset options for cards
export const PRESET_OPTIONS = ["Do", "Doing", "To Be Done", "Final"];

// Merge board columns with preset options so Do, Doing, To Be Done, Final are always available
export const getMergedColumnOptions = (columns = []) => {
  const mergedOptions = [];
  const addedLabels = new Set();

  PRESET_OPTIONS.forEach((preset) => {
    const existing = columns.find(
      (col) =>
        col.id?.toLowerCase() === preset.toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
        col.label?.toLowerCase() === preset.toLowerCase()
    );
    if (existing) {
      mergedOptions.push(existing);
      addedLabels.add(existing.label.toLowerCase());
    } else {
      mergedOptions.push({
        id: preset.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        label: preset,
      });
      addedLabels.add(preset.toLowerCase());
    }
  });

  columns.forEach((col) => {
    if (col?.label && !addedLabels.has(col.label.toLowerCase())) {
      mergedOptions.push(col);
      addedLabels.add(col.label.toLowerCase());
    }
  });

  return mergedOptions;
};

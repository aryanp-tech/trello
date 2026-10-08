const fs = require('fs/promises');
const path = require('path');
const Board = require('../models/board.model');

const getUserId = (req) => req.user._id || req.user.id;

// Remove uploaded file from uploads folder
const removeUploadedFile = async (fileName) => {
  if (!fileName) return;
  try {
    await fs.unlink(path.join(__dirname, '..', 'uploads', fileName));
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Remove card file error:', error);
  }
};

// Build attachment object from multer file
const buildAttachment = (file, req) => {
  if (!file) return undefined;
  return {
    originalName: file.originalname,
    fileName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
  };
};

// Find board by ID and user access
const findUserBoard = (boardId, userId) =>
  Board.findOne({
    _id: boardId,
    $or: [{ createdBy: userId }, { members: userId }],
  });

// Clean column ID without random numbers or timestamps
const toColumnId = (str) =>
  String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'do';

// Resolve column from name or ID, auto-creating it on the board if it doesn't exist
const resolveOrCreateColumn = async (board, listNameOrId) => {
  if (!listNameOrId || typeof listNameOrId !== 'string' || !listNameOrId.trim()) {
    return { column: board.columns[0] || { id: 'do', label: 'Do' }, boardUpdated: false };
  }

  const trimmed = listNameOrId.trim();
  let matchedCol = board.columns.find(
    (col) => col.id === trimmed || col.label.toLowerCase() === trimmed.toLowerCase()
  );

  if (matchedCol) {
    return { column: matchedCol, boardUpdated: false };
  }

  // Clean slug without random numbers or timestamps
  const newColId = toColumnId(trimmed);
  matchedCol = board.columns.find((col) => col.id === newColId);
  if (matchedCol) {
    return { column: matchedCol, boardUpdated: false };
  }

  matchedCol = { id: newColId, label: trimmed };
  board.columns.push(matchedCol);
  await board.save();

  return { column: matchedCol, boardUpdated: true };
};

module.exports = {
  getUserId,
  removeUploadedFile,
  buildAttachment,
  findUserBoard,
  toColumnId,
  resolveOrCreateColumn,
};

const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const Board = require('../models/board.model');
const Card = require('../models/card.models');

const getUserId = (req) => req.user._id;

//  remove uploaded file
const removeUploadedFile = async (fileName) => {
  if (!fileName) return;

  try {
    await fs.unlink(path.join(__dirname, '..', 'uploads', fileName));
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Remove card file error:', error);
  }
};

//  build attachment object
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

//  find board by id and user access
const findUserBoard = (boardId, userId) => Board.findOne({
  _id: boardId,
  $or: [{ createdBy: userId }, { members: userId }],
});


// Create a new card
const createCard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { title, description, list } = req.body;

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(400).json({ message: 'Invalid board ID' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Card title is required' });
    }

    const board = await findUserBoard(boardId, getUserId(req));
    if (!board) return res.status(404).json({ message: 'Board not found' });
    const firstColumn = board.columns[0]?.id || 'todo';

    const card = await Card.create({
      board: boardId,
      createdBy: getUserId(req),
      title: title.trim(),
      description: description?.trim() || '',
      list: board.columns.some((column) => column.id === list) ? list : firstColumn,
      position: 0,
      attachment: buildAttachment(req.file, req),
    });

    return res.status(201).json({ message: 'Card created successfully', card });
  } catch (error) {
    console.error('Create card error:', error);
    return res.status(500).json({ message: 'Error creating card', error: error.message });
  }
};

// Get all cards for a specific board
const getBoardCards = async (req, res) => {
  try {
    const { boardId } = req.params;
    const board = await findUserBoard(boardId, getUserId(req));
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const cards = await Card.find({ board: boardId }).sort({ position: 1, createdAt: -1 });
    return res.status(200).json({ cards });
  } catch (error) {
    console.error('Get cards error:', error);
    return res.status(500).json({ message: 'Error fetching cards', error: error.message });
  }
};

// Update an existing card
const updateCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { title, description, list, position } = req.body;
    const card = await Card.findOne({ _id: cardId });

    if (!card) return res.status(404).json({ message: 'Card not found' });
    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ message: 'Card title cannot be empty' });
    }

    const oldFileName = card.attachment?.fileName;
    if (title !== undefined) card.title = title.trim();
    if (description !== undefined) card.description = description.trim();
    const board = await findUserBoard(card.board, getUserId(req));
    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (list !== undefined && board.columns.some((column) => column.id === list)) card.list = list;
    if (position !== undefined && Number.isFinite(Number(position))) card.position = Number(position);
    if (req.file) card.attachment = buildAttachment(req.file, req);

    await card.save();
    if (req.file && oldFileName) await removeUploadedFile(oldFileName);

    return res.status(200).json({ message: 'Card updated successfully', card });
  } catch (error) {
    console.error('Update card error:', error);
    return res.status(500).json({ message: 'Error updating card', error: error.message });
  }
};

// Delete a card
const deleteCard = async (req, res) => {
  try {
    const card = await Card.findOne({ _id: req.params.cardId });
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const board = await findUserBoard(card.board, getUserId(req));
    if (!board) return res.status(404).json({ message: 'Card not found' });

    await Card.deleteOne({ _id: card._id });
    await removeUploadedFile(card.attachment?.fileName);
    return res.status(200).json({ message: 'Card deleted successfully', card });
  } catch (error) {
    console.error('Delete card error:', error);
    return res.status(500).json({ message: 'Error deleting card', error: error.message });
  }
};

module.exports = {
  createCard,
  getBoardCards,
  updateCard,
  deleteCard,
};

const Card = require('../models/card.models');
const {
  getUserId,
  findUserBoard,
  toColumnId,
} = require('../utils/card.utils');

// Create a new column on a board
const createColumn = async (req, res) => {
  try {
    const boardId = req.params.boardId || req.params.id;
    const { label } = req.body;

    if (!label || !label.trim()) {
      return res.status(400).json({ message: 'Column label is required' });
    }

    const board = await findUserBoard(boardId, getUserId(req));
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const trimmedLabel = label.trim();
    const existing = board.columns.find(
      (c) => c.label.toLowerCase() === trimmedLabel.toLowerCase()
    );
    if (existing) {
      return res.status(409).json({ message: 'A column with this name already exists', column: existing, board });
    }

    const columnId = toColumnId(trimmedLabel);
    const newColumn = { id: columnId, label: trimmedLabel };
    board.columns.push(newColumn);
    await board.save();

    return res.status(201).json({
      message: 'Column created successfully',
      column: newColumn,
      board,
    });
  } catch (error) {
    console.error('Create column error:', error);
    return res.status(500).json({ message: 'Error creating column', error: error.message });
  }
};

// Delete a column and all cards inside it
const deleteColumn = async (req, res) => {
  try {
    const boardId = req.params.boardId || req.params.id;
    const { columnId } = req.params;

    const board = await findUserBoard(boardId, getUserId(req));
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const columnExists = board.columns.some((column) => column.id === columnId);
    if (!columnExists) return res.status(404).json({ message: 'Column not found' });

    board.columns = board.columns.filter((column) => column.id !== columnId);
    await board.save();
    await Card.deleteMany({ board: board._id, list: columnId });

    return res.status(200).json({
      message: 'Column and its cards deleted successfully',
      board,
    });
  } catch (error) {
    console.error('Delete column error:', error);
    return res.status(500).json({ message: 'Error deleting column', error: error.message });
  }
};

module.exports = {
  createColumn,
  deleteColumn,
};

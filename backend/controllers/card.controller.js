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
    const firstColumn = board.columns[0]?.id || 'do';

    let targetList = firstColumn;
    let boardUpdated = false;
    if (list && typeof list === 'string' && list.trim()) {
      const trimmedList = list.trim();
      let matchedCol = board.columns.find(
        (column) => column.id === trimmedList || column.label.toLowerCase() === trimmedList.toLowerCase()
      );
      if (!matchedCol) {
        const newColId = `${trimmedList.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
        matchedCol = { id: newColId, label: trimmedList };
        board.columns.push(matchedCol);
        await board.save();
        boardUpdated = true;
      }
      targetList = matchedCol.id;
    }

    const attachmentObj = buildAttachment(req.file, req);
    const card = await Card.create({
      board: boardId,
      createdBy: getUserId(req),
      title: title.trim(),
      description: description?.trim() || '',
      list: targetList,
      position: 0,
      attachment: attachmentObj,
      attachments: attachmentObj ? [attachmentObj] : [],
      activities: [
        {
          text: `created this card`,
          user: req.user.username || 'User',
          createdAt: new Date(),
        },
      ],
    });

    return res.status(201).json({
      message: 'Card created successfully',
      card,
      board: boardUpdated ? board : undefined,
    });
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

    if (title !== undefined) card.title = title.trim();
    if (description !== undefined) card.description = description.trim();
    const board = await findUserBoard(card.board, getUserId(req));
    if (!board) return res.status(404).json({ message: 'Board not found' });

    let boardUpdated = false;
    if (list !== undefined && typeof list === 'string' && list.trim()) {
      const trimmedList = list.trim();
      let matchedCol = board.columns.find(
        (column) => column.id === trimmedList || column.label.toLowerCase() === trimmedList.toLowerCase()
      );
      if (!matchedCol) {
        const newColId = `${trimmedList.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
        matchedCol = { id: newColId, label: trimmedList };
        board.columns.push(matchedCol);
        await board.save();
        boardUpdated = true;
      }

      if (card.list !== matchedCol.id) {
        card.activities = card.activities || [];
        card.activities.push({
          text: `moved this card to ${matchedCol.label}`,
          user: req.user.username || 'User',
          createdAt: new Date(),
        });
      }
      card.list = matchedCol.id;
    }

    if (position !== undefined && Number.isFinite(Number(position))) card.position = Number(position);
    if (req.file) {
      const newAttachment = buildAttachment(req.file, req);
      card.attachment = newAttachment;
      card.attachments = card.attachments || [];
      card.attachments.push(newAttachment);
    }

    await card.save();

    return res.status(200).json({
      message: 'Card updated successfully',
      card,
      board: boardUpdated ? board : undefined,
    });
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
    if (!board) return res.status(404).json({ message: 'Board not found' });

    await Card.deleteOne({ _id: card._id });
    if (card.attachment?.fileName) {
      await removeUploadedFile(card.attachment.fileName);
    }
    if (card.attachments && Array.isArray(card.attachments)) {
      for (const att of card.attachments) {
        if (att.fileName && att.fileName !== card.attachment?.fileName) {
          await removeUploadedFile(att.fileName);
        }
      }
    }
    return res.status(200).json({ message: 'Card deleted successfully', card });
  } catch (error) {
    console.error('Delete card error:', error);
    return res.status(500).json({ message: 'Error deleting card', error: error.message });
  }
};

// Add comment (supports text and optional file)
const addComment = async (req, res) => {
  try {
    const card = await Card.findOne({ _id: req.params.cardId });
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const board = await findUserBoard(card.board, getUserId(req));
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const text = req.body.text?.trim() || '';
    if (!text && !req.file) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    const commentData = {
      text,
      author: getUserId(req),
      authorName: req.user.username || 'User',
      createdAt: new Date(),
    };

    if (req.file) {
      commentData.attachment = buildAttachment(req.file, req);
    }

    card.comments.push(commentData);
    await card.save();

    return res.status(201).json({ message: 'Comment added successfully', card });
  } catch (error) {
    console.error('Add comment error:', error);
    return res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

// Update comment
const updateComment = async (req, res) => {
  try {
    const { cardId, commentId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text cannot be empty' });
    }

    const card = await Card.findOne({ _id: cardId });
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const board = await findUserBoard(card.board, getUserId(req));
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const comment = card.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.author.toString() !== getUserId(req).toString()) {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }

    comment.text = text.trim();
    comment.updatedAt = new Date();
    await card.save();

    return res.status(200).json({ message: 'Comment updated successfully', card });
  } catch (error) {
    console.error('Update comment error:', error);
    return res.status(500).json({ message: 'Error updating comment', error: error.message });
  }
};

// Delete comment
const deleteComment = async (req, res) => {
  try {
    const { cardId, commentId } = req.params;
    const card = await Card.findOne({ _id: cardId });
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const board = await findUserBoard(card.board, getUserId(req));
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const comment = card.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.attachment?.fileName) {
      await removeUploadedFile(comment.attachment.fileName);
    }

    card.comments.pull({ _id: commentId });
    await card.save();

    return res.status(200).json({ message: 'Comment deleted successfully', card });
  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};

// Upload attachment to card
const uploadAttachment = async (req, res) => {
  try {
    const { cardId } = req.params;
    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    const card = await Card.findOne({ _id: cardId });
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const board = await findUserBoard(card.board, getUserId(req));
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const newAttachment = buildAttachment(req.file, req);
    card.attachment = newAttachment;
    card.attachments = card.attachments || [];
    card.attachments.push(newAttachment);
    await card.save();

    return res.status(200).json({ message: 'Attachment uploaded successfully', card });
  } catch (error) {
    console.error('Upload attachment error:', error);
    return res.status(500).json({ message: 'Error uploading attachment', error: error.message });
  }
};

// Delete attachment from card
const deleteAttachment = async (req, res) => {
  try {
    const { cardId, attachmentId } = req.params;
    const card = await Card.findOne({ _id: cardId });
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const board = await findUserBoard(card.board, getUserId(req));
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const attIndex = (card.attachments || []).findIndex((a) => a._id?.toString() === attachmentId || a.fileName === attachmentId);
    if (attIndex !== -1) {
      const [removed] = card.attachments.splice(attIndex, 1);
      if (removed.fileName) await removeUploadedFile(removed.fileName);
    }

    if (card.attachment?.fileName === attachmentId || card.attachment?._id?.toString() === attachmentId) {
      card.attachment = card.attachments?.[0] || undefined;
    }

    await card.save();
    return res.status(200).json({ message: 'Attachment deleted successfully', card });
  } catch (error) {
    console.error('Delete attachment error:', error);
    return res.status(500).json({ message: 'Error deleting attachment', error: error.message });
  }
};

module.exports = {
  createCard,
  getBoardCards,
  updateCard,
  deleteCard,
  addComment,
  updateComment,
  deleteComment,
  uploadAttachment,
  deleteAttachment,
};



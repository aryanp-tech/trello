const mongoose = require('mongoose');
const Card = require('../models/card.models');
const User = require('../models/user.model');
const { sendCardMentionEmail } = require('../services/mail.service');
const {
  getUserId,
  removeUploadedFile,
  buildAttachment,
  findUserBoard,
  toColumnId,
  resolveOrCreateColumn,
} = require('../utils/card.utils');


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

    const { column, boardUpdated } = await resolveOrCreateColumn(board, list);
    const attachment = buildAttachment(req.file, req);

    const isCustomStatus = !['do', 'doing', 'to-be-done', 'final'].includes(column.id);
    const activityText = isCustomStatus
      ? `created this card with custom status "${column.label}"`
      : `created this card`;

    const userId = getUserId(req);
    const card = await Card.create({
      board: boardId,
      createdBy: userId,
      members: [userId],
      title: title.trim(),
      description: description?.trim() || '',
      list: column.id,
      position: 0,
      attachment,
      attachments: attachment ? [attachment] : [],
      activities: [
        {
          text: activityText,
          user: req.user.username || 'User',
          createdAt: new Date(),
        },
      ],
    });
    await card.populate('members', 'username email');
    await card.populate('createdBy', 'username email');

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

    const cards = await Card.find({ board: boardId })
      .populate('members', 'username email')
      .populate('createdBy', 'username email')
      .sort({ position: 1, createdAt: -1 });

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
    const { title, description, list, position, members } = req.body;
    const card = await Card.findOne({ _id: cardId });

    if (!card) return res.status(404).json({ message: 'Card not found' });
    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ message: 'Card title cannot be empty' });
    }

    const board = await findUserBoard(card.board, getUserId(req));
    if (!board) return res.status(404).json({ message: 'Board not found' });

    if (title !== undefined) card.title = title.trim();
    if (description !== undefined) card.description = description.trim();
    if (members !== undefined && Array.isArray(members)) {
      const userId = getUserId(req).toString();
      const isCardOwner = String(card.createdBy?._id || card.createdBy) === userId;
      const isBoardOwner = board.createdBy.toString() === userId;
      if (!isCardOwner && !isBoardOwner) {
        return res.status(403).json({ message: 'Only the board owner can add or remove members' });
      }

      const ownerIdStr = String(card.createdBy?._id || card.createdBy);
      const hasOwner = members.some((m) => String(m?._id || m) === ownerIdStr);
      card.members = hasOwner ? members : [card.createdBy, ...members];
    }

    let boardUpdated = false;
    if (list !== undefined) {
      const resolved = await resolveOrCreateColumn(board, list);
      boardUpdated = resolved.boardUpdated;
      if (card.list !== resolved.column.id) {
        const isCustomStatus = !['do', 'doing', 'to-be-done', 'final'].includes(resolved.column.id);
        const activityText = isCustomStatus
          ? `moved this card to custom status "${resolved.column.label}"`
          : `moved this card to ${resolved.column.label}`;
        card.activities = card.activities || [];
        card.activities.push({
          text: activityText,
          user: req.user.username || 'User',
          createdAt: new Date(),
        });
      }
      card.list = resolved.column.id;
    }

    if (position !== undefined && Number.isFinite(Number(position))) card.position = Number(position);
    if (req.file) {
      const newAttachment = buildAttachment(req.file, req);
      card.attachment = newAttachment;
      card.attachments = card.attachments || [];
      card.attachments.push(newAttachment);
    }

    await card.save();
    await card.populate('members', 'username email');
    await card.populate('createdBy', 'username email');

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

// Helper: detect @username mentions and email tagged users with a direct card link
const notifyMentionedUsers = async ({ text, card, board, req }) => {
  if (!text) return;
  const mentionMatches = text.match(/(?:^|\s)@([a-zA-Z0-9._-]+)/g);
  if (!mentionMatches || mentionMatches.length === 0) return;

  const usernames = [
    ...new Set(mentionMatches.map((m) => m.trim().replace(/^@/, '').toLowerCase())),
  ];

  const currentUserId = getUserId(req)?.toString();
  const mentionedUsers = await User.find({
    username: { $in: usernames.map((u) => new RegExp(`^${u}$`, 'i')) },
    _id: { $ne: currentUserId },
  }).select('username email');

  if (mentionedUsers && mentionedUsers.length > 0) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const cardUrl = `${frontendUrl}/boards/${card.board}?cardId=${card._id}`;
    const mentionerName = req.user?.username || 'A team member';
    const boardTitle = board?.title || 'Board';
    const cardTitle = card?.title || 'Card';

    mentionedUsers.forEach((user) => {
      sendCardMentionEmail({
        recipient: user.email,
        mentionerName,
        boardTitle,
        cardTitle,
        commentText: text,
        cardUrl,
      });
    });
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

    // Insert new comment at 0th position in MongoDB
    const updatedCard = await Card.findByIdAndUpdate(
      card._id,
      {
        $push: {
          comments: {
            $each: [commentData],
            $position: 0,
          },
        },
      },
      { returnDocument: 'after' }
    ).populate('members', 'username email');

    // Notify any mentioned users via email (non-blocking)
    notifyMentionedUsers({ text, card: updatedCard, board, req }).catch((err) =>
      console.warn('Mention notification error:', err.message)
    );

    return res.status(201).json({ message: 'Comment added successfully', card: updatedCard });
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
    await card.populate('members', 'username email');

    // Notify any mentioned users via email (non-blocking)
    notifyMentionedUsers({ text: comment.text, card, board, req }).catch((err) =>
      console.warn('Mention notification error on update:', err.message)
    );

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
    await card.populate('members', 'username email');

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
    await card.populate('members', 'username email');

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
    await card.populate('members', 'username email');
    return res.status(200).json({ message: 'Attachment deleted successfully', card });
  } catch (error) {
    console.error('Delete attachment error:', error);
    return res.status(500).json({ message: 'Error deleting attachment', error: error.message });
  }
};

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

// Reorder / move cards on a board
const reorderCards = async (req, res) => {
  try {
    const boardId = req.params.boardId || req.params.id;
    const board = await findUserBoard(boardId, getUserId(req));
    if (!board) return res.status(404).json({ message: 'Board not found' });

    // Mode A: Targeted single card move: { cardId, targetColumnId, newPosition, sourceColumnId }
  
    const cardId = req.body.cardId || req.body._id;
    if (cardId) {
      const card = await Card.findOne({ _id: cardId, board: boardId }).select('_id list position');
      if (!card) return res.status(404).json({ message: 'Card not found' });

      const fromList = req.body.sourceColumnId || card.list;
      const toList = req.body.targetColumnId || req.body.list || card.list;
      const oldPos = Number.isFinite(card.position) ? card.position : 0;
      const newPos = Number.isFinite(req.body.newPosition)
        ? Math.max(0, req.body.newPosition)
        : (Number.isFinite(req.body.position) ? Math.max(0, req.body.position) : 0);

      // Perform all shifting directly at MongoDB engine level (no documents fetched into JS memory)
      if (fromList === toList) {
        // Reordering within same column:
        if (oldPos < newPos) {
          // Moved DOWN: shift intermediate cards UP (-1) directly at DB level
          await Card.updateMany(
            {
              board: boardId,
              list: toList,
              _id: { $ne: card._id },
              position: { $gt: oldPos, $lte: newPos },
            },
            { $inc: { position: -1 } }
          );
        } else if (oldPos > newPos) {
          // Moved UP: shift intermediate cards DOWN (+1) directly at DB level
          await Card.updateMany(
            {
              board: boardId,
              list: toList,
              _id: { $ne: card._id },
              position: { $gte: newPos, $lt: oldPos },
            },
            { $inc: { position: 1 } }
          );
        }

        // Set the moved card's final position directly in DB
        if (oldPos !== newPos) {
          await Card.updateOne(
            { _id: card._id },
            { $set: { position: newPos } }
          );
        }
      } else {
        // Moving across columns directly at DB level:
        // 1. In source column: close gap by decrementing cards with position > oldPos
        await Card.updateMany(
          {
            board: boardId,
            list: fromList,
            _id: { $ne: card._id },
            position: { $gt: oldPos },
          },
          { $inc: { position: -1 } }
        );

        // 2. In target column: open slot by incrementing cards with position >= newPos
        await Card.updateMany(
          {
            board: boardId,
            list: toList,
            _id: { $ne: card._id },
            position: { $gte: newPos },
          },
          { $inc: { position: 1 } }
        );

        // 3. Update the moved card's list and position directly in DB
        await Card.updateOne(
          { _id: card._id },
          { $set: { list: toList, position: newPos } }
        );
      }

      return res.status(200).json({ message: 'Card position updated successfully' });
    }

    // Mode B: Array mode for bulk updates (backward compatibility)
    const { cards: cardUpdates } = req.body;
    if (Array.isArray(cardUpdates)) {
      const bulkOps = cardUpdates.map((item) => ({
        updateOne: {
          filter: { _id: item._id, board: boardId },
          update: {
            $set: {
              ...(item.list ? { list: item.list } : {}),
              ...(Number.isFinite(item.position) ? { position: item.position } : {}),
            },
          },
        },
      }));

      if (bulkOps.length > 0) {
        await Card.bulkWrite(bulkOps);
      }

      return res.status(200).json({ message: 'Cards reordered successfully' });
    }

    return res.status(400).json({ message: 'cardId with targetColumnId/newPosition or cards array is required' });
  } catch (error) {
    console.error('Reorder cards error:', error);
    return res.status(500).json({ message: 'Error reordering cards', error: error.message });
  }
};


module.exports = {
  createCard,
  getBoardCards,
  updateCard,
  deleteCard,
  reorderCards,
  createColumn,
  deleteColumn,
  addComment,
  updateComment,
  deleteComment,
  uploadAttachment,
  deleteAttachment,
};

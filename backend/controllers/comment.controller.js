const Card = require('../models/card.models');
const User = require('../models/user.model');
const { sendCardMentionEmail } = require('../services/mail.service');
const {
  getUserId,
  removeUploadedFile,
  buildAttachment,
  findUserBoard,
} = require('../utils/card.utils');

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

module.exports = {
  addComment,
  updateComment,
  deleteComment,
  notifyMentionedUsers,
};

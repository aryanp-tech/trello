const Card = require('../models/card.models');
const {
  getUserId,
  removeUploadedFile,
  buildAttachment,
  findUserBoard,
} = require('../utils/card.utils');

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
    card.attachments = card.attachments || [];
    card.attachments.push(newAttachment);
    await card.save();
    await card.populate('members createdBy', 'username email');

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

    const decodedId = decodeURIComponent(attachmentId || '');
    let fileToDelete = null;

    const matchesTarget = (a) => {
      if (!a) return false;
      const strId = a._id?.toString() || '';
      return (
        strId === attachmentId ||
        strId === decodedId ||
        a.fileName === attachmentId ||
        a.fileName === decodedId ||
        a.url === attachmentId ||
        a.url === decodedId ||
        a.originalName === attachmentId ||
        a.originalName === decodedId
      );
    };

    const remainingAttachments = (card.attachments || []).filter((a) => {
      if (matchesTarget(a)) {
        fileToDelete = fileToDelete || a.fileName;
        return false;
      }
      return true;
    });

    card.attachments = remainingAttachments;
    await card.save();
    await card.populate('members createdBy', 'username email');

    if (fileToDelete) {
      await removeUploadedFile(fileToDelete);
    }

    return res.status(200).json({ message: 'Attachment deleted successfully', card });
  } catch (error) {
    console.error('Delete attachment error:', error);
    return res.status(500).json({ message: 'Error deleting attachment', error: error.message });
  }
};

module.exports = {
  uploadAttachment,
  deleteAttachment,
};

const express = require('express');
const {
  createCard,
  getBoardCards,
  updateCard,
  deleteCard,
} = require('../controllers/card.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { uploadCardFile } = require('../middleware/upload.middleware');

const router = express.Router({ mergeParams: true });

// Create a new card
router.post('/', authMiddleware, uploadCardFile.single('file'), createCard);

// Get all cards for a specific board
router.get('/', authMiddleware, getBoardCards);

// Update an existing card
router.put('/:cardId', authMiddleware, uploadCardFile.single('file'), updateCard);

// Delete a card
router.delete('/:cardId', authMiddleware, deleteCard);

module.exports = router;

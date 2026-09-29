const express = require('express');
const {
  createBoard,
  getAllBoards,
  updateBoard,
  deleteBoard,
  inviteBoardMember,
  acceptBoardInvite,
  removeBoardMember,
} = require('../controllers/board.controller');
const {
  createColumn,
  deleteColumn,
} = require('../controllers/card.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Create board
router.post('/', authMiddleware, createBoard);

// Get all boards
router.get('/', authMiddleware, getAllBoards);

// Update board
router.put('/:id', authMiddleware, updateBoard);

// Board column management (routed to card.controller)
router.post('/:id/columns', authMiddleware, createColumn);
router.delete('/:id/columns/:columnId', authMiddleware, deleteColumn);

// Board member management (owner only for add/remove)
router.post('/:id/invites', authMiddleware, inviteBoardMember);
router.get('/invites/:token', authMiddleware, acceptBoardInvite);
router.delete('/:id/members/:memberId', authMiddleware, removeBoardMember);

// Delete board
router.delete('/:id', authMiddleware, deleteBoard);

module.exports = router;

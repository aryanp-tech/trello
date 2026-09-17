const express = require('express');
const { createBoard, getAllBoards, updateBoard, deleteBoard, deleteBoardColumn, inviteBoardMember, acceptBoardInvite } = require('../controllers/board.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

//create board
router.post('/', authMiddleware, createBoard);

//get all boards
router.get('/', authMiddleware, getAllBoards);

//update board
router.put('/:id', authMiddleware, updateBoard);
router.delete('/:id/columns/:columnId', authMiddleware, deleteBoardColumn);
router.post('/:id/invites', authMiddleware, inviteBoardMember);
router.get('/invites/:token', authMiddleware, acceptBoardInvite);

//delete board
router.delete('/:id', authMiddleware, deleteBoard);

module.exports = router;

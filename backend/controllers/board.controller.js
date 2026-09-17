const Board = require('../models/board.model');
const Card = require('../models/card.models');
const User = require('../models/user.model');
const BoardInvite = require('../models/board-invite.model');
const crypto = require('crypto');
const { sendBoardInviteEmail } = require('../services/mail.service');

//  boards based on user access
const boardAccessFilter = (userId) => ({
    $or: [{ createdBy: userId }, { members: userId }],
});

// Create a new board
const createBoard = async (req, res) => {
    try {
        const { title, backgroundImage, backgroundColor, description } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Board title is required' });
        }

        const board = await Board.create({
            title: title.trim(),
            backgroundImage: backgroundImage || '',
            backgroundColor: backgroundColor || '#1d4ed8',
            description: description || '',
            columns: undefined,
            members: [req.user?._id || req.user?.id],
            createdBy: req.user?._id || req.user?.id,
        });

        return res.status(201).json({
            message: 'Board created successfully',
            board,
        });
    } catch (error) {
        console.error('Create board error:', error);
        return res.status(500).json({
            message: 'Error creating board',
            error: error.message,
        });
    }
};

// Get all boards accessible to the user
const getAllBoards = async (req, res) => {
    try {
        const boards = await Board.find(boardAccessFilter(req.user?._id || req.user?.id)).sort({ createdAt: -1 });
        return res.status(200).json({ boards });
    } catch (error) {
        console.error('Get boards error:', error);
        return res.status(500).json({
            message: 'Error fetching boards',
            error: error.message,
        });
    }
};

// Update an existing board
const updateBoard = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, backgroundImage, backgroundColor, description, isStarred } = req.body;

        const board = await Board.findOne({ _id: id, createdBy: req.user?._id || req.user?.id });

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        if (title !== undefined) board.title = title.trim();
        if (backgroundImage !== undefined) board.backgroundImage = backgroundImage;
        if (backgroundColor !== undefined) board.backgroundColor = backgroundColor;
        if (description !== undefined) board.description = description;
        if (isStarred !== undefined) board.isStarred = isStarred;
        if (Array.isArray(req.body.columns)) {
            board.columns = req.body.columns
                .filter((column) => column?.id && column?.label)
                .map((column) => ({ id: String(column.id), label: String(column.label).trim() }))
                .filter((column) => column.label);
        }

        await board.save();

        return res.status(200).json({
            message: 'Board updated successfully',
            board,
        });
    } catch (error) {
        console.error('Update board error:', error);
        return res.status(500).json({
            message: 'Error updating board',
            error: error.message,
        });
    }
};

// Delete a column and all cards inside it
const deleteBoardColumn = async (req, res) => {
    try {
        const { id, columnId } = req.params;
        const board = await Board.findOne({ _id: id, createdBy: req.user?._id || req.user?.id });

        if (!board) return res.status(404).json({ message: 'Board not found' });

        const columnExists = board.columns.some((column) => column.id === columnId);
        if (!columnExists) return res.status(404).json({ message: 'Column not found' });

        if (board.columns.length === 1) {
            return res.status(400).json({ message: 'A board must have at least one column' });
        }

        board.columns = board.columns.filter((column) => column.id !== columnId);
        await board.save();
        await Card.deleteMany({ board: board._id, list: columnId });

        return res.status(200).json({
            message: 'Column and its cards deleted successfully',
            board,
        });
    } catch (error) {
        console.error('Delete board column error:', error);
        return res.status(500).json({ message: 'Error deleting column', error: error.message });
    }
};

// Invite a member to a board
const inviteBoardMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body;
        const board = await Board.findOne({ _id: id, createdBy: req.user?._id || req.user?.id });

        if (!board) return res.status(404).json({ message: 'Board not found' });
        if (!email) return res.status(400).json({ message: 'Member email is required' });

        const normalizedEmail = email.trim().toLowerCase();
        const member = await User.findOne({ email: normalizedEmail });
        board.members = board.members || [];
        if (member && board.members.some((memberId) => memberId.equals(member._id))) {
            return res.status(409).json({ message: 'This user is already a board member' });
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        await BoardInvite.deleteMany({ board: board._id, email: normalizedEmail, acceptedAt: null });

        await BoardInvite.create({
            board: board._id,
            invitedBy: req.user._id,
            email: normalizedEmail,
            tokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/board-invites/${rawToken}`;
        try {
            await sendBoardInviteEmail({
                recipient: normalizedEmail,
                inviterName: req.user.username,
                boardTitle: board.title,
                inviteUrl,
            });
        } catch (mailError) {
            await BoardInvite.deleteOne({ tokenHash });
            throw mailError;
        }

        return res.status(202).json({ message: 'Board invitation sent successfully' });
    } catch (error) {
        console.error('Add board member error:', error);
        if (error.responseCode === 525) {
            return res.status(503).json({ message: 'SMTP rejected this server IP. Remove the Brevo IP restriction or allow this server IP.' });
        }
        if (error.code === 'EAUTH' || error.responseCode === 535) {
            return res.status(503).json({ message: 'Email service authentication failed. Check SMTP_USER and SMTP_PASS.' });
        }
        return res.status(500).json({ message: 'Error adding board member', error: error.message });
    }
};

// Accept a board invitation
const acceptBoardInvite = async (req, res) => {
    try {
        const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const invite = await BoardInvite.findOne({ tokenHash, acceptedAt: null, revokedAt: null }).populate('board');

        if (!invite || invite.expiresAt <= new Date()) {
            return res.status(400).json({ message: 'This invitation is invalid or expired' });
        }

        if (req.user.email.toLowerCase() !== invite.email) {
            return res.status(403).json({ message: 'Sign in with the invited email address' });
        }

        const board = invite.board;
        board.members = board.members || [];
        if (!board.members.some((memberId) => memberId.equals(req.user._id))) {
            board.members.push(req.user._id);
            await board.save();
        }

        invite.acceptedAt = new Date();
        invite.revokedAt = new Date();
        await invite.save();

        return res.status(200).json({ message: 'Board invitation accepted', board });
    } catch (error) {
        console.error('Accept board invite error:', error);
        return res.status(500).json({ message: 'Error accepting board invitation', error: error.message });
    }
};


// Delete a board
const deleteBoard = async (req, res) => {
    try {
        const { id } = req.params;

        const board = await Board.findOneAndDelete({ _id: id, createdBy: req.user?._id || req.user?.id });

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        return res.status(200).json({
            message: 'Board deleted successfully',
            board,
        });
    } catch (error) {
        console.error('Delete board error:', error);
        return res.status(500).json({
            message: 'Error deleting board',
            error: error.message,
        });
    }
};

module.exports = {
    createBoard,
    getAllBoards,
    updateBoard,
    deleteBoardColumn,
    deleteBoard,
    inviteBoardMember,
    acceptBoardInvite,
};

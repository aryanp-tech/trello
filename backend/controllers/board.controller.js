const Board = require('../models/board.model');
const User = require('../models/user.model');
const Card = require('../models/card.models');
const BoardInvite = require('../models/board-invite.model');
const crypto = require('crypto');
const { sendBoardInviteEmail, sendCardAssignmentEmail } = require('../services/mail.service');

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
            members: [req.user?._id || req.user?.id],
            createdBy: req.user?._id || req.user?.id,
        });

        await board.populate('members', 'username email');
        await board.populate('createdBy', 'username email');

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
        const boards = await Board.find(boardAccessFilter(req.user?._id || req.user?.id))
            .populate('members', 'username email')
            .populate('createdBy', 'username email')
            .sort({ createdAt: -1 });
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
        const { title, backgroundImage, backgroundColor, description, isStarred} = req.body;

        const board = await Board.findOne({ _id: id, createdBy: req.user?._id || req.user?.id });

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        if (title !== undefined) board.title = title.trim();
        if (backgroundImage !== undefined) board.backgroundImage = backgroundImage;
        if (backgroundColor !== undefined) board.backgroundColor = backgroundColor;
        if (description !== undefined) board.description = description;
        if (isStarred !== undefined) board.isStarred = isStarred;

        // Targeted single column move by picked column id and drop index (no array in payload)
        const { columnId, newIndex } = req.body;
        if (columnId && Number.isFinite(newIndex)) {
            const colIndex = board.columns.findIndex((c) => c.id === columnId);
            if (colIndex !== -1) {
                const [movedCol] = board.columns.splice(colIndex, 1);
                const targetIdx = Math.max(0, Math.min(newIndex, board.columns.length));
                board.columns.splice(targetIdx, 0, movedCol);
            }
        }

        if (Array.isArray(req.body.columns)) {
            board.columns = req.body.columns
                .filter((column) => column?.id && column?.label)
                .map((column) => ({ id: String(column.id), label: String(column.label).trim() }))
                .filter((column) => column.label);
        }
        await board.save();
        await board.populate('members', 'username email');
        await board.populate('createdBy', 'username email');

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

// Invite a member to a board or specific card
const inviteBoardMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, cardId } = req.body;
        const userId = req.user?._id || req.user?.id;
        const board = await Board.findOne({
            _id: id,
            $or: [{ createdBy: userId }, { members: userId }],
        });

        if (!board) return res.status(404).json({ message: 'Board not found' });

        const isOwner = board.createdBy.toString() === userId.toString();
        if (!isOwner) {
            return res.status(403).json({ message: 'Only the board owner can add or invite members' });
        }

        if (!email) return res.status(400).json({ message: 'Member email is required' });

        const normalizedEmail = email.trim().toLowerCase();
        const member = await User.findOne({ email: normalizedEmail });
        board.members = board.members || [];

        let targetCard = null;
        if (cardId) {
            targetCard = await Card.findOne({ _id: cardId, board: board._id });
        }

        // Case 1: Member already exists in system
        if (member) {
            const isOwner = board.createdBy.equals(member._id);
            const isBoardMember = board.members.some((mId) => mId.equals(member._id));

            if (!isOwner && !isBoardMember) {
                board.members.push(member._id);
                await board.save();
            }

            if (targetCard) {
                targetCard.members = targetCard.members || [];
                if (!targetCard.members.some((mId) => mId.equals(member._id))) {
                    targetCard.members.push(member._id);
                    await targetCard.save();
                    await targetCard.populate('members', 'username email');
                }
            }

            // Send notification email to the added member
            try {
                const cardUrl = targetCard
                    ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/boards/${board._id}?cardId=${targetCard._id}`
                    : `${process.env.FRONTEND_URL || 'http://localhost:5173'}/boards/${board._id}`;
                await sendCardAssignmentEmail({
                    recipient: normalizedEmail,
                    assignerName: req.user.username,
                    boardTitle: board.title,
                    cardTitle: targetCard?.title,
                    cardUrl,
                });
            } catch (mailError) {
                console.warn('Assignment email could not be sent:', mailError.message);
            }

            return res.status(200).json({
                message: `${member.username} added successfully`,
                member: { _id: member._id, username: member.username, email: member.email },
                card: targetCard,
                board,
            });
        }

        // Case 2: New user (send email invitation link)
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        await BoardInvite.deleteMany({ board: board._id, email: normalizedEmail, acceptedAt: null });

        await BoardInvite.create({
            board: board._id,
            card: targetCard?._id || null,
            invitedBy: req.user._id,
            email: normalizedEmail,
            tokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        const inviteUrl = targetCard
            ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/board-invites/${rawToken}?cardId=${targetCard._id}`
            : `${process.env.FRONTEND_URL || 'http://localhost:5173'}/board-invites/${rawToken}`;
        try {
            await sendBoardInviteEmail({
                recipient: normalizedEmail,
                inviterName: req.user.username,
                boardTitle: board.title,
                cardTitle: targetCard?.title,
                inviteUrl,
            });
        } catch (mailError) {
            await BoardInvite.deleteOne({ tokenHash });
            throw mailError;
        }

        return res.status(202).json({
            message: `Invitation email sent to ${normalizedEmail} successfully`,
        });
    } catch (error) {
        console.error('Add board/card member error:', error);
        if (error.responseCode === 525) {
            return res.status(503).json({ message: 'SMTP rejected this server IP. Remove the Brevo IP restriction or allow this server IP.' });
        }
        if (error.code === 'EAUTH' || error.responseCode === 535) {
            return res.status(503).json({ message: 'Email service authentication failed. Check SMTP_USER and SMTP_PASS.' });
        }
        return res.status(500).json({ message: 'Error adding member', error: error.message });
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

        // If this invite was for a specific card, assign them to it as well
        if (invite.card) {
            await Card.findByIdAndUpdate(invite.card, {
                $addToSet: { members: req.user._id },
            });
        }

        invite.acceptedAt = new Date();
        invite.revokedAt = new Date();
        await invite.save();

        return res.status(200).json({
            message: 'Board invitation accepted',
            board,
            cardId: invite.card || null,
        });
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

// Remove a member from a board (owner only)
const removeBoardMember = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const userId = req.user?._id || req.user?.id;

        const board = await Board.findOne({
            _id: id,
            $or: [{ createdBy: userId }, { members: userId }],
        });

        if (!board) return res.status(404).json({ message: 'Board not found' });

        const isOwner = board.createdBy.toString() === userId.toString();
        if (!isOwner) {
            return res.status(403).json({ message: 'Only the board owner can remove members' });
        }

        if (board.createdBy.toString() === memberId.toString()) {
            return res.status(400).json({ message: 'Cannot remove the board owner' });
        }

        board.members = (board.members || []).filter(
            (m) => m.toString() !== memberId.toString()
        );
        await board.save();

        // Also remove member from all cards on this board
        await Card.updateMany(
            { board: board._id },
            { $pull: { members: memberId } }
        );

        await board.populate('members', 'username email');
        await board.populate('createdBy', 'username email');

        return res.status(200).json({
            message: 'Member removed from board successfully',
            board,
        });
    } catch (error) {
        console.error('Remove board member error:', error);
        return res.status(500).json({
            message: 'Error removing member from board',
            error: error.message,
        });
    }
};

module.exports = {
    createBoard,
    getAllBoards,
    updateBoard,
    deleteBoard,
    inviteBoardMember,
    acceptBoardInvite,
    removeBoardMember,
};

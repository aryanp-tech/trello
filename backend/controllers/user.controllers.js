const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');
const Card = require('../models/card.models');
const BoardInvite = require('../models/board-invite.model');
const PasswordReset = require('../models/password-reset.model');
const { sendPasswordResetEmail } = require('../services/mail.service');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

// Token helpers
const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email },
        JWT_SECRET,
        { expiresIn: '15m' }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user._id },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
};

// User registration controller
const registerUser = async (req, res) => {
    try {
        const { username, email, password, inviteToken } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        let invite = null;

        if (inviteToken) {
            const tokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
            invite = await BoardInvite.findOne({
                tokenHash,
                email: normalizedEmail,
                acceptedAt: null,
                revokedAt: null,
                expiresAt: { $gt: new Date() },
            }).populate('board');

            if (!invite) {
                return res.status(400).json({ message: 'This invitation is invalid, expired, or does not match the email' });
            }
        }

        const existingUser = await User.exists({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists with this email' });
        }

        const userId = new mongoose.Types.ObjectId();
        const hashedPassword = await bcrypt.hash(password, 10);
        const accessToken = generateAccessToken({ _id: userId, email: normalizedEmail });
        const refreshToken = generateRefreshToken({ _id: userId });

        const newUser = await User.create({
            _id: userId,
            username: username.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            refreshToken,
        });

        if (invite) {
            const board = invite.board;
            if (board) {
                board.members = board.members || [];
                if (!board.members.some((memberId) => memberId.equals(userId))) {
                    board.members.push(userId);
                    await board.save();
                }
            }

            if (invite.card) {
                await Card.findByIdAndUpdate(invite.card, {
                    $addToSet: { members: userId },
                });
            }

            const now = new Date();
            invite.acceptedAt = now;
            invite.revokedAt = now;
            await invite.save();
        }

        return res.status(201).json({
            message: 'User registered successfully',
            accessToken,
            refreshToken,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
            },
            boardId: invite?.board?._id || null,
            cardId: invite?.card || null,
        });
    } catch (error) {
        console.error('Register user error:', error);
        return res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

// User login controller
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await User.updateOne({ _id: user._id }, { refreshToken });

        return res.status(200).json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Login user error:', error);
        return res.status(500).json({ message: 'Error logging in user', error: error.message });
    }
};

// Refresh access token controller
const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token is required' });
        }

        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id).select('username email refreshToken').lean();

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const accessToken = generateAccessToken(user);
        const nextRefreshToken = generateRefreshToken(user);

        await User.updateOne({ _id: user._id }, { refreshToken: nextRefreshToken });

        return res.status(200).json({
            accessToken,
            refreshToken: nextRefreshToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
};

// Request password reset and creating a password reset token
const requestPasswordReset = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const genericResponse = { message: 'If an account exists, a password reset email has been sent.' };

        if (!email) return res.status(200).json(genericResponse);

        const user = await User.findOne({ email }).select('_id email').lean();
        if (!user) return res.status(200).json(genericResponse);

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        await PasswordReset.deleteMany({ user: user._id, usedAt: null });
        await PasswordReset.create({
            user: user._id,
            tokenHash,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;
        try {
            await sendPasswordResetEmail({ recipient: user.email, resetUrl });
        } catch (mailError) {
            await PasswordReset.deleteOne({ tokenHash });
            throw mailError;
        }

        return res.status(200).json(genericResponse);
    } catch (error) {
        console.error('Request password reset error:', error);
        if (error.responseCode === 525) {
            return res.status(503).json({ message: 'SMTP rejected this server IP. Check the email provider settings.' });
        }
        return res.status(500).json({ message: 'Unable to send password reset email' });
    }
};

// Reset password controller for checking the token and updating the password
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;

        if (!password || !confirmPassword) {
            return res.status(400).json({ message: 'Password and confirmation are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const resetRequest = await PasswordReset.findOne({
            tokenHash,
            usedAt: null,
            expiresAt: { $gt: new Date() },
        }).lean();

        if (!resetRequest) {
            return res.status(400).json({ message: 'This password reset link is invalid or expired' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.findByIdAndUpdate(resetRequest.user, {
            password: hashedPassword,
            refreshToken: '',
        });
        if (!user) return res.status(400).json({ message: 'This password reset link is invalid' });

        await Promise.all([
            PasswordReset.findByIdAndUpdate(resetRequest._id, { usedAt: new Date() }),
            PasswordReset.deleteMany({ user: resetRequest.user, _id: { $ne: resetRequest._id } }),
        ]);

        return res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ message: 'Unable to reset password' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken,
    requestPasswordReset,
    resetPassword,
};
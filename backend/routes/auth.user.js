const express = require('express');
const { registerUser, loginUser, refreshAccessToken, requestPasswordReset, resetPassword } = require('../controllers/user.controllers');

const router = express.Router();

// User registration and login routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Token refresh route
router.post('/refresh', refreshAccessToken);

// Password reset routes
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password/:token', resetPassword);

module.exports = router;

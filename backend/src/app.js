require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('../routes/auth.user');
const boardRoutes = require('../routes/board.routes');
const cardRoutes = require('../routes/card.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
// User authentication routes
app.use('/api/auth', authRoutes);

// Board management routes
app.use('/api/boards', boardRoutes);

// Card management routes (nested under boards)
app.use('/api/boards/:boardId/cards', cardRoutes);


const multer = require('multer');

// Global error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Maximum allowed size is 100 MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
  next();
});

module.exports = app;

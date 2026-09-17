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


module.exports = app;
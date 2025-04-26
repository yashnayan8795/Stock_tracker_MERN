const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
require('dotenv').config();
require('./databases/db.js');
// Import routes
const stockRoutes = require('./routes/stocks.routes.js');
const watchlistRoutes = require('./routes/watchlist.routes.js');

// Import middleware
const { apiLimiter, stockDataLimiter } = require('./middleware/rateLimit.js');

// Import logger
const logger = require('./utils/logger.js');

// Import WebSocket setup
const { setupWebSocketServer } = require('./utils/realtime.js');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(apiLimiter); // Apply rate limiting to all routes

// Routes
app.use('/api/v1/stocks', stockDataLimiter, stockRoutes);
app.use('/api/v1/watchlist', watchlistRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Stock Tracker API is running');
});

// Setup WebSocket for real-time updates
setupWebSocketServer(server);

// Start server
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

module.exports = app;
const express = require('express');
const router = express.Router();
const watchlistController = require('../controllers/watchlistController.controller.js');
const { userValidationRules, watchlistValidationRules, validate } = require('../middleware/validation.js');

// Create a new user
router.post('/users/create', userValidationRules, validate, watchlistController.createUser);

// Get user's watchlist
router.get('/:userId', watchlistValidationRules, validate, watchlistController.getWatchlist);

// Add stock to watchlist
router.post('/:userId/add', watchlistValidationRules, validate, watchlistController.addToWatchlist);

// Remove stock from watchlist
router.delete('/:userId/:symbol', watchlistValidationRules, validate, watchlistController.removeFromWatchlist);

// Get user's watchlist with current stock data
router.get('/:userId/with-data', watchlistValidationRules, validate, watchlistController.getWatchlistWithStockData);

module.exports = router;
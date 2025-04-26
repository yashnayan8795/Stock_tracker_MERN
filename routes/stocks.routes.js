const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController.controller.js');
const { stockSymbolValidation, validate } = require('../middleware/validation.js');

// Get stock summary data
router.get('/:symbol', stockSymbolValidation, validate, stockController.getStockSummary);

// Get historical data for charting
router.get('/:symbol/history', stockSymbolValidation, validate, stockController.getHistoricalData);

// Search stocks
router.get('/search', stockController.searchStocks);

// Get multiple stock quotes (for watchlist view)
router.get('/quotes', stockController.getMultipleQuotes);

module.exports = router;
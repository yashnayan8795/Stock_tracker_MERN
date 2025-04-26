const { body, param, validationResult } = require('express-validator');

// User validation rules
const userValidationRules = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
];

// Stock symbol validation rules
const stockSymbolValidation = [
  param('symbol')
    .trim()
    .isUppercase()
    .withMessage('Stock symbol must be uppercase')
    .isLength({ min: 1, max: 5 })
    .withMessage('Stock symbol must be between 1 and 5 characters')
];

// Watchlist validation rules
const watchlistValidationRules = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  body('symbol')
    .trim()
    .isUppercase()
    .withMessage('Stock symbol must be uppercase')
    .isLength({ min: 1, max: 5 })
    .withMessage('Stock symbol must be between 1 and 5 characters')
];

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  userValidationRules,
  stockSymbolValidation,
  watchlistValidationRules,
  validate
}; 
const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

// Stock data rate limiter (more restrictive)
const stockDataLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per minute
  message: {
    error: 'Too many stock data requests, please try again after a minute'
  }
});

// WebSocket connection limiter
const wsConnectionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 WebSocket connections per minute
  message: {
    error: 'Too many WebSocket connections, please try again after a minute'
  }
});

module.exports = {
  apiLimiter,
  stockDataLimiter,
  wsConnectionLimiter
}; 
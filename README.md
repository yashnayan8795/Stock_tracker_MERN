# Stock Tracker Backend

A Node.js backend application for tracking stock prices and managing watchlists.

## Features

- Real-time stock price updates using WebSocket
- RESTful API for stock data and watchlist management
- Rate limiting for API protection
- Input validation
- Structured logging
- Docker support

## Prerequisites

- Node.js (v18 or higher)
- MongoDB
- Docker (optional)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stock-tracker
YAHOO_FINANCE_API_KEY=your_api_key_here
YAHOO_FINANCE_API_HOST=your_api_host_here
LOG_LEVEL=info
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Stocks

- `GET /api/v1/stocks/:symbol` - Get stock summary
- `GET /api/v1/stocks/:symbol/history` - Get historical data
- `GET /api/v1/stocks/search` - Search stocks
- `GET /api/v1/stocks/quotes` - Get multiple stock quotes

### Watchlist

- `POST /api/v1/watchlist/users/create` - Create new user
- `GET /api/v1/watchlist/:userId` - Get user's watchlist
- `POST /api/v1/watchlist/:userId/add` - Add stock to watchlist
- `DELETE /api/v1/watchlist/:userId/:symbol` - Remove stock from watchlist
- `GET /api/v1/watchlist/:userId/with-data` - Get watchlist with current stock data

## Docker

Build and run the application using Docker:

```bash
docker build -t stock-tracker-backend .
docker run -p 5000:5000 stock-tracker-backend
```

## Development

- Run tests:
  ```bash
  npm test
  ```
- Start development server:
  ```bash
  npm run dev
  ```

## Security

- Rate limiting is implemented to prevent abuse
- Input validation for all endpoints
- Environment variables for sensitive data
- CORS enabled for API access

## Logging

Logs are stored in the `logs` directory:
- `error.log` - Error logs
- `combined.log` - All logs

## License

ISC 
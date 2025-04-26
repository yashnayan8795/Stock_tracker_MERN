const axios = require('axios');
const WebSocket = require('ws');

// Yahoo Finance API configuration
const yahooFinanceAPI = axios.create({
  baseURL: `https://${process.env.YAHOO_FINANCE_API_HOST}`,
  headers: {
    'X-RapidAPI-Key': process.env.YAHOO_FINANCE_API_KEY,
    'X-RapidAPI-Host': process.env.YAHOO_FINANCE_API_HOST
  }
});

// Setup WebSocket server for real-time updates
const setupWebSocketServer = (server) => {
  const wss = new WebSocket.Server({ server });
  
  // Store active connections and their subscribed symbols
  const clients = new Map();
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Initialize client data
    clients.set(ws, {
      isAlive: true,
      symbols: new Set()
    });
    
    // Ping to keep connection alive
    ws.on('pong', () => {
      const clientData = clients.get(ws);
      if (clientData) {
        clientData.isAlive = true;
      }
    });
    
    // Handle messages from client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        const clientData = clients.get(ws);
        
        // Handle subscription to symbols
        if (data.type === 'subscribe' && Array.isArray(data.symbols)) {
          // Add symbols to client's subscriptions
          data.symbols.forEach(symbol => {
            clientData.symbols.add(symbol.toUpperCase());
          });
          
          console.log(`Client subscribed to: ${Array.from(clientData.symbols).join(', ')}`);
        }
        
        // Handle unsubscription
        if (data.type === 'unsubscribe' && Array.isArray(data.symbols)) {
          data.symbols.forEach(symbol => {
            clientData.symbols.delete(symbol.toUpperCase());
          });
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });
  });
  
  // Check for dead connections
  const interval = setInterval(() => {
    wss.clients.forEach(ws => {
      const clientData = clients.get(ws);
      
      if (!clientData || !clientData.isAlive) {
        clients.delete(ws);
        return ws.terminate();
      }
      
      clientData.isAlive = false;
      ws.ping();
    });
  }, 30000);
  
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  // Set up periodic polling for stock updates
  setupStockPolling(wss, clients);
  
  return wss;
};

// Poll for stock updates and broadcast to subscribed clients
const setupStockPolling = (wss, clients) => {
  // Poll every 10 seconds (adjust as needed, be mindful of API limits)
  setInterval(async () => {
    // Skip if no clients connected
    if (wss.clients.size === 0) return;
    
    // Get all subscribed symbols across all clients
    const allSymbols = new Set();
    clients.forEach(clientData => {
      clientData.symbols.forEach(symbol => {
        allSymbols.add(symbol);
      });
    });
    
    // Skip if no subscriptions
    if (allSymbols.size === 0) return;
    
    try {
      // Get quotes for all subscribed symbols
      const symbolsString = Array.from(allSymbols).join(',');
      const response = await yahooFinanceAPI.get('/market/v2/get-quotes', {
        params: { region: 'US', symbols: symbolsString }
      });
      
      // Format the data
      const quotes = response.data.quoteResponse.result.map(quote => ({
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        timestamp: new Date().toISOString()
      }));
      
      // Send updates to each client based on their subscriptions
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          const clientData = clients.get(client);
          
          if (clientData && clientData.symbols.size > 0) {
            // Filter quotes to only include symbols this client cares about
            const clientQuotes = quotes.filter(quote => 
              clientData.symbols.has(quote.symbol)
            );
            
            if (clientQuotes.length > 0) {
              client.send(JSON.stringify({
                type: 'stockUpdate',
                data: clientQuotes
              }));
            }
          }
        }
      });
    } catch (error) {
      console.error('Error polling stock data:', error.message);
    }
  }, 10000);
};

module.exports = { setupWebSocketServer };
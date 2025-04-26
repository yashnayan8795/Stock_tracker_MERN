const axios = require('axios');

// Yahoo Finance API configuration
const yahooFinanceAPI = axios.create({
  baseURL: `https://${process.env.YAHOO_FINANCE_API_HOST}`,
  headers: {
    'X-RapidAPI-Key': process.env.YAHOO_FINANCE_API_KEY,
    'X-RapidAPI-Host': process.env.YAHOO_FINANCE_API_HOST
  }
});

// Get stock summary data (price, market cap, etc.)
exports.getStockSummary = async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const response = await yahooFinanceAPI.get('/stock/v2/get-summary', {
      params: { symbol }
    });
    
    // Extract relevant data from the response
    const stockData = {
      symbol: response.data.symbol || symbol,
      price: response.data.price?.regularMarketPrice?.raw,
      change: response.data.price?.regularMarketChange?.raw,
      changePercent: response.data.price?.regularMarketChangePercent?.raw,
      marketCap: response.data.price?.marketCap?.raw,
      companyName: response.data.price?.shortName,
      currency: response.data.price?.currency,
      volume: response.data.price?.regularMarketVolume?.raw,
      averageVolume: response.data.price?.averageDailyVolume3Month?.raw,
      fiftyTwoWeekHigh: response.data.summaryDetail?.fiftyTwoWeekHigh?.raw,
      fiftyTwoWeekLow: response.data.summaryDetail?.fiftyTwoWeekLow?.raw,
      peRatio: response.data.summaryDetail?.trailingPE?.raw,
      forwardPE: response.data.summaryDetail?.forwardPE?.raw,
      dividendYield: response.data.summaryDetail?.dividendYield?.raw,
      sector: response.data.summaryProfile?.sector,
      industry: response.data.summaryProfile?.industry,
      description: response.data.summaryProfile?.longBusinessSummary
    };
    
    res.json(stockData);
  } catch (error) {
    console.error('Error fetching stock data:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch stock data',
      message: error.response?.data?.message || error.message
    });
  }
};

// Get stock historical data for charts
exports.getHistoricalData = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { range = '1y', interval = '1d' } = req.query;
    
    // Make the API request
    const response = await yahooFinanceAPI.get('/market/get-charts', {
      params: { 
        symbol, 
        interval, 
        range,
        region: 'US' 
      }
    });
    
    // Log the response structure for debugging
    console.log('API Response Keys:', Object.keys(response.data));
    console.log('API Response Sample:', JSON.stringify(response.data).substring(0, 300) + '...');
    
    // If we have a chart property, try using that structure
    if (response.data.chart && response.data.chart.result && response.data.chart.result.length > 0) {
      const result = response.data.chart.result[0];
      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];
      
      const historicalData = timestamps.map((timestamp, index) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        open: quotes.open[index],
        high: quotes.high[index],
        low: quotes.low[index],
        close: quotes.close[index],
        volume: quotes.volume[index]
      }));
      
      return res.json(historicalData);
    }
    
    // If we have a results property, try that structure
    if (response.data.results && Array.isArray(response.data.results)) {
      const historicalData = response.data.results.map(item => ({
        date: new Date(item.date * 1000 || item.timestamp * 1000).toISOString().split('T')[0],
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close || item.adjclose,
        volume: item.volume
      }));
      
      return res.json(historicalData);
    }
    
    // Try yet another possible structure
    if (response.data.items && Array.isArray(response.data.items)) {
      const historicalData = response.data.items.map(item => ({
        date: new Date(item.date * 1000).toISOString().split('T')[0],
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      }));
      
      return res.json(historicalData);
    }
    
    // Return the raw data structure for analysis if we couldn't parse it
    res.status(200).json({
      message: "Raw API response - please analyze the structure",
      data: response.data
    });
    
  } catch (error) {
    console.error('Error fetching historical data:', error.message);
    
    // Return detailed error information
    res.status(500).json({ 
      error: 'Failed to fetch historical data',
      message: error.response?.data?.message || error.message,
      stack: error.stack
    });
  }
};
// Search stocks by keyword
exports.searchStocks = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    const response = await yahooFinanceAPI.get('/auto-complete', {
      params: { q: query, region: 'US' }
    });
    
    // Format search results
    const searchResults = response.data.quotes
      .filter(item => item.quoteType === 'EQUITY')
      .map(item => ({
        symbol: item.symbol,
        name: item.shortname || item.longname,
        exchange: item.exchange,
        type: item.quoteType
      }));
    
    res.json(searchResults);
  } catch (error) {
    console.error('Error searching stocks:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to search stocks',
      message: error.response?.data?.message || error.message
    });
  }
};

// Get multiple stock quotes at once (for watchlist)
exports.getMultipleQuotes = async (req, res) => {
  try {
    const { symbols } = req.query;
    
    if (!symbols) {
      return res.status(400).json({ error: 'Stock symbols are required' });
    }
    
    // Convert comma-separated symbols to array
    const symbolsArray = symbols.split(',');
    
    // We'll use the get-quotes API endpoint for multiple quotes
    const response = await yahooFinanceAPI.get('/market/v2/get-quotes', {
      params: { region: 'US', symbols: symbols }
    });
    
    // Format the data for frontend
    const quotes = response.data.quoteResponse.result.map(quote => ({
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      companyName: quote.shortName,
      currency: quote.currency
    }));
    
    res.json(quotes);
  } catch (error) {
    console.error('Error fetching multiple quotes:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch quotes',
      message: error.response?.data?.message || error.message
    });
  }
};
const User = require('../models/User.model.js');

// Create a new user
exports.createUser = async (req, res) => {
  try {
    const { username, email } = req.body;
    
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }
    
    const newUser = new User({
      username,
      email,
      watchlist: []
    });
    
    await newUser.save();
    
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error.message);
    
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create user' });
  }
};


// Get a user's watchlist
exports.getWatchlist = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    res.json(user.watchlist);
  } catch (error) {
    console.error('Error in fetching the watch list:', error.message);
    res.status(500).json({ error: 'Failed to fetch the watchList' });
  }
};

// Add a stock to watchlist
exports.addToWatchlist = async (req, res) => {
  try {
    const { userId } = req.params;
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json(
        {
           error: 'Stock symbol is required' 
        }
      );
    }
    
    const user = await User.findById(userId);
    if(!user){
      return res.status(404).json(
        {
          error:'User not found'
        }
      )
    }
    
    // Check if stock is already in watchlist
    const existingStock = user.watchlist.find(item => 
      item.symbol.toUpperCase() === symbol.toUpperCase()
    );
    
    if (existingStock) {
      return res.status(400).json(
        { 
          error: 'Stock already in watchlist' 
        }
      );
    }
    
    // Add to watchlist
    user.watchlist.push(
      { 
        symbol: symbol.toUpperCase() }
      );
    await user.save();
    
    res.status(201).json(user.watchlist);
  } catch (error) {
    console.error('Error adding to watchlist:', error.message);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
};

// Remove a stock from watchlist
exports.removeFromWatchlist = async (req, res) => {
  try {
    const { userId,symbol } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json(
        { error: 'User not found' }
      );
    }
    
    // Filter out the stock to remove
    user.watchlist = user.watchlist.filter(item => 
      item.symbol.toUpperCase() !== symbol.toUpperCase()
    );
    
    await user.save();
    
    res.json(user.watchlist);
  } catch (error) {
    console.error('Error removing from watchlist:', error.message);
    res.status(500).json(
      { 
        error: 'Failed to remove from watchlist' 
      }
    );
  }
};


// // Get a user's watchlist with current stock data

exports.getWatchlistWithStockData = async (req,res)=>{
  try{
    const { userId} =req.params;
    const user = await User.findById(userId)

    if(!user){
      return res.status(404).json(
        { 
          error: 'User not found' 
        }
      );
    }
    if(user.watchlist.length==0){
      return res.json(
        []
      )
    }

    const symbols=user.watchlist.map(item=>item.symbol).join(',');

    const stockData=await yahooFinanceAPI.get('/market/v2/get-quotes',{
      params:{region:'US',symbols:symbols}
    });

    const watchlistwithdata = user.watchlist.map(watchlistitem=>{
      const stockInfo=stockData.data.quoteResponse.result.find(
        item => item.symbol ===watchlistitem.symbol
      );
      return {
        symbol: watchlistItem.symbol,
        dateAdded: watchlistItem.dateAdded,
        price: stockInfo?.regularMarketPrice,
        change: stockInfo?.regularMarketChange,
        changePercent: stockInfo?.regularMarketChangePercent,
        companyName: stockInfo?.shortName,
        currency: stockInfo?.currency
      };
    });
    
    res.json(watchlistWithData);
  } catch (error) {
    console.error('Error fetching watchlist with stock data:', error.message);
    res.status(500).json({ error: 'Failed to fetch watchlist with stock data' });
  }
};

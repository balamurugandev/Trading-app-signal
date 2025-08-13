const axios = require('axios');
const moment = require('moment-timezone');
const YahooFinanceProvider = require('./yahooFinanceProvider');

class DataProvider {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5000; // 5 seconds cache for real-time data
    this.historicalCache = new Map();
    this.historicalCacheTimeout = 300000; // 5 minutes for historical data
    
    // Live data integration
    this.isLiveMode = process.env.LIVE_DATA === 'true' || false;
    this.yahooProvider = new YahooFinanceProvider();
    
    // Demo mode data generator
    this.demoMode = !this.isLiveMode; // Use demo mode when not live
    this.demoData = new Map();
    this.initializeDemoData();
    
    // Fix base prices if needed
    this.updateDemoBasePrices();
    
    // Initialize live data if enabled
    if (this.isLiveMode) {
      this.initializeLiveData();
    }
  }

  /**
   * Initialize live data provider
   */
  async initializeLiveData() {
    try {
      console.log('🚀 Initializing Yahoo Finance live data...');
      
      // Check if provider exists
      if (!this.yahooProvider) {
        throw new Error('Yahoo Finance provider not initialized');
      }
      
      // Set up event listeners
      this.yahooProvider.on('marketData', (data) => {
        const currency = data.symbol === 'BITCOIN' || data.symbol === 'SOLANA' ? '$' : '₹';
        console.log(`📊 Live update: ${data.symbol} - ${currency}${data.ltp.toFixed(2)} (${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}) [${(data.dataSource || data.sessionInfo?.dataSource || 'UNKNOWN').toUpperCase()}]`);
        
        // Clear cache for this symbol to force fresh data
        this.clearSymbolCache(data.symbol);
      });

      this.yahooProvider.on('error', (error) => {
        if (error.error.includes('429') || error.error.includes('Too Many Requests')) {
          console.warn(`⚠️ Yahoo Finance rate limited for ${error.symbol} - using fallback data`);
        } else {
          console.error(`❌ Yahoo Finance error for ${error.symbol}:`, error.error);
        }
      });

      this.yahooProvider.on('fetchError', (error) => {
        console.warn(`⚠️ Yahoo Finance fetch error: ${error.error}`);
      });

      // Start the provider with timeout
      console.log('🔌 Starting Yahoo Finance provider...');
      const startPromise = this.yahooProvider.start();
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Yahoo Finance provider start timeout (45s)')), 45000);
      });
      
      await Promise.race([startPromise, timeoutPromise]);
      
      // Verify it's actually running
      if (!this.yahooProvider.isRunning) {
        throw new Error('Yahoo Finance provider failed to start properly');
      }
      
      console.log('✅ Yahoo Finance provider started successfully');
      console.log('ℹ️ Note: If you see rate limiting errors, the system will use realistic fallback data');
      
    } catch (error) {
      console.error('❌ Failed to initialize live data:', error.message);
      
      // Don't throw error - instead fall back to demo mode gracefully
      console.log('🎮 Falling back to demo mode due to initialization failure');
      this.isLiveMode = false;
      this.demoMode = true;
      
      // Clean up on failure
      if (this.yahooProvider) {
        try {
          this.yahooProvider.stop();
        } catch (stopError) {
          console.error('Error stopping provider:', stopError.message);
        }
      }
    }
  }

  /**
   * Get latest market data for a symbol and timeframe
   */
  async getLatestData(symbol, timeframe) {
    const cacheKey = `${symbol}_${timeframe}_latest`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      let data;
      
      if (this.isLiveMode && !this.demoMode) {
        // Try to get live data from Yahoo Finance
        try {
          const period = this.getPeriodForTimeframe(timeframe);
          const interval = this.getYahooInterval(timeframe);
          data = await this.yahooProvider.getHistoricalData(symbol, period, interval);
          
          if (!data || data.length === 0) {
            throw new Error('No live data available');
          }
          
          console.log(`📈 Retrieved ${data.length} live data points for ${symbol} ${timeframe}`);
        } catch (liveError) {
          console.warn(`⚠️ Live data failed for ${symbol}, using demo data:`, liveError.message);
          data = this.generateDemoData(symbol, timeframe);
        }
      } else {
        data = this.generateDemoData(symbol, timeframe);
      }

      // Cache the data
      this.cache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error(`Error fetching latest data for ${symbol} ${timeframe}:`, error);
      
      // Return cached data if available, even if expired
      if (cached) {
        console.log('Returning expired cached data due to error');
        return cached.data;
      }
      
      // Final fallback to demo data
      return this.generateDemoData(symbol, timeframe);
    }
  }

  /**
   * Get historical market data
   */
  async getHistoricalData(symbol, timeframe, days = 5) {
    const cacheKey = `${symbol}_${timeframe}_historical_${days}`;
    const cached = this.historicalCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.historicalCacheTimeout) {
      return cached.data;
    }

    try {
      let data;
      
      if (this.isLiveMode && !this.demoMode) {
        // Try to get live historical data from Yahoo Finance
        try {
          const period = `${days}d`;
          const interval = this.getYahooInterval(timeframe);
          data = await this.yahooProvider.getHistoricalData(symbol, period, interval);
          
          if (!data || data.length === 0) {
            throw new Error('No live historical data available');
          }
          
          console.log(`📊 Retrieved ${data.length} live historical data points for ${symbol} ${timeframe}`);
        } catch (liveError) {
          console.warn(`⚠️ Live historical data failed for ${symbol}, using demo data:`, liveError.message);
          data = this.generateHistoricalDemoData(symbol, timeframe, days);
        }
      } else {
        data = this.generateHistoricalDemoData(symbol, timeframe, days);
      }

      // Cache the data
      this.historicalCache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol} ${timeframe}:`, error);
      // Fallback to demo data
      return this.generateHistoricalDemoData(symbol, timeframe, days);
    }
  }

  /**
   * Initialize demo data with realistic NSE patterns
   */
  initializeDemoData() {
    const symbols = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'BITCOIN', 'SOLANA'];
    const baseValues = {
      'NIFTY': 24487.40,
      'BANKNIFTY': 55043.70,
      'FINNIFTY': 23245.80,
      'SENSEX': 80604.65,
      'BITCOIN': 60245.50,
      'SOLANA': 185.75
    };

    symbols.forEach(symbol => {
      this.demoData.set(symbol, {
        basePrice: baseValues[symbol],
        trend: Math.random() > 0.5 ? 1 : -1,
        volatility: 0.02 + Math.random() * 0.03, // 2-5% volatility
        lastUpdate: Date.now(),
        momentum: 0,
        lastPrice: baseValues[symbol] // Initialize lastPrice to basePrice
      });
    });
  }

  /**
   * Update base prices for demo data (for fixing pricing issues)
   */
  updateDemoBasePrices() {
    const baseValues = {
      'NIFTY': 24487.40,
      'BANKNIFTY': 55043.70,
      'FINNIFTY': 23245.80,
      'SENSEX': 80604.65,
      'BITCOIN': 60245.50,
      'SOLANA': 185.75
    };

    ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'BITCOIN', 'SOLANA'].forEach(symbol => {
      const demoState = this.demoData.get(symbol);
      if (demoState) {
        demoState.basePrice = baseValues[symbol];
        demoState.lastPrice = baseValues[symbol];
      }
    });
  }

  /**
   * Generate realistic demo data for testing
   */
  generateDemoData(symbol, timeframe) {
    const demoState = this.demoData.get(symbol);
    if (!demoState) return [];

    const now = moment().tz('Asia/Kolkata');
    const timeframeMinutes = this.getTimeframeMinutes(timeframe);
    const candleCount = 100; // Generate 100 candles

    const candles = [];
    let currentPrice = demoState.basePrice;
    let currentTime = moment(now).subtract(candleCount * timeframeMinutes, 'minutes');

    for (let i = 0; i < candleCount; i++) {
      // Generate realistic OHLCV data
      const open = currentPrice;
      
      // Add trend and random movement
      const trendMove = demoState.trend * 0.001 * Math.random();
      const randomMove = (Math.random() - 0.5) * demoState.volatility;
      const priceChange = trendMove + randomMove;
      
      currentPrice = open * (1 + priceChange);
      
      // Generate high and low
      const volatilityRange = open * demoState.volatility * 0.5;
      const high = Math.max(open, currentPrice) + Math.random() * volatilityRange;
      const low = Math.min(open, currentPrice) - Math.random() * volatilityRange;
      
      // Generate volume (higher during market hours)
      const hour = currentTime.hour();
      let volumeMultiplier = 1;
      if (hour >= 9 && hour <= 15) {
        volumeMultiplier = 1.5 + Math.random();
      }
      const volume = Math.floor((50000 + Math.random() * 100000) * volumeMultiplier);

      candles.push({
        timestamp: currentTime.toISOString(),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(currentPrice.toFixed(2)),
        volume: volume
      });

      currentTime.add(timeframeMinutes, 'minutes');
    }

    // Update demo state
    demoState.basePrice = currentPrice;
    demoState.lastUpdate = Date.now();
    
    // Occasionally change trend
    if (Math.random() < 0.05) {
      demoState.trend *= -1;
    }

    return candles;
  }

  /**
   * Generate historical demo data
   */
  generateHistoricalDemoData(symbol, timeframe, days) {
    const demoState = this.demoData.get(symbol);
    if (!demoState) return [];

    const timeframeMinutes = this.getTimeframeMinutes(timeframe);
    const candlesPerDay = Math.floor((6.25 * 60) / timeframeMinutes); // 6.25 hours trading day
    const totalCandles = days * candlesPerDay;

    const candles = [];
    let currentPrice = demoState.basePrice * 0.95; // Start slightly lower
    let currentTime = moment().tz('Asia/Kolkata').subtract(days, 'days').startOf('day').add(9, 'hours').add(15, 'minutes');

    for (let i = 0; i < totalCandles; i++) {
      // Skip weekends
      if (currentTime.day() === 0 || currentTime.day() === 6) {
        currentTime.add(timeframeMinutes, 'minutes');
        continue;
      }

      // Skip non-trading hours
      const hour = currentTime.hour();
      const minute = currentTime.minute();
      if (hour < 9 || hour > 15 || (hour === 9 && minute < 15) || (hour === 15 && minute > 30)) {
        currentTime.add(timeframeMinutes, 'minutes');
        continue;
      }

      const open = currentPrice;
      
      // Generate price movement with some trend
      const dailyProgress = (i % candlesPerDay) / candlesPerDay;
      const trendComponent = Math.sin(dailyProgress * Math.PI) * 0.002;
      const randomComponent = (Math.random() - 0.5) * 0.01;
      
      currentPrice = open * (1 + trendComponent + randomComponent);
      
      const volatilityRange = open * 0.005;
      const high = Math.max(open, currentPrice) + Math.random() * volatilityRange;
      const low = Math.min(open, currentPrice) - Math.random() * volatilityRange;
      
      const volume = Math.floor(30000 + Math.random() * 80000);

      candles.push({
        timestamp: currentTime.toISOString(),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(currentPrice.toFixed(2)),
        volume: volume
      });

      currentTime.add(timeframeMinutes, 'minutes');
    }

    return candles;
  }

  /**
   * Convert timeframe string to minutes
   */
  getTimeframeMinutes(timeframe) {
    switch (timeframe) {
      case '1m': return 1;
      case '5m': return 5;
      case '15m': return 15;
      case '1h': return 60;
      case '1d': return 1440;
      default: return 5;
    }
  }

  /**
   * Fetch real-time data from actual API (placeholder)
   * Replace with actual NSE data provider integration
   */
  async fetchRealTimeData(symbol, timeframe) {
    // Placeholder for real API integration
    // This would connect to NSE data providers like:
    // - Zerodha Kite API
    // - Angel Broking API
    // - IIFL API
    // - Or market data vendors like Bloomberg, Reuters, etc.
    
    throw new Error('Real-time API not implemented. Using demo mode.');
  }

  /**
   * Fetch historical data from actual API (placeholder)
   */
  async fetchHistoricalData(symbol, timeframe, days) {
    // Placeholder for real API integration
    throw new Error('Historical API not implemented. Using demo mode.');
  }

  /**
   * Get current market status
   */
  getMarketStatus() {
    const now = moment().tz('Asia/Kolkata');
    const day = now.day();
    const time = now.format('HH:mm');

    const isWeekend = day === 0 || day === 6;
    const isMarketHours = time >= '09:15' && time <= '15:30';
    const isLiquidWindow = (time >= '09:25' && time <= '11:00') || 
                          (time >= '13:45' && time <= '15:05');

    return {
      isOpen: !isWeekend && isMarketHours,
      isLiquidWindow: !isWeekend && isLiquidWindow,
      currentTime: now.toISOString(),
      nextOpen: this.getNextMarketOpen(now),
      session: this.getCurrentSession(time),
      isWeekend: isWeekend,
      marketHours: isMarketHours,
      timeUntilOpen: this.getTimeUntilOpen(now),
      displayMode: (!isWeekend && isMarketHours) ? 'live' : 'last_close'
    };
  }

  /**
   * Get next market opening time
   */
  getNextMarketOpen(now) {
    let nextOpen = moment(now).tz('Asia/Kolkata');
    
    // If it's weekend, move to Monday
    if (now.day() === 6) { // Saturday
      nextOpen.add(2, 'days');
    } else if (now.day() === 0) { // Sunday
      nextOpen.add(1, 'day');
    } else if (now.format('HH:mm') >= '15:30') {
      // After market close, next day
      nextOpen.add(1, 'day');
    }
    
    // Set to 9:15 AM
    nextOpen.hour(9).minute(15).second(0).millisecond(0);
    
    return nextOpen.toISOString();
  }

  /**
   * Get current trading session
   */
  getCurrentSession(time) {
    if (time >= '09:15' && time < '11:30') {
      return 'MORNING';
    } else if (time >= '11:30' && time < '13:45') {
      return 'MIDDAY';
    } else if (time >= '13:45' && time <= '15:30') {
      return 'AFTERNOON';
    } else {
      return 'CLOSED';
    }
  }

  /**
   * Get time until market opens
   */
  getTimeUntilOpen(now) {
    const nextOpen = moment(this.getNextMarketOpen(now));
    const duration = moment.duration(nextOpen.diff(now));
    
    if (duration.asMilliseconds() <= 0) {
      return null;
    }
    
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Get current live market data
   */
  getCurrentMarketData(symbol) {
    // In live mode, ONLY return live data - no fallbacks to demo data
    if (this.isLiveMode && !this.demoMode && this.yahooProvider) {
      const liveData = this.yahooProvider.getLatestData(symbol);
      if (liveData) {
        console.log(`📊 Live data for ${symbol}: ₹${liveData.ltp} (${liveData.sessionInfo?.dataSource || 'live'})`);
        return {
          symbol: liveData.symbol,
          ltp: liveData.ltp,
          change: liveData.change,
          changePercent: liveData.changePercent,
          volume: Math.max(liveData.volume || 0, 1000),
          timestamp: liveData.timestamp,
          isMarketOpen: liveData.isMarketOpen,
          dataSource: liveData.sessionInfo?.dataSource || 'live',
          marketState: liveData.marketState
        };
      } else {
        console.log(`❌ No live data available for ${symbol} - returning null`);
        return null; // Don't fallback to demo data in live mode
      }
    }
    
    // Only use demo data when explicitly in demo mode
    if (this.demoMode) {
      const demoState = this.demoData.get(symbol);
      if (!demoState) {
        console.log(`❌ No demo state for ${symbol}`);
        return null;
      }
      
      const basePrice = demoState.basePrice;
      const now = Date.now();
      
      // Create realistic price movements around base price
      const timeBasedVariation = Math.sin(now / 10000) * (basePrice * 0.001);
      const randomVariation = (Math.random() - 0.5) * (basePrice * 0.002);
      const trendVariation = Math.sin(now / 60000) * (basePrice * 0.0015);
      
      const currentPrice = basePrice + timeBasedVariation + randomVariation + trendVariation;
      const previousPrice = demoState.lastPrice || basePrice;
      const change = currentPrice - previousPrice;
      
      demoState.lastPrice = currentPrice;
      
      console.log(`💹 ${symbol} Demo Price: ${currentPrice.toFixed(2)} (Change: ${change.toFixed(2)})`);
      
      return {
        symbol,
        ltp: parseFloat(currentPrice.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(((change / currentPrice) * 100).toFixed(2)),
        volume: Math.floor(Math.random() * 100000) + 10000,
        timestamp: new Date(),
        isMarketOpen: this.getMarketStatus().isOpen,
        dataSource: 'demo'
      };
    }
    
    return null;
  }

  /**
   * Get all current market data
   */
  getAllCurrentData() {
    const data = {};
    const symbols = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'BITCOIN', 'SOLANA'];
    
    symbols.forEach(symbol => {
      const symbolData = this.getCurrentMarketData(symbol);
      if (symbolData) {
        data[symbol] = symbolData;
      }
    });
    
    const dataCount = Object.keys(data).length;
    const mode = this.isLiveMode && !this.demoMode ? 'live' : 'demo';
    console.log(`📊 Returning ${mode} data for ${dataCount} symbols`);
    
    return data;
  }

  /**
   * Convert timeframe to Yahoo Finance interval
   */
  getYahooInterval(timeframe) {
    switch (timeframe) {
      case '1m': return '1m';
      case '5m': return '5m';
      case '15m': return '15m';
      case '1h': return '1h';
      case '1d': return '1d';
      default: return '5m';
    }
  }

  /**
   * Get period for historical data based on timeframe
   */
  getPeriodForTimeframe(timeframe) {
    switch (timeframe) {
      case '1m': return '1d';   // 1 day for 1-minute data
      case '5m': return '5d';   // 5 days for 5-minute data
      case '15m': return '1mo'; // 1 month for 15-minute data
      case '1h': return '3mo';  // 3 months for hourly data
      case '1d': return '1y';   // 1 year for daily data
      default: return '5d';
    }
  }

  /**
   * Clear cache for a specific symbol
   */
  clearSymbolCache(symbol) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(symbol)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.cache.clear();
    this.historicalCache.clear();
    console.log('Data provider cache cleared');
  }

  /**
   * Enable live data mode
   */
  async enableLiveMode() {
    try {
      console.log('🔄 Enabling live data mode...');
      console.log('Current state:', { isLiveMode: this.isLiveMode, demoMode: this.demoMode });
      
      if (!this.isLiveMode) {
        this.isLiveMode = true;
        this.demoMode = false;
        
        // Initialize live data with better error handling
        await this.initializeLiveData();
        
        console.log('✅ Live data mode enabled successfully');
      } else {
        console.log('ℹ️ Live data mode already enabled');
      }
      
      // Verify the provider is actually running
      if (!this.yahooProvider || !this.yahooProvider.isRunning) {
        throw new Error('Yahoo Finance provider failed to start');
      }
      
    } catch (error) {
      console.error('❌ Failed to enable live data mode:', error.message);
      
      // Reset to demo mode on failure
      this.isLiveMode = false;
      this.demoMode = true;
      
      // Re-throw the error so the API endpoint can handle it
      throw new Error(`Failed to enable live data: ${error.message}`);
    }
  }

  /**
   * Disable live data mode (switch to demo)
   */
  disableLiveMode() {
    if (this.isLiveMode) {
      this.isLiveMode = false;
      this.demoMode = true;
      if (this.yahooProvider) {
        this.yahooProvider.stop();
      }
      console.log('🎮 Demo mode enabled');
    }
  }

  /**
   * Get live data status
   */
  getLiveDataStatus() {
    return {
      isLiveMode: this.isLiveMode,
      isDemoMode: this.demoMode,
      providerStatus: this.isLiveMode ? 'Yahoo Finance' : 'Demo',
      lastUpdate: this.isLiveMode ? this.yahooProvider.getMarketStatus().lastUpdate : new Date()
    };
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.yahooProvider) {
      this.yahooProvider.stop();
    }
    this.clearCache();
    console.log('🧹 Data provider cleaned up');
  }
}

module.exports = DataProvider;
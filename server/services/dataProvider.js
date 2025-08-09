const axios = require('axios');
const moment = require('moment-timezone');

class DataProvider {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5000; // 5 seconds cache for real-time data
    this.historicalCache = new Map();
    this.historicalCacheTimeout = 300000; // 5 minutes for historical data
    
    // Demo mode data generator
    this.demoMode = true; // Set to false when real API is available
    this.demoData = new Map();
    this.initializeDemoData();
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
      
      if (this.demoMode) {
        data = this.generateDemoData(symbol, timeframe);
      } else {
        // Real API call would go here
        data = await this.fetchRealTimeData(symbol, timeframe);
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
      
      throw error;
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
      
      if (this.demoMode) {
        data = this.generateHistoricalDemoData(symbol, timeframe, days);
      } else {
        // Real API call would go here
        data = await this.fetchHistoricalData(symbol, timeframe, days);
      }

      // Cache the data
      this.historicalCache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol} ${timeframe}:`, error);
      throw error;
    }
  }

  /**
   * Initialize demo data with realistic NSE patterns
   */
  initializeDemoData() {
    const symbols = ['NIFTY', 'BANKNIFTY'];
    const baseValues = {
      'NIFTY': 21500,
      'BANKNIFTY': 46000
    };

    symbols.forEach(symbol => {
      this.demoData.set(symbol, {
        basePrice: baseValues[symbol],
        trend: Math.random() > 0.5 ? 1 : -1,
        volatility: 0.02 + Math.random() * 0.03, // 2-5% volatility
        lastUpdate: Date.now(),
        momentum: 0
      });
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
      session: this.getCurrentSession(time)
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
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.cache.clear();
    this.historicalCache.clear();
    console.log('Data provider cache cleared');
  }
}

module.exports = DataProvider;
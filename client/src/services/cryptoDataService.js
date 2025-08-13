class CryptoDataService {
  constructor() {
    this.isRunning = false;
    this.intervals = [];
    this.subscribers = new Map();
    this.cryptoData = new Map();
    
    // Initialize with base prices
    this.cryptoData.set('BITCOIN', {
      price: 60245.50,
      change: 1250.30,
      changePercent: 2.12,
      lastUpdate: Date.now()
    });
    
    this.cryptoData.set('SOLANA', {
      price: 181.82,
      change: 1.97,
      changePercent: 1.07,
      lastUpdate: Date.now()
    });
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 Starting crypto live data updates');

    // Update crypto prices every 2 seconds (crypto markets are 24/7)
    const cryptoInterval = setInterval(() => {
      this.updateCryptoPrices();
    }, 2000);

    this.intervals = [cryptoInterval];
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    console.log('⏹️ Stopped crypto live data updates');
  }

  getCurrentData(symbol) {
    return this.cryptoData.get(symbol);
  }

  updateCryptoPrices() {
    ['BITCOIN', 'SOLANA'].forEach(symbol => {
      const currentData = this.cryptoData.get(symbol);
      if (!currentData) return;

      // Generate realistic price movements
      const volatility = symbol === 'BITCOIN' ? 0.002 : 0.005; // SOL is more volatile
      const priceChange = (Math.random() - 0.5) * currentData.price * volatility;
      const newPrice = Math.max(currentData.price + priceChange, 1); // Prevent negative prices
      
      // Calculate change from base price
      const basePrice = symbol === 'BITCOIN' ? 60245.50 : 181.82;
      const totalChange = newPrice - basePrice;
      const changePercent = (totalChange / basePrice) * 100;

      const updatedData = {
        price: newPrice,
        change: totalChange,
        changePercent: changePercent,
        lastUpdate: Date.now(),
        volume: Math.floor(Math.random() * 50000) + 10000,
        isLive: true
      };

      this.cryptoData.set(symbol, updatedData);

      // Notify subscribers
      const symbolSubscribers = this.subscribers.get(symbol);
      if (symbolSubscribers) {
        symbolSubscribers.forEach(callback => {
          try {
            callback(symbol, updatedData);
          } catch (error) {
            console.error(`Error in crypto data callback for ${symbol}:`, error);
          }
        });
      }
    });
  }

  subscribe(symbol, callback) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    this.subscribers.get(symbol).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(symbol);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(symbol);
        }
      }
    };
  }

  getCurrentData(symbol) {
    return this.cryptoData.get(symbol);
  }

  getAllData() {
    const result = {};
    this.cryptoData.forEach((data, symbol) => {
      result[symbol] = data;
    });
    return result;
  }

  isCryptoMarketOpen() {
    // Crypto markets are always open (24/7)
    return true;
  }
}

// Create singleton instance
const cryptoDataService = new CryptoDataService();

export default cryptoDataService;
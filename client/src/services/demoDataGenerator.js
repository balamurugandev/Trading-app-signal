import dataUpdateService from './dataUpdateService';

class DemoDataGenerator {
  constructor() {
    this.isRunning = false;
    this.intervals = [];
    this.signalId = 1;
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 Starting demo data generation for high-frequency testing');

    // Generate signals every 2-5 seconds
    const signalInterval = setInterval(() => {
      this.generateSignal();
    }, Math.random() * 3000 + 2000);

    // Update market data every 100ms for high-frequency testing
    const marketDataInterval = setInterval(() => {
      this.generateMarketData();
    }, 100);

    // Update signal statuses every 10 seconds
    const statusInterval = setInterval(() => {
      this.updateRandomSignalStatus();
    }, 10000);

    this.intervals = [signalInterval, marketDataInterval, statusInterval];
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    console.log('⏹️ Stopped demo data generation');
  }

  generateSignal() {
    const symbols = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX'];
    const timeframes = ['1m', '3m', '5m', '15m'];
    const types = ['BUY', 'SELL'];
    
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const basePrice = symbol === 'NIFTY' ? 19500 : 
                     symbol === 'BANKNIFTY' ? 45000 : 
                     symbol === 'FINNIFTY' ? 19000 : 65000;
    
    const entryPrice = basePrice + (Math.random() - 0.5) * 1000;
    const stopLoss = type === 'BUY' ? entryPrice * 0.995 : entryPrice * 1.005;
    const target1 = type === 'BUY' ? entryPrice * 1.01 : entryPrice * 0.99;
    const target2 = type === 'BUY' ? entryPrice * 1.02 : entryPrice * 0.98;
    
    const signal = {
      id: `demo_${this.signalId++}`,
      symbol,
      timeframe,
      type,
      entryPrice: Math.round(entryPrice * 100) / 100,
      stopLoss: Math.round(stopLoss * 100) / 100,
      target1: Math.round(target1 * 100) / 100,
      target2: Math.round(target2 * 100) / 100,
      strength: Math.floor(Math.random() * 40) + 60, // 60-100%
      status: 'active',
      timestamp: Date.now(),
      optionStrike: Math.round(entryPrice / 50) * 50,
      riskReward: '1:2',
      pnl: 0,
      receivedAt: new Date().toISOString()
    };

    // Push to high-frequency service with high priority
    dataUpdateService.queueUpdate('newSignal', signal, 2);
    
    console.log(`📊 Generated ${type} signal for ${symbol} ${timeframe} at ₹${entryPrice}`);
  }

  generateMarketData() {
    const symbols = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX'];
    
    symbols.forEach(symbol => {
      const basePrice = symbol === 'NIFTY' ? 19500 : 
                       symbol === 'BANKNIFTY' ? 45000 : 
                       symbol === 'FINNIFTY' ? 19000 : 65000;
      
      const price = basePrice + (Math.random() - 0.5) * 200;
      const change = (Math.random() - 0.5) * 100;
      const changePercent = (change / basePrice) * 100;
      
      const marketData = {
        [symbol]: {
          '1m': {
            data: {
              close: Math.round(price * 100) / 100,
              change: Math.round(change * 100) / 100,
              changePercent: Math.round(changePercent * 100) / 100,
              volume: Math.floor(Math.random() * 1000000),
              timestamp: Date.now()
            },
            lastUpdate: Date.now()
          }
        }
      };

      // Push to high-frequency service
      dataUpdateService.queueUpdate('marketData', marketData, 1);
    });
  }

  updateRandomSignalStatus() {
    const statuses = ['hit_target', 'hit_stop', 'expired'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const signalUpdate = {
      id: `demo_${Math.floor(Math.random() * this.signalId)}`,
      status,
      exitPrice: Math.random() * 1000 + 19000,
      pnl: (Math.random() - 0.3) * 10, // Slightly biased towards profit
      exitTime: new Date().toISOString()
    };

    dataUpdateService.queueUpdate('signalUpdate', signalUpdate, 1);
    
    console.log(`🔄 Updated signal ${signalUpdate.id} status to ${status}`);
  }

  // Generate a burst of updates for stress testing
  generateBurst(count = 100) {
    console.log(`💥 Generating burst of ${count} updates for stress testing`);
    
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.generateSignal();
        this.generateMarketData();
      }, i * 10); // 10ms intervals
    }
  }
}

// Create singleton instance
const demoDataGenerator = new DemoDataGenerator();

// Auto-start in development mode
if (process.env.NODE_ENV === 'development') {
  // Start after a short delay to allow components to mount
  setTimeout(() => {
    demoDataGenerator.start();
  }, 2000);
}

export default demoDataGenerator;
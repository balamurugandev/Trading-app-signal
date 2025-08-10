# Personal Live Data Setup Guide
## NSE Scalping Signals - Local Implementation

### Overview
This guide helps you integrate live market data into your personal trading dashboard running locally. We'll focus on cost-effective solutions that provide real-time signals for NIFTY and BANKNIFTY options.

---

## 🚀 Quick Start (Recommended for Personal Use)

### Option 1: Zerodha Kite Connect (Most Popular)
**Cost**: ₹2,000/month | **Setup Time**: 2-3 hours | **Latency**: 100-500ms

#### Step 1: Get Kite Connect Access
1. Open a Zerodha account (if you don't have one)
2. Apply for Kite Connect API access at [developers.kite.trade](https://developers.kite.trade)
3. Pay ₹2,000/month subscription fee
4. Get your API key and access token

#### Step 2: Install Dependencies
```bash
npm install kiteconnect ws
```

#### Step 3: Create Kite Data Provider
```javascript
// server/providers/kiteDataProvider.js
const KiteConnect = require('kiteconnect').KiteConnect;
const KiteTicker = require('kiteconnect').KiteTicker;

class KiteDataProvider {
    constructor(apiKey, accessToken) {
        this.kite = new KiteConnect({ api_key: apiKey });
        this.kite.setAccessToken(accessToken);
        this.ticker = new KiteTicker({
            api_key: apiKey,
            access_token: accessToken
        });
        this.subscribers = new Map();
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.ticker.on('connect', () => {
                console.log('✅ Connected to Kite WebSocket');
                resolve();
            });

            this.ticker.on('error', (error) => {
                console.error('❌ Kite connection error:', error);
                reject(error);
            });

            this.ticker.on('ticks', (ticks) => {
                this.processTicks(ticks);
            });

            this.ticker.connect();
        });
    }

    processTicks(ticks) {
        ticks.forEach(tick => {
            const normalizedData = {
                symbol: this.getSymbolName(tick.instrument_token),
                ltp: tick.last_price,
                volume: tick.volume,
                bid: tick.depth?.buy?.[0]?.price || 0,
                ask: tick.depth?.sell?.[0]?.price || 0,
                timestamp: new Date(),
                depth: tick.depth
            };

            // Emit to subscribers
            const callback = this.subscribers.get(tick.instrument_token);
            if (callback) {
                callback(normalizedData);
            }
        });
    }

    async subscribeToInstruments() {
        // Get NIFTY and BANKNIFTY option instruments
        const instruments = await this.kite.getInstruments('NFO');
        
        // Filter for current week expiry NIFTY and BANKNIFTY options
        const currentWeekOptions = this.filterCurrentWeekOptions(instruments);
        
        // Subscribe to ATM ±5 strikes
        const tokens = this.getATMTokens(currentWeekOptions);
        
        this.ticker.subscribe(tokens);
        this.ticker.setMode(this.ticker.modeFull, tokens);
        
        return tokens;
    }

    filterCurrentWeekOptions(instruments) {
        const now = new Date();
        const currentWeek = this.getCurrentWeekExpiry(now);
        
        return instruments.filter(inst => 
            (inst.name === 'NIFTY' || inst.name === 'BANKNIFTY') &&
            inst.instrument_type === 'CE' &&
            inst.expiry.toDateString() === currentWeek.toDateString()
        );
    }

    getATMTokens(options) {
        // Get current NIFTY and BANKNIFTY prices
        // Select ATM ±5 strikes for both
        // Return instrument tokens
        return tokens;
    }
}

module.exports = KiteDataProvider;
```

#### Step 4: Update Your Server
```javascript
// server/index.js - Add this to your existing server
const KiteDataProvider = require('./providers/kiteDataProvider');

// Initialize Kite provider
const kiteProvider = new KiteDataProvider(
    process.env.KITE_API_KEY,
    process.env.KITE_ACCESS_TOKEN
);

// Connect and start receiving data
async function startLiveData() {
    try {
        await kiteProvider.connect();
        await kiteProvider.subscribeToInstruments();
        console.log('🎯 Live data feed started!');
    } catch (error) {
        console.error('Failed to start live data:', error);
    }
}

// Start live data when server starts
startLiveData();
```

#### Step 5: Environment Variables
```bash
# .env
KITE_API_KEY=your_api_key_here
KITE_ACCESS_TOKEN=your_access_token_here
```

---

### Option 2: Angel One SmartAPI (Budget Option)
**Cost**: Free/₹1,000/month | **Setup Time**: 1-2 hours | **Latency**: 200-800ms

#### Quick Setup
```javascript
// server/providers/angelDataProvider.js
const SmartAPI = require('smartapi-javascript');

class AngelDataProvider {
    constructor(apiKey, clientId, password, totp) {
        this.smartApi = new SmartAPI({
            api_key: apiKey,
            clientId: clientId,
            password: password,
            totp: totp
        });
    }

    async connect() {
        const loginResponse = await this.smartApi.generateSession();
        if (loginResponse.status) {
            console.log('✅ Connected to Angel One');
            this.startDataFeed();
        }
    }

    startDataFeed() {
        // Subscribe to NIFTY and BANKNIFTY options
        setInterval(async () => {
            const quotes = await this.getQuotes();
            this.processQuotes(quotes);
        }, 1000); // 1-second updates
    }
}
```

---

### Option 3: Free Alternative (Limited but Functional)
**Cost**: Free | **Setup Time**: 30 minutes | **Latency**: 1-5 seconds

#### Using Yahoo Finance API
```javascript
// server/providers/yahooDataProvider.js
const axios = require('axios');

class YahooDataProvider {
    constructor() {
        this.symbols = ['^NSEI', '^NSEBANK']; // NIFTY and BANKNIFTY
        this.updateInterval = 5000; // 5 seconds
    }

    async startDataFeed() {
        setInterval(async () => {
            try {
                const data = await this.fetchData();
                this.processData(data);
            } catch (error) {
                console.error('Yahoo data fetch error:', error);
            }
        }, this.updateInterval);
    }

    async fetchData() {
        const promises = this.symbols.map(symbol => 
            axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`)
        );
        
        const responses = await Promise.all(promises);
        return responses.map(response => response.data);
    }

    processData(data) {
        data.forEach(symbolData => {
            const result = symbolData.chart.result[0];
            const meta = result.meta;
            const quote = result.indicators.quote[0];
            
            const processedData = {
                symbol: meta.symbol,
                ltp: meta.regularMarketPrice,
                volume: meta.regularMarketVolume,
                timestamp: new Date()
            };
            
            // Emit to your signal generator
            this.emit('tick', processedData);
        });
    }
}
```

---

## 🔧 Implementation Steps

### Step 1: Choose Your Data Provider
For personal use, I recommend **Zerodha Kite Connect** because:
- ✅ Reliable and widely used
- ✅ Good documentation
- ✅ Reasonable cost for personal use
- ✅ Real-time options data
- ✅ Good latency for scalping

### Step 2: Modify Your Existing Code

#### Update DataProvider Service
```javascript
// server/services/dataProvider.js - Replace existing with live data
const KiteDataProvider = require('../providers/kiteDataProvider');

class DataProvider {
    constructor() {
        this.kiteProvider = new KiteDataProvider(
            process.env.KITE_API_KEY,
            process.env.KITE_ACCESS_TOKEN
        );
        this.isLive = process.env.NODE_ENV === 'production';
    }

    async initialize() {
        if (this.isLive) {
            await this.kiteProvider.connect();
            console.log('🎯 Live data provider initialized');
        } else {
            console.log('📊 Demo mode - using simulated data');
        }
    }

    async getLatestData(symbol, timeframe) {
        if (this.isLive) {
            return await this.kiteProvider.getHistoricalData(symbol, timeframe);
        } else {
            // Return your existing demo data
            return this.generateDemoData(symbol, timeframe);
        }
    }

    subscribeToRealTimeData(symbol, callback) {
        if (this.isLive) {
            this.kiteProvider.subscribe(symbol, callback);
        } else {
            // Simulate real-time updates for demo
            this.simulateRealTimeData(symbol, callback);
        }
    }
}
```

#### Update Signal Generator for Live Data
```javascript
// server/services/signalGenerator.js - Enhance for live data
class SignalGenerator {
    constructor(technicalAnalysis, riskManager, dataProvider) {
        this.technical = technicalAnalysis;
        this.risk = riskManager;
        this.dataProvider = dataProvider;
        this.lastSignalTime = new Map();
    }

    async generateLiveSignal(symbol, timeframe, currentTick) {
        // Prevent signal spam - minimum 30 seconds between signals
        const lastSignal = this.lastSignalTime.get(symbol);
        if (lastSignal && Date.now() - lastSignal < 30000) {
            return null;
        }

        // Get historical data for technical analysis
        const historicalData = await this.dataProvider.getLatestData(symbol, timeframe);
        if (!historicalData || historicalData.length < 50) {
            return null;
        }

        // Calculate technical indicators
        const indicators = this.technical.calculateIndicators(historicalData);
        
        // Add current tick data
        const currentData = {
            ...currentTick,
            indicators: {
                vwap: indicators.vwap[indicators.vwap.length - 1],
                ema9: indicators.ema9[indicators.ema9.length - 1],
                ema21: indicators.ema21[indicators.ema21.length - 1],
                rsi: indicators.rsi[indicators.rsi.length - 1],
                macd: indicators.macd[indicators.macd.length - 1]
            }
        };

        // Generate signal using your existing logic
        const signal = this.generateSignal(symbol, timeframe, [currentData], indicators);
        
        if (signal) {
            this.lastSignalTime.set(symbol, Date.now());
            console.log(`🚨 LIVE SIGNAL: ${symbol} ${timeframe}`, signal);
        }

        return signal;
    }
}
```

### Step 3: Update Frontend for Live Mode

#### Add Live Data Toggle
```javascript
// client/src/components/TradingDashboard.jsx - Add live mode toggle
const [isLiveMode, setIsLiveMode] = useState(false);

const LiveModeToggle = () => (
    <div className="flex items-center space-x-2">
        <Button
            variant={isLiveMode ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsLiveMode(true)}
            className="flex items-center space-x-1"
        >
            <Zap className="h-4 w-4" />
            <span>Live</span>
        </Button>
        <Button
            variant={!isLiveMode ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsLiveMode(false)}
            className="flex items-center space-x-1"
        >
            <Database className="h-4 w-4" />
            <span>Demo</span>
        </Button>
    </div>
);
```

#### Connect to Live WebSocket
```javascript
// client/src/hooks/useLiveData.js
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useLiveData = (isLiveMode) => {
    const [socket, setSocket] = useState(null);
    const [liveSignals, setLiveSignals] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');

    useEffect(() => {
        if (isLiveMode) {
            const newSocket = io('http://localhost:3001');
            
            newSocket.on('connect', () => {
                setConnectionStatus('connected');
                console.log('🔗 Connected to live data feed');
            });

            newSocket.on('liveSignal', (signal) => {
                setLiveSignals(prev => [signal, ...prev.slice(0, 49)]); // Keep last 50
                console.log('📡 New live signal received:', signal);
            });

            newSocket.on('disconnect', () => {
                setConnectionStatus('disconnected');
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        }
    }, [isLiveMode]);

    return { liveSignals, connectionStatus };
};
```

---

## 📱 Quick Setup Commands

### 1. Install Required Packages
```bash
# Server dependencies
npm install kiteconnect ws axios moment-timezone

# Client dependencies (if needed)
cd client && npm install socket.io-client
```

### 2. Environment Setup
```bash
# Create .env file
echo "KITE_API_KEY=your_api_key" >> .env
echo "KITE_ACCESS_TOKEN=your_access_token" >> .env
echo "NODE_ENV=production" >> .env
```

### 3. Start Your App
```bash
# Start server (with live data)
npm start

# Start client
cd client && npm start
```

---

## 🎯 Expected Results

Once set up, you'll get:

### Live Trading Signals
- ✅ Real NIFTY/BANKNIFTY option signals
- ✅ Based on live market data
- ✅ Technical analysis on real prices
- ✅ Proper entry/exit levels
- ✅ Real-time cost calculations

### Signal Example
```json
{
  "symbol": "NIFTY",
  "timeframe": "5m",
  "type": "BUY_CALL",
  "strike": "21500 CE",
  "entry": 21520.50,
  "premium": 85.75,
  "stopLoss": 21305,
  "target1": 21843,
  "target2": 22058,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "confidence": "HIGH",
  "reason": "EMA crossover + RSI > 50 + VWAP support"
}
```

---

## 💡 Pro Tips for Personal Use

### 1. Start Small
- Begin with paper trading
- Test signals for a week before real money
- Keep a trading journal

### 2. Optimize for Your Style
- Adjust signal frequency in settings
- Set your risk tolerance
- Customize timeframes you prefer

### 3. Monitor Performance
- Track signal accuracy
- Monitor latency during market hours
- Keep logs of all signals

### 4. Cost Management
- Zerodha Kite: ₹2,000/month is reasonable for serious trading
- Angel One: Good backup option
- Yahoo Finance: Free but limited (good for testing)

---

## 🚨 Important Notes

### Market Hours
- Signals only during market hours (9:15 AM - 3:30 PM IST)
- Most active during liquid windows (9:25-11:00, 13:45-15:05)

### Risk Management
- Never risk more than 2% per trade
- Set stop losses religiously
- Don't chase signals during high volatility

### Legal Compliance
- This is for personal use only
- Follow SEBI guidelines for algorithmic trading
- Maintain proper records for tax purposes

---

## 🔧 Troubleshooting

### Common Issues
1. **No signals appearing**: Check API credentials and market hours
2. **High latency**: Switch to a better data provider
3. **Connection drops**: Implement reconnection logic
4. **Wrong signals**: Verify technical analysis parameters

### Support
- Zerodha Kite Connect: [kite.trade/docs](https://kite.trade/docs)
- Angel One API: [smartapi.angelbroking.com](https://smartapi.angelbroking.com)

---

## 📈 Next Steps

1. **Week 1**: Set up Kite Connect and test connection
2. **Week 2**: Integrate live data and test signals
3. **Week 3**: Paper trade and track performance
4. **Week 4**: Go live with small amounts

**Budget**: ₹2,000-₹3,000/month for live data
**Time Investment**: 4-6 hours setup + ongoing monitoring

This setup will give you a professional-grade personal trading signal system running locally with live market data! 🚀
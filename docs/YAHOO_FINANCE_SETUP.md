# Yahoo Finance Live Data Integration

## 🎯 Quick Start (FREE Live Data)

Your NSE Scalping Signals dashboard now supports **FREE** live market data from Yahoo Finance!

### ✅ What You Get
- **Real NIFTY & BANKNIFTY prices** (updated every 5 seconds)
- **Live market data** during trading hours (9:15 AM - 3:30 PM IST)
- **Historical data** for technical analysis
- **Market status** detection
- **Zero cost** - completely free!

---

## 🚀 How to Start with Live Data

### Option 1: Quick Start (Recommended)
```bash
# Start with live data enabled
npm run dev:live
```

### Option 2: Production Mode
```bash
# Install dependencies first (if not done)
npm run install-all

# Start with live data
npm run start:live
```

### Option 3: Manual Environment
```bash
# Set environment variable and start
export LIVE_DATA=true
npm run dev
```

---

## 📊 Live Data Features

### Real-Time Updates
- **NIFTY 50** live prices from NSE
- **BANKNIFTY** live prices from NSE  
- **5-second updates** during market hours
- **Automatic fallback** to demo mode if data fails

### Technical Analysis
- **Live OHLC data** for 1m, 5m, 15m timeframes
- **Real-time indicators**: VWAP, EMA, RSI, MACD, Bollinger Bands
- **Historical data** for backtesting and analysis

### Market Status
- **Automatic detection** of market hours
- **Weekend/holiday** handling
- **Session tracking** (Morning, Midday, Afternoon)

---

## 🎮 Dashboard Controls

### Live/Demo Toggle
In your dashboard, you'll see a toggle button:
- **Demo**: Uses simulated data (for testing)
- **Live (Yahoo)**: Uses real market data from Yahoo Finance

### API Endpoints
- `GET /api/data/status` - Check live data status
- `POST /api/data/enable-live` - Enable live data mode
- `POST /api/data/disable-live` - Switch to demo mode
- `GET /api/data/current/NIFTY` - Get current NIFTY data
- `GET /api/data/current/BANKNIFTY` - Get current BANKNIFTY data

---

## 📈 Expected Output

When you start with live data, you'll see:

```
🚀 Starting NSE Scalping Signals with Live Data (Yahoo Finance)
📡 Live data mode: ENABLED
💰 Cost: FREE (Yahoo Finance)
⏱️  Update frequency: 5 seconds
📊 Symbols: NIFTY, BANKNIFTY

✅ Yahoo Finance provider started successfully
📊 Live update: NIFTY - ₹21,520.35 (+15.25)
📊 Live update: BANKNIFTY - ₹46,180.50 (-25.75)
📈 Retrieved 100 live data points for NIFTY 5m
🚨 LIVE SIGNAL: NIFTY 5m { type: 'BUY_CALL', strike: '21500 CE', ... }
```

---

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Enable live data
LIVE_DATA=true

# Server port
PORT=3001

# Update intervals
UPDATE_INTERVAL=5000
CACHE_TIMEOUT=5000
```

### Customization
You can modify these settings in `server/services/yahooFinanceProvider.js`:
- **Update frequency**: Change `updateInterval` (default: 5000ms)
- **Symbols**: Add more symbols to the `symbols` object
- **Timeout**: Adjust API timeout settings

---

## 🚨 Important Notes

### Market Hours
- **Live data only during**: 9:15 AM - 3:30 PM IST (Monday-Friday)
- **Outside market hours**: Automatically switches to last known prices
- **Weekends**: Uses demo data

### Data Limitations
- **Update frequency**: 5 seconds (Yahoo Finance limitation)
- **Symbols**: Currently NIFTY & BANKNIFTY only
- **Options data**: Not available (only underlying prices)
- **Depth data**: Not available (only LTP, OHLC, Volume)

### Reliability
- **Automatic fallback**: If Yahoo Finance fails, switches to demo mode
- **Error handling**: Graceful degradation with cached data
- **Reconnection**: Automatic retry on connection failures

---

## 🎯 Trading Signals with Live Data

### Signal Generation
When live data is enabled, your signals will be based on:
- **Real market prices** from Yahoo Finance
- **Live technical indicators** calculated from real data
- **Actual market conditions** and volatility
- **Real-time market status** validation

### Signal Quality
- ✅ **Higher accuracy** due to real market data
- ✅ **Better timing** with live price updates
- ✅ **Realistic backtesting** with historical data
- ✅ **Market hours validation** prevents off-hours signals

---

## 🔍 Troubleshooting

### No Live Data
If you don't see live updates:
1. Check if `LIVE_DATA=true` in your .env file
2. Verify internet connection
3. Check if it's market hours (9:15 AM - 3:30 PM IST)
4. Look for error messages in console

### Slow Updates
If data seems slow:
1. Yahoo Finance has 5-second minimum delay
2. Check your internet speed
3. Verify server isn't overloaded

### Connection Errors
If you see connection errors:
1. Yahoo Finance might be temporarily down
2. Your IP might be rate-limited (rare)
3. Check firewall settings
4. System will automatically fallback to demo mode

---

## 📞 Support

### Logs to Check
- Server console for Yahoo Finance connection status
- Browser console for frontend data updates
- Network tab for API call failures

### Common Issues
1. **"No live data available"** - Market is closed or Yahoo Finance is down
2. **"Failed to initialize live data"** - Network or configuration issue
3. **"Returning expired cached data"** - Using cached data due to API failure

---

## 🎉 Success!

You now have a **FREE** live data trading dashboard! 

### Next Steps
1. **Test the signals** during market hours
2. **Monitor accuracy** compared to your broker's data
3. **Adjust timeframes** based on your trading style
4. **Consider upgrading** to paid data providers for lower latency if needed

### Upgrade Path
If you need faster updates or more features:
- **Zerodha Kite Connect**: ₹2,000/month, 100-500ms latency
- **Angel One SmartAPI**: ₹1,000/month, 200-800ms latency
- **TrueData**: ₹15,000/month, 10-50ms latency

But for personal use and learning, Yahoo Finance is perfect! 🚀
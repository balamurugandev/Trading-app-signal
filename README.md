# NSE Trading App - Real-time Scalping Signals

A comprehensive real-time trading application for NSE (National Stock Exchange) that provides scalping signals for NIFTY and BANKNIFTY with live market data integration.

## 🚀 Quick Start

```bash
# Install dependencies
npm run install-all

# Start the application (server + client)
npm start
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 📁 Project Structure

```
trading-app/
├── client/                 # React frontend application
├── server/                 # Node.js backend server
├── tests/                  # Test files and scripts
├── debug/                  # Debug utilities and tools
├── scripts/                # Start scripts and utilities
├── docs/                   # Documentation files
├── start.js               # Main application starter
└── package.json           # Project configuration
```

## 🛠️ Available Scripts

### Main Commands
- `npm start` - Start both server and client
- `npm run dev` - Development mode with hot reload
- `npm run build` - Build production version

### Server Commands
- `npm run server` - Start server only (live data mode)
- `npm run server:dev` - Start server in development mode

### Client Commands
- `npm run client` - Start client only

### Testing Commands
- `npm test` - Run basic market data tests
- `npm run test:signals` - Test signal generation
- `npm run test:live` - Test live/demo modes
- `npm run test:indicators` - Test technical indicators

### Debug Commands
- `npm run debug` - Debug live mode issues
- `npm run kill-server` - Stop running server
- `npm run check-server` - Check if server is running

## 🔧 Features

### Standard Mode
- Real-time NIFTY and BANKNIFTY data
- Live scalping signal generation
- Technical indicator analysis (RSI, MACD, EMA, VWAP)
- WebSocket-based real-time updates

### Advanced Mode
- Enhanced signal algorithms
- Market quality analysis
- Execution quality metrics
- Advanced risk management

## 📊 Technical Indicators

- **RSI** (Relative Strength Index)
- **MACD** (Moving Average Convergence Divergence)
- **EMA** (Exponential Moving Average)
- **VWAP** (Volume Weighted Average Price)
- **Bollinger Bands**
- **CPR** (Central Pivot Range)

## 🔗 API Endpoints

- `GET /api/health` - Server health check
- `GET /api/data/current/:symbol` - Current market data
- `GET /api/indicators/:symbol/:timeframe` - Technical indicators
- `GET /api/data/status` - Market status

## 📈 Signal Generation

The application generates scalping signals based on:
- Technical indicator confluence
- Market momentum analysis
- Risk-reward optimization
- Real-time market conditions

## 🛡️ Risk Management

- Automatic stop-loss calculation
- Position sizing recommendations
- Risk-reward ratio analysis
- Market volatility assessment

## 📱 Frontend Features

- Real-time signal feed
- Interactive trading dashboard
- Market status indicators
- Technical analysis charts
- Signal performance tracking

## 🔧 Configuration

The application uses environment variables for configuration:
- `LIVE_DATA=true` - Enable live data mode
- `PORT=3001` - Server port (default: 3001)

## 📚 Documentation

Detailed documentation is available in the `docs/` folder:
- Setup guides
- API documentation
- Testing procedures
- Troubleshooting guides

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## ⚠️ Disclaimer

This application is for educational and research purposes only. Trading in financial markets involves substantial risk. Always consult with a qualified financial advisor before making trading decisions.
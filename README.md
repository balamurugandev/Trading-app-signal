# NSE Scalping Signals - Real-time Trading Dashboard

A comprehensive full-stack trading application that generates real-time scalping signals for Nifty and Bank Nifty options trading on the NSE (National Stock Exchange of India).

## 🚀 Features

### Backend Core Logic
- **Rules-based Confluence Strategy**: Automatic BUY signals for ATM/ITM options
- **Trend Filter**: Signals only when price is above VWAP with bullish EMA alignment (9 EMA > 21 EMA)
- **Momentum Triggers**: RSI turning up through 40-60 zone or MACD bullish crossover
- **Volatility/Structure**: Bollinger Bands expansion and CPR/pivot level analysis
- **Strict Risk Controls**: Liquid window trading (9:25-11:00, 13:45-15:05) with tight stops
- **Signal Validation**: Multi-factor confluence requirement before signal generation

### Frontend Dashboard
- **Real-time Charts**: Interactive candlestick charts with technical indicators
- **Live Signal Feed**: Actionable signals with entry/exit levels
- **Technical Analysis**: VWAP, EMA ribbon, RSI, MACD, Bollinger Bands, CPR overlays
- **Risk Management**: Real-time risk metrics and position sizing
- **Demo Mode**: Historical data backtesting capability

### Technical Indicators
- **VWAP** (Volume Weighted Average Price) - Trend filter
- **EMA 9/21** - Fast moving averages for trend alignment
- **RSI** (7, 9, 14 periods) - Momentum oscillator
- **MACD** (12,26,9) - Trend and momentum confirmation
- **Bollinger Bands** (20,2) - Volatility and breakout detection
- **CPR** (Central Pivot Range) - Support/resistance levels
- **Parabolic SAR** - Trailing stop guidance

## 🛠 Technology Stack

### Backend
- **Node.js** with Express.js
- **Socket.io** for real-time communication
- **Technical Indicators** library for calculations
- **Moment.js** for Indian timezone handling
- **Cron jobs** for market session management

### Frontend
- **React 18** with Vite
- **shadcn/ui** components with Tailwind CSS
- **Lightweight Charts** for trading charts
- **Socket.io Client** for real-time updates
- **Lucide React** for icons

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm
- Git

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd nse-scalping-signals
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..
```

3. **Start the application**
```bash
# Start both server and client concurrently
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Manual Setup

**Backend Setup:**
```bash
# Install server dependencies
npm install

# Start the server
npm run server
```

**Frontend Setup:**
```bash
# Navigate to client directory
cd client

# Install client dependencies
npm install

# Start the development server
npm start
```

## 🎯 Usage

### Dashboard Overview
1. **Market Status**: Real-time market session and liquid window indicators
2. **Symbol Selection**: Toggle between NIFTY and BANKNIFTY
3. **Timeframe Selection**: Choose from 1m, 5m, or 15m charts
4. **Live/Demo Toggle**: Switch between live signals and demo mode

### Signal Interpretation
Each signal includes:
- **Entry Price**: Recommended option entry level
- **Stop Loss**: Risk management level (VWAP/CPR/technical)
- **Targets**: 1R and 1.5R profit targets
- **Signal Strength**: Confluence score (0-100%)
- **Conditions Met**: Which technical filters triggered the signal

### Risk Management
- **Liquid Windows**: Signals only during high-liquidity periods
- **Position Sizing**: Based on risk percentage and stop loss
- **Signal Limits**: Maximum signals per hour/day to prevent overtrading
- **Emergency Stop**: Manual halt of all signal generation

## 🔧 Configuration

### Demo Mode
The application runs in demo mode by default with simulated NSE data. To connect real data:

1. Update `server/services/dataProvider.js`
2. Set `demoMode = false`
3. Implement your preferred NSE data provider:
   - Zerodha Kite API
   - Angel Broking API
   - IIFL Markets API
   - Professional data vendors

### Signal Parameters
Modify signal generation rules in `server/services/signalGenerator.js`:
- RSI periods and thresholds
- EMA periods for trend filter
- Bollinger Bands parameters
- Risk-reward ratios
- Stop loss calculation methods

### Market Hours
Indian market timings are configured in `server/index.js`:
- Market Hours: 9:15 AM - 3:30 PM IST
- Liquid Windows: 9:25-11:00 AM, 1:45-3:05 PM IST

## 📊 API Endpoints

### REST API
- `GET /api/health` - Server health and market status
- `GET /api/historical/:symbol/:timeframe` - Historical market data

### WebSocket Events
- `marketStatus` - Market session updates
- `marketData` - Real-time price and indicator updates
- `newSignal` - New trading signal generation

## 🚨 Risk Disclaimer

**Important**: This application is for educational and research purposes. 

- Signals are based on technical analysis and historical patterns
- Past performance does not guarantee future results
- Always conduct your own research before trading
- Consider your risk tolerance and financial situation
- Options trading involves substantial risk of loss
- The developers are not responsible for any trading losses

## 🔮 Future Enhancements

### Performance Optimizations
- WebSocket connection pooling
- Redis caching for market data
- Database integration for signal history
- Load balancing for multiple users

### Security Improvements
- API authentication and rate limiting
- Encrypted WebSocket connections
- User session management
- Audit logging for all signals

### Analytics Features
- Signal performance tracking
- Backtesting engine with historical data
- Portfolio management integration
- Advanced charting with custom indicators
- Mobile app development

### Data Integration
- Multiple NSE data provider support
- Real-time options chain data
- News sentiment analysis
- Economic calendar integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For questions, issues, or feature requests:
- Create an issue on GitHub
- Check the documentation in `/docs`
- Review the code comments for implementation details

---

**Built for Indian traders, by traders** 🇮🇳

*Happy Trading! May your signals be strong and your profits be consistent.*
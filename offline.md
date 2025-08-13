# NSE Scalping Signals Application - Offline Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [Technical Indicators](#technical-indicators)
7. [Signal Generation](#signal-generation)
8. [Market Data Integration](#market-data-integration)
9. [Frontend Implementation](#frontend-implementation)
10. [Backend Services](#backend-services)
11. [Real-time Communication](#real-time-communication)
12. [Testing Framework](#testing-framework)
13. [Deployment](#deployment)
14. [Configuration](#configuration)
15. [Troubleshooting](#troubleshooting)

## Overview

The NSE Scalping Signals application is a real-time trading platform that provides scalping signals for NIFTY and BANKNIFTY indices. It features live market data integration, technical indicator analysis, and WebSocket-based real-time updates to deliver high-frequency trading signals with precise risk management.

Key features include:
- Real-time NSE market data
- Automatic scalping signal generation
- Technical indicator analysis (RSI, MACD, EMA, etc.)
- WebSocket-based updates
- Risk management with stop-loss calculation
- Interactive trading dashboard

## Architecture

The application follows a client-server architecture with real-time communication:

```
┌─────────────┐    WebSocket    ┌─────────────┐
│   Client    │◄───────────────►│   Server    │
│  (React)    │    REST API     │ (Node.js)   │
└─────────────┘                 └─────────────┘
       │                              │
       ▼                              ▼
┌─────────────┐                 ┌─────────────┐
│ Market Data │◄────────────────┤ Signal Gen  │
│ Providers   │                 │ Engine      │
└─────────────┘                 └─────────────┘
```

The frontend is a React application that communicates with a Node.js backend server. The backend fetches real-time market data, generates trading signals, and broadcasts them to connected clients via WebSocket.

## Project Structure

```
trading-app/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # Client-side services
│   │   └── lib/            # Utility functions
│   └── package.json        # Frontend dependencies
├── server/                 # Node.js backend server
│   ├── services/           # Core services
│   └── index.js            # Server entry point
├── tests/                  # Test files and scripts
├── scripts/                # Start scripts and utilities
├── docs/                   # Documentation files
├── package.json            # Root project configuration
└── README.md               # Project overview
```

## Core Components

### Frontend Components

**TradingDashboard.jsx**
- Main dashboard component
- Integrates all UI elements
- Manages state for symbol selection and timeframe

**SignalGrid.jsx**
- Displays real-time trading signals
- Interactive grid with signal details
- Color-coded signal status (active, closed, expired)

**MarketStatusIndicator.jsx**
- Visual indicator of market status
- Shows if markets are open/closed
- Displays current session information

**PerformanceMonitor.jsx**
- Monitors application performance
- Tracks FPS and memory usage
- Only active in development mode

**Header.jsx**
- Application header with stats
- Connection status indicator
- Navigation controls

**Sidebar.jsx & OptimizedSidebar.jsx**
- Navigation panel with market overview
- Symbol selection and filtering
- Timeframe controls

### Backend Services

**signalGenerator.js**
- Core signal generation engine
- Implements scalping algorithms
- Manages signal lifecycle

**dataProvider.js**
- Market data acquisition
- Integrates with external APIs
- Data caching and validation

**technicalAnalysis.js**
- Calculates technical indicators
- Implements RSI, MACD, EMA, VWAP
- Real-time indicator updates

**riskManager.js**
- Risk assessment calculations
- Stop-loss determination
- Position sizing recommendations

## Data Flow

1. **Market Data Acquisition**
   - Server fetches data from external APIs
   - Data is validated and cached
   - Updates are processed every second

2. **Technical Analysis**
   - Indicators calculated on new data
   - Historical data used for context
   - Results stored for signal generation

3. **Signal Generation**
   - Algorithms analyze indicator confluence
   - Risk parameters calculated
   - Signals broadcast to clients

4. **Frontend Display**
   - Signals rendered in real-time grid
   - Market status indicators updated
   - Performance metrics tracked

## Technical Indicators

### RSI (Relative Strength Index)
- Momentum oscillator (0-100 scale)
- Overbought/oversold detection
- Default period: 14

### MACD (Moving Average Convergence Divergence)
- Trend-following momentum indicator
- Signal line crossover detection
- Histogram for momentum visualization

### EMA (Exponential Moving Average)
- Weighted moving average
- More responsive to recent price changes
- Used for 9-period and 21-period analysis

### VWAP (Volume Weighted Average Price)
- Price benchmark based on volume
- Institutional trading reference
- Reset daily

### Bollinger Bands
- Volatility measurement tool
- Upper/middle/lower bands
- 20-period SMA with 2 standard deviations

### CPR (Central Pivot Range)
- Daily pivot point analysis
- Support/resistance levels
- Calculated from previous day's OHLC

## Signal Generation

The application generates scalping signals using a multi-factor approach:

### Signal Criteria
1. Indicator confluence (minimum 3 indicators)
2. Market momentum confirmation
3. Risk-reward ratio > 1.5:1
4. Volume confirmation
5. Time-based validity (5-minute expiry)

### Signal Types
- **Bullish Signals**: Buy opportunities
- **Bearish Signals**: Sell opportunities
- **Neutral**: Market consolidation

### Signal Attributes
- **Entry Point**: Optimal entry price
- **Target**: Profit target price
- **Stop Loss**: Risk limit price
- **Timeframe**: Recommended holding period
- **Confidence**: Signal strength (1-10 scale)

## Market Data Integration

### Data Sources
- Yahoo Finance API (primary)
- Custom data providers (secondary)
- Crypto market data services

### Data Processing
- Real-time data validation
- Outlier detection and filtering
- Price normalization across sources

### Update Frequency
- Equity data: 1-second intervals
- Crypto data: 2-second intervals
- Indicator recalculation: On each data update

### Data Caching
- In-memory caching for performance
- Cache invalidation strategies
- Historical data retention policies

## Frontend Implementation

### React Architecture
- Context API for state management
- Custom hooks for data fetching
- Component-based UI design
- Memoization for performance

### WebSocket Communication
- Real-time signal updates
- Market status broadcasts
- Connection health monitoring

### UI Components
- Real-time signal feed
- Interactive trading dashboard
- Market status indicators
- Technical analysis charts
- Signal performance tracking

### Performance Optimization
- Virtual scrolling for large datasets
- Component memoization
- Selective rendering
- Lazy loading for non-critical components

## Backend Services

### Server Structure
Built with Node.js and Express:
- REST API endpoints
- WebSocket server (Socket.IO)
- Background services
- Health monitoring

### Core Services
1. **Signal Engine**: Generates and manages trading signals
2. **Data Provider**: Fetches and processes market data
3. **Technical Analysis**: Calculates indicators in real-time
4. **Risk Manager**: Determines risk parameters for signals
5. **Execution Quality**: Monitors signal execution results

### API Endpoints
- `/api/health`: Server status check
- `/api/data/current/:symbol`: Current market data
- `/api/indicators/:symbol/:timeframe`: Technical indicators
- `/api/data/status`: Market status information
- `/api/signals/history`: Historical signal data

## Real-time Communication

### WebSocket Events
- `newSignal`: New signal generated
- `signalUpdate`: Signal status change
- `marketData`: Real-time market updates
- `marketStatus`: Market open/close status

### Connection Management
- Automatic reconnection
- Heartbeat monitoring
- Graceful disconnection handling
- Connection status broadcasting

### Data Broadcasting
- Efficient message serialization
- Client filtering by symbol
- Bandwidth optimization
- Message rate limiting

## Testing Framework

### Test Structure
Located in `tests/` directory:
- Unit tests for individual components
- Integration tests for data flow
- End-to-end tests for user scenarios
- Performance tests for scalability

### Key Test Scripts
- `npm test`: Run all basic tests
- `npm run test:signals`: Test signal generation
- `npm run test:live`: Test live/demo modes
- `npm run test:indicators`: Test technical indicators

### Testing Components
- Market data validation
- Signal generation accuracy
- UI component rendering
- WebSocket communication
- API endpoint responses

## Deployment

### Prerequisites
- Node.js (v16 or higher)
- npm package manager
- Internet connectivity for data APIs

### Installation Steps
1. Clone repository
2. Run `npm run install-all`
3. Configure environment variables
4. Start with `npm start`

### Deployment Options
- Local development
- Cloud hosting (AWS, Azure, GCP)
- Docker containerization
- PM2 process management

### Environment Configuration
Create `.env` file with:
- `LIVE_DATA=true` for real market data
- `PORT=3001` for server port
- API keys for data providers

## Configuration

### Environment Variables
- `LIVE_DATA`: Enable/disable live data mode
- `PORT`: Server port number
- `LOG_LEVEL`: Verbosity of server logs
- `API_KEYS`: Provider-specific keys

### Runtime Configuration
- Symbol selection (NIFTY, BANKNIFTY, etc.)
- Timeframe preferences (1m, 5m, 15m)
- Risk tolerance settings
- Display preferences

## Troubleshooting

### Common Issues

**Blank Screen on Startup**
- Check console for JavaScript errors
- Verify all dependencies are installed
- Ensure backend server is running

**No Signal Generation**
- Verify market data is flowing
- Check signal engine logs
- Confirm market is in active session

**Connection Problems**
- Check WebSocket connection status
- Verify server is accessible
- Confirm firewall settings

**Performance Issues**
- Monitor browser console for errors
- Check memory usage
- Reduce displayed symbols if needed

### Debugging Tools
- React DevTools for component inspection
- Network tab for API/WebSocket monitoring
- Server logs for backend issues
- Built-in performance monitor

### Log Analysis
Key log locations:
- Browser console for frontend issues
- Terminal output for server logs
- WebSocket events for communication tracking
- Performance monitor for optimization data

---
*This documentation provides a comprehensive overview of the NSE Scalping Signals application. For specific implementation details, refer to the source code and inline comments.*
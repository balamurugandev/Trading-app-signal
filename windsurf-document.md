# Trading Application Documentation

## Overview
A real-time trading application that provides NSE scalping signals for NIFTY and BANKNIFTY indices. The application features a client-server architecture with live market data integration, technical analysis, and signal generation.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Core Modules](#core-modules)
3. [Getting Started](#getting-started)
4. [API Endpoints](#api-endpoints)
5. [Data Flow](#data-flow)
6. [Deployment](#deployment)
7. [Testing](#testing)

## System Architecture

### High-Level Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────┐
│                 │     │                 │     │                     │
│  Yahoo Finance  │◄───►│  Backend Server │◄───►│  Frontend Client    │
│     API         │     │  (Node.js)      │     │  (React)            │
└─────────────────┘     └─────────────────┘     └─────────────────────┘
```

### Technology Stack
- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: React, Vite, Chart.js
- **Data Processing**: Technical indicators, Custom signal generation
- **Real-time Updates**: WebSockets
- **Testing**: Mocha, Chai

## Core Modules

### 1. Data Provider (`services/dataProvider.js`)
- Fetches and caches market data
- Supports both live and demo modes
- Handles data normalization and formatting

### 2. Technical Analysis (`services/technicalAnalysis.js`)
- Calculates various technical indicators:
  - VWAP (Volume Weighted Average Price)
  - EMAs (9, 21, 50, 100, 200)
  - RSI (Relative Strength Index)
  - MACD (Moving Average Convergence Divergence)
  - Bollinger Bands
  - Pivot Points

### 3. Signal Generation (`services/signalGenerator.js`)
- Implements trading strategies
- Generates buy/sell signals based on technical indicators
- Risk management integration

### 4. Advanced Signal Engine (`services/advancedSignalEngine.js`)
- Advanced market analysis
- Order execution simulation
- Market quality monitoring

### 5. Risk Management (`services/riskManager.js`)
- Position sizing
- Stop-loss calculation
- Risk-reward ratio management
- Signal frequency control

### 6. Execution Quality Service (`services/executionQuality.js`)
- Order execution simulation
- Slippage calculation
- Fill probability estimation
- Market impact analysis

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Git

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/balamurugandev/Trading-app-signal.git
   cd trading-app
   ```

2. Install dependencies:
   ```bash
   npm install
   cd client
   npm install
   cd ..
   ```

### Running the Application

#### Development Mode
```bash
# Start both server and client with hot-reload
npm run dev
```

#### Production Build
```bash
# Build the client
npm run build

# Start the server
npm start
```

## API Endpoints

### Market Data
- `GET /api/data/current/:symbol` - Get current market data
- `GET /api/data/historical/:symbol/:timeframe` - Get historical data
- `GET /api/indicators/:symbol/:timeframe` - Get technical indicators

### Signal Generation
- `POST /api/advanced/generate-signal` - Generate trading signal
- `GET /api/signals` - Get recent signals

### System Status
- `GET /api/health` - Health check
- `GET /api/data/status` - Data provider status
- `GET /api/market/status` - Market status

## Data Flow

1. **Data Collection**
   - Fetches data from Yahoo Finance API
   - Updates every 5 seconds during market hours
   - Caches data for performance

2. **Data Processing**
   - Normalizes incoming data
   - Calculates technical indicators
   - Updates market state

3. **Signal Generation**
   - Analyzes market conditions
   - Applies trading strategies
   - Generates signals with risk assessment

4. **Client Updates**
   - Pushes real-time updates via WebSockets
   - Updates UI components
   - Logs trading activity

## Deployment

The application is configured for deployment to a Node.js environment with the following requirements:

### Environment Variables
Create a `.env` file in the root directory:
```
PORT=3001
NODE_ENV=production
LIVE_DATA=true
```

### Process Management
For production, use a process manager like PM2:
```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start start.js --name "trading-app"

# Enable auto-start on system boot
pm2 startup
pm2 save
```

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm run test:signals
npm run test:indicators
npm run test:advanced
```

### Test Coverage
Generate coverage report:
```bash
npm run test:coverage
```

## Troubleshooting

### Common Issues
1. **Data Not Updating**
   - Verify Yahoo Finance API status
   - Check network connectivity
   - Ensure market is open

2. **Connection Issues**
   - Verify server is running
   - Check WebSocket connection
   - Review server logs

3. **Performance Problems**
   - Clear cache
   - Reduce update frequency
   - Check system resources

## License
[Specify License]

## Contact
[Your Contact Information]

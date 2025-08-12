# NSE Trading Signals Dashboard - Quick Start Guide

## Overview
A high-performance real-time trading signals dashboard for NSE (National Stock Exchange) with optimized scalping signals, technical analysis, and advanced risk management features.

## Features
- **High-Performance Real-time Updates**: Optimized for 60+ FPS with AG Grid virtualization
- **Real-time Signal Generation**: Live scalping signals for NIFTY, BANKNIFTY, FINNIFTY
- **Technical Analysis**: RSI, MACD, Bollinger Bands, Moving Averages
- **Risk Management**: Stop-loss, target levels, position sizing
- **WebSocket Integration**: Real-time data streaming with batching and throttling
- **Multiple Timeframes**: 1m, 3m, 5m, 15m, 1h support
- **Performance Tracking**: Win rate, P&L tracking, signal history
- **Optimized UI**: AG Grid with row virtualization, delta updates, and minimal re-renders
- **Performance Monitoring**: Real-time FPS, memory usage, and update rate tracking

## Dashboard Modes

### Optimized Dashboard (Default)
- High-performance AG Grid with virtualization
- Real-time updates at 60+ FPS
- Performance monitoring overlay
- Optimized for high-frequency trading data

### Standard Dashboard
- Traditional React components
- Good for general use

### Advanced Dashboard
- Additional technical indicators
- Advanced risk metrics

## Start the Application

### Option 1: Start Everything (Recommended)
```bash
npm start
```
This starts both backend server and frontend client automatically.

### Option 2: Start Separately

**Backend Server (Live Mode):**
```bash
npm run server
```

**Frontend Client:**
```bash
npm run client
```

## Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## Live Mode

Live mode is **automatically enabled** when you start the server. It provides:
- Real-time NIFTY and BANKNIFTY data
- Live scalping signal generation
- 1-second market data updates
- WebSocket real-time communication

## Verify Everything is Working

1. **Check Server**: http://localhost:3001/api/health
2. **Check Frontend**: http://localhost:5173
3. **Check Live Data**: Look for live price updates in the dashboard

## Stop the Application

Press `Ctrl+C` in the terminal to stop both server and client.

---

**That's it!** The application should be running with live data and signal generation active.
# Quick Start Guide

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
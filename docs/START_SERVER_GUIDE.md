# 🚀 Server Startup Guide for Live Data

## Quick Start Commands

### Option 1: Development Mode with Live Data (Recommended)
```bash
# Start both server and client with live data enabled
npm run dev:live
```

### Option 2: Server Only (for testing)
```bash
# Start just the server with live data
npm run server:live
```

### Option 3: Production Mode
```bash
# Start the production server with live data
npm run start:live
```

## Step-by-Step Startup

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Start the Server
Choose one of these methods:

**Method A: Full Development (Server + Client)**
```bash
npm run dev:live
```
This will start:
- Server on `http://localhost:3001` with live data enabled
- Client on `http://localhost:5173`

**Method B: Server Only**
```bash
npm run server:live
```
Then in another terminal:
```bash
cd client && npm start
```

### 3. Verify Server is Running
Open a new terminal and test:
```bash
# Test server health
curl http://localhost:3001/api/health

# Test data API
curl http://localhost:3001/api/data/status

# Test live mode toggle
curl -X POST http://localhost:3001/api/data/enable-live
```

Expected responses:
```json
// Health check
{"status":"ok","marketOpen":false,"liquidWindow":false,"timestamp":"..."}

// Data status
{"status":{"isLiveMode":true,"isDemoMode":false,"providerStatus":"Yahoo Finance"},"marketStatus":{"isOpen":false},"timestamp":"..."}

// Enable live
{"success":true,"message":"Live data mode enabled","status":{"isLiveMode":true},"timestamp":"..."}
```

## Troubleshooting

### Issue: "Server not running"
**Solutions:**
1. Make sure you ran `npm run dev:live` or `npm run server:live`
2. Check if port 3001 is available: `lsof -i :3001`
3. Look for error messages in the terminal where you started the server

### Issue: "Port already in use"
**Solutions:**
```bash
# Find what's using port 3001
lsof -i :3001

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Or use a different port
PORT=3002 npm run server:live
```

### Issue: "Cannot POST /api/data/enable-live"
**Causes:**
- Server is not running
- Server started without the API routes
- Wrong URL or port

**Solutions:**
1. Restart the server: `npm run server:live`
2. Check server logs for errors
3. Verify the server is listening on port 3001

### Issue: Yahoo Finance errors
**Solutions:**
```bash
# Test Yahoo Finance directly
npm run test-yahoo

# Debug live mode
node debug-live-mode.js
```

## Server Logs to Look For

### Successful Startup
```
Server running on port 3001
Market status: CLOSED
🚀 Initializing Yahoo Finance live data...
✅ Yahoo Finance provider started successfully
📊 Live update: NIFTY - ₹24363.30 (-232.90)
📊 Live update: BANKNIFTY - ₹55004.90 (-516.20)
```

### Error Logs
```
❌ Failed to initialize live data: [error message]
❌ Yahoo Finance provider startup failed: [error message]
Error: EADDRINUSE: address already in use :::3001
```

## Environment Variables

Create a `.env` file in the root directory:
```bash
# Enable live data by default
LIVE_DATA=true

# Server port (optional)
PORT=3001

# Update intervals (optional)
UPDATE_INTERVAL=5000
CACHE_TIMEOUT=5000
```

## Manual Server Start (Alternative)

If the npm scripts don't work, start manually:

```bash
# Set environment and start server
export LIVE_DATA=true
export PORT=3001
node server/index.js
```

## Verification Checklist

Before trying to switch to live mode in the browser:

- [ ] ✅ Server is running (`npm run server:live`)
- [ ] ✅ Port 3001 is accessible (`curl http://localhost:3001/api/health`)
- [ ] ✅ Data API is working (`curl http://localhost:3001/api/data/status`)
- [ ] ✅ Yahoo Finance is working (`npm run test-yahoo`)
- [ ] ✅ Client can reach server (check browser network tab)

## Common Mistakes

1. **Starting client without server**: The client needs the server to be running for live mode
2. **Wrong environment**: Make sure `LIVE_DATA=true` is set
3. **Port conflicts**: Another process might be using port 3001
4. **Network issues**: Firewall or proxy blocking connections
5. **Missing dependencies**: Run `npm run install-all` first

## Success Indicators

When everything is working correctly, you should see:

### In Server Terminal:
```
Server running on port 3001
✅ Yahoo Finance provider started successfully
📊 Live update: NIFTY - ₹24363.30 (-232.90)
```

### In Browser Console:
```
✅ Backend connected successfully
📡 Switching to Live mode with Yahoo Finance...
✅ Server confirmed live mode
📡 Successfully switched to Live mode with Yahoo Finance
```

### In Browser UI:
- Green "Connected" indicator
- "✅ Live data active" message below toggle
- Real market data updating every 5 seconds

## Need Help?

If you're still having issues:

1. **Check server logs** in the terminal where you started the server
2. **Check browser console** for JavaScript errors
3. **Test API endpoints** using the curl commands above
4. **Run debug script**: `node debug-live-mode.js`
5. **Test API endpoints**: `npm run test-api`

The most common issue is simply forgetting to start the server with live data enabled! 🚀
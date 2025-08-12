# Live Data Toggle Testing Guide

## 🧪 Testing the Live/Demo Mode Toggle

This guide helps you test and troubleshoot the live data toggle functionality in the NSE Trading Dashboard.

### Prerequisites

1. **Install Dependencies**
   ```bash
   npm run install-all
   ```

2. **Start the Server**
   ```bash
   # Option 1: Start with live data enabled
   npm run dev:live
   
   # Option 2: Start normally (demo mode)
   npm run dev
   ```

### Testing Steps

#### 1. Test API Endpoints
```bash
# Test all API endpoints
npm run test-api
```

Expected output:
```
✅ Health Check: SUCCESS (200)
✅ Data Status: SUCCESS (200)
✅ Enable Live Data: SUCCESS (200)
✅ Disable Live Data: SUCCESS (200)
✅ Current NIFTY Data: SUCCESS (200)
```

#### 2. Test Yahoo Finance Integration
```bash
# Test Yahoo Finance provider directly
npm run test-yahoo
```

Expected output:
```
📊 NIFTY: ₹24363.30 (-232.85, -0.95%)
📊 BANKNIFTY: ₹55004.90 (-516.25, -0.93%)
✅ Yahoo Finance provider started successfully
```

#### 3. Test Frontend Toggle

1. **Open the Dashboard**
   - Navigate to `http://localhost:5173`
   - Look for the toggle buttons in the top-right corner

2. **Check Connection Status**
   - Green "Connected" = Server is running
   - Red "Disconnected" = Server is not available
   - Blue "Connecting..." = Attempting to connect

3. **Test Demo Mode**
   - Click "Demo" button
   - Should see simulated signals appearing
   - Market data should show demo values

4. **Test Live Mode**
   - Ensure server is running and connected
   - Click "Live (Yahoo)" button
   - Should see "✅ Live data active" indicator
   - Market data should show real Yahoo Finance data

### Troubleshooting

#### Issue: "Server connection required for live mode"
**Solution:**
1. Make sure the server is running: `npm run server:live`
2. Check if port 3001 is available
3. Try the manual retry button

#### Issue: "Failed to enable live mode: Server not available"
**Solution:**
1. Check server logs for errors
2. Test API endpoints: `npm run test-api`
3. Verify Yahoo Finance is accessible: `npm run test-yahoo`

#### Issue: Toggle button is disabled
**Causes:**
- Server is not connected (red connection indicator)
- Currently switching modes (shows "Switching...")
- API call is in progress

#### Issue: No live data appearing
**Solution:**
1. Check browser console for errors
2. Verify market hours (9:15 AM - 3:30 PM IST, Mon-Fri)
3. Check server logs for Yahoo Finance errors

### Manual Testing Commands

```bash
# Test individual API calls
curl -X GET http://localhost:3001/api/health
curl -X GET http://localhost:3001/api/data/status
curl -X POST http://localhost:3001/api/data/enable-live
curl -X POST http://localhost:3001/api/data/disable-live
curl -X GET http://localhost:3001/api/data/current/NIFTY
```

### Expected Behavior

#### Demo Mode
- ✅ Simulated signals every 20 seconds
- ✅ Demo market data with realistic movements
- ✅ Blue "Demo Mode" indicators
- ✅ Works without server connection

#### Live Mode
- ✅ Real Yahoo Finance data every 5 seconds
- ✅ Actual NIFTY/BANKNIFTY prices
- ✅ Green "Live data active" indicators
- ✅ Requires server connection
- ✅ Automatic fallback to demo if Yahoo Finance fails

### Debug Information

#### Browser Console Logs
```javascript
// Demo mode switch
🎮 Switching to Demo mode...
✅ Server confirmed demo mode
🎮 Successfully switched to Demo mode

// Live mode switch
📡 Switching to Live mode with Yahoo Finance...
✅ Server confirmed live mode
📡 Successfully switched to Live mode with Yahoo Finance
```

#### Server Console Logs
```
🚀 Initializing Yahoo Finance live data...
✅ Yahoo Finance provider started successfully
📊 Live update: NIFTY - ₹24363.30 (-232.85)
📊 Live update: BANKNIFTY - ₹55004.90 (-516.25)
```

### Performance Notes

- **Demo Mode**: Instant switching, no network calls
- **Live Mode**: May take 2-3 seconds to initialize Yahoo Finance
- **Data Updates**: Every 5 seconds in live mode, every 1 second in demo
- **Fallback**: Automatic switch to demo if live data fails

### Support

If you encounter issues:

1. **Check the logs** in both browser console and server console
2. **Test API endpoints** using `npm run test-api`
3. **Verify Yahoo Finance** using `npm run test-yahoo`
4. **Check network connectivity** and firewall settings
5. **Restart the server** if needed

The system is designed to be resilient - if live data fails, it automatically falls back to demo mode to ensure the dashboard remains functional.
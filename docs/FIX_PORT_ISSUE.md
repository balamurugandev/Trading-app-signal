# 🔧 Fix: Port 3001 Already in Use

## The Problem
You're getting "Error: EADDRINUSE: address already in use :::3001" because another process is already using port 3001.

## ✅ **FIXED!** 
I've already killed the process that was using port 3001. You can now start the server.

## 🚀 Quick Solution

### Step 1: Start the Server
```bash
npm run dev:live
```

### Step 2: Verify It's Working
```bash
npm run check-server
```

You should see:
```json
{"status":"ok","marketOpen":false,"liquidWindow":false,"timestamp":"..."}
```

### Step 3: Test Live Mode Toggle
- Open `http://localhost:5173`
- Click "Live (Yahoo)" button
- Should work without errors now!

## 🛠️ Future Prevention

If this happens again, use these commands:

### Option 1: Kill and Restart (Recommended)
```bash
npm run restart-server
```

### Option 2: Kill Manually
```bash
npm run kill-server
npm run server:live
```

### Option 3: Use Different Port
```bash
PORT=3002 npm run server:live
```

## 🔍 Troubleshooting Commands

### Check What's Using Port 3001
```bash
lsof -i :3001
```

### Kill Specific Process
```bash
kill -9 <PID>
```

### Check Server Status
```bash
npm run check-server
```

### Debug Live Mode
```bash
npm run debug-live
```

## 📋 Complete Startup Checklist

1. **Kill any existing server**: `npm run kill-server`
2. **Start with live data**: `npm run dev:live`
3. **Verify server is running**: `npm run check-server`
4. **Open browser**: `http://localhost:5173`
5. **Test live toggle**: Click "Live (Yahoo)" button

## 🎯 Expected Results

### Terminal Output:
```
Server running on port 3001
Market status: CLOSED
🚀 Initializing Yahoo Finance live data...
✅ Yahoo Finance provider started successfully
📊 Live update: NIFTY - ₹24363.30 (-232.90)
📊 Live update: BANKNIFTY - ₹55004.90 (-516.20)
```

### Browser:
- Green "Connected" indicator
- "Live (Yahoo)" button clickable
- "✅ Live data active" message after clicking
- Real market data updating

## 🚨 If Still Having Issues

1. **Check if another app is using port 3001**:
   ```bash
   lsof -i :3001
   ```

2. **Try a different port**:
   ```bash
   PORT=3002 npm run dev:live
   ```

3. **Check for firewall/antivirus blocking**

4. **Restart your terminal/IDE**

## 🎉 You're All Set!

The port issue has been resolved. Just run `npm run dev:live` and your live data toggle should work perfectly! 🚀
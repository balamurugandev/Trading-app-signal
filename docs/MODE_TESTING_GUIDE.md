# Live Mode vs Demo Mode Testing Guide

## Overview

This guide ensures that both Live Mode and Demo Mode work correctly in the NSE Scalping Signals application. **CRITICAL**: Live mode should NEVER show test data - it must always use real Yahoo Finance data.

## Quick Test Commands

```bash
# Run comprehensive mode tests
npm run test:modes

# Or run with shell script
./run-mode-tests.sh

# Or run directly
node test-live-demo-modes.js
```

## What Gets Tested

### Live Mode Tests ✅
1. **Live Mode Status Check** - Verifies `isLiveMode: true`, `isDemoMode: false`
2. **Yahoo Finance Provider Active** - Confirms provider is "Yahoo Finance"
3. **Realistic Live Pricing** - NIFTY (20k-30k), BANKNIFTY (45k-65k)
4. **Live Data Updates** - Timestamps and data refresh properly
5. **No Test Data Leakage** - No "test", "demo", "mock", "fake" in responses
6. **Signal Generation with Live Data** - Technical indicators work with real data

### Demo Mode Tests ✅
1. **Demo Mode Status Check** - Verifies `isLiveMode: false`, `isDemoMode: true`
2. **Demo Data Provider Active** - Confirms provider is "Demo"
3. **Demo Pricing Reasonable** - Prices in realistic ranges but marked as demo
4. **Demo Data Consistency** - Consistent data structure across requests
5. **Signal Generation with Demo Data** - Technical indicators work with demo data

## Critical Requirements

### Live Mode MUST:
- ✅ Use Yahoo Finance provider (`providerStatus: "Yahoo Finance"`)
- ✅ Show `isLive: true` in API responses
- ✅ Have realistic current market prices
- ✅ Update data in real-time
- ❌ **NEVER** contain test/demo/mock data

### Demo Mode MUST:
- ✅ Use Demo provider (`providerStatus: "Demo"`)
- ✅ Show `isLive: false` in API responses
- ✅ Have reasonable demo prices (not random/broken)
- ✅ Work consistently without external dependencies

## How to Start Each Mode

### Live Mode
```bash
# Method 1: Environment variable
LIVE_DATA=true node server/index.js

# Method 2: NPM script
npm run server:live

# Method 3: Dedicated starter
node start-live-mode.js
```

### Demo Mode
```bash
# Method 1: Default (no env var)
node server/index.js

# Method 2: NPM script
npm run server
```

## Test Results Interpretation

### ✅ All Tests Pass
- Both modes are working correctly
- Safe to deploy/use

### ❌ Live Mode Tests Fail
- **CRITICAL**: Do not use live mode until fixed
- Check Yahoo Finance integration
- Verify environment variables
- Check network connectivity

### ❌ Demo Mode Tests Fail
- Demo mode broken, affects development
- Check demo data generation
- Verify base prices are reasonable

## When to Run These Tests

### 🔴 MANDATORY - Run before:
- Any deployment to production
- Major changes to data providers
- Changes to server startup logic
- Changes to pricing/market data logic

### 🟡 RECOMMENDED - Run after:
- Adding new API endpoints
- Modifying signal generation
- Updating dependencies
- Environment configuration changes

## Troubleshooting

### Live Mode Shows Wrong Prices
```bash
# Check if Yahoo Finance is working
curl "http://localhost:3001/api/data/status"

# Should show:
# "providerStatus": "Yahoo Finance"
# "isLiveMode": true
```

### Demo Mode Shows Broken Prices
```bash
# Check demo data initialization
# Look for base prices in server/services/dataProvider.js
# NIFTY should be ~24400, BANKNIFTY should be ~55000
```

### Tests Timeout
```bash
# Kill any hanging processes
pkill -f "node server/index.js"

# Wait and retry
sleep 5
npm run test:modes
```

## Integration with CI/CD

Add to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Test Live and Demo Modes
  run: |
    npm install
    npm run test:modes
```

## Files Involved

- `test-live-demo-modes.js` - Main test suite
- `run-mode-tests.sh` - Shell script runner
- `start-live-mode.js` - Live mode starter
- `server/services/dataProvider.js` - Data provider logic
- `server/services/yahooFinanceProvider.js` - Yahoo Finance integration

## Success Criteria

✅ **Live Mode**: Real Yahoo Finance data, no test data, realistic prices
✅ **Demo Mode**: Consistent demo data, clearly marked as demo
✅ **No Regression**: Both modes work after any changes
✅ **Clear Separation**: No mixing of live and demo data

---

**Remember**: Live mode with test data is a critical bug that must be fixed immediately!
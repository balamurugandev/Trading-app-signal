# Testing Checklist for NSE Scalping Signals

## ✅ MANDATORY TESTS - Run Before Any Major Change

### Quick Test Command
```bash
npm run test:modes
```

### What This Tests
- ✅ Live Mode uses Yahoo Finance (no test data)
- ✅ Demo Mode uses demo data (clearly marked)
- ✅ Pricing is realistic in both modes
- ✅ No data leakage between modes
- ✅ Signal generation works in both modes

## 🔴 CRITICAL REQUIREMENTS

### Live Mode MUST:
1. Show `isLiveMode: true`
2. Use `providerStatus: "Yahoo Finance"`
3. Have realistic prices (NIFTY: 20k-30k, BANKNIFTY: 45k-65k)
4. Mark data as `isLive: true`
5. **NEVER** contain "test", "demo", "mock", "fake" in responses
6. Have positive volume values

### Demo Mode MUST:
1. Show `isLiveMode: false`
2. Use `providerStatus: "Demo"`
3. Have reasonable demo prices
4. Mark data as `isLive: false`
5. Work without external dependencies

## 🚨 When to Run Tests

### BEFORE:
- Deploying to production
- Changing data providers
- Modifying server startup
- Updating pricing logic

### AFTER:
- Adding new features
- Dependency updates
- Environment changes

## 🛠️ How to Fix Common Issues

### Live Mode Shows Wrong Prices
```bash
# Check environment
echo $LIVE_DATA  # Should be 'true'

# Check status
curl "http://localhost:3001/api/data/status"
```

### Tests Fail
```bash
# Kill processes and retry
pkill -f "node server/index.js"
sleep 3
npm run test:modes
```

## 📊 Success Criteria
- ✅ 100% test pass rate
- ✅ Live mode = real Yahoo Finance data
- ✅ Demo mode = consistent demo data
- ✅ No mixing of live/demo data

---

**Remember**: Live mode with test data is a critical bug!
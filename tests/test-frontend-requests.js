#!/usr/bin/env node

/**
 * Test to monitor frontend requests to the server
 */

const express = require('express');
const app = express();

let requestCount = 0;
let lastRequestTime = Date.now();
const requestTimes = [];

// Middleware to log all requests
app.use((req, res, next) => {
    const currentTime = Date.now();
    const timeSinceLastRequest = currentTime - lastRequestTime;
    
    requestCount++;
    requestTimes.push(currentTime);
    
    console.log(`Request #${requestCount}: ${req.method} ${req.path} (${timeSinceLastRequest}ms since last)`);
    
    lastRequestTime = currentTime;
    next();
});

// Mock the API endpoints
app.get('/api/data/current/:symbol', (req, res) => {
    const { symbol } = req.params;
    const mockData = {
        data: {
            symbol: symbol,
            ltp: symbol === 'NIFTY' ? 24000 + Math.random() * 100 : 
                 symbol === 'BANKNIFTY' ? 55000 + Math.random() * 200 :
                 symbol === 'VIX' ? 15 + Math.random() * 5 : 100,
            change: (Math.random() - 0.5) * 10,
            changePercent: (Math.random() - 0.5) * 2,
            timestamp: new Date().toISOString(),
            isMarketOpen: true
        },
        isLive: true,
        timestamp: new Date().toISOString()
    };
    res.json(mockData);
});

app.get('/api/indicators/:symbol/:timeframe', (req, res) => {
    const mockIndicators = {
        indicators: {
            vwap: 24000 + Math.random() * 100,
            ema9: 24000 + Math.random() * 100,
            ema21: 24000 + Math.random() * 100,
            rsi: 40 + Math.random() * 20,
            macd: {
                line: Math.random() * 10,
                signal: Math.random() * 10,
                histogram: Math.random() * 5
            }
        }
    };
    res.json(mockIndicators);
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`🧪 Test server running on port ${PORT}`);
    console.log('Monitoring frontend requests...\n');
    
    // Analyze request frequency every 10 seconds
    setInterval(() => {
        const now = Date.now();
        const recentRequests = requestTimes.filter(time => now - time < 10000);
        const requestsPerSecond = recentRequests.length / 10;
        
        console.log(`\n📊 Request Analysis (last 10s):`);
        console.log(`   Total requests: ${recentRequests.length}`);
        console.log(`   Requests/second: ${requestsPerSecond.toFixed(1)}`);
        console.log(`   Expected for 1s updates: ~6-9 requests/second`);
        
        if (requestsPerSecond >= 6) {
            console.log('   ✅ Frontend is making frequent requests');
        } else if (requestsPerSecond >= 1) {
            console.log('   ⚠️  Frontend is making some requests but not every second');
        } else {
            console.log('   ❌ Frontend is not making enough requests');
        }
        console.log('');
    }, 10000);
});

console.log('To test: Change the frontend API base URL to http://localhost:3002');
console.log('Or use proxy: vite.config.js proxy target to http://localhost:3002\n');
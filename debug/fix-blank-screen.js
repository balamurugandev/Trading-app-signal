#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing blank screen issue...');

// Create a simple test component to verify the issue
const testComponent = `
import React, { useState } from 'react';

const TestLiveData = () => {
    const [isDemoMode, setIsDemoMode] = useState(true);
    const [marketData, setMarketData] = useState({
        NIFTY: { price: 24363.30, change: -232.85, changePercent: -0.95 },
        BANKNIFTY: { price: 55004.90, change: -516.25, changePercent: -0.93 }
    });

    const switchToLive = () => {
        console.log('Switching to live mode...');
        setIsDemoMode(false);
        
        // Simulate API call
        setTimeout(() => {
            setMarketData({
                NIFTY: { price: 24363.30, change: -232.85, changePercent: -0.95, dataSource: 'live' },
                BANKNIFTY: { price: 55004.90, change: -516.25, changePercent: -0.93, dataSource: 'live' }
            });
        }, 1000);
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h1>Live Data Test</h1>
            <button onClick={switchToLive} disabled={!isDemoMode}>
                Switch to Live
            </button>
            <div style={{ marginTop: '20px' }}>
                <h2>Market Data:</h2>
                <p>Mode: {isDemoMode ? 'Demo' : 'Live'}</p>
                <p>NIFTY: ₹{marketData.NIFTY?.price?.toFixed(2) || 'Loading...'}</p>
                <p>BANKNIFTY: ₹{marketData.BANKNIFTY?.price?.toFixed(2) || 'Loading...'}</p>
            </div>
        </div>
    );
};

export default TestLiveData;
`;

// Write test component
fs.writeFileSync(path.join(__dirname, 'client/src/components/TestLiveData.jsx'), testComponent);

console.log('✅ Created test component: client/src/components/TestLiveData.jsx');
console.log('');
console.log('🧪 To test the blank screen issue:');
console.log('1. Start debug server: npm run debug-server');
console.log('2. In another terminal, start client: cd client && npm start');
console.log('3. Import and use TestLiveData component to isolate the issue');
console.log('');
console.log('🔍 Check browser console for errors when switching to live mode');
console.log('📊 The test component will help identify if the issue is in data handling or rendering');
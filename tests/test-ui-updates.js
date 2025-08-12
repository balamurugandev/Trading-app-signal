#!/usr/bin/env node

/**
 * Test to verify UI data is actually changing
 */

const axios = require('axios');

console.log('🧪 Testing UI Data Updates...');
console.log('==============================\n');

let testCount = 0;
const dataHistory = [];

async function testUIData() {
    try {
        testCount++;
        
        // Fetch the same data the UI fetches
        const [niftyRes, vixRes, indicatorsRes] = await Promise.all([
            axios.get('http://localhost:3001/api/data/current/NIFTY'),
            axios.get('http://localhost:3001/api/data/current/VIX'),
            axios.get('http://localhost:3001/api/indicators/NIFTY/5m')
        ]);
        
        const currentData = {
            niftyPrice: niftyRes.data.data.ltp,
            vixValue: vixRes.data.data.ltp,
            vwap: indicatorsRes.data.indicators.vwap,
            rsi: indicatorsRes.data.indicators.rsi,
            timestamp: new Date().toLocaleTimeString()
        };
        
        dataHistory.push(currentData);
        
        console.log(`Test #${testCount} at ${currentData.timestamp}:`);
        console.log(`  NIFTY: ${currentData.niftyPrice.toFixed(2)}`);
        console.log(`  VIX:   ${currentData.vixValue.toFixed(2)}`);
        console.log(`  VWAP:  ${currentData.vwap ? currentData.vwap.toFixed(2) : 'N/A'}`);
        console.log(`  RSI:   ${currentData.rsi ? currentData.rsi.toFixed(1) : 'N/A'}`);
        
        // Check if data is changing compared to previous
        if (dataHistory.length > 1) {
            const prev = dataHistory[dataHistory.length - 2];
            const changes = [];
            
            if (Math.abs(currentData.niftyPrice - prev.niftyPrice) > 0.01) changes.push('NIFTY');
            if (Math.abs(currentData.vixValue - prev.vixValue) > 0.01) changes.push('VIX');
            if (currentData.vwap && prev.vwap && Math.abs(currentData.vwap - prev.vwap) > 0.01) changes.push('VWAP');
            if (currentData.rsi && prev.rsi && Math.abs(currentData.rsi - prev.rsi) > 0.1) changes.push('RSI');
            
            if (changes.length > 0) {
                console.log(`  ✅ CHANGED: ${changes.join(', ')}`);
            } else {
                console.log(`  ❌ NO CHANGES DETECTED`);
            }
        }
        
        console.log('');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Test every 2 seconds for 20 seconds
const testInterval = setInterval(testUIData, 2000);

setTimeout(() => {
    clearInterval(testInterval);
    console.log('🏁 UI Update Test completed!');
    
    // Analyze results
    if (dataHistory.length >= 2) {
        let totalChanges = 0;
        for (let i = 1; i < dataHistory.length; i++) {
            const curr = dataHistory[i];
            const prev = dataHistory[i - 1];
            
            if (Math.abs(curr.niftyPrice - prev.niftyPrice) > 0.01 ||
                Math.abs(curr.vixValue - prev.vixValue) > 0.01 ||
                (curr.vwap && prev.vwap && Math.abs(curr.vwap - prev.vwap) > 0.01) ||
                (curr.rsi && prev.rsi && Math.abs(curr.rsi - prev.rsi) > 0.1)) {
                totalChanges++;
            }
        }
        
        const changeRate = (totalChanges / (dataHistory.length - 1)) * 100;
        console.log(`📊 Analysis: ${totalChanges}/${dataHistory.length - 1} intervals had data changes (${changeRate.toFixed(1)}%)`);
        
        if (changeRate >= 70) {
            console.log('✅ UI DATA IS UPDATING PROPERLY');
        } else {
            console.log('❌ UI DATA IS NOT UPDATING ENOUGH');
        }
    }
    
    process.exit(0);
}, 20000);

// Initial test
testUIData();
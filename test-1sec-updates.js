#!/usr/bin/env node

/**
 * Test case to verify 1-second data updates
 */

const axios = require('axios');

console.log('🧪 Testing 1-second data updates...');
console.log('=====================================\n');

let updateCount = 0;
let lastNiftyPrice = null;
let lastVixValue = null;
let lastUpdateTime = Date.now();

async function testDataUpdates() {
    try {
        const startTime = Date.now();
        
        // Test NIFTY data updates
        const niftyResponse = await axios.get('http://localhost:3001/api/data/current/NIFTY');
        const currentNiftyPrice = niftyResponse.data.data.ltp;
        
        // Test VIX data updates
        const vixResponse = await axios.get('http://localhost:3001/api/data/current/VIX');
        const currentVixValue = vixResponse.data.data.ltp;
        
        const currentTime = Date.now();
        const timeSinceLastUpdate = currentTime - lastUpdateTime;
        
        updateCount++;
        
        console.log(`Update #${updateCount} (${timeSinceLastUpdate}ms since last):`);
        console.log(`  NIFTY: ${currentNiftyPrice.toFixed(2)} ${lastNiftyPrice ? (currentNiftyPrice !== lastNiftyPrice ? '✓ CHANGED' : '✗ SAME') : ''}`);
        console.log(`  VIX:   ${currentVixValue.toFixed(2)} ${lastVixValue ? (currentVixValue !== lastVixValue ? '✓ CHANGED' : '✗ SAME') : ''}`);
        
        // Check if data is actually updating
        if (updateCount > 1) {
            const niftyChanged = currentNiftyPrice !== lastNiftyPrice;
            const vixChanged = currentVixValue !== lastVixValue;
            
            if (!niftyChanged && !vixChanged) {
                console.log('  ❌ NO DATA CHANGES DETECTED!');
            } else {
                console.log('  ✅ Data is updating');
            }
        }
        
        lastNiftyPrice = currentNiftyPrice;
        lastVixValue = currentVixValue;
        lastUpdateTime = currentTime;
        
        console.log('');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Test every 1 second for 10 seconds
console.log('Starting 10-second test...\n');

const testInterval = setInterval(testDataUpdates, 1000);

setTimeout(() => {
    clearInterval(testInterval);
    console.log('🏁 Test completed!');
    console.log(`Total updates: ${updateCount}`);
    
    if (updateCount >= 8) {
        console.log('✅ Update frequency test PASSED');
    } else {
        console.log('❌ Update frequency test FAILED');
    }
    
    process.exit(0);
}, 10000);

// Initial test
testDataUpdates();
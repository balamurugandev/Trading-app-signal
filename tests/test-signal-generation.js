#!/usr/bin/env node

/**
 * Test signal generation system
 */

const axios = require('axios');

console.log('🚨 Testing Signal Generation System');
console.log('==================================\n');

let signalCount = 0;
let testCount = 0;

async function testSignalGeneration() {
    try {
        testCount++;
        console.log(`Test #${testCount} - ${new Date().toLocaleTimeString()}`);
        
        // Test manual signal generation for each symbol and timeframe
        const symbols = ['NIFTY', 'BANKNIFTY'];
        const timeframes = ['1m', '5m', '15m'];
        
        for (const symbol of symbols) {
            for (const timeframe of timeframes) {
                try {
                    const response = await axios.post('http://localhost:3001/api/advanced/generate-signal', {
                        symbol,
                        timeframe
                    });
                    
                    if (response.data.signal) {
                        signalCount++;
                        console.log(`✅ SIGNAL GENERATED: ${symbol} ${timeframe}`);
                        console.log(`   Type: ${response.data.signal.signal}`);
                        console.log(`   Price: ${response.data.signal.underlying_entry?.toFixed(2)}`);
                        console.log(`   Strike: ${response.data.signal.option_strike}`);
                        console.log(`   Premium: ₹${response.data.signal.option_ltp?.toFixed(2)}`);
                        console.log(`   Confidence: ${response.data.signal.confidence}`);
                        console.log('');
                    } else {
                        console.log(`❌ NO SIGNAL: ${symbol} ${timeframe} - Conditions not met`);
                    }
                } catch (error) {
                    console.log(`❌ ERROR: ${symbol} ${timeframe} - ${error.response?.data?.error || error.message}`);
                }
            }
        }
        
        console.log(`📊 Total signals generated so far: ${signalCount}`);
        console.log('─'.repeat(50));
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Test every 10 seconds for 1 minute
console.log('Testing signal generation every 10 seconds...\n');

const testInterval = setInterval(testSignalGeneration, 10000);

setTimeout(() => {
    clearInterval(testInterval);
    console.log('\n🏁 Signal Generation Test completed!');
    console.log(`📊 Final Results: ${signalCount} signals generated in ${testCount} test cycles`);
    
    if (signalCount === 0) {
        console.log('❌ CRITICAL: NO SIGNALS GENERATED - Signal system is broken!');
    } else if (signalCount < 5) {
        console.log('⚠️  WARNING: Very few signals generated - Signal conditions may be too strict');
    } else {
        console.log('✅ Signal generation is working');
    }
    
    process.exit(0);
}, 60000);

// Initial test
testSignalGeneration();
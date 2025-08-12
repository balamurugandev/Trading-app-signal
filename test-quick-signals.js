#!/usr/bin/env node

/**
 * Quick signal generation test
 */

const axios = require('axios');

console.log('🚨 Quick Signal Test');
console.log('===================\n');

async function testQuickSignals() {
    try {
        // Test NIFTY 5m signal generation
        const response = await axios.post('http://localhost:3001/api/advanced/generate-signal', {
            symbol: 'NIFTY',
            timeframe: '5m'
        });
        
        if (response.data.signal) {
            console.log('✅ SIGNAL GENERATED!');
            console.log(`   Symbol: ${response.data.signal.instrument}`);
            console.log(`   Type: ${response.data.signal.signal}`);
            console.log(`   Strike: ${response.data.signal.option_strike}`);
            console.log(`   Premium: ₹${response.data.signal.option_ltp?.toFixed(2)}`);
            console.log(`   Confidence: ${response.data.signal.confidence}`);
            return true;
        } else {
            console.log('❌ NO SIGNAL GENERATED');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data?.error || error.message);
        return false;
    }
}

testQuickSignals().then(success => {
    if (success) {
        console.log('\n🎉 SIGNAL GENERATION IS NOW WORKING!');
    } else {
        console.log('\n❌ Signal generation still broken');
    }
    process.exit(0);
});
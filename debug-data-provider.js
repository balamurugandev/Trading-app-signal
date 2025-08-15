#!/usr/bin/env node

/**
 * Debug Data Provider Script
 * 
 * This script directly tests the data provider to see what's happening
 */

const DataProvider = require('./server/services/dataProvider');

async function debugDataProvider() {
    console.log('🔍 Debugging Data Provider...\n');
    
    // Create data provider instance
    const provider = new DataProvider();
    
    console.log('📊 Data Provider Status:');
    console.log('- Live Mode:', provider.isLiveMode);
    console.log('- Demo Mode:', provider.demoMode);
    console.log('- Yahoo Provider:', provider.yahooProvider ? 'EXISTS' : 'NULL');
    
    // Wait a bit for initialization
    console.log('\n⏳ Waiting 5 seconds for initialization...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test Yahoo provider directly
    if (provider.yahooProvider) {
        console.log('\n🧪 Testing Yahoo Provider directly...');
        console.log('- Is Running:', provider.yahooProvider.isRunning);
        console.log('- Cache Size:', provider.yahooProvider.cache.size);
        
        // Check cached data
        const symbols = ['NIFTY', 'BANKNIFTY', 'BITCOIN'];
        for (const symbol of symbols) {
            const data = provider.yahooProvider.getLatestData(symbol);
            if (data) {
                console.log(`✅ ${symbol}: ₹${data.ltp} (${data.dataSource || 'unknown'})`);
            } else {
                console.log(`❌ ${symbol}: No data`);
            }
        }
    }
    
    // Test data provider methods
    console.log('\n🧪 Testing Data Provider methods...');
    const symbols = ['NIFTY', 'BANKNIFTY', 'BITCOIN'];
    
    for (const symbol of symbols) {
        const data = provider.getCurrentMarketData(symbol);
        if (data) {
            console.log(`✅ ${symbol}: ₹${data.ltp} (${data.dataSource})`);
        } else {
            console.log(`❌ ${symbol}: No data returned`);
        }
    }
    
    // Test getAllCurrentData
    console.log('\n🧪 Testing getAllCurrentData...');
    const allData = provider.getAllCurrentData();
    console.log('All data keys:', Object.keys(allData));
    
    // Force enable live mode if not already
    if (!provider.isLiveMode || provider.demoMode) {
        console.log('\n🔄 Force enabling live mode...');
        try {
            await provider.enableLiveMode();
            console.log('✅ Live mode enabled');
            
            // Wait and test again
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log('\n🧪 Testing after force enable...');
            for (const symbol of symbols) {
                const data = provider.getCurrentMarketData(symbol);
                if (data) {
                    console.log(`✅ ${symbol}: ₹${data.ltp} (${data.dataSource})`);
                } else {
                    console.log(`❌ ${symbol}: No data returned`);
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to enable live mode:', error.message);
        }
    }
    
    console.log('\n📋 Debug Summary:');
    console.log('- Provider Live Mode:', provider.isLiveMode);
    console.log('- Provider Demo Mode:', provider.demoMode);
    console.log('- Yahoo Running:', provider.yahooProvider?.isRunning);
    console.log('- Yahoo Cache Size:', provider.yahooProvider?.cache.size);
    
    process.exit(0);
}

debugDataProvider().catch(error => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
});
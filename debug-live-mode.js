#!/usr/bin/env node

const DataProvider = require('./server/services/dataProvider');

async function debugLiveMode() {
    console.log('🔍 Debugging Live Mode Issue...\n');
    
    const dataProvider = new DataProvider();
    
    try {
        console.log('1️⃣ Initial Status:');
        console.log(JSON.stringify(dataProvider.getLiveDataStatus(), null, 2));
        console.log('');
        
        console.log('2️⃣ Attempting to enable live mode...');
        await dataProvider.enableLiveMode();
        console.log('');
        
        console.log('3️⃣ Status after enabling:');
        console.log(JSON.stringify(dataProvider.getLiveDataStatus(), null, 2));
        console.log('');
        
        console.log('4️⃣ Testing Yahoo Finance provider health...');
        if (dataProvider.yahooProvider) {
            const health = dataProvider.yahooProvider.isHealthy();
            console.log('Health check:', health);
            
            if (health.healthy) {
                console.log('5️⃣ Getting sample data...');
                const niftyData = dataProvider.yahooProvider.getLatestData('NIFTY');
                const bankNiftyData = dataProvider.yahooProvider.getLatestData('BANKNIFTY');
                
                console.log('NIFTY data:', niftyData ? {
                    ltp: niftyData.ltp,
                    change: niftyData.change,
                    timestamp: niftyData.timestamp
                } : 'No data');
                
                console.log('BANKNIFTY data:', bankNiftyData ? {
                    ltp: bankNiftyData.ltp,
                    change: bankNiftyData.change,
                    timestamp: bankNiftyData.timestamp
                } : 'No data');
            }
        } else {
            console.log('❌ Yahoo Finance provider not initialized');
        }
        
        console.log('\n✅ Debug completed successfully');
        
    } catch (error) {
        console.error('\n❌ Debug failed:');
        console.error('Error message:', error.message);
        console.error('Stack trace:', error.stack);
        
        console.log('\n📊 Final status:');
        console.log(JSON.stringify(dataProvider.getLiveDataStatus(), null, 2));
    } finally {
        console.log('\n🧹 Cleaning up...');
        await dataProvider.cleanup();
        process.exit(0);
    }
}

// Add some environment info
console.log('🌍 Environment Info:');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('LIVE_DATA env:', process.env.LIVE_DATA);
console.log('Current time:', new Date().toISOString());
console.log('');

debugLiveMode().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
});
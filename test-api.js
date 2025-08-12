#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
    console.log('🧪 Testing NSE Trading API endpoints...\n');
    
    const tests = [
        {
            name: 'Health Check',
            method: 'GET',
            url: `${BASE_URL}/api/health`
        },
        {
            name: 'Data Status',
            method: 'GET',
            url: `${BASE_URL}/api/data/status`
        },
        {
            name: 'Enable Live Data',
            method: 'POST',
            url: `${BASE_URL}/api/data/enable-live`
        },
        {
            name: 'Disable Live Data',
            method: 'POST',
            url: `${BASE_URL}/api/data/disable-live`
        },
        {
            name: 'Current NIFTY Data',
            method: 'GET',
            url: `${BASE_URL}/api/data/current/NIFTY`
        }
    ];
    
    for (const test of tests) {
        try {
            console.log(`📡 Testing: ${test.name}`);
            
            const response = await axios({
                method: test.method,
                url: test.url,
                timeout: 5000,
                validateStatus: () => true // Don't throw on HTTP errors
            });
            
            if (response.status >= 200 && response.status < 300) {
                console.log(`✅ ${test.name}: SUCCESS (${response.status})`);
                if (response.data) {
                    console.log(`   Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
                }
            } else {
                console.log(`❌ ${test.name}: FAILED (${response.status})`);
                console.log(`   Error: ${response.data || response.statusText}`);
            }
            
        } catch (error) {
            console.log(`❌ ${test.name}: ERROR`);
            console.log(`   ${error.message}`);
        }
        
        console.log(''); // Empty line for readability
    }
    
    console.log('🏁 API testing completed!');
}

// Run the test
testAPI().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});
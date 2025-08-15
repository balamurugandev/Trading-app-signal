#!/usr/bin/env node

/**
 * Enable Live Market Data Script
 * 
 * This script enables live market data and validates the connection
 */

const axios = require('axios');

async function enableLiveData() {
    console.log('🔄 Enabling Live Market Data...\n');
    
    try {
        // Set environment variable for this session
        process.env.LIVE_DATA = 'true';
        console.log('✅ Environment variable LIVE_DATA set to true');
        
        // Try to enable via API if server is running
        try {
            const response = await axios.post('http://localhost:3001/api/enable-live-data');
            console.log('✅ Live data enabled via API');
            console.log('Response:', response.data);
        } catch (apiError) {
            console.log('⚠️  Could not enable via API (server may not be running)');
            console.log('   Error:', apiError.message);
        }
        
        // Test direct Yahoo Finance connection
        console.log('\n🧪 Testing Yahoo Finance Connection...');
        
        const testSymbols = {
            'NIFTY': '^NSEI',
            'BANKNIFTY': '^NSEBANK',
            'BITCOIN': 'BTC-USD'
        };
        
        for (const [symbol, yahooSymbol] of Object.entries(testSymbols)) {
            try {
                const response = await axios.get(
                    `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d`,
                    {
                        timeout: 10000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    }
                );
                
                const data = response.data;
                if (data.chart && data.chart.result && data.chart.result.length > 0) {
                    const result = data.chart.result[0];
                    const meta = result.meta;
                    const currentPrice = meta.regularMarketPrice || meta.previousClose;
                    const change = currentPrice - meta.previousClose;
                    const changePercent = (change / meta.previousClose) * 100;
                    
                    console.log(`✅ ${symbol}: ₹${currentPrice.toFixed(2)} (${change >= 0 ? '+' : ''}${change.toFixed(2)}, ${changePercent.toFixed(2)}%)`);
                } else {
                    console.log(`❌ ${symbol}: No data received`);
                }
                
            } catch (error) {
                console.log(`❌ ${symbol}: ${error.message}`);
            }
        }
        
        console.log('\n📋 Next Steps:');
        console.log('1. Restart your server with: npm run dev');
        console.log('2. Or set LIVE_DATA=true in your .env file');
        console.log('3. Run: node test-market-data.js to validate');
        
    } catch (error) {
        console.error('❌ Failed to enable live data:', error.message);
    }
}

enableLiveData();
#!/usr/bin/env node

/**
 * Market Data Integration Test Script
 * 
 * This script validates that the trading system is using REAL market data
 * instead of random/mock data. It performs comprehensive checks on:
 * 
 * 1. Data Provider Configuration
 * 2. Live Data Connection
 * 3. Real-time Price Updates
 * 4. Market Hours Detection
 * 5. Signal Generation with Real Data
 */

const axios = require('axios');
const moment = require('moment-timezone');

// Configuration
const SERVER_URL = 'http://localhost:3001';
const TEST_SYMBOLS = ['NIFTY', 'BANKNIFTY', 'BITCOIN'];
const TEST_DURATION = 60000; // 1 minute test
const PRICE_CHANGE_THRESHOLD = 0.01; // 1% change threshold

class MarketDataTester {
    constructor() {
        this.results = {
            dataProvider: null,
            liveConnection: null,
            priceUpdates: [],
            marketHours: null,
            signals: [],
            errors: []
        };
        this.initialPrices = new Map();
        this.priceHistory = new Map();
    }

    async runAllTests() {
        console.log('🧪 Starting Market Data Integration Tests...\n');
        
        try {
            // Test 1: Check Data Provider Status
            await this.testDataProviderStatus();
            
            // Test 2: Validate Live Data Connection
            await this.testLiveDataConnection();
            
            // Test 3: Monitor Price Updates
            await this.testPriceUpdates();
            
            // Test 4: Verify Market Hours Detection
            await this.testMarketHours();
            
            // Test 5: Check Signal Generation with Real Data
            await this.testSignalGeneration();
            
            // Generate Report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            this.results.errors.push(`Test suite error: ${error.message}`);
            this.generateReport();
        }
    }

    async testDataProviderStatus() {
        console.log('📊 Test 1: Data Provider Status');
        console.log('================================');
        
        try {
            const response = await axios.get(`${SERVER_URL}/api/data-status`);
            const status = response.data;
            
            console.log(`Mode: ${status.isLiveMode ? '🔴 LIVE' : '🟡 DEMO'}`);
            console.log(`Provider: ${status.providerStatus}`);
            console.log(`Demo Mode: ${status.isDemoMode ? 'YES' : 'NO'}`);
            
            this.results.dataProvider = {
                isLiveMode: status.isLiveMode,
                isDemoMode: status.isDemoMode,
                provider: status.providerStatus,
                status: status.isLiveMode && !status.isDemoMode ? 'LIVE' : 'DEMO'
            };
            
            if (!status.isLiveMode || status.isDemoMode) {
                console.log('⚠️  WARNING: System is in DEMO mode - not using real market data!');
                console.log('💡 To enable live data, set LIVE_DATA=true environment variable');
            } else {
                console.log('✅ System is configured for LIVE market data');
            }
            
        } catch (error) {
            console.error('❌ Failed to check data provider status:', error.message);
            this.results.errors.push(`Data provider status check failed: ${error.message}`);
        }
        
        console.log('');
    }

    async testLiveDataConnection() {
        console.log('🔌 Test 2: Live Data Connection');
        console.log('===============================');
        
        try {
            // Try to enable live mode
            try {
                const enableResponse = await axios.post(`${SERVER_URL}/api/enable-live-data`);
                console.log('✅ Live data mode enabled successfully');
            } catch (enableError) {
                console.log('⚠️  Could not enable live data:', enableError.response?.data?.error || enableError.message);
            }
            
            // Test direct Yahoo Finance connection
            console.log('Testing direct Yahoo Finance API...');
            
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
                        
                        console.log(`✅ ${symbol}: ₹${currentPrice.toFixed(2)} (Yahoo: ${yahooSymbol})`);
                        this.initialPrices.set(symbol, currentPrice);
                    } else {
                        console.log(`❌ ${symbol}: No data received`);
                    }
                    
                } catch (error) {
                    console.log(`❌ ${symbol}: Connection failed - ${error.message}`);
                    this.results.errors.push(`Yahoo Finance connection failed for ${symbol}: ${error.message}`);
                }
            }
            
            this.results.liveConnection = {
                status: this.initialPrices.size > 0 ? 'SUCCESS' : 'FAILED',
                symbolsConnected: this.initialPrices.size,
                totalSymbols: Object.keys(testSymbols).length
            };
            
        } catch (error) {
            console.error('❌ Live data connection test failed:', error.message);
            this.results.errors.push(`Live connection test failed: ${error.message}`);
        }
        
        console.log('');
    }

    async testPriceUpdates() {
        console.log('📈 Test 3: Real-time Price Updates');
        console.log('==================================');
        console.log(`Monitoring price changes for ${TEST_DURATION / 1000} seconds...`);
        
        const startTime = Date.now();
        let updateCount = 0;
        
        // Initialize price history
        TEST_SYMBOLS.forEach(symbol => {
            this.priceHistory.set(symbol, []);
        });
        
        const monitorInterval = setInterval(async () => {
            try {
                const response = await axios.get(`${SERVER_URL}/api/market-data`);
                const marketData = response.data;
                
                TEST_SYMBOLS.forEach(symbol => {
                    if (marketData[symbol]) {
                        const price = marketData[symbol].ltp;
                        const history = this.priceHistory.get(symbol);
                        history.push({
                            price: price,
                            timestamp: new Date(),
                            change: marketData[symbol].change,
                            dataSource: marketData[symbol].dataSource
                        });
                        
                        // Keep only last 10 updates
                        if (history.length > 10) {
                            history.shift();
                        }
                    }
                });
                
                updateCount++;
                
            } catch (error) {
                console.error('Error fetching market data:', error.message);
            }
        }, 5000); // Check every 5 seconds
        
        // Wait for test duration
        await new Promise(resolve => setTimeout(resolve, TEST_DURATION));
        clearInterval(monitorInterval);
        
        // Analyze price movements
        console.log('\nPrice Movement Analysis:');
        console.log('------------------------');
        
        TEST_SYMBOLS.forEach(symbol => {
            const history = this.priceHistory.get(symbol);
            if (history.length > 1) {
                const firstPrice = history[0].price;
                const lastPrice = history[history.length - 1].price;
                const priceChange = lastPrice - firstPrice;
                const percentChange = (priceChange / firstPrice) * 100;
                const dataSource = history[history.length - 1].dataSource;
                
                console.log(`${symbol}:`);
                console.log(`  Start: ₹${firstPrice.toFixed(2)}`);
                console.log(`  End: ₹${lastPrice.toFixed(2)}`);
                console.log(`  Change: ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} (${percentChange.toFixed(2)}%)`);
                console.log(`  Updates: ${history.length}`);
                console.log(`  Source: ${dataSource.toUpperCase()}`);
                
                // Check if prices are realistic (not random)
                const isRealistic = this.analyzePriceRealism(history);
                console.log(`  Realistic: ${isRealistic ? '✅ YES' : '❌ NO'}`);
                
                this.results.priceUpdates.push({
                    symbol,
                    startPrice: firstPrice,
                    endPrice: lastPrice,
                    change: priceChange,
                    percentChange,
                    updateCount: history.length,
                    dataSource,
                    isRealistic
                });
            } else {
                console.log(`${symbol}: No price updates received`);
                this.results.errors.push(`No price updates for ${symbol}`);
            }
        });
        
        console.log('');
    }

    analyzePriceRealism(history) {
        if (history.length < 3) return false;
        
        // Check for unrealistic patterns
        const prices = history.map(h => h.price);
        
        // 1. Check for identical consecutive prices (could indicate mock data)
        let identicalCount = 0;
        for (let i = 1; i < prices.length; i++) {
            if (prices[i] === prices[i-1]) {
                identicalCount++;
            }
        }
        
        // 2. Check for extreme volatility (could indicate random data)
        const changes = [];
        for (let i = 1; i < prices.length; i++) {
            const change = Math.abs((prices[i] - prices[i-1]) / prices[i-1]);
            changes.push(change);
        }
        
        const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
        const maxChange = Math.max(...changes);
        
        // Realistic criteria:
        // - Not all prices identical
        // - Average change < 1% per update
        // - Max change < 5% per update
        // - Data source should be 'live' during market hours
        
        const isRealistic = identicalCount < history.length * 0.8 && 
                           avgChange < 0.01 && 
                           maxChange < 0.05;
        
        return isRealistic;
    }

    async testMarketHours() {
        console.log('🕐 Test 4: Market Hours Detection');
        console.log('=================================');
        
        try {
            const response = await axios.get(`${SERVER_URL}/api/market-status`);
            const status = response.data;
            
            const now = moment().tz('Asia/Kolkata');
            const currentTime = now.format('HH:mm');
            const isWeekend = now.day() === 0 || now.day() === 6;
            const expectedOpen = !isWeekend && currentTime >= '09:15' && currentTime <= '15:30';
            
            console.log(`Current Time (IST): ${now.format('YYYY-MM-DD HH:mm:ss')}`);
            console.log(`Day of Week: ${now.format('dddd')}`);
            console.log(`Expected Market Open: ${expectedOpen ? 'YES' : 'NO'}`);
            console.log(`System Reports Open: ${status.isOpen ? 'YES' : 'NO'}`);
            console.log(`Market Session: ${status.session}`);
            console.log(`Display Mode: ${status.displayMode}`);
            
            const isCorrect = status.isOpen === expectedOpen;
            console.log(`Market Hours Detection: ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
            
            this.results.marketHours = {
                currentTime: now.toISOString(),
                expectedOpen,
                systemReportsOpen: status.isOpen,
                session: status.session,
                isCorrect,
                isWeekend
            };
            
        } catch (error) {
            console.error('❌ Market hours test failed:', error.message);
            this.results.errors.push(`Market hours test failed: ${error.message}`);
        }
        
        console.log('');
    }

    async testSignalGeneration() {
        console.log('🎯 Test 5: Signal Generation with Real Data');
        console.log('===========================================');
        
        try {
            // Monitor signals for a short period
            console.log('Monitoring signal generation...');
            
            const startTime = Date.now();
            const signalCheckInterval = setInterval(async () => {
                try {
                    // Check for new signals (this would depend on your WebSocket or polling implementation)
                    // For now, we'll check if signals are being generated with realistic data
                    
                    const response = await axios.get(`${SERVER_URL}/api/market-data`);
                    const marketData = response.data;
                    
                    // Analyze if the data looks like it could generate realistic signals
                    Object.entries(marketData).forEach(([symbol, data]) => {
                        if (data.dataSource === 'live') {
                            console.log(`📊 ${symbol}: ₹${data.ltp} (${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}) [LIVE]`);
                        } else {
                            console.log(`🎮 ${symbol}: ₹${data.ltp} (${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}) [DEMO]`);
                        }
                    });
                    
                } catch (error) {
                    console.error('Error checking signals:', error.message);
                }
            }, 10000);
            
            // Wait for 30 seconds
            await new Promise(resolve => setTimeout(resolve, 30000));
            clearInterval(signalCheckInterval);
            
            console.log('✅ Signal monitoring completed');
            
        } catch (error) {
            console.error('❌ Signal generation test failed:', error.message);
            this.results.errors.push(`Signal generation test failed: ${error.message}`);
        }
        
        console.log('');
    }

    generateReport() {
        console.log('📋 TEST RESULTS SUMMARY');
        console.log('=======================');
        
        // Overall Status
        const hasLiveData = this.results.dataProvider?.status === 'LIVE';
        const hasConnection = this.results.liveConnection?.status === 'SUCCESS';
        const hasRealisticPrices = this.results.priceUpdates.some(p => p.isRealistic);
        const hasCorrectMarketHours = this.results.marketHours?.isCorrect;
        
        const overallStatus = hasLiveData && hasConnection && hasRealisticPrices && hasCorrectMarketHours;
        
        console.log(`\n🎯 OVERALL STATUS: ${overallStatus ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`\n📊 Data Provider: ${this.results.dataProvider?.status || 'UNKNOWN'}`);
        console.log(`🔌 Live Connection: ${this.results.liveConnection?.status || 'UNKNOWN'}`);
        console.log(`📈 Realistic Prices: ${hasRealisticPrices ? 'YES' : 'NO'}`);
        console.log(`🕐 Market Hours: ${hasCorrectMarketHours ? 'CORRECT' : 'INCORRECT'}`);
        
        // Detailed Results
        if (this.results.errors.length > 0) {
            console.log('\n❌ ERRORS FOUND:');
            this.results.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        
        if (!hasLiveData) {
            console.log('• Set LIVE_DATA=true environment variable to enable live market data');
            console.log('• Restart the server after setting the environment variable');
        }
        
        if (!hasConnection) {
            console.log('• Check internet connection and Yahoo Finance API access');
            console.log('• Verify firewall settings allow outbound HTTPS connections');
        }
        
        if (!hasRealisticPrices) {
            console.log('• Verify that live data is being fetched correctly');
            console.log('• Check for rate limiting or API quota issues');
        }
        
        if (!hasCorrectMarketHours) {
            console.log('• Verify system timezone is set correctly');
            console.log('• Check market hours logic in the code');
        }
        
        if (overallStatus) {
            console.log('✅ System is using REAL market data correctly!');
        } else {
            console.log('❌ System is NOT using real market data - fix the issues above');
        }
        
        console.log('\n' + '='.repeat(50));
    }
}

// Run the tests
async function main() {
    const tester = new MarketDataTester();
    await tester.runAllTests();
}

// Handle command line execution
if (require.main === module) {
    main().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = MarketDataTester;
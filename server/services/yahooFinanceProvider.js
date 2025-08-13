const axios = require('axios');
const EventEmitter = require('events');

class YahooFinanceProvider extends EventEmitter {
    constructor() {
        super();
        this.symbols = {
            'NIFTY': '^NSEI',
            'BANKNIFTY': '^NSEBANK',
            'FINNIFTY': '^CNXFIN',
            'SENSEX': '^BSESN',
            'BITCOIN': 'BTC-USD',
            'SOLANA': 'SOL-USD'
        };
        this.updateInterval = 5000; // 5 seconds
        this.isRunning = false;
        this.cache = new Map();
        this.lastUpdate = new Map();
    }

    async start() {
        if (this.isRunning) {
            console.log('ℹ️ Yahoo Finance provider already running');
            return;
        }
        
        try {
            console.log('🚀 Starting Yahoo Finance data provider...');
            this.isRunning = true;
            
            // Initial fetch with better error handling
            console.log('📡 Performing initial data fetch...');
            await this.fetchAllData();
            
            // Verify we got some data
            if (this.cache.size === 0) {
                throw new Error('No data received from Yahoo Finance API');
            }
            
            console.log(`✅ Initial fetch successful, got data for ${this.cache.size} symbols`);
            
            // Set up periodic updates
            this.intervalId = setInterval(async () => {
                try {
                    await this.fetchAllData();
                } catch (error) {
                    console.error('❌ Error in periodic fetch:', error.message);
                    // Emit error event for monitoring
                    this.emit('fetchError', { error: error.message, timestamp: new Date() });
                }
            }, this.updateInterval);
            
            console.log('✅ Yahoo Finance provider started successfully');
            
        } catch (error) {
            console.error('❌ Failed to start Yahoo Finance provider:', error.message);
            
            // Clean up on failure
            this.isRunning = false;
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
            
            // Re-throw the error
            throw new Error(`Yahoo Finance provider startup failed: ${error.message}`);
        }
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('🛑 Yahoo Finance provider stopped');
    }

    async fetchAllData() {
        const promises = Object.entries(this.symbols).map(([symbol, yahooSymbol]) => 
            this.fetchSymbolData(symbol, yahooSymbol)
        );
        
        await Promise.all(promises);
    }

    async fetchSymbolData(symbol, yahooSymbol) {
        try {
            // Fetch current quote with extended range to get last closing data
            const quoteResponse = await axios.get(
                `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=2d`,
                {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                }
            );

            const data = quoteResponse.data;
            if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
                throw new Error(`No data received for ${symbol}`);
            }

            const result = data.chart.result[0];
            const meta = result.meta;
            const timestamps = result.timestamp;
            const quotes = result.indicators.quote[0];

            // Determine market status - crypto markets are always open
            const isCrypto = symbol === 'BITCOIN' || symbol === 'SOLANA';
            let isMarketOpen, isMarketHours;
            
            if (isCrypto) {
                // Crypto markets are 24/7
                isMarketOpen = true;
                isMarketHours = true;
            } else {
                // Equity markets have specific hours
                isMarketOpen = meta.marketState === 'REGULAR';
                const currentTime = new Date();
                const istTime = new Date(currentTime.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
                const hour = istTime.getHours();
                const day = istTime.getDay();
                const isWeekend = day === 0 || day === 6;
                isMarketHours = hour >= 9 && hour <= 15 && !isWeekend;
            }

            let currentPrice, volume, timestamp;
            
            if ((isMarketOpen && isMarketHours) || isCrypto) {
                // Market is open or crypto - use latest data
                const latestIndex = timestamps.length - 1;
                currentPrice = quotes.close[latestIndex] || meta.regularMarketPrice;
                volume = quotes.volume[latestIndex] || meta.regularMarketVolume;
                timestamp = new Date(timestamps[latestIndex] * 1000);
            } else {
                // Market is closed - use last available closing price
                // Find the last valid closing price from the data
                let lastValidIndex = -1;
                for (let i = timestamps.length - 1; i >= 0; i--) {
                    if (quotes.close[i] && quotes.close[i] > 0) {
                        lastValidIndex = i;
                        break;
                    }
                }
                
                if (lastValidIndex >= 0) {
                    currentPrice = quotes.close[lastValidIndex];
                    volume = quotes.volume[lastValidIndex] || 0;
                    timestamp = new Date(timestamps[lastValidIndex] * 1000);
                } else {
                    // Fallback to meta data
                    currentPrice = meta.regularMarketPrice || meta.previousClose;
                    volume = meta.regularMarketVolume || 0;
                    timestamp = new Date();
                }
            }
            
            // Calculate change from previous close
            const previousClose = meta.previousClose;
            const change = currentPrice - previousClose;
            const changePercent = (change / previousClose) * 100;

            const marketData = {
                symbol: symbol,
                ltp: currentPrice,
                open: meta.regularMarketOpen || previousClose,
                high: meta.regularMarketDayHigh || currentPrice,
                low: meta.regularMarketDayLow || currentPrice,
                close: currentPrice,
                volume: volume,
                change: change,
                changePercent: changePercent,
                previousClose: previousClose,
                timestamp: timestamp,
                marketState: isCrypto ? 'REGULAR' : meta.marketState,
                isMarketOpen: (isMarketOpen && isMarketHours) || isCrypto,
                isMarketHours: isMarketHours,
                // Additional data for technical analysis
                ohlcData: this.extractOHLCData(timestamps, quotes),
                lastUpdate: new Date(),
                // Market session info
                sessionInfo: {
                    isWeekend: isCrypto ? false : (new Date().getDay() === 0 || new Date().getDay() === 6),
                    currentHour: new Date().getHours(),
                    marketState: isCrypto ? 'REGULAR' : meta.marketState,
                    dataSource: ((isMarketOpen && isMarketHours) || isCrypto) ? 'live' : 'last_close'
                }
            };

            // Cache the data
            this.cache.set(symbol, marketData);
            this.lastUpdate.set(symbol, Date.now());

            // Emit the update
            this.emit('marketData', marketData);
            this.emit(`marketData:${symbol}`, marketData);


            
            const statusIcon = ((isMarketOpen && isMarketHours) || isCrypto) ? '🔴' : '🟡';
            const dataSource = ((isMarketOpen && isMarketHours) || isCrypto) ? 'LIVE' : 'CLOSE';
            const formattedPrice = isCrypto ? 
                `$${currentPrice.toFixed(2)}` : 
                `₹${currentPrice.toFixed(2)}`;
            
            // Safe logging with null checks
            if (currentPrice && typeof currentPrice === 'number') {
                console.log(`${statusIcon} ${symbol}: ${formattedPrice} (${change >= 0 ? '+' : ''}${change.toFixed(2)}, ${changePercent.toFixed(2)}%) [${dataSource}]`);
            } else {
                console.log(`${statusIcon} ${symbol}: Invalid price data [${dataSource}]`);
            }

        } catch (error) {
            console.error(`❌ Error fetching ${symbol} data:`, error.message);
            
            // Emit error event
            this.emit('error', {
                symbol,
                error: error.message,
                timestamp: new Date()
            });
        }
    }

    extractOHLCData(timestamps, quotes) {
        const ohlcData = [];
        const dataLength = Math.min(timestamps.length, 100); // Last 100 data points
        
        for (let i = timestamps.length - dataLength; i < timestamps.length; i++) {
            if (quotes.open[i] && quotes.high[i] && quotes.low[i] && quotes.close[i]) {
                ohlcData.push({
                    timestamp: new Date(timestamps[i] * 1000),
                    open: quotes.open[i],
                    high: quotes.high[i],
                    low: quotes.low[i],
                    close: quotes.close[i],
                    volume: quotes.volume[i] || 0
                });
            }
        }
        
        return ohlcData;
    }

    // Get cached data for a symbol
    getLatestData(symbol) {
        return this.cache.get(symbol) || null;
    }

    // Get all cached data
    getAllData() {
        const data = {};
        for (const [symbol, marketData] of this.cache.entries()) {
            data[symbol] = marketData;
        }
        return data;
    }

    // Check if data is fresh (updated within last 30 seconds)
    isDataFresh(symbol) {
        const lastUpdate = this.lastUpdate.get(symbol);
        if (!lastUpdate) return false;
        return (Date.now() - lastUpdate) < 30000;
    }

    // Get historical data for technical analysis
    async getHistoricalData(symbol, period = '1d', interval = '5m') {
        try {
            const yahooSymbol = this.symbols[symbol];
            if (!yahooSymbol) {
                throw new Error(`Symbol ${symbol} not supported`);
            }

            const response = await axios.get(
                `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${period}`,
                {
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                }
            );

            const data = response.data;
            if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
                throw new Error(`No historical data for ${symbol}`);
            }

            const result = data.chart.result[0];
            const timestamps = result.timestamp;
            const quotes = result.indicators.quote[0];

            const historicalData = [];
            for (let i = 0; i < timestamps.length; i++) {
                if (quotes.open[i] && quotes.high[i] && quotes.low[i] && quotes.close[i]) {
                    historicalData.push({
                        timestamp: new Date(timestamps[i] * 1000),
                        open: quotes.open[i],
                        high: quotes.high[i],
                        low: quotes.low[i],
                        close: quotes.close[i],
                        volume: quotes.volume[i] || 0
                    });
                }
            }

            console.log(`📈 Fetched ${historicalData.length} historical data points for ${symbol}`);
            return historicalData;

        } catch (error) {
            console.error(`❌ Error fetching historical data for ${symbol}:`, error.message);
            return [];
        }
    }

    // Get market status
    getMarketStatus() {
        const niftyData = this.cache.get('NIFTY');
        if (!niftyData) {
            return {
                isOpen: false,
                state: 'UNKNOWN',
                lastUpdate: null
            };
        }

        return {
            isOpen: niftyData.isMarketOpen,
            state: niftyData.marketState,
            lastUpdate: niftyData.lastUpdate
        };
    }

    // Health check method
    isHealthy() {
        if (!this.isRunning) {
            return { healthy: false, reason: 'Provider not running' };
        }
        
        if (this.cache.size === 0) {
            return { healthy: false, reason: 'No data in cache' };
        }
        
        // Check if data is recent (within last 2 minutes)
        const now = Date.now();
        for (const [symbol, lastUpdate] of this.lastUpdate.entries()) {
            if (now - lastUpdate > 120000) { // 2 minutes
                return { healthy: false, reason: `Stale data for ${symbol}` };
            }
        }
        
        return { healthy: true, reason: 'All systems operational' };
    }
}

module.exports = YahooFinanceProvider;
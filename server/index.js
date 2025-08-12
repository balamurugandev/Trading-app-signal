const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const moment = require('moment-timezone');
const cron = require('node-cron');

const TechnicalAnalysis = require('./services/technicalAnalysis');
const DataProvider = require('./services/dataProvider');
const SignalGenerator = require('./services/signalGenerator');
const RiskManager = require('./services/riskManager');
const AdvancedSignalEngine = require('./services/advancedSignalEngine');
const ExecutionQualityService = require('./services/executionQuality');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Request logging middleware for debugging
let requestCount = 0;
let lastRequestTime = Date.now();
app.use((req, res, next) => {
  if (req.path.startsWith('/api/data/current') || req.path.startsWith('/api/indicators')) {
    const currentTime = Date.now();
    const timeSinceLastRequest = currentTime - lastRequestTime;
    requestCount++;
    
    console.log(`🌐 API Request #${requestCount}: ${req.method} ${req.path} (${timeSinceLastRequest}ms since last)`);
    lastRequestTime = currentTime;
  }
  next();
});

// Redirect root to client app
app.get('/', (req, res) => {
  res.redirect('http://localhost:5173');
});

// Initialize services
const dataProvider = new DataProvider();
const technicalAnalysis = new TechnicalAnalysis();
const riskManager = new RiskManager();
const signalGenerator = new SignalGenerator(technicalAnalysis, riskManager);

// Initialize data provider
dataProvider.initializeLiveData().catch(error => {
  console.error('Failed to initialize live data:', error.message);
});

// Initialize advanced services
const advancedSignalEngine = new AdvancedSignalEngine();
const executionQualityService = new ExecutionQualityService();

// Market session tracking
let isMarketOpen = false;
let currentSession = null;

// VIX data cache for realistic changes
let vixCache = {
  value: 15.25,
  lastUpdate: Date.now()
};

// Check if market is in liquid trading windows
function isLiquidWindow() {
  const now = moment().tz('Asia/Kolkata');
  const time = now.format('HH:mm');
  
  // Liquid windows: 9:25-11:00 and 13:45-15:05
  return (time >= '09:25' && time <= '11:00') || 
         (time >= '13:45' && time <= '15:05');
}

// Check if market is open (9:15-15:30 on weekdays)
function checkMarketStatus() {
  const now = moment().tz('Asia/Kolkata');
  const day = now.day(); // 0 = Sunday, 6 = Saturday
  const time = now.format('HH:mm');
  
  // Market closed on weekends
  if (day === 0 || day === 6) return false;
  
  // Market hours: 9:15 AM to 3:30 PM
  return time >= '09:15' && time <= '15:30';
}

// Advanced signal engine event handlers
advancedSignalEngine.on('advancedSignal', (signal) => {
  console.log('Advanced signal generated:', signal);
  io.emit('advancedSignal', signal);
});

advancedSignalEngine.on('marketQualityUpdate', (quality) => {
  io.emit('marketQuality', quality);
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send current market status
  socket.emit('marketStatus', {
    isOpen: isMarketOpen,
    isLiquidWindow: isLiquidWindow(),
    session: currentSession
  });
  
  // Send current market quality for advanced dashboard
  socket.emit('marketQuality', advancedSignalEngine.getMarketQuality());
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
  
  socket.on('subscribeSymbol', (symbol) => {
    console.log(`Client subscribed to ${symbol}`);
    socket.join(symbol);
  });
  
  socket.on('unsubscribeSymbol', (symbol) => {
    console.log(`Client unsubscribed from ${symbol}`);
    socket.leave(symbol);
  });
  
  // Advanced dashboard specific events
  socket.on('requestExecutionMetrics', () => {
    const metrics = executionQualityService.getExecutionMetrics();
    socket.emit('executionMetrics', metrics);
  });
  
  socket.on('simulateOrder', (orderData) => {
    const mockDepth = {
      bestBid: orderData.price * 0.995,
      bestAsk: orderData.price * 1.005,
      midPrice: orderData.price,
      spread: orderData.price * 0.01
    };
    
    const fillResult = executionQualityService.simulateFill(
      orderData, 
      mockDepth, 
      advancedSignalEngine.getMarketQuality().latency
    );
    
    socket.emit('orderFillResult', fillResult);
  });
});

// Market data processing and signal generation
async function processMarketData() {
  if (!isMarketOpen) return;
  
  const symbols = ['NIFTY', 'BANKNIFTY'];
  const timeframes = ['1m', '5m', '15m'];
  
  for (const symbol of symbols) {
    for (const timeframe of timeframes) {
      try {
        // Get latest market data
        const marketData = await dataProvider.getLatestData(symbol, timeframe);
        
        if (!marketData || marketData.length < 50) continue;
        
        // Calculate technical indicators
        const indicators = technicalAnalysis.calculateIndicators(marketData);
        
        // Generate signals only during market hours and liquid window
        const now = moment().tz('Asia/Kolkata');
        const day = now.day();
        const time = now.format('HH:mm');
        const isWeekend = day === 0 || day === 6;
        const isMarketHours = time >= '09:15' && time <= '15:30';
        const isLiquidWindow = (time >= '09:25' && time <= '11:00') || 
                              (time >= '13:45' && time <= '15:05');
        
        if (!isWeekend && isMarketHours && isLiquidWindow) {
          const signal = signalGenerator.generateSignal(
            symbol, 
            timeframe, 
            marketData, 
            indicators
          );
          
          if (signal) {
            console.log(`🚨 LIVE SIGNAL: ${symbol} ${timeframe}:`, signal);
            
            // Emit signal to subscribed clients
            io.to(symbol).emit('newSignal', {
              symbol,
              timeframe,
              signal,
              timestamp: now.toISOString(),
              isLive: true
            });
          }
        } else {
          // During non-trading hours, don't generate signals
          if (!isWeekend && !isMarketHours) {
            console.log(`📊 Market closed - showing last close data for ${symbol}`);
          }
        }
        
        // Always emit market data updates with proper indicators
        const latestCandle = marketData.slice(-1)[0];
        const latestIndicators = {
          vwap: indicators.vwap?.slice(-1)[0] || null,
          ema9: indicators.ema9?.slice(-1)[0] || null,
          ema21: indicators.ema21?.slice(-1)[0] || null,
          rsi: indicators.rsi?.slice(-1)[0] || null,
          macd: indicators.macd?.slice(-1)[0] || null,
          bb: indicators.bb?.slice(-1)[0] || null,
          cpr: indicators.cpr || null
        };

        io.to(symbol).emit('marketData', {
          symbol,
          timeframe,
          data: latestCandle,
          indicators: latestIndicators,
          isMarketOpen: !isWeekend && isMarketHours,
          dataSource: (!isWeekend && isMarketHours) ? 'live' : 'last_close',
          timestamp: now.toISOString()
        });
        
      } catch (error) {
        console.error(`Error processing ${symbol} ${timeframe}:`, error);
      }
    }
  }
}

// Market status monitoring
cron.schedule('* * * * *', () => {
  const wasOpen = isMarketOpen;
  isMarketOpen = checkMarketStatus();
  
  if (wasOpen !== isMarketOpen) {
    console.log(`Market status changed: ${isMarketOpen ? 'OPEN' : 'CLOSED'}`);
    io.emit('marketStatus', {
      isOpen: isMarketOpen,
      isLiquidWindow: isLiquidWindow(),
      session: currentSession
    });
  }
});

// Real-time data processing and signal generation (every 1 second during market hours)
cron.schedule('* * * * * *', () => {
  if (isMarketOpen) {
    processMarketData();
    
    // Generate signals every 5 seconds during ALL market hours (not just liquid windows)
    const now = moment().tz('Asia/Kolkata');
    const time = now.format('HH:mm');
    const second = now.second();
    
    // Check for signals every 5 seconds during ALL market hours
    if (second % 5 === 0) {
      generateRealTimeSignals();
    }
  }
});

// Function to generate real-time signals
async function generateRealTimeSignals() {
  const symbols = ['NIFTY', 'BANKNIFTY'];
  const timeframes = ['1m', '5m'];
  
  for (const symbol of symbols) {
    for (const timeframe of timeframes) {
      try {
        // Get latest market data
        const marketData = await dataProvider.getLatestData(symbol, timeframe);
        
        if (!marketData || marketData.length < 50) continue;
        
        // Calculate technical indicators
        const indicators = technicalAnalysis.calculateIndicators(marketData);
        
        // Check signal conditions
        const signal = signalGenerator.generateSignal(
          symbol, 
          timeframe, 
          marketData, 
          indicators
        );
        
        if (signal) {
          console.log(`🚨 REAL-TIME SIGNAL: ${symbol} ${timeframe}:`, {
            type: signal.type,
            price: signal.entryPrice,
            strength: signal.strength,
            timestamp: signal.timestamp
          });
          
          // Emit signal to all connected clients
          io.emit('newSignal', {
            symbol,
            timeframe,
            signal,
            timestamp: moment().tz('Asia/Kolkata').toISOString(),
            isLive: true,
            priority: 'high' // Mark as high priority for real-time signals
          });
          
          // Also emit to symbol-specific room
          io.to(symbol).emit('newSignal', {
            symbol,
            timeframe,
            signal,
            timestamp: moment().tz('Asia/Kolkata').toISOString(),
            isLive: true
          });
        }
        
      } catch (error) {
        console.error(`Error generating real-time signal for ${symbol} ${timeframe}:`, error);
      }
    }
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    marketOpen: isMarketOpen,
    liquidWindow: isLiquidWindow(),
    timestamp: moment().tz('Asia/Kolkata').toISOString()
  });
});

app.get('/api/historical/:symbol/:timeframe', async (req, res) => {
  try {
    const { symbol, timeframe } = req.params;
    const { days = 5 } = req.query;
    
    const data = await dataProvider.getHistoricalData(symbol, timeframe, days);
    const indicators = technicalAnalysis.calculateIndicators(data);
    
    // Check if market is open to determine data source
    const now = moment().tz('Asia/Kolkata');
    const day = now.day();
    const time = now.format('HH:mm');
    const isWeekend = day === 0 || day === 6;
    const isMarketHours = time >= '09:15' && time <= '15:30';
    const isMarketOpen = !isWeekend && isMarketHours;
    
    res.json({
      symbol,
      timeframe,
      data,
      indicators,
      isMarketOpen,
      dataSource: isMarketOpen ? 'live' : 'last_close',
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error('Historical data error:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

// New endpoint for current technical indicators
app.get('/api/indicators/:symbol/:timeframe', async (req, res) => {
  try {
    const { symbol, timeframe } = req.params;
    
    // Get recent data to calculate current indicators
    const data = await dataProvider.getLatestData(symbol, timeframe);
    
    if (!data || data.length < 20) {
      return res.status(404).json({ error: 'Insufficient data for indicator calculation' });
    }
    
    const indicators = technicalAnalysis.calculateIndicators(data);
    
    // Get the latest values
    const latestIndicators = {
      vwap: indicators.vwap?.slice(-1)[0] || null,
      ema9: indicators.ema9?.slice(-1)[0] || null,
      ema21: indicators.ema21?.slice(-1)[0] || null,
      rsi: indicators.rsi?.slice(-1)[0] || null,
      macd: indicators.macd?.slice(-1)[0] || null,
      bb: indicators.bb?.slice(-1)[0] || null,
      cpr: indicators.cpr || null
    };
    
    // Check market status
    const now = moment().tz('Asia/Kolkata');
    const day = now.day();
    const time = now.format('HH:mm');
    const isWeekend = day === 0 || day === 6;
    const isMarketHours = time >= '09:15' && time <= '15:30';
    const isMarketOpen = !isWeekend && isMarketHours;
    
    res.json({
      symbol,
      timeframe,
      indicators: latestIndicators,
      isMarketOpen,
      dataSource: isMarketOpen ? 'live' : 'last_close',
      timestamp: now.toISOString()
    });
    
  } catch (error) {
    console.error('Indicators error:', error);
    res.status(500).json({ error: 'Failed to calculate indicators' });
  }
});

// Advanced API routes
app.get('/api/advanced/market-quality', (req, res) => {
  res.json({
    quality: advancedSignalEngine.getMarketQuality(),
    timestamp: moment().tz('Asia/Kolkata').toISOString()
  });
});

app.get('/api/advanced/execution-metrics', (req, res) => {
  const { timeframe = '1d' } = req.query;
  const metrics = executionQualityService.getExecutionMetrics(timeframe);
  
  res.json({
    metrics,
    timeframe,
    timestamp: moment().tz('Asia/Kolkata').toISOString()
  });
});

app.get('/api/advanced/cost-regime', (req, res) => {
  res.json({
    regime: advancedSignalEngine.getCostRegime(),
    effectiveDate: '2024-10-01',
    timestamp: moment().tz('Asia/Kolkata').toISOString()
  });
});

app.post('/api/advanced/calculate-costs', (req, res) => {
  try {
    const { premium, quantity = 50 } = req.body;
    
    if (!premium) {
      return res.status(400).json({ error: 'Premium is required' });
    }
    
    const costs = advancedSignalEngine.calculateCosts(premium, quantity);
    
    res.json({
      costs,
      inputs: { premium, quantity },
      timestamp: moment().tz('Asia/Kolkata').toISOString()
    });
  } catch (error) {
    console.error('Cost calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate costs' });
  }
});

app.post('/api/advanced/assess-liquidity', (req, res) => {
  try {
    const { strike, symbol } = req.body;
    
    if (!strike || !symbol) {
      return res.status(400).json({ error: 'Strike and symbol are required' });
    }
    
    const liquidity = advancedSignalEngine.assessLiquidity(strike, symbol);
    
    res.json({
      liquidity,
      inputs: { strike, symbol },
      timestamp: moment().tz('Asia/Kolkata').toISOString()
    });
  } catch (error) {
    console.error('Liquidity assessment error:', error);
    res.status(500).json({ error: 'Failed to assess liquidity' });
  }
});

app.get('/api/advanced/safety-rails', (req, res) => {
  res.json({
    rails: advancedSignalEngine.getSafetyRails(),
    timestamp: moment().tz('Asia/Kolkata').toISOString()
  });
});


// Generate signal for specific symbol and timeframe (GET version for easy testing)
app.get('/api/signals/generate/:symbol/:timeframe', (req, res) => {
  try {
    const { symbol, timeframe } = req.params;
    
    if (!['NIFTY', 'BANKNIFTY'].includes(symbol)) {
      return res.status(400).json({ error: 'Symbol must be NIFTY or BANKNIFTY' });
    }
    
    if (!['1m', '5m', '15m'].includes(timeframe)) {
      return res.status(400).json({ error: 'Timeframe must be 1m, 5m, or 15m' });
    }
    
    console.log(`API: Generating signal for ${symbol} ${timeframe}`);
    const signal = advancedSignalEngine.generateAdvancedSignal(symbol, timeframe);
    console.log(`API: Signal generated:`, signal ? 'SUCCESS' : 'NULL');
    
    if (!signal) {
      return res.status(404).json({ error: 'No signal generated - conditions not met' });
    }
    
    res.json({
      signal,
      timestamp: moment().tz('Asia/Kolkata').toISOString()
    });
  } catch (error) {
    console.error('Signal generation error:', error);
    res.status(500).json({ error: 'Failed to generate signal' });
  }
});

// Generate signal for specific symbol and timeframe (POST version)
app.post('/api/advanced/generate-signal', (req, res) => {
  try {
    const { symbol, timeframe } = req.body;
    
    if (!symbol || !timeframe) {
      return res.status(400).json({ error: 'Symbol and timeframe are required' });
    }
    
    if (!['NIFTY', 'BANKNIFTY'].includes(symbol)) {
      return res.status(400).json({ error: 'Symbol must be NIFTY or BANKNIFTY' });
    }
    
    if (!['1m', '5m', '15m'].includes(timeframe)) {
      return res.status(400).json({ error: 'Timeframe must be 1m, 5m, or 15m' });
    }
    
    console.log(`API: Generating signal for ${symbol} ${timeframe}`);
    const signal = advancedSignalEngine.generateAdvancedSignal(symbol, timeframe);
    console.log(`API: Signal generated:`, signal ? 'SUCCESS' : 'NULL');
    
    if (!signal) {
      return res.status(404).json({ error: 'No signal generated - conditions not met' });
    }
    
    res.json({
      signal,
      timestamp: moment().tz('Asia/Kolkata').toISOString()
    });
  } catch (error) {
    console.error('Signal generation error:', error);
    res.status(500).json({ error: 'Failed to generate signal' });
  }
});

// Live data control endpoints
app.get('/api/data/status', (req, res) => {
  res.json({
    status: dataProvider.getLiveDataStatus(),
    marketStatus: dataProvider.getMarketStatus(),
    timestamp: moment().tz('Asia/Kolkata').toISOString()
  });
});

app.post('/api/data/enable-live', async (req, res) => {
  try {
    await dataProvider.enableLiveMode();
    res.json({
      success: true,
      message: 'Live data mode enabled',
      status: dataProvider.getLiveDataStatus(),
      timestamp: moment().tz('Asia/Kolkata').toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: moment().tz('Asia/Kolkata').toISOString()
    });
  }
});

app.post('/api/data/disable-live', (req, res) => {
  try {
    dataProvider.disableLiveMode();
    res.json({
      success: true,
      message: 'Demo mode enabled',
      status: dataProvider.getLiveDataStatus(),
      timestamp: moment().tz('Asia/Kolkata').toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: moment().tz('Asia/Kolkata').toISOString()
    });
  }
});

app.get('/api/data/current/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    let data;
    
    // Handle VIX specially
    if (symbol.toUpperCase() === 'VIX') {
      // Generate realistic VIX data
      const now = moment().tz('Asia/Kolkata');
      const hour = now.hour();
      const minute = now.minute();
      const day = now.day();
      const isWeekend = day === 0 || day === 6;
      const isMarketHours = (hour > 9 || (hour === 9 && minute >= 15)) && (hour < 15 || (hour === 15 && minute <= 30));
      const isMarketOpen = !isWeekend && isMarketHours;
      
      // VIX typically ranges from 10-30, with higher values during volatility
      // Create a more realistic VIX that changes incrementally
      const timeSinceLastUpdate = now.valueOf() - vixCache.lastUpdate;
      const shouldUpdate = timeSinceLastUpdate > 1000; // Update every second
      
      if (shouldUpdate) {
        const volatilityFactor = isMarketOpen ? (Math.random() - 0.5) * 0.2 : (Math.random() - 0.5) * 0.05;
        const newVix = Math.max(10, Math.min(30, vixCache.value + volatilityFactor));
        const change = newVix - vixCache.value;
        
        vixCache = {
          value: newVix,
          lastUpdate: now.valueOf()
        };
      }
      
      const currentVix = vixCache.value;
      const change = currentVix - 15.25; // Change from base value
      
      data = {
        symbol: 'VIX',
        ltp: currentVix,
        change: change,
        changePercent: (change / currentVix) * 100,
        volume: Math.floor(Math.random() * 1000000),
        timestamp: now.toISOString(),
        isMarketOpen: isMarketOpen
      };
    } else {
      data = dataProvider.getCurrentMarketData(symbol.toUpperCase());
    }
    
    if (!data) {
      return res.status(404).json({
        error: `No data available for symbol: ${symbol}`,
        timestamp: moment().tz('Asia/Kolkata').toISOString()
      });
    }
    
    res.json({
      data,
      isLive: dataProvider.getLiveDataStatus().isLiveMode,
      timestamp: moment().tz('Asia/Kolkata').toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: moment().tz('Asia/Kolkata').toISOString()
    });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Market status: ${checkMarketStatus() ? 'OPEN' : 'CLOSED'}`);
});
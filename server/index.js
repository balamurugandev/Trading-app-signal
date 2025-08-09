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

// Initialize services
const dataProvider = new DataProvider();
const technicalAnalysis = new TechnicalAnalysis();
const riskManager = new RiskManager();
const signalGenerator = new SignalGenerator(technicalAnalysis, riskManager);

// Market session tracking
let isMarketOpen = false;
let currentSession = null;

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

// Socket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send current market status
  socket.emit('marketStatus', {
    isOpen: isMarketOpen,
    isLiquidWindow: isLiquidWindow(),
    session: currentSession
  });
  
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
        
        // Generate signals if in liquid window
        if (isLiquidWindow()) {
          const signal = signalGenerator.generateSignal(
            symbol, 
            timeframe, 
            marketData, 
            indicators
          );
          
          if (signal) {
            console.log(`Signal generated for ${symbol} ${timeframe}:`, signal);
            
            // Emit signal to subscribed clients
            io.to(symbol).emit('newSignal', {
              symbol,
              timeframe,
              signal,
              timestamp: moment().tz('Asia/Kolkata').toISOString()
            });
          }
        }
        
        // Always emit market data updates
        io.to(symbol).emit('marketData', {
          symbol,
          timeframe,
          data: marketData.slice(-1)[0], // Latest candle
          indicators: {
            vwap: indicators.vwap.slice(-1)[0],
            ema9: indicators.ema9.slice(-1)[0],
            ema21: indicators.ema21.slice(-1)[0],
            rsi: indicators.rsi.slice(-1)[0],
            macd: indicators.macd.slice(-1)[0],
            bb: indicators.bb.slice(-1)[0],
            cpr: indicators.cpr
          },
          timestamp: moment().tz('Asia/Kolkata').toISOString()
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

// Real-time data processing (every 1 second during market hours)
cron.schedule('* * * * * *', () => {
  if (isMarketOpen) {
    processMarketData();
  }
});

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
    
    res.json({
      symbol,
      timeframe,
      data,
      indicators,
      timestamp: moment().tz('Asia/Kolkata').toISOString()
    });
  } catch (error) {
    console.error('Historical data error:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Market status: ${checkMarketStatus() ? 'OPEN' : 'CLOSED'}`);
});
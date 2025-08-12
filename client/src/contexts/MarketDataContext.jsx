import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSocket } from './SocketContext';

const MarketDataContext = createContext();

const initialState = {
  marketStatus: {
    isOpen: false,
    isLiquidWindow: false,
    session: 'CLOSED'
  },
  symbols: {
    NIFTY: {
      '1m': { 
        data: {
          close: 24487.40,
          change: -97.65,
          changePercent: -0.40,
          volume: 125000,
          timestamp: Date.now()
        }, 
        indicators: {
          rsi: 45.2,
          macd: { line: -2.5, signal: -1.8, histogram: -0.7 },
          ema9: 24485.30,
          ema21: 24480.75
        }, 
        lastUpdate: Date.now() 
      },
      '5m': { 
        data: {
          close: 24487.40,
          change: -97.65,
          changePercent: -0.40,
          volume: 89000,
          timestamp: Date.now()
        }, 
        indicators: {
          rsi: 42.8,
          macd: { line: -3.2, signal: -2.1, histogram: -1.1 },
          ema9: 24485.75,
          ema21: 24483.50
        }, 
        lastUpdate: Date.now() 
      },
      '15m': { 
        data: {
          close: 24487.40,
          change: -97.65,
          changePercent: -0.40,
          volume: 67000,
          timestamp: Date.now()
        }, 
        indicators: {
          rsi: 38.7,
          macd: { line: -4.1, signal: -3.2, histogram: -0.9 },
          ema9: 24485.20,
          ema21: 24482.15
        }, 
        lastUpdate: Date.now() 
      }
    },
    BANKNIFTY: {
      '1m': { 
        data: {
          close: 55043.70,
          change: -467.05,
          changePercent: -0.84,
          volume: 98000,
          timestamp: Date.now()
        }, 
        indicators: {
          rsi: 44.5,
          macd: { line: -5.2, signal: -4.1, histogram: -1.1 },
          ema9: 55040.30,
          ema21: 55035.75
        }, 
        lastUpdate: Date.now() 
      },
      '5m': { 
        data: {
          close: 55043.70,
          change: -467.05,
          changePercent: -0.84,
          volume: 76000,
          timestamp: Date.now()
        }, 
        indicators: {
          rsi: 41.2,
          macd: { line: -6.8, signal: -5.3, histogram: -1.5 },
          ema9: 55041.75,
          ema21: 55038.50
        }, 
        lastUpdate: Date.now() 
      },
      '15m': { 
        data: {
          close: 55043.70,
          change: -467.05,
          changePercent: -0.84,
          volume: 54000,
          timestamp: Date.now()
        }, 
        indicators: {
          rsi: 37.9,
          macd: { line: -8.1, signal: -6.8, histogram: -1.3 },
          ema9: 55041.20,
          ema21: 55038.15
        }, 
        lastUpdate: Date.now() 
      }
    },
    FINNIFTY: {
      '1m': { 
        data: {
          close: 23245.80,
          change: -85.20,
          changePercent: -0.37,
          volume: 45000,
          timestamp: Date.now()
        }, 
        indicators: {
          rsi: 46.1,
          macd: { line: -1.8, signal: -1.2, histogram: -0.6 },
          ema9: 23243.50,
          ema21: 23240.25
        }, 
        lastUpdate: Date.now() 
      },
      '5m': { 
        data: {
          close: 23245.80,
          change: -85.20,
          changePercent: -0.37,
          volume: 32000,
          timestamp: Date.now()
        }, 
        indicators: {
          rsi: 43.5,
          macd: { line: -2.1, signal: -1.8, histogram: -0.3 },
          ema9: 23244.25,
          ema21: 23241.75
        }, 
        lastUpdate: Date.now() 
      },
      '15m': { 
        data: {
          close: 23245.80,
          change: -85.20,
          changePercent: -0.37,
          volume: 28000,
          timestamp: Date.now()
        }, 
        indicators: {
          rsi: 40.2,
          macd: { line: -2.8, signal: -2.3, histogram: -0.5 },
          ema9: 23243.80,
          ema21: 23240.90
        }, 
        lastUpdate: Date.now() 
      }
    },
    SENSEX: {
      '1m': { 
        data: {
          close: 80604.65,
          change: -318.45,
          changePercent: -0.39,
          volume: 78000,
          timestamp: Date.now()
        }, 
        indicators: {
          rsi: 44.8,
          macd: { line: -8.2, signal: -6.1, histogram: -2.1 },
          ema9: 80600.30,
          ema21: 80595.75
        }, 
        lastUpdate: Date.now() 
      },
      '5m': { 
        data: {
          close: 80604.65,
          change: -318.45,
          changePercent: -0.39,
          volume: 65000,
          timestamp: Date.now()
        }, 
        indicators: {
          rsi: 42.1,
          macd: { line: -9.5, signal: -7.2, histogram: -2.3 },
          ema9: 80602.75,
          ema21: 80598.50
        }, 
        lastUpdate: Date.now() 
      },
      '15m': { 
        data: {
          close: 80604.65,
          change: -318.45,
          changePercent: -0.39,
          volume: 52000,
          timestamp: Date.now()
        }, 
        indicators: {
          rsi: 39.4,
          macd: { line: -11.1, signal: -8.8, histogram: -2.3 },
          ema9: 80601.20,
          ema21: 80596.15
        }, 
        lastUpdate: Date.now() 
      }
    },
    BITCOIN: {
      '1m': { 
        data: {
          close: 60245.50,
          change: 1250.30,
          changePercent: 2.12,
          volume: 15000,
          timestamp: Date.now()
        }, 
        indicators: {
          rsi: 65.2,
          macd: { line: 125.5, signal: 98.2, histogram: 27.3 },
          ema9: 60180.30,
          ema21: 59950.75
        }, 
        lastUpdate: Date.now() 
      },
      '5m': { 
        data: {
          close: 60245.50,
          change: 1250.30,
          changePercent: 2.12,
          volume: 12000,
          timestamp: Date.now()
        }, 
        indicators: {
          rsi: 62.8,
          macd: { line: 118.2, signal: 95.1, histogram: 23.1 },
          ema9: 60185.75,
          ema21: 59955.50
        }, 
        lastUpdate: Date.now() 
      },
      '15m': { 
        data: {
          close: 60245.50,
          change: 1250.30,
          changePercent: 2.12,
          volume: 9500,
          timestamp: Date.now()
        }, 
        indicators: {
          rsi: 58.7,
          macd: { line: 105.1, signal: 88.2, histogram: 16.9 },
          ema9: 60190.20,
          ema21: 59965.15
        }, 
        lastUpdate: Date.now() 
      }
    },
    SOLANA: {
      '1m': { 
        data: {
          close: 185.75,
          change: 8.45,
          changePercent: 4.76,
          volume: 8500,
          timestamp: Date.now()
        }, 
        indicators: {
          rsi: 72.1,
          macd: { line: 3.2, signal: 2.1, histogram: 1.1 },
          ema9: 184.30,
          ema21: 181.75
        }, 
        lastUpdate: Date.now() 
      },
      '5m': { 
        data: {
          close: 185.75,
          change: 8.45,
          changePercent: 4.76,
          volume: 7200,
          timestamp: Date.now()
        }, 
        indicators: {
          rsi: 69.8,
          macd: { line: 2.8, signal: 1.9, histogram: 0.9 },
          ema9: 184.75,
          ema21: 182.50
        }, 
        lastUpdate: Date.now() 
      },
      '15m': { 
        data: {
          close: 185.75,
          change: 8.45,
          changePercent: 4.76,
          volume: 6100,
          timestamp: Date.now()
        }, 
        indicators: {
          rsi: 66.2,
          macd: { line: 2.1, signal: 1.5, histogram: 0.6 },
          ema9: 185.20,
          ema21: 183.15
        }, 
        lastUpdate: Date.now() 
      }
    }
  },
  subscriptions: new Set(),
  historicalData: {}
};

function marketDataReducer(state, action) {
  switch (action.type) {
    case 'SET_MARKET_STATUS':
      return {
        ...state,
        marketStatus: action.payload
      };

    case 'UPDATE_MARKET_DATA':
      const { symbol, timeframe, data, indicators, timestamp } = action.payload;
      return {
        ...state,
        symbols: {
          ...state.symbols,
          [symbol]: {
            ...state.symbols[symbol],
            [timeframe]: {
              data,
              indicators,
              lastUpdate: timestamp
            }
          }
        }
      };

    case 'ADD_SUBSCRIPTION':
      return {
        ...state,
        subscriptions: new Set([...state.subscriptions, action.payload])
      };

    case 'REMOVE_SUBSCRIPTION':
      const newSubscriptions = new Set(state.subscriptions);
      newSubscriptions.delete(action.payload);
      return {
        ...state,
        subscriptions: newSubscriptions
      };

    case 'SET_HISTORICAL_DATA':
      return {
        ...state,
        historicalData: {
          ...state.historicalData,
          [`${action.payload.symbol}_${action.payload.timeframe}`]: action.payload.data
        }
      };

    default:
      return state;
  }
}

export const useMarketData = () => {
  const context = useContext(MarketDataContext);
  if (!context) {
    throw new Error('useMarketData must be used within a MarketDataProvider');
  }
  return context;
};

export const MarketDataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(marketDataReducer, initialState);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for market status updates
    socket.on('marketStatus', (status) => {
      dispatch({ type: 'SET_MARKET_STATUS', payload: status });
    });

    // Listen for market data updates
    socket.on('marketData', (update) => {
      dispatch({ type: 'UPDATE_MARKET_DATA', payload: update });
    });

    return () => {
      socket.off('marketStatus');
      socket.off('marketData');
    };
  }, [socket]);

  const subscribeToSymbol = (symbol) => {
    if (!state.subscriptions.has(symbol)) {
      socket.emit('subscribeSymbol', symbol);
      dispatch({ type: 'ADD_SUBSCRIPTION', payload: symbol });
    }
  };

  const unsubscribeFromSymbol = (symbol) => {
    if (state.subscriptions.has(symbol)) {
      socket.emit('unsubscribeSymbol', symbol);
      dispatch({ type: 'REMOVE_SUBSCRIPTION', payload: symbol });
    }
  };

  const fetchHistoricalData = async (symbol, timeframe, days = 5) => {
    try {
      const response = await fetch(`/api/historical/${symbol}/${timeframe}?days=${days}`);
      const data = await response.json();
      
      dispatch({
        type: 'SET_HISTORICAL_DATA',
        payload: { symbol, timeframe, data }
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  };

  const value = {
    ...state,
    subscribeToSymbol,
    unsubscribeFromSymbol,
    fetchHistoricalData
  };

  return (
    <MarketDataContext.Provider value={value}>
      {children}
    </MarketDataContext.Provider>
  );
};
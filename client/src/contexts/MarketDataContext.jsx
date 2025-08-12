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
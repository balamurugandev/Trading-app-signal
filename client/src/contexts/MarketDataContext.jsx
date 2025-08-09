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
      '1m': { data: null, indicators: null, lastUpdate: null },
      '5m': { data: null, indicators: null, lastUpdate: null },
      '15m': { data: null, indicators: null, lastUpdate: null }
    },
    BANKNIFTY: {
      '1m': { data: null, indicators: null, lastUpdate: null },
      '5m': { data: null, indicators: null, lastUpdate: null },
      '15m': { data: null, indicators: null, lastUpdate: null }
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
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSocket } from './SocketContext';

const SignalContext = createContext();

// Sample signals for testing based on official closing prices
const sampleSignals = [
  {
    id: 'sample_1',
    symbol: 'NIFTY',
    timeframe: '5m',
    type: 'BUY',
    entryPrice: 24485.50,
    stopLoss: 24455.00,
    target1: 24515.00,
    target2: 24545.00,
    strength: 75,
    status: 'active',
    timestamp: Date.now() - 300000, // 5 minutes ago
    optionStrike: 24500,
    riskReward: '1:2',
    pnl: 0,
    receivedAt: new Date(Date.now() - 300000).toISOString(),
    conditions: {
      trendFilter: true,
      momentumTrigger: 'RSI',
      volatilityStructure: true,
      signalValidation: true
    }
  },
  {
    id: 'sample_2',
    symbol: 'BANKNIFTY',
    timeframe: '1m',
    type: 'SELL',
    entryPrice: 55050.00,
    stopLoss: 55100.00,
    target1: 55000.00,
    target2: 54950.00,
    strength: 82,
    status: 'hit_target',
    timestamp: Date.now() - 600000, // 10 minutes ago
    optionStrike: 55000,
    riskReward: '1:2',
    pnl: 2.5,
    receivedAt: new Date(Date.now() - 600000).toISOString(),
    exitPrice: 55000.00,
    exitTime: new Date(Date.now() - 300000).toISOString(),
    conditions: {
      trendFilter: true,
      momentumTrigger: 'MACD',
      volatilityStructure: true,
      signalValidation: true
    }
  },
  {
    id: 'sample_3',
    symbol: 'NIFTY',
    timeframe: '15m',
    type: 'BUY',
    entryPrice: 24480.00,
    stopLoss: 24450.00,
    target1: 24510.00,
    target2: 24540.00,
    strength: 68,
    status: 'hit_stop',
    timestamp: Date.now() - 900000, // 15 minutes ago
    optionStrike: 24500,
    riskReward: '1:2',
    pnl: -1.2,
    receivedAt: new Date(Date.now() - 900000).toISOString(),
    exitPrice: 24450.00,
    exitTime: new Date(Date.now() - 600000).toISOString(),
    conditions: {
      trendFilter: true,
      momentumTrigger: 'RSI',
      volatilityStructure: false,
      signalValidation: true
    }
  }
];

const initialState = {
  signals: sampleSignals,
  activeSignals: sampleSignals.filter(s => s.status === 'active'),
  signalHistory: sampleSignals,
  filters: {
    symbols: ['NIFTY', 'BANKNIFTY'],
    timeframes: ['1m', '5m', '15m'],
    minStrength: 60
  },
  notifications: {
    enabled: true,
    sound: true,
    desktop: true
  }
};

function signalReducer(state, action) {
  switch (action.type) {
    case 'ADD_SIGNAL':
      const newSignal = {
        ...action.payload.signal,
        receivedAt: new Date().toISOString(),
        status: 'active'
      };
      
      return {
        ...state,
        signals: [newSignal, ...state.signals].slice(0, 100), // Keep last 100 signals
        activeSignals: [newSignal, ...state.activeSignals],
        signalHistory: [newSignal, ...state.signalHistory]
      };

    case 'UPDATE_SIGNAL_STATUS':
      const { signalId, status, exitPrice, pnl } = action.payload;
      
      return {
        ...state,
        signals: state.signals.map(signal =>
          signal.id === signalId
            ? { ...signal, status, exitPrice, pnl, exitTime: new Date().toISOString() }
            : signal
        ),
        activeSignals: status === 'active'
          ? state.activeSignals
          : state.activeSignals.filter(signal => signal.id !== signalId)
      };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };

    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: { ...state.notifications, ...action.payload }
      };

    case 'CLEAR_SIGNALS':
      return {
        ...state,
        signals: [],
        activeSignals: []
      };

    default:
      return state;
  }
}

export const useSignals = () => {
  const context = useContext(SignalContext);
  if (!context) {
    throw new Error('useSignals must be used within a SignalProvider');
  }
  return context;
};

export const SignalProvider = ({ children }) => {
  const [state, dispatch] = useReducer(signalReducer, initialState);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for new signals
    socket.on('newSignal', (signalData) => {
      const { symbol, timeframe, signal } = signalData;
      
      // Apply filters
      if (!state.filters.symbols.includes(symbol)) return;
      if (!state.filters.timeframes.includes(timeframe)) return;
      if (signal.strength < state.filters.minStrength) return;

      dispatch({ type: 'ADD_SIGNAL', payload: signalData });

      // Show notifications if enabled
      if (state.notifications.enabled) {
        showSignalNotification(signal, symbol, timeframe);
      }

      // Play sound if enabled
      if (state.notifications.sound) {
        playSignalSound();
      }
    });

    return () => {
      socket.off('newSignal');
    };
  }, [socket, state.filters, state.notifications]);

  const showSignalNotification = (signal, symbol, timeframe) => {
    if (!state.notifications.desktop || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification(`${symbol} ${timeframe} Signal`, {
        body: `${signal.type} signal at ₹${signal.entryPrice} (${signal.strength}% strength)`,
        icon: '/favicon.ico',
        tag: signal.id
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showSignalNotification(signal, symbol, timeframe);
        }
      });
    }
  };

  const playSignalSound = () => {
    try {
      const audio = new Audio('/signal-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Could not play sound:', e));
    } catch (error) {
      console.log('Audio not available:', error);
    }
  };

  const updateSignalStatus = (signalId, status, exitPrice = null, pnl = null) => {
    dispatch({
      type: 'UPDATE_SIGNAL_STATUS',
      payload: { signalId, status, exitPrice, pnl }
    });
  };

  const setFilters = (filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const setNotifications = (notifications) => {
    dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
  };

  const clearSignals = () => {
    dispatch({ type: 'CLEAR_SIGNALS' });
  };

  const getSignalStats = () => {
    const totalSignals = state.signalHistory.length;
    const completedSignals = state.signalHistory.filter(s => s.status !== 'active');
    const profitableSignals = completedSignals.filter(s => s.pnl > 0);
    
    return {
      total: totalSignals,
      active: state.activeSignals.length,
      completed: completedSignals.length,
      profitable: profitableSignals.length,
      winRate: completedSignals.length > 0 ? (profitableSignals.length / completedSignals.length * 100).toFixed(1) : 0,
      totalPnL: completedSignals.reduce((sum, s) => sum + (s.pnl || 0), 0)
    };
  };

  const value = {
    ...state,
    updateSignalStatus,
    setFilters,
    setNotifications,
    clearSignals,
    getSignalStats
  };

  return (
    <SignalContext.Provider value={value}>
      {children}
    </SignalContext.Provider>
  );
};
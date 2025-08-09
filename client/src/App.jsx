import React, { useState, useEffect } from 'react';
import TradingDashboard from './components/TradingDashboard';

// Mock contexts for now to avoid dependency issues
const MockSocketProvider = ({ children }) => children;
const MockMarketDataProvider = ({ children }) => children;
const MockSignalProvider = ({ children }) => children;

function App() {
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    console.log('NSE Trading App starting...');
    
    // Simulate initialization
    setTimeout(() => {
      setLoading(false);
      // Try to connect to backend
      checkBackendConnection();
    }, 1000);
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        setConnectionStatus('connected');
        console.log('Backend connected successfully');
      } else {
        setConnectionStatus('error');
        console.log('Backend connection failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      console.log('Backend not available, running in demo mode');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">NSE Scalping Signals</h2>
          <p className="text-gray-600">Initializing trading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <MockSocketProvider>
      <MockMarketDataProvider>
        <MockSignalProvider>
          <TradingDashboard connectionStatus={connectionStatus} />
        </MockSignalProvider>
      </MockMarketDataProvider>
    </MockSocketProvider>
  );
}

export default App;
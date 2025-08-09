import React, { useState, useEffect } from 'react';
import TradingDashboard from './components/TradingDashboard';
import AdvancedTradingDashboard from './components/AdvancedTradingDashboard';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { BarChart3, Zap, Settings } from 'lucide-react';

// Mock contexts for now to avoid dependency issues
const MockSocketProvider = ({ children }) => children;
const MockMarketDataProvider = ({ children }) => children;
const MockSignalProvider = ({ children }) => children;

function App() {
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [dashboardMode, setDashboardMode] = useState('standard'); // 'standard' or 'advanced'

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

  const DashboardToggle = () => (
    <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 bg-white rounded-lg p-2 shadow-lg border">
      <Button
        variant={dashboardMode === 'standard' ? "default" : "ghost"}
        size="sm"
        onClick={() => setDashboardMode('standard')}
        className="flex items-center space-x-1"
      >
        <BarChart3 className="h-4 w-4" />
        <span>Standard</span>
      </Button>
      <Button
        variant={dashboardMode === 'advanced' ? "default" : "ghost"}
        size="sm"
        onClick={() => setDashboardMode('advanced')}
        className="flex items-center space-x-1"
      >
        <Zap className="h-4 w-4" />
        <span>Advanced</span>
      </Button>
      {dashboardMode === 'advanced' && (
        <Badge className="bg-emerald-500 text-white text-xs">
          <Settings className="h-3 w-3 mr-1" />
          Pro
        </Badge>
      )}
    </div>
  );

  return (
    <MockSocketProvider>
      <MockMarketDataProvider>
        <MockSignalProvider>
          <DashboardToggle />
          {dashboardMode === 'standard' ? (
            <TradingDashboard connectionStatus={connectionStatus} />
          ) : (
            <AdvancedTradingDashboard connectionStatus={connectionStatus} />
          )}
        </MockSignalProvider>
      </MockMarketDataProvider>
    </MockSocketProvider>
  );
}

export default App;
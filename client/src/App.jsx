import React, { useState, useEffect, Suspense } from 'react';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { BarChart3, Zap, Settings } from 'lucide-react';
import io from 'socket.io-client';

// Import real contexts
import { SocketProvider } from './contexts/SocketContext';
import { MarketDataProvider } from './contexts/MarketDataContext';
import { SignalProvider } from './contexts/SignalContext';

// Lazy load components to avoid initial loading issues
const TradingDashboard = React.lazy(() => import('./components/TradingDashboard'));
const AdvancedTradingDashboard = React.lazy(() => import('./components/AdvancedTradingDashboard'));
const OptimizedTradingDashboard = React.lazy(() => import('./components/OptimizedTradingDashboard'));
const GridDashboard = React.lazy(() => import('./components/GridDashboard'));

// Loading component
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">NSE Scalping Signals</h2>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-4 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
            <h2 className="text-2xl font-bold text-red-800 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Reload App
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [dashboardMode, setDashboardMode] = useState('grid'); // 'standard', 'advanced', 'optimized', or 'grid'
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    console.log('NSE Trading App starting...');
    
    // Initialize socket connection
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.log('❌ Socket connection error:', error.message);
      setConnectionStatus('error');
    });

    setSocket(newSocket);
    
    // Simulate initialization
    setTimeout(() => {
      setLoading(false);
      // Try to connect to backend
      checkBackendConnection();
    }, 1000);

    // Set up periodic connection check (every 30 seconds)
    const connectionCheckInterval = setInterval(() => {
      if (connectionStatus === 'error') {
        console.log('🔄 Retrying backend connection...');
        checkBackendConnection();
      }
    }, 30000);

    return () => {
      clearInterval(connectionCheckInterval);
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const checkBackendConnection = async () => {
    setConnectionStatus('connecting');
    
    try {
      console.log('🔍 Checking backend connection...');
      
      // Check main health endpoint
      const healthController = new AbortController();
      const healthTimeoutId = setTimeout(() => healthController.abort(), 5000);
      
      const healthResponse = await fetch('/api/health', { 
        signal: healthController.signal 
      });
      clearTimeout(healthTimeoutId);
      
      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status}`);
      }
      
      // Check data API endpoints
      const statusController = new AbortController();
      const statusTimeoutId = setTimeout(() => statusController.abort(), 5000);
      
      const statusResponse = await fetch('/api/data/status', { 
        signal: statusController.signal 
      });
      clearTimeout(statusTimeoutId);
      if (!statusResponse.ok) {
        console.warn('⚠️ Data API not available, but main server is running');
      }
      
      setConnectionStatus('connected');
      console.log('✅ Backend connected successfully');
      
    } catch (error) {
      setConnectionStatus('error');
      console.log('❌ Backend not available, running in demo mode:', error.message);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Initializing trading dashboard..." />;
  }

  const DashboardToggle = () => (
    <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-white rounded-lg p-3 shadow-xl border border-gray-200 backdrop-blur-sm">
      <Button
        variant={dashboardMode === 'grid' ? "default" : "ghost"}
        size="sm"
        onClick={() => setDashboardMode('grid')}
        className="flex items-center space-x-1 text-sm"
      >
        <BarChart3 className="h-4 w-4" />
        <span>Grid</span>
      </Button>
      <Button
        variant={dashboardMode === 'optimized' ? "default" : "ghost"}
        size="sm"
        onClick={() => setDashboardMode('optimized')}
        className="flex items-center space-x-1 text-sm"
      >
        <Zap className="h-4 w-4" />
        <span>Optimized</span>
      </Button>
      <Button
        variant={dashboardMode === 'standard' ? "default" : "ghost"}
        size="sm"
        onClick={() => setDashboardMode('standard')}
        className="flex items-center space-x-1 text-sm"
      >
        <BarChart3 className="h-4 w-4" />
        <span>Standard</span>
      </Button>
      <Button
        variant={dashboardMode === 'advanced' ? "default" : "ghost"}
        size="sm"
        onClick={() => setDashboardMode('advanced')}
        className="flex items-center space-x-1 text-sm"
      >
        <Settings className="h-4 w-4" />
        <span>Advanced</span>
      </Button>
      {dashboardMode === 'grid' && (
        <Badge className="bg-indigo-500 text-white text-xs animate-pulse">
          <BarChart3 className="h-3 w-3 mr-1" />
          AG Grid
        </Badge>
      )}
    </div>
  );

  return (
    <ErrorBoundary>
      <SocketProvider socket={socket}>
        <MarketDataProvider>
          <SignalProvider>
            <DashboardToggle />
            <Suspense fallback={<LoadingSpinner message={`Loading ${dashboardMode} dashboard...`} />}>
              {dashboardMode === 'grid' ? (
                <GridDashboard connectionStatus={connectionStatus} />
              ) : dashboardMode === 'optimized' ? (
                <OptimizedTradingDashboard connectionStatus={connectionStatus} />
              ) : dashboardMode === 'standard' ? (
                <TradingDashboard connectionStatus={connectionStatus} />
              ) : (
                <AdvancedTradingDashboard connectionStatus={connectionStatus} />
              )}
            </Suspense>
          </SignalProvider>
        </MarketDataProvider>
      </SocketProvider>
    </ErrorBoundary>
  );
}

export default App;

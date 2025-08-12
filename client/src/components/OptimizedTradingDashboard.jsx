import React, { PureComponent } from 'react';
import { SocketContext } from '../contexts/SocketContext';
import { MarketDataContext } from '../contexts/MarketDataContext';
import { SignalContext } from '../contexts/SignalContext';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import SignalGrid from './signals/SignalGrid';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Activity, TrendingUp, AlertTriangle, Clock } from 'lucide-react';

class OptimizedTradingDashboard extends PureComponent {
  static contextType = SocketContext;

  constructor(props) {
    super(props);
    this.state = {
      signals: [],
      marketData: {},
      stats: {
        totalSignals: 0,
        activeSignals: 0,
        successRate: 0,
        totalPnL: 0
      },
      loading: true,
      lastUpdate: null,
      selectedSymbol: 'ALL',
      timeframe: '1m'
    };

    // Bind methods for performance
    this.handleSignalUpdate = this.handleSignalUpdate.bind(this);
    this.handleMarketDataUpdate = this.handleMarketDataUpdate.bind(this);
    this.handleSymbolFilter = this.handleSymbolFilter.bind(this);
    this.handleTimeframeChange = this.handleTimeframeChange.bind(this);
  }

  componentDidMount() {
    this.initializeConnections();
    this.startDataPolling();
  }

  componentWillUnmount() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    if (this.context?.socket) {
      this.context.socket.off('signal');
      this.context.socket.off('marketData');
      this.context.socket.off('signalUpdate');
    }
  }

  initializeConnections() {
    const { socket } = this.context;
    
    if (socket) {
      // Listen for new signals
      socket.on('signal', this.handleSignalUpdate);
      socket.on('marketData', this.handleMarketDataUpdate);
      socket.on('signalUpdate', this.handleSignalUpdate);
      
      // Request initial data
      socket.emit('requestSignals');
      socket.emit('requestMarketData');
      
      console.log('✅ Dashboard connected to WebSocket');
    }
  }

  startDataPolling() {
    // Poll for updates every second for high-frequency data
    this.pollingInterval = setInterval(() => {
      if (this.context?.socket?.connected) {
        this.context.socket.emit('requestSignals');
        this.context.socket.emit('requestMarketData');
      }
    }, 1000);

    // Set loading to false after initial load
    setTimeout(() => {
      this.setState({ loading: false });
    }, 2000);
  }

  handleSignalUpdate(newSignal) {
    this.setState(prevState => {
      let updatedSignals;
      
      if (Array.isArray(newSignal)) {
        // Bulk update
        updatedSignals = newSignal;
      } else {
        // Single signal update
        const existingIndex = prevState.signals.findIndex(s => s.id === newSignal.id);
        if (existingIndex >= 0) {
          updatedSignals = [...prevState.signals];
          updatedSignals[existingIndex] = newSignal;
        } else {
          updatedSignals = [newSignal, ...prevState.signals].slice(0, 1000); // Keep last 1000 signals
        }
      }

      // Calculate stats
      const stats = this.calculateStats(updatedSignals);

      return {
        signals: updatedSignals,
        stats,
        lastUpdate: new Date()
      };
    });
  }

  handleMarketDataUpdate(marketData) {
    this.setState(prevState => ({
      marketData: {
        ...prevState.marketData,
        ...marketData
      }
    }));
  }

  handleSymbolFilter(symbol) {
    this.setState({ selectedSymbol: symbol });
  }

  handleTimeframeChange(timeframe) {
    this.setState({ timeframe });
  }

  calculateStats(signals) {
    const totalSignals = signals.length;
    const activeSignals = signals.filter(s => s.status === 'active').length;
    const completedSignals = signals.filter(s => ['hit_target', 'hit_stop'].includes(s.status));
    const successfulSignals = signals.filter(s => s.status === 'hit_target').length;
    const successRate = completedSignals.length > 0 ? (successfulSignals / completedSignals.length) * 100 : 0;
    const totalPnL = signals.reduce((sum, signal) => sum + (signal.pnl || 0), 0);

    return {
      totalSignals,
      activeSignals,
      successRate: Math.round(successRate * 100) / 100,
      totalPnL: Math.round(totalPnL * 100) / 100
    };
  }

  getFilteredSignals() {
    const { signals, selectedSymbol, timeframe } = this.state;
    
    return signals.filter(signal => {
      const symbolMatch = selectedSymbol === 'ALL' || signal.symbol === selectedSymbol;
      const timeframeMatch = signal.timeframe === timeframe;
      return symbolMatch && timeframeMatch;
    });
  }

  render() {
    const { connectionStatus } = this.props;
    const { stats, loading, lastUpdate, selectedSymbol, timeframe } = this.state;
    const filteredSignals = this.getFilteredSignals();

    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          connectionStatus={connectionStatus}
          stats={stats}
          lastUpdate={lastUpdate}
        />
        
        <div className="flex">
          <Sidebar 
            selectedSymbol={selectedSymbol}
            timeframe={timeframe}
            onSymbolChange={this.handleSymbolFilter}
            onTimeframeChange={this.handleTimeframeChange}
            marketData={this.state.marketData}
          />
          
          <main className="flex-1 p-6 ml-64">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Signals</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSignals}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Signals</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.activeSignals}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total P&L</p>
                    <p className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnL}%
                    </p>
                  </div>
                  <AlertTriangle className={`h-8 w-8 ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </Card>
            </div>

            {/* Filter Info */}
            <div className="flex items-center space-x-4 mb-4">
              <Badge variant="outline" className="text-sm">
                Symbol: {selectedSymbol}
              </Badge>
              <Badge variant="outline" className="text-sm">
                Timeframe: {timeframe}
              </Badge>
              <Badge variant="outline" className="text-sm">
                Showing: {filteredSignals.length} signals
              </Badge>
            </div>

            {/* Main Signal Grid */}
            <Card className="p-0 h-[calc(100vh-400px)]">
              <SignalGrid
                signals={filteredSignals}
                onSignalUpdate={this.handleSignalUpdate}
                loading={loading}
                autoSizeColumns={true}
              />
            </Card>
          </main>
        </div>
      </div>
    );
  }
}

// HOC to provide contexts to class component
const withContexts = (Component) => {
  return React.forwardRef((props, ref) => (
    <SocketContext.Consumer>
      {socketContext => (
        <MarketDataContext.Consumer>
          {marketDataContext => (
            <SignalContext.Consumer>
              {signalContext => (
                <Component
                  {...props}
                  ref={ref}
                  socketContext={socketContext}
                  marketDataContext={marketDataContext}
                  signalContext={signalContext}
                />
              )}
            </SignalContext.Consumer>
          )}
        </MarketDataContext.Consumer>
      )}
    </SocketContext.Consumer>
  ));
};

export default withContexts(OptimizedTradingDashboard);
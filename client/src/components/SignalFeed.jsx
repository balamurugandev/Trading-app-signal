import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  Zap,
  Database,
  Eye,
  DollarSign,
  Percent
} from 'lucide-react';

import { useSignals } from '@/contexts/SignalContext';
import { formatPrice, formatTime, formatNumber } from '@/lib/utils';

const DetailedSignalCard = ({ signal, onStatusUpdate, index, isDemoMode }) => {
  const [localStatus, setLocalStatus] = useState(signal.status);
  const [showDetails, setShowDetails] = useState(false);

  const handleStatusChange = (newStatus) => {
    setLocalStatus(newStatus);
    onStatusUpdate(signal.id, newStatus);
  };

  const getStatusIcon = () => {
    switch (localStatus) {
      case 'active':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'hit_target':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'hit_stop':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStrengthColor = (strength) => {
    if (strength >= 80) return 'bg-green-500 text-white';
    if (strength >= 60) return 'bg-blue-500 text-white';
    return 'bg-yellow-500 text-white';
  };

  const getSignalTypeColor = () => {
    return signal.type === 'BUY' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  return (
    <Card className={`mb-4 transition-all duration-300 hover:shadow-lg ${getSignalTypeColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-bold">
              #{index + 1}
            </div>
            <div className="flex items-center space-x-2">
              {signal.type === 'BUY' ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              <span className="font-bold text-lg">{signal.symbol}</span>
              <Badge variant="outline" className="text-xs font-medium">
                {signal.timeframe}
              </Badge>
              {isDemoMode && (
                <Badge className="text-xs bg-blue-100 text-blue-800">
                  <Database className="h-3 w-3 mr-1" />
                  DEMO
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={`text-xs font-bold ${getStrengthColor(signal.strength)}`}>
              {signal.strength}%
            </Badge>
            {getStatusIcon()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Key Signal Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center space-x-2 mb-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Entry Price</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatPrice(signal.entryPrice)}</p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center space-x-2 mb-1">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Strike Price</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {signal.optionStrike} {signal.optionType}
              </p>
            </div>
          </div>

          {/* Risk Management */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2 mb-1">
                <Shield className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">Stop Loss</span>
              </div>
              <p className="text-lg font-bold text-red-800">{formatPrice(signal.stopLoss)}</p>
              <p className="text-xs text-red-600">
                Risk: {formatNumber(((signal.entryPrice - signal.stopLoss) / signal.entryPrice) * 100, 1)}%
              </p>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-1">
                <Target className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Target 1</span>
              </div>
              <p className="text-lg font-bold text-green-800">{formatPrice(signal.target1)}</p>
              <p className="text-xs text-green-600">
                Reward: {formatNumber(((signal.target1 - signal.entryPrice) / signal.entryPrice) * 100, 1)}%
              </p>
            </div>
          </div>

          {/* Signal Conditions */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <BarChart3 className="h-4 w-4 mr-1" />
              Signal Conditions
            </h4>
            <div className="flex flex-wrap gap-2">
              {signal.conditions.trendFilter && (
                <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
                  ✓ Trend Filter
                </Badge>
              )}
              {signal.conditions.momentumTrigger !== 'NONE' && (
                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                  ✓ {signal.conditions.momentumTrigger}
                </Badge>
              )}
              {signal.conditions.volatilityStructure && (
                <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-300">
                  ✓ Structure
                </Badge>
              )}
              {signal.conditions.signalValidation && (
                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-300">
                  ✓ Validation
                </Badge>
              )}
            </div>
          </div>

          {/* Detailed View Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
          </Button>

          {/* Detailed Information */}
          {showDetails && (
            <div className="space-y-3 border-t pt-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Target 2</p>
                  <p className="font-bold">{formatPrice(signal.target2)}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Risk:Reward</p>
                  <p className="font-bold">{signal.riskReward}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">VWAP</p>
                  <p className="font-bold">{formatPrice(signal.vwap)}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">EMA 9</p>
                  <p className="font-bold">{formatPrice(signal.ema9)}</p>
                </div>
              </div>

              {/* Trading Instructions */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h5 className="text-sm font-medium text-blue-800 mb-2">Trading Instructions:</h5>
                <ul className="text-xs text-blue-700 space-y-1">
                  {signal.instructions?.map((instruction, idx) => (
                    <li key={idx} className="flex items-start space-x-1">
                      <span className="text-blue-500">•</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trailing Stop */}
              {signal.trailingStop && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <h5 className="text-sm font-medium text-yellow-800 mb-1">Trailing Stop:</h5>
                  <p className="text-xs text-yellow-700">
                    Method: {signal.trailingStop.method} | Current: {formatPrice(signal.trailingStop.currentLevel)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-500 border-t pt-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Signal Time:</span>
                <br />
                {formatTime(signal.timestamp)}
              </div>
              {signal.receivedAt && (
                <div>
                  <span className="font-medium">Received:</span>
                  <br />
                  {formatTime(signal.receivedAt)}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons for Active Signals */}
          {localStatus === 'active' && (
            <div className="flex space-x-2 pt-3 border-t">
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleStatusChange('hit_target')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Hit Target
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => handleStatusChange('hit_stop')}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Hit Stop
              </Button>
            </div>
          )}

          {/* Status for Completed Signals */}
          {localStatus !== 'active' && (
            <div className={`p-3 rounded-lg text-center font-medium ${
              localStatus === 'hit_target' ? 'bg-green-100 text-green-800' :
              localStatus === 'hit_stop' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {localStatus === 'hit_target' ? '✓ Target Hit' :
               localStatus === 'hit_stop' ? '✗ Stop Loss Hit' :
               '⚠ Signal Expired'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const SignalFeed = ({ signals, activeSignals, isLive, isDemoMode }) => {
  const { updateSignalStatus, clearSignals, getSignalStats } = useSignals();
  const [filter, setFilter] = useState('all');

  const stats = getSignalStats();

  const filteredSignals = signals.filter(signal => {
    switch (filter) {
      case 'active':
        return signal.status === 'active';
      case 'completed':
        return signal.status !== 'active';
      case 'profitable':
        return signal.pnl > 0;
      default:
        return true;
    }
  });

  const handleStatusUpdate = (signalId, status) => {
    updateSignalStatus(signalId, status);
  };

  return (
    <Card className="h-full shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Signal Feed</span>
            </CardTitle>
            <CardDescription className="flex items-center space-x-2 mt-1">
              {isDemoMode ? (
                <>
                  <Database className="h-4 w-4 text-blue-600" />
                  <span>Demo signals • {stats.active} active</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 text-green-600" />
                  <span>{isLive ? 'Live signals' : 'Paused'} • {stats.active} active</span>
                </>
              )}
            </CardDescription>
          </div>
          
          {signals.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearSignals}
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={filter} onValueChange={setFilter} className="mb-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">Done</TabsTrigger>
            <TabsTrigger value="profitable" className="text-xs">Profit</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Enhanced Signal Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <Percent className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-green-700 font-medium">Win Rate</p>
                <p className="text-lg font-bold text-green-800">{stats.winRate}%</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-blue-700 font-medium">Total P&L</p>
                <p className={`text-lg font-bold ${stats.totalPnL >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {formatPrice(stats.totalPnL)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Signals List */}
        <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
          {filteredSignals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No signals yet</p>
              <p className="text-sm">
                {isDemoMode 
                  ? 'Demo signals will appear here when conditions are met'
                  : isLive 
                    ? 'Waiting for market conditions...' 
                    : 'Feed is paused'
                }
              </p>
            </div>
          ) : (
            filteredSignals.map((signal, index) => (
              <DetailedSignalCard
                key={signal.id}
                signal={signal}
                index={index}
                onStatusUpdate={handleStatusUpdate}
                isDemoMode={isDemoMode}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SignalFeed;
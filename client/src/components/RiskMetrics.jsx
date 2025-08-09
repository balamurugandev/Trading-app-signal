import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Clock,
  Activity,
  Target
} from 'lucide-react';

import { formatNumber } from '@/lib/utils';

const RiskMetrics = ({ symbol, timeframe }) => {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching risk metrics
    const fetchRiskMetrics = async () => {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock risk data
      setRiskData({
        dailySignalCount: 8,
        hourlySignalCount: 2,
        maxDailySignals: 50,
        maxHourlySignals: 10,
        avgSignalStrength: 72.5,
        isLiquidWindow: true,
        canGenerateSignal: true,
        riskScore: 'LOW',
        volatility: 2.3,
        marketSentiment: 'BULLISH',
        liquidityScore: 85
      });
      
      setLoading(false);
    };

    fetchRiskMetrics();
  }, [symbol, timeframe]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Risk Management</CardTitle>
          <CardDescription>Loading risk metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRiskScoreColor = (score) => {
    switch (score) {
      case 'LOW':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'HIGH':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'BULLISH':
        return 'text-green-600';
      case 'BEARISH':
        return 'text-red-600';
      case 'NEUTRAL':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Risk Management
        </CardTitle>
        <CardDescription>
          Real-time risk assessment for {symbol} {timeframe}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Risk Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className={`p-4 border ${getRiskScoreColor(riskData.riskScore)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Risk Score</p>
                <p className="text-lg font-bold">{riskData.riskScore}</p>
              </div>
              <Shield className="h-6 w-6" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Volatility</p>
                <p className="text-lg font-bold">{formatNumber(riskData.volatility, 1)}%</p>
              </div>
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sentiment</p>
                <p className={`text-lg font-bold ${getSentimentColor(riskData.marketSentiment)}`}>
                  {riskData.marketSentiment}
                </p>
              </div>
              <TrendingUp className="h-6 w-6" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Liquidity</p>
                <p className="text-lg font-bold text-green-600">{riskData.liquidityScore}</p>
              </div>
              <Target className="h-6 w-6 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Signal Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4">
            <h4 className="font-semibold mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Signal Limits
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Daily Signals</span>
                  <span className="text-sm font-medium">
                    {riskData.dailySignalCount} / {riskData.maxDailySignals}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(riskData.dailySignalCount / riskData.maxDailySignals) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Hourly Signals</span>
                  <span className="text-sm font-medium">
                    {riskData.hourlySignalCount} / {riskData.maxHourlySignals}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(riskData.hourlySignalCount / riskData.maxHourlySignals) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold mb-3 flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Signal Quality
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Strength:</span>
                <span className="font-medium">{formatNumber(riskData.avgSignalStrength, 1)}%</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Liquid Window:</span>
                <Badge variant={riskData.isLiquidWindow ? "default" : "secondary"}>
                  {riskData.isLiquidWindow ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Signal Generation:</span>
                <Badge variant={riskData.canGenerateSignal ? "default" : "destructive"}>
                  {riskData.canGenerateSignal ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Risk Warnings */}
        <div className="mt-6">
          <h4 className="font-semibold mb-3 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
            Risk Warnings
          </h4>
          
          <div className="space-y-2">
            {riskData.dailySignalCount > riskData.maxDailySignals * 0.8 && (
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  Approaching daily signal limit ({riskData.dailySignalCount}/{riskData.maxDailySignals})
                </span>
              </div>
            )}
            
            {riskData.volatility > 3.0 && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-sm text-red-800">
                  High market volatility detected ({formatNumber(riskData.volatility, 1)}%)
                </span>
              </div>
            )}
            
            {!riskData.isLiquidWindow && (
              <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm text-blue-800">
                  Outside liquid trading window - signals may be less reliable
                </span>
              </div>
            )}
            
            {riskData.liquidityScore < 70 && (
              <div className="flex items-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
                <span className="text-sm text-orange-800">
                  Low liquidity detected - exercise caution with position sizes
                </span>
              </div>
            )}
          </div>
          
          {/* No warnings */}
          {riskData.dailySignalCount <= riskData.maxDailySignals * 0.8 && 
           riskData.volatility <= 3.0 && 
           riskData.isLiquidWindow && 
           riskData.liquidityScore >= 70 && (
            <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <Shield className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-sm text-green-800">
                All risk parameters are within acceptable limits
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskMetrics;
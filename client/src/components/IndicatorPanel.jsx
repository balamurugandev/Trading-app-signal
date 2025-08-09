import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3,
  Target,
  AlertTriangle
} from 'lucide-react';

import { formatPrice, formatNumber } from '@/lib/utils';

const IndicatorCard = ({ title, value, status, icon: Icon, description }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'bullish':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'bearish':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'neutral':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className={`${getStatusColor()} border`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4" />
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-lg font-bold">{value}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        </div>
        {description && (
          <p className="text-xs mt-2 opacity-75">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

const IndicatorPanel = ({ symbol, timeframe, indicators }) => {
  if (!indicators) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Technical Indicators</CardTitle>
          <CardDescription>Loading indicators...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate indicator statuses
  const getVWAPStatus = () => {
    if (!indicators.vwap) return 'neutral';
    // This would be compared with current price in real implementation
    return 'bullish'; // Placeholder
  };

  const getEMAStatus = () => {
    if (!indicators.ema9 || !indicators.ema21) return 'neutral';
    const ema9 = indicators.ema9;
    const ema21 = indicators.ema21;
    return ema9 > ema21 ? 'bullish' : 'bearish';
  };

  const getRSIStatus = () => {
    if (!indicators.rsi) return 'neutral';
    const rsi = indicators.rsi;
    if (rsi > 70) return 'bearish'; // Overbought
    if (rsi < 30) return 'bullish'; // Oversold
    if (rsi >= 50 && rsi <= 60) return 'bullish'; // Ideal buy zone
    return 'neutral';
  };

  const getMACDStatus = () => {
    if (!indicators.macd) return 'neutral';
    const macd = indicators.macd;
    if (macd.MACD > macd.signal && macd.histogram > 0) return 'bullish';
    if (macd.MACD < macd.signal && macd.histogram < 0) return 'bearish';
    return 'neutral';
  };

  const getBBStatus = () => {
    if (!indicators.bb) return 'neutral';
    const bb = indicators.bb;
    const width = (bb.upper - bb.lower) / bb.middle;
    if (width > 0.04) return 'bullish'; // Expanding
    if (width < 0.02) return 'bearish'; // Contracting
    return 'neutral';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Technical Indicators</CardTitle>
        <CardDescription>
          Real-time analysis for {symbol} {timeframe}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* VWAP */}
          <IndicatorCard
            title="VWAP"
            value={indicators.vwap ? formatPrice(indicators.vwap) : '--'}
            status={getVWAPStatus()}
            icon={Activity}
            description="Volume Weighted Average Price"
          />

          {/* EMA 9 */}
          <IndicatorCard
            title="EMA 9"
            value={indicators.ema9 ? formatPrice(indicators.ema9) : '--'}
            status={getEMAStatus()}
            icon={TrendingUp}
            description="9-period Exponential Moving Average"
          />

          {/* EMA 21 */}
          <IndicatorCard
            title="EMA 21"
            value={indicators.ema21 ? formatPrice(indicators.ema21) : '--'}
            status={getEMAStatus()}
            icon={TrendingUp}
            description="21-period Exponential Moving Average"
          />

          {/* RSI */}
          <IndicatorCard
            title="RSI (14)"
            value={indicators.rsi ? formatNumber(indicators.rsi, 1) : '--'}
            status={getRSIStatus()}
            icon={BarChart3}
            description="Relative Strength Index"
          />

          {/* MACD */}
          <IndicatorCard
            title="MACD"
            value={indicators.macd ? formatNumber(indicators.macd.MACD, 2) : '--'}
            status={getMACDStatus()}
            icon={Activity}
            description="Moving Average Convergence Divergence"
          />
        </div>

        {/* Detailed Indicator Information */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MACD Details */}
          {indicators.macd && (
            <Card className="p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                MACD Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>MACD Line:</span>
                  <span className="font-mono">{formatNumber(indicators.macd.MACD, 3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Signal Line:</span>
                  <span className="font-mono">{formatNumber(indicators.macd.signal, 3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Histogram:</span>
                  <span className={`font-mono ${indicators.macd.histogram >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNumber(indicators.macd.histogram, 3)}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Bollinger Bands Details */}
          {indicators.bb && (
            <Card className="p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Bollinger Bands
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Upper Band:</span>
                  <span className="font-mono">{formatPrice(indicators.bb.upper)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Middle Band:</span>
                  <span className="font-mono">{formatPrice(indicators.bb.middle)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lower Band:</span>
                  <span className="font-mono">{formatPrice(indicators.bb.lower)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Width:</span>
                  <span className="font-mono">
                    {formatNumber(((indicators.bb.upper - indicators.bb.lower) / indicators.bb.middle) * 100, 2)}%
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* CPR Levels */}
        {indicators.cpr && (
          <Card className="p-4 mt-4">
            <h4 className="font-semibold mb-3 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              CPR & Pivot Levels
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-gray-600">Resistance</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>R3:</span>
                    <span className="font-mono text-red-600">{formatPrice(indicators.cpr.r3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>R2:</span>
                    <span className="font-mono text-red-600">{formatPrice(indicators.cpr.r2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>R1:</span>
                    <span className="font-mono text-red-600">{formatPrice(indicators.cpr.r1)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-gray-600">CPR</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>TC:</span>
                    <span className="font-mono text-blue-600">{formatPrice(indicators.cpr.tc)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pivot:</span>
                    <span className="font-mono text-blue-600 font-semibold">{formatPrice(indicators.cpr.pivot)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BC:</span>
                    <span className="font-mono text-blue-600">{formatPrice(indicators.cpr.bc)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-gray-600">Support</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>S1:</span>
                    <span className="font-mono text-green-600">{formatPrice(indicators.cpr.s1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>S2:</span>
                    <span className="font-mono text-green-600">{formatPrice(indicators.cpr.s2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>S3:</span>
                    <span className="font-mono text-green-600">{formatPrice(indicators.cpr.s3)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default IndicatorPanel;
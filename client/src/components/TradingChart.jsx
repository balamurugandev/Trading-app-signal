import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity,
  Maximize2
} from 'lucide-react';

import { useMarketData } from '@/contexts/MarketDataContext';
import { formatPrice, formatTime } from '@/lib/utils';

const TradingChart = ({ symbol, timeframe, data, isLive }) => {
  const chartContainerRef = useRef();
  const chart = useRef();
  const candlestickSeries = useRef();
  const volumeSeries = useRef();
  const vwapSeries = useRef();
  const ema9Series = useRef();
  const ema21Series = useRef();
  
  const [chartData, setChartData] = useState([]);
  const [showIndicators, setShowIndicators] = useState({
    vwap: true,
    ema9: true,
    ema21: true,
    volume: true
  });

  const { fetchHistoricalData } = useMarketData();

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    chart.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'white' },
        textColor: '#333',
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#cccccc',
      },
      timeScale: {
        borderColor: '#cccccc',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Add candlestick series
    candlestickSeries.current = chart.current.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Add volume series
    volumeSeries.current = chart.current.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    });

    chart.current.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Add VWAP line
    vwapSeries.current = chart.current.addLineSeries({
      color: '#2196F3',
      lineWidth: 2,
      title: 'VWAP',
    });

    // Add EMA lines
    ema9Series.current = chart.current.addLineSeries({
      color: '#FF9800',
      lineWidth: 1,
      title: 'EMA 9',
    });

    ema21Series.current = chart.current.addLineSeries({
      color: '#9C27B0',
      lineWidth: 1,
      title: 'EMA 21',
    });

    // Handle resize
    const handleResize = () => {
      if (chart.current && chartContainerRef.current) {
        chart.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart.current) {
        chart.current.remove();
      }
    };
  }, []);

  // Load historical data
  useEffect(() => {
    const loadHistoricalData = async () => {
      try {
        const historicalData = await fetchHistoricalData(symbol, timeframe, 5);
        if (historicalData && historicalData.data) {
          setChartData(historicalData.data);
          updateChart(historicalData.data, historicalData.indicators);
        }
      } catch (error) {
        console.error('Error loading historical data:', error);
      }
    };

    loadHistoricalData();
  }, [symbol, timeframe]);

  // Update chart with new data
  const updateChart = (marketData, indicators) => {
    if (!candlestickSeries.current || !marketData) return;

    // Prepare candlestick data
    const candleData = marketData.map(candle => ({
      time: new Date(candle.timestamp).getTime() / 1000,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    // Prepare volume data
    const volumeData = marketData.map(candle => ({
      time: new Date(candle.timestamp).getTime() / 1000,
      value: candle.volume,
      color: candle.close >= candle.open ? '#26a69a40' : '#ef535040',
    }));

    // Update series
    candlestickSeries.current.setData(candleData);
    volumeSeries.current.setData(volumeData);

    // Update indicators if available
    if (indicators) {
      if (indicators.vwap && showIndicators.vwap) {
        const vwapData = indicators.vwap.map((value, index) => ({
          time: new Date(marketData[index].timestamp).getTime() / 1000,
          value: value,
        }));
        vwapSeries.current.setData(vwapData);
      }

      if (indicators.ema9 && showIndicators.ema9) {
        const ema9Data = indicators.ema9.map((value, index) => ({
          time: new Date(marketData[index + (marketData.length - indicators.ema9.length)].timestamp).getTime() / 1000,
          value: value,
        }));
        ema9Series.current.setData(ema9Data);
      }

      if (indicators.ema21 && showIndicators.ema21) {
        const ema21Data = indicators.ema21.map((value, index) => ({
          time: new Date(marketData[index + (marketData.length - indicators.ema21.length)].timestamp).getTime() / 1000,
          value: value,
        }));
        ema21Series.current.setData(ema21Data);
      }
    }

    // Fit content
    chart.current.timeScale().fitContent();
  };

  // Update with real-time data
  useEffect(() => {
    if (data && data.data && isLive) {
      const newCandle = {
        time: new Date(data.data.timestamp).getTime() / 1000,
        open: data.data.open,
        high: data.data.high,
        low: data.data.low,
        close: data.data.close,
      };

      candlestickSeries.current.update(newCandle);

      // Update volume
      const newVolume = {
        time: new Date(data.data.timestamp).getTime() / 1000,
        value: data.data.volume,
        color: data.data.close >= data.data.open ? '#26a69a40' : '#ef535040',
      };
      volumeSeries.current.update(newVolume);

      // Update indicators
      if (data.indicators) {
        if (data.indicators.vwap && showIndicators.vwap) {
          vwapSeries.current.update({
            time: new Date(data.data.timestamp).getTime() / 1000,
            value: data.indicators.vwap,
          });
        }

        if (data.indicators.ema9 && showIndicators.ema9) {
          ema9Series.current.update({
            time: new Date(data.data.timestamp).getTime() / 1000,
            value: data.indicators.ema9,
          });
        }

        if (data.indicators.ema21 && showIndicators.ema21) {
          ema21Series.current.update({
            time: new Date(data.data.timestamp).getTime() / 1000,
            value: data.indicators.ema21,
          });
        }
      }
    }
  }, [data, isLive]);

  const toggleIndicator = (indicator) => {
    setShowIndicators(prev => ({
      ...prev,
      [indicator]: !prev[indicator]
    }));

    // Hide/show series
    switch (indicator) {
      case 'vwap':
        vwapSeries.current.applyOptions({
          visible: !showIndicators.vwap
        });
        break;
      case 'ema9':
        ema9Series.current.applyOptions({
          visible: !showIndicators.ema9
        });
        break;
      case 'ema21':
        ema21Series.current.applyOptions({
          visible: !showIndicators.ema21
        });
        break;
      case 'volume':
        volumeSeries.current.applyOptions({
          visible: !showIndicators.volume
        });
        break;
    }
  };

  const currentPrice = data?.data?.close;
  const previousPrice = chartData.length > 1 ? chartData[chartData.length - 2]?.close : currentPrice;
  const priceChange = currentPrice && previousPrice ? currentPrice - previousPrice : 0;
  const priceChangePercent = previousPrice ? (priceChange / previousPrice) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-lg font-semibold">{symbol} - {timeframe}</h3>
            {currentPrice && (
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold">
                  {formatPrice(currentPrice)}
                </span>
                <div className={`flex items-center space-x-1 ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {priceChange >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Indicator Toggles */}
        <div className="flex items-center space-x-2">
          <Button
            variant={showIndicators.vwap ? "default" : "outline"}
            size="sm"
            onClick={() => toggleIndicator('vwap')}
          >
            VWAP
          </Button>
          <Button
            variant={showIndicators.ema9 ? "default" : "outline"}
            size="sm"
            onClick={() => toggleIndicator('ema9')}
          >
            EMA9
          </Button>
          <Button
            variant={showIndicators.ema21 ? "default" : "outline"}
            size="sm"
            onClick={() => toggleIndicator('ema21')}
          >
            EMA21
          </Button>
          <Button
            variant={showIndicators.volume ? "default" : "outline"}
            size="sm"
            onClick={() => toggleIndicator('volume')}
          >
            Volume
          </Button>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        ref={chartContainerRef}
        className="w-full h-96 border rounded-lg bg-white"
        style={{ minHeight: '400px' }}
      />

      {/* Chart Info */}
      {data?.lastUpdate && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Last Update: {formatTime(data.lastUpdate)}</span>
          <div className="flex items-center space-x-2">
            <Activity className={`h-4 w-4 ${isLive ? 'text-green-600' : 'text-gray-400'}`} />
            <span>{isLive ? 'Live' : 'Paused'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingChart;
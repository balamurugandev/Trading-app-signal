import React, { useState, useEffect, useRef } from 'react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Activity, Zap, Clock, TrendingUp } from 'lucide-react';

const PerformanceMonitor = ({ enabled = true }) => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    renderTime: 0,
    memoryUsage: 0,
    updateCount: 0,
    lastUpdate: null
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const renderTimes = useRef([]);
  const updateCountRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let animationId;
    
    const measurePerformance = () => {
      const now = performance.now();
      frameCount.current++;
      
      // Calculate FPS every second
      if (now - lastTime.current >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
        
        // Calculate average render time
        const avgRenderTime = renderTimes.current.length > 0 
          ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length 
          : 0;
        
        // Get memory usage if available
        const memoryUsage = performance.memory 
          ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) 
          : 0;

        setMetrics({
          fps,
          renderTime: Math.round(avgRenderTime * 100) / 100,
          memoryUsage,
          updateCount: updateCountRef.current,
          lastUpdate: new Date()
        });

        // Reset counters
        frameCount.current = 0;
        lastTime.current = now;
        renderTimes.current = [];
        updateCountRef.current = 0;
      }

      animationId = requestAnimationFrame(measurePerformance);
    };

    measurePerformance();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enabled]);

  // Track component updates
  useEffect(() => {
    updateCountRef.current++;
  });

  // Measure render time
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      renderTimes.current.push(endTime - startTime);
      
      // Keep only last 10 render times
      if (renderTimes.current.length > 10) {
        renderTimes.current = renderTimes.current.slice(-10);
      }
    };
  });

  if (!enabled) return null;

  const getFPSColor = (fps) => {
    if (fps >= 55) return 'text-green-600 bg-green-100';
    if (fps >= 30) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getMemoryColor = (memory) => {
    if (memory < 50) return 'text-green-600 bg-green-100';
    if (memory < 100) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <Card className="fixed bottom-6 left-6 z-50 p-3 bg-white/95 backdrop-blur-sm border shadow-lg">
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-1">
          <Activity className="h-4 w-4 text-blue-600" />
          <span className="text-gray-600">Performance</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Zap className="h-3 w-3" />
          <Badge className={`text-xs ${getFPSColor(metrics.fps)}`}>
            {metrics.fps} FPS
          </Badge>
        </div>
        
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <Badge className="text-xs bg-blue-100 text-blue-800">
            {metrics.renderTime}ms
          </Badge>
        </div>
        
        <div className="flex items-center space-x-1">
          <TrendingUp className="h-3 w-3" />
          <Badge className={`text-xs ${getMemoryColor(metrics.memoryUsage)}`}>
            {metrics.memoryUsage}MB
          </Badge>
        </div>
        
        <div className="text-xs text-gray-500">
          Updates: {metrics.updateCount}/s
        </div>
      </div>
    </Card>
  );
};

export default PerformanceMonitor;
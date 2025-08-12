import { useState, useEffect, useCallback, useRef } from 'react';
import dataUpdateService from '../services/dataUpdateService';

export const useHighFrequencyData = (key, initialData = null, options = {}) => {
  const {
    throttleMs = 16, // ~60 FPS
    priority = 0,
    enableBatching = true,
    maxUpdatesPerSecond = 60
  } = options;

  const [data, setData] = useState(initialData);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);
  
  const lastUpdateTime = useRef(0);
  const updateCountRef = useRef(0);
  const throttleTimeoutRef = useRef(null);

  // Throttled update function
  const throttledUpdate = useCallback((newData, timestamp) => {
    const now = performance.now();
    
    // Check if we should throttle this update
    if (now - lastUpdateTime.current < throttleMs) {
      // Clear existing timeout and set a new one
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
      
      throttleTimeoutRef.current = setTimeout(() => {
        setData(newData);
        setLastUpdate(new Date(timestamp));
        lastUpdateTime.current = now;
        updateCountRef.current++;
      }, throttleMs - (now - lastUpdateTime.current));
      
      return;
    }

    // Update immediately
    setData(newData);
    setLastUpdate(new Date(timestamp));
    lastUpdateTime.current = now;
    updateCountRef.current++;
  }, [throttleMs]);

  // Subscribe to data updates
  useEffect(() => {
    const unsubscribe = dataUpdateService.subscribe(key, throttledUpdate);
    
    return () => {
      unsubscribe();
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, [key, throttledUpdate]);

  // Track update count per second
  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateCount(updateCountRef.current);
      updateCountRef.current = 0;
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Function to push new data
  const pushData = useCallback((newData, customPriority = priority) => {
    if (enableBatching && Array.isArray(newData)) {
      dataUpdateService.batchUpdate(key, newData, customPriority);
    } else {
      dataUpdateService.queueUpdate(key, newData, customPriority);
    }
  }, [key, priority, enableBatching]);

  // Function to push multiple data points
  const pushBatch = useCallback((dataArray, customPriority = priority) => {
    dataUpdateService.batchUpdate(key, dataArray, customPriority);
  }, [key, priority]);

  return {
    data,
    lastUpdate,
    updateCount,
    pushData,
    pushBatch,
    isStale: lastUpdate && (Date.now() - lastUpdate.getTime()) > 5000 // 5 seconds
  };
};

// Hook for managing multiple high-frequency data streams
export const useMultipleHighFrequencyData = (keys, initialData = {}, options = {}) => {
  const [dataMap, setDataMap] = useState(initialData);
  const [updateCounts, setUpdateCounts] = useState({});
  
  const updateCountRefs = useRef({});

  // Initialize update count refs
  useEffect(() => {
    keys.forEach(key => {
      if (!updateCountRefs.current[key]) {
        updateCountRefs.current[key] = 0;
      }
    });
  }, [keys]);

  // Subscribe to all keys
  useEffect(() => {
    const unsubscribers = keys.map(key => {
      return dataUpdateService.subscribe(key, (newData, timestamp) => {
        setDataMap(prev => ({
          ...prev,
          [key]: {
            data: newData,
            lastUpdate: new Date(timestamp)
          }
        }));
        
        updateCountRefs.current[key]++;
      });
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [keys]);

  // Track update counts
  useEffect(() => {
    const interval = setInterval(() => {
      const counts = {};
      keys.forEach(key => {
        counts[key] = updateCountRefs.current[key] || 0;
        updateCountRefs.current[key] = 0;
      });
      setUpdateCounts(counts);
    }, 1000);

    return () => clearInterval(interval);
  }, [keys]);

  const pushData = useCallback((key, newData, priority = 0) => {
    dataUpdateService.queueUpdate(key, newData, priority);
  }, []);

  const pushBatch = useCallback((key, dataArray, priority = 0) => {
    dataUpdateService.batchUpdate(key, dataArray, priority);
  }, []);

  return {
    dataMap,
    updateCounts,
    pushData,
    pushBatch,
    getServiceStatus: () => dataUpdateService.getQueueStatus()
  };
};

export default useHighFrequencyData;
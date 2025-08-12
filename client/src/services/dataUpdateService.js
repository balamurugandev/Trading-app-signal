class DataUpdateService {
  constructor() {
    this.subscribers = new Map();
    this.updateQueue = [];
    this.isProcessing = false;
    this.batchSize = 50;
    this.updateInterval = 16; // ~60 FPS
    this.lastUpdate = 0;
    
    // Start the update loop
    this.startUpdateLoop();
  }

  // Subscribe to data updates
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  // Queue an update for processing
  queueUpdate(key, data, priority = 0) {
    this.updateQueue.push({
      key,
      data,
      priority,
      timestamp: performance.now()
    });

    // Sort by priority (higher priority first)
    this.updateQueue.sort((a, b) => b.priority - a.priority);

    // Limit queue size to prevent memory issues
    if (this.updateQueue.length > 1000) {
      this.updateQueue = this.updateQueue.slice(0, 1000);
    }
  }

  // Process updates in batches
  processUpdates() {
    if (this.isProcessing || this.updateQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const now = performance.now();

    // Process updates in batches to avoid blocking the main thread
    const batch = this.updateQueue.splice(0, this.batchSize);
    
    // Group updates by key for efficient processing
    const groupedUpdates = new Map();
    
    batch.forEach(update => {
      if (!groupedUpdates.has(update.key)) {
        groupedUpdates.set(update.key, []);
      }
      groupedUpdates.get(update.key).push(update);
    });

    // Process each group
    groupedUpdates.forEach((updates, key) => {
      const callbacks = this.subscribers.get(key);
      if (callbacks && callbacks.size > 0) {
        // Use the most recent update for each key
        const latestUpdate = updates[updates.length - 1];
        
        // Notify all subscribers
        callbacks.forEach(callback => {
          try {
            callback(latestUpdate.data, latestUpdate.timestamp);
          } catch (error) {
            console.error(`Error in data update callback for ${key}:`, error);
          }
        });
      }
    });

    this.lastUpdate = now;
    this.isProcessing = false;
  }

  // Start the update processing loop
  startUpdateLoop() {
    const loop = () => {
      const now = performance.now();
      
      // Throttle updates to maintain smooth performance
      if (now - this.lastUpdate >= this.updateInterval) {
        this.processUpdates();
      }
      
      requestAnimationFrame(loop);
    };
    
    requestAnimationFrame(loop);
  }

  // Batch multiple updates for the same key
  batchUpdate(key, dataArray, priority = 0) {
    // Only keep the most recent update for performance
    const latestData = dataArray[dataArray.length - 1];
    this.queueUpdate(key, latestData, priority);
  }

  // Get current queue status
  getQueueStatus() {
    return {
      queueLength: this.updateQueue.length,
      subscriberCount: Array.from(this.subscribers.values())
        .reduce((total, callbacks) => total + callbacks.size, 0),
      isProcessing: this.isProcessing,
      lastUpdate: this.lastUpdate
    };
  }

  // Clear all queued updates
  clearQueue() {
    this.updateQueue = [];
  }

  // Clear all subscribers
  clearSubscribers() {
    this.subscribers.clear();
  }

  // Destroy the service
  destroy() {
    this.clearQueue();
    this.clearSubscribers();
  }
}

// Create a singleton instance
const dataUpdateService = new DataUpdateService();

export default dataUpdateService;
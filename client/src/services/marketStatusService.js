class MarketStatusService {
  constructor() {
    this.subscribers = new Set();
    this.currentStatus = this.calculateMarketStatus();
    this.statusInterval = null;
    
    // Start monitoring market status
    this.startMonitoring();
  }

  startMonitoring() {
    // Update market status every minute
    this.statusInterval = setInterval(() => {
      const newStatus = this.calculateMarketStatus();
      const hasChanged = JSON.stringify(newStatus) !== JSON.stringify(this.currentStatus);
      
      if (hasChanged) {
        this.currentStatus = newStatus;
        this.notifySubscribers();
      }
    }, 60000); // Check every minute
  }

  calculateMarketStatus() {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const hour = istTime.getHours();
    const minute = istTime.getMinutes();
    const day = istTime.getDay();

    // Indian Market Status (NSE/BSE)
    const isWeekend = day === 0 || day === 6;
    const isMarketHours = (hour > 9 || (hour === 9 && minute >= 15)) && (hour < 15 || (hour === 15 && minute <= 30));
    const isIndianMarketOpen = !isWeekend && isMarketHours;

    // Pre-market and post-market sessions
    const isPreMarket = !isWeekend && ((hour === 9 && minute < 15) || (hour < 9 && hour >= 8));
    const isPostMarket = !isWeekend && ((hour === 15 && minute > 30) || (hour > 15 && hour < 18));

    // Crypto Market Status (24/7)
    const isCryptoMarketOpen = true; // Always open

    // Market session names
    let indianSession = 'CLOSED';
    if (isIndianMarketOpen) {
      if (hour < 11 || (hour === 11 && minute < 30)) {
        indianSession = 'MORNING';
      } else {
        indianSession = 'AFTERNOON';
      }
    } else if (isPreMarket) {
      indianSession = 'PRE_MARKET';
    } else if (isPostMarket) {
      indianSession = 'POST_MARKET';
    } else if (isWeekend) {
      indianSession = 'WEEKEND';
    }

    return {
      indian: {
        isOpen: isIndianMarketOpen,
        session: indianSession,
        isPreMarket,
        isPostMarket,
        isWeekend,
        nextOpenTime: this.getNextOpenTime(istTime),
        timeUntilOpen: this.getTimeUntilOpen(istTime)
      },
      crypto: {
        isOpen: isCryptoMarketOpen,
        session: 'CONTINUOUS',
        timezone: 'UTC'
      },
      timestamp: istTime.toISOString()
    };
  }

  getNextOpenTime(currentTime) {
    const nextOpen = new Date(currentTime);
    const day = currentTime.getDay();
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();

    if (day === 0) { // Sunday
      nextOpen.setDate(nextOpen.getDate() + 1); // Monday
      nextOpen.setHours(9, 15, 0, 0);
    } else if (day === 6) { // Saturday
      nextOpen.setDate(nextOpen.getDate() + 2); // Monday
      nextOpen.setHours(9, 15, 0, 0);
    } else if (hour >= 15 && (hour > 15 || minute > 30)) { // After market close
      nextOpen.setDate(nextOpen.getDate() + 1);
      nextOpen.setHours(9, 15, 0, 0);
    } else if (hour < 9 || (hour === 9 && minute < 15)) { // Before market open
      nextOpen.setHours(9, 15, 0, 0);
    }

    return nextOpen;
  }

  getTimeUntilOpen(currentTime) {
    const nextOpen = this.getNextOpenTime(currentTime);
    const diff = nextOpen.getTime() - currentTime.getTime();
    
    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes, totalMinutes: Math.floor(diff / (1000 * 60)) };
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    
    // Immediately call with current status
    callback(this.currentStatus);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.currentStatus);
      } catch (error) {
        console.error('Error in market status callback:', error);
      }
    });
  }

  getCurrentStatus() {
    return this.currentStatus;
  }

  destroy() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
    this.subscribers.clear();
  }
}

// Create singleton instance
const marketStatusService = new MarketStatusService();

export default marketStatusService;
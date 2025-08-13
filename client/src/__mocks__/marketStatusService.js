const marketStatusService = {
  getCurrentStatus: jest.fn().mockReturnValue({
    indian: {
      isOpen: true,
      session: 'MORNING',
      isPreMarket: false,
      isPostMarket: false,
      isWeekend: false,
      timeUntilOpen: { hours: 0, minutes: 0 },
      nextOpenTime: new Date()
    },
    crypto: {
      isOpen: true,
      session: 'CONTINUOUS',
      timezone: 'UTC'
    },
    timestamp: new Date().toISOString()
  }),
  
  subscribe: jest.fn(callback => {
    // Store the callback to trigger updates in tests
    marketStatusService.callback = callback;
    return () => {}; // Return empty unsubscribe function
  }),
  
  getIndianMarketStatus: jest.fn().mockReturnValue({
    isOpen: true,
    session: 'MORNING',
    isPreMarket: false,
    isPostMarket: false,
    isWeekend: false,
    timeUntilOpen: { hours: 0, minutes: 0 },
    nextOpenTime: new Date()
  }),
  
  getCryptoMarketStatus: jest.fn().mockReturnValue({
    isOpen: true,
    session: 'CONTINUOUS',
    timezone: 'UTC'
  }),
  
  // Helper method for tests to trigger updates
  triggerUpdate: function(newStatus) {
    if (this.callback) {
      this.callback(newStatus);
    }
  }
};

export default marketStatusService;

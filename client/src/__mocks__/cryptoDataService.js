const cryptoDataService = {
  start: jest.fn(),
  stop: jest.fn(),
  subscribe: jest.fn((symbol, callback) => {
    // Store the callback to simulate updates
    cryptoDataService.callbacks = cryptoDataService.callbacks || {};
    cryptoDataService.callbacks[symbol] = callback;
    
    // Return unsubscribe function
    return () => {
      delete cryptoDataService.callbacks[symbol];
    };
  }),
  
  // Helper method for tests to trigger updates
  triggerUpdate: function(symbol, data) {
    if (this.callbacks && this.callbacks[symbol]) {
      this.callbacks[symbol](symbol, data);
    }
  }
};

export default cryptoDataService;

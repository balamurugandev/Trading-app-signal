import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock the marketStatusService
jest.mock('../services/marketStatusService', () => ({
  __esModule: true,
  default: {
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
    })
  }
}));

// Mock the cryptoDataService
jest.mock('../services/cryptoDataService', () => ({
  __esModule: true,
  default: {
    start: jest.fn(),
    stop: jest.fn(),
    subscribe: jest.fn((symbol, callback) => {
      cryptoDataService.callbacks = cryptoDataService.callbacks || {};
      cryptoDataService.callbacks[symbol] = callback;
      return () => {
        delete cryptoDataService.callbacks[symbol];
      };
 })
  }
}));

// Make the mock available for test files
export const marketStatusService = require('../services/marketStatusService').default;
export const cryptoDataService = require('../services/cryptoDataService').default;

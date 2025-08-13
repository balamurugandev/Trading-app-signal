import React from 'react';
import { render, screen, act } from '@testing-library/react';
import MarketStatusIndicator from '../MarketStatusIndicator';
import { marketStatusService } from '../../setupTests';

describe('MarketStatusIndicator', () => {
  let mockSubscribe;
  let unsubscribeMock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock implementation for subscribe
    unsubscribeMock = jest.fn();
    mockSubscribe = jest.fn(callback => {
      // Store the callback to trigger updates in tests
      marketStatusService.subscribeCallback = callback;
      return unsubscribeMock;
    });
    
    // Mock the marketStatusService
    marketStatusService.subscribe = mockSubscribe;
    marketStatusService.getCurrentStatus = jest.fn().mockReturnValue({
      indian: {
        isOpen: true,
        session: 'MORNING',
        isPreMarket: false,
        isPostMarket: false,
        isWeekend: false
      },
      crypto: {
        isOpen: true,
        session: 'CONTINUOUS',
        timezone: 'UTC'
      },
      timestamp: new Date().toISOString()
    });
  });

  afterEach(() => {
    // Cleanup
    delete marketStatusService.subscribeCallback;
  });

  it('renders without crashing', () => {
    render(<MarketStatusIndicator />);
    expect(screen.getByText('Indian Markets')).toBeInTheDocument();
    expect(screen.getByText('Crypto Markets')).toBeInTheDocument();
  });

  it('subscribes to market status updates on mount', () => {
    render(<MarketStatusIndicator />);
    expect(marketStatusService.subscribe).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes from market status updates on unmount', () => {
    const { unmount } = render(<MarketStatusIndicator />);
    unmount();
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });

  it('displays the correct market status for Indian markets', () => {
    render(<MarketStatusIndicator />);
    
    // Check for Indian market status
    const indianMarketStatus = screen.getByText('Indian Markets').closest('div').nextSibling;
    expect(indianMarketStatus).toHaveTextContent('MORNING SESSION');
    
    // Check for the status indicator dot (should be green for open market)
    const statusDot = screen.getByText('Indian Markets').closest('div').querySelector('.rounded-full');
    expect(statusDot).toHaveClass('bg-green-500');
  });

  it('displays the correct market status for Crypto markets', () => {
    render(<MarketStatusIndicator />);
    
    // Check for Crypto market status
    const cryptoMarketStatus = screen.getByText('Crypto Markets').closest('div').nextSibling;
    expect(cryptoMarketStatus).toHaveTextContent('24/7');
    
    // Check for the status indicator dot (should be green for crypto)
    const statusDot = screen.getByText('Crypto Markets').closest('div').querySelector('.rounded-full');
    expect(statusDot).toHaveClass('bg-green-500');
  });

  it('updates when market status changes', () => {
    render(<MarketStatusIndicator />);
    
    // Initial render should show morning session
    expect(screen.getByText('MORNING SESSION')).toBeInTheDocument();
    
    // Simulate a market status update
    act(() => {
      marketStatusService.subscribeCallback({
        indian: {
          isOpen: true,
          session: 'AFTERNOON',
          isPreMarket: false,
          isPostMarket: false,
          isWeekend: false
        },
        crypto: {
          isOpen: true,
          session: 'CONTINUOUS',
          timezone: 'UTC'
        },
        timestamp: new Date().toISOString()
      });
    });
    
    // Should now show afternoon session
    expect(screen.getByText('AFTERNOON SESSION')).toBeInTheDocument();
  });
});

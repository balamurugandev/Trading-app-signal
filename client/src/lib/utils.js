import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}

export function formatNumber(number, decimals = 2) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
}

export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function calculatePnL(entryPrice, exitPrice, quantity = 1) {
  return (exitPrice - entryPrice) * quantity;
}

export function calculatePnLPercentage(entryPrice, exitPrice) {
  return ((exitPrice - entryPrice) / entryPrice) * 100;
}

export function getSignalColor(signal) {
  if (signal.type === 'BUY') {
    return signal.strength >= 80 ? 'text-green-700' : 'text-green-600';
  } else {
    return signal.strength >= 80 ? 'text-red-700' : 'text-red-600';
  }
}

export function getSignalBgColor(signal) {
  if (signal.type === 'BUY') {
    return signal.strength >= 80 ? 'bg-green-100' : 'bg-green-50';
  } else {
    return signal.strength >= 80 ? 'bg-red-100' : 'bg-red-50';
  }
}

export function getMarketStatusColor(isOpen, isLiquidWindow) {
  if (!isOpen) return 'text-red-600';
  if (isLiquidWindow) return 'text-blue-600';
  return 'text-green-600';
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
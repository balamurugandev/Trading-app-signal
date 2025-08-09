import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Activity } from 'lucide-react';
import { formatTime, getMarketStatusColor } from '@/lib/utils';

const MarketStatus = ({ status }) => {
  const { isOpen, isLiquidWindow, session, currentTime } = status;

  const getStatusText = () => {
    if (!isOpen) return 'Market Closed';
    if (isLiquidWindow) return 'Liquid Window';
    return 'Market Open';
  };

  const getStatusVariant = () => {
    if (!isOpen) return 'destructive';
    if (isLiquidWindow) return 'default';
    return 'secondary';
  };

  const getSessionColor = () => {
    switch (session) {
      case 'MORNING':
        return 'text-blue-600';
      case 'MIDDAY':
        return 'text-yellow-600';
      case 'AFTERNOON':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Activity className={`h-4 w-4 ${getMarketStatusColor(isOpen, isLiquidWindow)}`} />
        <Badge variant={getStatusVariant()}>
          {getStatusText()}
        </Badge>
      </div>
      
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4 text-gray-500" />
        <div className="text-sm">
          <span className={getSessionColor()}>{session}</span>
          {currentTime && (
            <span className="text-gray-500 ml-2">
              {formatTime(currentTime)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketStatus;
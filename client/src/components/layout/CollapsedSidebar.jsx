import React from 'react';
import { Button } from '../ui/button';
import { ChevronRight } from 'lucide-react';

const CollapsedSidebar = ({ 
  symbols, 
  selectedSymbol, 
  onSymbolChange, 
  handleCollapse, 
  getMarketStatus 
}) => {
  return (
    <aside className="w-12 bg-gray-50 border-r border-gray-200 p-2 flex flex-col items-center space-y-4 fixed h-full z-30">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCollapse}
        className="w-8 h-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      <div className="flex flex-col space-y-1 w-full">
        {symbols.map((symbol) => {
          const status = getMarketStatus(symbol);
          return (
            <Button
              key={symbol}
              variant={selectedSymbol === symbol ? "default" : "ghost"}
              size="sm"
              onClick={() => onSymbolChange(symbol)}
              className="w-full p-1 h-auto justify-center"
            >
              <div className="flex flex-col items-center w-full">
                <span className="text-[10px] font-medium">{symbol}</span>
                <span className={`text-[8px] font-medium ${
                  status.isPositive ? 'text-green-500' : 'text-red-500'
                }`}>
                  {status.changePercent > 0 ? '+' : ''}
                  {status.changePercent.toFixed(1)}%
                </span>
              </div>
            </Button>
          );
        })}
      </div>
    </aside>
  );
};

export default CollapsedSidebar;
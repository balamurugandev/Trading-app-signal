import React, { useMemo, useCallback } from 'react';
import ThemedAgGrid from './ThemedAgGrid';

const MarketDataGrid = ({ marketData = [], isDark = true, onSymbolSelect }) => {
  // Column definitions for market data grid
  const columnDefs = useMemo(() => [
    {
      headerName: 'Symbol',
      field: 'symbol',
      width: 120,
      pinned: 'left',
      cellStyle: {
        fontWeight: '600',
        color: isDark ? '#fbbf24' : '#d97706'
      }
    },
    {
      headerName: 'LTP',
      field: 'ltp',
      width: 120,
      valueFormatter: (params) => {
        const symbol = params.data?.symbol;
        const isCrypto = symbol === 'BITCOIN' || symbol === 'SOLANA';
        const currency = isCrypto ? '$' : '₹';
        return `${currency}${params.value?.toFixed(2) || '0.00'}`;
      },
      cellStyle: {
        fontWeight: '600',
        fontSize: '14px',
        textAlign: 'right'
      }
    },
    {
      headerName: 'Change',
      field: 'change',
      width: 100,
      valueFormatter: (params) => {
        const symbol = params.data?.symbol;
        const isCrypto = symbol === 'BITCOIN' || symbol === 'SOLANA';
        const currency = isCrypto ? '$' : '₹';
        const change = params.value || 0;
        const sign = change >= 0 ? '+' : '';
        return `${sign}${currency}${change.toFixed(2)}`;
      },
      cellStyle: (params) => {
        const change = params.value || 0;
        return {
          color: change >= 0 
            ? (isDark ? '#10b981' : '#059669') 
            : (isDark ? '#f87171' : '#dc2626'),
          fontWeight: '500',
          textAlign: 'right'
        };
      }
    },
    {
      headerName: 'Change %',
      field: 'changePercent',
      width: 100,
      valueFormatter: (params) => {
        const change = params.value || 0;
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change.toFixed(2)}%`;
      },
      cellRenderer: (params) => {
        const change = params.value || 0;
        const isPositive = change >= 0;
        const bgColor = isPositive 
          ? (isDark ? '#065f46' : '#d1fae5') 
          : (isDark ? '#7f1d1d' : '#fee2e2');
        const textColor = isPositive 
          ? (isDark ? '#10b981' : '#059669') 
          : (isDark ? '#f87171' : '#dc2626');
        
        return (
          <span 
            style={{
              backgroundColor: bgColor,
              color: textColor,
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600',
              display: 'inline-block',
              minWidth: '60px',
              textAlign: 'center'
            }}
          >
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </span>
        );
      }
    },
    {
      headerName: 'Volume',
      field: 'volume',
      width: 120,
      valueFormatter: (params) => {
        const volume = params.value || 0;
        if (volume >= 1000000) {
          return `${(volume / 1000000).toFixed(1)}M`;
        } else if (volume >= 1000) {
          return `${(volume / 1000).toFixed(1)}K`;
        }
        return volume.toString();
      },
      cellStyle: {
        color: isDark ? '#9ca3af' : '#6b7280',
        textAlign: 'right'
      }
    },
    {
      headerName: 'Status',
      field: 'dataSource',
      width: 100,
      cellRenderer: (params) => {
        const source = params.value || 'unknown';
        const isLive = source === 'live';
        const bgColor = isLive 
          ? (isDark ? '#065f46' : '#d1fae5') 
          : (isDark ? '#374151' : '#f3f4f6');
        const textColor = isLive 
          ? (isDark ? '#10b981' : '#059669') 
          : (isDark ? '#fbbf24' : '#d97706');
        
        const displayText = source === 'last_close' ? 'CLOSE' : source.toUpperCase();
        
        return (
          <span 
            style={{
              backgroundColor: bgColor,
              color: textColor,
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}
          >
            {displayText}
          </span>
        );
      }
    },
    {
      headerName: 'Last Update',
      field: 'timestamp',
      width: 140,
      valueFormatter: (params) => {
        if (!params.value) return 'N/A';
        const date = new Date(params.value);
        return date.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Kolkata'
        });
      },
      cellStyle: {
        color: isDark ? '#9ca3af' : '#6b7280',
        fontSize: '12px'
      }
    }
  ], [isDark]);

  // Row selection handler
  const onSelectionChanged = useCallback((event) => {
    const selectedRows = event.api.getSelectedRows();
    if (selectedRows.length > 0 && onSymbolSelect) {
      onSymbolSelect(selectedRows[0]);
    }
  }, [onSymbolSelect]);

  // Default column definition
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    cellStyle: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '13px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }
  }), []);

  // Auto-refresh data every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      // This would trigger a data refresh in a real implementation
      // For now, we'll just log that we should refresh
      console.log('Auto-refreshing market data grid...');
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full w-full">
      <ThemedAgGrid
        rowData={marketData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        isDark={isDark}
        onSelectionChanged={onSelectionChanged}
        rowSelection="single"
        animateRows={true}
        enableRangeSelection={true}
        suppressRowClickSelection={false}
        getRowStyle={(params) => {
          if (params.node.selected) {
            return {
              backgroundColor: isDark ? '#4f46e520' : '#4f46e510',
              border: `1px solid ${isDark ? '#4f46e5' : '#4f46e5'}`
            };
          }
          return {};
        }}
        className="market-data-grid"
      />
    </div>
  );
};

export default MarketDataGrid;
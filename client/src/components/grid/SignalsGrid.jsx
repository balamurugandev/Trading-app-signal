import React, { useMemo, useCallback } from 'react';
import ThemedAgGrid from './ThemedAgGrid';

const SignalsGrid = ({ signals = [], isDark = true, onSignalSelect }) => {
  // Column definitions for signals grid
  const columnDefs = useMemo(() => [
    {
      headerName: 'Time',
      field: 'signalTime',
      width: 100,
      pinned: 'left',
      cellStyle: {
        fontWeight: '500',
        color: isDark ? '#60a5fa' : '#2563eb'
      }
    },
    {
      headerName: 'Symbol',
      field: 'symbol',
      width: 120,
      cellStyle: {
        fontWeight: '600',
        color: isDark ? '#fbbf24' : '#d97706'
      }
    },
    {
      headerName: 'Type',
      field: 'signal',
      width: 100,
      cellRenderer: (params) => {
        const isBuy = params.value?.includes('BUY');
        const bgColor = isBuy 
          ? (isDark ? '#065f46' : '#d1fae5') 
          : (isDark ? '#7f1d1d' : '#fee2e2');
        const textColor = isBuy 
          ? (isDark ? '#10b981' : '#059669') 
          : (isDark ? '#ef4444' : '#dc2626');
        
        return (
          <span 
            style={{
              backgroundColor: bgColor,
              color: textColor,
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            {params.value}
          </span>
        );
      }
    },
    {
      headerName: 'Entry',
      field: 'entryPrice',
      width: 100,
      valueFormatter: (params) => `₹${params.value?.toFixed(2) || '0.00'}`,
      cellStyle: {
        fontWeight: '500',
        textAlign: 'right'
      }
    },
    {
      headerName: 'Stop Loss',
      field: 'stopLoss',
      width: 100,
      valueFormatter: (params) => `₹${params.value?.toFixed(2) || '0.00'}`,
      cellStyle: {
        color: isDark ? '#f87171' : '#dc2626',
        textAlign: 'right'
      }
    },
    {
      headerName: 'Target 1',
      field: 'target1',
      width: 100,
      valueFormatter: (params) => `₹${params.value?.toFixed(2) || '0.00'}`,
      cellStyle: {
        color: isDark ? '#34d399' : '#059669',
        textAlign: 'right'
      }
    },
    {
      headerName: 'Target 2',
      field: 'target2',
      width: 100,
      valueFormatter: (params) => `₹${params.value?.toFixed(2) || '0.00'}`,
      cellStyle: {
        color: isDark ? '#34d399' : '#059669',
        textAlign: 'right'
      }
    },
    {
      headerName: 'Strength',
      field: 'strength',
      width: 100,
      valueFormatter: (params) => `${params.value?.toFixed(1) || '0.0'}%`,
      cellRenderer: (params) => {
        const strength = params.value || 0;
        const color = strength >= 80 
          ? (isDark ? '#10b981' : '#059669')
          : strength >= 60 
          ? (isDark ? '#fbbf24' : '#d97706')
          : (isDark ? '#f87171' : '#dc2626');
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div 
              style={{
                width: '40px',
                height: '4px',
                backgroundColor: isDark ? '#374151' : '#e5e7eb',
                borderRadius: '2px',
                overflow: 'hidden'
              }}
            >
              <div 
                style={{
                  width: `${Math.min(strength, 100)}%`,
                  height: '100%',
                  backgroundColor: color,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <span style={{ color, fontWeight: '500', fontSize: '12px' }}>
              {strength.toFixed(1)}%
            </span>
          </div>
        );
      }
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 100,
      cellRenderer: (params) => {
        const status = params.value || 'unknown';
        const isActive = status === 'active';
        const bgColor = isActive 
          ? (isDark ? '#065f46' : '#d1fae5') 
          : (isDark ? '#374151' : '#f3f4f6');
        const textColor = isActive 
          ? (isDark ? '#10b981' : '#059669') 
          : (isDark ? '#9ca3af' : '#6b7280');
        
        return (
          <span 
            style={{
              backgroundColor: bgColor,
              color: textColor,
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              textTransform: 'uppercase'
            }}
          >
            {status}
          </span>
        );
      }
    },
    {
      headerName: 'Timeframe',
      field: 'timeframe',
      width: 90,
      cellStyle: {
        color: isDark ? '#a78bfa' : '#7c3aed',
        fontWeight: '500'
      }
    }
  ], [isDark]);

  // Row selection handler
  const onSelectionChanged = useCallback((event) => {
    const selectedRows = event.api.getSelectedRows();
    if (selectedRows.length > 0 && onSignalSelect) {
      onSignalSelect(selectedRows[0]);
    }
  }, [onSignalSelect]);

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

  return (
    <div className="h-full w-full">
      <ThemedAgGrid
        rowData={signals}
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
        className="signals-grid"
      />
    </div>
  );
};

export default SignalsGrid;
import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { TrendingUp, TrendingDown } from 'lucide-react';

// Custom cell renderers for optimized performance
const SignalTypeCellRenderer = memo(({ value }) => {
  const Icon = value === 'BUY' ? TrendingUp : TrendingDown;
  const colorClass = value === 'BUY' ? 'text-green-600' : 'text-red-600';
  
  return (
    <div className={`flex items-center space-x-1 ${colorClass}`}>
      <Icon className="h-4 w-4" />
      <span className="font-medium">{value}</span>
    </div>
  );
});

const PriceCellRenderer = memo(({ value }) => (
  <span className="font-mono">₹{value?.toFixed(2) || '--'}</span>
));

const PercentageCellRenderer = memo(({ value }) => {
  const colorClass = value >= 0 ? 'text-green-600' : 'text-red-600';
  return (
    <span className={`font-medium ${colorClass}`}>
      {value >= 0 ? '+' : ''}{value?.toFixed(2) || 0}%
    </span>
  );
});

const StrengthCellRenderer = memo(({ value }) => {
  const getColor = (strength) => {
    if (strength >= 80) return 'bg-green-500';
    if (strength >= 60) return 'bg-blue-500';
    return 'bg-yellow-500';
  };
  
  return (
    <div className="flex items-center space-x-2">
      <div className={`px-2 py-1 rounded text-white text-xs font-bold ${getColor(value)}`}>
        {value}%
      </div>
    </div>
  );
});

const StatusCellRenderer = memo(({ value }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return { color: 'text-blue-600', bg: 'bg-blue-100', text: 'Active' };
      case 'hit_target':
        return { color: 'text-green-600', bg: 'bg-green-100', text: 'Target Hit' };
      case 'hit_stop':
        return { color: 'text-red-600', bg: 'bg-red-100', text: 'Stop Hit' };
      case 'expired':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Expired' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', text: 'Unknown' };
    }
  };
  
  const config = getStatusConfig(value);
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      {config.text}
    </span>
  );
});

const TimeCellRenderer = memo(({ value }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  return (
    <span className="text-xs font-mono text-gray-600">
      {formatTime(value)}
    </span>
  );
});

const SignalGrid = memo(({ 
  signals, 
  onSignalUpdate, 
  loading = false,
  autoSizeColumns = true 
}) => {
  const gridRef = useRef();
  
  // Column definitions optimized for performance
  const columnDefs = useMemo(() => [
    {
      headerName: '#',
      field: 'id',
      width: 60,
      pinned: 'left',
      valueGetter: (params) => params.node.rowIndex + 1,
      cellClass: 'text-center font-medium text-gray-500'
    },
    {
      headerName: 'Time',
      field: 'timestamp',
      width: 100,
      cellRenderer: TimeCellRenderer,
      sort: 'desc'
    },
    {
      headerName: 'Symbol',
      field: 'symbol',
      width: 100,
      cellClass: 'font-bold'
    },
    {
      headerName: 'TF',
      field: 'timeframe',
      width: 60,
      cellClass: 'text-center text-xs'
    },
    {
      headerName: 'Signal',
      field: 'type',
      width: 80,
      cellRenderer: SignalTypeCellRenderer
    },
    {
      headerName: 'Entry',
      field: 'entryPrice',
      width: 100,
      cellRenderer: PriceCellRenderer,
      type: 'numericColumn'
    },
    {
      headerName: 'Strike',
      field: 'optionStrike',
      width: 80,
      cellClass: 'text-center font-mono'
    },
    {
      headerName: 'Stop Loss',
      field: 'stopLoss',
      width: 100,
      cellRenderer: PriceCellRenderer,
      type: 'numericColumn'
    },
    {
      headerName: 'Target 1',
      field: 'target1',
      width: 100,
      cellRenderer: PriceCellRenderer,
      type: 'numericColumn'
    },
    {
      headerName: 'Target 2',
      field: 'target2',
      width: 100,
      cellRenderer: PriceCellRenderer,
      type: 'numericColumn'
    },
    {
      headerName: 'Strength',
      field: 'strength',
      width: 90,
      cellRenderer: StrengthCellRenderer,
      type: 'numericColumn'
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 100,
      cellRenderer: StatusCellRenderer
    },
    {
      headerName: 'P&L',
      field: 'pnl',
      width: 80,
      cellRenderer: PercentageCellRenderer,
      type: 'numericColumn',
      valueGetter: (params) => params.data.pnl || 0
    },
    {
      headerName: 'R:R',
      field: 'riskReward',
      width: 70,
      cellClass: 'text-center text-xs font-medium'
    }
  ], []);

  // Grid options optimized for performance
  const gridOptions = useMemo(() => ({
    animateRows: false,
    enableCellChangeFlash: true,
    suppressRowClickSelection: true,
    rowSelection: 'single',
    suppressMovableColumns: true,
    suppressColumnVirtualisation: false,
    rowBuffer: 10,
    debounceVerticalScrollbar: true,
    suppressScrollOnNewData: true,
    getRowId: (params) => params.data.id,
    deltaRowDataMode: true, // Enable delta updates for performance
    immutableData: true,
    asyncTransactionWaitMillis: 50
  }), []);

  // Default column definitions
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    suppressMenu: true,
    floatingFilter: false,
    cellClass: 'ag-cell-no-focus'
  }), []);

  // Handle grid ready
  const onGridReady = useCallback((params) => {
    if (autoSizeColumns) {
      params.api.sizeColumnsToFit();
    }
  }, [autoSizeColumns]);

  // Handle row click
  const onRowClicked = useCallback((event) => {
    if (onSignalUpdate) {
      onSignalUpdate(event.data);
    }
  }, [onSignalUpdate]);

  // Auto-refresh grid data when signals change
  useEffect(() => {
    if (gridRef.current?.api && signals) {
      // Use transaction for better performance with large datasets
      gridRef.current.api.setRowData(signals);
    }
  }, [signals]);

  // Row class rules for visual feedback
  const getRowClass = useCallback((params) => {
    const status = params.data.status;
    switch (status) {
      case 'hit_target':
        return 'ag-row-success';
      case 'hit_stop':
        return 'ag-row-danger';
      case 'active':
        return 'ag-row-active';
      default:
        return '';
    }
  }, []);

  return (
    <div className="h-full w-full">
      <div className="ag-theme-alpine h-full">
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          rowData={signals}
          gridOptions={gridOptions}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          onRowClicked={onRowClicked}
          getRowClass={getRowClass}
          loading={loading}
          loadingOverlayComponent="Loading signals..."
          noRowsOverlayComponent="No signals available"
          headerHeight={40}
          rowHeight={35}
        />
      </div>
      
      {/* Custom CSS for row styling */}
      <style jsx>{`
        .ag-row-success {
          background-color: #f0f9ff !important;
          border-left: 3px solid #10b981 !important;
        }
        .ag-row-danger {
          background-color: #fef2f2 !important;
          border-left: 3px solid #ef4444 !important;
        }
        .ag-row-active {
          background-color: #fffbeb !important;
          border-left: 3px solid #f59e0b !important;
        }
        .ag-cell-no-focus:focus {
          outline: none !important;
        }
      `}</style>
    </div>
  );
});

SignalGrid.displayName = 'SignalGrid';

export default SignalGrid;
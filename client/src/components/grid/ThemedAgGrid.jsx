import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { darkGridTheme, lightGridTheme } from '../../themes/agGridTheme';
import 'ag-grid-community/styles/ag-grid.css';

const ThemedAgGrid = ({ 
  isDark = true, 
  className = '',
  rowData = [],
  columnDefs = [],
  defaultColDef = {},
  ...props 
}) => {
  // Memoize theme selection
  const theme = useMemo(() => {
    return isDark ? darkGridTheme : lightGridTheme;
  }, [isDark]);

  // Default column definitions with theme-aware styling
  const defaultColumnDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
    cellStyle: {
      color: isDark ? '#FFFFFF' : '#1f2937',
      fontSize: '13px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    },
    headerClass: isDark ? 'ag-header-dark' : 'ag-header-light',
    ...defaultColDef
  }), [isDark, defaultColDef]);

  // Grid options with theme configuration
  const gridOptions = useMemo(() => ({
    theme: theme,
    animateRows: true,
    enableRangeSelection: true,
    enableCellTextSelection: true,
    suppressMenuHide: true,
    suppressRowClickSelection: false,
    rowSelection: 'single',
    ...props.gridOptions
  }), [theme, props.gridOptions]);

  return (
    <div 
      className={`ag-theme-quartz ${isDark ? 'ag-theme-quartz-dark' : ''} ${className}`}
      style={{
        height: '100%',
        width: '100%',
        '--ag-background-color': isDark ? '#1f2836' : '#ffffff',
        '--ag-foreground-color': isDark ? '#ffffff' : '#1f2937',
        '--ag-border-color': isDark ? '#3a4553' : '#e5e7eb',
        '--ag-header-background-color': isDark ? '#2a3441' : '#f9fafb',
        '--ag-odd-row-background-color': isDark ? '#252d3a' : '#f9fafb',
        '--ag-row-hover-color': isDark ? '#3a4553' : '#f3f4f6',
        '--ag-selected-row-background-color': '#4f46e5',
        '--ag-range-selection-background-color': '#4f46e520',
        '--ag-input-background-color': isDark ? '#2a3441' : '#ffffff',
        '--ag-input-border-color': isDark ? '#3a4553' : '#d1d5db',
        '--ag-input-focus-border-color': '#4f46e5',
        '--ag-font-family': 'Inter, system-ui, -apple-system, sans-serif',
        '--ag-font-size': '13px',
        '--ag-header-font-size': '14px',
        '--ag-header-font-weight': '600'
      }}
    >
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColumnDef}
        gridOptions={gridOptions}
        {...props}
      />
    </div>
  );
};

export default ThemedAgGrid;
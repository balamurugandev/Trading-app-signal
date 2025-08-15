import { themeQuartz } from 'ag-grid-community';

// Dark theme configuration for AG Grid
export const darkGridTheme = themeQuartz.withParams({
  // Background colors
  backgroundColor: "#1f2836",
  browserColorScheme: "dark",
  
  // Chrome and header styling
  chromeBackgroundColor: {
    ref: "foregroundColor",
    mix: 0.07,
    onto: "backgroundColor"
  },
  
  // Text colors
  foregroundColor: "#FFFFFF",
  textColor: "#FFFFFF",
  
  // Header styling
  headerFontSize: 14,
  headerFontWeight: 600,
  headerTextColor: "#FFFFFF",
  headerBackgroundColor: "#2a3441",
  
  // Row styling
  rowBackgroundColor: "#1f2836",
  oddRowBackgroundColor: "#252d3a",
  rowHoverColor: "#3a4553",
  
  // Border colors
  borderColor: "#3a4553",
  rowBorderColor: "#3a4553",
  
  // Selection colors
  selectedRowBackgroundColor: "#4f46e5",
  rangeSelectionBackgroundColor: "#4f46e520",
  
  // Input styling
  inputBackgroundColor: "#2a3441",
  inputBorderColor: "#3a4553",
  inputTextColor: "#FFFFFF",
  inputFocusBorderColor: "#4f46e5",
  
  // Button styling
  buttonBackgroundColor: "#4f46e5",
  buttonTextColor: "#FFFFFF",
  
  // Scrollbar styling
  scrollbarThumbColor: "#3a4553",
  scrollbarTrackColor: "#1f2836",
  
  // Icon colors
  iconColor: "#9ca3af",
  
  // Font styling
  fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  fontSize: 13,
  
  // Cell padding
  cellHorizontalPadding: 12,
  
  // Grid spacing
  gridSize: 4,
  
  // Accent colors for status indicators
  accentColor: "#4f46e5",
  
  // Custom CSS variables for additional styling
  "--ag-alpine-active-color": "#4f46e5",
  "--ag-balham-active-color": "#4f46e5",
  "--ag-material-primary-color": "#4f46e5",
  "--ag-material-accent-color": "#4f46e5"
});

// Light theme configuration (for future use)
export const lightGridTheme = themeQuartz.withParams({
  backgroundColor: "#ffffff",
  browserColorScheme: "light",
  foregroundColor: "#1f2937",
  textColor: "#1f2937",
  headerFontSize: 14,
  headerFontWeight: 600,
  headerTextColor: "#1f2937",
  headerBackgroundColor: "#f9fafb",
  rowBackgroundColor: "#ffffff",
  oddRowBackgroundColor: "#f9fafb",
  rowHoverColor: "#f3f4f6",
  borderColor: "#e5e7eb",
  rowBorderColor: "#e5e7eb",
  selectedRowBackgroundColor: "#4f46e5",
  rangeSelectionBackgroundColor: "#4f46e520",
  inputBackgroundColor: "#ffffff",
  inputBorderColor: "#d1d5db",
  inputTextColor: "#1f2937",
  inputFocusBorderColor: "#4f46e5",
  buttonBackgroundColor: "#4f46e5",
  buttonTextColor: "#ffffff",
  scrollbarThumbColor: "#d1d5db",
  scrollbarTrackColor: "#f9fafb",
  iconColor: "#6b7280",
  fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  fontSize: 13,
  cellHorizontalPadding: 12,
  gridSize: 4,
  accentColor: "#4f46e5"
});

// Theme selector function
export const getGridTheme = (isDark = true) => {
  return isDark ? darkGridTheme : lightGridTheme;
};

// Default export
export default darkGridTheme;
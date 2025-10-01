export const formatCurrency = (value: number, compact = false): string => {
  if (compact) {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
  }
  return `$${value.toLocaleString()}`;
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const chartColors = {
  primary: {
    light: "#121212",
    dark: "#F5F5F3",
  },
  secondary: {
    light: "#C6C6C6",
    dark: "#606060",
  },
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  muted: "#606060",
  border: {
    light: "#DCDAD2",
    dark: "#2C2C2C",
  },
};

export const defaultChartConfig = {
  axis: {
    stroke: "#888888",
    fontSize: 12,
    tickLine: false,
    axisLine: false,
    tickMargin: 15,
    tick: {
      fill: "#606060",
      fontSize: 12,
      fontFamily: "var(--font-sans)",
    },
  },
  grid: {
    strokeDasharray: "3 3",
    vertical: false,
  },
  tooltip: {
    backgroundColor: "hsl(var(--background))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "6px",
  },
};
// Utility functions for formatting numbers and percentages

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${Math.round(percentage)}%`;
}

export function formatDecimal(value: number, decimals: number = 0): string {
  return value.toFixed(decimals);
}

export function formatXP(value: number): string {
  return Math.round(value).toString();
}

export function formatLevel(value: number): string {
  return Math.round(value).toString();
}


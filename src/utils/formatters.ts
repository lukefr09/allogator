const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});
export const formatCurrency = (value: number) => money.format(value);
export const formatPercentage = (value: number) => value.toFixed(2) + '%';
export const formatShares = (value: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 }).format(value);

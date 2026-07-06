export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatBs(amount: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrency(amount: number, currency: 'USD' | 'Bs'): string {
  return currency === 'USD' ? formatUSD(amount) : formatBs(amount);
}

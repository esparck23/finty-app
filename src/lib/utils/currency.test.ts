import { formatUSD, formatBs, formatCurrency } from '@/lib/utils/currency';

describe('currency utils', () => {
  it('formatUSD formatea con símbolo USD', () => {
    expect(formatUSD(1000)).toBe('$1,000.00');
  });

  it('formatBs formatea con símbolo VES (es-VE)', () => {
    const result = formatBs(1000);
    expect(result).toContain('1.000');
    expect(result).toContain('Bs');
  });

  it('formatCurrency delega a formatUSD para USD', () => {
    expect(formatCurrency(50, 'USD')).toBe(formatUSD(50));
  });

  it('formatCurrency delega a formatBs para Bs', () => {
    expect(formatCurrency(50, 'Bs')).toBe(formatBs(50));
  });
});

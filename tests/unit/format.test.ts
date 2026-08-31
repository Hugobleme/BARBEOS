import { describe, it, expect } from 'vitest';
import { formatCurrency, brl } from '../../src/lib/format';

describe('Format Utility', () => {
  it('formats cents correctly into BRL', () => {
    // 5000 cents = R$ 50,00
    const formatted = formatCurrency(5000);
    expect(formatted).toContain('50');
    expect(formatted).toContain(','); // decimal separator in BR
  });

  it('formats decimals correctly into BRL', () => {
    // 50.5 = R$ 50,50
    const formatted = brl(50.5);
    expect(formatted).toContain('50');
    expect(formatted).toContain(',');
  });
});

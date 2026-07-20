import { describe, expect, it } from 'vitest';

import { getRecipientsColumns } from './RecipientsTableView.columns';

const mockT = (key: string, options?: { defaultValue?: string }) =>
  options?.defaultValue || key;

const baseOptions = {
  t: mockT,
  visibleAccountNumbers: new Set<string>(),
  onToggleAccountNumber: () => undefined,
};

describe('getRecipientsColumns', () => {
  it('omits the currency column when showRecipientCurrency is false', () => {
    const columns = getRecipientsColumns({
      ...baseOptions,
      showRecipientCurrency: false,
    });

    expect(columns.map((c) => c.id)).not.toContain('currency');
  });

  it('omits the currency column by default', () => {
    const columns = getRecipientsColumns(baseOptions);

    expect(columns.map((c) => c.id)).not.toContain('currency');
  });

  it('includes the currency column when showRecipientCurrency is true', () => {
    const columns = getRecipientsColumns({
      ...baseOptions,
      showRecipientCurrency: true,
    });

    expect(columns.map((c) => c.id)).toContain('currency');
  });
});

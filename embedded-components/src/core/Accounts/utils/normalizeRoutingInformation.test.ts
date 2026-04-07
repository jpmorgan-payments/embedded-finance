import {
  normalizeRoutingInformation,
  type ApiRoutingEntry,
} from './normalizeRoutingInformation';

describe('normalizeRoutingInformation', () => {
  // ─── V1 shape (current API: type / value) ────────────────────────

  it('normalizes a V1 ABA entry and infers ACH transactionType', () => {
    const result = normalizeRoutingInformation([
      { type: 'ABA', value: '028000024' },
    ]);

    expect(result).toEqual([
      {
        routingCodeType: 'ABA',
        routingNumber: '028000024',
        transactionType: 'ACH',
      },
    ]);
  });

  it('normalizes multiple V1 entries', () => {
    const result = normalizeRoutingInformation([
      { type: 'ABA', value: '028000024' },
      { type: 'SWIFT', value: 'CHASUS33' },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].routingCodeType).toBe('ABA');
    expect(result[1].routingCodeType).toBe('SWIFT');
  });

  // ─── V2 shape (future API: routingCodeType / routingNumber / transactionType) ──

  it('normalizes a V2 entry with transactionType', () => {
    const result = normalizeRoutingInformation([
      {
        routingCodeType: 'ABA',
        routingNumber: '065400137',
        transactionType: 'ACH',
      },
    ]);

    expect(result).toEqual([
      {
        routingCodeType: 'ABA',
        routingNumber: '065400137',
        transactionType: 'ACH',
      },
    ]);
  });

  it('normalizes multiple V2 entries with different transaction types', () => {
    const result = normalizeRoutingInformation([
      {
        routingCodeType: 'ABA',
        routingNumber: '065400137',
        transactionType: 'ACH',
      },
      {
        routingCodeType: 'ABA',
        routingNumber: '065400137',
        transactionType: 'WIRE',
      },
      {
        routingCodeType: 'ABA',
        routingNumber: '065400137',
        transactionType: 'RTP',
      },
    ]);

    expect(result).toHaveLength(3);
    expect(result.map((e) => e.transactionType)).toEqual([
      'ACH',
      'WIRE',
      'RTP',
    ]);
  });

  it('infers ACH when V2 ABA entry omits transactionType', () => {
    const result = normalizeRoutingInformation([
      { routingCodeType: 'ABA', routingNumber: '065400137' },
    ]);

    expect(result).toEqual([
      {
        routingCodeType: 'ABA',
        routingNumber: '065400137',
        transactionType: 'ACH',
      },
    ]);
  });

  it('leaves transactionType undefined for unknown routing code types', () => {
    const result = normalizeRoutingInformation([
      { type: 'SWIFT', value: 'CHASUS33' },
    ]);

    expect(result[0].transactionType).toBeUndefined();
  });

  // ─── V2 fields take precedence when both are present ──────────────

  it('prefers V2 fields over V1 fields', () => {
    const result = normalizeRoutingInformation([
      {
        type: 'ABA',
        value: '000000000',
        routingCodeType: 'ABA',
        routingNumber: '065400137',
        transactionType: 'ACH',
      },
    ]);

    expect(result[0].routingNumber).toBe('065400137');
    expect(result[0].transactionType).toBe('ACH');
  });

  // ─── Edge cases ──────────────────────────────────────────────────

  it('returns empty array for undefined input', () => {
    expect(normalizeRoutingInformation(undefined)).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(normalizeRoutingInformation([])).toEqual([]);
  });

  it('drops entries missing both routing code type and number', () => {
    const result = normalizeRoutingInformation([
      { type: 'ABA', value: '028000024' },
      {} as ApiRoutingEntry,
      { routingCodeType: 'ABA', routingNumber: '065400137' },
    ]);

    expect(result).toHaveLength(2);
  });

  it('drops entries with a code type but no number', () => {
    const result = normalizeRoutingInformation([{ type: 'ABA' }]);
    expect(result).toHaveLength(0);
  });
});

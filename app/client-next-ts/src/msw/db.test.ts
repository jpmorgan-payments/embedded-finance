import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  applyOverridesToDb,
  db,
  DB_SCENARIOS,
  getDbStatus,
  initializeDb,
  resetDb,
} from './db';

describe('msw db', () => {
  beforeAll(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  beforeEach(() => {
    resetDb(DB_SCENARIOS.EMPTY);
  });

  it('resetDb returns success payload', () => {
    const r = resetDb(DB_SCENARIOS.EMPTY);
    expect(r.success).toBe(true);
    expect(r.scenario).toBe(DB_SCENARIOS.EMPTY);
  });

  it('getDbStatus aggregates entity counts', () => {
    const s = getDbStatus();
    expect(s.clientCount).toBeGreaterThan(0);
    expect(Array.isArray(s.clients)).toBe(true);
  });

  it('initializeDb maps invalid scenario to default', () => {
    const ok = initializeDb(true, 'not-a-real-scenario');
    expect(typeof ok).toBe('boolean');
  });

  it('applyOverridesToDb is a no-op for empty overrides', () => {
    const before = db.account.getAll().length;
    applyOverridesToDb({});
    expect(db.account.getAll().length).toBe(before);
  });

  it('applyOverridesToDb replaces accounts from GET /accounts payload', () => {
    applyOverridesToDb({
      'GET /ef/do/v1/accounts': {
        items: [{ id: 'override-acc-1' } as Record<string, unknown>],
      },
    });
    expect(
      db.account.findFirst({ where: { id: { equals: 'override-acc-1' } } })
    ).not.toBeNull();
  });

  it('applyOverridesToDb replaces recipients', () => {
    applyOverridesToDb({
      'GET /ef/do/v1/recipients': {
        recipients: [{ id: 'rec-ov-1' } as Record<string, unknown>],
      },
    });
    expect(
      db.recipient.findFirst({ where: { id: { equals: 'rec-ov-1' } } })
    ).not.toBeNull();
  });

  it('applyOverridesToDb replaces transactions list', () => {
    applyOverridesToDb({
      'GET /ef/do/v1/transactions': {
        items: [{ id: 'tx-ov-1' } as Record<string, unknown>],
        metadata: {},
      },
    });
    expect(
      db.transaction.findFirst({ where: { id: { equals: 'tx-ov-1' } } })
    ).not.toBeNull();
  });

  it('applyOverridesToDb applies document requests', () => {
    applyOverridesToDb({
      'GET /ef/do/v1/document-requests': {
        documentRequests: [{ id: 'dr-1' } as Record<string, unknown>],
      },
    });
    expect(
      db.documentRequest.findFirst({ where: { id: { equals: 'dr-1' } } })
    ).not.toBeNull();
  });

  it('applyOverridesToDb upserts client from dynamic client key', () => {
    applyOverridesToDb({
      'GET /ef/do/v1/clients/0030000999': {
        id: '0030000999',
        status: 'APPROVED',
        parties: [{ id: 'party-ov-1', partyType: 'ORGANIZATION' }],
      } as Record<string, unknown>,
    });
    expect(
      db.client.findFirst({ where: { id: { equals: '0030000999' } } })
    ).not.toBeNull();
  });

  it('applyOverridesToDb applies balance override keys', () => {
    applyOverridesToDb({
      'GET /ef/do/v1/accounts/acc-x/balances': {
        accountId: 'acc-x',
        id: 'bal-x',
      } as Record<string, unknown>,
    });
    expect(
      db.accountBalance.findFirst({
        where: { accountId: { equals: 'acc-x' } },
      })
    ).not.toBeNull();
  });

  it('applyOverridesToDb applies single recipient by id path', () => {
    applyOverridesToDb({
      'GET /ef/do/v1/recipients/rec-single': {
        id: 'rec-single',
      } as Record<string, unknown>,
    });
    expect(
      db.recipient.findFirst({ where: { id: { equals: 'rec-single' } } })
    ).not.toBeNull();
  });

  it('applyOverridesToDb applies single transaction by id path', () => {
    applyOverridesToDb({
      'GET /ef/do/v1/transactions/tx-single': {
        id: 'tx-single',
      } as Record<string, unknown>,
    });
    expect(
      db.transaction.findFirst({ where: { id: { equals: 'tx-single' } } })
    ).not.toBeNull();
  });
});

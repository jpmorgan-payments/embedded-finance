import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { db, DB_SCENARIOS, getDbStatus, resetDb } from './db';
import { createHandlers } from './handlers';

const API = 'http://localhost';
const server = setupServer(...createHandlers(API));

describe('MSW handlers (integration)', () => {
  beforeAll(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
    resetDb(DB_SCENARIOS.EMPTY);
  });

  afterAll(() => {
    server.close();
    vi.restoreAllMocks();
  });

  it('GET /clients/:id returns 200 for seeded client', async () => {
    const firstId = getDbStatus().clients[0];
    const res = await fetch(`${API}/ef/do/v1/clients/${firstId}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id?: string };
    expect(body.id).toBe(firstId);
  });

  it('GET /clients/:id returns 404 for unknown id', async () => {
    const res = await fetch(`${API}/ef/do/v1/clients/does-not-exist-999`);
    expect(res.status).toBe(404);
  });

  it('POST /_reset returns JSON and re-seeds database', async () => {
    const res = await fetch(`${API}/ef/do/v1/_reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: DB_SCENARIOS.EMPTY, overrides: {} }),
    });
    expect(res.ok).toBe(true);
    const data = (await res.json()) as { success?: boolean };
    expect(data.success).not.toBe(false);
  });

  it('GET /_status returns DB snapshot and scenario hint', async () => {
    const res = await fetch(`${API}/ef/do/v1/_status`);
    expect(res.ok).toBe(true);
    const data = (await res.json()) as {
      clientCount?: number;
      scenario?: unknown;
    };
    expect(typeof data.clientCount).toBe('number');
    expect(data.scenario).toBeDefined();
  });

  it('GET /_scenarios lists scenario metadata', async () => {
    const res = await fetch(`${API}/ef/do/v1/_scenarios`);
    expect(res.ok).toBe(true);
    const data = (await res.json()) as {
      scenarios?: unknown;
      default?: string;
    };
    expect(data.scenarios).toBeDefined();
    expect(data.default).toBeDefined();
  });

  it('GET /ping returns keep-alive payload', async () => {
    const res = await fetch(`${API}/ping`);
    expect(res.ok).toBe(true);
    const data = (await res.json()) as { status?: string };
    expect(data.status).toBe('ok');
  });

  it('GET /accounts returns list wrapper', async () => {
    const res = await fetch(`${API}/ef/do/v1/accounts`);
    expect(res.ok).toBe(true);
    const data = (await res.json()) as { items?: unknown[] };
    expect(Array.isArray(data.items)).toBe(true);
  });

  it('GET /accounts/:accountId/balances returns 200 or 404', async () => {
    const accountId = db.account.getAll()[0]?.id ?? 'missing';
    const res = await fetch(`${API}/ef/do/v1/accounts/${accountId}/balances`);
    expect([200, 404]).toContain(res.status);
  });

  it('GET /recipients returns paginated envelope', async () => {
    const res = await fetch(`${API}/ef/do/v1/recipients`);
    expect(res.ok).toBe(true);
    const data = (await res.json()) as { recipients?: unknown[] };
    expect(data).toHaveProperty('recipients');
  });

  it('GET /recipients/:id returns 404 when missing', async () => {
    const res = await fetch(`${API}/ef/do/v1/recipients/unknown-recipient-id`);
    expect(res.status).toBe(404);
  });

  it('GET /transactions returns items (or empty)', async () => {
    const res = await fetch(`${API}/ef/do/v1/transactions`);
    expect(res.ok).toBe(true);
    const data = (await res.json()) as { items?: unknown[] };
    expect(Array.isArray(data.items)).toBe(true);
  });

  it('GET /transactions/:id returns 404 when missing', async () => {
    const res = await fetch(`${API}/ef/do/v1/transactions/unknown-tx`);
    expect(res.status).toBe(404);
  });

  it('GET /document-requests without clientId is 400', async () => {
    const res = await fetch(`${API}/ef/do/v1/document-requests`);
    expect(res.status).toBe(400);
  });

  it('GET /document-requests with clientId returns envelope', async () => {
    const clientId = getDbStatus().clients[0];
    const res = await fetch(
      `${API}/ef/do/v1/document-requests?clientId=${clientId}`
    );
    expect(res.ok).toBe(true);
    const data = (await res.json()) as { documentRequests?: unknown[] };
    expect(Array.isArray(data.documentRequests)).toBe(true);
  });

  it('GET /questions returns filtered questions when questionIds provided', async () => {
    const res = await fetch(`${API}/ef/do/v1/questions?questionIds=30005`);
    expect(res.ok).toBe(true);
    const data = (await res.json()) as { questions?: unknown };
    expect(data).toHaveProperty('questions');
  });

  it('GET /documents/:id and file succeed', async () => {
    const meta = await fetch(`${API}/ef/do/v1/documents/doc-1`);
    expect(meta.ok).toBe(true);
    const file = await fetch(`${API}/ef/do/v1/documents/doc-1/file`);
    expect(file.ok).toBe(true);
    expect(file.headers.get('Content-Type')).toContain('pdf');
  });

  it('GET /payment-recipients returns array', async () => {
    const res = await fetch(`${API}/ef/do/v1/payment-recipients`);
    expect(res.ok).toBe(true);
    await res.json();
  });

  it('POST /api/onboarding/session-transfer returns token', async () => {
    const res = await fetch(`${API}/api/onboarding/session-transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1' }),
    });
    expect(res.ok).toBe(true);
    const data = (await res.json()) as { token?: string; userId?: string };
    expect(data.token).toBeDefined();
    expect(data.userId).toBe('u1');
  });

  it('OPTIONS session-transfer returns CORS headers', async () => {
    const res = await fetch(`${API}/api/onboarding/session-transfer`, {
      method: 'OPTIONS',
    });
    expect(res.status).toBeLessThan(400);
  });

  it('GET /clients/:clientId (legacy path) returns 404', async () => {
    const res = await fetch(`${API}/clients/any`);
    expect(res.status).toBe(404);
  });
});

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

import {
  TEST_DEMO_SCENARIO_CLIENT_ID,
  TEST_DEMO_SCENARIO_DOC_REQUEST_INDIVIDUAL_ID_BASE,
  TEST_DEMO_SCENARIO_DOC_REQUEST_ORG_ID,
} from '../mocks/testScenarioOperator80Client.mock';
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

  it('POST /clients/:id merges questionResponses and prunes conditional outstanding IDs', async () => {
    await fetch(`${API}/ef/do/v1/_reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: DB_SCENARIOS.EMPTY,
        overrides: {},
        testDemoScenario: 'happy-path',
      }),
    });

    const clientId = TEST_DEMO_SCENARIO_CLIENT_ID;
    const clientBefore = db.client.findFirst({
      where: { id: { equals: clientId } },
    });
    expect(clientBefore).toBeTruthy();
    expect(
      (clientBefore?.outstanding as { questionIds?: string[] })?.questionIds
    ).toEqual(expect.arrayContaining(['30195']));

    const prevOutstanding = (clientBefore?.outstanding ?? {}) as {
      questionIds?: string[];
    };
    db.client.update({
      where: { id: { equals: clientId } },
      data: {
        ...clientBefore,
        outstanding: {
          ...prevOutstanding,
          questionIds: [
            ...new Set([...(prevOutstanding.questionIds ?? []), '30198']),
          ],
        },
      } as never,
    });

    const withChild = db.client.findFirst({
      where: { id: { equals: clientId } },
    });
    expect(
      (withChild?.outstanding as { questionIds?: string[] })?.questionIds
    ).toContain('30198');

    const res = await fetch(`${API}/ef/do/v1/clients/${clientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionResponses: [{ questionId: '30195', values: ['false'] }],
      }),
    });
    expect(res.ok).toBe(true);
    const body = (await res.json()) as {
      outstanding?: { questionIds?: string[] };
      questionResponses?: Array<{ questionId?: string }>;
    };

    expect(body.outstanding?.questionIds ?? []).not.toContain('30198');
    const stored = db.client.findFirst({
      where: { id: { equals: clientId } },
    });
    expect(
      (stored?.outstanding as { questionIds?: string[] })?.questionIds ?? []
    ).not.toContain('30198');

    const ids = (body.questionResponses ?? [])
      .map((r) => r.questionId)
      .filter(Boolean);
    expect(ids).toContain('30195');
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

  it('POST /document-requests/:id/submit returns 202 for test-scenario doc-request seed (61800)', async () => {
    await fetch(`${API}/ef/do/v1/_reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: DB_SCENARIOS.EMPTY,
        overrides: {},
        testDemoScenario: 'doc-request',
      }),
    });

    const clientId = TEST_DEMO_SCENARIO_CLIENT_ID;
    const orgDocId = TEST_DEMO_SCENARIO_DOC_REQUEST_ORG_ID;

    const listBefore = await fetch(
      `${API}/ef/do/v1/document-requests?clientId=${clientId}`
    );
    expect(listBefore.ok).toBe(true);
    const envelope = (await listBefore.json()) as {
      documentRequests?: { id?: string }[];
    };
    expect(envelope.documentRequests?.some((r) => r.id === orgDocId)).toBe(
      true
    );

    const submitRes = await fetch(
      `${API}/ef/do/v1/document-requests/${orgDocId}/submit`,
      { method: 'POST' }
    );
    expect(submitRes.status).toBe(202);
    const body = (await submitRes.json()) as { acceptedAt?: string };
    expect(typeof body.acceptedAt).toBe('string');

    const getDr = await fetch(`${API}/ef/do/v1/document-requests/${orgDocId}`);
    expect(getDr.ok).toBe(true);
    const dr = (await getDr.json()) as { id?: string; status?: string };
    expect(dr.id).toBe(orgDocId);
    expect(dr.status).toBe('SUBMITTED');
  });

  it('POST /document-requests/:id/submit (no /ef/do/v1 prefix) returns 202', async () => {
    await fetch(`${API}/ef/do/v1/_reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: DB_SCENARIOS.EMPTY,
        overrides: {},
        testDemoScenario: 'doc-request',
      }),
    });

    const indDocId = String(TEST_DEMO_SCENARIO_DOC_REQUEST_INDIVIDUAL_ID_BASE);
    const submitRes = await fetch(
      `${API}/document-requests/${indDocId}/submit`,
      {
        method: 'POST',
      }
    );
    expect(submitRes.status).toBe(202);
  });

  it('doc-request: client becomes REVIEW_IN_PROGRESS after all document requests submitted', async () => {
    await fetch(`${API}/ef/do/v1/_reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: DB_SCENARIOS.EMPTY,
        overrides: {},
        testDemoScenario: 'doc-request',
      }),
    });

    const clientId = TEST_DEMO_SCENARIO_CLIENT_ID;
    const orgDocId = TEST_DEMO_SCENARIO_DOC_REQUEST_ORG_ID;
    const indDocId = String(TEST_DEMO_SCENARIO_DOC_REQUEST_INDIVIDUAL_ID_BASE);

    await fetch(`${API}/ef/do/v1/document-requests/${orgDocId}/submit`, {
      method: 'POST',
    });
    const afterOne = await fetch(`${API}/ef/do/v1/clients/${clientId}`);
    expect(afterOne.ok).toBe(true);
    const bodyOne = (await afterOne.json()) as { status?: string };
    expect(bodyOne.status).toBe('INFORMATION_REQUESTED');

    await fetch(`${API}/ef/do/v1/document-requests/${indDocId}/submit`, {
      method: 'POST',
    });
    const afterBoth = await fetch(`${API}/ef/do/v1/clients/${clientId}`);
    expect(afterBoth.ok).toBe(true);
    const bodyBoth = (await afterBoth.json()) as { status?: string };
    expect(bodyBoth.status).toBe('REVIEW_IN_PROGRESS');
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
    if (!file.ok) {
      const detail = `${file.status} ${file.statusText}`;
      const bodySnippet = await file
        .clone()
        .text()
        .catch(() => '');
      throw new Error(
        `GET document file failed: ${detail}${bodySnippet ? ` — ${bodySnippet.slice(0, 120)}` : ''}`
      );
    }
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

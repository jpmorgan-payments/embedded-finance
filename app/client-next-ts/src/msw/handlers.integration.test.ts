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

import { TEST_SCENARIO_BUNDLE_FASTER_FULFILMENT_CLIENT_ID } from '../mocks/testScenarioFasterFulfilmentClient.mock';
import { TEST_SCENARIO_BUNDLE_HEALTH_BENEFIT_CLIENT_ID } from '../mocks/testScenarioHealthBenefitClient.mock';
import { TEST_SCENARIO_BUNDLE_MULTI_LINKED_CLIENT_ID } from '../mocks/testScenarioMultiLinkedIllustrationClient.mock';
import { TEST_SCENARIO_BUNDLE_NAICS_CODES_CLIENT_ID } from '../mocks/testScenarioNaicsCodesClient.mock';
import {
  TEST_DEMO_SCENARIO_CLIENT_ID,
  TEST_DEMO_SCENARIO_DOC_REQUEST_INDIVIDUAL_ID_BASE,
  TEST_DEMO_SCENARIO_DOC_REQUEST_ORG_ID,
} from '../mocks/testScenarioOperator80Client.mock';
import {
  applyTestDemoScenario,
  db,
  DB_SCENARIOS,
  getDbStatus,
  resetDb,
} from './db';
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
    resetDb(DB_SCENARIOS.EMPTY);
    applyTestDemoScenario('happy-path', 'test-scenario');

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

  it.each([
    {
      mode: 'happy-path' as const,
      orgType: 'LIMITED_LIABILITY_COMPANY',
      hasPtc: false,
    },
    {
      mode: 'happy-path-ptc' as const,
      orgType: 'C_CORPORATION',
      hasPtc: true,
      ticker: 'FULFL',
      exchange: 'XNAS',
    },
  ] as const)(
    'test-scenario-4: $mode seeds Faster Fulfilment org without/with PTC',
    async ({ mode, orgType, hasPtc, ...ptc }) => {
      await fetch(`${API}/ef/do/v1/_reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: DB_SCENARIOS.EMPTY,
          overrides: {},
          testDemoScenario: mode,
          testScenarioBundle: 'test-scenario-4',
        }),
      });

      const clientRes = await fetch(
        `${API}/ef/do/v1/clients/${TEST_SCENARIO_BUNDLE_FASTER_FULFILMENT_CLIENT_ID}`
      );
      expect(clientRes.ok).toBe(true);
      const client = (await clientRes.json()) as {
        parties?: Array<{
          roles?: string[];
          organizationDetails?: {
            organizationType?: string;
            publiclyTraded?: { stockExchange?: string; tickerSymbol?: string };
          };
        }>;
      };
      const orgParty = (client.parties ?? []).find((p) =>
        (p.roles ?? []).includes('CLIENT')
      );
      expect(orgParty?.organizationDetails?.organizationType).toBe(orgType);
      if (hasPtc) {
        expect(orgParty?.organizationDetails?.publiclyTraded).toEqual({
          stockExchange: ptc.exchange,
          tickerSymbol: ptc.ticker,
        });
      } else {
        expect(orgParty?.organizationDetails?.publiclyTraded).toBeUndefined();
      }
    }
  );

  it.each([
    ['test-scenario-2', TEST_SCENARIO_BUNDLE_MULTI_LINKED_CLIENT_ID],
    ['test-scenario-4', TEST_SCENARIO_BUNDLE_FASTER_FULFILMENT_CLIENT_ID],
  ] as const)(
    '%s: multi-linked-start-3 seeds 3 LINKED_ACCOUNT recipient(s)',
    async (testScenarioBundle, clientId) => {
      await fetch(`${API}/ef/do/v1/_reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: DB_SCENARIOS.EMPTY,
          overrides: {},
          testDemoScenario: 'multi-linked-start-3',
          testScenarioBundle,
        }),
      });

      const clientRes = await fetch(`${API}/ef/do/v1/clients/${clientId}`);
      expect(clientRes.ok).toBe(true);
      const client = (await clientRes.json()) as { status?: string };
      expect(client.status).toBe('APPROVED');

      const recRes = await fetch(`${API}/ef/do/v1/recipients`);
      expect(recRes.ok).toBe(true);
      const data = (await recRes.json()) as {
        recipients?: Array<{ type?: string; id?: string }>;
      };
      const linked = (data.recipients ?? []).filter(
        (r) => r.type === 'LINKED_ACCOUNT'
      );
      expect(linked.length).toBe(3);
      const idPrefix =
        testScenarioBundle === 'test-scenario-4'
          ? 'ts-b4-linked'
          : 'ts-b2-linked';
      expect(linked.map((r) => r.id)).toEqual(
        expect.arrayContaining([
          `${idPrefix}-001`,
          `${idPrefix}-002`,
          `${idPrefix}-003`,
        ])
      );
    }
  );

  it.each([
    {
      bundle: 'test-scenario',
      clientId: TEST_DEMO_SCENARIO_CLIENT_ID,
      orgPartyId: '2100533138',
      expectedName: 'Operator 80 Palo Alto CA',
    },
    {
      bundle: 'test-scenario-2',
      clientId: TEST_SCENARIO_BUNDLE_MULTI_LINKED_CLIENT_ID,
      orgPartyId: '2100535100',
      expectedName: 'Top Dog Construction, LLC',
    },
    {
      bundle: 'test-scenario-3',
      clientId: TEST_SCENARIO_BUNDLE_HEALTH_BENEFIT_CLIENT_ID,
      orgPartyId: '2100535200',
      expectedName: 'Health & Benefit Solutions, LLC',
    },
    {
      bundle: 'test-scenario-4',
      clientId: TEST_SCENARIO_BUNDLE_FASTER_FULFILMENT_CLIENT_ID,
      orgPartyId: '2100535300',
      expectedName: 'Faster Fulfilment Corp.',
    },
  ] as const)(
    '$bundle: partyId-only linked account has org display name',
    async ({ bundle, clientId, orgPartyId, expectedName }) => {
      await fetch(`${API}/ef/do/v1/_reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: DB_SCENARIOS.EMPTY,
          overrides: {},
          testDemoScenario: 'linked-account-active',
          testScenarioBundle: bundle,
        }),
      });

      const accountSuffix = orgPartyId.slice(-4);
      const createRes = await fetch(`${API}/ef/do/v1/recipients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Demo-Scenario': 'linked-account-active',
        },
        body: JSON.stringify({
          type: 'LINKED_ACCOUNT',
          clientId,
          partyId: orgPartyId,
          account: {
            type: 'CHECKING',
            number: `9000${accountSuffix}`,
            countryCode: 'US',
            routingInformation: [
              {
                routingCodeType: 'USABA',
                routingNumber: '021000021',
                transactionType: 'ACH',
              },
            ],
          },
        }),
      });
      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as {
        partyDetails?: { businessName?: string };
      };
      expect(created.partyDetails?.businessName).toBe(expectedName);

      const recRes = await fetch(`${API}/ef/do/v1/recipients`);
      const data = (await recRes.json()) as {
        recipients?: Array<{
          partyDetails?: { businessName?: string; type?: string };
          account?: { number?: string };
        }>;
      };
      const linked = (data.recipients ?? []).find(
        (r) => r.account?.number === `9000${accountSuffix}`
      );
      expect(linked?.partyDetails?.businessName).toBe(expectedName);
      expect(linked?.partyDetails?.type).toBe('ORGANIZATION');
    }
  );

  it.each([
    {
      bundle: 'test-scenario-2',
      clientId: TEST_SCENARIO_BUNDLE_MULTI_LINKED_CLIENT_ID,
      expectedName: 'Top Dog Construction, LLC',
    },
    {
      bundle: 'test-scenario-4',
      clientId: TEST_SCENARIO_BUNDLE_FASTER_FULFILMENT_CLIENT_ID,
      expectedName: 'Faster Fulfilment Corp.',
    },
  ] as const)(
    '$bundle: stub INDIVIDUAL partyDetails without names resolves to org on GET',
    async ({ bundle, clientId, expectedName }) => {
      await fetch(`${API}/ef/do/v1/_reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: DB_SCENARIOS.EMPTY,
          overrides: {},
          testDemoScenario: 'linked-account-active',
          testScenarioBundle: bundle,
        }),
      });

      const createRes = await fetch(`${API}/ef/do/v1/recipients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Demo-Scenario': 'linked-account-active',
        },
        body: JSON.stringify({
          type: 'LINKED_ACCOUNT',
          clientId,
          partyDetails: { type: 'INDIVIDUAL', firstName: '', lastName: '' },
          account: {
            type: 'CHECKING',
            number: '1111222333',
            countryCode: 'US',
            routingInformation: [
              {
                routingCodeType: 'USABA',
                routingNumber: '021000021',
                transactionType: 'ACH',
              },
            ],
          },
        }),
      });
      expect(createRes.status).toBe(201);

      const recRes = await fetch(`${API}/ef/do/v1/recipients`);
      const data = (await recRes.json()) as {
        recipients?: Array<{
          partyDetails?: { businessName?: string; type?: string };
          account?: { number?: string };
        }>;
      };
      const linked = (data.recipients ?? []).find(
        (r) => r.account?.number === '1111222333'
      );
      expect(linked?.partyDetails?.businessName).toBe(expectedName);
      expect(linked?.partyDetails?.type).toBe('ORGANIZATION');
    }
  );

  it.each(['linked-account-approved', 'linked-account-active'] as const)(
    'test-scenario-2: %s starts with no pre-linked LINKED_ACCOUNT recipients',
    async (testDemoScenario) => {
      await fetch(`${API}/ef/do/v1/_reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: DB_SCENARIOS.EMPTY,
          overrides: {},
          testDemoScenario,
          testScenarioBundle: 'test-scenario-2',
        }),
      });

      const recRes = await fetch(`${API}/ef/do/v1/recipients`);
      expect(recRes.ok).toBe(true);
      const data = (await recRes.json()) as {
        recipients?: Array<{ type?: string }>;
      };
      const linked = (data.recipients ?? []).filter(
        (r) => r.type === 'LINKED_ACCOUNT'
      );
      expect(linked.length).toBe(0);
    }
  );

  it('test-scenario-5: naics-codes-dashboard seeds APPROVED client and wallet data', async () => {
    await fetch(`${API}/ef/do/v1/_reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: DB_SCENARIOS.EMPTY,
        overrides: {},
        testDemoScenario: 'naics-codes-dashboard',
        testScenarioBundle: 'test-scenario-5',
      }),
    });

    const clientRes = await fetch(
      `${API}/ef/do/v1/clients/${TEST_SCENARIO_BUNDLE_NAICS_CODES_CLIENT_ID}`
    );
    expect(clientRes.ok).toBe(true);
    const client = (await clientRes.json()) as { status?: string };
    expect(client.status).toBe('APPROVED');

    const accountsRes = await fetch(
      `${API}/ef/do/v1/accounts?clientId=${TEST_SCENARIO_BUNDLE_NAICS_CODES_CLIENT_ID}`
    );
    const accounts = (await accountsRes.json()) as {
      items?: Array<{
        id?: string;
        clientId?: string;
        category?: string;
        paymentRoutingInformation?: { accountNumber?: string };
      }>;
    };
    expect(accounts.items ?? []).toHaveLength(1);
    expect(accounts.items?.[0]?.category).toBe('LIMITED_DDA_PAYMENTS');
    expect(accounts.items?.[0]?.paymentRoutingInformation?.accountNumber).toBe(
      '445566778899'
    );

    const recipientsRes = await fetch(`${API}/ef/do/v1/recipients`);
    const recipients = (await recipientsRes.json()) as {
      recipients?: Array<{ type?: string }>;
    };
    const paymentRecipients = (recipients.recipients ?? []).filter(
      (r) => r.type === 'RECIPIENT'
    );
    expect(paymentRecipients.length).toBe(3);
  });

  it('test-scenario-5: selecting NAICS code adds assessment questions to outstanding', async () => {
    await fetch(`${API}/ef/do/v1/_reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: DB_SCENARIOS.EMPTY,
        overrides: {},
        testDemoScenario: 'naics-codes-onboarding',
        testScenarioBundle: 'test-scenario-5',
      }),
    });

    const clientRes = await fetch(
      `${API}/ef/do/v1/clients/${TEST_SCENARIO_BUNDLE_NAICS_CODES_CLIENT_ID}`
    );
    const client = (await clientRes.json()) as {
      parties?: Array<{ id?: string }>;
    };
    const orgPartyId = client.parties?.[0]?.id;
    expect(orgPartyId).toBeDefined();

    await fetch(`${API}/ef/do/v1/parties/${orgPartyId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationDetails: {
          industry: { codeType: 'NAICS', code: '525996' },
        },
      }),
    });

    const afterIndustry = await fetch(
      `${API}/ef/do/v1/clients/${TEST_SCENARIO_BUNDLE_NAICS_CODES_CLIENT_ID}`
    );
    const updated = (await afterIndustry.json()) as {
      outstanding?: { questionIds?: string[] };
    };
    expect(updated.outstanding?.questionIds ?? []).toEqual(
      expect.arrayContaining(['30012', '30195'])
    );

    const viaGet = await fetch(
      `${API}/ef/do/v1/clients/${TEST_SCENARIO_BUNDLE_NAICS_CODES_CLIENT_ID}`
    );
    const viaGetBody = (await viaGet.json()) as {
      outstanding?: { questionIds?: string[] };
    };
    expect(viaGetBody.outstanding?.questionIds ?? []).toEqual(
      expect.arrayContaining([
        '30012',
        '30013',
        '30015',
        '30032',
        '30075',
        '30163',
        '30164',
        '30165',
        '30167',
        '30169',
        '30171',
        '30173',
        '30174',
        '30178',
        '30179',
        '30181',
        '30182',
        '30183',
        '30185',
        '30187',
        '30189',
        '30191',
        '30195',
      ])
    );
  });

  it('test-scenario-5: answering NAICS questions auto-approves client', async () => {
    await fetch(`${API}/ef/do/v1/_reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: DB_SCENARIOS.EMPTY,
        overrides: {},
        testDemoScenario: 'naics-codes-onboarding',
        testScenarioBundle: 'test-scenario-5',
      }),
    });

    const naicsResponses = [
      { questionId: '30012', values: ['Investment Activities'] },
      { questionId: '30013', values: ['Limited Partners of funds'] },
      { questionId: '30015', values: ['Limited partner contributions'] },
      { questionId: '30032', values: ['United States'] },
      { questionId: '30075', values: ['Fund administration services'] },
      { questionId: '30163', values: ['No'] },
      { questionId: '30164', values: ['Yes'] },
      { questionId: '30165', values: ['Special investment purposes', 'Finance purposes', 'Holding securities', 'Real Estate Investment', 'Other'] },
      { questionId: '30167', values: ['Buy and sell property and assets', 'Buy and sell investments', 'Buy and sell businesses', 'Lending', 'Other'] },
      { questionId: '30169', values: ['Long/Short', 'Convertible Arbitrage', 'Dedicated Short Bias', 'Emerging Markets', 'Risk Arbitrage', 'Equity Dividend Fund', 'Capital Appreciation Fund', 'Global Small Cap Fund', 'High Yield Bond Fund', 'Strategic Income Opportunities Fund', 'Balanced', 'Equity', 'Fixed Income', 'Cash', 'Alternatives', 'Real Estate', 'Other'] },
      { questionId: '30171', values: ['Institutional Investors', 'High Net Worth Individuals', 'Fund of Funds', 'Pension Funds'] },
      { questionId: '30173', values: ['10000000'] },
      { questionId: '30174', values: ['No'] },
      { questionId: '30178', values: ['Yes'] },
      { questionId: '30179', values: ['No'] },
      { questionId: '30181', values: ['Registered', 'Affiliated Adviser'] },
      { questionId: '30182', values: ['12 months'] },
      { questionId: '30183', values: ['KPMG', 'Deloitte & Touché', 'Ernst & Young', 'PwC', 'Other'] },
      { questionId: '30185', values: ['United States'] },
      { questionId: '30187', values: ['No'] },
      { questionId: '30189', values: ['No'] },
      { questionId: '30191', values: ['No'] },
      { questionId: '30195', values: ['No'] },
    ];

    const updateRes = await fetch(
      `${API}/ef/do/v1/clients/${TEST_SCENARIO_BUNDLE_NAICS_CODES_CLIENT_ID}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionResponses: naicsResponses }),
      }
    );
    expect(updateRes.ok).toBe(true);
    const body = (await updateRes.json()) as { status?: string };
    expect(body.status).toBe('APPROVED');
  });
});

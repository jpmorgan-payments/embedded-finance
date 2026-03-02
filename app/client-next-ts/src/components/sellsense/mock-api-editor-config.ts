/**
 * Config for SellSense Mock API Editor: editable endpoints and path normalization.
 * Used by the drawer (list + fetch URL) and by MSW handlers (override key lookup).
 */

export interface MockEndpointConfig {
  key: string;
  method: 'GET';
  pathPattern: string;
  label: string;
}

/** Path patterns use :param placeholders (e.g. :clientId, :accountId). */
export const MOCK_API_EDITOR_ENDPOINTS: MockEndpointConfig[] = [
  {
    key: 'client',
    method: 'GET',
    pathPattern: '/ef/do/v1/clients/:clientId',
    label: 'Client',
  },
  {
    key: 'accounts',
    method: 'GET',
    pathPattern: '/ef/do/v1/accounts',
    label: 'Accounts',
  },
  {
    key: 'account-balances',
    method: 'GET',
    pathPattern: '/ef/do/v1/accounts/:accountId/balances',
    label: 'Account balances',
  },
  {
    key: 'recipients',
    method: 'GET',
    pathPattern: '/ef/do/v1/recipients',
    label: 'Recipients',
  },
  {
    key: 'transactions',
    method: 'GET',
    pathPattern: '/ef/do/v1/transactions',
    label: 'Transactions',
  },
  {
    key: 'document-requests',
    method: 'GET',
    pathPattern: '/ef/do/v1/document-requests',
    label: 'Document requests',
  },
  {
    key: 'recipient-by-id',
    method: 'GET',
    pathPattern: '/ef/do/v1/recipients/:recipientId',
    label: 'Recipient by ID',
  },
  {
    key: 'transaction-by-id',
    method: 'GET',
    pathPattern: '/ef/do/v1/transactions/:id',
    label: 'Transaction by ID',
  },
];

/**
 * Build the override key for localStorage and MSW (method + path pattern).
 */
export function getOverrideKey(method: string, pathPattern: string): string {
  return `${method} ${pathPattern}`;
}

/**
 * Normalize request path to a path pattern by matching against config.
 * Returns the override key (method + pathPattern) if the request matches an editable endpoint, else null.
 */
export function getOverrideKeyFromRequest(
  method: string,
  pathname: string
): string | null {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  for (const config of MOCK_API_EDITOR_ENDPOINTS) {
    if (config.method !== method) continue;
    const patternRegex = pathPatternToRegex(config.pathPattern);
    if (patternRegex.test(path)) {
      return getOverrideKey(config.method, config.pathPattern);
    }
  }
  return null;
}

/**
 * Convert path pattern with :param placeholders to a RegExp that matches actual paths.
 */
function pathPatternToRegex(pathPattern: string): RegExp {
  const escaped = pathPattern
    .split('/')
    .map((segment) =>
      segment.startsWith(':')
        ? '[^/]+'
        : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    )
    .join('/');
  return new RegExp(`^${escaped}$`);
}

/**
 * Get the fetch URL for an endpoint for the "current" scenario.
 * For parameterized endpoints, pass clientId/accountId/recipientId/transactionId so the fetch returns the same shape the app would see.
 */
export function getFetchUrlForEndpoint(
  config: MockEndpointConfig,
  params: {
    clientId?: string;
    accountId?: string;
    recipientId?: string;
    transactionId?: string;
  }
): string {
  let path = config.pathPattern;
  if (path.includes(':clientId') && params.clientId) {
    path = path.replace(':clientId', params.clientId);
  }
  if (path.includes(':accountId') && params.accountId) {
    path = path.replace(':accountId', params.accountId);
  }
  if (path.includes(':recipientId') && params.recipientId) {
    path = path.replace(':recipientId', params.recipientId);
  }
  if (path.includes(':id') && params.transactionId) {
    path = path.replace(':id', params.transactionId);
  }
  return path;
}

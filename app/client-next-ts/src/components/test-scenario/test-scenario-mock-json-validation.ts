import { MOCK_API_EDITOR_ENDPOINTS } from '@/components/sellsense/mock-api-editor-config';

export type JsonValidationResult = {
  valid: boolean;
  message: string;
  level: 'success' | 'warning' | 'error';
};

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function matchesOverrideKey(key: string): boolean {
  if (!key.startsWith('GET /ef/do/v1/')) return false;
  const path = key.slice(4);
  return MOCK_API_EDITOR_ENDPOINTS.some((endpoint) =>
    pathPatternToRegex(endpoint.pathPattern).test(path)
  );
}

function validateEndpointPayload(
  key: string,
  payload: unknown
): JsonValidationResult | null {
  if (!isPlainObject(payload)) {
    return {
      valid: false,
      message: `${key}: payload must be a JSON object`,
      level: 'error',
    };
  }

  if (key === 'GET /ef/do/v1/recipients') {
    if (
      payload.recipients !== undefined &&
      !Array.isArray(payload.recipients)
    ) {
      return {
        valid: false,
        message: 'recipients key must be an array',
        level: 'error',
      };
    }
  }

  if (key === 'GET /ef/do/v1/accounts') {
    if (payload.items !== undefined && !Array.isArray(payload.items)) {
      return {
        valid: false,
        message: 'accounts override must use an items array',
        level: 'error',
      };
    }
  }

  if (key === 'GET /ef/do/v1/transactions') {
    if (payload.items !== undefined && !Array.isArray(payload.items)) {
      return {
        valid: false,
        message: 'transactions override must use an items array',
        level: 'error',
      };
    }
  }

  if (key === 'GET /ef/do/v1/document-requests') {
    if (
      payload.documentRequests !== undefined &&
      !Array.isArray(payload.documentRequests)
    ) {
      return {
        valid: false,
        message: 'documentRequests key must be an array',
        level: 'error',
      };
    }
  }

  if (key.startsWith('GET /ef/do/v1/clients/')) {
    if (typeof payload.id !== 'string' || payload.id.length === 0) {
      return {
        valid: false,
        message: 'client override must include a string id',
        level: 'error',
      };
    }
    if (payload.parties !== undefined && !Array.isArray(payload.parties)) {
      return {
        valid: false,
        message: 'client parties must be an array when provided',
        level: 'error',
      };
    }
  }

  return null;
}

export function validateClientPatchJson(
  parsed: Record<string, unknown>
): JsonValidationResult {
  if (Object.keys(parsed).length === 0) {
    return {
      valid: true,
      message: 'Empty patch — no client fields will be changed',
      level: 'warning',
    };
  }

  return {
    valid: true,
    message: `Valid patch (${Object.keys(parsed).length} top-level field(s))`,
    level: 'success',
  };
}

export function validateClientOverrideJson(
  parsed: Record<string, unknown>,
  expectedClientId: string
): JsonValidationResult {
  if (typeof parsed.id !== 'string' || parsed.id.length === 0) {
    return {
      valid: false,
      message: 'Client override must include a string "id" field',
      level: 'error',
    };
  }

  if (parsed.id !== expectedClientId) {
    return {
      valid: false,
      message: `Client id "${parsed.id}" does not match seeded client ${expectedClientId}`,
      level: 'error',
    };
  }

  if (parsed.parties !== undefined && !Array.isArray(parsed.parties)) {
    return {
      valid: false,
      message: 'parties must be an array when provided',
      level: 'error',
    };
  }

  return {
    valid: true,
    message: `Valid client override for ${expectedClientId}`,
    level: 'success',
  };
}

export function validateEndpointOverridesJson(
  parsed: Record<string, unknown>
): JsonValidationResult {
  const keys = Object.keys(parsed);
  if (keys.length === 0) {
    return {
      valid: true,
      message: 'No endpoint overrides configured',
      level: 'warning',
    };
  }

  for (const key of keys) {
    if (!matchesOverrideKey(key)) {
      return {
        valid: false,
        message: `Unknown override key "${key}". Keys must match MSW GET /ef/do/v1/... paths.`,
        level: 'error',
      };
    }

    const payloadError = validateEndpointPayload(key, parsed[key]);
    if (payloadError) return payloadError;
  }

  return {
    valid: true,
    message: `Valid overrides (${keys.length} endpoint key(s))`,
    level: 'success',
  };
}

import { describe, expect, test } from 'vitest';

import { GatewayScreenFormSchema } from './GatewayScreen.schema';

describe('GatewayScreenFormSchema', () => {
  test('accepts registered business + LLC', () => {
    const r = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: 'REGISTERED_BUSINESS',
        specificOrganizationType: 'LIMITED_LIABILITY_COMPANY',
      },
    });
    expect(r.success).toBe(true);
  });

  test('rejects invalid generalOrganizationType', () => {
    const r = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: 'INVALID_GENERAL',
        specificOrganizationType: 'LIMITED_LIABILITY_COMPANY',
      },
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues.length).toBeGreaterThan(0);
  });

  test('rejects invalid specificOrganizationType', () => {
    const r = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: 'REGISTERED_BUSINESS',
        specificOrganizationType: 'INVALID_SPECIFIC',
      },
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues.length).toBeGreaterThan(0);
  });

  test('requires non-empty selections', () => {
    const emptyGeneral = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: '',
        specificOrganizationType: 'LIMITED_LIABILITY_COMPANY',
      },
    });
    expect(emptyGeneral.success).toBe(false);

    const emptySpecific = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: 'REGISTERED_BUSINESS',
        specificOrganizationType: '',
      },
    });
    expect(emptySpecific.success).toBe(false);
  });
});

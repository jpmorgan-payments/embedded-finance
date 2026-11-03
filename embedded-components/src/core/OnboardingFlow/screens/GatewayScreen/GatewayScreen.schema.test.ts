import {
  activateI18nInstance,
  deactivateI18nInstance,
} from '@/i18n/activeI18n';
import { createI18nInstance } from '@/i18n/config';
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

  test('module-level messages follow the active provider locale', () => {
    const emptyGeneral = {
      organizationTypeHierarchy: {
        generalOrganizationType: '',
        specificOrganizationType: 'LIMITED_LIABILITY_COMPANY',
      },
    };
    const firstMessage = () =>
      GatewayScreenFormSchema.safeParse(emptyGeneral).error?.issues[0]?.message;

    expect(firstMessage()).toBe('This field is required');
    const french = createI18nInstance({ name: 'frCA' });
    activateI18nInstance(french);
    try {
      expect(firstMessage()).toBe('Ce champ est requis');
    } finally {
      deactivateI18nInstance(french);
    }
  });
});

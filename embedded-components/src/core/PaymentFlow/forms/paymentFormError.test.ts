import {
  activateI18nInstance,
  deactivateI18nInstance,
} from '@/i18n/activeI18n';
import { createI18nInstance } from '@/i18n/config';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { paymentFormError } from './paymentFormError';

describe('paymentFormError', () => {
  const schema = z.string().min(1, paymentFormError('bankNameRequired'));
  const firstMessage = () => schema.safeParse('').error?.issues[0]?.message;

  it('resolves the message in the active provider locale', () => {
    expect(firstMessage()).toBe('Bank name is required');

    const spanish = createI18nInstance({ name: 'esUS' });
    activateI18nInstance(spanish);
    try {
      expect(firstMessage()).toBe('El nombre del banco es obligatorio');
    } finally {
      deactivateI18nInstance(spanish);
    }
  });
});

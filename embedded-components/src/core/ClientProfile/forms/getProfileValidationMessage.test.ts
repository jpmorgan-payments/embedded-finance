import { i18n } from '@/i18n/config';
import { describe, expect, test } from 'vitest';

import { getProfileValidationMessage } from './getProfileValidationMessage';

describe('getProfileValidationMessage', () => {
  test('interpolates field names and counts from onboarding validation tokens', () => {
    const messages = [
      getProfileValidationMessage(i18n, 'organizationName', 'required'),
      getProfileValidationMessage(i18n, 'organizationName', 'minLength'),
      getProfileValidationMessage(i18n, 'individualAddress.state', 'required', {
        country: 'CA',
      }),
      getProfileValidationMessage(i18n, 'countryOfFormation', 'required'),
    ];

    expect(messages).toEqual([
      'Business name is required',
      'Business name must be at least 2 characters',
      'Province is required',
      'Country of registration is required',
    ]);
    expect(messages.join(' ')).not.toContain('{{');
  });
});

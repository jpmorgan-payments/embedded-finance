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

  test('falls back to default address labels for countries without overrides', () => {
    expect([
      getProfileValidationMessage(i18n, 'individualAddress.city', 'required', {
        country: 'TM',
      }),
      getProfileValidationMessage(i18n, 'individualAddress.state', 'required', {
        country: 'TM',
      }),
      getProfileValidationMessage(
        i18n,
        'individualAddress.postalCode',
        'required',
        { country: 'TM' }
      ),
      getProfileValidationMessage(i18n, 'individualAddress.state', 'invalid', {
        country: 'TM',
      }),
    ]).toEqual([
      'City / Town is required',
      'State / Province / Region is required',
      'Postal code is required',
      'Please select a valid State / Province / Region',
    ]);
  });

  test.each(['en-US', 'es-US', 'fr-CA'])(
    'uses resolved address labels in %s for missing country overrides',
    (language) => {
      const localizedI18n = i18n.cloneInstance({ lng: language });
      for (const field of ['city', 'state', 'postalCode']) {
        const message = getProfileValidationMessage(
          localizedI18n,
          `individualAddress.${field}`,
          'required',
          { country: 'TM' }
        );
        expect(message).toContain(
          localizedI18n.t(
            `onboarding-overview:addressFields.${field}.label.default`
          )
        );
        expect(message).not.toContain('addressFields.');
      }
    }
  );
});

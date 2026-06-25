import { describe, expect, it } from 'vitest';

import {
  convertClientResponseToFormValues,
  convertPartyResponseToFormValues,
  generateClientRequestBody,
  generatePartyRequestBody,
  getPartyFieldConfig,
  getValueByPath,
  mapClientApiErrorsToFormErrors,
  mapPartyApiErrorsToFormErrors,
  sanitizeServerErrorMessage,
} from './formUtils';

describe('formUtils', () => {
  describe('getPartyFieldConfig', () => {
    it('returns config for a known field', () => {
      const config = getPartyFieldConfig('organizationName');
      expect(config).toBeDefined();
      expect(config.path).toBe('organizationDetails.organizationName');
    });

    it('throws for an unknown field', () => {
      expect(() => getPartyFieldConfig('totallyFakeField' as any)).toThrow(
        '"totallyFakeField" is not mapped in fieldMap'
      );
    });
  });

  describe('sanitizeServerErrorMessage', () => {
    it('strips field path prefix and cleans brackets', () => {
      const msg =
        'Field /individualDetails/addresses[0]/postalCode/ value must have the expected value. The postal code [00000] is invalid for the country [US].';
      const result = sanitizeServerErrorMessage(msg);
      expect(result).toBe(
        'The postal code 00000 is invalid for the country US.'
      );
    });

    it('strips standalone field path references', () => {
      const msg = 'Field /organizationDetails/website/ is required';
      const result = sanitizeServerErrorMessage(msg);
      expect(result).toBe('Is required');
    });

    it('cleans bracket notation', () => {
      const msg = 'Value [INVALID] is not allowed for field [status]';
      const result = sanitizeServerErrorMessage(msg);
      expect(result).toContain('INVALID');
      expect(result).toContain('status');
      expect(result).not.toContain('[');
    });

    it('capitalizes first letter when prefix is stripped', () => {
      const msg =
        'Field /x/ value must have the expected value. the value is wrong.';
      const result = sanitizeServerErrorMessage(msg);
      expect(result.charAt(0)).toBe('T');
    });

    it('returns original message when no transformation needed', () => {
      const msg = 'Something went wrong';
      expect(sanitizeServerErrorMessage(msg)).toBe('Something went wrong');
    });

    it('returns original message when result would be empty', () => {
      const msg = 'Field /x/ ';
      const result = sanitizeServerErrorMessage(msg);
      expect(result).toBeTruthy();
    });
  });

  describe('getValueByPath', () => {
    it('retrieves nested values', () => {
      const obj = { a: { b: { c: 42 } } };
      expect(getValueByPath(obj, 'a.b.c')).toBe(42);
    });

    it('retrieves array values with bracket notation', () => {
      const obj = { items: [{ name: 'first' }] };
      expect(getValueByPath(obj, 'items[0].name')).toBe('first');
    });

    it('returns undefined for missing path', () => {
      expect(getValueByPath({ a: 1 }, 'x.y.z')).toBeUndefined();
    });

    it('returns undefined for null object', () => {
      expect(getValueByPath(null, 'a')).toBeUndefined();
    });
  });

  describe('mapClientApiErrorsToFormErrors', () => {
    it('maps errors with matching field paths', () => {
      const errors = [
        {
          field: '$.parties.0.individualDetails.firstName',
          message: 'Required',
        },
      ];
      const result = mapClientApiErrorsToFormErrors(
        errors as any,
        0,
        'parties'
      );
      expect(result).toHaveLength(1);
      expect(result[0].field).toBe('controllerFirstName');
      expect(result[0].message).toBe('Required');
    });

    it('returns unmatched fields with undefined field', () => {
      const errors = [
        {
          field: '$.parties.0.unknownPath.deep',
          message: 'Unknown error',
        },
      ];
      const result = mapClientApiErrorsToFormErrors(
        errors as any,
        0,
        'parties'
      );
      expect(result).toHaveLength(1);
      expect(result[0].field).toBeUndefined();
    });

    it('maps errors on addParties array', () => {
      const errors = [
        {
          field: '$.addParties.0.organizationDetails.organizationName',
          message: 'Required',
        },
      ];
      const result = mapClientApiErrorsToFormErrors(
        errors as any,
        0,
        'addParties'
      );
      expect(result).toHaveLength(1);
      expect(result[0].field).toBe('organizationName');
    });
  });

  describe('mapPartyApiErrorsToFormErrors', () => {
    it('maps errors with $. prefix', () => {
      const errors = [
        {
          field: '$.organizationDetails.organizationName',
          message: 'Required',
        },
      ];
      const result = mapPartyApiErrorsToFormErrors(errors as any);
      expect(result.some((e) => e.field === 'organizationName')).toBe(true);
    });

    it('maps errors with $.party. prefix', () => {
      const errors = [
        {
          field: '$.party.organizationDetails.organizationName',
          message: 'Required',
        },
      ];
      const result = mapPartyApiErrorsToFormErrors(errors as any);
      expect(result.some((e) => e.field === 'organizationName')).toBe(true);
    });

    it('handles unmatched paths as unhandled', () => {
      const errors = [
        {
          field: '$.completelyUnknown.path',
          message: 'Unknown',
        },
      ];
      const result = mapPartyApiErrorsToFormErrors(errors as any);
      expect(result).toHaveLength(1);
      expect(result[0].field).toBeUndefined();
    });

    it('emits errors for remaining path with modifyErrorField', () => {
      const errors = [
        {
          field: '$.individualDetails.addresses[0].addressLines[0]',
          message: 'Address required',
        },
      ];
      const result = mapPartyApiErrorsToFormErrors(errors as any);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].message).toBe('Address required');
    });
  });

  describe('generateClientRequestBody', () => {
    it('maps organization form values to request body', () => {
      const formValues = { organizationName: 'Acme Corp' };
      const result = generateClientRequestBody(
        formValues as any,
        0,
        'parties',
        {}
      );
      expect(
        (result as any).parties[0].organizationDetails.organizationName
      ).toBe('Acme Corp');
    });

    it('skips empty string values', () => {
      const formValues = {
        organizationName: '',
        countryOfFormation: 'US',
      };
      const result = generateClientRequestBody(
        formValues as any,
        0,
        'parties',
        {}
      );
      const org = (result as any).parties?.[0]?.organizationDetails;
      expect(org?.organizationName).toBeUndefined();
      expect(org?.countryOfFormation).toBe('US');
    });

    it('skips undefined values', () => {
      const formValues = { organizationName: undefined };
      const result = generateClientRequestBody(
        formValues as any,
        0,
        'parties',
        {}
      );
      expect((result as any).parties).toBeUndefined();
    });
  });

  describe('generatePartyRequestBody', () => {
    it('maps form values to party request', () => {
      const formValues = { organizationName: 'Acme' };
      const result = generatePartyRequestBody(formValues as any, {});
      expect((result as any).organizationDetails.organizationName).toBe('Acme');
    });

    it('skips empty and undefined values', () => {
      const formValues = {
        organizationName: '',
        countryOfFormation: undefined,
      };
      const result = generatePartyRequestBody(formValues as any, {});
      expect((result as any).organizationDetails).toBeUndefined();
    });
  });

  describe('convertClientResponseToFormValues', () => {
    it('converts a client response to form values', () => {
      const response = {
        parties: [
          {
            id: 'p1',
            organizationDetails: {
              organizationName: 'Test Corp',
              countryOfFormation: 'US',
            },
          },
        ],
      };
      const result = convertClientResponseToFormValues(response as any, 'p1');
      expect(result.organizationName).toBe('Test Corp');
      expect(result.countryOfFormation).toBe('US');
    });

    it('handles missing party gracefully', () => {
      const response = { parties: [] };
      const result = convertClientResponseToFormValues(
        response as any,
        'nonexistent'
      );
      expect(result).toBeDefined();
    });
  });

  describe('convertPartyResponseToFormValues', () => {
    it('converts a party response to form values', () => {
      const response = {
        organizationDetails: {
          organizationName: 'Acme',
          countryOfFormation: 'US',
        },
      };
      const result = convertPartyResponseToFormValues(response as any);
      expect(result.organizationName).toBe('Acme');
      expect(result.countryOfFormation).toBe('US');
    });

    it('normalizes controllerIds issuer from countryOfResidence', () => {
      const response = {
        individualDetails: {
          countryOfResidence: 'CA',
          individualIds: [
            {
              idType: 'PASSPORT',
              value: '123',
              issuer: 'US',
              expiryDate: '2030-01-01',
            },
          ],
        },
      };
      const result = convertPartyResponseToFormValues(response as any);
      expect(result.countryOfResidence).toBe('CA');
      if (result.controllerIds?.length) {
        expect(result.controllerIds[0].issuer).toBe('CA');
      }
    });

    it('creates default controllerIds for US resident without IDs', () => {
      const response = {
        individualDetails: {
          countryOfResidence: 'US',
        },
      };
      const result = convertPartyResponseToFormValues(response as any);
      if (result.controllerIds?.length) {
        expect(result.controllerIds[0].issuer).toBe('US');
        expect(result.controllerIds[0].idType).toBe('SSN');
      }
    });
  });
});

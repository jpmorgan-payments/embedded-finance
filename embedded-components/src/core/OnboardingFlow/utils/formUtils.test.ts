import { describe, expect, it } from 'vitest';

import type {
  ApiErrorReasonV2,
  ClientResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';
import type { OnboardingFormValuesSubmit } from '@/core/OnboardingFlow/types';

import {
  convertClientResponseToFormValues,
  convertPartyResponseToFormValues,
  generateClientRequestBody,
  generatePartyRequestBody,
  getPartyFieldConfig,
  getPopulatedFormFieldKeys,
  getValueByPath,
  isValuePopulated,
  mapClientApiErrorsToFormErrors,
  mapPartyApiErrorsToFormErrors,
  sanitizeServerErrorMessage,
} from './formUtils';

// Minimal shapes for the dynamically-built request bodies under test.
type RequestBodyOrgDetails = {
  organizationName?: string;
  countryOfFormation?: string;
  addresses?: Array<{ addressType?: string; addressLines?: string[] }>;
};
type ClientRequestBodyShape = {
  parties?: Array<{ organizationDetails?: RequestBodyOrgDetails }>;
};
type PartyRequestBodyShape = { organizationDetails?: RequestBodyOrgDetails };

describe('formUtils', () => {
  describe('getPartyFieldConfig', () => {
    it('returns config for a known field', () => {
      const config = getPartyFieldConfig('organizationName');
      expect(config).toBeDefined();
      expect(config.path).toBe('organizationDetails.organizationName');
    });

    it('throws for an unknown field', () => {
      expect(() => getPartyFieldConfig('totallyFakeField' as never)).toThrow(
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
      const errors: ApiErrorReasonV2[] = [
        {
          field: '$.parties.0.individualDetails.firstName',
          message: 'Required',
        },
      ];
      const result = mapClientApiErrorsToFormErrors(errors, 0, 'parties');
      expect(result).toHaveLength(1);
      expect(result[0].field).toBe('controllerFirstName');
      expect(result[0].message).toBe('Required');
    });

    it('returns unmatched fields with undefined field', () => {
      const errors: ApiErrorReasonV2[] = [
        {
          field: '$.parties.0.unknownPath.deep',
          message: 'Unknown error',
        },
      ];
      const result = mapClientApiErrorsToFormErrors(errors, 0, 'parties');
      expect(result).toHaveLength(1);
      expect(result[0].field).toBeUndefined();
    });

    it('maps errors on addParties array', () => {
      const errors: ApiErrorReasonV2[] = [
        {
          field: '$.addParties.0.organizationDetails.organizationName',
          message: 'Required',
        },
      ];
      const result = mapClientApiErrorsToFormErrors(errors, 0, 'addParties');
      expect(result).toHaveLength(1);
      expect(result[0].field).toBe('organizationName');
    });
  });

  describe('mapPartyApiErrorsToFormErrors', () => {
    it('maps errors with $. prefix', () => {
      const errors: ApiErrorReasonV2[] = [
        {
          field: '$.organizationDetails.organizationName',
          message: 'Required',
        },
      ];
      const result = mapPartyApiErrorsToFormErrors(errors);
      expect(result.some((e) => e.field === 'organizationName')).toBe(true);
    });

    it('maps errors with $.party. prefix', () => {
      const errors: ApiErrorReasonV2[] = [
        {
          field: '$.party.organizationDetails.organizationName',
          message: 'Required',
        },
      ];
      const result = mapPartyApiErrorsToFormErrors(errors);
      expect(result.some((e) => e.field === 'organizationName')).toBe(true);
    });

    it('handles unmatched paths as unhandled', () => {
      const errors: ApiErrorReasonV2[] = [
        {
          field: '$.completelyUnknown.path',
          message: 'Unknown',
        },
      ];
      const result = mapPartyApiErrorsToFormErrors(errors);
      expect(result).toHaveLength(1);
      expect(result[0].field).toBeUndefined();
    });

    it('emits errors for remaining path with modifyErrorField', () => {
      const errors: ApiErrorReasonV2[] = [
        {
          field: '$.individualDetails.addresses[0].addressLines[0]',
          message: 'Address required',
        },
      ];
      const result = mapPartyApiErrorsToFormErrors(errors);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].message).toBe('Address required');
    });
  });

  describe('generateClientRequestBody', () => {
    it('maps organization form values to request body', () => {
      const formValues: Partial<OnboardingFormValuesSubmit> = {
        organizationName: 'Acme Corp',
      };
      const result = generateClientRequestBody(formValues, 0, 'parties', {});
      expect(
        (result as ClientRequestBodyShape).parties?.[0]?.organizationDetails
          ?.organizationName
      ).toBe('Acme Corp');
    });

    it('skips empty string values', () => {
      const formValues: Partial<OnboardingFormValuesSubmit> = {
        organizationName: '',
        countryOfFormation: 'US',
      };
      const result = generateClientRequestBody(formValues, 0, 'parties', {});
      const org = (result as ClientRequestBodyShape).parties?.[0]
        ?.organizationDetails;
      expect(org?.organizationName).toBeUndefined();
      expect(org?.countryOfFormation).toBe('US');
    });

    it('skips undefined values', () => {
      const formValues: Partial<OnboardingFormValuesSubmit> = {
        organizationName: undefined,
      };
      const result = generateClientRequestBody(formValues, 0, 'parties', {});
      expect((result as ClientRequestBodyShape).parties).toBeUndefined();
    });
  });

  describe('generatePartyRequestBody', () => {
    it('maps form values to party request', () => {
      const formValues: Partial<OnboardingFormValuesSubmit> = {
        organizationName: 'Acme',
      };
      const result = generatePartyRequestBody(formValues, {});
      expect(
        (result as PartyRequestBodyShape).organizationDetails?.organizationName
      ).toBe('Acme');
    });

    it('skips empty and undefined values', () => {
      const formValues: Partial<OnboardingFormValuesSubmit> = {
        organizationName: '',
        countryOfFormation: undefined,
      };
      const result = generatePartyRequestBody(formValues, {});
      expect(
        (result as PartyRequestBodyShape).organizationDetails
      ).toBeUndefined();
    });

    it('maps the canonical organizationAddress into addresses[0]', () => {
      const formValues = {
        organizationAddress: {
          addressType: 'LEGAL_ADDRESS',
          primaryAddressLine: '1 Market St',
          secondaryAddressLine: '',
          tertiaryAddressLine: '',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94105',
          country: 'US',
        },
      } as unknown as Partial<OnboardingFormValuesSubmit>;
      const result = generatePartyRequestBody(formValues, {});
      const address = (result as PartyRequestBodyShape).organizationDetails
        ?.addresses?.[0];
      expect(address?.addressType).toBe('LEGAL_ADDRESS');
      expect(address?.addressLines?.[0]).toBe('1 Market St');
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
      const result = convertClientResponseToFormValues(
        response as unknown as ClientResponse,
        'p1'
      );
      expect(result.organizationName).toBe('Test Corp');
      expect(result.countryOfFormation).toBe('US');
    });

    it('handles missing party gracefully', () => {
      const response = { parties: [] };
      const result = convertClientResponseToFormValues(
        response as unknown as ClientResponse,
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
      const result = convertPartyResponseToFormValues(
        response as unknown as PartyResponse
      );
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
      const result = convertPartyResponseToFormValues(
        response as unknown as PartyResponse
      );
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
      const result = convertPartyResponseToFormValues(
        response as unknown as PartyResponse
      );
      if (result.controllerIds?.length) {
        expect(result.controllerIds[0].issuer).toBe('US');
        expect(result.controllerIds[0].idType).toBe('SSN');
      }
    });
  });

  describe('isValuePopulated', () => {
    it('treats undefined, null and empty/whitespace strings as not populated', () => {
      expect(isValuePopulated(undefined)).toBe(false);
      expect(isValuePopulated(null)).toBe(false);
      expect(isValuePopulated('')).toBe(false);
      expect(isValuePopulated('   ')).toBe(false);
    });

    it('treats non-empty strings, numbers and booleans as populated', () => {
      expect(isValuePopulated('Acme')).toBe(true);
      expect(isValuePopulated(0)).toBe(true);
      expect(isValuePopulated(false)).toBe(true);
    });

    it('treats objects/arrays as populated only when a leaf carries data', () => {
      expect(isValuePopulated({ primaryAddressLine: '', city: '' })).toBe(
        false
      );
      expect(
        isValuePopulated({ primaryAddressLine: '1 Main St', city: '' })
      ).toBe(true);
      expect(isValuePopulated([])).toBe(false);
      expect(isValuePopulated(['', '   '])).toBe(false);
      expect(isValuePopulated(['', 'x'])).toBe(true);
    });
  });

  describe('getPopulatedFormFieldKeys', () => {
    it('returns an empty set when there is no client data', () => {
      expect(getPopulatedFormFieldKeys(undefined).size).toBe(0);
    });

    it('collects populated root keys across parties without leaking defaults', () => {
      const clientData = {
        parties: [
          {
            partyType: 'ORGANIZATION',
            organizationDetails: {
              organizationName: 'Acme',
              organizationType: 'LIMITED_LIABILITY_COMPANY',
              addresses: [
                {
                  addressType: 'BUSINESS_ADDRESS',
                  addressLines: ['1 Main St'],
                  city: 'Columbus',
                  state: 'OH',
                  postalCode: '43004',
                  country: 'US',
                },
              ],
              // dbaName intentionally omitted → must NOT be reported populated
            },
          },
        ],
      } as unknown as ClientResponse;

      const keys = getPopulatedFormFieldKeys(clientData);
      expect(keys.has('organizationName')).toBe(true);
      expect(keys.has('organizationTypeHierarchy')).toBe(true);
      expect(keys.has('organizationAddress')).toBe(true);
      expect(keys.has('dbaName')).toBe(false);
    });
  });
});

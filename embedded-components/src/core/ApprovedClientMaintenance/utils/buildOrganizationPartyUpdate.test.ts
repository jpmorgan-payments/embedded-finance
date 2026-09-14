import { describe, expect, test } from 'vitest';

import {
  buildOrganizationPartyUpdate,
  getOrganizationMaintenanceValues,
} from './buildOrganizationPartyUpdate';

const address = {
  addressType: 'BUSINESS_ADDRESS',
  addressLines: ['2029 Century Park E'],
  city: 'Los Angeles',
  state: 'CA',
  postalCode: '90067',
  country: 'US',
};

const baseline = getOrganizationMaintenanceValues(
  'Neverland Books',
  'FT Books',
  address
);
describe('buildOrganizationPartyUpdate', () => {
  test('sends only a changed DBA name', () => {
    expect(
      buildOrganizationPartyUpdate(baseline, {
        ...baseline,
        dbaName: 'Neverland Bookshop',
      })
    ).toEqual({
      kind: 'changed',
      request: {
        organizationDetails: { dbaName: 'Neverland Bookshop' },
      },
    });
  });

  test('blocks clearing an existing optional DBA', () => {
    expect(
      buildOrganizationPartyUpdate(baseline, {
        ...baseline,
        dbaName: '',
      })
    ).toEqual({
      kind: 'unsupported-clear',
      fields: ['dbaName'],
    });
  });

  test('blocks clearing an existing optional address line', () => {
    const baselineWithSecondLine = {
      ...baseline,
      organizationAddress: {
        ...baseline.organizationAddress,
        secondaryAddressLine: 'Suite 200',
      },
    };

    expect(
      buildOrganizationPartyUpdate(baselineWithSecondLine, {
        ...baselineWithSecondLine,
        organizationAddress: {
          ...baselineWithSecondLine.organizationAddress,
          secondaryAddressLine: '',
        },
      })
    ).toEqual({
      kind: 'unsupported-clear',
      fields: ['organizationAddress.secondaryAddressLine'],
    });
  });

  test('replaces the complete address array when the address changes', () => {
    const result = buildOrganizationPartyUpdate(baseline, {
      ...baseline,
      organizationAddress: {
        ...baseline.organizationAddress,
        primaryAddressLine: '100 Market Street',
        city: 'San Francisco',
        postalCode: '94105',
      },
    });

    expect(result).toEqual({
      kind: 'changed',
      request: {
        organizationDetails: {
          addresses: [
            {
              addressType: 'BUSINESS_ADDRESS',
              addressLines: ['100 Market Street'],
              city: 'San Francisco',
              state: 'CA',
              postalCode: '94105',
              country: 'US',
            },
          ],
        },
      },
    });
  });

  test('blocks clears and returns unchanged when values match', () => {
    expect(buildOrganizationPartyUpdate(baseline, baseline)).toEqual({
      kind: 'unchanged',
    });
    expect(
      buildOrganizationPartyUpdate(baseline, {
        ...baseline,
        organizationName: '',
      })
    ).toEqual({
      kind: 'unsupported-clear',
      fields: ['organizationName'],
    });
  });
});

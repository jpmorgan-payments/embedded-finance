import { describe, expect, test } from 'vitest';

import {
  buildIndividualPartyUpdate,
  buildPartyNameUpdate,
} from './buildPartyNameUpdate';

const approvedName = {
  firstName: 'Jane',
  middleName: 'R',
  lastName: 'Doe',
};
describe('buildPartyNameUpdate', () => {
  test('returns unchanged when no name field changed', () => {
    expect(buildPartyNameUpdate(approvedName, approvedName)).toEqual({
      kind: 'unchanged',
    });
  });

  test('includes only changed allowlisted fields', () => {
    expect(
      buildPartyNameUpdate(approvedName, {
        ...approvedName,
        lastName: 'Diaz',
      })
    ).toEqual({
      kind: 'changed',
      request: {
        individualDetails: { lastName: 'Diaz' },
      },
    });
  });

  test('blocks clearing an existing optional middle name', () => {
    expect(
      buildPartyNameUpdate(approvedName, {
        ...approvedName,
        middleName: '',
      })
    ).toEqual({
      kind: 'unsupported-clear',
      fields: ['middleName'],
    });
  });
});

describe('buildIndividualPartyUpdate', () => {
  const approvedIndividual = {
    ...approvedName,
    nameSuffix: '',
    birthDate: '1975-03-12',
    countryOfResidence: 'US',
    individualId: { idType: 'SSN', value: '111223333' },
    jobTitle: 'CEO',
    jobTitleDescription: '',
    email: 'jane@example.com',
    phone: {
      phoneType: 'MOBILE_PHONE',
      countryCode: '+1',
      phoneNumber: '2125550100',
    },
    residentialAddress: {
      country: 'US',
      primaryAddressLine: '100 Main Street',
      secondaryAddressLine: '',
      tertiaryAddressLine: '',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
    },
  };

  test('sends only a changed birth date', () => {
    expect(
      buildIndividualPartyUpdate(approvedIndividual, {
        ...approvedIndividual,
        birthDate: '1976-04-13',
      })
    ).toEqual({
      kind: 'changed',
      request: {
        individualDetails: { birthDate: '1976-04-13' },
      },
    });
  });

  test('does not permit clearing an approved birth date', () => {
    expect(
      buildIndividualPartyUpdate(approvedIndividual, {
        ...approvedIndividual,
        birthDate: '',
      })
    ).toEqual({ kind: 'unsupported-clear', fields: ['birthDate'] });
  });

  test('sends root email and nested phone changes sparsely', () => {
    expect(
      buildIndividualPartyUpdate(approvedIndividual, {
        ...approvedIndividual,
        email: 'jane.doe@example.com',
        phone: {
          ...approvedIndividual.phone,
          phoneNumber: '6465550199',
        },
      })
    ).toEqual({
      kind: 'changed',
      request: {
        email: 'jane.doe@example.com',
        individualDetails: {
          phone: {
            phoneType: 'MOBILE_PHONE',
            countryCode: '+1',
            phoneNumber: '6465550199',
          },
        },
      },
    });
  });

  test('reconstructs an edited address without erasing additional addresses', () => {
    const additionalAddress = {
      addressType: 'MAILING_ADDRESS',
      addressLines: ['PO Box 200'],
      city: 'New York',
      state: 'NY',
      postalCode: '10002',
      country: 'US',
    };

    expect(
      buildIndividualPartyUpdate(
        approvedIndividual,
        {
          ...approvedIndividual,
          residentialAddress: {
            ...approvedIndividual.residentialAddress,
            city: 'Brooklyn',
          },
        },
        [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['100 Main Street'],
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
          },
          additionalAddress,
        ]
      )
    ).toEqual({
      kind: 'changed',
      request: {
        individualDetails: {
          addresses: [
            {
              addressType: 'RESIDENTIAL_ADDRESS',
              addressLines: ['100 Main Street'],
              city: 'Brooklyn',
              state: 'NY',
              postalCode: '10001',
              country: 'US',
            },
            additionalAddress,
          ],
        },
      },
    });
  });

  test('reports nested fields when approved contact data is cleared', () => {
    expect(
      buildIndividualPartyUpdate(approvedIndividual, {
        ...approvedIndividual,
        phone: {
          ...approvedIndividual.phone,
          phoneNumber: '',
        },
      })
    ).toEqual({
      kind: 'unsupported-clear',
      fields: ['phone.phoneNumber'],
    });
  });

  test('does not create an empty identity when only residence country changes', () => {
    const individualWithoutId = {
      ...approvedIndividual,
      individualId: { idType: '', value: '' },
    };

    expect(
      buildIndividualPartyUpdate(individualWithoutId, {
        ...individualWithoutId,
        countryOfResidence: 'CA',
      })
    ).toEqual({
      kind: 'changed',
      request: {
        individualDetails: { countryOfResidence: 'CA' },
      },
    });
  });

  test('preserves an approved ID issuer during an unrelated legacy-profile edit', () => {
    const individualWithoutResidenceCountry = {
      ...approvedIndividual,
      countryOfResidence: '',
    };

    expect(
      buildIndividualPartyUpdate(
        individualWithoutResidenceCountry,
        { ...individualWithoutResidenceCountry, lastName: 'Diaz' },
        [],
        [{ idType: 'SSN', value: '111223333', issuer: 'US' }]
      )
    ).toEqual({
      kind: 'changed',
      request: { individualDetails: { lastName: 'Diaz' } },
    });
  });
});

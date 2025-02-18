import { PartyResponse } from '@/api/generated/smbdo.schemas';

export const partyWithMissingfields: PartyResponse = {
  access: [],
  id: '2000000112',
  createdAt: '2023-11-27T20:42:20.873Z',
  email: 'monicagellar@gmail.com',
  externalId: 'TCU12344',
  partyType: 'INDIVIDUAL',
  parentPartyId: '2000000111',
  parentExternalId: 'TCU1234',
  profileStatus: 'APPROVED',
  roles: ['BENEFICIAL_OWNER', 'CONTROLLER'],
  active: true,
  individualDetails: {
    addresses: [
      {
        addressType: 'RESIDENTIAL_ADDRESS',
        addressLines: ['90 Bedford Street', 'Apt 2E'],
        city: 'New York',
        state: 'NY',
        postalCode: '10014',
        country: 'US',
      },
    ],
    countryOfResidence: 'US',
    firstName: 'Monica',
    lastName: 'Gellar',
    individualIds: [
      {
        idType: 'SSN',
        issuer: 'US',
        value: '100-01-0001',
      },
    ],
    jobTitle: 'Other',
    jobTitleDescription: 'CEO',
    natureOfOwnership: 'Direct',
    soleOwner: true,
  },
  validationResponse: [
    {
      validationStatus: 'NEEDS_INFO',
      fields: [
        {
          name: 'date_of_birth',
          type: 'date',
        },
      ],
    },
  ],
};

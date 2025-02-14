import { parsePhoneNumber } from 'react-phone-number-input';

import { PhoneSmbdo } from '@/api/generated/smbdo.schemas';

import { PartyFieldMap } from './types';

// Source of truth for mapping form fields to API fields
// path is used for handling server errors and mapping values from/to the API
// rules are used for configuring field visibility, required, etc.
export const partyFieldMap: PartyFieldMap = {
  product: {
    excludeFromMapping: true,
    baseRule: { visibility: 'visible', required: true },
  },
  organizationName: {
    path: 'organizationDetails.organizationName',
    baseRule: { visibility: 'visible', required: true },
  },
  organizationType: {
    path: 'organizationDetails.organizationType',
    baseRule: { visibility: 'visible', required: true },
  },
  countryOfFormation: {
    path: 'organizationDetails.countryOfFormation',
    baseRule: { visibility: 'visible', required: true },
  },
  // These two fields have the same path, but can have different rules and translations
  organizationEmail: {
    path: 'email',
    baseRule: { visibility: 'visible', required: true },
  },
  individualEmail: {
    path: 'email',
    baseRule: { visibility: 'visible', required: false },
  },
  yearOfFormation: {
    path: 'organizationDetails.yearOfFormation',
    baseRule: { visibility: 'visible', required: true },
  },
  dbaName: {
    path: 'organizationDetails.dbaName',
    baseRule: { visibility: 'visible', required: false },
    conditionalRules: [
      {
        condition: {
          product: ['MERCHANT_SERVICES'],
          jurisdiction: ['CA'],
        },
        rule: { visibility: 'hidden' },
      },
    ],
  },
  organizationDescription: {
    path: 'organizationDetails.organizationDescription',
    baseRule: { visibility: 'visible', required: true },
  },
  industryCategory: {
    path: 'organizationDetails.industryCategory',
    baseRule: { visibility: 'visible', required: true },
  },
  industryType: {
    path: 'organizationDetails.industryType',
    baseRule: { visibility: 'visible', required: true },
  },
  mcc: {
    path: 'organizationDetails.mcc',
    baseRule: { visibility: 'hidden', required: false },
  },
  addresses: {
    path: 'organizationDetails.addresses',
    baseRule: {
      visibility: 'visible',
      minItems: 1,
      maxItems: 1,
      requiredItems: 1,
    },
    conditionalRules: [
      {
        condition: {
          product: ['MERCHANT_SERVICES'],
        },
        rule: { maxItems: 3 },
      },
    ],
    subFields: {
      addressType: {
        baseRule: { visibility: 'visible', required: true },
      },
      addressLines: {
        baseRule: { visibility: 'visible', required: true },
      },
      city: {
        baseRule: { visibility: 'visible', required: true },
      },
      state: {
        baseRule: { visibility: 'visible', required: true },
      },
      postalCode: {
        baseRule: { visibility: 'visible', required: true },
      },
      country: {
        baseRule: { visibility: 'visible', required: true },
      },
    },
  },
  associatedCountries: {
    path: 'organizationDetails.associatedCountries',
    baseRule: {
      visibility: 'hidden',
      minItems: 0,
      maxItems: 100,
      requiredItems: 0,
    },
    subFields: {
      country: {
        baseRule: { visibility: 'visible', required: true },
      },
    },
  },
  jurisdiction: {
    path: 'organizationDetails.jurisdiction',
    baseRule: { visibility: 'visible', required: true },
  },
  organizationIds: {
    path: 'organizationDetails.organizationIds',
    baseRule: {
      visibility: 'visible',
      maxItems: 1,
      minItems: 0,
      requiredItems: 0,
    },
    subFields: {
      idType: {
        baseRule: { visibility: 'visible', required: true },
      },
      issuer: {
        baseRule: { visibility: 'visible', required: true },
      },
      value: {
        baseRule: { visibility: 'visible', required: true },
      },
      description: {
        baseRule: { visibility: 'visible', required: false },
      },
      expiryDate: {
        baseRule: { visibility: 'visible', required: false },
      },
    },
  },
  organizationPhone: {
    path: 'organizationDetails.phone',
    baseRule: { visibility: 'visible', required: true },
    fromResponseFn: (val: PhoneSmbdo) => ({
      phoneType: val.phoneType!,
      phoneNumber: `${val.countryCode}${val.phoneNumber}`,
    }),
    toRequestFn: (val: any): PhoneSmbdo => {
      const phone = parsePhoneNumber(val.phoneNumber);
      return {
        phoneType: val.phoneType,
        countryCode: phone?.countryCallingCode
          ? `+${phone.countryCallingCode}`
          : '',
        phoneNumber: phone?.nationalNumber ?? '',
      };
    },
  },
  website: {
    path: 'organizationDetails.website',
    baseRule: { visibility: 'visible', required: false },
  },
  websiteAvailable: {
    path: 'organizationDetails.websiteAvailable',
    baseRule: { visibility: 'visible', required: false },
    fromResponseFn: (val: boolean) => !val,
    toRequestFn: (val: boolean) => !val,
  },
  secondaryMccList: {
    path: 'organizationDetails.secondaryMccList',
    baseRule: {
      visibility: 'hidden',
      minItems: 0,
      maxItems: 50,
      requiredItems: 0,
    },
    subFields: {
      mcc: {
        baseRule: { visibility: 'visible', required: true },
      },
    },
  },
  birthDate: {
    path: 'individualDetails.birthDate',
    baseRule: { visibility: 'visible', required: true },
  },
  countryOfResidence: {
    path: 'individualDetails.countryOfResidence',
    baseRule: { visibility: 'visible', required: true },
  },
  firstName: {
    path: 'individualDetails.firstName',
    baseRule: { visibility: 'visible', required: true },
  },
  middleName: {
    path: 'individualDetails.middleName',
    baseRule: { visibility: 'visible', required: false },
  },
  lastName: {
    path: 'individualDetails.lastName',
    baseRule: { visibility: 'visible', required: true },
  },
  nameSuffix: {
    path: 'individualDetails.nameSuffix',
    baseRule: { visibility: 'visible', required: false },
    conditionalRules: [
      {
        condition: {
          product: ['MERCHANT_SERVICES'],
          jurisdiction: ['CA'],
        },
        rule: { visibility: 'hidden' },
      },
    ],
  },
  individualIds: {
    path: 'individualDetails.individualIds',
    baseRule: {
      visibility: 'visible',
      minItems: 1,
      maxItems: 1,
      requiredItems: 1,
    },
    conditionalRules: [
      {
        condition: {
          product: ['MERCHANT_SERVICES'],
          jurisdiction: ['CA'],
        },
        rule: { visibility: 'hidden' },
      },
    ],
    subFields: {
      idType: {
        baseRule: { visibility: 'visible', required: true },
      },
      issuer: {
        baseRule: { visibility: 'visible', required: true },
      },
      value: {
        baseRule: { visibility: 'visible', required: true },
      },
      description: {
        baseRule: { visibility: 'visible', required: false },
      },
      expiryDate: {
        baseRule: { visibility: 'visible', required: false },
      },
    },
  },
  jobTitle: {
    path: 'individualDetails.jobTitle',
    baseRule: { visibility: 'visible', required: true },
    conditionalRules: [
      {
        condition: {
          product: ['MERCHANT_SERVICES'],
          jurisdiction: ['CA'],
        },
        rule: { visibility: 'hidden' },
      },
    ],
  },
  jobTitleDescription: {
    path: 'individualDetails.jobTitleDescription',
    baseRule: { visibility: 'visible', required: false },
    conditionalRules: [
      {
        condition: {
          product: ['MERCHANT_SERVICES'],
          jurisdiction: ['CA'],
        },
        rule: { visibility: 'hidden' },
      },
    ],
  },
  natureOfOwnership: {
    path: 'individualDetails.natureOfOwnership',
    baseRule: { visibility: 'visible', required: false },
  },
  // soleOwner: {
  //   path: 'individualDetails.soleOwner',
  //   baseRule: { visibility: 'visible', required: true },
  // },
  individualAddresses: {
    path: 'individualDetails.addresses',
    baseRule: {
      visibility: 'visible',
      minItems: 1,
      maxItems: 1,
      requiredItems: 1,
    },
    conditionalRules: [
      {
        condition: {
          product: ['EMBEDDED_PAYMENTS'],
        },
        rule: { maxItems: 3 },
      },
    ],
    subFields: {
      addressType: {
        baseRule: { visibility: 'visible', required: true },
      },
      addressLines: {
        baseRule: { visibility: 'visible', required: true },
      },
      city: {
        baseRule: { visibility: 'visible', required: true },
      },
      state: {
        baseRule: { visibility: 'visible', required: true },
      },
      postalCode: {
        baseRule: { visibility: 'visible', required: true },
      },
      country: {
        baseRule: { visibility: 'visible', required: true },
      },
    },
  },
  individualPhone: {
    path: 'individualDetails.phone',
    baseRule: { visibility: 'visible', required: true },
    fromResponseFn: (val: PhoneSmbdo) => ({
      phoneType: val.phoneType!,
      phoneNumber: `${val.countryCode}${val.phoneNumber}`,
    }),
    toRequestFn: (val: any): PhoneSmbdo => {
      const phone = parsePhoneNumber(val.phoneNumber);
      return {
        phoneType: val.phoneType,
        countryCode: phone?.countryCallingCode
          ? `+${phone.countryCallingCode}`
          : '',
        phoneNumber: phone?.nationalNumber ?? '',
      };
    },
  },
};

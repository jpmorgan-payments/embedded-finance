import { parsePhoneNumber } from 'react-phone-number-input';

import { AddressDto, PhoneSmbdo } from '@/api/generated/smbdo.schemas';

import { PartyFieldMap } from './types';

// Source of truth for mapping form fields to API fields
// path is used for handling server errors and mapping values from/to the API
// rules are used for configuring field display, required, etc.
export const partyFieldMap: PartyFieldMap = {
  product: {
    excludeFromMapping: true,
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: '',
    },
  },
  jurisdiction: {
    path: 'organizationDetails.jurisdiction',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: '',
    },
  },
  organizationName: {
    path: 'organizationDetails.organizationName',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: '',
    },
  },
  organizationType: {
    path: 'organizationDetails.organizationType',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: '',
    },
  },
  countryOfFormation: {
    path: 'organizationDetails.countryOfFormation',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: 'US',
    },
  },
  organizationEmail: {
    path: 'email',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: '',
    },
  },
  individualEmail: {
    path: 'email',
    baseRule: {
      display: 'visible',
      required: false,
      defaultValue: '',
    },
  },
  yearOfFormation: {
    path: 'organizationDetails.yearOfFormation',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: '',
    },
  },
  dbaName: {
    path: 'organizationDetails.dbaName',
    baseRule: {
      display: 'visible',
      required: false,
      defaultValue: '',
    },
    conditionalRules: [
      {
        condition: {
          product: ['MERCHANT_SERVICES'],
          jurisdiction: ['CA'],
        },
        rule: { display: 'hidden' },
      },
    ],
  },
  organizationDescription: {
    path: 'organizationDetails.organizationDescription',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: '',
    },
  },
  industryCategory: {
    path: 'organizationDetails.industryCategory',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: '',
    },
  },
  industryType: {
    path: 'organizationDetails.industryType',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: '',
    },
  },
  mcc: {
    path: 'organizationDetails.mcc',
    baseRule: {
      display: 'hidden',
      required: false,
      defaultValue: '',
    },
  },
  addresses: {
    path: 'organizationDetails.addresses',
    baseRule: {
      display: 'visible',
      minItems: 1,
      maxItems: 1,
      requiredItems: 1,
      defaultValue: [
        {
          addressType: 'BUSINESS_ADDRESS',
          addressLines: [{ value: '' }, { value: '' }],
          city: '',
          state: '',
          postalCode: '',
          country: '',
        },
      ],
      defaultAppendValue: {
        addressType: 'BUSINESS_ADDRESS',
        addressLines: [{ value: '' }, { value: '' }],
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
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
        baseRule: { display: 'visible', required: true },
      },
      addressLines: {
        baseRule: {
          display: 'visible',
          minItems: 2,
          maxItems: 2,
          requiredItems: 1,
        },
        subFields: {
          value: {
            baseRule: { display: 'visible', required: true },
          },
        },
      },
      city: {
        baseRule: { display: 'visible', required: true },
      },
      state: {
        baseRule: { display: 'visible', required: true },
      },
      postalCode: {
        baseRule: { display: 'visible', required: true },
      },
      country: {
        baseRule: { display: 'visible', required: true },
      },
    },
    fromResponseFn: (addressesFromApi: AddressDto[]) => {
      return addressesFromApi.map((address) => ({
        ...address,
        addressLines: address.addressLines.map((line: any) => ({
          value: line.value,
        })),
        state: address.state ?? '',
        addressType: address.addressType ?? 'LEGAL_ADDRESS',
      }));
    },
    toRequestFn: (addresses): AddressDto[] => {
      return addresses.map((address) => ({
        ...address,
        addressLines: address.addressLines.map(({ value }) => value),
      }));
    },
  },
  associatedCountries: {
    path: 'organizationDetails.associatedCountries',
    baseRule: {
      display: 'visible',
      minItems: 0,
      maxItems: 100,
      requiredItems: 0,
      defaultValue: [],
      defaultAppendValue: {
        country: '',
      },
    },
    subFields: {
      country: {
        baseRule: { display: 'visible', required: true },
      },
    },
  },
  organizationIds: {
    path: 'organizationDetails.organizationIds',
    baseRule: {
      display: 'visible',
      minItems: 1,
      maxItems: 1,
      requiredItems: 1,
      defaultValue: [
        {
          idType: 'EIN',
          issuer: 'US',
          value: '',
        },
      ],
      defaultAppendValue: {
        idType: 'EIN',
        issuer: '',
        value: '',
      },
    },
    conditionalRules: [
      {
        condition: {
          entityType: ['SOLE_PROPRIETORSHIP'],
        },
        rule: {
          minItems: 0,
          requiredItems: 0,
          defaultValue: [],
        },
      },
    ],
    subFields: {
      idType: {
        baseRule: { display: 'visible', required: true },
      },
      issuer: {
        baseRule: { display: 'visible', required: true },
      },
      value: {
        baseRule: { display: 'visible', required: true },
      },
      description: {
        baseRule: { display: 'visible', required: false },
      },
      expiryDate: {
        baseRule: { display: 'visible', required: false },
      },
    },
  },
  organizationPhone: {
    path: 'organizationDetails.phone',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: { phoneType: 'BUSINESS_PHONE', phoneNumber: '' },
    },
    fromResponseFn: (val: PhoneSmbdo) => ({
      phoneType: val.phoneType!,
      phoneNumber: `${val.countryCode}${val.phoneNumber}`,
    }),
    toRequestFn: (val): PhoneSmbdo => {
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
    baseRule: {
      display: 'visible',
      required: false,
      defaultValue: '',
    },
  },
  websiteAvailable: {
    path: 'organizationDetails.websiteAvailable',
    baseRule: {
      display: 'visible',
      required: false,
      defaultValue: false,
    },
    fromResponseFn: (val: boolean) => !val,
    toRequestFn: (val): boolean => !val,
  },
  secondaryMccList: {
    path: 'organizationDetails.secondaryMccList',
    baseRule: {
      display: 'visible',
      minItems: 0,
      maxItems: 50,
      requiredItems: 0,
      defaultValue: [],
      defaultAppendValue: {
        mcc: '',
      },
    },
    subFields: {
      mcc: {
        baseRule: { display: 'visible', required: true },
      },
    },
  },
  birthDate: {
    path: 'individualDetails.birthDate',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: '',
    },
  },
  countryOfResidence: {
    path: 'individualDetails.countryOfResidence',
    baseRule: { display: 'visible', required: true, defaultValue: '' },
  },
  firstName: {
    path: 'individualDetails.firstName',
    baseRule: { display: 'visible', required: true, defaultValue: '' },
  },
  middleName: {
    path: 'individualDetails.middleName',
    baseRule: { display: 'visible', required: false, defaultValue: '' },
  },
  lastName: {
    path: 'individualDetails.lastName',
    baseRule: { display: 'visible', required: true, defaultValue: '' },
  },
  nameSuffix: {
    path: 'individualDetails.nameSuffix',
    baseRule: { display: 'visible', required: false, defaultValue: '' },
    conditionalRules: [
      {
        condition: {
          product: ['MERCHANT_SERVICES'],
          jurisdiction: ['CA'],
        },
        rule: { display: 'hidden' },
      },
    ],
  },
  individualIds: {
    path: 'individualDetails.individualIds',
    baseRule: {
      display: 'visible',
      minItems: 1,
      maxItems: 1,
      requiredItems: 1,
      defaultValue: [
        {
          idType: 'SSN',
          issuer: 'US',
          value: '',
        },
      ],
      defaultAppendValue: {
        idType: 'SSN',
        issuer: 'US',
        value: '',
      },
    },
    conditionalRules: [
      {
        condition: {
          product: ['MERCHANT_SERVICES'],
          jurisdiction: ['CA'],
        },
        rule: { display: 'hidden' },
      },
    ],
    subFields: {
      idType: {
        baseRule: { display: 'visible', required: true },
      },
      issuer: {
        baseRule: { display: 'visible', required: true },
      },
      value: {
        baseRule: { display: 'visible', required: true },
      },
      description: {
        baseRule: { display: 'visible', required: false },
      },
      expiryDate: {
        baseRule: { display: 'visible', required: false },
      },
    },
  },
  jobTitle: {
    path: 'individualDetails.jobTitle',
    baseRule: { display: 'visible', required: true, defaultValue: '' },
    conditionalRules: [
      {
        condition: {
          product: ['MERCHANT_SERVICES'],
          jurisdiction: ['CA'],
        },
        rule: { display: 'hidden' },
      },
    ],
  },
  jobTitleDescription: {
    path: 'individualDetails.jobTitleDescription',
    baseRule: { display: 'visible', required: false, defaultValue: '' },
    conditionalRules: [
      {
        condition: {
          product: ['MERCHANT_SERVICES'],
          jurisdiction: ['CA'],
        },
        rule: { display: 'hidden' },
      },
    ],
  },
  natureOfOwnership: {
    path: 'individualDetails.natureOfOwnership',
    baseRule: { display: 'visible', required: false, defaultValue: '' },
  },
  individualAddresses: {
    path: 'individualDetails.addresses',
    baseRule: {
      display: 'visible',
      minItems: 1,
      maxItems: 1,
      requiredItems: 1,
      defaultValue: [
        {
          addressType: 'RESIDENTIAL_ADDRESS',
          addressLines: [{ value: '' }, { value: '' }],
          city: '',
          state: '',
          postalCode: '',
          country: '',
        },
      ],
      defaultAppendValue: {
        addressType: 'RESIDENTIAL_ADDRESS',
        addressLines: [{ value: '' }, { value: '' }],
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
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
        baseRule: { display: 'visible', required: true },
      },
      addressLines: {
        baseRule: {
          display: 'visible',
          minItems: 2,
          maxItems: 2,
          requiredItems: 1,
        },
        subFields: {
          value: {
            baseRule: { display: 'visible', required: true },
          },
        },
      },
      city: {
        baseRule: { display: 'visible', required: true },
      },
      state: {
        baseRule: { display: 'visible', required: true },
      },
      postalCode: {
        baseRule: { display: 'visible', required: true },
      },
      country: {
        baseRule: { display: 'visible', required: true },
      },
    },
    fromResponseFn: (addressesFromApi: AddressDto[]) => {
      return addressesFromApi.map((address) => ({
        ...address,
        addressLines: address.addressLines.map((line: any) => ({
          value: line.value,
        })),
        state: address.state ?? '',
        addressType: address.addressType ?? 'LEGAL_ADDRESS',
      }));
    },
    toRequestFn: (addresses): AddressDto[] => {
      return addresses.map((address) => ({
        ...address,
        addressLines: address.addressLines.map(({ value }) => value),
      }));
    },
  },
  individualPhone: {
    path: 'individualDetails.phone',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: { phoneType: 'MOBILE_PHONE', phoneNumber: '' },
    },
    fromResponseFn: (val: PhoneSmbdo) => ({
      phoneType: val.phoneType!,
      phoneNumber: `${val.countryCode}${val.phoneNumber}`,
    }),
    toRequestFn: (val): PhoneSmbdo => {
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

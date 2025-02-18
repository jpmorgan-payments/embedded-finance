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
  industry: {
    path: 'organizationDetails.industry',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: { code: '', codeType: 'NAICS' },
    },
    fromResponseFn: (val) => ({
      code: val.code!,
      codeType: val.codeType!,
    }),
    toRequestFn: (val) => {
      return {
        codeType: 'NAICS',
        code: val.code,
      };
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
    modifyErrorField: (field) => {
      const parts = field.split('.');
      const lastPart = parts[parts.length - 1];
      const secondToLastPart = parts[parts.length - 2];
      if (secondToLastPart === 'addressLines' && /^\d+$/.test(lastPart)) {
        if (lastPart === '0') {
          return [
            ...parts.slice(0, parts.length - 2),
            'primaryAddressLine',
          ].join('.');
        }

        return [
          ...parts.slice(0, parts.length - 2),
          'additionalAddressLines',
          Number(lastPart) - 1,
          'value',
        ].join('.');
      }

      return field;
    },
    baseRule: {
      display: 'visible',
      minItems: 1,
      maxItems: 1,
      defaultValue: [
        {
          addressType: 'BUSINESS_ADDRESS',
          primaryAddressLine: '',
          additionalAddressLines: [{ value: '' }],
          city: '',
          state: '',
          postalCode: '',
          country: '',
        },
      ],
      defaultAppendValue: {
        addressType: 'BUSINESS_ADDRESS',
        primaryAddressLine: '',
        additionalAddressLines: [{ value: '' }],
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
      primaryAddressLine: {
        baseRule: { display: 'visible', required: true },
      },
      additionalAddressLines: {
        baseRule: {
          display: 'visible',
          minItems: 1,
          maxItems: 1,
        },
        subFields: {
          value: {
            baseRule: { display: 'visible', required: false },
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
        primaryAddressLine: address?.addressLines?.[0] ?? '',
        additionalAddressLines:
          address?.addressLines?.length > 1
            ? address.addressLines?.slice(1).map((line: any) => ({
                value: line.value,
              }))
            : [{ value: '' }],
        state: address.state ?? '',
        addressType: address.addressType ?? 'LEGAL_ADDRESS',
      }));
    },
    toRequestFn: (addresses): AddressDto[] => {
      return addresses.map((address) => ({
        ...address,
        addressLines: [
          address.primaryAddressLine,
          ...address.additionalAddressLines
            .filter((line) => line.value)
            .map((line) => line.value),
        ],
      }));
    },
  },
  associatedCountries: {
    path: 'organizationDetails.associatedCountries',
    baseRule: {
      display: 'hidden',
      minItems: 0,
      maxItems: 100,
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
      minItems: 0,
      maxItems: 1,
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
        conditionalRules: [
          {
            condition: {
              product: ['EMBEDDED_PAYMENTS'],
            },
            rule: { interaction: 'disabled', defaultValue: 'US' },
          },
        ],
      },
      value: {
        baseRule: { display: 'visible', required: true },
      },
      description: {
        baseRule: { display: 'visible', required: false },
        conditionalRules: [
          {
            condition: {
              product: ['EMBEDDED_PAYMENTS'],
            },
            rule: { display: 'hidden' },
          },
        ],
      },
      expiryDate: {
        baseRule: { display: 'visible', required: false },
        conditionalRules: [
          {
            condition: {
              product: ['EMBEDDED_PAYMENTS'],
            },
            rule: { display: 'hidden' },
          },
        ],
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
      display: 'hidden',
      minItems: 0,
      maxItems: 50,
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

    subFields: {
      idType: {
        baseRule: { display: 'visible', required: true },
        conditionalRules: [
          {
            condition: {
              product: ['EMBEDDED_PAYMENTS'],
            },
            rule: { interaction: 'disabled' },
          },
        ],
      },
      issuer: {
        baseRule: { display: 'visible', required: true },
        conditionalRules: [
          {
            condition: {
              product: ['EMBEDDED_PAYMENTS'],
            },
            rule: { interaction: 'disabled', defaultValue: 'US' },
          },
        ],
      },
      value: {
        baseRule: { display: 'visible', required: true },
      },
      description: {
        baseRule: { display: 'visible', required: false },
        conditionalRules: [
          {
            condition: {
              product: ['EMBEDDED_PAYMENTS'],
            },
            rule: { display: 'hidden' },
          },
        ],
      },
      expiryDate: {
        baseRule: { display: 'visible', required: false },
        conditionalRules: [
          {
            condition: {
              product: ['EMBEDDED_PAYMENTS'],
            },
            rule: { display: 'hidden' },
          },
        ],
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
    modifyErrorField: (field) => {
      const parts = field.split('.');
      const lastPart = parts[parts.length - 1];
      const secondToLastPart = parts[parts.length - 2];
      if (secondToLastPart === 'addressLines' && /^\d+$/.test(lastPart)) {
        if (lastPart === '0') {
          return [
            ...parts.slice(0, parts.length - 2),
            'primaryAddressLine',
          ].join('.');
        }

        return [
          ...parts.slice(0, parts.length - 2),
          'additionalAddressLines',
          Number(lastPart) - 1,
          'value',
        ].join('.');
      }

      return field;
    },
    baseRule: {
      display: 'visible',
      minItems: 1,
      maxItems: 1,
      defaultValue: [
        {
          addressType: 'RESIDENTIAL_ADDRESS',
          primaryAddressLine: '',
          additionalAddressLines: [{ value: '' }],
          city: '',
          state: '',
          postalCode: '',
          country: '',
        },
      ],
      defaultAppendValue: {
        addressType: 'RESIDENTIAL_ADDRESS',
        primaryAddressLine: '',
        additionalAddressLines: [{ value: '' }],
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
    },
    subFields: {
      addressType: {
        baseRule: { display: 'visible', required: true },
      },
      primaryAddressLine: {
        baseRule: { display: 'visible', required: true },
      },
      additionalAddressLines: {
        baseRule: {
          display: 'visible',
          minItems: 1,
          maxItems: 1,
        },
        subFields: {
          value: {
            baseRule: { display: 'visible', required: false },
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
        primaryAddressLine: address?.addressLines?.[0] ?? '',
        additionalAddressLines:
          address?.addressLines?.length > 1
            ? address.addressLines?.slice(1).map((line: any) => ({
                value: line.value,
              }))
            : [{ value: '' }],
        state: address.state ?? '',
        addressType: address.addressType ?? 'LEGAL_ADDRESS',
      }));
    },
    toRequestFn: (addresses): AddressDto[] => {
      return addresses.map((address) => ({
        ...address,
        addressLines: [
          address.primaryAddressLine,
          ...address.additionalAddressLines
            .filter((line) => line.value)
            .map((line) => line.value),
        ],
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

import { i18n } from '@/i18n/config';
import {
  formatPhoneNumberIntl,
  parsePhoneNumber,
} from 'react-phone-number-input';

import { AddressDto, PhoneSmbdo } from '@/api/generated/smbdo.schemas';
import naicsCodes from '@/components/IndustryTypeSelect/naics-codes.json';

import { PartyFieldMap } from './types';

// Source of truth for mapping form fields to API fields
// path is used for handling server errors and mapping values from/to the API
// rules are used for configuring field display, required, etc.
export const partyFieldMap: PartyFieldMap = {
  externalId: {
    path: 'externalId',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: '',
    },
  },
  ownerExternalId: {
    path: 'externalId',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: '',
    },
  },
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
    fromResponseFn: (val) => (val === 'PLACEHOLDER_ORG_NAME' ? '' : val),
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
    conditionalRules: [
      {
        condition: {
          product: ['EMBEDDED_PAYMENTS'],
        },
        rule: {
          interaction: 'disabled',
        },
      },
    ],
  },
  organizationEmail: {
    path: 'email',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: '',
    },
  },
  controllerEmail: {
    path: 'email',
    baseRule: {
      display: 'visible',
      required: false,
      defaultValue: '',
    },
  },
  ownerEmail: {
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
      defaultValue: '',
    },
    toStringFn: (val) => {
      const industry = naicsCodes.find((code) => code.id === val);
      return `[${val}]  ${industry?.sectorDescription} - ${industry?.description}`;
    },
    fromResponseFn: (val) => val.code,
    toRequestFn: (val) => {
      return {
        codeType: 'NAICS',
        code: val,
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
    toStringFn: (addresses) => {
      const primaryAddress = addresses[0];
      return [
        primaryAddress.primaryAddressLine,
        ...primaryAddress.additionalAddressLines.map((line) => line.value),
        `${primaryAddress.city}, ${primaryAddress.state} ${primaryAddress.postalCode}`,
        i18n.t(`common:countries.${primaryAddress.country}`),
      ];
    },
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
          requiredItems: 0,
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
      minItems: 1,
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
        issuer: 'US',
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
    generateLabelStringFn: (val) => {
      const primaryId = val?.[0];
      if (!primaryId) {
        return undefined;
      }
      return `${i18n.t(`idValueLabels.${primaryId.idType}`)} (${primaryId.issuer})`;
    },
    toStringFn: (val) => {
      const primaryId = val[0];
      return primaryId.value.replace(/(\d{2})(\d{7})/, '$1 - $2');
    },
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
    toStringFn: (val) => formatPhoneNumberIntl(val.phoneNumber),
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
    toStringFn: (val, formValues) =>
      !formValues.websiteNotAvailable ? val : undefined,
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
  websiteNotAvailable: {
    path: 'organizationDetails.websiteAvailable',
    isHiddenInReview: () => true,
    baseRule: {
      display: 'visible',
      required: false,
      defaultValue: false,
    },
    fromResponseFn: (val: boolean) => !val,
    toRequestFn: (val): boolean => !val,
  },
  dbaNameNotAvailable: {
    excludeFromMapping: true,
    isHiddenInReview: () => true,
    baseRule: {
      display: 'visible',
      required: false,
      defaultValue: false,
    },
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
    toStringFn: (val) =>
      new Date(val).toLocaleDateString('default', {
        month: 'long',
        day: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
      }),
  },
  countryOfResidence: {
    path: 'individualDetails.countryOfResidence',
    baseRule: { display: 'visible', required: true, defaultValue: '' },
    toStringFn: (val) => `${i18n.t(`common:countries.${val}`)} (${val})`,
  },
  controllerFirstName: {
    path: 'individualDetails.firstName',
    baseRule: { display: 'visible', required: true, defaultValue: '' },
  },
  controllerMiddleName: {
    path: 'individualDetails.middleName',
    baseRule: { display: 'visible', required: false, defaultValue: '' },
  },
  controllerLastName: {
    path: 'individualDetails.lastName',
    baseRule: { display: 'visible', required: true, defaultValue: '' },
  },
  controllerNameSuffix: {
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
  ownerFirstName: {
    path: 'individualDetails.firstName',
    baseRule: { display: 'visible', required: true, defaultValue: '' },
  },
  ownerMiddleName: {
    path: 'individualDetails.middleName',
    baseRule: { display: 'visible', required: false, defaultValue: '' },
  },
  ownerLastName: {
    path: 'individualDetails.lastName',
    baseRule: { display: 'visible', required: true, defaultValue: '' },
  },
  ownerNameSuffix: {
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
  controllerIds: {
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
    generateLabelStringFn: (val) => {
      const primaryId = val?.[0];
      if (!primaryId) {
        return undefined;
      }
      return `${i18n.t(`idValueLabels.${primaryId.idType}`)} (${primaryId.issuer})`;
    },
    toStringFn: (val) => {
      const primaryId = val[0];
      return primaryId.value.replace(/(\d{3})(\d{2})(\d{4})/, '*** - ** - $3');
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
            rule: { interaction: 'enabled', defaultValue: 'US' },
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
  ownerIds: {
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
  controllerJobTitle: {
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
  ownerJobTitle: {
    path: 'individualDetails.jobTitle',
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
  controllerJobTitleDescription: {
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
      {
        condition: {
          product: ['EMBEDDED_PAYMENTS'],
          entityType: ['SOLE_PROPRIETORSHIP'],
        },
        rule: { interaction: 'disabled' },
      },
    ],
  },
  ownerJobTitleDescription: {
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
      {
        condition: {
          product: ['EMBEDDED_PAYMENTS'],
          entityType: ['SOLE_PROPRIETORSHIP'],
        },
        rule: { interaction: 'disabled' },
      },
    ],
  },
  natureOfOwnership: {
    path: 'individualDetails.natureOfOwnership',
    baseRule: { display: 'visible', required: false, defaultValue: '' },
  },
  controllerAddresses: {
    path: 'individualDetails.addresses',
    toStringFn: (addresses) => {
      const primaryAddress = addresses[0];
      return [
        primaryAddress.primaryAddressLine,
        ...primaryAddress.additionalAddressLines.map((line) => line.value),
        `${primaryAddress.city}, ${primaryAddress.state} ${primaryAddress.postalCode}`,
        i18n.t(`common:countries.${primaryAddress.country}`),
      ];
    },
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
          country: 'US',
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
  ownerAddresses: {
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
          requiredItems: 0,
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
  controllerPhone: {
    path: 'individualDetails.phone',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: { phoneType: 'MOBILE_PHONE', phoneNumber: '' },
    },
    toStringFn: (val) => formatPhoneNumberIntl(val.phoneNumber),
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
  ownerPhone: {
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

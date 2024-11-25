import { parsePhoneNumber } from 'react-phone-number-input';

import { PhoneSmbdo } from '@/api/generated/smbdo.schemas';

import { PartyFieldMap } from './types';

// Source of truth for mapping form fields to API fields
// Used for handling server errors and creating request bodies
export const partyFieldMap: PartyFieldMap = {
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
  email: {
    path: 'email',
    baseRule: { visibility: 'visible', required: true },
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
      {
        condition: {
          product: ['EMBEDDED_PAYMENTS'],
          entityType: ['LIMITED_LIABILITY_COMPANY'],
        },
        rule: { visibility: 'disabled' },
      },
    ],
  },
  organizationDescription: {
    path: 'organizationDetails.organizationDescription',
    baseRule: { visibility: 'visible', required: false },
  },
  industryCategory: {
    path: 'organizationDetails.industryCategory',
    baseRule: { visibility: 'visible', required: true },
  },
  industryType: {
    path: 'organizationDetails.industryType',
    baseRule: { visibility: 'visible', required: true },
  },
  entitiesInOwnership: {
    path: 'organizationDetails.entitiesInOwnership',
    baseRule: { visibility: 'visible', required: true },
    fromResponseFn: (val: boolean) => (val ? 'yes' : 'no'),
    toRequestFn: (val): boolean => val === 'yes',
  },
  mcc: {
    path: 'organizationDetails.mcc',
    baseRule: { visibility: 'visible', required: false },
  },
  addresses: {
    path: 'organizationDetails.addresses',
    baseRule: { visibility: 'visible', minItems: 1, maxItems: 1 },
    conditionalRules: [
      {
        condition: {
          product: ['EMBEDDED_PAYMENTS'],
        },
        rule: { maxItems: 3 },
      },
    ],
  },
  associatedCountries: {
    path: 'organizationDetails.associatedCountries',
    baseRule: {
      visibility: 'visible',
      maxItems: 100,
    },
  },
  jurisdiction: {
    path: 'organizationDetails.jurisdiction',
    baseRule: { visibility: 'visible', required: true },
  },
  organizationIds: {
    path: 'organizationDetails.organizationIds',
    baseRule: { visibility: 'visible', maxItems: 6 },
  },
  organizationPhone: {
    path: 'organizationDetails.phone',
    baseRule: { visibility: 'visible', required: true },
    fromResponseFn: (val: PhoneSmbdo) => ({
      phoneType: val.phoneType,
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
  tradeOverInternet: {
    path: 'organizationDetails.tradeOverInternet',
    baseRule: { visibility: 'visible', required: true },
    fromResponseFn: (val: boolean) => (val ? 'yes' : 'no'),
    toRequestFn: (val): boolean => val === 'yes',
  },
  website: {
    path: 'organizationDetails.website',
    baseRule: { visibility: 'visible', required: false },
  },
  websiteAvailable: {
    path: 'organizationDetails.websiteAvailable',
    baseRule: { visibility: 'visible', required: false },
  },
  secondaryMccList: {
    path: 'organizationDetails.secondaryMccList',
    baseRule: { visibility: 'visible', maxItems: 50 },
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
    baseRule: { visibility: 'visible', maxItems: 6 },
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
  soleOwner: {
    path: 'individualDetails.soleOwner',
    baseRule: { visibility: 'visible', required: true },
  },
  individualAddresses: {
    path: 'individualDetails.addresses',
    baseRule: { visibility: 'visible', minItems: 1, maxItems: 1 },
    conditionalRules: [
      {
        condition: {
          product: ['EMBEDDED_PAYMENTS'],
        },
        rule: { maxItems: 3 },
      },
    ],
  },
  individualPhone: {
    path: 'individualDetails.phone',
    baseRule: { visibility: 'visible', required: true },
    fromResponseFn: (val: PhoneSmbdo) => ({
      phoneType: val.phoneType,
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

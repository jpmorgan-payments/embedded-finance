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
    baseRule: { visibility: 'readonly', required: true },
  },
  countryOfFormation: {
    path: 'organizationDetails.countryOfFormation',
    baseRule: { visibility: 'visible', required: true },
  },
  email: {
    path: 'organizationDetails.email',
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
  organizationDescription: 'organizationDetails.organizationDescription',
  industryCategory: 'organizationDetails.industryCategory',
  industryType: 'organizationDetails.industryType',
  entitiesInOwnership: {
    path: 'organizationDetails.entitiesInOwnership',
    fromResponseFn: (val: boolean) => (val ? 'yes' : 'no'),
    toRequestFn: (val): boolean => val === 'yes',
  },
  mcc: { path: 'organizationDetails.mcc', useCases: [] },
  addresses: 'organizationDetails.addresses',
  associatedCountries: 'organizationDetails.associatedCountries',
  jurisdiction: 'organizationDetails.jurisdiction',
  organizationIds: 'organizationDetails.organizationIds',
  organizationPhone: {
    path: 'organizationDetails.phone',
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
    fromResponseFn: (val: boolean) => (val ? 'yes' : 'no'),
    toRequestFn: (val): boolean => val === 'yes',
    useCases: [],
  },
  website: {
    path: 'organizationDetails.website',
    useCases: [],
  },
  websiteAvailable: {
    path: 'organizationDetails.websiteAvailable',
    useCases: [],
  },
  secondaryMccList: {
    path: 'organizationDetails.secondaryMccList',
    useCases: [],
  },
  birthDate: 'individualDetails.birthDate',
  countryOfResidence: 'individualDetails.countryOfResidence',
  firstName: 'individualDetails.firstName',
  middleName: 'individualDetails.middleName',
  lastName: 'individualDetails.lastName',
  nameSuffix: { path: 'individualDetails.nameSuffix', useCases: ['EF'] },
  individualIds: { path: 'individualDetails.individualIds', useCases: ['EF'] },
  jobTitle: { path: 'individualDetails.jobTitle', useCases: ['EF'] },
  jobTitleDescription: {
    path: 'individualDetails.jobTitleDescription',
    useCases: ['EF'],
  },
  natureOfOwnership: 'individualDetails.natureOfOwnership',
  soleOwner: 'individualDetails.soleOwner',
  individualAddresses: {
    path: 'individualDetails.addresses',
    useCases: ['EF', 'CanadaMS'],
  },
  individualPhone: 'individualDetails.phone',
};

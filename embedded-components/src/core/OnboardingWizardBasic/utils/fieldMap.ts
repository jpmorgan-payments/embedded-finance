import { parsePhoneNumber } from 'react-phone-number-input';
import { z } from 'zod';

import { PhoneSmbdo } from '@/api/generated/smbdo.schemas';

import { IndividualStepFormSchema } from '../IndividualStepForm/IndividualStepForm.schema';
import { InitialStepFormSchema } from '../InitialStepForm/InitialStepForm.schema';
import { OrganizationStepFormSchema } from '../OrganizationStepForm/OrganizationStepForm.schema';
import { OnboardingUseCase } from './types';

// TODO: add more form schemas here
export type OnboardingWizardFormValues = z.infer<typeof InitialStepFormSchema> &
  z.infer<typeof OrganizationStepFormSchema> &
  z.infer<typeof IndividualStepFormSchema>;

type PartyFieldMap = {
  [K in keyof OnboardingWizardFormValues]?:
    | string
    | {
        path: string;
        useCases?: Array<OnboardingUseCase>;
        fromResponseFn?: (val: any) => OnboardingWizardFormValues[K];
        toRequestFn?: (val: OnboardingWizardFormValues[K]) => any;
      };
};

// Source of truth for mapping form fields to API fields
// Used for handling server errors and creating request bodies
export const partyFieldMap: PartyFieldMap = {
  organizationName: 'organizationDetails.organizationName',
  organizationType: 'organizationDetails.organizationType',
  countryOfFormation: 'organizationDetails.countryOfFormation',
  email: 'email',
  yearOfFormation: 'organizationDetails.yearOfFormation',
  dbaName: { path: 'organizationDetails.dbaName', useCases: ['EF'] },
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

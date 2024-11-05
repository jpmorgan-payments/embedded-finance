import { parsePhoneNumber } from 'react-phone-number-input';
import { z } from 'zod';
import { FieldConfiguration } from './types';


import { IndividualStepFormSchema } from '../IndividualStepForm/IndividualStepForm.schema';
import { InitialStepFormSchema } from '../InitialStepForm/InitialStepForm.schema';
import { OrganizationStepFormSchema } from '../OrganizationStepForm/OrganizationStepForm.schema';

// TODO: add more form schemas here
export type OnboardingWizardFormValues = z.infer<typeof InitialStepFormSchema> &
  z.infer<typeof OrganizationStepFormSchema> &
  z.infer<typeof IndividualStepFormSchema>;

type PartyFieldMap = {
  [K in keyof OnboardingWizardFormValues]: FieldConfiguration;
};

// Source of truth for mapping form fields to API fields
// Used for handling server errors and creating request bodies
export const partyFieldMap: Partial<PartyFieldMap> = {
  organizationName: {
    path: 'organizationDetails.organizationName',
    baseRule: { visibility: 'visible' },
  },
  organizationType: {
    path: 'organizationDetails.organizationType',
    baseRule: { visibility: 'visible' },
  },
  dbaName: {
    path: 'organizationDetails.dbaName',
    baseRule: { visibility: 'visible' },
    conditionalRules: [
      {
        condition: {
          product: ['CanadaMS'],
          jurisdiction: ['CA'],
        },
        rule: { visibility: 'hidden' },
      },
      {
        condition: {
          product: ['EF'],
          entityType: ['LLC'],
        },
        rule: { 
          visibility: 'disabled',
          defaultValue: 'N/A'
        },
      }
    ],
  },
  addresses: {
    path: 'organizationDetails.addresses',
    baseRule: { 
      visibility: 'visible',
      maxItems: 1 
    },
    conditionalRules: [
      {
        condition: {
          product: ['EF'],
        },
        rule: { maxItems: 3 },
      }
    ],
  },
  organizationPhone: {
    path: 'organizationDetails.phone',
    baseRule: { visibility: 'visible' },
    fromResponseFn: (val) => ({
      phoneType: val.phoneType,
      phoneNumber: `${val.countryCode}${val.phoneNumber}`,
    }),
    toRequestFn: (val) => {
      const phone = parsePhoneNumber(val.phoneNumber);
      return {
        phoneType: val.phoneType,
        countryCode: phone?.countryCallingCode ? `+${phone.countryCallingCode}` : '',
        phoneNumber: phone?.nationalNumber ?? '',
      };
    },
  },
  countryOfFormation: {
    path: 'organizationDetails.countryOfFormation',
    baseRule: { visibility: 'visible' },
  },
  jurisdiction: {
    path: 'organizationDetails.jurisdiction',
    baseRule: { visibility: 'visible' },
  },
  product: {
    path: 'organizationDetails.product',
    baseRule: { visibility: 'visible' },
  },
  email: {
    path: 'contactDetails.email',
    baseRule: { visibility: 'visible' },
  },
  // Add other missing fields here
  // ... configure other fields similarly
};

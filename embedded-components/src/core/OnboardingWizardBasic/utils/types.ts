import { z } from 'zod';

import {
  ClientProduct,
  CountryCodeIsoAlpha2,
  OrganizationType,
} from '@/api/generated/smbdo.schemas';

import { IndividualStepFormSchema } from '../IndividualStepForm/IndividualStepForm.schema';
import { InitialStepFormSchema } from '../InitialStepForm/InitialStepForm.schema';
import { OrganizationStepFormSchema } from '../OrganizationStepForm/OrganizationStepForm.schema';

// TODO: add more form schemas here
export type OnboardingWizardFormValues = z.infer<typeof InitialStepFormSchema> &
  z.infer<typeof OrganizationStepFormSchema> &
  z.infer<typeof IndividualStepFormSchema>;

export type Jurisdiction = 'US' | 'CA';

export type FieldVisibility = 'visible' | 'hidden' | 'disabled' | 'readonly';

export type FieldRule = {
  visibility?: FieldVisibility;
  required?: boolean;
  minItems?: number;
  maxItems?: number;
  requiredItems?: number;
};

export type ClientContext = {
  product?: ClientProduct;
  jurisdiction?: CountryCodeIsoAlpha2;
  entityType?: OrganizationType;
};

type FieldRuleCondition = {
  product?: ClientProduct[];
  jurisdiction?: CountryCodeIsoAlpha2[];
  entityType?: OrganizationType[];
};

export type FieldConfiguration<K extends keyof OnboardingWizardFormValues> = {
  path: string;
  baseRule: FieldRule;
  conditionalRules?: Array<{
    condition: FieldRuleCondition;
    rule: Partial<FieldRule>;
  }>;
  fromResponseFn?: (val: any) => OnboardingWizardFormValues[K];
  toRequestFn?: (val: OnboardingWizardFormValues[K]) => any;
  subFields?: Record<
    string,
    Pick<FieldConfiguration<any>, 'baseRule' | 'conditionalRules'>
  >;
};

export type PartyFieldMap = {
  [K in keyof OnboardingWizardFormValues]?: FieldConfiguration<K>;
};

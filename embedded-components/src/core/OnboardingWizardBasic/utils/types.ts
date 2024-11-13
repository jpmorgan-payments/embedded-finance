import { z } from 'zod';

import { ClientProduct, OrganizationType } from '@/api/generated/smbdo.schemas';

import { IndividualStepFormSchema } from '../IndividualStepForm/IndividualStepForm.schema';
import { InitialStepFormSchema } from '../InitialStepForm/InitialStepForm.schema';
import { OrganizationStepFormSchema } from '../OrganizationStepForm/OrganizationStepForm.schema';

// TODO: add more form schemas here
export type OnboardingWizardFormValues = z.infer<typeof InitialStepFormSchema> &
  z.infer<typeof OrganizationStepFormSchema> &
  z.infer<typeof IndividualStepFormSchema>;

export type Jurisdiction = 'US' | 'CA';

type FieldVisibility = 'visible' | 'hidden' | 'disabled' | 'readonly';

type FieldRule = {
  visibility: FieldVisibility;
  required?: boolean;
  minItems?: number;
  maxItems?: number;
};

type FieldRuleCondition = {
  product?: ClientProduct[];
  jurisdiction?: Jurisdiction[];
  entityType?: OrganizationType[];
};

type FieldConfiguration<K extends keyof OnboardingWizardFormValues> = {
  path: string;
  baseRule: FieldRule;
  conditionalRules?: Array<{
    condition: FieldRuleCondition;
    rule: Partial<FieldRule>;
  }>;
  fromResponseFn?: (val: any) => OnboardingWizardFormValues[K];
  toRequestFn?: (val: OnboardingWizardFormValues[K]) => any;
};

export type PartyFieldMap = {
  [K in keyof OnboardingWizardFormValues]?: FieldConfiguration<K>;
};

import { FieldArrayPath } from 'react-hook-form';
import { z } from 'zod';

import {
  ClientProduct,
  CountryCodeIsoAlpha2,
  OrganizationType,
} from '@/api/generated/smbdo.schemas';

import { IndividualStepFormSchema } from '../IndividualStepForm/IndividualStepForm.schema';
import { InitialStepFormSchema } from '../InitialStepForm/InitialStepForm.schema';
import { OrganizationStepFormSchema } from '../OrganizationStepForm/OrganizationStepForm.schema';

export type Entries<T> = {
  [K in keyof T]-?: [K, T[K]];
}[keyof T][];

// TODO: add more form schemas here
export type OnboardingWizardFormValues = z.infer<typeof InitialStepFormSchema> &
  z.infer<typeof OrganizationStepFormSchema> &
  z.infer<typeof IndividualStepFormSchema>;

export type OnboardingWizardArrayFieldNames =
  FieldArrayPath<OnboardingWizardFormValues>;

export type Jurisdiction = 'US' | 'CA';

export type FieldVisibility = 'visible' | 'hidden' | 'disabled' | 'readonly';

export type FieldRule = {
  visibility?: FieldVisibility;
  required?: boolean;
};

export type ArrayFieldRule = {
  visibility?: FieldVisibility;
  minItems?: number;
  maxItems?: number;
  // requiredItems should always be less than or equal to minItems
  requiredItems?: number;
};

export function isArrayFieldRule(
  rule: FieldRule | ArrayFieldRule
): rule is ArrayFieldRule {
  return 'minItems' in rule || 'maxItems' in rule || 'requiredItems' in rule;
}

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

type BaseFieldConfiguration = {
  baseRule: FieldRule;
  conditionalRules?: Array<{
    condition: FieldRuleCondition;
    rule: Partial<FieldRule>;
  }>;
  excludeFromMapping?: boolean;
};

export interface FieldConfigurationWithMapping<
  K extends keyof OnboardingWizardFormValues,
  T extends OnboardingWizardFormValues[K] = OnboardingWizardFormValues[K],
> extends BaseFieldConfiguration {
  excludeFromMapping?: false;
  path: string;
  fromResponseFn?: (val: any) => T;
  toRequestFn?: (val: T) => any;
}

export interface FieldConfigurationNoMapping extends BaseFieldConfiguration {
  excludeFromMapping: true;
  path?: never;
  fromResponseFn?: never;
  toRequestFn?: never;
}

export type FieldConfiguration<K extends keyof OnboardingWizardFormValues> =
  | FieldConfigurationWithMapping<K>
  | FieldConfigurationNoMapping;

export interface ArrayFieldConfiguration<
  K extends OnboardingWizardArrayFieldNames,
> extends Omit<FieldConfiguration<K>, 'baseRule' | 'conditionalRules'> {
  baseRule: ArrayFieldRule;
  conditionalRules?: Array<{
    condition: FieldRuleCondition;
    rule: Partial<ArrayFieldRule>;
  }>;
  subFields?: Record<
    string,
    Pick<FieldConfiguration<any>, 'baseRule' | 'conditionalRules'>
  >;
}

export type CombinedFieldConfiguration<
  K extends keyof OnboardingWizardFormValues,
> = K extends OnboardingWizardArrayFieldNames
  ? ArrayFieldConfiguration<K>
  : FieldConfiguration<K>;

export type PartyFieldMap = {
  [K in keyof OnboardingWizardFormValues]: CombinedFieldConfiguration<K>;
};

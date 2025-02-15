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

// TODO: add more form schemas here
export type OnboardingWizardFormValues = z.infer<typeof InitialStepFormSchema> &
  z.infer<typeof OrganizationStepFormSchema> &
  z.infer<typeof IndividualStepFormSchema>;

export type OnboardingTopLevelArrayFieldNames = Extract<
  FieldArrayPath<OnboardingWizardFormValues>,
  keyof OnboardingWizardFormValues
>;

export type Jurisdiction = 'US' | 'CA';

export type FieldVisibility = 'visible' | 'hidden' | 'disabled' | 'readonly';

export type FieldRule<T> = {
  visibility?: FieldVisibility;
  required?: boolean;
  defaultValue?: T;
};

export type ArrayFieldRule<T> = {
  visibility?: FieldVisibility;
  minItems?: number;
  maxItems?: number;
  requiredItems?: number; // requiredItems should always be less than or equal to minItems
  defaultAppendValue?: T;
};

export function isArrayFieldRule<T>(
  rule: FieldRule<T> | ArrayFieldRule<T>
): rule is ArrayFieldRule<T> {
  return 'minItems' in rule || 'maxItems' in rule || 'requiredItems' in rule;
}

export type ClientContext = {
  product?: ClientProduct;
  jurisdiction?: CountryCodeIsoAlpha2;
  entityType?: OrganizationType;
};

export type FieldRuleCondition = {
  product?: ClientProduct[];
  jurisdiction?: CountryCodeIsoAlpha2[];
  entityType?: OrganizationType[];
};

type BaseFieldConfiguration<T> = {
  baseRule: FieldRule<T>;
  conditionalRules?: Array<{
    condition: FieldRuleCondition;
    rule: FieldRule<T>;
  }>;
  excludeFromMapping?: boolean;
};

type FieldConfigurationGeneric<K extends string, T> =
  | ({
      key?: K; // phantom property
      excludeFromMapping?: false;
      path: string;
      fromResponseFn?: (val: any) => T;
      toRequestFn?: (val: T) => any;
    } & BaseFieldConfiguration<T>)
  | ({
      key?: K; // phantom property
      excludeFromMapping: true;
      path?: never;
      fromResponseFn?: never;
      toRequestFn?: never;
    } & BaseFieldConfiguration<T>);

interface ArrayFieldConfigurationGeneric<
  K extends string,
  T extends readonly unknown[],
> extends Omit<
    FieldConfigurationGeneric<K, T>,
    'baseRule' | 'conditionalRules'
  > {
  baseRule: ArrayFieldRule<T>;
  conditionalRules?: Array<{
    condition: FieldRuleCondition;
    rule: ArrayFieldRule<T>;
  }>;
  subFields: {
    [P in Extract<
      keyof T[number],
      string
    >]: T[number][P] extends readonly unknown[]
      ? ArrayFieldConfigurationGeneric<P, T[number][P]>
      : Pick<
          FieldConfigurationGeneric<P, T[number][P]>,
          'baseRule' | 'conditionalRules'
        >;
  };
}

export type AnyFieldConfiguration =
  | FieldConfigurationGeneric<any, any>
  | ArrayFieldConfigurationGeneric<any, any>;

type CombinedFieldConfigurationFor<T, K extends string> = [T] extends [boolean]
  ? FieldConfigurationGeneric<K, boolean>
  : T extends readonly unknown[]
    ? ArrayFieldConfigurationGeneric<K, T>
    : FieldConfigurationGeneric<K, T>;

export type CombinedFieldConfiguration<
  K extends keyof OnboardingWizardFormValues,
> = CombinedFieldConfigurationFor<OnboardingWizardFormValues[K], K & string>;

export type PartyFieldMap = {
  [K in keyof OnboardingWizardFormValues]: CombinedFieldConfiguration<K>;
};

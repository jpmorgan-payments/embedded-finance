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
export type OnboardingFormValuesSubmit = z.output<
  typeof InitialStepFormSchema
> &
  z.output<typeof OrganizationStepFormSchema> &
  z.output<typeof IndividualStepFormSchema>;

export type OnboardingFormValuesInitial = z.input<
  typeof InitialStepFormSchema
> &
  z.input<typeof OrganizationStepFormSchema> &
  z.input<typeof IndividualStepFormSchema>;

export type OnboardingTopLevelArrayFieldNames = Extract<
  FieldArrayPath<OnboardingFormValuesSubmit>,
  keyof OnboardingFormValuesSubmit
>;

export type Jurisdiction = 'US' | 'CA';

export type FieldDisplayConfig = 'visible' | 'hidden';
export type FieldInteractionConfig = 'enabled' | 'disabled' | 'readonly';

export type FieldRule<T = any> = {
  display?: FieldDisplayConfig;
  interaction?: FieldInteractionConfig;
  required?: boolean;
  defaultValue: T;
};

export type ArrayFieldRule<T extends readonly unknown[] = any> = {
  display?: FieldDisplayConfig;
  interaction?: FieldInteractionConfig;
  minItems?: number;
  maxItems?: number;
  requiredItems?: number; // requiredItems should always be less than or equal to minItems
  defaultValue: T;
  defaultAppendValue: T[number];
};

export function isArrayFieldRule<T extends readonly unknown[]>(
  rule:
    | ArrayFieldRule<T>
    | FieldRule<T>
    | OptionalDefaults<ArrayFieldRule<T>>
    | OptionalDefaults<FieldRule<T>>
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

//  Base configuration for all fields
type BaseFieldConfiguration<T, IsSubField extends boolean = false> = {
  baseRule: OptionalDefaults<FieldRule<T>, IsSubField>;
  conditionalRules?: Array<{
    condition: FieldRuleCondition;
    rule: OptionalDefaults<FieldRule<T>, true>;
  }>;
  excludeFromMapping?: boolean;
};

type DefaultKeys<Rule> = Extract<
  'defaultValue' | 'defaultAppendValue',
  keyof Rule
>;

export type OptionalDefaults<
  Rule,
  IsOptional extends boolean = true,
> = IsOptional extends true
  ? Omit<Rule, DefaultKeys<Rule>> & Partial<Pick<Rule, DefaultKeys<Rule>>>
  : Rule;

type FieldConfigurationGeneric<
  K extends string,
  T,
  IsSubfield extends boolean = false,
> =
  | ({
      key?: K; // phantom property
      excludeFromMapping?: false;
      path: string;
      fromResponseFn?: (val: any) => T;
      toRequestFn?: (val: T) => any;
    } & BaseFieldConfiguration<T, IsSubfield>)
  | ({
      key?: K; // phantom property
      excludeFromMapping: true;
      path?: never;
      fromResponseFn?: never;
      toRequestFn?: never;
    } & BaseFieldConfiguration<T, IsSubfield>);

interface ArrayFieldConfigurationGeneric<
  K extends string,
  T extends readonly unknown[],
  IsSubfield extends boolean = false,
> extends Omit<
    FieldConfigurationGeneric<K, T>,
    'baseRule' | 'conditionalRules'
  > {
  baseRule: OptionalDefaults<ArrayFieldRule<T>, IsSubfield>;
  conditionalRules?: Array<{
    condition: FieldRuleCondition;
    rule: OptionalDefaults<ArrayFieldRule<T>, true>;
  }>;
  subFields: {
    [P in Extract<
      keyof T[number],
      string
    >]: T[number][P] extends readonly unknown[]
      ? ArrayFieldConfigurationGeneric<P, T[number][P], true>
      : Pick<
          FieldConfigurationGeneric<P, T[number][P], true>,
          'baseRule' | 'conditionalRules'
        >;
  };
}

export function isArrayFieldConfiguration<T extends readonly unknown[]>(
  config: AnyFieldConfiguration
): config is ArrayFieldConfigurationGeneric<string, T> {
  return 'subFields' in config;
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
  K extends keyof OnboardingFormValuesInitial,
> = CombinedFieldConfigurationFor<OnboardingFormValuesInitial[K], K & string>;

export type PartyFieldMap = {
  [K in keyof OnboardingFormValuesInitial]: CombinedFieldConfiguration<K>;
};

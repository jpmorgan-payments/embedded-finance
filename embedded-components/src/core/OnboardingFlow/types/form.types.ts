import { FieldArrayPath } from 'react-hook-form';
import { z } from 'zod';

import {
  ClientProduct,
  CountryCodeIsoAlpha2,
  OrganizationType,
} from '@/api/generated/smbdo.schemas';
import {
  BusinessContactInfoFormSchema,
  createCompanyIdentificationFormSchema,
  CustomerFacingDetailsFormSchema,
  IndustryFormSchema,
} from '@/core/OnboardingFlow/forms/business-section-forms';
import {
  ContactDetailsFormSchema,
  IndividualIdentityFormSchema,
  PersonalDetailsFormSchema,
} from '@/core/OnboardingFlow/forms/personal-section-forms';
import { GatewayScreenFormSchema } from '@/core/OnboardingFlow/screens/GatewayScreen/GatewayScreen.schema';

// MAINTAIN: When adding a new schema, just add it to this array
const ONBOARDING_FORM_SCHEMAS = [
  GatewayScreenFormSchema,
  PersonalDetailsFormSchema,
  IndividualIdentityFormSchema,
  ContactDetailsFormSchema,
  IndustryFormSchema,
  createCompanyIdentificationFormSchema(),
  CustomerFacingDetailsFormSchema,
  BusinessContactInfoFormSchema,
] as const;

type MergeSchemaInputs<TSchemas extends readonly z.ZodTypeAny[]> =
  TSchemas extends readonly [
    infer First extends z.ZodTypeAny,
    ...infer Rest extends readonly z.ZodTypeAny[],
  ]
    ? z.input<First> & MergeSchemaInputs<Rest>
    : {};

type MergeSchemaOutputs<TSchemas extends readonly z.ZodTypeAny[]> =
  TSchemas extends readonly [
    infer First extends z.ZodTypeAny,
    ...infer Rest extends readonly z.ZodTypeAny[],
  ]
    ? z.output<First> & MergeSchemaOutputs<Rest>
    : {};

// Generate the combined input and output types from the schema array
export type OnboardingFormValuesInitial = MergeSchemaInputs<
  typeof ONBOARDING_FORM_SCHEMAS
>;
export type OnboardingFormValuesSubmit = MergeSchemaOutputs<
  typeof ONBOARDING_FORM_SCHEMAS
>;

export type OnboardingTopLevelArrayFieldNames = Extract<
  FieldArrayPath<OnboardingFormValuesSubmit>,
  keyof OnboardingFormValuesSubmit
>;

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
  requiredItems?: number;
  maxItems?: number;
  defaultValue: T;
  defaultAppendValue: T[number];
};

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
  modifyErrorField?: (field: string) => string;
  toStringFn?: (
    val: T,
    values: Partial<OnboardingFormValuesSubmit>
  ) => string | string[] | undefined;
  generateLabelStringFn?: (val: T) => string | undefined;
  isHiddenInReview?: (val: T) => boolean;
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
  K extends keyof OnboardingFormValuesInitial,
  T,
  IsSubfield extends boolean = false,
> =
  | ({
      key?: K; // phantom property
      excludeFromMapping?: false;
      path: string;
      fromResponseFn?: (val: any) => T;
      toRequestFn?: (val: OnboardingFormValuesSubmit[K]) => any;
    } & BaseFieldConfiguration<T, IsSubfield>)
  | ({
      key?: K; // phantom property
      excludeFromMapping: true;
      path?: never;
      fromResponseFn?: never;
      toRequestFn?: never;
    } & BaseFieldConfiguration<T, IsSubfield>);

export interface ArrayFieldConfigurationGeneric<
  K extends keyof OnboardingFormValuesInitial,
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
      keyof OnboardingFormValuesInitial
    >]: T[number][P] extends readonly unknown[]
      ? Pick<
          ArrayFieldConfigurationGeneric<P, T[number][P], true>,
          'baseRule' | 'conditionalRules' | 'subFields'
        >
      : Pick<
          FieldConfigurationGeneric<P, T[number][P], true>,
          'baseRule' | 'conditionalRules'
        >;
  };
}

export type AnyFieldConfiguration =
  | FieldConfigurationGeneric<any, any>
  | ArrayFieldConfigurationGeneric<any, any>;

type CombinedFieldConfigurationFor<
  T,
  K extends keyof OnboardingFormValuesInitial,
> = [T] extends [boolean]
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

import { FieldArrayPath } from 'react-hook-form';
import { z } from 'zod';

import {
  ClientProduct,
  CountryCodeIsoAlpha2,
  OrganizationType,
} from '@/api/generated/smbdo.schemas';
import {
  useBusinessContactInfoFormSchema,
  useBusinessIdentityFormSchema,
  useIndustryFormSchema,
} from '@/core/OnboardingFlow/forms/business-section-forms';
import {
  useContactDetailsFormSchema,
  useIndividualIdentityFormSchema,
  usePersonalDetailsFormSchema,
} from '@/core/OnboardingFlow/forms/personal-section-forms';
import { GatewayScreenFormSchema } from '@/core/OnboardingFlow/screens/GatewayScreen/GatewayScreen.schema';
import { ScreenId } from '@/core/OnboardingFlow/types/flow.types';

// MAINTAIN: When adding a new schema, just add it to this array
type OnboardingFormSchemaType = [
  typeof GatewayScreenFormSchema,
  ReturnType<typeof usePersonalDetailsFormSchema>,
  ReturnType<typeof useIndividualIdentityFormSchema>,
  ReturnType<typeof useContactDetailsFormSchema>,
  ReturnType<typeof useBusinessIdentityFormSchema>,
  ReturnType<typeof useIndustryFormSchema>,
  ReturnType<typeof useBusinessContactInfoFormSchema>,
];

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
export type OnboardingFormValuesInitial =
  MergeSchemaInputs<OnboardingFormSchemaType>;
export type OnboardingFormValuesSubmit =
  MergeSchemaOutputs<OnboardingFormSchemaType>;

export type OnboardingTopLevelArrayFieldNames = Extract<
  FieldArrayPath<OnboardingFormValuesSubmit>,
  keyof OnboardingFormValuesSubmit
>;

export type FieldDisplayConfig = 'visible' | 'hidden';

export type FieldInteractionConfig = 'enabled' | 'disabled' | 'readonly';

export type FieldContentTokenKey =
  | 'label'
  | 'description'
  | 'tooltip'
  | 'placeholder'
  | 'fieldName'
  | 'sectionTitle'
  | 'sectionDescription';

export type ContentTokenOverrides = {
  [key in FieldContentTokenKey]?: string;
};

/**
 * Input widget kinds understood by `OnboardingFormField`. Single source of
 * truth for the field `type` prop — imported by both the component and the
 * declarative field config so a field's presentation can be described in one
 * place instead of hand-passed at every call site.
 */
export type OnboardingFieldInputType =
  | 'text'
  | 'email'
  | 'select'
  | 'radio-group'
  | 'radio-group-blocks'
  | 'checkbox'
  | 'checkbox-basic'
  | 'array'
  | 'date'
  | 'textarea'
  | 'combobox'
  | 'industrySelect'
  | 'phone'
  | 'importantDate';

/**
 * Declarative presentation for a field: how it should be rendered when a
 * consumer (e.g. the delta-mode pending-fields panel) needs to build the input
 * from the field config alone, without bespoke per-field code.
 *
 * Only presentation *mechanics* live here — labels/descriptions/placeholders
 * still come from the i18n content tokens keyed by the field name. `customEditor`
 * is a tag (not a component) so this config stays free of React/component
 * imports and avoids cycles; each surface maps the tag to its own editor.
 */
export type FieldPresentation = {
  /** Input widget type. Defaults to `'text'` when omitted. */
  type?: OnboardingFieldInputType;
  /** Mask pattern forwarded to the input (e.g. `'### - ## - ####'`). */
  maskFormat?: string;
  /** Mask placeholder char (e.g. `'_'`). */
  maskChar?: string;
  /** Maximum character length constraint (e.g. `4` for yearOfFormation). */
  maxLength?: number;
  /** Obfuscate the value while the field is not focused (SSN / EIN). */
  obfuscateWhenUnfocused?: boolean;
  /**
   * Appended to the field path to reach the editable leaf when the control
   * lives on a sub-path of the reported value (e.g. phone → `.phoneNumber`).
   */
  pathSuffix?: string;
  /**
   * For options-based inputs (`type: 'select' | 'combobox'`), names the option
   * set so a consumer building the field from config alone (e.g. the delta
   * panel) can supply the choices without bespoke per-field code.
   * - `'countries'` → ISO country list (label + search value from i18n).
   * - `'jobTitles'` → controller / owner job titles.
   */
  optionsSource?: 'countries' | 'jobTitles';
  /**
   * Dependent fields this field reveals based on its live value — mirrors the
   * step form's conditional rendering (e.g. `controllerJobTitle: 'Other'`
   * reveals `controllerJobTitleDescription`). A consumer building fields from
   * config (the delta panel) renders each named field, reactively, right after
   * this one whenever the live value is one of `whenValueIn`.
   */
  revealsFields?: Array<{ name: string; whenValueIn: string[] }>;
  /**
   * Names a composite custom editor the consumer renders instead of a plain
   * `OnboardingFormField` (e.g. `'identity'` → the SSN/ITIN/passport switcher,
   * `'address'` → the multi-field address block).
   */
  customEditor?: 'identity' | 'address';
};

/**
 * Marks a field as counting toward the delta-mode eligibility heuristic (the
 * light "few fields remaining" gate — see utils/deltaMode.ts). fieldMap is the
 * single source of truth: WHICH fields count (this flag), WHERE their value
 * lives (the entry's `path`), and whether the check is US-only. The heuristic
 * therefore no longer hard-codes API shape.
 */
export type DeltaEligibilityRule = {
  /** Party whose data holds this field (drives which parties are inspected). */
  party: 'organization' | 'individual';
  /**
   * Count as pending only when the party is US-based (organization:
   * `countryOfFormation`; individual: `countryOfResidence`). Omit to count for
   * any country (e.g. date of birth).
   */
  usOnly?: boolean;
};

export type FieldRule<T = any> = {
  display?: FieldDisplayConfig;
  interaction?: FieldInteractionConfig;
  required?: boolean;
  contentTokenOverrideKey?: string;
  contentTokenOverrides?: ContentTokenOverrides;
  /**
   * When true and the field is `readonly`, the field will automatically
   * switch to `enabled` if it has a validation error (e.g. from
   * invalid API data detected via validateOnMount). This lets the user
   * correct the value without requiring a separate edit flow.
   */
  editableWhenInvalid?: boolean;
  /**
   * When true, the field value is included in the form submission
   * even when `display` is `'hidden'`. The field won't render any
   * UI but its `defaultValue` will be registered and submitted.
   */
  submitWhenHidden?: boolean;
  defaultValue: T;
};

export type ArrayFieldRule<T extends readonly unknown[] = any> = {
  display?: FieldDisplayConfig;
  interaction?: FieldInteractionConfig;
  contentTokenOverrideKey?: string;
  contentTokenOverrides?: ContentTokenOverrides;
  editableWhenInvalid?: boolean;
  submitWhenHidden?: boolean;
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
  screenId?: ScreenId[];
};

//  Base configuration for all fields
type BaseFieldConfiguration<T, IsSubField extends boolean = false> = {
  baseRule: OptionalDefaults<FieldRule<T>, IsSubField>;
  conditionalRules?: Array<{
    condition: FieldRuleCondition;
    rule: OptionalDefaults<FieldRule<T>, true>;
  }>;
  /**
   * Declarative render descriptor. Lets consumers build the field's input from
   * config alone (see {@link FieldPresentation}) instead of bespoke per-field code.
   */
  presentation?: FieldPresentation;
  /**
   * Marks the field for the delta-mode eligibility heuristic (see
   * {@link DeltaEligibilityRule} and utils/deltaMode.ts).
   */
  deltaEligibility?: DeltaEligibilityRule;
  modifyErrorField?: (field: string) => string;
  toStringFn?: (
    val: T | undefined,
    values: Partial<OnboardingFormValuesSubmit>
  ) => string | string[] | undefined;
  generateLabelStringFn?: (val: T) => string | undefined;
  isHiddenInReviewFn?: (
    val: T,
    values: Partial<OnboardingFormValuesSubmit>
  ) => boolean;
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
      saveResponseInContext?: never;
      path: string;
      fromResponseFn?: (val: any) => T | undefined;
      toRequestFn?: (val: OnboardingFormValuesSubmit[K]) => any;
    } & BaseFieldConfiguration<T, IsSubfield>)
  | ({
      key?: K; // phantom property
      excludeFromMapping: true;
      saveResponseInContext?: boolean;
      path?: string;
      fromResponseFn?: (val: any) => T | undefined;
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
  : [T] extends [readonly unknown[]]
    ? ArrayFieldConfigurationGeneric<K, T & readonly unknown[]>
    : FieldConfigurationGeneric<K, T>;

export type CombinedFieldConfiguration<
  K extends keyof OnboardingFormValuesInitial,
> = CombinedFieldConfigurationFor<OnboardingFormValuesInitial[K], K & string>;

export type PartyFieldMap = {
  [K in keyof OnboardingFormValuesInitial]: CombinedFieldConfiguration<K>;
};

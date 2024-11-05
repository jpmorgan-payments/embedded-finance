export type Product = 'EF' | 'CanadaMS'; // extend as needed
export type Jurisdiction = 'US' | 'CA'; // extend as needed
export type LegalEntityType = 'LLC' | 'CORPORATION'; // extend as needed

export type FieldVisibility = 'visible' | 'hidden' | 'disabled';

export type FieldRule = {
  visibility: FieldVisibility;
  defaultValue?: any;
  maxItems?: number; // for collection fields
  validation?: any; // optional zod schema
};

export type FieldRuleCondition = {
  product?: Product[];
  jurisdiction?: Jurisdiction[];
  entityType?: LegalEntityType[];
};

export type FieldConfiguration = {
  path: string;
  baseRule: FieldRule; // default behavior
  conditionalRules?: Array<{
    condition: FieldRuleCondition;
    rule: Partial<FieldRule>;
  }>;
  fromResponseFn?: (val: any) => any;
  toRequestFn?: (val: any) => any;
};

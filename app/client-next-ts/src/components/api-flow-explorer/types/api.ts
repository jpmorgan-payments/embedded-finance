// API-related type definitions

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type ClientProduct = 'EMBEDDED_PAYMENTS' | 'MERCHANT_SERVICES';
export type CountryCode = 'US' | 'CA';
export type OrganizationType =
  | 'LLC'
  | 'CORPORATION'
  | 'PARTNERSHIP'
  | 'SOLE_PROPRIETORSHIP';

export interface OnboardingCriteria {
  product: ClientProduct;
  jurisdiction: CountryCode;
  legalEntityType: OrganizationType;
}

export interface CriteriaOptions {
  products: ClientProduct[];
  jurisdictions: CountryCode[];
  legalEntityTypes: OrganizationType[];
}

export interface ApiOperation {
  operationId: string;
  method: HttpMethod;
  path: string;
  summary: string;
  description: string;
  requestBody?: RequestBodySchema;
  responses: ResponseSchema[];
  tags: string[];
}

export interface RequestBodySchema {
  required: boolean;
  content: {
    [mediaType: string]: {
      schema: JsonSchema;
      examples?: { [key: string]: any };
    };
  };
}

export interface ResponseSchema {
  statusCode: string;
  description: string;
  content?: {
    [mediaType: string]: {
      schema: JsonSchema;
    };
  };
}

export interface JsonSchema {
  type?: string;
  properties?: { [key: string]: JsonSchema };
  required?: string[];
  items?: JsonSchema;
  enum?: any[];
  format?: string;
  description?: string;
  example?: any;
  $ref?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
}

export interface ParsedApiSpec {
  operations: Map<string, ApiOperation>;
  schemas: Map<string, JsonSchema>;
  examples: Map<string, any>;
}

export interface ApiAttribute {
  operationId: string;
  jsonPath: string;
  name: string;
  type: string;
  required: boolean;
  description?: string;
  group: AttributeGroup;
  constraints?: FieldConstraints;
}

export interface AttributeGroup {
  id: string;
  name: string;
  description?: string;
}

export interface FieldConstraints {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  format?: string;
}

import type {
  ApiAttribute,
  JsonSchema,
  ApiOperation,
  AttributeGroup,
  FieldConstraints,
} from '../types';

/**
 * Extracts all payload attributes from API operations with their JSON paths
 */
export function extractPayloadAttributes(
  operations: Map<string, ApiOperation>,
  schemas: Map<string, JsonSchema>,
): ApiAttribute[] {
  const attributes: ApiAttribute[] = [];

  operations.forEach((operation) => {
    if (operation.requestBody?.content?.['application/json']?.schema) {
      const schema = operation.requestBody.content['application/json'].schema;
      const resolvedSchema = resolveSchemaReferences(schema, schemas);

      const operationAttributes = extractAttributesFromSchema(
        resolvedSchema,
        operation.operationId,
        '',
        schemas,
      );

      attributes.push(...operationAttributes);
    }
  });

  return attributes;
}

/**
 * Recursively extracts attributes from a JSON schema
 */
function extractAttributesFromSchema(
  schema: JsonSchema,
  operationId: string,
  basePath: string,
  allSchemas: Map<string, JsonSchema>,
  depth: number = 0,
): ApiAttribute[] {
  const attributes: ApiAttribute[] = [];

  // Prevent infinite recursion
  if (depth > 10) {
    return attributes;
  }

  if (schema.type === 'object' && schema.properties) {
    Object.entries(schema.properties).forEach(
      ([propertyName, propertySchema]) => {
        const jsonPath = basePath
          ? `${basePath}.${propertyName}`
          : propertyName;
        const isRequired = schema.required?.includes(propertyName) || false;

        // Create attribute for this property
        const attribute: ApiAttribute = {
          operationId,
          jsonPath,
          name: propertyName,
          type: getSchemaType(propertySchema),
          required: isRequired,
          description: propertySchema.description,
          group: determineAttributeGroup(jsonPath, propertyName),
          constraints: extractFieldConstraints(propertySchema),
        };

        attributes.push(attribute);

        // Recursively process nested objects
        if (propertySchema.type === 'object' || propertySchema.properties) {
          const nestedAttributes = extractAttributesFromSchema(
            propertySchema,
            operationId,
            jsonPath,
            allSchemas,
            depth + 1,
          );
          attributes.push(...nestedAttributes);
        }

        // Handle arrays of objects
        if (propertySchema.type === 'array' && propertySchema.items) {
          if (
            propertySchema.items.type === 'object' ||
            propertySchema.items.properties
          ) {
            const arrayItemPath = `${jsonPath}[*]`;
            const arrayAttributes = extractAttributesFromSchema(
              propertySchema.items,
              operationId,
              arrayItemPath,
              allSchemas,
              depth + 1,
            );
            attributes.push(...arrayAttributes);
          }
        }
      },
    );
  }

  return attributes;
}

/**
 * Resolves schema references ($ref) to actual schema objects
 */
function resolveSchemaReferences(
  schema: JsonSchema,
  allSchemas: Map<string, JsonSchema>,
): JsonSchema {
  if (typeof schema !== 'object' || schema === null) {
    return schema;
  }

  // Handle $ref resolution
  if ('$ref' in schema && typeof schema.$ref === 'string') {
    const refPath = schema.$ref;
    if (refPath.startsWith('#/components/schemas/')) {
      const schemaName = refPath.replace('#/components/schemas/', '');
      const referencedSchema = allSchemas.get(schemaName);
      if (referencedSchema) {
        return resolveSchemaReferences(referencedSchema, allSchemas);
      }
    }
    return schema;
  }

  // Recursively resolve references in properties
  const resolvedSchema: JsonSchema = { ...schema };

  if (schema.properties) {
    resolvedSchema.properties = {};
    Object.entries(schema.properties).forEach(([key, propSchema]) => {
      resolvedSchema.properties![key] = resolveSchemaReferences(
        propSchema,
        allSchemas,
      );
    });
  }

  if (schema.items) {
    resolvedSchema.items = resolveSchemaReferences(schema.items, allSchemas);
  }

  return resolvedSchema;
}

/**
 * Determines the type string for a JSON schema
 */
function getSchemaType(schema: JsonSchema): string {
  if (schema.enum) {
    return `enum(${schema.enum.join(' | ')})`;
  }

  if (schema.type === 'array' && schema.items) {
    const itemType = getSchemaType(schema.items);
    return `${itemType}[]`;
  }

  if (schema.format) {
    return `${schema.type}(${schema.format})`;
  }

  return schema.type || 'unknown';
}

/**
 * Determines the logical group for an attribute based on its path and name
 */
function determineAttributeGroup(
  jsonPath: string,
  propertyName: string,
): AttributeGroup {
  // Business entity information
  if (
    jsonPath.includes('business') ||
    jsonPath.includes('entity') ||
    jsonPath.includes('company')
  ) {
    return {
      id: 'business_entity',
      name: 'Business Entity',
      description: 'Information about the business entity being onboarded',
    };
  }

  // Personal information
  if (
    jsonPath.includes('person') ||
    jsonPath.includes('individual') ||
    jsonPath.includes('owner')
  ) {
    return {
      id: 'personal_info',
      name: 'Personal Information',
      description:
        'Personal details of individuals associated with the business',
    };
  }

  // Address information
  if (
    jsonPath.includes('address') ||
    propertyName.includes('address') ||
    ['street', 'city', 'state', 'zip', 'country'].some((field) =>
      propertyName.toLowerCase().includes(field),
    )
  ) {
    return {
      id: 'address',
      name: 'Address Information',
      description: 'Physical and mailing address details',
    };
  }

  // Financial information
  if (
    jsonPath.includes('bank') ||
    jsonPath.includes('financial') ||
    jsonPath.includes('account') ||
    ['routing', 'account_number', 'tax_id', 'ein'].some((field) =>
      propertyName.toLowerCase().includes(field),
    )
  ) {
    return {
      id: 'financial',
      name: 'Financial Information',
      description: 'Banking and financial account details',
    };
  }

  // Contact information
  if (
    ['phone', 'email', 'contact'].some((field) =>
      propertyName.toLowerCase().includes(field),
    )
  ) {
    return {
      id: 'contact',
      name: 'Contact Information',
      description: 'Phone numbers, email addresses, and other contact details',
    };
  }

  // Legal and compliance
  if (
    jsonPath.includes('legal') ||
    jsonPath.includes('compliance') ||
    jsonPath.includes('kyc') ||
    ['license', 'permit', 'registration'].some((field) =>
      propertyName.toLowerCase().includes(field),
    )
  ) {
    return {
      id: 'legal_compliance',
      name: 'Legal & Compliance',
      description:
        'Legal structure, licenses, and compliance-related information',
    };
  }

  // Default group
  return {
    id: 'general',
    name: 'General Information',
    description: "General attributes that don't fit into specific categories",
  };
}

/**
 * Extracts field constraints from a JSON schema
 */
function extractFieldConstraints(
  schema: JsonSchema,
): FieldConstraints | undefined {
  const constraints: FieldConstraints = {};
  let hasConstraints = false;

  if (typeof schema.minLength === 'number') {
    constraints.minLength = schema.minLength;
    hasConstraints = true;
  }

  if (typeof schema.maxLength === 'number') {
    constraints.maxLength = schema.maxLength;
    hasConstraints = true;
  }

  if (typeof schema.minimum === 'number') {
    constraints.minimum = schema.minimum;
    hasConstraints = true;
  }

  if (typeof schema.maximum === 'number') {
    constraints.maximum = schema.maximum;
    hasConstraints = true;
  }

  if (typeof schema.pattern === 'string') {
    constraints.pattern = schema.pattern;
    hasConstraints = true;
  }

  if (typeof schema.format === 'string') {
    constraints.format = schema.format;
    hasConstraints = true;
  }

  return hasConstraints ? constraints : undefined;
}

/**
 * Filters attributes by operation ID
 */
export function filterAttributesByOperation(
  attributes: ApiAttribute[],
  operationId: string,
): ApiAttribute[] {
  return attributes.filter((attr) => attr.operationId === operationId);
}

/**
 * Groups attributes by their logical categories
 */
export function groupAttributesByCategory(
  attributes: ApiAttribute[],
): Map<string, ApiAttribute[]> {
  const grouped = new Map<string, ApiAttribute[]>();

  attributes.forEach((attribute) => {
    const groupId = attribute.group.id;
    if (!grouped.has(groupId)) {
      grouped.set(groupId, []);
    }
    grouped.get(groupId)!.push(attribute);
  });

  return grouped;
}

/**
 * Searches attributes by name or JSON path
 */
export function searchAttributes(
  attributes: ApiAttribute[],
  searchTerm: string,
): ApiAttribute[] {
  const lowerSearchTerm = searchTerm.toLowerCase();

  return attributes.filter(
    (attribute) =>
      attribute.name.toLowerCase().includes(lowerSearchTerm) ||
      attribute.jsonPath.toLowerCase().includes(lowerSearchTerm) ||
      attribute.description?.toLowerCase().includes(lowerSearchTerm),
  );
}

// Utility functions for Arazzo Flow Dialog
import YAML from 'yaml';

import type { ArazzoSpec, HttpVerb, OasOperationInfo, OasSpec } from '../types';

/**
 * Truncate a string to a specified number of words
 */
export function truncateWords(input?: string, maxWords: number = 12): string {
  if (!input) return '';
  const words = input.trim().split(/\s+/);
  if (words.length <= maxWords) return input;
  return words.slice(0, maxWords).join(' ') + '…';
}

/**
 * Parse Arazzo specification from YAML string
 */
export function parseArazzoSpec(rawText: string): ArazzoSpec | null {
  try {
    const parsed = YAML.parse(rawText) as unknown;
    if (parsed && typeof parsed === 'object') return parsed as ArazzoSpec;
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse OpenAPI specification from YAML string
 */
export function parseOasSpec(rawText: string): OasSpec | null {
  try {
    const parsed = YAML.parse(rawText) as unknown;
    if (parsed && typeof parsed === 'object') return parsed as OasSpec;
    return null;
  } catch {
    return null;
  }
}

/**
 * Detect HTTP verb from operation ID
 */
export function detectHttpVerb(operationId?: string): HttpVerb {
  if (!operationId) return 'CALL';
  const id = operationId.toLowerCase();

  const verbMapping: Record<string, HttpVerb> = {
    post: 'POST',
    get: 'GET',
    put: 'PUT',
    patch: 'PATCH',
    delete: 'DELETE',
  };

  for (const [key, verb] of Object.entries(verbMapping)) {
    if (id.includes(key)) return verb;
  }

  return 'CALL';
}

/**
 * Get payload from workflow step
 */
export function getStepPayload(step?: any): unknown | undefined {
  return step?.requestBody?.payload;
}

/**
 * Find the corresponding operation in the OAS spec based on the operationId
 */
export function findOasOperation(
  operationId: string | undefined,
  oasSpec: OasSpec | null
): OasOperationInfo | undefined {
  if (!operationId || !oasSpec || !oasSpec.paths) return undefined;

  // Standardize operationId formats for matching
  const normalize = (id: string): string =>
    id
      .toLowerCase()
      .replace(/^smbdo-/, '')
      .replace(/-/g, '')
      .replace(/_/g, '');

  const normalizedOpId = normalize(operationId);

  // Look through all paths and methods to find the operation
  for (const [path, pathObj] of Object.entries(oasSpec.paths)) {
    for (const [method, operation] of Object.entries(pathObj)) {
      if (!operation.operationId) continue;

      // Check with different normalization strategies
      const opId = operation.operationId;
      if (
        opId === operationId ||
        normalize(opId) === normalizedOpId ||
        // Handle other common variations
        opId === `smbdo-${operationId}` ||
        operationId === `smbdo-${opId}` ||
        opId.includes(operationId) ||
        operationId.includes(opId)
      ) {
        return {
          verb: method.toUpperCase(),
          path,
          summary: operation.summary,
          description: operation.description,
          parameters: operation.parameters,
          requestBody: operation.requestBody,
          responses: operation.responses,
          tags: operation.tags,
        };
      }
    }
  }

  // If no match found, try again with more lenient matching
  for (const [path, pathObj] of Object.entries(oasSpec.paths)) {
    for (const [method, operation] of Object.entries(pathObj)) {
      if (!operation.operationId) continue;

      // Try to match by checking if one is substring of another
      const opId = operation.operationId.toLowerCase();
      const searchId = operationId.toLowerCase();

      if (opId.includes(searchId) || searchId.includes(opId)) {
        return {
          verb: method.toUpperCase(),
          path,
          summary: operation.summary,
          description: operation.description,
          parameters: operation.parameters,
          requestBody: operation.requestBody,
          responses: operation.responses,
          tags: operation.tags,
        };
      }
    }
  }

  return undefined;
}

/**
 * Resolve a schema reference in the OAS specification
 */
export function resolveSchemaRef(
  ref: string,
  oasSpec: OasSpec | null
): Record<string, any> | null {
  if (!ref || !oasSpec) return null;

  // Handle references by finding the referenced schema
  // References are typically in the format: "#/components/schemas/SchemaName"
  const refPath = ref.split('/').slice(1);
  let refSchema: any = oasSpec;

  for (const refSegment of refPath) {
    if (!refSchema[refSegment]) return null;
    refSchema = refSchema[refSegment];
  }

  // If the resolved schema also has a reference, resolve it recursively
  if (refSchema.$ref) {
    return resolveSchemaRef(refSchema.$ref, oasSpec);
  }

  return refSchema;
}

/**
 * Function to extract OAS schema details for a path
 */
export function getSchemaForPath(
  path: string,
  oasSpec: OasSpec | null,
  operationId?: string
): Record<string, any> | null {
  if (!oasSpec || !operationId) return null;

  // Find the operation in the OAS
  const operation = findOasOperation(operationId, oasSpec);
  if (!operation) {
    return null;
  }

  // Get the schema for the operation
  let rootSchema: Record<string, any> | null = null;

  // Check for request body schema in POST operations
  if (
    operation.verb === 'POST' ||
    operation.verb === 'PUT' ||
    operation.verb === 'PATCH'
  ) {
    rootSchema =
      operation.requestBody?.content?.['application/json']?.schema || null;
  }
  // For GET operations, look for response schema
  else if (
    operation.verb === 'GET' &&
    operation.responses?.['200']?.content?.['application/json']?.schema
  ) {
    rootSchema = operation.responses['200'].content['application/json'].schema;
  }

  if (!rootSchema) return null;

  // Parse the path to navigate the schema
  // Remove the basePath prefix if present
  const normalizedPath = path.startsWith('$') ? path.substring(1) : path;
  const segments = normalizedPath
    .split(/\.|\[|\]/)
    .filter((s) => s && s !== '$');

  // Navigate through the schema to find the relevant part
  let currentSchema: Record<string, any> | null = rootSchema;

  for (const segment of segments) {
    if (!currentSchema) return null;

    // If we encounter a $ref, resolve it first
    if (currentSchema.$ref) {
      currentSchema = resolveSchemaRef(currentSchema.$ref, oasSpec);
      if (!currentSchema) return null;
    }

    // Handle numeric indices for arrays (dealing with items schema)
    if (!isNaN(Number(segment))) {
      // We're in an array, so we want the items schema
      if (currentSchema.items) {
        if (currentSchema.items.$ref) {
          currentSchema = resolveSchemaRef(currentSchema.items.$ref, oasSpec);
        } else {
          currentSchema = currentSchema.items;
        }
      } else {
        return null; // Not an array schema
      }
    } else {
      // For objects, navigate to the property (case-insensitive fallback)
      if (currentSchema.properties) {
        const props = currentSchema.properties as Record<string, any>;
        let propKey: string | undefined = undefined;
        if (props[segment]) {
          propKey = segment;
        } else {
          const lower = segment.toLowerCase();
          propKey = Object.keys(props).find((k) => k.toLowerCase() === lower);
        }

        if (propKey) {
          // Check if this property is required (case-insensitive)
          const isRequired =
            Array.isArray(currentSchema.required) &&
            currentSchema.required.some(
              (k: string) => k.toLowerCase() === propKey!.toLowerCase()
            );

          // Get the property schema
          currentSchema = props[propKey];

          // Add required flag if property is required
          if (isRequired && currentSchema) {
            currentSchema = { ...currentSchema, required: true };
          }
        }
      }
      // If it's allOf, oneOf, or anyOf, we might need to merge schemas
      else if (
        currentSchema.allOf ||
        currentSchema.oneOf ||
        currentSchema.anyOf
      ) {
        const schemaList: any[] =
          currentSchema.allOf || currentSchema.oneOf || currentSchema.anyOf;
        let found = false;

        // Try to find the property in any of the schemas
        for (const subSchema of schemaList) {
          let resolvedSchema: any = subSchema;

          // Resolve reference if needed
          if (subSchema.$ref) {
            const resolved = resolveSchemaRef(subSchema.$ref, oasSpec);
            if (!resolved) continue;
            resolvedSchema = resolved;
          }

          // Check if this schema has the property we're looking for
          if (resolvedSchema.properties) {
            const props = resolvedSchema.properties as Record<string, any>;
            let propKey: string | undefined = undefined;
            if (props[segment]) {
              propKey = segment;
            } else {
              const lower = segment.toLowerCase();
              propKey = Object.keys(props).find(
                (k) => k.toLowerCase() === lower
              );
            }

            if (propKey) {
              // Determine required from any schema in schemaList (case-insensitive)
              const isRequiredFromAny = schemaList.some((s: any) => {
                const rs = s.$ref ? resolveSchemaRef(s.$ref, oasSpec) : s;
                return (
                  rs &&
                  Array.isArray(rs.required) &&
                  rs.required.some(
                    (k: string) => k.toLowerCase() === propKey!.toLowerCase()
                  )
                );
              });
              // Also consider required defined at the outer schema level (common with allOf)
              const isRequiredOuter =
                Array.isArray((currentSchema as any).required) &&
                (currentSchema as any).required.some(
                  (k: string) => k.toLowerCase() === propKey!.toLowerCase()
                );

              currentSchema = props[propKey];

              if ((isRequiredFromAny || isRequiredOuter) && currentSchema) {
                currentSchema = { ...currentSchema, required: true };
              }

              found = true;
              break; // Found it!
            }
          }
        }

        // If we didn't find the property in any schema, return null
        if (!found) {
          return null;
        }
      } else {
        return null; // Property not found in schema
      }
    }
  }

  // Resolve trailing $ref so constraints like minLength/maxLength are visible
  if (currentSchema && (currentSchema as any).$ref) {
    const resolved = resolveSchemaRef((currentSchema as any).$ref, oasSpec);
    if (resolved) {
      currentSchema = resolved;
    }
  }

  return currentSchema;
}

/**
 * Extract validation constraints from a schema
 */
export function extractValidationConstraints(
  schema: Record<string, any> | null
): string {
  if (!schema) return '';

  const constraints: string[] = [];

  // Check for common validation keywords
  if (schema.required === true) constraints.push('Required');

  // String constraints
  if (schema.minLength !== undefined)
    constraints.push(`Min length: ${schema.minLength}`);
  if (schema.maxLength !== undefined)
    constraints.push(`Max length: ${schema.maxLength}`);
  if (schema.pattern) constraints.push(`Pattern: ${schema.pattern}`);
  if (schema.format) constraints.push(`Format: ${schema.format}`);

  // Numeric constraints
  if (schema.minimum !== undefined) constraints.push(`Min: ${schema.minimum}`);
  if (schema.maximum !== undefined) constraints.push(`Max: ${schema.maximum}`);
  if (schema.exclusiveMinimum === true) constraints.push('Exclusive min');
  if (schema.exclusiveMaximum === true) constraints.push('Exclusive max');

  // Array constraints
  if (schema.minItems !== undefined)
    constraints.push(`Min items: ${schema.minItems}`);
  if (schema.maxItems !== undefined)
    constraints.push(`Max items: ${schema.maxItems}`);

  // Enum constraints
  if (schema.enum) constraints.push(`Enum: [${schema.enum.join(', ')}]`);

  return constraints.join(', ');
}

/**
 * Flatten JSON paths for display
 */
export function flattenJsonPaths(
  value: unknown,
  basePath = '$'
): { path: string; value: unknown; schemaInfo?: Record<string, any> }[] {
  const rows: {
    path: string;
    value: unknown;
    schemaInfo?: Record<string, any>;
  }[] = [];
  function walk(v: unknown, p: string) {
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      for (const [k, child] of Object.entries(v as Record<string, unknown>)) {
        walk(child, `${p}.${k}`);
      }
    } else if (Array.isArray(v)) {
      v.forEach((child, idx) => walk(child, `${p}[${idx}]`));
    } else {
      rows.push({ path: p, value: v });
    }
  }
  if (value !== undefined) walk(value, basePath);
  return rows;
}

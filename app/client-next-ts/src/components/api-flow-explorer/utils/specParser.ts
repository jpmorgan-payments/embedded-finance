import * as YAML from 'yaml';
import type {
  ApiOperation,
  ParsedApiSpec,
  JsonSchema,
  RequestBodySchema,
  ResponseSchema,
  HttpMethod,
} from '../types';

// OpenAPI 3.0 specification interfaces
interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: {
    [path: string]: {
      [method: string]: OpenAPIOperation;
    };
  };
  components?: {
    schemas?: {
      [name: string]: JsonSchema;
    };
  };
}

interface OpenAPIOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  requestBody?: {
    required?: boolean;
    content: {
      [mediaType: string]: {
        schema: JsonSchema;
        examples?: { [key: string]: any };
      };
    };
  };
  responses: {
    [statusCode: string]: {
      description: string;
      content?: {
        [mediaType: string]: {
          schema: JsonSchema;
        };
      };
    };
  };
}

/**
 * Parses an OpenAPI YAML specification string into a structured format
 */
export function parseOpenAPISpec(yamlContent: string): ParsedApiSpec {
  try {
    const spec: OpenAPISpec = YAML.parse(yamlContent);

    const operations = new Map<string, ApiOperation>();
    const schemas = new Map<string, JsonSchema>();
    const examples = new Map<string, any>();

    // Extract component schemas
    if (spec.components?.schemas) {
      Object.entries(spec.components.schemas).forEach(([name, schema]) => {
        schemas.set(name, schema);
      });
    }

    // Extract operations from paths
    Object.entries(spec.paths).forEach(([path, pathItem]) => {
      Object.entries(pathItem).forEach(([method, operation]) => {
        if (isValidHttpMethod(method)) {
          const apiOperation = convertToApiOperation(
            path,
            method as HttpMethod,
            operation,
            spec,
          );

          if (apiOperation.operationId) {
            operations.set(apiOperation.operationId, apiOperation);
          }

          // Extract examples
          if (operation.requestBody?.content) {
            Object.entries(operation.requestBody.content).forEach(
              ([mediaType, content]) => {
                if (content.examples) {
                  Object.entries(content.examples).forEach(
                    ([exampleName, example]) => {
                      const key = `${apiOperation.operationId}_${mediaType}_${exampleName}`;
                      examples.set(key, example);
                    },
                  );
                }
              },
            );
          }
        }
      });
    });

    return {
      operations,
      schemas,
      examples,
    };
  } catch (error) {
    throw new Error(
      `Failed to parse OpenAPI specification: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Extracts only POST operations from a parsed API specification
 */
export function extractPostOperations(
  parsedSpec: ParsedApiSpec,
): Map<string, ApiOperation> {
  const postOperations = new Map<string, ApiOperation>();

  parsedSpec.operations.forEach((operation, operationId) => {
    if (operation.method === 'POST') {
      postOperations.set(operationId, operation);
    }
  });

  return postOperations;
}

/**
 * Extracts request body schemas from POST operations
 */
export function extractRequestBodySchemas(
  postOperations: Map<string, ApiOperation>,
): Map<string, JsonSchema> {
  const requestBodySchemas = new Map<string, JsonSchema>();

  postOperations.forEach((operation, operationId) => {
    if (operation.requestBody?.content) {
      Object.entries(operation.requestBody.content).forEach(
        ([mediaType, content]) => {
          if (mediaType === 'application/json' && content.schema) {
            requestBodySchemas.set(operationId, content.schema);
          }
        },
      );
    }
  });

  return requestBodySchemas;
}

/**
 * Resolves schema references ($ref) to actual schema objects
 */
export function resolveSchemaReferences(
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

// Helper functions
function isValidHttpMethod(method: string): boolean {
  const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  return validMethods.includes(method.toUpperCase() as HttpMethod);
}

function convertToApiOperation(
  path: string,
  method: HttpMethod,
  operation: OpenAPIOperation,
  spec: OpenAPISpec,
): ApiOperation {
  const operationId =
    operation.operationId ||
    `${method.toLowerCase()}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;

  // Convert request body
  let requestBody: RequestBodySchema | undefined;
  if (operation.requestBody) {
    requestBody = {
      required: operation.requestBody.required || false,
      content: operation.requestBody.content,
    };
  }

  // Convert responses
  const responses: ResponseSchema[] = Object.entries(operation.responses).map(
    ([statusCode, response]) => ({
      statusCode,
      description: response.description,
      content: response.content,
    }),
  );

  return {
    operationId,
    method,
    path,
    summary: operation.summary || '',
    description: operation.description || '',
    requestBody,
    responses,
    tags: operation.tags || [],
  };
}

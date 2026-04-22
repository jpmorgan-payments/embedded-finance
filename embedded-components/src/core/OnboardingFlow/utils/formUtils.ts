import { useEffect, useRef } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { defaultResources, i18n } from '@/i18n/config';
import { objectEntries, objectKeys } from '@/utils/objectEntries';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  DefaultValues,
  FieldPath,
  useForm,
  useFormContext,
  UseFormProps,
  UseFormReturn,
} from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  ApiErrorReasonV2,
  ClientResponse,
  CreateClientRequestSmbdo,
  PartyResponse,
  UpdateClientRequestSmbdo,
  UpdatePartyRequest,
} from '@/api/generated/smbdo.schemas';
import { partyFieldMap } from '@/core/OnboardingFlow/config/fieldMap';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import { ScreenId } from '@/core/OnboardingFlow/types';
import {
  AnyFieldConfiguration,
  ArrayFieldConfigurationGeneric,
  ArrayFieldRule,
  ClientContext,
  CombinedFieldConfiguration,
  FieldContentTokenKey,
  FieldRule,
  OnboardingFormValuesInitial,
  OnboardingFormValuesSubmit,
  OnboardingTopLevelArrayFieldNames,
  OptionalDefaults,
} from '@/core/OnboardingFlow/types/form.types';

type FormError = {
  field?:
    | keyof OnboardingFormValuesSubmit
    | `${keyof OnboardingFormValuesSubmit}${string}`;
  message: string;
  path?: string;
};

function isArrayFieldRule<T extends readonly unknown[]>(
  rule:
    | ArrayFieldRule<T>
    | FieldRule<T>
    | OptionalDefaults<ArrayFieldRule<T>>
    | OptionalDefaults<FieldRule<T>>
): rule is ArrayFieldRule<T> {
  return 'minItems' in rule || 'maxItems' in rule;
}

function isArrayFieldConfiguration<T extends readonly unknown[]>(
  config: AnyFieldConfiguration
): config is ArrayFieldConfigurationGeneric<
  keyof OnboardingFormValuesInitial,
  T
> {
  return 'subFields' in config;
}

export function getPartyFieldConfig<K extends keyof OnboardingFormValuesSubmit>(
  fieldName: K
): CombinedFieldConfiguration<K> {
  const fieldConfig = partyFieldMap[fieldName];
  if (!fieldConfig) {
    throw new Error(`"${fieldName}" is not mapped in fieldMap`);
  }
  return fieldConfig;
}

/**
 * Converts API validation errors into form-friendly error objects
 * @param errors - Array of API error reasons
 * @param partyIndex - Index of the party in the form array
 * @param arrayName - Name of the array field ('parties' or 'addParties')
 * @returns Array of FormError objects with mapped field names and messages
 */
export function mapClientApiErrorsToFormErrors(
  errors: ApiErrorReasonV2[],
  partyIndex: number,
  arrayName: 'parties' | 'addParties'
): FormError[] {
  const fieldMapKeys = objectKeys(partyFieldMap);
  return errors.map((error) => {
    let remainingPath = '';
    const matchedKey = fieldMapKeys.find((key) => {
      const path = partyFieldMap[key]?.path;
      const errorFieldInDotNotation = error.field?.replace(/\[(\w+)\]/g, '.$1');
      if (
        path &&
        errorFieldInDotNotation &&
        errorFieldInDotNotation.startsWith(
          `$.${arrayName}.${partyIndex}.${path}`
        )
      ) {
        remainingPath = errorFieldInDotNotation.substring(
          `$.${arrayName}.${partyIndex}.${path}`.length
        );
        return true;
      }
      return false;
    });
    if (!matchedKey && error.field && error.field in partyFieldMap) {
      return {
        field: error.field as keyof typeof partyFieldMap,
        message: error.message,
        path: error.field,
      };
    }
    return {
      field: matchedKey ? `${matchedKey}${remainingPath}` : undefined,
      message: error.message,
      path: error.field,
    };
  });
}

/**
 * Converts API validation errors into form-friendly error objects
 * @param errors - Array of API error reasons
 * @returns Array of FormError objects with mapped field names and messages
 */
export function mapPartyApiErrorsToFormErrors(
  errors: ApiErrorReasonV2[]
): FormError[] {
  const fieldMapKeys = objectKeys(partyFieldMap);
  return errors.reduce((acc, error) => {
    const errorFieldInDotNotation = error.field?.replace(/\[(\w+)\]/g, '.$1');

    // Collect ALL matching fieldMap keys for this error path.
    // Multiple fieldMap entries can share the same API path
    // (e.g. solePropSsn and controllerIds both map to
    // individualDetails.individualIds). Emitting errors for all
    // matches lets form.setError() attach to whichever field is
    // actually registered in the current form.
    const matchedEntries: {
      key: keyof typeof partyFieldMap;
      remainingPath: string;
      modifyErrorField?: AnyFieldConfiguration['modifyErrorField'];
    }[] = [];

    fieldMapKeys.forEach((key) => {
      const path = partyFieldMap[key]?.path;
      if (path && errorFieldInDotNotation) {
        if (errorFieldInDotNotation.startsWith(`$.${path}`)) {
          matchedEntries.push({
            key,
            remainingPath: errorFieldInDotNotation.substring(
              `$.${path}`.length
            ),
            modifyErrorField: partyFieldMap[key]?.modifyErrorField,
          });
        } else if (errorFieldInDotNotation.startsWith(`$.party.${path}`)) {
          matchedEntries.push({
            key,
            remainingPath: errorFieldInDotNotation.substring(
              `$.party.${path}`.length
            ),
            modifyErrorField: partyFieldMap[key]?.modifyErrorField,
          });
        }
      }
    });

    // Handle edge case where the error field is in the field map but not matched
    if (
      matchedEntries.length === 0 &&
      error.field &&
      error.field in partyFieldMap
    ) {
      acc.push({
        field: error.field as keyof typeof partyFieldMap,
        message: error.message,
        path: error.field,
      });
    }

    for (const entry of matchedEntries) {
      let { remainingPath } = entry;

      // Server error path sometimes does not include the index for array fields,
      // so we assume it's the first index (0) and add it manually.
      if (remainingPath) {
        if (entry.modifyErrorField) {
          remainingPath = entry.modifyErrorField(remainingPath);
        }
        if (remainingPath) {
          acc.push({
            field: `${entry.key}${remainingPath}` as FormError['field'],
            message: error.message,
            path: error.field,
          });
          // TODO: remove this when the server returns the correct path
          acc.push({
            field: `${entry.key}.0.${remainingPath}` as FormError['field'],
            message: error.message,
            path: error.field,
          });
        } else {
          // modifyErrorField collapsed the path (e.g. solePropSsn)
          acc.push({
            field: entry.key as FormError['field'],
            message: error.message,
            path: error.field,
          });
        }
      } else {
        acc.push({
          field: entry.key as FormError['field'],
          message: error.message,
          path: error.field,
        });
      }
    }

    // No matches at all — emit as unhandled
    if (
      matchedEntries.length === 0 &&
      !(error.field && error.field in partyFieldMap)
    ) {
      acc.push({
        field: undefined,
        message: error.message,
        path: error.field,
      });
    }

    return acc;
  }, [] as FormError[]);
}

/**
 * Sanitizes verbose server error messages into user-friendly text.
 * Strips technical prefixes like "Field /path/ value must have the expected value."
 * and cleans up bracket notation for readability.
 *
 * This is a stopgap until the backend returns user-friendly messages directly.
 *
 * @example
 * // "Field /individualDetails/addresses[0]/postalCode/ value must have the expected value. The postal code [00000] is invalid for the country [US]."
 * // → "The postal code 00000 is invalid for the country US."
 */
export function sanitizeServerErrorMessage(message: string): string {
  let sanitized = message;

  // Strip "Field /.../ value must have the expected value. " prefix
  sanitized = sanitized.replace(
    /^Field\s+\/[^/]*(?:\/[^/]*)*\/\s+value must have the expected value\.\s*/i,
    ''
  );

  // Strip standalone "Field /.../ " path references anywhere in the message
  sanitized = sanitized.replace(/Field\s+\/[^/]*(?:\/[^/]*)*\/\s*/g, '');

  // Clean up bracket notation: [00000] → 00000, [US] → US
  sanitized = sanitized.replace(/\[([^\]]+)\]/g, '$1');

  // Capitalize first letter if we stripped a prefix
  if (sanitized && sanitized !== message) {
    sanitized = sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
  }

  return sanitized.trim() || message;
}

/**
 * Sets API errors into the form state and handles unhandled errors
 * @param form - React Hook Form instance
 * @param apiFormErrors - Array of form errors from API
 * Shows toast notifications for unhandled errors in development mode
 * Focuses the first field with an error
 */
export function setApiFormErrors(
  form: UseFormReturn<any, any, any>,
  apiFormErrors: FormError[]
) {
  let unhandledErrorString = '';
  let focused = false;
  apiFormErrors.forEach((formError) => {
    if (formError.field === undefined) {
      unhandledErrorString += `\n${formError.path}: ${formError.message}`;
    } else {
      const friendlyMessage = sanitizeServerErrorMessage(formError.message);
      form.setError(formError.field, {
        message: `Server Error: ${friendlyMessage}`,
      });
      if (!focused) {
        form.setFocus(formError.field);
        focused = true;
      }
    }
  });
  if (import.meta.env.DEV && unhandledErrorString !== '') {
    toast.error(`[DEV] Unhandled Server Errors`, {
      description: unhandledErrorString,
      duration: Infinity,
      closeButton: true,
    });
  }
}

/**
 * Sets a value in a nested object using dot notation path
 * @param obj - Target object to set value in
 * @param path - Dot notation path (e.g., 'user.address.street')
 * @param value - Value to set at the specified path
 * Creates nested objects/arrays as needed while traversing
 * Joins arrays if they already exist at the same path
 */
function setValueByPath(obj: any, path: string, value: any) {
  const keys = path.replace(/\[(\w+)\]/g, '.$1').split('.');
  keys.reduce((acc, key, index) => {
    if (index === keys.length - 1) {
      // If the target is an array and the new value is also an array, join them
      if (Array.isArray(acc[key]) && Array.isArray(value)) {
        acc[key] = [...acc[key], ...value];
      } else {
        acc[key] = value;
      }
    } else {
      // Create the path if it doesn't exist
      acc[key] = acc[key] || (keys[index + 1].match(/^\d+$/) ? [] : {});
    }
    return acc[key];
  }, obj);
}

/**
 * Converts form values into an API request body format
 * @param formValues - Form values to convert
 * @param partyIndex - Desired index of the party in the request
 * @param arrayName - Name of the array field ('parties' or 'addParties')
 * @param obj - Target request object to populate
 * @returns Modified request object with mapped form values
 * Applies field transformations using toRequestFn if specified
 */
export function generateClientRequestBody(
  formValues: Partial<OnboardingFormValuesSubmit>,
  partyIndex: number,
  arrayName: 'parties' | 'addParties',
  obj: Partial<CreateClientRequestSmbdo> | Partial<UpdateClientRequestSmbdo>
) {
  objectEntries(formValues).forEach(([key, value]) => {
    const fieldConfig = getPartyFieldConfig(key);
    if (fieldConfig.excludeFromMapping) {
      return;
    }

    const path = `${arrayName}.${partyIndex}.${fieldConfig.path}`;
    if (value !== '' && value !== undefined) {
      const modifiedValue = fieldConfig.toRequestFn
        ? (fieldConfig as { toRequestFn: (val: any) => any }).toRequestFn(value)
        : value;

      setValueByPath(obj, path, modifiedValue);
    }
  });

  return obj;
}

/**
 * Converts form values into a party-specific API request body
 * @param formValues - Form values to convert
 * @param obj - Target party request object to populate
 * @returns Modified party request object with mapped form values
 * Similar to generateRequestBody but specifically for party updates
 */
export function generatePartyRequestBody(
  formValues: Partial<OnboardingFormValuesSubmit>,
  obj: Partial<UpdatePartyRequest>
) {
  objectEntries(formValues).forEach(([key, value]) => {
    const fieldConfig = getPartyFieldConfig(key);
    if (fieldConfig.excludeFromMapping) {
      return;
    }

    const path = `${fieldConfig.path}`;
    if (value !== '' && value !== undefined) {
      const modifiedValue = fieldConfig.toRequestFn
        ? (fieldConfig as { toRequestFn: (val: any) => any }).toRequestFn(value)
        : value;

      setValueByPath(obj, path, modifiedValue);
    }
  });

  return obj;
}

/**
 * Safely retrieves a value from a nested object using dot notation path
 * @param obj - Source object to get value from
 * @param pathTemplate - Dot notation path, supports array indices
 * @returns Value at the specified path or undefined if not found
 */
export function getValueByPath(obj: any, pathTemplate: string): any {
  const keys = pathTemplate.replace(/\[(\w+)\]/g, '.$1').split('.');
  return keys.reduce(
    (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
    obj
  );
}

/**
 * Converts API response data into form values format
 * @param response - Client response from API
 * @param partyId - Optional party ID to filter specific party data
 * @returns Partial form values object with mapped API data
 * Cleans empty organization IDs and applies response transformations
 */
export function convertClientResponseToFormValues(
  response: ClientResponse,
  partyId?: string
): Partial<OnboardingFormValuesInitial> {
  const formValues: Partial<OnboardingFormValuesInitial> = {};
  const partyIndex =
    response.parties?.findIndex((party) => party?.id === partyId) ?? -1;

  objectKeys(partyFieldMap).forEach((fieldName) => {
    const config = getPartyFieldConfig(fieldName);
    if (config.excludeFromMapping && config.path === undefined) {
      return;
    }
    const pathTemplate = `parties.${partyIndex}.${config.path}`;
    const value = getValueByPath(response, pathTemplate);
    if (value !== undefined && (!Array.isArray(value) || value.length > 0)) {
      const modifiedValue = config.fromResponseFn
        ? config.fromResponseFn(value)
        : value;
      if (modifiedValue !== undefined) {
        formValues[fieldName as keyof OnboardingFormValuesSubmit] =
          modifiedValue;
      }
    }
  });

  return formValues;
}

/**
 * Converts API response data into form values format
 * @param response - Party response from API
 * @returns Partial form values object with mapped API data
 * Cleans empty organization IDs and applies response transformations
 */
export function convertPartyResponseToFormValues(
  response: PartyResponse
): Partial<OnboardingFormValuesInitial> {
  const formValues: Partial<OnboardingFormValuesInitial> = {};
  objectKeys(partyFieldMap).forEach((fieldName) => {
    const config = getPartyFieldConfig(fieldName);
    if (config.excludeFromMapping && config.path === undefined) {
      return;
    }
    const pathTemplate = `${config.path}`;
    const value = getValueByPath(response, pathTemplate);
    if (value !== undefined && (!Array.isArray(value) || value.length > 0)) {
      const modifiedValue = config.fromResponseFn
        ? config.fromResponseFn(value)
        : value;
      if (modifiedValue !== undefined) {
        formValues[fieldName as keyof OnboardingFormValuesSubmit] =
          modifiedValue;
      }
    }
  });

  // The issuer on controllerIds must always equal the party's
  // countryOfResidence (SSN/ITIN are always US, but the issuer field
  // itself should still reflect the country so the UI renders correctly).
  // We normalise it here — the single API→form conversion point — so
  // every downstream consumer sees the correct value without extra patches.
  const country = formValues.countryOfResidence as string | undefined;
  if (country) {
    if (formValues.controllerIds?.length) {
      formValues.controllerIds = formValues.controllerIds.map((id) => ({
        ...id,
        issuer: country,
      })) as typeof formValues.controllerIds;
    } else {
      // No identity documents yet — generate a default entry.
      // Non-US residents start with an empty idType so the user must
      // explicitly select from PASSPORT, DRIVERS_LICENSE, or OTHER_GOVERNMENT_ID.
      const isUS = country === 'US';
      formValues.controllerIds = [
        {
          idType: isUS ? 'SSN' : '',
          issuer: country,
          value: '',
        },
      ];
    }
  }

  return formValues;
}

/**
 * Evaluates field configuration rules based on client context
 * @param fieldConfig - Field configuration object
 * @param clientContext - Current client context
 * @returns Field rule determining visibility and validation
 */
function evaluateFieldRules(
  fieldConfig: AnyFieldConfiguration,
  clientContext: ClientContext,
  currentScreenId: ScreenId
):
  | FieldRule
  | ArrayFieldRule
  | OptionalDefaults<FieldRule>
  | OptionalDefaults<ArrayFieldRule> {
  const { baseRule, conditionalRules } = fieldConfig;
  let rule = { ...baseRule };
  conditionalRules?.forEach(({ condition, rule: conditionalRule }) => {
    const isConditionMet =
      (!condition.product ||
        (clientContext.product &&
          condition.product.includes(clientContext.product))) &&
      (!condition.jurisdiction ||
        (clientContext.jurisdiction &&
          condition.jurisdiction.includes(clientContext.jurisdiction))) &&
      (!condition.entityType ||
        (clientContext.entityType &&
          condition.entityType.includes(clientContext.entityType))) &&
      (!condition.screenId || condition.screenId.includes(currentScreenId));

    if (isConditionMet) {
      rule = { ...rule, ...conditionalRule };
    }
  });

  return rule;
}

export function useFormUtils() {
  const { clientData } = useOnboardingContext();
  const { currentScreenId } = useFlowContext();
  return useFormUtilsWithClientContext(clientData, currentScreenId);
}

/**
 * React hook that provides context-aware filtering functions
 * @param clientData - Client response data
 * @returns Object containing filter functions for schemas and values
 * Used to adapt form behavior based on client context
 */
export function useFormUtilsWithClientContext(
  clientData: ClientResponse | undefined,
  currentScreenId: ScreenId
) {
  const organizationParty = clientData?.parties?.find(
    (party) => party?.partyType === 'ORGANIZATION'
  );

  const formContext = useFormContext();

  const clientContext: ClientContext = {
    product: formContext?.getValues('product') ?? clientData?.products?.[0],
    jurisdiction:
      formContext?.getValues('jurisdiction') ??
      organizationParty?.organizationDetails?.jurisdiction,
    entityType:
      formContext?.getValues('organizationType') ??
      organizationParty?.organizationDetails?.organizationType,
  };

  function modifySchema(
    schema: z.ZodObject<Record<string, z.ZodType<any>>>,
    refineFn?: (
      schema: z.ZodObject<Record<string, z.ZodType<any>>>
    ) => z.ZodEffects<z.ZodObject<Record<string, z.ZodType<any>>>>
  ) {
    return modifySchemaByClientContext(
      schema,
      clientContext,
      currentScreenId,
      refineFn
    );
  }

  function modifyDefaultValues(
    defaultValues: Partial<OnboardingFormValuesSubmit>
  ) {
    return modifyDefaultValuesByClientContext(
      defaultValues,
      clientContext,
      currentScreenId
    );
  }

  function getFieldRule(
    fieldName:
      | FieldPath<OnboardingFormValuesSubmit>
      | `${keyof OnboardingFormValuesSubmit}.${string}`
  ) {
    return getFieldRuleByClientContext(
      fieldName,
      clientContext,
      currentScreenId
    );
  }

  return {
    modifySchema,
    modifyDefaultValues,
    getFieldRule,
    clientContext,
  };
}

/**
 * Retrieves field rules for a specific field based on client context
 * @param fieldName - Name of the form field
 * @param clientContext - Current client context
 * @returns Field rule determining field behavior
 */
export function getFieldRuleByClientContext(
  fieldName:
    | FieldPath<OnboardingFormValuesSubmit>
    | `${keyof OnboardingFormValuesSubmit}.${string}`,
  clientContext: ClientContext,
  currentScreenId: ScreenId
):
  | { fieldRule: OptionalDefaults<FieldRule>; ruleType: 'single' }
  | { fieldRule: OptionalDefaults<ArrayFieldRule>; ruleType: 'array' } {
  const fieldNameParts = fieldName.split('.');
  const baseFieldName = fieldNameParts[0] as keyof OnboardingFormValuesSubmit;

  let currentConfig = getPartyFieldConfig(baseFieldName);
  let currentFieldRule = evaluateFieldRules(
    currentConfig,
    clientContext,
    currentScreenId
  );

  // Drill down into subfields for the remaining segments
  for (let i = 1; i < fieldNameParts.length; i += 1) {
    const segment = fieldNameParts[i];

    if (
      isArrayFieldConfiguration(currentConfig) &&
      isArrayFieldRule(currentFieldRule)
    ) {
      // If it's a numeric index (e.g. "0", "1"), skip it
      if (/^\d+$/.test(segment)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      // Otherwise, it's a subfield name
      const subFieldName =
        segment as keyof OnboardingFormValuesSubmit[OnboardingTopLevelArrayFieldNames][number];
      // @ts-ignore -- TS can't infer this properly
      const subFieldConfig = currentConfig.subFields?.[subFieldName];
      if (!subFieldConfig) {
        throw new Error(
          `Subfield "${subFieldName}" is not defined under "${fieldNameParts
            .slice(0, i)
            .join('.')}" in fieldMap.`
        );
      }

      const subFieldRule = evaluateFieldRules(
        subFieldConfig,
        clientContext,
        currentScreenId
      );

      currentConfig = subFieldConfig;
      currentFieldRule = {
        display: currentFieldRule.display,
        interaction: currentFieldRule.interaction,
        defaultValue: currentFieldRule.defaultAppendValue?.[subFieldName],
        ...subFieldRule,
        // Inherit parent's contentTokenOverrideKey when the sub-field
        // doesn't define its own, so owner/soleProp overrides propagate.
        contentTokenOverrideKey:
          subFieldRule.contentTokenOverrideKey ??
          currentFieldRule.contentTokenOverrideKey,
      };
    } else {
      // We don't expect more segments if it's not an array config
      break;
    }
  }

  // Build the defaultAppendValue for the given array field configuration,
  // letting subfields' defaultValue (if defined) override the values in defaultAppendValue
  if (
    isArrayFieldConfiguration(currentConfig) &&
    isArrayFieldRule(currentFieldRule)
  ) {
    let newAppendValue: Record<string, unknown> = {};
    // Start with the array config's own defaultAppendValue as a base object
    if (
      typeof currentFieldRule.defaultAppendValue === 'object' &&
      currentFieldRule.defaultAppendValue !== null
    ) {
      newAppendValue = { ...currentFieldRule.defaultAppendValue };
    }

    // Merge each subfield's default, letting subfields override
    for (const subFieldName of objectKeys(currentConfig.subFields)) {
      const subFieldConfig = currentConfig.subFields[subFieldName];
      const subFieldRule = evaluateFieldRules(
        subFieldConfig,
        clientContext,
        currentScreenId
      );

      // If the subfield has a default, override the parent's property
      if (subFieldRule.defaultValue !== undefined) {
        newAppendValue[subFieldName] = subFieldRule.defaultValue;
      }
    }
    currentFieldRule = {
      ...currentFieldRule,
      defaultAppendValue: newAppendValue,
    };
  }

  if (isArrayFieldRule(currentFieldRule)) {
    return {
      fieldRule: currentFieldRule,
      ruleType: 'array',
    };
  }
  return {
    fieldRule: currentFieldRule,
    ruleType: 'single',
  };
}

/**
 * Filters and modifies a Zod schema based on client context
 * @param schema - Source Zod schema to filter
 * @param clientContext - Current client context
 * @param refineFn - Optional function to apply additional schema refinements
 * @returns Modified Zod schema with context-appropriate validations
 */
export function modifySchemaByClientContext(
  schema: z.ZodObject<Record<string, z.ZodType<any>>>,
  clientContext: ClientContext,
  currentScreenId: ScreenId,
  refineFn?: (
    schema: z.ZodObject<Record<string, z.ZodType<any>>>
  ) => z.ZodEffects<z.ZodObject<Record<string, z.ZodType<any>>>>,
  parentKey: string = '' // used to track full key path
):
  | z.ZodObject<Record<string, z.ZodType<any>>>
  | z.ZodEffects<z.ZodObject<Record<string, z.ZodType<any>>>> {
  const { shape } = schema;

  const filteredSchema: Record<string, z.ZodType<any>> = {};
  objectEntries(shape).forEach(([key, value]) => {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;

    const { fieldRule, ruleType } = getFieldRuleByClientContext(
      fullKey as FieldPath<OnboardingFormValuesSubmit>,
      clientContext,
      currentScreenId
    );

    // Skip hidden fields
    if (fieldRule.display === 'hidden') {
      return;
    }

    // Modify the field schema based on the field rule
    let modifiedSchema = value;

    if (ruleType === 'array') {
      const min = fieldRule.requiredItems ?? fieldRule.minItems ?? 0;
      const max = fieldRule.maxItems ?? Infinity;
      const nameParts = fullKey.split('.');
      const tName = nameParts
        .filter((part) => Number.isNaN(Number(part)))
        .join('.');

      const minMessage = i18n.t(
        [
          `onboarding-overview:fields.${tName}.validation.minItems`,
          'common:validation.minItems',
        ],
        {
          count: min,
        }
      );

      const maxMessage = i18n.t(
        [
          `onboarding-overview:fields.${tName}.validation.maxItems`,
          'common:validation.maxItems',
        ],
        {
          count: max,
        }
      );

      // Handle arrays wrapped in ZodEffects
      if (modifiedSchema instanceof z.ZodEffects) {
        const inner = modifiedSchema._def.schema;
        if (inner instanceof z.ZodArray) {
          const elementSchema = inner._def.type;
          let newElementSchema = elementSchema;
          // If the element is an object, recursively modify it.
          if (elementSchema instanceof z.ZodObject) {
            // For array elements, we add a placeholder index (0) to the key
            newElementSchema = modifySchemaByClientContext(
              elementSchema,
              clientContext,
              currentScreenId,
              undefined,
              `${fullKey}.0`
            );
          }
          // Apply min and max to the underlying array
          const modifiedInner: z.ZodType<any> = z
            .array(newElementSchema)
            .min(min, minMessage)
            .max(max, maxMessage);

          // Rebuild the ZodEffects with the modified inner schema
          modifiedSchema = new z.ZodEffects({
            schema: modifiedInner,
            effect: modifiedSchema._def.effect,
            typeName: modifiedSchema._def.typeName,
          });
        }
      }
      // Handle direct ZodArray
      else if (modifiedSchema instanceof z.ZodArray) {
        const elementSchema = modifiedSchema._def.type;
        let newElementSchema = elementSchema;
        // If the element is an object, recursively modify it.
        if (elementSchema instanceof z.ZodObject) {
          // For array elements, we add a placeholder index (0) to the key
          newElementSchema = modifySchemaByClientContext(
            elementSchema,
            clientContext,
            currentScreenId,
            undefined,
            `${fullKey}.0`
          );
        }
        modifiedSchema = z
          .array(newElementSchema)
          .min(min, minMessage)
          .max(max, maxMessage);
      } else {
        // Unexpected schema type
        throw new Error(
          `Unexpected schema type for array field "${key}": ${modifiedSchema}`
        );
      }
    } else if (ruleType === 'single') {
      if (!fieldRule.required) {
        modifiedSchema = value.or(z.literal('')).or(z.undefined());
      }
    }
    filteredSchema[key] = modifiedSchema;
  });

  if (refineFn) {
    return refineFn(z.object(filteredSchema));
  }
  return z.object(filteredSchema);
}

/**
 * Filters form default values based on client context
 * @param defaultValues - Source default values object
 * @param clientContext - Current client context
 * @returns Modified default values appropriate for the context
 */
export function modifyDefaultValuesByClientContext(
  defaultValues: Partial<OnboardingFormValuesSubmit>,
  clientContext: ClientContext,
  currentScreenId: ScreenId
): Partial<OnboardingFormValuesSubmit> {
  const filteredDefaultValues: Partial<OnboardingFormValuesSubmit> = {};

  objectEntries(defaultValues).forEach(([key, value]) => {
    const { fieldRule } = getFieldRuleByClientContext(
      key,
      clientContext,
      currentScreenId
    );
    if (fieldRule.display !== 'hidden') {
      filteredDefaultValues[key] = value ?? fieldRule.defaultValue ?? '';
    }
  });
  return filteredDefaultValues;
}

export function useFormWithFilters<
  TSchema extends z.ZodObject<Record<string, z.ZodType<any>>>,
>(
  props: Omit<UseFormProps<z.input<TSchema>>, 'resolver'> & {
    clientData: ClientResponse | undefined;
    screenId: ScreenId;
    schema: TSchema;
    refineSchemaFn?: (
      schema: z.ZodObject<Record<string, z.ZodType<any>>>
    ) => z.ZodEffects<z.ZodObject<Record<string, z.ZodType<any>>>>;
    overrideDefaultValues?: Partial<OnboardingFormValuesInitial>;
    /**
     * When true, runs form.trigger() on mount to surface validation
     * errors from pre-populated API data (e.g. invalid EIN format).
     * Defaults to true when overrideDefaultValues is provided.
     */
    validateOnMount?: boolean;
  }
): UseFormReturn<z.input<TSchema>, any, z.output<TSchema>> {
  const { modifyDefaultValues, modifySchema } = useFormUtilsWithClientContext(
    props.clientData,
    props.screenId
  );
  const defaultValues = modifyDefaultValues(
    shapeFormValuesBySchema(
      (props.defaultValues ?? {}) as Partial<OnboardingFormValuesSubmit>,
      props.schema
    )
  ) as DefaultValues<z.input<TSchema>>;

  // When the API provides countryOfResidence but no address data,
  // update the fieldMap's address default so the country field
  // reflects countryOfResidence instead of the static 'US' fallback.
  const overrides = props.overrideDefaultValues ?? {};
  const countryOfResidence = (overrides as Record<string, unknown>)
    .countryOfResidence as string | undefined;
  const mergedDefaults: DefaultValues<z.input<TSchema>> = {
    ...defaultValues,
    ...overrides,
  };
  if (
    countryOfResidence &&
    !('individualAddress' in overrides) &&
    mergedDefaults.individualAddress
  ) {
    mergedDefaults.individualAddress = {
      ...mergedDefaults.individualAddress,
      country: countryOfResidence,
    };
  }

  const form = useForm<z.input<TSchema>, any, z.output<TSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    ...props,
    resolver: zodResolver(modifySchema(props.schema, props.refineSchemaFn)),
    defaultValues: mergedDefaults,
  });

  // Validate pre-populated fields on mount to surface errors from API data
  // (e.g. invalid EIN format, mismatched address country). Only validates
  // fields that already have a non-empty value — empty required fields are
  // left alone until the user interacts with them.
  const shouldValidateOnMount =
    props.validateOnMount ??
    Object.keys(props.overrideDefaultValues ?? {}).length > 0;

  const hasValidatedOnMount = useRef(false);
  useEffect(() => {
    if (shouldValidateOnMount && !hasValidatedOnMount.current) {
      hasValidatedOnMount.current = true;

      // Collect field paths that have non-empty values.
      // For object-typed fields (e.g. phone: {phoneType, phoneNumber}),
      // only include the object if ALL its leaf values are populated.
      // This avoids false validation on objects with auto-set defaults
      // (e.g. phoneType is always set, but phoneNumber may be empty).
      const values = form.getValues();
      const populatedFields: string[] = [];

      const isEffectivelyEmpty = (val: unknown): boolean =>
        val === '' ||
        val == null ||
        // Phone fields with only a country code (e.g. "+1") are empty
        (typeof val === 'string' && /^\+\d{1,3}$/.test(val.trim()));

      const isFullyPopulated = (obj: Record<string, any>): boolean =>
        Object.values(obj).every((val) => {
          if (val != null && typeof val === 'object' && !Array.isArray(val)) {
            return isFullyPopulated(val);
          }
          return !isEffectivelyEmpty(val);
        });

      const collectPopulated = (obj: Record<string, any>, prefix = '') => {
        for (const [key, val] of Object.entries(obj)) {
          const path = prefix ? `${prefix}.${key}` : key;
          if (Array.isArray(val)) {
            val.forEach((item, idx) => {
              if (item != null && typeof item === 'object') {
                // For array items that are objects, only include if fully populated
                if (isFullyPopulated(item)) {
                  collectPopulated(item, `${path}.${idx}`);
                }
              } else if (!isEffectivelyEmpty(item)) {
                populatedFields.push(`${path}.${idx}`);
              }
            });
          } else if (
            val != null &&
            typeof val === 'object' &&
            !Array.isArray(val)
          ) {
            // Only recurse into objects where all leaves are populated
            if (isFullyPopulated(val)) {
              collectPopulated(val, path);
            }
          } else if (!isEffectivelyEmpty(val)) {
            populatedFields.push(path);
          }
        }
      };
      collectPopulated(values);

      if (populatedFields.length > 0) {
        form.trigger(populatedFields as any);
      }
    }
  }, [shouldValidateOnMount, form]);

  return form;
}

// Modifies the form values to match the schema shape
export function shapeFormValuesBySchema<T extends z.ZodRawShape>(
  formValues: Partial<OnboardingFormValuesInitial>,
  schema: z.ZodObject<T>
): Partial<OnboardingFormValuesSubmit> {
  const schemaShape = schema.shape;
  const schemaKeys = Object.keys(schemaShape) as Array<
    keyof OnboardingFormValuesSubmit
  >;

  return schemaKeys.reduce(
    (acc, key) => {
      // If the key exists in formValues, use its value
      if (key in formValues) {
        acc[key] = formValues[key];
      } else {
        acc[key] = undefined;
      }
      return acc;
    },
    {} as Record<string, any>
  );
}

/**
 * Helper type to extract validation message keys for a specific field
 * Uses conditional types to handle fields that might not have a validation key
 */
export type ValidationMessageKeysFor<
  Field extends
    keyof (typeof defaultResources)['enUS']['onboarding-overview']['fields'],
> =
  (typeof defaultResources)['enUS']['onboarding-overview']['fields'][Field] extends {
    validation: infer V;
  }
    ? keyof V
    : string;

/**
 * React hook that provides a function to retrieve localized field content tokens
 * @returns Function to get content tokens for form fields (placeholder, tooltip, label, description)
 * Uses useTranslation internally for internationalization support
 */
export const useGetFieldContentToken = (
  fieldName: FieldPath<OnboardingFormValuesSubmit>
) => {
  const { tString } = useTranslationWithTokens([
    'onboarding-old',
    'onboarding-overview',
    'common',
  ]);

  const { getFieldRule } = useFormUtils();
  const { fieldRule } = getFieldRule(fieldName);

  /**
   * Retrieves a localized content token for a specific field
   * @param fieldRule - Field rule configuration containing content token overrides
   * @param key - Key for the desired content (e.g., 'placeholder', 'tooltip', 'label', 'description')
   * @returns The localized content token string
   */
  const getFieldContentToken = (key: FieldContentTokenKey): string => {
    const oldContentTokenKey = `onboarding-old:${key}`;
    const contentTokenOverride = fieldRule.contentTokenOverrides?.[key];
    if (typeof contentTokenOverride === 'string') {
      return contentTokenOverride;
    }
    return tString(
      [
        `onboarding-overview:fields.${fieldName}.${key}.${fieldRule.contentTokenOverrideKey}`,
        `onboarding-overview:fields.${fieldName}.${key}.default`,
        `onboarding-overview:fields.${fieldName}.${key}`,
        oldContentTokenKey, // TO REMOVE
        'common:noTokenFallback',
      ] as unknown as TemplateStringsArray,
      {
        key,
      }
    );
  };

  return getFieldContentToken;
};

/**
 * Retrieves a localized validation message for a specific field and message key
 * @param field - Field name from the onboarding-overview resources
 * @param messageKey - Specific validation message key for the selected field
 * @param count - Optional count parameter for pluralized messages
 * @returns The localized validation message string
 */
export const useGetValidationMessage = <
  Field extends
    keyof (typeof defaultResources)['enUS']['onboarding-overview']['fields'],
>(): ((
  field: Field,
  messageKey: ValidationMessageKeysFor<Field>,
  countOrParams?: number | Record<string, string>
) => string) => {
  const { clientData } = useOnboardingContext();
  const { currentScreenId } = useFlowContext();
  const { getFieldRule } = useFormUtilsWithClientContext(
    clientData,
    currentScreenId
  );

  const getValidationMessage = (
    field: Field,
    messageKey: ValidationMessageKeysFor<Field>,
    countOrParams?: number | Record<string, string>
  ): string => {
    const { fieldRule } = getFieldRule(field);

    const count = typeof countOrParams === 'number' ? countOrParams : undefined;
    const extraParams = typeof countOrParams === 'object' ? countOrParams : {};

    // Build translation key path with validation prefix
    const translationKey = [
      `onboarding-overview:fields.${field}.validation.${messageKey}.${fieldRule.contentTokenOverrideKey}`,
      `onboarding-overview:fields.${field}.validation.${messageKey}.default`,
      `onboarding-overview:fields.${field}.validation.${messageKey}`,
    ];

    const label =
      fieldRule.contentTokenOverrides?.label ??
      i18n.t([
        `onboarding-overview:fields.${field}.label.${fieldRule.contentTokenOverrideKey}`,
        `onboarding-overview:fields.${field}.label.default`,
        `onboarding-overview:fields.${field}.label`,
      ] as unknown as TemplateStringsArray);

    const fieldName =
      fieldRule.contentTokenOverrides?.fieldName ??
      i18n.t(
        [
          `onboarding-overview:fields.${field}.fieldName.${fieldRule.contentTokenOverrideKey}`,
          `onboarding-overview:fields.${field}.fieldName.default`,
          `onboarding-overview:fields.${field}.fieldName`,
        ],
        {
          defaultValue: label,
        }
      );

    // Return translation with optional count and extra interpolation params
    return i18n.t(translationKey, { fieldName, count, ...extraParams });
  };
  return getValidationMessage;
};

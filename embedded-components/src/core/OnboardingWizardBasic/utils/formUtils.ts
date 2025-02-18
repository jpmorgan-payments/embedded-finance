import { useEffect, useMemo } from 'react';
import { i18n } from '@/i18n/config';
import { objectEntries, objectKeys } from '@/utils/objectEntries';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  DefaultValues,
  FieldErrors,
  FieldPath,
  FieldValues,
  useForm,
  UseFormProps,
  UseFormReturn,
} from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  ApiErrorReasonV2,
  ClientResponse,
  CreateClientRequestSmbdo,
  UpdateClientRequestSmbdo,
  UpdatePartyRequest,
} from '@/api/generated/smbdo.schemas';
import { useStepper } from '@/components/ui/stepper';

import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { partyFieldMap } from './fieldMap';
import {
  AnyFieldConfiguration,
  ArrayFieldRule,
  ClientContext,
  CombinedFieldConfiguration,
  FieldRule,
  isArrayFieldConfiguration,
  isArrayFieldRule,
  OnboardingFormValuesInitial,
  OnboardingFormValuesSubmit,
  OnboardingTopLevelArrayFieldNames,
  OptionalDefaults,
} from './types';

type FormError = {
  field?:
    | keyof OnboardingFormValuesSubmit
    | `${keyof OnboardingFormValuesSubmit}${string}`;
  message: string;
  path?: string;
};

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
    let remainingPath = '';
    let modifyErrorField: AnyFieldConfiguration['modifyErrorField'];

    const matchedKey = fieldMapKeys.find((key) => {
      const path = partyFieldMap[key]?.path;
      if (path && error.field && error.field.startsWith(`$.${path}`)) {
        remainingPath = error.field.substring(`$.${path}`.length);
        modifyErrorField = partyFieldMap[key]?.modifyErrorField;
        return true;
      }
      if (path && error.field && error.field.startsWith(`$.party.${path}`)) {
        remainingPath = error.field.substring(`$.party.${path}`.length);
        modifyErrorField = partyFieldMap[key]?.modifyErrorField;
        return true;
      }
      return false;
    });

    // Handle edge case where the error field is in the field map but not matched
    if (!matchedKey && error.field && error.field in partyFieldMap) {
      acc.push({
        field: error.field as keyof typeof partyFieldMap,
        message: error.message,
        path: error.field,
      });
    }

    // Server error path sometimes does not include the index for array fields,
    // so we assume it's the first index (0) and add it manually.
    if (matchedKey && remainingPath) {
      // Convert remainingPath to dot notation
      remainingPath = remainingPath.replace(/\[(\w+)\]/g, '.$1');
      if (modifyErrorField) {
        remainingPath = modifyErrorField(remainingPath);
      }
      acc.push({
        field: `${matchedKey}${remainingPath}`,
        message: error.message,
        path: error.field,
      });
      // TODO: remove this when the server returns the correct path
      acc.push({
        field: `${matchedKey}.0.${remainingPath}`,
        message: error.message,
        path: error.field,
      });
    } else {
      acc.push({
        field: matchedKey ?? undefined,
        message: error.message,
        path: error.field,
      });
    }
    return acc;
  }, [] as FormError[]);
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
      form.setError(formError.field, {
        message: `Server Error: ${formError.message}`,
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
 */
function setValueByPath(obj: any, path: string, value: any) {
  const keys = path.split('.');
  keys.reduce((acc, key, index) => {
    if (index === keys.length - 1) {
      acc[key] = value;
    } else {
      acc[key] = acc[key] || (key.match(/^\d+$/) ? [] : {});
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
): Partial<OnboardingFormValuesSubmit> {
  const formValues: Partial<OnboardingFormValuesSubmit> = {};
  const partyIndex =
    response.parties?.findIndex((party) => party?.id === partyId) ?? -1;

  objectKeys(partyFieldMap).forEach((fieldName) => {
    const config = getPartyFieldConfig(fieldName);
    if (config.excludeFromMapping) {
      return;
    }
    const pathTemplate = `parties.${partyIndex}.${config.path}`;
    const value = getValueByPath(response, pathTemplate);
    if (value !== undefined && (!Array.isArray(value) || value.length > 0)) {
      const modifiedValue = config.fromResponseFn
        ? config.fromResponseFn(value)
        : value;
      formValues[fieldName as keyof OnboardingFormValuesSubmit] = modifiedValue;
    }
  });

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
  clientContext: ClientContext
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
          condition.entityType.includes(clientContext.entityType)));

    if (isConditionMet) {
      rule = { ...rule, ...conditionalRule };
    }
  });

  return rule;
}

/**
 * React hook that provides context-aware filtering functions
 * @param clientData - Client response data
 * @returns Object containing filter functions for schemas and values
 * Used to adapt form behavior based on client context
 */
export function useFormUtilsWithClientContext(
  clientData: ClientResponse | undefined
) {
  const organizationParty = clientData?.parties?.find(
    (party) => party?.partyType === 'ORGANIZATION'
  );
  const clientContext: ClientContext = {
    product: clientData?.products?.[0],
    jurisdiction: organizationParty?.organizationDetails?.jurisdiction,
    entityType: organizationParty?.organizationDetails?.organizationType,
  };

  function modifySchema(
    schema: z.ZodObject<Record<string, z.ZodType<any>>>,
    refineFn?: (
      schema: z.ZodObject<Record<string, z.ZodType<any>>>
    ) => z.ZodEffects<z.ZodObject<Record<string, z.ZodType<any>>>>
  ) {
    return modifySchemaByClientContext(schema, clientContext, refineFn);
  }

  function modifyDefaultValues(
    defaultValues: Partial<OnboardingFormValuesSubmit>
  ) {
    return modifyDefaultValuesByClientContext(defaultValues, clientContext);
  }

  function getFieldRule(fieldName: FieldPath<OnboardingFormValuesSubmit>) {
    return getFieldRuleByClientContext(fieldName, clientContext);
  }

  // TODO: remove these functions when all fields are using OnboardingFormField
  // Use for fields that don't use OnboardingFormField
  function isFieldVisible(fieldName: keyof OnboardingFormValuesSubmit) {
    const { fieldRule } = getFieldRule(fieldName);
    return fieldRule.display !== 'hidden';
  }
  function isFieldDisabled(fieldName: keyof OnboardingFormValuesSubmit) {
    const { fieldRule } = getFieldRule(fieldName);
    return (
      fieldRule.interaction === 'disabled' ||
      fieldRule.interaction === 'readonly'
    );
  }
  function isFieldRequired(fieldName: keyof OnboardingFormValuesSubmit) {
    const { fieldRule, ruleType } = getFieldRule(fieldName);
    return ruleType === 'single' && fieldRule.required;
  }
  function getArrayFieldRule(fieldName: keyof OnboardingFormValuesSubmit) {
    const { fieldRule, ruleType } = getFieldRule(fieldName);
    return ruleType === 'array' ? fieldRule : undefined;
  }

  return {
    modifySchema,
    modifyDefaultValues,
    getFieldRule,
    isFieldVisible,
    isFieldDisabled,
    isFieldRequired,
    getArrayFieldRule,
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
  fieldName: FieldPath<OnboardingFormValuesSubmit>,
  clientContext: ClientContext
):
  | { fieldRule: OptionalDefaults<FieldRule>; ruleType: 'single' }
  | { fieldRule: OptionalDefaults<ArrayFieldRule>; ruleType: 'array' } {
  const fieldNameParts = fieldName.split('.');
  const baseFieldName = fieldNameParts[0] as keyof OnboardingFormValuesSubmit;

  let currentConfig = getPartyFieldConfig(baseFieldName);
  let currentFieldRule = evaluateFieldRules(currentConfig, clientContext);

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
      const subFieldConfig = currentConfig.subFields[subFieldName];
      if (!subFieldConfig) {
        throw new Error(
          `Subfield "${subFieldName}" is not defined under "${fieldNameParts
            .slice(0, i)
            .join('.')}" in fieldMap.`
        );
      }

      const subFieldRule = evaluateFieldRules(subFieldConfig, clientContext);

      currentConfig = subFieldConfig;
      currentFieldRule = {
        display: currentFieldRule.display,
        interaction: currentFieldRule.interaction,
        defaultValue: currentFieldRule.defaultAppendValue?.[subFieldName],
        ...subFieldRule,
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
      const subFieldRule = evaluateFieldRules(subFieldConfig, clientContext);

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
      clientContext
    );

    getFieldRuleByClientContext('addresses.0', clientContext);

    // Skip hidden fields
    if (fieldRule.display === 'hidden') {
      return;
    }

    // Modify the field schema based on the field rule
    let modifiedSchema = value;

    if (ruleType === 'array') {
      const min = fieldRule.minItems ?? 0;
      const max = fieldRule.maxItems ?? Infinity;
      const nameParts = fullKey.split('.');
      const tName = nameParts
        .filter((part) => Number.isNaN(Number(part)))
        .join('.');

      const minMessage = i18n.t(
        [
          `onboarding:fields.${tName}.validation.minItems`,
          'common:validation.minItems',
        ],
        {
          count: min,
        }
      );

      const maxMessage = i18n.t(
        [
          `onboarding:fields.${tName}.validation.maxItems`,
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
              undefined,
              `${fullKey}.0`
            );
          }
          // Apply min and max to the underlying array
          const modifiedInner = z
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
            undefined,
            `${fullKey}.0`
          );
        }
        // TODO: add validation messages
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
  clientContext: ClientContext
): Partial<OnboardingFormValuesSubmit> {
  const filteredDefaultValues: Partial<OnboardingFormValuesSubmit> = {};

  objectEntries(defaultValues).forEach(([key, value]) => {
    const { fieldRule } = getFieldRuleByClientContext(key, clientContext);
    if (fieldRule.display !== 'hidden') {
      filteredDefaultValues[key] = value ?? fieldRule.defaultValue ?? '';
    }
  });
  return filteredDefaultValues;
}

export function useStepForm<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
  TTransformedValues extends FieldValues | undefined = undefined,
>(
  props: UseFormProps<TFieldValues>
): UseFormReturn<TFieldValues, TContext, TTransformedValues> {
  const { activeStep } = useStepper();
  const { currentForm, setCurrentForm, currentStepIndex, setCurrentStepIndex } =
    useOnboardingContext();

  // Check if the step has changed
  const isNewStep = useMemo(() => {
    return currentStepIndex === undefined || currentStepIndex !== activeStep;
  }, [currentStepIndex, activeStep]);

  // Update currentStepIndex when the step changes
  useEffect(() => {
    if (isNewStep) {
      setCurrentStepIndex(activeStep);
    }
  }, [isNewStep, setCurrentStepIndex, activeStep]);

  // Initialize the form with the cached form if the step has not changed
  const defaultValues = useMemo(() => {
    return {
      ...props.defaultValues,
      ...(!isNewStep ? (currentForm?.getValues() ?? {}) : {}),
    };
  }, [props.defaultValues, isNewStep, currentForm]);

  const errors = useMemo(() => {
    return !isNewStep
      ? ({
          ...props.errors,
          ...currentForm?.formState.errors,
        } as FieldErrors<TFieldValues>)
      : props.errors;
  }, [props.errors, isNewStep, currentForm]);

  const form = useForm<TFieldValues, TContext, TTransformedValues>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    ...props,
    defaultValues,
    errors,
  });

  // Cache the current form so it can be reused in the next render
  useEffect(() => {
    if (form !== currentForm) {
      setCurrentForm(form);
    }
  }, [form, setCurrentForm]);

  return form;
}

export function useStepFormWithFilters<
  TSchema extends z.ZodObject<Record<string, z.ZodType<any>>>,
>(
  props: Omit<UseFormProps<z.input<TSchema>>, 'resolver'> & {
    clientData: ClientResponse | undefined;
    schema: TSchema;
    refineSchemaFn?: (
      schema: z.ZodObject<Record<string, z.ZodType<any>>>
    ) => z.ZodEffects<z.ZodObject<Record<string, z.ZodType<any>>>>;
  }
): UseFormReturn<z.input<TSchema>, any, z.output<TSchema>> {
  const { modifyDefaultValues, modifySchema } = useFormUtilsWithClientContext(
    props.clientData
  );

  const defaultValues = modifyDefaultValues(
    shapeFormValuesBySchema(
      props.defaultValues as Partial<OnboardingFormValuesSubmit>,
      props.schema
    )
  ) as DefaultValues<z.input<TSchema>>;

  const form = useStepForm<z.input<TSchema>, any, z.output<TSchema>>({
    ...props,
    resolver: zodResolver(modifySchema(props.schema, props.refineSchemaFn)),
    defaultValues,
  });

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

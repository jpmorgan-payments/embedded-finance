import { useEffect, useMemo } from 'react';
import { objectEntries, objectKeys } from '@/utils/objectEntries';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  DefaultValues,
  FieldErrors,
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
  ArrayFieldRule,
  ClientContext,
  CombinedFieldConfiguration,
  FieldConfiguration,
  FieldRule,
  isArrayFieldRule,
  OnboardingWizardFormValues,
} from './types';

type FormError = {
  field?:
    | keyof OnboardingWizardFormValues
    | `${keyof OnboardingWizardFormValues}${string}`;
  message: string;
  path?: string;
};

export function getPartyFieldConfig<K extends keyof OnboardingWizardFormValues>(
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
export function translateClientApiErrorsToFormErrors(
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
export function translatePartyApiErrorsToFormErrors(
  errors: ApiErrorReasonV2[]
): FormError[] {
  const fieldMapKeys = objectKeys(partyFieldMap);
  return errors.reduce((acc, error) => {
    let remainingPath = '';
    const matchedKey = fieldMapKeys.find((key) => {
      const path = partyFieldMap[key]?.path;
      if (path && error.field && error.field.startsWith(`$.${path}`)) {
        remainingPath = error.field.substring(`$.${path}`.length);
        return true;
      }
      if (path && error.field && error.field.startsWith(`$.party.${path}`)) {
        remainingPath = error.field.substring(`$.party.${path}`.length);
        return true;
      }
      return false;
    });
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
      acc.push({
        field: `${matchedKey}${remainingPath}`,
        message: error.message,
        path: error.field,
      });
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
  form: UseFormReturn<any>,
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
 * @param partyIndex - Index of the party in the form array
 * @param arrayName - Name of the array field ('parties' or 'addParties')
 * @param obj - Target request object to populate
 * @returns Modified request object with mapped form values
 * Applies field transformations using toRequestFn if specified
 */
export function generateRequestBody(
  formValues: Partial<OnboardingWizardFormValues>,
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
  formValues: Partial<OnboardingWizardFormValues>,
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
): Partial<OnboardingWizardFormValues> {
  const formValues: Partial<OnboardingWizardFormValues> = {};
  const partyIndex =
    response.parties?.findIndex((party) => party?.id === partyId) ?? -1;

  objectKeys(partyFieldMap).forEach((fieldName) => {
    const config = getPartyFieldConfig(fieldName);
    if (config.excludeFromMapping) {
      return;
    }
    const pathTemplate = `parties.${partyIndex}.${config.path}`;
    const value = getValueByPath(response, pathTemplate);
    if (value !== undefined) {
      const modifiedValue = config.fromResponseFn
        ? config.fromResponseFn(value)
        : value;
      formValues[fieldName as keyof OnboardingWizardFormValues] = modifiedValue;
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
  fieldConfig: Pick<FieldConfiguration<any>, 'baseRule' | 'conditionalRules'>,
  clientContext: ClientContext
): FieldRule | ArrayFieldRule {
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
 * @param clientData - Optional client response data
 * @returns Object containing filter functions for schemas and values
 * Used to adapt form behavior based on client context
 */
export function useFilterFunctionsByClientContext(
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

  function filterSchema(
    schema: z.ZodObject<Record<string, z.ZodType<any>>>,
    refineFn?: (
      schema: z.ZodObject<Record<string, z.ZodType<any>>>
    ) => z.ZodEffects<z.ZodObject<Record<string, z.ZodType<any>>>>
  ) {
    return filterSchemaByClientContext(schema, clientContext, refineFn);
  }

  function filterDefaultValues(
    defaultValues: Partial<OnboardingWizardFormValues>
  ) {
    return filterDefaultValuesByClientContext(defaultValues, clientContext);
  }

  function getFieldRule(
    fieldName:
      | keyof OnboardingWizardFormValues
      | `${keyof OnboardingWizardFormValues}.${string}`
  ) {
    return getFieldRuleByClientContext(fieldName, clientContext);
  }

  // TODO: remove these functions when all fields are using OnboardingFormField
  // Use for fields that don't use OnboardingFormField
  function isFieldVisible(fieldName: keyof OnboardingWizardFormValues) {
    const { fieldRule } = getFieldRule(fieldName);
    return fieldRule.visibility !== 'hidden';
  }
  function isFieldDisabled(fieldName: keyof OnboardingWizardFormValues) {
    const { fieldRule } = getFieldRule(fieldName);
    return (
      fieldRule.visibility === 'disabled' || fieldRule.visibility === 'readonly'
    );
  }
  function isFieldRequired(fieldName: keyof OnboardingWizardFormValues) {
    const { fieldRule, ruleType } = getFieldRule(fieldName);
    return ruleType === 'single' && fieldRule.required;
  }
  function getArrayFieldRule(fieldName: keyof OnboardingWizardFormValues) {
    const { fieldRule, ruleType } = getFieldRule(fieldName);
    return ruleType === 'array' ? fieldRule : undefined;
  }

  return {
    filterSchema,
    filterDefaultValues,
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
  fieldName:
    | keyof OnboardingWizardFormValues
    | `${keyof OnboardingWizardFormValues}.${string}`,
  clientContext: ClientContext
):
  | { fieldRule: FieldRule; ruleType: 'single' }
  | { fieldRule: ArrayFieldRule; ruleType: 'array' } {
  const fieldNameParts = fieldName.split('.');
  const baseFieldName = fieldNameParts[0] as keyof OnboardingWizardFormValues;
  const baseFieldConfig = getPartyFieldConfig(baseFieldName);

  const baseFieldRule = evaluateFieldRules(baseFieldConfig, clientContext);

  let fieldRule = baseFieldRule;
  // If the fieldName is a subfield (e.g., "fieldName[0].subFieldName")
  if (
    'subFields' in baseFieldConfig &&
    baseFieldConfig.subFields &&
    fieldNameParts.length > 1 &&
    !Number.isNaN(Number(fieldNameParts[1])) &&
    fieldNameParts[2] !== undefined
  ) {
    const subFieldName = fieldNameParts[2];
    const subFieldConfig = baseFieldConfig.subFields[subFieldName];

    // If the subfield is not mapped, return parent rule
    if (!subFieldConfig) {
      fieldRule = {
        visibility: baseFieldRule.visibility,
      };
    }
    const subFieldRule = evaluateFieldRules(subFieldConfig, clientContext);
    fieldRule = {
      visibility: baseFieldRule.visibility,
      ...subFieldRule,
    };
  }

  return {
    fieldRule,
    ruleType: isArrayFieldRule(baseFieldRule) ? 'array' : 'single',
  };
}

/**
 * Filters and modifies a Zod schema based on client context
 * @param schema - Source Zod schema to filter
 * @param clientContext - Current client context
 * @param refineFn - Optional function to apply additional schema refinements
 * @returns Modified Zod schema with context-appropriate validations
 */
export function filterSchemaByClientContext(
  schema: z.ZodObject<Record<string, z.ZodType<any>>>,
  clientContext: ClientContext,
  refineFn?: (
    schema: z.ZodObject<Record<string, z.ZodType<any>>>
  ) => z.ZodEffects<z.ZodObject<Record<string, z.ZodType<any>>>>
):
  | z.ZodObject<Record<string, z.ZodType<any>>>
  | z.ZodEffects<z.ZodObject<Record<string, z.ZodType<any>>>> {
  const { shape } = schema;

  const filteredSchema: Record<string, z.ZodType<any>> = {};
  objectEntries(shape).forEach(([key, value]) => {
    const { fieldRule, ruleType } = getFieldRuleByClientContext(
      key as keyof OnboardingWizardFormValues,
      clientContext
    );

    // Modify the field schema based on the field rule
    let fieldSchema = value;
    if (fieldRule.visibility !== 'hidden') {
      return;
    }
    if (ruleType === 'array') {
      if (!(value instanceof z.ZodArray)) {
        throw new Error('Expected ZodArray for array field');
      }
      // TODO: add validation messages
      if (fieldRule.minItems) {
        fieldSchema = z.array(value.element).min(fieldRule.minItems);
      }
      if (fieldRule.maxItems) {
        fieldSchema = z.array(value.element).max(fieldRule.maxItems);
      }
      // TODO: do something with requiredItems
    } else if (ruleType === 'single') {
      fieldSchema = value.or(z.literal('')).or(z.undefined());
    }
    filteredSchema[key] = fieldSchema;
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
export function filterDefaultValuesByClientContext(
  defaultValues: Partial<OnboardingWizardFormValues>,
  clientContext: ClientContext
): Partial<OnboardingWizardFormValues> {
  const filteredDefaultValues: Partial<OnboardingWizardFormValues> = {};

  objectEntries(defaultValues).forEach(([key, value]) => {
    const fieldConfig = getPartyFieldConfig(key);
    // TODO: should potentially be using getFieldRule instead of fieldConfig
    const fieldRule = evaluateFieldRules(fieldConfig, clientContext);
    if (fieldRule.visibility !== 'hidden') {
      filteredDefaultValues[key] = value as any;
    }
  });
  return filteredDefaultValues;
}

export function useStepForm<T extends FieldValues>(
  props: UseFormProps<T>
): UseFormReturn<T> {
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
        } as FieldErrors<T>)
      : props.errors;
  }, [props.errors, isNewStep, currentForm]);

  const form = useForm<T>({
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

export function useStepFormWithFilters<T extends FieldValues>(
  props: Omit<UseFormProps<T>, 'resolver'> & {
    clientData: ClientResponse | undefined;
    schema: z.ZodObject<Record<string, z.ZodType<any>>>;
    refineSchemaFn?: (
      schema: z.ZodObject<Record<string, z.ZodType<any>>>
    ) => z.ZodEffects<z.ZodObject<Record<string, z.ZodType<any>>>>;
  }
): UseFormReturn<T> {
  const { filterDefaultValues, filterSchema } =
    useFilterFunctionsByClientContext(props.clientData);

  const form = useStepForm<T>({
    ...props,
    resolver: zodResolver(filterSchema(props.schema, props.refineSchemaFn)),
    defaultValues: filterDefaultValues(
      shapeFormValuesBySchema(
        props.defaultValues as Partial<OnboardingWizardFormValues>,
        props.schema
      )
    ) as DefaultValues<T>,
  });

  return form;
}

export function shapeFormValuesBySchema<T extends z.ZodRawShape>(
  formValues: Partial<OnboardingWizardFormValues>,
  schema: z.ZodObject<T>
): Partial<OnboardingWizardFormValues> {
  const schemaShape = schema.shape;
  const schemaKeys = Object.keys(schemaShape) as Array<
    keyof OnboardingWizardFormValues
  >;

  return schemaKeys.reduce(
    (acc, key) => {
      // If the key exists in formValues, use its value
      if (key in formValues) {
        acc[key] = formValues[key];
      }
      // Otherwise set empty string, or empty array
      else if (schemaShape[key] instanceof z.ZodArray) {
        acc[key] = [];
      } else {
        acc[key] = '';
      }
      return acc;
    },
    {} as Record<string, any>
  );
}

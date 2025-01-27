import { useEffect, useMemo } from 'react';
import {
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
  ClientContext,
  FieldConfiguration,
  FieldRule,
  OnboardingWizardFormValues,
} from './types';

type FormError = {
  field?: keyof typeof partyFieldMap;
  message: string;
  path?: string;
};

/**
 * Converts API validation errors into form-friendly error objects
 * @param errors - Array of API error reasons
 * @param partyIndex - Index of the party in the form array
 * @param arrayName - Name of the array field ('parties' or 'addParties')
 * @returns Array of FormError objects with mapped field names and messages
 */
export function translateApiErrorsToFormErrors(
  errors: ApiErrorReasonV2[],
  partyIndex: number,
  arrayName: 'parties' | 'addParties'
): FormError[] {
  const fieldMapKeys = Object.keys(partyFieldMap) as Array<
    keyof typeof partyFieldMap
  >;
  return errors.map((error) => {
    const matchedKey = fieldMapKeys.find(
      (key) =>
        `${arrayName}.${partyIndex}.${partyFieldMap[key]}` === error.field ||
        `${arrayName}[${partyIndex}].${partyFieldMap[key]}` === error.field
    );
    if (!matchedKey && error.field && error.field in partyFieldMap) {
      return {
        field: error.field as keyof typeof partyFieldMap,
        message: error.message,
        path: error.field,
      };
    }
    return { field: matchedKey, message: error.message, path: error.field };
  });
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
  const formValueKeys = Object.keys(formValues) as Array<
    keyof OnboardingWizardFormValues
  >;
  formValueKeys.forEach((key) => {
    if (!partyFieldMap[key]) {
      if (key === 'product') {
        return;
      }
      throw new Error(`${key} is not mapped in fieldMap`);
    }

    const path = `${arrayName}.${partyIndex}.${partyFieldMap[key].path}`;
    const value = formValues[key];

    if (value !== '' && value !== undefined) {
      const modifiedValue = partyFieldMap[key].toRequestFn
        ? (
            partyFieldMap[key] as { toRequestFn: (val: any) => any }
          ).toRequestFn(value)
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
  const formValueKeys = Object.keys(formValues) as Array<
    keyof OnboardingWizardFormValues
  >;
  formValueKeys.forEach((key) => {
    if (!partyFieldMap[key]) {
      if (key === 'product') {
        return;
      }
      throw new Error(`${key} is not mapped in fieldMap`);
    }

    const path = `${partyFieldMap[key].path}`;
    const value = formValues[key];

    if (value !== '' && value !== undefined) {
      const modifiedValue = partyFieldMap[key].toRequestFn
        ? (
            partyFieldMap[key] as { toRequestFn: (val: any) => any }
          ).toRequestFn(value)
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

  const cleanedResponse = { ...response };
  cleanedResponse.parties = cleanedResponse.parties?.map((party) => {
    const cleanedParty = { ...party };
    if (cleanedParty?.organizationDetails?.organizationIds?.length === 0) {
      delete cleanedParty.organizationDetails.organizationIds;
    }
    return cleanedParty;
  });

  cleanedResponse.parties?.forEach((party) => {
    if (party?.organizationDetails?.organizationIds?.length === 0) {
      delete party.organizationDetails.organizationIds;
    }
  });

  Object.entries(partyFieldMap).forEach(([fieldName, config]) => {
    const partyIndex =
      cleanedResponse.parties?.findIndex((party) => party?.id === partyId) ??
      -1;

    const pathTemplate = `parties.${partyIndex}.${config.path}`;
    const value = getValueByPath(cleanedResponse, pathTemplate);
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
  fieldConfig: FieldConfiguration<any>,
  clientContext: ClientContext
): FieldRule {
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

  function getFieldRule(fieldName: keyof OnboardingWizardFormValues) {
    return getFieldRuleByClientContext(fieldName, clientContext);
  }

  // Use for fields that don't use OnboardingFormField
  function isFieldVisible(fieldName: keyof OnboardingWizardFormValues) {
    return getFieldRule(fieldName).visibility !== 'hidden';
  }
  function isFieldDisabled(fieldName: keyof OnboardingWizardFormValues) {
    return (
      getFieldRule(fieldName).visibility === 'disabled' ||
      getFieldRule(fieldName).visibility === 'readonly'
    );
  }
  function isFieldRequired(fieldName: keyof OnboardingWizardFormValues) {
    return getFieldRule(fieldName).required;
  }

  return {
    filterSchema,
    filterDefaultValues,
    getFieldRule,
    isFieldVisible,
    isFieldDisabled,
    isFieldRequired,
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
  fieldName: keyof OnboardingWizardFormValues,
  clientContext: ClientContext
): FieldRule {
  const fieldConfig = partyFieldMap[fieldName];
  if (!fieldConfig) {
    throw new Error(`${fieldName} is not mapped in fieldMap`);
  }

  const fieldRule = evaluateFieldRules(fieldConfig, clientContext);

  return fieldRule;
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
  Object.entries(shape).forEach(([key, value]) => {
    const fieldConfig = partyFieldMap[key as keyof OnboardingWizardFormValues];
    if (!fieldConfig) {
      if (key === 'product') {
        filteredSchema[key] = value;
        return;
      }
      throw new Error(`${key} is not mapped in fieldMap`);
    }
    const fieldRule = evaluateFieldRules(fieldConfig, clientContext);
    // Modify the field schema based on the field rule
    let fieldSchema = value;
    if (fieldRule.visibility !== 'hidden') {
      if (!fieldRule.required) {
        fieldSchema = value.optional();
      }
      if (value instanceof z.ZodArray) {
        if (fieldRule.minItems !== undefined) {
          fieldSchema = z.array(value.element).min(fieldRule.minItems);
        }
        if (fieldRule.maxItems !== undefined) {
          fieldSchema = z.array(value.element).max(fieldRule.maxItems);
        }
      }
      filteredSchema[key] = fieldSchema;
    }
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

  Object.entries(defaultValues).forEach(([key, value]) => {
    const fieldConfig = partyFieldMap[key as keyof OnboardingWizardFormValues];
    if (!fieldConfig) {
      if (key === 'product') {
        filteredDefaultValues[key] =
          value as OnboardingWizardFormValues['product'];
        return;
      }
      throw new Error(`${key} is not mapped in fieldMap`);
    }
    const fieldRule = evaluateFieldRules(fieldConfig, clientContext);
    if (fieldRule.visibility !== 'hidden') {
      filteredDefaultValues[key as keyof OnboardingWizardFormValues] =
        value as any;
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
    reValidateMode: 'onChange', // prevents edge cases where select fields are not revalidated
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

// Not used
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

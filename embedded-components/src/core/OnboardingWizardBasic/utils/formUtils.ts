import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  ApiErrorReasonV2,
  ClientResponse,
  CreateClientRequestSmbdo,
  UpdateClientRequestSmbdo,
} from '@/api/generated/smbdo.schemas';

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

// Modify the request body with the form values at the specified partyIndex
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

export function getValueByPath(obj: any, pathTemplate: string): any {
  const keys = pathTemplate.replace(/\[(\w+)\]/g, '.$1').split('.');
  return keys.reduce(
    (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
    obj
  );
}

// Convert data of party (with the specified partyId) to form values
export function convertClientResponseToFormValues(
  response: ClientResponse,
  partyId?: string
): Partial<OnboardingWizardFormValues> {
  const formValues: Partial<OnboardingWizardFormValues> = {};

  Object.entries(partyFieldMap).forEach(([fieldName, config]) => {
    const partyIndex =
      response.parties?.findIndex((party) => party?.id === partyId) ?? -1;

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

export const useFilterFunctionsByClientContext = (
  clientData?: ClientResponse
) => {
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

  // Temporary helper functions; to be replaced with custom field components
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
};

function getFieldRuleByClientContext(
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

function filterSchemaByClientContext(
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
      throw new Error(`${key} is not mapped in fieldMap`);
    }
    const fieldRule = evaluateFieldRules(fieldConfig, clientContext);
    // Modify the field schema based on the field rule
    let fieldSchema = value;
    if (fieldRule.visibility !== 'hidden') {
      if (!fieldRule.required) {
        fieldSchema = value.optional();
      }
      if (fieldRule.minItems) {
        fieldSchema = (value as z.ZodArray<z.ZodType<any>>).min(
          fieldRule.minItems
        );
      }
      if (fieldRule.maxItems) {
        fieldSchema = (value as z.ZodArray<z.ZodType<any>>).max(
          fieldRule.maxItems
        );
      }
      filteredSchema[key] = fieldSchema;
    }
  });
  if (refineFn) {
    return refineFn(z.object(filteredSchema));
  }
  return z.object(filteredSchema);
}

function filterDefaultValuesByClientContext(
  defaultValues: Partial<OnboardingWizardFormValues>,
  clientContext: ClientContext
): Partial<OnboardingWizardFormValues> {
  const filteredDefaultValues: Partial<OnboardingWizardFormValues> = {};
  Object.entries(defaultValues).forEach(([key, value]) => {
    const fieldConfig = partyFieldMap[key as keyof OnboardingWizardFormValues];
    if (!fieldConfig) {
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

import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import {
  ApiErrorReasonV2,
  ClientResponse,
} from '@/api/generated/smbdo.schemas';

import { OnboardingWizardFormValues, partyFieldMap } from './fieldMap';
import {  Product, Jurisdiction, LegalEntityType, FieldRule, FieldConfiguration } from './types';

type FormError = {
  field?: keyof typeof partyFieldMap;
  message: string;
  path?: string;
};

// Add new context type
export type FieldContext = {
  product: Product;
  jurisdiction: Jurisdiction;
  entityType: LegalEntityType;
};

// New function to evaluate field rules
export function evaluateFieldRules(
  fieldConfig: FieldConfiguration,
  context: FieldContext
): FieldRule {
  let rule = { ...fieldConfig.baseRule };
  
  fieldConfig.conditionalRules?.forEach(({ condition, rule: conditionalRule }) => {
    if (
      (!condition.product || condition.product.includes(context.product)) &&
      (!condition.jurisdiction || condition.jurisdiction.includes(context.jurisdiction)) &&
      (!condition.entityType || condition.entityType.includes(context.entityType))
    ) {
      rule = { ...rule, ...conditionalRule };
    }
  });
  
  return rule;
}

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

// Modified version of generateRequestBody
export function generateRequestBody(
  formValues: Partial<OnboardingWizardFormValues>,
  partyIndex: number,
  arrayName: 'parties' | 'addParties',
  obj: any,
  context: FieldContext
) {
  const formValueKeys = Object.keys(formValues) as Array<keyof OnboardingWizardFormValues>;
  
  formValueKeys.forEach((key) => {
    const fieldConfig = partyFieldMap[key];
    if (fieldConfig) {
      if (!fieldConfig) {
        return;
      }
      const fieldRule = evaluateFieldRules(fieldConfig, context);
    
      if (fieldRule.visibility === 'hidden') {
        return;
      }

      const path = `${arrayName}.${partyIndex}.${fieldConfig.path}`;
      let value = fieldRule.defaultValue !== undefined ? fieldRule.defaultValue : formValues[key];

    if (value !== '' && value !== undefined) {
      if (fieldConfig.toRequestFn) {
        value = fieldConfig.toRequestFn(value);
      }

      // Handle maxItems for collection fields
      if (Array.isArray(value) && fieldRule.maxItems) {
        value = value.slice(0, fieldRule.maxItems);
      }

      setValueByPath(obj, path, value);
    }
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

    const path = typeof config === 'string' ? config : config.path;

    const pathTemplate = `parties.${partyIndex}.${path}`;
    const value = getValueByPath(response, pathTemplate);
    if (value !== undefined) {
      const modifiedValue =
        typeof config === 'string'
          ? value
          : config.fromResponseFn
            ? config.fromResponseFn(value)
            : value;
      formValues[fieldName as keyof OnboardingWizardFormValues] = modifiedValue;
    } else {
      console.log(fieldName, value);
    }
  });

  return formValues;
}

// New helper for form field visibility
export function isFieldVisible(
  fieldName: keyof OnboardingWizardFormValues,
  context: FieldContext
): boolean | undefined {
  const fieldConfig = partyFieldMap[fieldName];
  if (!fieldConfig) {
    return undefined;
  }
  const fieldRule = evaluateFieldRules(fieldConfig, context);
  return fieldRule.visibility !== 'hidden';
}

// New helper for field disabled state
export function isFieldDisabled(
  fieldName: keyof OnboardingWizardFormValues,
  context: FieldContext
): boolean | undefined {
  const fieldConfig = partyFieldMap[fieldName];
  if (!fieldConfig) {
    return undefined;
  }
  const fieldRule = evaluateFieldRules(fieldConfig, context);
  return fieldRule.visibility === 'disabled';
}

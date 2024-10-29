import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { z, ZodObject } from 'zod';

import {
  ApiErrorReasonV2,
  ClientResponse,
  CreateClientRequestSmbdo,
  UpdateClientRequestSmbdo,
} from '@/api/generated/smbdo.schemas';

import { OnboardingWizardFormValues, partyFieldMap } from './fieldMap';
import { OnboardingUseCase } from './types';

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
      throw new Error(`${key} is not mapped in fieldMap`);
    }
    const pathEnd =
      typeof partyFieldMap[key] === 'string'
        ? partyFieldMap[key]
        : partyFieldMap[key].path;
    const path = `${arrayName}.${partyIndex}.${pathEnd}`;
    const value = formValues[key];

    if (value !== '' && value !== undefined) {
      const modifiedValue =
        typeof partyFieldMap[key] === 'string'
          ? value
          : partyFieldMap[key].toRequestFn
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

export const useIsFieldVisible = (useCase: OnboardingUseCase) => {
  return (fieldName: keyof OnboardingWizardFormValues) => {
    const fieldConfig = partyFieldMap[fieldName];

    if (typeof fieldConfig === 'string') {
      return true;
    }
    return !fieldConfig?.useCases || fieldConfig.useCases.includes(useCase);
  };
};

export function filterSchemaByUseCase(
  schema: ZodObject<Record<string, z.ZodType<any>>>,
  useCase: OnboardingUseCase
): ZodObject<Record<string, z.ZodType<any>>> {
  const { shape } = schema;

  const filteredSchema: Record<string, z.ZodType<any>> = {};
  Object.entries(shape).forEach(([key, value]) => {
    const fieldConfig = partyFieldMap[key as keyof OnboardingWizardFormValues];
    if (typeof fieldConfig === 'string') {
      filteredSchema[key] = value;
    } else if (
      !fieldConfig?.useCases ||
      fieldConfig.useCases.includes(useCase)
    ) {
      filteredSchema[key] = value;
    }
  });
  return z.object(filteredSchema);
}

export function filterDefaultValuesByUseCase(
  defaultValues: Partial<OnboardingWizardFormValues>,
  useCase: OnboardingUseCase
): Partial<OnboardingWizardFormValues> {
  const filteredDefaultValues: Partial<OnboardingWizardFormValues> = {};
  Object.entries(defaultValues).forEach(([key, value]) => {
    const fieldConfig = partyFieldMap[key as keyof OnboardingWizardFormValues];
    if (typeof fieldConfig === 'string') {
      filteredDefaultValues[key as keyof OnboardingWizardFormValues] =
        value as any;
    } else if (
      !fieldConfig?.useCases ||
      fieldConfig.useCases.includes(useCase)
    ) {
      filteredDefaultValues[key as keyof OnboardingWizardFormValues] =
        value as any;
    }
  });
  return filteredDefaultValues;
}

import { z } from 'zod';

import { getAddressValidationIssues } from './getAddressValidationIssues';

export type ProfileAddressValidationMessage = (
  field: string,
  messageKey: string,
  params?: Record<string, string>
) => string;

export function createProfileAddressSchema(
  getValidationMessage: ProfileAddressValidationMessage
) {
  return z
    .object({
      country: z
        .string()
        .min(1, getValidationMessage('country', 'required'))
        .length(2, getValidationMessage('country', 'exactlyTwoChars')),
      primaryAddressLine: z
        .string()
        .min(1, getValidationMessage('primaryAddressLine', 'required'))
        .max(60, getValidationMessage('primaryAddressLine', 'maxLength')),
      secondaryAddressLine: z
        .string()
        .max(60, getValidationMessage('secondaryAddressLine', 'maxLength')),
      tertiaryAddressLine: z
        .string()
        .max(60, getValidationMessage('tertiaryAddressLine', 'maxLength')),
      city: z.string().max(34, getValidationMessage('city', 'maxLength')),
      state: z.string(),
      postalCode: z
        .string()
        .max(10, getValidationMessage('postalCode', 'maxLength')),
    })
    .superRefine((values, context) => {
      getAddressValidationIssues(values).forEach((issue) => {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [issue.field],
          message: getValidationMessage(
            issue.field,
            issue.messageKey,
            issue.params
          ),
        });
      });
    });
}

import { z } from 'zod';

import { NAME_PATTERN } from '@/core/OnboardingFlow/utils/validationPatterns';

export type IndividualLegalNameFieldNames = {
  firstName: string;
  middleName: string;
  lastName: string;
};

type IndividualLegalNameFieldName<
  TFieldNames extends IndividualLegalNameFieldNames,
> =
  | TFieldNames['firstName']
  | TFieldNames['middleName']
  | TFieldNames['lastName'];

export type ProfileValidationMessage<TFieldName extends string = string> = (
  fieldName: TFieldName,
  messageKey: string
) => string;

const createRequiredNameSchema = <TFieldName extends string>(
  fieldName: TFieldName,
  getValidationMessage: ProfileValidationMessage<TFieldName>
) =>
  z
    .string()
    .min(1, getValidationMessage(fieldName, 'required'))
    .min(2, getValidationMessage(fieldName, 'minLength'))
    .max(30, getValidationMessage(fieldName, 'maxLength'))
    .refine(
      (name) => NAME_PATTERN.test(name),
      getValidationMessage(fieldName, 'pattern')
    )
    .refine(
      (name) => !/\s\s/.test(name),
      getValidationMessage(fieldName, 'noConsecutiveSpaces')
    )
    .refine(
      (name) => !/-{2,}/.test(name),
      getValidationMessage(fieldName, 'noConsecutiveHyphens')
    );

const createOptionalNameSchema = <TFieldName extends string>(
  fieldName: TFieldName,
  getValidationMessage: ProfileValidationMessage<TFieldName>
) =>
  z
    .string()
    .max(30, getValidationMessage(fieldName, 'maxLength'))
    .refine(
      (name) => NAME_PATTERN.test(name),
      getValidationMessage(fieldName, 'pattern')
    );

export function createIndividualLegalNameSchemaShape<
  const TFieldNames extends IndividualLegalNameFieldNames,
>(
  fieldNames: TFieldNames,
  getValidationMessage: ProfileValidationMessage<
    NoInfer<IndividualLegalNameFieldName<TFieldNames>>
  >
): Record<IndividualLegalNameFieldName<TFieldNames>, z.ZodType<string>> {
  type FieldName = IndividualLegalNameFieldName<TFieldNames>;
  return {
    [fieldNames.firstName]: createRequiredNameSchema<FieldName>(
      fieldNames.firstName,
      getValidationMessage
    ),
    [fieldNames.middleName]: createOptionalNameSchema<FieldName>(
      fieldNames.middleName,
      getValidationMessage
    ),
    [fieldNames.lastName]: createRequiredNameSchema<FieldName>(
      fieldNames.lastName,
      getValidationMessage
    ),
  } as unknown as Record<
    IndividualLegalNameFieldName<TFieldNames>,
    z.ZodType<string>
  >;
}

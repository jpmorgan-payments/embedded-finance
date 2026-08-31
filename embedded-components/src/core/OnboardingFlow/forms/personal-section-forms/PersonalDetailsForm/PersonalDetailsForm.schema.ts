import { z } from 'zod';

import { createIndividualLegalNameSchemaShape } from '@/core/ClientProfile/schemas/individualLegalNameSchema';
import {
  JOB_TITLES,
  NATURE_OF_OWNERSHIP_OPTIONS,
} from '@/core/OnboardingFlow/consts';
import { useGetValidationMessage } from '@/core/OnboardingFlow/utils/formUtils';
import {
  containsHtmlLikeTag,
  JOB_TITLE_DESCRIPTION_PATTERN,
  SUFFIX_PATTERN,
} from '@/core/OnboardingFlow/utils/validationPatterns';

export const usePersonalDetailsFormSchema = () => {
  const v = useGetValidationMessage();
  return z.object({
    countryOfResidence: z
      .string()
      .min(1, v('countryOfResidence', 'required'))
      .length(2, v('countryOfResidence', 'exactlyTwoChars')),
    ...createIndividualLegalNameSchemaShape(
      {
        firstName: 'controllerFirstName',
        middleName: 'controllerMiddleName',
        lastName: 'controllerLastName',
      },
      v
    ),
    controllerNameSuffix: z
      .string()
      .min(1, v('controllerNameSuffix', 'minLength'))
      .max(5, v('controllerNameSuffix', 'maxLength'))
      .refine(
        (val) => SUFFIX_PATTERN.test(val),
        v('controllerNameSuffix', 'pattern')
      ),
    controllerJobTitle: z
      .union([
        z.enum(JOB_TITLES, {
          message: v('controllerJobTitle', 'invalidOption'),
        }),
        z.literal(''),
      ])
      .refine((val) => val !== '', {
        message: v('controllerJobTitle', 'required'),
      }),
    controllerJobTitleDescription: z
      .string()
      .max(50, v('controllerJobTitleDescription', 'maxLength'))
      .refine(
        (val) => val === '' || JOB_TITLE_DESCRIPTION_PATTERN.test(val),
        v('controllerJobTitleDescription', 'pattern')
      )
      .refine(
        (val) => !containsHtmlLikeTag(val),
        v('controllerJobTitleDescription', 'noHtml')
      )
      .refine(
        (val) => !/https?:\/\/[^\s]+/.test(val),
        v('controllerJobTitleDescription', 'noUrls')
      ),
    natureOfOwnership: z
      .union([
        z.enum(NATURE_OF_OWNERSHIP_OPTIONS, {
          message: v('natureOfOwnership', 'invalidOption'),
        }),
        z.literal(''),
      ])
      .refine((val) => val !== '', {
        message: v('natureOfOwnership', 'required'),
      }),
  });
};

export const refinePersonalDetailsFormSchema = (
  schema: z.ZodObject<Record<string, z.ZodTypeAny>>
) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- pre-existing: i18n hook used inside a schema-refine helper invoked during render; tracked as debt.
  const v = useGetValidationMessage();
  return schema.superRefine((values, context) => {
    if (
      values.controllerJobTitle === 'Other' &&
      !values.controllerJobTitleDescription
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: v('controllerJobTitleDescription', 'required'),
        path: ['controllerJobTitleDescription'],
      });
    }
  });
};

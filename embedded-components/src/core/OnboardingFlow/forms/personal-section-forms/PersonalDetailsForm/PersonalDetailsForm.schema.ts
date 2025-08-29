import { z } from 'zod';

import {
  JOB_TITLES,
  NATURE_OF_OWNERSHIP_OPTIONS,
} from '@/core/OnboardingFlow/consts';
import { useGetValidationMessage } from '@/core/OnboardingFlow/utils/formUtils';
import {
  NAME_PATTERN,
  SUFFIX_PATTERN,
} from '@/core/OnboardingFlow/utils/validationPatterns';

export const usePersonalDetailsFormSchema = () => {
  const v = useGetValidationMessage();
  return z.object({
    controllerFirstName: z
      .string()
      .min(1, v('controllerFirstName', 'required'))
      .min(2, v('controllerFirstName', 'minLength'))
      .max(30, v('controllerFirstName', 'maxLength'))
      .refine(
        (val) => NAME_PATTERN.test(val),
        v('controllerFirstName', 'pattern')
      )
      .refine(
        (val) => !/\s\s/.test(val),
        v('controllerFirstName', 'noConsecutiveSpaces')
      )
      .refine(
        (val) => !/-{2,}/.test(val),
        v('controllerFirstName', 'noConsecutiveHyphens')
      ),
    controllerMiddleName: z
      .string()
      .max(30, v('controllerMiddleName', 'maxLength'))
      .refine(
        (val) => NAME_PATTERN.test(val),
        v('controllerMiddleName', 'pattern')
      ),
    controllerLastName: z
      .string()
      .min(2, v('controllerLastName', 'minLength'))
      .max(30, v('controllerLastName', 'maxLength'))
      .refine(
        (val) => NAME_PATTERN.test(val),
        v('controllerLastName', 'pattern')
      )
      .refine(
        (val) => !/\s\s/.test(val),
        v('controllerLastName', 'noConsecutiveSpaces')
      )
      .refine(
        (val) => !/-{2,}/.test(val),
        v('controllerLastName', 'noConsecutiveHyphens')
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
      .union([z.enum(JOB_TITLES), z.literal('')])
      .refine((val) => val !== '', {
        message: v('controllerJobTitle', 'required'),
      }),
    controllerJobTitleDescription: z
      .string()
      .max(50, v('controllerJobTitleDescription', 'maxLength'))
      .refine(
        (val) => /^[a-zA-Z0-9\s,.&-]+$/.test(val),
        v('controllerJobTitleDescription', 'pattern')
      )
      .refine(
        (val) => !/(<[^>]*>)/.test(val),
        v('controllerJobTitleDescription', 'noHtml')
      )
      .refine(
        (val) => !/https?:\/\/[^\s]+/.test(val),
        v('controllerJobTitleDescription', 'noUrls')
      ),
    natureOfOwnership: z
      .union([z.enum(NATURE_OF_OWNERSHIP_OPTIONS), z.literal('')])
      .refine((val) => val !== '', {
        message: v('natureOfOwnership', 'required'),
      }),
  });
};

export const refinePersonalDetailsFormSchema = (
  schema: z.ZodObject<Record<string, z.ZodType<any>>>
) => {
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

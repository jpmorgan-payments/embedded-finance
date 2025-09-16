import { z } from 'zod';

import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingFlow/consts';
import { useGetValidationMessage } from '@/core/OnboardingFlow/utils/formUtils';

const CURRENT_YEAR = new Date().getFullYear();
const NAME_PATTERN = /^[a-zA-Z0-9()_\\/@&+%#;,.: '-]*$/;
const SPECIAL_CHARS_PATTERN = /[()_\\/&+%@#;,.: '-]/;

// const OrganizationIdSchema = z
//   .object({
//     description: z
//       .string()
//       .max(
//         100,
//         i18n.t(
//           'onboarding:fields.organizationIds.description.validation.maxLength'
//         )
//       )
//       .optional(),
//     idType: z.enum([
//       'EIN',
//       'BUSINESS_REGISTRATION_ID',
//       'BUSINESS_NUMBER',
//       'BUSINESS_REGISTRATION_NUMBER',
//     ]),
//     value: z
//       .string()
//       .min(
//         1,
//         i18n.t('onboarding:fields.organizationIds.value.validation.required')
//       )
//       .max(
//         100,
//         i18n.t('onboarding:fields.organizationIds.value.validation.maxLength')
//       )
//       .refine(
//         (val) => /^[A-Za-z0-9-]+$/.test(val),
//         i18n.t('onboarding:fields.organizationIds.value.validation.format')
//       ),
//     issuer: z
//       .string()
//       .min(
//         1,
//         i18n.t('onboarding:fields.organizationIds.issuer.validation.required')
//       )
//       .max(
//         500,
//         i18n.t('onboarding:fields.organizationIds.issuer.validation.maxLength')
//       ),
//     expiryDate: z
//       .string()
//       .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
//         message: i18n.t(
//           'onboarding:fields.organizationIds.expiryDate.validation.format'
//         ),
//       })
//       .refine((val) => !Number.isNaN(new Date(val).getTime()), {
//         message: i18n.t(
//           'onboarding:fields.organizationIds.expiryDate.validation.invalid'
//         ),
//       })
//       .refine(
//         (val) => {
//           const date = new Date(val);
//           const now = new Date();
//           return date > now;
//         },
//         {
//           message: i18n.t(
//             'onboarding:fields.organizationIds.expiryDate.validation.future'
//           ),
//         }
//       )
//       .refine(
//         (val) => {
//           const date = new Date(val);
//           const now = new Date();
//           const tenYearsFromNow = new Date(
//             now.setFullYear(now.getFullYear() + 10)
//           );
//           return date < tenYearsFromNow;
//         },
//         {
//           message: i18n.t(
//             'onboarding:fields.organizationIds.expiryDate.validation.maxYears'
//           ),
//         }
//       )
//       .optional(),
//   })
//   .refine(
//     (data) => {
//       switch (data.idType) {
//         case 'EIN':
//           // EIN: 9 digits
//           return /^\d{9}$/.test(data.value);
//         case 'BUSINESS_REGISTRATION_ID':
//           // Business Registration ID: Alphanumeric, 5-15 chars
//           return /^[A-Za-z0-9]{5,15}$/.test(data.value);
//         case 'BUSINESS_NUMBER':
//           // Business Number: 9-12 digits
//           return /^\d{9,12}$/.test(data.value);
//         case 'BUSINESS_REGISTRATION_NUMBER':
//           // Business Registration Number: Alphanumeric with optional dashes, 6-15 chars
//           return /^[A-Za-z0-9-]{6,15}$/.test(data.value);
//         default:
//           return true;
//       }
//     },
//     (data) => ({
//       message: i18n.t(
//         `onboarding:fields.organizationIds.value.validation.${data.idType.toLowerCase()}Format`
//       ),
//       path: ['value'],
//     })
//   );

export const useBusinessIdentityFormSchema = () => {
  const v = useGetValidationMessage();
  return z.object({
    organizationName: z
      .string()
      .min(1, v('organizationName', 'required'))
      .min(2, v('organizationName', 'minLength'))
      .max(100, v('organizationName', 'maxLength'))
      .refine((val) => NAME_PATTERN.test(val), v('organizationName', 'pattern'))
      .refine(
        (val) => !/\s\s/.test(val),
        v('organizationName', 'noConsecutiveSpaces')
      )
      .refine(
        (val) => !SPECIAL_CHARS_PATTERN.test(val.charAt(0)),
        v('organizationName', 'noSpecialCharStart')
      ),
    dbaName: z
      .string()
      .max(100, v('dbaName', 'maxLength', 100))
      .refine((val) => NAME_PATTERN.test(val), v('dbaName', 'pattern'))
      .refine(
        (val) => !val || !/\s\s/.test(val),
        v('dbaName', 'noConsecutiveSpaces')
      )
      .refine((val) => !val || val.length >= 2, v('dbaName', 'minLength', 2)),
    dbaNameNotAvailable: z.boolean(),
    yearOfFormation: z
      .string()
      .refine(
        (val) => /^(19|20)\d{2}$/.test(val),
        v('yearOfFormation', 'format')
      )
      .refine(
        (val) => {
          const year = parseInt(val, 10);
          return year >= 1800;
        },
        v('yearOfFormation', 'min')
      )
      .refine(
        (val) => {
          const year = parseInt(val, 10);
          return year <= CURRENT_YEAR;
        },
        v('yearOfFormation', 'future')
      ),
    countryOfFormation: z
      .string()
      .length(2, v('countryOfFormation', 'length'))
      .refine(
        (val) => COUNTRIES_OF_FORMATION.includes(val),
        v('countryOfFormation', 'invalid')
      )
      .refine((val) => val === 'US', v('countryOfFormation', 'usOnly')),
    organizationIdEin: z
      .string()
      .min(1, v('organizationIdEin', 'required'))
      .max(100, v('organizationIdEin', 'maxLength', 100))
      .refine((val) => /^\d+$/.test(val), v('organizationIdEin', 'format')),
    solePropHasEin: z
      .string()
      .refine(
        (val) => val === 'yes' || val === 'no',
        v('solePropHasEin', 'required')
      ),
    website: z
      .string()
      .url(v('website', 'format'))
      .max(500, v('website', 'maxLength', 500))
      .refine((val) => /^https?:\/\//.test(val), v('website', 'httpsRequired'))
      .refine(
        (val) =>
          !val || !/^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(val),
        v('website', 'noIp')
      ),
    websiteNotAvailable: z.boolean(),
  });
};

export const refineBusinessIdentityFormSchema = (
  schema: z.ZodObject<Record<string, z.ZodType<any>>>
) => {
  const v = useGetValidationMessage();
  return schema.superRefine((values, context) => {
    if (
      values.countryOfFormation === 'US' &&
      values.solePropHasEin !== 'no' &&
      !values.organizationIdEin
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: v('organizationIdEin', 'required'),
        path: ['organizationIdEin'],
      });
    }
    if (!values.websiteNotAvailable && !values.website) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: v('website', 'required'),
        path: ['website'],
      });
    }
    if (!values.dbaNameNotAvailable && !values.dbaName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: v('dbaName', 'required'),
        path: ['dbaName'],
      });
    }
  });
};

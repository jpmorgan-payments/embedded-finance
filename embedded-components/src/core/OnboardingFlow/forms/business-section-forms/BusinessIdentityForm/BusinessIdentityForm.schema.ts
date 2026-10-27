import { z } from 'zod';

import { getEinValidationIssue } from '@/core/ClientProfile/schemas/isValidEin';
import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingFlow/consts';
import { useOnboardingContext } from '@/core/OnboardingFlow/contexts';
import { getOrganizationParty } from '@/core/OnboardingFlow/utils/dataUtils';
import { useGetValidationMessage } from '@/core/OnboardingFlow/utils/formUtils';
import { NAME_PATTERN } from '@/core/OnboardingFlow/utils/validationPatterns';

const CURRENT_YEAR = new Date().getFullYear();
const SPECIAL_CHARS_PATTERN = /[()_/@&+%#;,.: '-]/;
// Allowed characters for organization ID values (OAS OrganizationIdentityDto.value).
const ORGANIZATION_ID_PATTERN = /^[A-Za-z0-9/.\s+&-]*$/;

/**
 * Countries the business may select as its country of formation, from the
 * `experimental_availableCountriesOfFormation` prop. `undefined` means the default (US only).
 * Sole proprietorships are always formed in the US.
 */
export const useAllowedCountriesOfFormation = ():
  | readonly string[]
  | undefined => {
  const { clientData, experimental_availableCountriesOfFormation } =
    useOnboardingContext();
  const isSoleProp =
    getOrganizationParty(clientData)?.organizationDetails?.organizationType ===
    'SOLE_PROPRIETORSHIP';
  return !isSoleProp && experimental_availableCountriesOfFormation?.length
    ? experimental_availableCountriesOfFormation
    : undefined;
};

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
  const allowedCountries = useAllowedCountriesOfFormation();
  return z.object({
    organizationName: z
      .string()
      .min(1, v('organizationName', 'required'))
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
      .refine((val) => !val || NAME_PATTERN.test(val), v('dbaName', 'pattern'))
      .refine(
        (val) => !val || !/\s\s/.test(val),
        v('dbaName', 'noConsecutiveSpaces')
      )
      .refine((val) => !val || val.length >= 2, v('dbaName', 'minLength', 2))
      .optional()
      .or(z.literal('')),
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
      .refine(
        (val) =>
          allowedCountries ? allowedCountries.includes(val) : val === 'US',
        allowedCountries
          ? v('countryOfFormation', 'notAvailable')
          : v('countryOfFormation', 'usOnly')
      ),
    organizationIdEin: z
      .string()
      .min(1, v('organizationIdEin', 'required'))
      .refine((val) => val.length === 9, v('organizationIdEin', 'length'))
      .refine(
        (val) => /^\d{9}$/.test(val),
        v('organizationIdEin', 'digitsOnly')
      )
      .refine(
        (val) => getEinValidationIssue(val) !== 'invalidValue',
        v('organizationIdEin', 'invalidValue')
      ),
    // Required only for non-US businesses (see refineBusinessIdentityFormSchema).
    organizationIdRegistration: z
      .string()
      .max(100, v('organizationIdRegistration', 'maxLength'))
      .refine(
        (val) => ORGANIZATION_ID_PATTERN.test(val),
        v('organizationIdRegistration', 'pattern')
      )
      .optional(),
    solePropHasEin: z
      .string()
      .refine(
        (val) => val === 'yes' || val === 'no',
        v('solePropHasEin', 'required')
      ),
    website: z
      .string()
      .max(500, v('website', 'maxLength', 500))
      .optional()
      .or(z.literal('')),
    websiteNotAvailable: z.boolean().optional(),
  });
};

export const refineBusinessIdentityFormSchema = (
  schema: z.ZodObject<Record<string, z.ZodTypeAny>>
) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- pre-existing: i18n hook used inside a schema-refine helper invoked during render; tracked as debt.
  const v = useGetValidationMessage();
  // eslint-disable-next-line react-hooks/rules-of-hooks -- same render-time helper as above.
  const allowedCountries = useAllowedCountriesOfFormation();
  const { organizationIdEin } = schema.shape;
  // When non-US formation is allowed, the EIN is validated only for US businesses.
  const collectsRegistrationId =
    !!organizationIdEin && !!allowedCountries?.some((code) => code !== 'US');
  const baseSchema: z.ZodObject<Record<string, z.ZodTypeAny>> =
    collectsRegistrationId
      ? schema.extend({ organizationIdEin: z.string().optional() })
      : schema;

  return baseSchema.superRefine((values, context) => {
    if (collectsRegistrationId) {
      if ((values.countryOfFormation ?? 'US') === 'US') {
        organizationIdEin
          .safeParse(values.organizationIdEin)
          .error?.issues.forEach((issue) => {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: issue.message,
              path: ['organizationIdEin', ...issue.path],
            });
          });
      } else if (!values.organizationIdRegistration) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: v('organizationIdRegistration', 'required'),
          path: ['organizationIdRegistration'],
        });
      }
    }

    if (
      values.countryOfFormation === 'US' &&
      values.solePropHasEin === 'yes' &&
      !values.organizationIdEin
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: v('organizationIdEin', 'required'),
        path: ['organizationIdEin'],
      });
    }
  });
};

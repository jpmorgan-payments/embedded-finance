import { i18n } from '@/i18n/config';
import { z } from 'zod';

import {
  isKnownInvalidSsn,
  isValidItinMiddleDigits,
  isValidSsn,
} from '@/core/ClientProfile/schemas/isValidIndividualTaxId';
import { useGetValidationMessage } from '@/core/OnboardingFlow/utils/formUtils';

const MIN_AGE = 18;
const MAX_AGE = 120;

const createControllerIdSchema = (
  v: ReturnType<typeof useGetValidationMessage>
) =>
  z
    .object({
      description: z.string().optional(),
      expiryDate: z
        .string()
        .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
          message: v('controllerIds.expiryDate', 'format'),
        })
        .refine((val) => !Number.isNaN(new Date(val).getTime()), {
          message: v('controllerIds.expiryDate', 'invalid'),
        })
        .refine(
          (val) => {
            const date = new Date(val);
            const now = new Date();
            return date > now;
          },
          v('controllerIds.expiryDate', 'past')
        )
        .refine(
          (val) => {
            const date = new Date(val);
            const now = new Date();
            const tenYearsFromNow = new Date(
              now.setFullYear(now.getFullYear() + 10)
            );
            return date <= tenYearsFromNow;
          },
          v('controllerIds.expiryDate', 'tooFarInFuture')
        )
        .or(z.literal(undefined)),
      idType: z
        .enum([
          '',
          'SSN',
          'ITIN',
          'NATIONAL_ID',
          'DRIVERS_LICENSE',
          'PASSPORT',
          'SOCIAL_INSURANCE_NUMBER',
          'OTHER_GOVERNMENT_ID',
        ])
        .refine((val) => val !== '', {
          message: v('controllerIds.idType', 'required'),
        }),
      issuer: z
        .string()
        .length(2, v('controllerIds.issuer', 'exactlyTwoChars')),
      value: z
        .string()
        .min(1, v('controllerIds.value', 'required'))
        .refine(
          (val: string) => !/\s/.test(val),
          v('controllerIds.value', 'noSpaces')
        ),
    })
    .refine(
      (data) => {
        if (data.idType === 'SSN' || data.idType === 'ITIN') {
          return data.value.length === 9;
        }
        return true;
      },
      (data) => ({
        message: v(
          'controllerIds.value',
          data.idType === 'SSN' ? 'ssnLength' : 'itinLength'
        ),
        path: ['value'],
      })
    )
    .refine(
      (data) => {
        if (data.idType === 'SSN' || data.idType === 'ITIN') {
          return /^\d{9}$/.test(data.value);
        }
        return true;
      },
      (data) => ({
        message: v(
          'controllerIds.value',
          data.idType === 'SSN' ? 'ssnDigitsOnly' : 'itinDigitsOnly'
        ),
        path: ['value'],
      })
    )
    .refine(
      (data) => {
        if (data.idType === 'SSN') {
          const firstThree = parseInt(data.value.slice(0, 3), 10);
          return firstThree !== 0 && data.value.charAt(0) !== '9';
        }
        return true;
      },
      () => ({
        message: v('controllerIds.value', 'ssnFirstThree'),
        path: ['value'],
      })
    )
    .refine(
      (data) => {
        if (data.idType === 'SSN') {
          const firstThree = parseInt(data.value.slice(0, 3), 10);
          return firstThree !== 666;
        }
        return true;
      },
      () => ({
        message: v('controllerIds.value', 'ssn666'),
        path: ['value'],
      })
    )
    .refine(
      (data) => {
        if (data.idType === 'SSN') {
          return !isKnownInvalidSsn(data.value);
        }
        return true;
      },
      () => ({
        message: v('controllerIds.value', 'ssnKnownInvalid'),
        path: ['value'],
      })
    )
    .refine(
      (data) => {
        if (data.idType === 'ITIN') {
          return data.value.startsWith('9');
        }
        return true;
      },
      () => ({
        message: v('controllerIds.value', 'itinStartsWith9'),
        path: ['value'],
      })
    )
    .refine(
      (data) => {
        if (
          data.idType === 'ITIN' &&
          data.value.length === 9 &&
          data.value.startsWith('9')
        ) {
          return isValidItinMiddleDigits(data.value);
        }
        return true;
      },
      () => ({
        message: v('controllerIds.value', 'itinMiddleDigits'),
        path: ['value'],
      })
    )
    .refine(
      (data) => {
        if (data.idType === 'ITIN') {
          return data.value !== '987654321';
        }
        return true;
      },
      () => ({
        message: v('controllerIds.value', 'itinKnownInvalid'),
        path: ['value'],
      })
    );

export const useIndividualIdentityFormSchema = () => {
  const v = useGetValidationMessage();
  return z.object({
    birthDate: z
      .string()
      .min(1, v('birthDate', 'required'))
      .refine(
        (val) => /^\d{4}-\d{2}-\d{2}$/.test(val),
        v('birthDate', 'format')
      )
      .refine(
        (val) => {
          // Verify the date is a real calendar date (e.g. reject Feb 30)
          // Parse parts from string to avoid UTC vs local timezone issues
          const [year, month, day] = val.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          return (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day
          );
        },
        v('birthDate', 'invalid')
      )
      .refine(
        (val) => {
          const [year, month, day] = val.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          const now = new Date();
          now.setHours(23, 59, 59, 999);
          return date <= now;
        },
        v('birthDate', 'future')
      )
      .refine(
        (val) => {
          const [year, month, day] = val.split('-').map(Number);
          const birthDate = new Date(year, month - 1, day);
          const now = new Date();
          let age = now.getFullYear() - birthDate.getFullYear();
          const monthDiff = now.getMonth() - birthDate.getMonth();
          if (
            monthDiff < 0 ||
            (monthDiff === 0 && now.getDate() < birthDate.getDate())
          ) {
            age -= 1;
          }
          return age >= MIN_AGE;
        },
        v('birthDate', 'tooYoung')
      )
      .refine(
        (val) => {
          const [year, month, day] = val.split('-').map(Number);
          const birthDate = new Date(year, month - 1, day);
          const now = new Date();
          let age = now.getFullYear() - birthDate.getFullYear();
          const monthDiff = now.getMonth() - birthDate.getMonth();
          if (
            monthDiff < 0 ||
            (monthDiff === 0 && now.getDate() < birthDate.getDate())
          ) {
            age -= 1;
          }
          return age <= MAX_AGE;
        },
        v('birthDate', 'tooOld')
      ),
    solePropSsn: z.string(),
    controllerIds: z.array(createControllerIdSchema(v)).refine((ids) => {
      const types = ids?.map((id) => id.idType);
      return new Set(types).size === types?.length;
    }, i18n.t('onboarding-overview:fields.controllerIds.validation.uniqueTypes')),
  });
};

export const refineIndividualIdentityFormSchema = (
  schema: z.ZodObject<Record<string, z.ZodTypeAny>>
) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- pre-existing: i18n hook used inside a schema-refine helper invoked during render; tracked as debt.
  const v = useGetValidationMessage();
  return schema.superRefine((data, ctx) => {
    // Only validate sole prop SSN when the field is present (not hidden by field rules)
    // and the issuer country is US
    const issuerCountry = data.controllerIds?.[0]?.issuer;
    if ('solePropSsn' in data && issuerCountry === 'US') {
      if (!data.solePropSsn || data.solePropSsn.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: v('solePropSsn', 'required'),
          path: ['solePropSsn'],
        });
      } else if (!isValidSsn(data.solePropSsn)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: v('solePropSsn', 'format'),
          path: ['solePropSsn'],
        });
      }
    }
  });
};

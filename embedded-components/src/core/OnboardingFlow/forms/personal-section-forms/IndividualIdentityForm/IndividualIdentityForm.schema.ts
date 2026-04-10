import { i18n } from '@/i18n/config';
import { z } from 'zod';

import { useGetValidationMessage } from '@/core/OnboardingFlow/utils/formUtils';

const MIN_AGE = 18;
const MAX_AGE = 120;

// Helper function to check if the ITIN middle digits (4th-5th) are in a valid range.
// Per IRS rules, the 4th-5th digits must be 50–65, 70–88, 90–92, or 94–99.
const isValidItinMiddleDigits = (value: string): boolean => {
  const middleDigits = parseInt(value.slice(3, 5), 10);

  return (
    (middleDigits >= 50 && middleDigits <= 65) ||
    (middleDigits >= 70 && middleDigits <= 88) ||
    (middleDigits >= 90 && middleDigits <= 92) ||
    (middleDigits >= 94 && middleDigits <= 99)
  );
};

const KNOWN_INVALID_SSNS = [
  '078051120',
  '219099999',
  '123456789',
  '888888888',
  '777777777',
  '555555555',
  '444444444',
  '333333333',
  '222222222',
  '111111111',
  '457555462',
  '012345678',
  '987654321',
];

const isValidSsn = (value: string): boolean => {
  const firstThree = parseInt(value.slice(0, 3), 10);
  return !!(
    value.length === 9 &&
    /^\d{9}$/.test(value) &&
    value.charAt(0) !== '9' &&
    firstThree !== 666 &&
    firstThree !== 0 &&
    !KNOWN_INVALID_SSNS.includes(value)
  );
};

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
          return !KNOWN_INVALID_SSNS.includes(data.value);
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
    }, i18n.t('onboarding-old:fields.controllerIds.validation.uniqueTypes')),
  });
};

export const refineIndividualIdentityFormSchema = (
  schema: z.ZodObject<Record<string, z.ZodType<any>>>
) => {
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

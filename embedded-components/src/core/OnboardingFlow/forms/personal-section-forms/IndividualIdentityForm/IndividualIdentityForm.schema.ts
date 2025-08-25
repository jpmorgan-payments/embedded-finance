import { i18n } from '@/i18n/config';
import { z } from 'zod';

import { useGetValidationMessage } from '@/core/OnboardingFlow/utils/formUtils';

const MIN_AGE = 18;
const MAX_AGE = 120;

// Helper function to check if ITIN has restricted ranges in positions 2-3
const hasRestrictedRanges = (value: string): boolean => {
  const secondThirdDigits = value.slice(1, 3);
  const secondThirdNum = parseInt(secondThirdDigits, 10);

  return (
    (secondThirdNum >= 50 && secondThirdNum <= 65) ||
    (secondThirdNum >= 70 && secondThirdNum <= 88) ||
    (secondThirdNum >= 90 && secondThirdNum <= 92) ||
    (secondThirdNum >= 94 && secondThirdNum <= 99)
  );
};

const isValidSsn = (value: string): boolean => {
  const firstThree = parseInt(value.slice(0, 3), 10);
  return !!(
    value.length === 9 &&
    value.match(/^[0-8]{1}[0-9]{2}[0-9]{2}[0-9]{4}/) &&
    firstThree !== 666 &&
    firstThree !== 0 &&
    ![
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
    ].includes(value)
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
      idType: z.enum([
        'SSN',
        'ITIN',
        'NATIONAL_ID',
        'DRIVERS_LICENSE',
        'PASSPORT',
        'SOCIAL_INSURANCE_NUMBER',
        'OTHER_GOVERNMENT_ID',
      ]),
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
        switch (data.idType) {
          case 'SSN': {
            return isValidSsn(data.value);
          }
          case 'ITIN': {
            // Basic ITIN format check
            return data.value.startsWith('9') && data.value.length === 9;
          }
          default:
            return true;
        }
      },
      (data) => ({
        message: v('controllerIds.value', `${data.idType.toLowerCase()}Format`),
        path: ['value'],
      })
    )
    .refine(
      (data) => {
        if (
          data.idType === 'ITIN' &&
          data.value.startsWith('9') &&
          data.value.length === 9
        ) {
          // Return true if it doesn't have restricted ranges
          return !hasRestrictedRanges(data.value);
        }
        return true;
      },
      () => ({
        message: v('controllerIds.value', 'itinRestrictedRange'),
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
        (val) => !Number.isNaN(new Date(val).getTime()),
        v('birthDate', 'invalid')
      )
      .refine(
        (val) => {
          const date = new Date(val);
          return date <= new Date();
        },
        v('birthDate', 'future')
      )
      .refine(
        (val) => {
          const birthDate = new Date(val);
          const now = new Date();
          const age = now.getFullYear() - birthDate.getFullYear();
          return age >= MIN_AGE;
        },
        v('birthDate', 'tooYoung')
      )
      .refine(
        (val) => {
          const birthDate = new Date(val);
          const now = new Date();
          const age = now.getFullYear() - birthDate.getFullYear();
          return age <= MAX_AGE;
        },
        v('birthDate', 'tooOld')
      ),
    countryOfResidence: z
      .string()
      .min(1, v('countryOfResidence', 'required'))
      .length(2, v('countryOfResidence', 'exactlyTwoChars'))
      .refine((val) => val === 'US', v('countryOfResidence', 'onlyUS')),
    solePropSsn: z
      .string()
      .min(1, v('solePropSsn', 'required'))
      .refine((val) => isValidSsn(val), v('solePropSsn', 'format')),
    controllerIds: z.array(createControllerIdSchema(v)).refine((ids) => {
      const types = ids?.map((id) => id.idType);
      return new Set(types).size === types?.length;
    }, i18n.t('onboarding:fields.controllerIds.validation.uniqueTypes')),
  });
};

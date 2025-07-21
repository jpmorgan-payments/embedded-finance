import { i18n } from '@/i18n/config';
import { z } from 'zod';

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

const controllerIdSchema = z
  .object({
    description: z.string().optional(),
    expiryDate: z
      .string()
      .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: i18n.t(
          'onboarding-overview:fields.controllerIds.expiryDate.validation.format'
        ),
      })
      .refine((val) => !Number.isNaN(new Date(val).getTime()), {
        message: i18n.t(
          'onboarding-overview:fields.controllerIds.expiryDate.validation.invalid'
        ),
      })
      .refine(
        (val) => {
          const date = new Date(val);
          const now = new Date();
          return date > now;
        },
        {
          message: i18n.t(
            'onboarding-overview:fields.controllerIds.expiryDate.validation.past'
          ),
        }
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
        {
          message: i18n.t(
            'onboarding-overview:fields.controllerIds.expiryDate.validation.tooFar'
          ),
        }
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
      .length(
        2,
        i18n.t(
          'onboarding-overview:fields.controllerIds.issuer.validation.exactlyTwoChars'
        )
      ),
    value: z
      .string()
      .min(
        1,
        i18n.t(
          'onboarding-overview:fields.controllerIds.value.validation.required'
        )
      )
      .refine((val: string) => !/\s/.test(val), {
        message: i18n.t(
          'onboarding-overview:fields.controllerIds.value.validation.noSpaces'
        ),
      }),
  })
  .refine(
    (data) => {
      switch (data.idType) {
        case 'SSN': {
          const firstThree = parseInt(data.value.slice(0, 3), 10);
          return (
            data.value.length === 9 &&
            data.value.match(/^[0-8]{1}[0-9]{2}[0-9]{2}[0-9]{4}/) &&
            firstThree !== 666 &&
            firstThree !== 0 &&
            ![
              '078051120',
              '219099999',
              '123456789',
              '333333333',
              '111111111',
              '457555462',
              '012345678',
              '987654321',
            ].includes(data.value)
          );
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
      message: i18n.t(
        `onboarding-overview:fields.controllerIds.value.validation.${data.idType.toLowerCase()}Format`
      ),
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
      message: i18n.t(
        'onboarding-overview:fields.controllerIds.value.validation.itinRestrictedRange'
      ),
      path: ['value'],
    })
  );

export const IndividualIdentityFormSchema = z.object({
  birthDate: z
    .string()
    .refine(
      (val) => /^\d{4}-\d{2}-\d{2}$/.test(val),
      i18n.t('onboarding-overview:fields.birthDate.validation.format')
    )
    .refine(
      (val) => !Number.isNaN(new Date(val).getTime()),
      i18n.t('onboarding-overview:fields.birthDate.validation.invalid')
    )
    .refine((val) => {
      const date = new Date(val);
      return date <= new Date();
    }, i18n.t('onboarding-overview:fields.birthDate.validation.future'))
    .refine((val) => {
      const birthDate = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();
      return age >= MIN_AGE;
    }, i18n.t('onboarding-overview:fields.birthDate.validation.tooYoung'))
    .refine((val) => {
      const birthDate = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();
      return age <= MAX_AGE;
    }, i18n.t('onboarding-overview:fields.birthDate.validation.tooOld')),
  countryOfResidence: z
    .string()
    .length(
      2,
      i18n.t(
        'onboarding-overview:fields.countryOfResidence.validation.exactlyTwoChars'
      )
    )
    .refine((val) => val === 'US', {
      message: 'Only US is supported at this time.',
    }),
  controllerIds: z.array(controllerIdSchema).refine((ids) => {
    const types = ids.map((id) => id.idType);
    return new Set(types).size === types.length;
  }, i18n.t('onboarding-overview:fields.controllerIds.validation.uniqueTypes')),
});

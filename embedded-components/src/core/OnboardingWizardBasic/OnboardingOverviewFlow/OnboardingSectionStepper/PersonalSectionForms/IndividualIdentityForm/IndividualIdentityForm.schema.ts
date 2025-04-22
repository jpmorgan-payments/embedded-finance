import { i18n } from '@/i18n/config';
import { z } from 'zod';

import { controllerIdSchema } from '@/core/OnboardingWizardBasic/ControllerStepForm/ControllerStepForm.schema';

const MIN_AGE = 18;
const MAX_AGE = 120;

export const IndividualIdentityFormSchema = z.object({
  birthDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      i18n.t('onboarding:fields.birthDate.validation.format')
    )
    .refine(
      (val) => !Number.isNaN(new Date(val).getTime()),
      i18n.t('onboarding:fields.birthDate.validation.invalid')
    )
    .refine((val) => {
      const date = new Date(val);
      return date <= new Date();
    }, i18n.t('onboarding:fields.birthDate.validation.future'))
    .refine((val) => {
      const birthDate = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();
      return age >= MIN_AGE;
    }, i18n.t('onboarding:fields.birthDate.validation.tooYoung'))
    .refine((val) => {
      const birthDate = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();
      return age <= MAX_AGE;
    }, i18n.t('onboarding:fields.birthDate.validation.tooOld')),
  countryOfResidence: z
    .string()
    .length(
      2,
      i18n.t('onboarding:fields.countryOfResidence.validation.exactlyTwoChars')
    )
    .refine((val) => val === 'US', {
      message: 'Only US is supported at this time.',
    }),
  controllerIds: z.array(controllerIdSchema).refine((ids) => {
    const types = ids.map((id) => id.idType);
    return new Set(types).size === types.length;
  }, i18n.t('onboarding:fields.controllerIds.validation.uniqueTypes')),
});

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

/**
 * Hook to get the MicrodepositsForm validation schema with i18n support
 */
export const useMicrodepositsFormSchema = () => {
  const { t } = useTranslation('linked-accounts');

  const MicrodepositsFormSchema = z.object({
    amount1: z.coerce
      .number({
        required_error: t('forms.microdeposits.amount1.validation.required'),
        invalid_type_error: t('forms.microdeposits.amount1.validation.invalid'),
      })
      .min(0.01, t('forms.microdeposits.amount1.validation.min'))
      .max(0.99, t('forms.microdeposits.amount1.validation.max'))
      .refine(
        (val) => {
          const decimalPart = val.toString().split('.')[1];
          return !decimalPart || decimalPart.length <= 2;
        },
        { message: t('forms.microdeposits.amount1.validation.decimals') }
      ),
    amount2: z.coerce
      .number({
        required_error: t('forms.microdeposits.amount2.validation.required'),
        invalid_type_error: t('forms.microdeposits.amount2.validation.invalid'),
      })
      .min(0.01, t('forms.microdeposits.amount2.validation.min'))
      .max(0.99, t('forms.microdeposits.amount2.validation.max'))
      .refine(
        (val) => {
          const decimalPart = val.toString().split('.')[1];
          return !decimalPart || decimalPart.length <= 2;
        },
        { message: t('forms.microdeposits.amount2.validation.decimals') }
      ),
  });

  return MicrodepositsFormSchema;
};

export type MicrodepositsFormDataType = z.infer<
  ReturnType<typeof useMicrodepositsFormSchema>
>;

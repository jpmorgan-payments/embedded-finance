import { useTranslationWithTokens } from '@/hooks';
import { z } from 'zod';

/**
 * Hook to get the MicrodepositsForm validation schema with i18n support
 */
export const useMicrodepositsFormSchema = () => {
  const { tString } = useTranslationWithTokens('linked-accounts');

  const MicrodepositsFormSchema = z.object({
    amount1: z.coerce
      .number({
        required_error: tString(
          'forms.microdeposits.amount1.validation.required'
        ),
        invalid_type_error: tString(
          'forms.microdeposits.amount1.validation.invalid'
        ),
      })
      .min(0.01, tString('forms.microdeposits.amount1.validation.min'))
      .max(0.99, tString('forms.microdeposits.amount1.validation.max'))
      .refine(
        (val) => {
          const decimalPart = val.toString().split('.')[1];
          return !decimalPart || decimalPart.length <= 2;
        },
        { message: tString('forms.microdeposits.amount1.validation.decimals') }
      ),
    amount2: z.coerce
      .number({
        required_error: tString(
          'forms.microdeposits.amount2.validation.required'
        ),
        invalid_type_error: tString(
          'forms.microdeposits.amount2.validation.invalid'
        ),
      })
      .min(0.01, tString('forms.microdeposits.amount2.validation.min'))
      .max(0.99, tString('forms.microdeposits.amount2.validation.max'))
      .refine(
        (val) => {
          const decimalPart = val.toString().split('.')[1];
          return !decimalPart || decimalPart.length <= 2;
        },
        { message: tString('forms.microdeposits.amount2.validation.decimals') }
      ),
  });

  return MicrodepositsFormSchema;
};

export type MicrodepositsFormDataType = z.infer<
  ReturnType<typeof useMicrodepositsFormSchema>
>;

import { z } from 'zod';

export const MicrodepositsFormSchema = z.object({
  amount1: z.coerce
    .number({
      required_error: 'First deposit amount is required',
      invalid_type_error: 'Please enter a valid amount',
    })
    .min(0.01, 'Amount must be at least $0.01')
    .max(0.99, 'Amount must be less than $1.00')
    .refine(
      (val) => {
        const decimalPart = val.toString().split('.')[1];
        return !decimalPart || decimalPart.length <= 2;
      },
      { message: 'Amount must have at most 2 decimal places' }
    ),
  amount2: z.coerce
    .number({
      required_error: 'Second deposit amount is required',
      invalid_type_error: 'Please enter a valid amount',
    })
    .min(0.01, 'Amount must be at least $0.01')
    .max(0.99, 'Amount must be less than $1.00')
    .refine(
      (val) => {
        const decimalPart = val.toString().split('.')[1];
        return !decimalPart || decimalPart.length <= 2;
      },
      { message: 'Amount must have at most 2 decimal places' }
    ),
});

export type MicrodepositsFormDataType = z.infer<typeof MicrodepositsFormSchema>;

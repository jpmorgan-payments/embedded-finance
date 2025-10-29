import { z } from 'zod';

export const MicrodepositsFormSchema = z.object({
  amount1: z
    .number({
      required_error: 'First deposit amount is required',
      invalid_type_error: 'Please enter a valid amount',
    })
    .min(0.01, 'Amount must be at least $0.01')
    .max(0.99, 'Amount must be less than $1.00'),
  amount2: z
    .number({
      required_error: 'Second deposit amount is required',
      invalid_type_error: 'Please enter a valid amount',
    })
    .min(0.01, 'Amount must be at least $0.01')
    .max(0.99, 'Amount must be less than $1.00'),
});

export type MicrodepositsFormDataType = z.infer<typeof MicrodepositsFormSchema>;

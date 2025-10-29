import { z } from 'zod';

export const MicrodepositsFormSchema = z.object({
  amount1: z.coerce.number().min(0.01, 'Amount must be at least 0.01'),
  amount2: z.coerce.number().min(0.01, 'Amount must be at least 0.01'),
});

export type MicrodepositsFormDataType = z.infer<typeof MicrodepositsFormSchema>;

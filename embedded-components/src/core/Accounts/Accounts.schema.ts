import { z } from 'zod';

export const accountsPropsSchema = z.object({
  allowedCategories: z.array(z.string()),
  clientId: z.string().optional(),
});

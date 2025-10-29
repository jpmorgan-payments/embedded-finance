import { z } from 'zod';

const baseSchema = z.object({
  routingNumber: z
    .string()
    .min(9, 'Routing number must be 9 digits')
    .max(9, 'Routing number must be 9 digits'),
  accountNumber: z.string().min(1, 'Account number is required'),
  certify: z
    .boolean()
    .default(false)
    .refine((val) => val === true, {
      message: 'Please authorize to continue',
    }),
});

export const LinkAccountFormSchema = z.discriminatedUnion('accountType', [
  z
    .object({
      accountType: z.literal('INDIVIDUAL'),
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
    })
    .merge(baseSchema),
  z
    .object({
      accountType: z.literal('ORGANIZATION'),
      businessName: z.string().min(1, 'Business name is required'),
    })
    .merge(baseSchema),
]);

export type LinkAccountFormDataType = z.infer<typeof LinkAccountFormSchema>;

import { z } from 'zod';

/**
 * Payment types supported for linked accounts
 */
export const PaymentTypeSchema = z.enum(['ACH', 'WIRE', 'RTP']);

/**
 * Account types for checking/savings
 */
export const BankAccountTypeSchema = z.enum(['CHECKING', 'SAVINGS']);

/**
 * Account holder type
 */
export const AccountHolderTypeSchema = z.enum(['INDIVIDUAL', 'ORGANIZATION']);

/**
 * Address schema for Wire/RTP transfers
 * Wire and RTP require: full address information
 */
const addressSchema = z.object({
  addressLine1: z.string().min(1, 'Street address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z
    .string()
    .min(2, 'State is required')
    .max(2, 'Use 2-letter state code'),
  postalCode: z
    .string()
    .min(5, 'ZIP code must be at least 5 digits')
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  countryCode: z.string().default('US'),
});

/**
 * Main schema for linking a bank account
 * Simplified to work properly with discriminated unions
 */
export const LinkAccountFormSchema = z
  .object({
    // Account holder information
    accountType: AccountHolderTypeSchema,
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    businessName: z.string().optional(),

    // Bank account details (required for all types)
    routingNumber: z
      .string()
      .min(9, 'Routing number must be 9 digits')
      .max(9, 'Routing number must be 9 digits')
      .regex(/^\d+$/, 'Routing number must contain only digits'),
    accountNumber: z
      .string()
      .min(1, 'Account number is required')
      .regex(/^\d+$/, 'Account number must contain only digits'),
    bankAccountType: BankAccountTypeSchema,

    // Payment methods
    paymentTypes: z
      .array(PaymentTypeSchema)
      .min(1, 'Select at least one payment type'),

    // Address (conditionally required)
    address: addressSchema.optional(),

    // Certification
    certify: z
      .boolean()
      .default(false)
      .refine((val) => val === true, {
        message: 'You must authorize verification to continue',
      }),
  })
  .superRefine((data, ctx) => {
    // Validate based on account type
    if (data.accountType === 'INDIVIDUAL') {
      if (!data.firstName || data.firstName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'First name is required',
          path: ['firstName'],
        });
      }
      if (!data.lastName || data.lastName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Last name is required',
          path: ['lastName'],
        });
      }
    } else if (data.accountType === 'ORGANIZATION') {
      if (!data.businessName || data.businessName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Business name is required',
          path: ['businessName'],
        });
      }
    }

    // If Wire or RTP is selected, address is required
    const needsAddress =
      data.paymentTypes.includes('WIRE') || data.paymentTypes.includes('RTP');

    if (needsAddress && !data.address) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Address is required for Wire or RTP payment methods',
        path: ['address'],
      });
    }
  });

export type LinkAccountFormDataType = z.infer<typeof LinkAccountFormSchema>;

import { z } from 'zod';

import type {
  BankAccountFormConfig,
  BankAccountFormData,
  ContactType,
  PaymentMethodType,
} from './BankAccountForm.types';

/**
 * Contact validation schemas
 */
const phoneContactSchema = z.object({
  contactType: z.literal('PHONE'),
  value: z
    .string()
    .min(1, 'Phone number is required')
    .max(2048, 'Phone number is too long'),
  countryCode: z.string().optional(),
});

const emailContactSchema = z.object({
  contactType: z.literal('EMAIL'),
  value: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(2048, 'Email is too long'),
  countryCode: z.string().optional(),
});

const websiteContactSchema = z.object({
  contactType: z.literal('WEBSITE'),
  value: z
    .string()
    .min(1, 'Website is required')
    .url('Invalid website URL')
    .max(2048, 'Website URL is too long'),
  countryCode: z.string().optional(),
});

const contactSchema = z.discriminatedUnion('contactType', [
  phoneContactSchema,
  emailContactSchema,
  websiteContactSchema,
]);

/**
 * Address schema
 */
const addressSchema = z.object({
  primaryAddressLine: z.string().min(1, 'Street address is required').max(34),
  secondaryAddressLine: z.string().max(34).optional(),
  tertiaryAddressLine: z.string().max(34).optional(),
  city: z.string().min(1, 'City is required').max(34),
  state: z
    .string()
    .min(2, 'State is required')
    .max(2, 'Use 2-letter state code')
    .regex(/^[A-Z]{2}$/, 'State must be a 2-letter code'),
  postalCode: z
    .string()
    .min(5, 'ZIP code must be at least 5 digits')
    .max(10)
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  countryCode: z.string().default('US'),
});

/**
 * Payment method routing number schema
 */
const paymentMethodRoutingNumberSchema = z.object({
  paymentType: z.enum(['ACH', 'WIRE', 'RTP']),
  routingNumber: z
    .string()
    .min(9, 'Routing number must be 9 digits')
    .max(9, 'Routing number must be 9 digits')
    .regex(/^\d{9}$/, 'Routing number must be 9 digits'),
});

/**
 * Base schema with all possible fields
 */
const createBaseSchema = (config: BankAccountFormConfig) => {
  return z.object({
    // Account holder information
    accountType: z.enum(['INDIVIDUAL', 'ORGANIZATION']),
    firstName: z.string().max(70),
    lastName: z.string().max(70),
    businessName: z.string().max(140),

    // Bank account details
    routingNumbers: z
      .array(paymentMethodRoutingNumberSchema)
      .min(1, 'Routing numbers are required'),
    useSameRoutingNumber: z.boolean().optional(),
    accountNumber: z.string(),
    bankAccountType: z.enum(['CHECKING', 'SAVINGS']).optional(),

    // Payment methods
    paymentTypes: z
      .array(z.enum(['ACH', 'WIRE', 'RTP']))
      .min(1, 'Select at least one payment type'),

    // Address (conditional)
    address: addressSchema.optional(),

    // Contacts (conditional)
    contacts: z.array(contactSchema).optional(),

    // Certification (conditional)
    certify: config.requiredFields.certification
      ? z.boolean().refine((val) => val === true, {
          message: 'You must authorize verification to continue',
        })
      : z.boolean().optional(),
  });
};

/**
 * Helper to determine if address is required for selected payment methods
 */
function isAddressRequired(
  config: BankAccountFormConfig,
  paymentTypes: PaymentMethodType[]
): boolean {
  // Check global requirements
  if (config.requiredFields.address) {
    return true;
  }

  // Check per-payment-method requirements
  return paymentTypes.some((type) => {
    const methodConfig = config.paymentMethods.configs[type];
    return methodConfig?.enabled && methodConfig.requiredFields.address;
  });
}

/**
 * Helper to get required contact types for selected payment methods
 */
function getRequiredContactTypes(
  config: BankAccountFormConfig,
  paymentTypes: PaymentMethodType[]
): Set<ContactType> {
  const required = new Set<ContactType>();

  // Add global requirements
  config.requiredFields.contacts?.forEach((type) => required.add(type));

  // Add per-payment-method requirements
  paymentTypes.forEach((type) => {
    const methodConfig = config.paymentMethods.configs[type];
    if (methodConfig?.enabled && methodConfig.requiredFields.contacts) {
      methodConfig.requiredFields.contacts.forEach((contactType) =>
        required.add(contactType)
      );
    }
  });

  return required;
}

/**
 * Create dynamic schema with configuration-based validation
 */
export function createBankAccountFormSchema(
  config: BankAccountFormConfig
): z.ZodType<BankAccountFormData> {
  const baseSchema = createBaseSchema(config);

  return baseSchema.superRefine((data, ctx) => {
    const { accountType, paymentTypes = [] } = data;

    // 1. Validate account holder information based on type
    // These fields are ALWAYS required regardless of payment methods
    if (accountType === 'INDIVIDUAL') {
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
    } else if (accountType === 'ORGANIZATION') {
      if (!data.businessName || data.businessName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Business name is required',
          path: ['businessName'],
        });
      }
    }

    // 2. Validate bank account details based on selected payment methods
    const selectedMethods = paymentTypes as PaymentMethodType[];

    // Check if account number is required
    const accountNumberRequired = selectedMethods.some((method) => {
      const methodConfig = config.paymentMethods.configs[method];
      return methodConfig?.enabled && methodConfig.requiredFields.accountNumber;
    });

    if (accountNumberRequired) {
      if (!data.accountNumber || data.accountNumber.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Account number is required',
          path: ['accountNumber'],
        });
      } else if (!/^\d+$/.test(data.accountNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Account number must contain only digits',
          path: ['accountNumber'],
        });
      }
    }

    // Check if bank account type is required
    const accountTypeRequired = selectedMethods.some((method) => {
      const methodConfig = config.paymentMethods.configs[method];
      return (
        methodConfig?.enabled && methodConfig.requiredFields.bankAccountType
      );
    });

    if (accountTypeRequired && !data.bankAccountType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Account type is required',
        path: ['bankAccountType'],
      });
    }

    // 3. Validate routing numbers for each selected payment method
    selectedMethods.forEach((method) => {
      const methodConfig = config.paymentMethods.configs[method];

      if (methodConfig?.enabled && methodConfig.requiredFields.routingNumber) {
        const routingEntry = data.routingNumbers?.find(
          (r) => r.paymentType === method
        );

        if (!routingEntry || !routingEntry.routingNumber.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Routing number is required for ${methodConfig.label}`,
            path: ['routingNumbers'],
          });
        } else if (methodConfig.routingValidation) {
          const { pattern, errorMessage } = methodConfig.routingValidation;
          if (!pattern.test(routingEntry.routingNumber)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: errorMessage,
              path: ['routingNumbers'],
            });
          }
        }
      }
    });

    // 4. Validate address if required
    if (isAddressRequired(config, selectedMethods)) {
      if (!data.address) {
        const methodsRequiringAddress = selectedMethods.filter(
          (method) =>
            config.paymentMethods.configs[method]?.requiredFields.address
        );
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Address is required for ${methodsRequiringAddress.map((m) => config.paymentMethods.configs[m].label).join(', ')}`,
          path: ['address'],
        });
      }
    }

    // 5. Validate contacts if required
    const requiredContactTypes = getRequiredContactTypes(
      config,
      selectedMethods
    );

    if (requiredContactTypes.size > 0) {
      const contacts = data.contacts || [];

      requiredContactTypes.forEach((contactType) => {
        const hasContact = contacts.some(
          (contact) =>
            contact.contactType === contactType &&
            contact.value &&
            contact.value.trim().length > 0
        );

        if (!hasContact) {
          const methodsRequiringContact = selectedMethods.filter((method) =>
            config.paymentMethods.configs[
              method
            ]?.requiredFields.contacts?.includes(contactType)
          );

          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${contactType.toLowerCase()} contact is required for ${methodsRequiringContact.map((m) => config.paymentMethods.configs[m].label).join(', ')}`,
            path: ['contacts'],
          });
        }
      });
    }

    // 6. Validate locked payment methods (for linked accounts)
    selectedMethods.forEach((method) => {
      const methodConfig = config.paymentMethods.configs[method];
      if (methodConfig?.locked && !paymentTypes.includes(method)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${methodConfig.label} is required and cannot be deselected`,
          path: ['paymentTypes'],
        });
      }
    });
  }) as z.ZodType<BankAccountFormData>;
}

/**
 * Type inference helper
 */
export type BankAccountFormSchemaType = ReturnType<
  typeof createBankAccountFormSchema
>;

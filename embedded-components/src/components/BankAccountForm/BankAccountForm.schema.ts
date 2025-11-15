import { z } from 'zod';

import { RoutingInformationTransactionType } from '@/api/generated/ep-recipients.schemas';

import type {
  BankAccountFormConfig,
  BankAccountFormData,
} from './BankAccountForm.types';

/**
 * Address schema - All fields optional in base schema, validation in superRefine
 */
const addressSchema = z.object({
  addressLine1: z.string().max(34).optional(),
  addressLine2: z.string().max(34).optional(),
  addressLine3: z.string().max(34).optional(),
  city: z.string().max(34).optional(),
  state: z.string().max(2).optional(),
  postalCode: z.string().max(10).optional(),
  countryCode: z.string().default('US'),
});

/**
 * Payment method routing number schema - Validation moved to superRefine
 */
const paymentMethodRoutingNumberSchema = z.object({
  paymentType: z.enum(['ACH', 'WIRE', 'RTP']),
  routingNumber: z.string(),
});

/**
 * Contact information schema
 */
const contactSchema = z.object({
  contactType: z.enum(['EMAIL', 'PHONE', 'WEBSITE']),
  value: z.string(),
  countryCode: z.string().optional(),
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
    routingNumbers: z.array(paymentMethodRoutingNumberSchema).optional(),
    useSameRoutingNumber: z.boolean().optional(),
    accountNumber: z.string(),
    bankAccountType: z.enum(['CHECKING', 'SAVINGS']).optional(),

    // Payment methods
    paymentTypes: z
      .array(z.enum(['ACH', 'WIRE', 'RTP']))
      .min(1, 'Select at least one payment type'),

    // Address (conditional)
    address: addressSchema.optional(),

    // Contact information (array of contacts)
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
  paymentTypes: RoutingInformationTransactionType[]
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
  paymentTypes: RoutingInformationTransactionType[]
): Set<'EMAIL' | 'PHONE' | 'WEBSITE'> {
  const required = new Set<'EMAIL' | 'PHONE' | 'WEBSITE'>();

  // Add global requirements
  config.requiredFields.contacts?.forEach((type) => required.add(type));

  // Add per-payment-method requirements
  paymentTypes.forEach((type) => {
    const methodConfig = config.paymentMethods.configs[type];
    methodConfig?.requiredFields.contacts?.forEach((contactType) =>
      required.add(contactType)
    );
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

    // 2. Validate bank account details
    // Account number is ALWAYS required for bank accounts
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

    // Bank account type is ALWAYS required
    if (!data.bankAccountType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Account type is required',
        path: ['bankAccountType'],
      });
    }

    // 3. Validate routing numbers for each selected payment method
    const selectedMethods = paymentTypes as RoutingInformationTransactionType[];

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
        } else {
          // Validate routing number format (always 9 digits)
          if (!/^\d{9}$/.test(routingEntry.routingNumber)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Routing number must be 9 digits',
              path: ['routingNumbers'],
            });
          }

          // Additional payment-method-specific validation if configured
          if (methodConfig.routingValidation) {
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
      } else {
        // Validate address fields
        if (
          !data.address.addressLine1 ||
          data.address.addressLine1.trim().length === 0
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Street address is required',
            path: ['address', 'addressLine1'],
          });
        }

        if (!data.address.city || data.address.city.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'City is required',
            path: ['address', 'city'],
          });
        }

        if (!data.address.state || data.address.state.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'State is required',
            path: ['address', 'state'],
          });
        } else if (!/^[A-Z]{2}$/.test(data.address.state)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'State must be a 2-letter code',
            path: ['address', 'state'],
          });
        }

        if (
          !data.address.postalCode ||
          data.address.postalCode.trim().length === 0
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'ZIP code is required',
            path: ['address', 'postalCode'],
          });
        } else if (!/^\d{5}(-\d{4})?$/.test(data.address.postalCode)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid ZIP code format',
            path: ['address', 'postalCode'],
          });
        }
      }
    }

    // 5. Validate contact fields if required
    const requiredContactTypes = getRequiredContactTypes(
      config,
      selectedMethods
    );

    requiredContactTypes.forEach((contactType) => {
      const contact = data.contacts?.find((c) => c.contactType === contactType);

      if (!contact || !contact.value.trim()) {
        const methodsRequiringContact = selectedMethods.filter((method) =>
          config.paymentMethods.configs[
            method
          ]?.requiredFields.contacts?.includes(contactType)
        );

        const methodLabels = methodsRequiringContact
          .map((m) => config.paymentMethods.configs[m].label)
          .join(', ');

        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: methodLabels
            ? `${contactType.charAt(0) + contactType.slice(1).toLowerCase()} is required for ${methodLabels}`
            : `${contactType.charAt(0) + contactType.slice(1).toLowerCase()} is required`,
          path: ['contacts'],
        });
      }
    });

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

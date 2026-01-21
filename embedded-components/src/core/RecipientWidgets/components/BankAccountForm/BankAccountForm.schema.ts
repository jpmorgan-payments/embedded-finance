import i18n from 'i18next';
import { z } from 'zod';

import { RoutingInformationTransactionType } from '@/api/generated/ep-recipients.schemas';

import type {
  BankAccountFormConfig,
  BankAccountFormData,
} from './BankAccountForm.types';

/**
 * Type for the validation message getter function
 */
export type ValidationGetter = (
  key: string,
  interpolation?: Record<string, string | number>
) => string;

/**
 * Hook to get validation messages from i18n
 * Similar to useGetValidationMessage from OnboardingFlow
 */
export const useGetBankAccountValidationMessage = (): ValidationGetter => {
  return (
    key: string,
    interpolation?: Record<string, string | number>
  ): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return i18n.t(`bank-account-form:${key}` as any, interpolation as any);
  };
};

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
 * @param v - Validation message getter function
 */
const createBaseSchema = (
  config: BankAccountFormConfig,
  v: (key: string, interpolation?: Record<string, string | number>) => string
) => {
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
      .min(1, v('paymentMethods.validation.minOne')),

    // Address (conditional)
    address: addressSchema.optional(),

    // Contact information (array of contacts)
    contacts: z.array(contactSchema).optional(),

    // Certification (conditional)
    certify: config.requiredFields.certification
      ? z.boolean().refine((val) => val === true, {
          message: v('certification.validation.required'),
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
 * @param config - Form configuration
 * @param v - Validation message getter function from i18n
 */
export function createBankAccountFormSchema(
  config: BankAccountFormConfig,
  v: (key: string, interpolation?: Record<string, string | number>) => string
): z.ZodType<BankAccountFormData> {
  const baseSchema = createBaseSchema(config, v);

  return baseSchema.superRefine((data, ctx) => {
    const { accountType, paymentTypes = [] } = data;

    // 1. Validate account holder information based on type
    // These fields are ALWAYS required regardless of payment methods
    if (accountType === 'INDIVIDUAL') {
      if (!data.firstName || data.firstName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: v('fields.firstName.validation.required'),
          path: ['firstName'],
        });
      }
      if (!data.lastName || data.lastName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: v('fields.lastName.validation.required'),
          path: ['lastName'],
        });
      }
    } else if (accountType === 'ORGANIZATION') {
      if (!data.businessName || data.businessName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: v('fields.businessName.validation.required'),
          path: ['businessName'],
        });
      }
    }

    // 2. Validate bank account details
    // Account number is ALWAYS required for bank accounts
    if (!data.accountNumber || data.accountNumber.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: v('fields.accountNumber.validation.required'),
        path: ['accountNumber'],
      });
    } else if (!/^\d+$/.test(data.accountNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: v('fields.accountNumber.validation.digitsOnly'),
        path: ['accountNumber'],
      });
    }

    // Bank account type is ALWAYS required
    if (!data.bankAccountType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: v('fields.accountType.validation.required'),
        path: ['bankAccountType'],
      });
    }

    // 3. Validate routing numbers for each selected payment method
    const selectedMethods = paymentTypes as RoutingInformationTransactionType[];

    selectedMethods.forEach((method, methodIndex) => {
      const methodConfig = config.paymentMethods.configs[method];

      if (methodConfig?.enabled && methodConfig.requiredFields.routingNumber) {
        const routingEntryIndex =
          data.routingNumbers?.findIndex((r) => r.paymentType === method) ?? -1;
        const routingEntry =
          routingEntryIndex >= 0
            ? data.routingNumbers?.[routingEntryIndex]
            : undefined;

        if (!routingEntry || !routingEntry.routingNumber.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: v('routingNumbers.validation.required', {
              method: methodConfig.label,
            }),
            path:
              routingEntryIndex >= 0
                ? ['routingNumbers', routingEntryIndex, 'routingNumber']
                : ['routingNumbers', methodIndex, 'routingNumber'],
          });
        } else {
          // Validate routing number format (always 9 digits)
          if (!/^\d{9}$/.test(routingEntry.routingNumber)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: v('routingNumbers.validation.digits'),
              path: ['routingNumbers', routingEntryIndex, 'routingNumber'],
            });
          }

          // Additional payment-method-specific validation if configured
          if (methodConfig.routingValidation) {
            const { pattern, errorMessage } = methodConfig.routingValidation;
            if (!pattern.test(routingEntry.routingNumber)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: errorMessage,
                path: ['routingNumbers', routingEntryIndex, 'routingNumber'],
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
          message: v('address.validation.required', {
            methods: methodsRequiringAddress
              .map((m) => config.paymentMethods.configs[m].label)
              .join(', '),
          }),
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
            message: v('address.validation.streetAddressRequired'),
            path: ['address', 'addressLine1'],
          });
        }

        if (!data.address.city || data.address.city.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: v('address.validation.cityRequired'),
            path: ['address', 'city'],
          });
        }

        if (!data.address.state || data.address.state.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: v('address.validation.stateRequired'),
            path: ['address', 'state'],
          });
        } else if (!/^[A-Z]{2}$/.test(data.address.state)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: v('address.validation.stateFormat'),
            path: ['address', 'state'],
          });
        }

        if (
          !data.address.postalCode ||
          data.address.postalCode.trim().length === 0
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: v('address.validation.postalCodeRequired'),
            path: ['address', 'postalCode'],
          });
        } else if (!/^\d{5}(-\d{4})?$/.test(data.address.postalCode)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: v('address.validation.postalCodeFormat'),
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

        const formattedContactType =
          contactType.charAt(0) + contactType.slice(1).toLowerCase();

        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: methodLabels
            ? v('contacts.validation.requiredForMethod', {
                contactType: formattedContactType,
                method: methodLabels,
              })
            : v('contacts.validation.required', {
                contactType: formattedContactType,
              }),
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
          message: v('paymentMethods.validation.lockedRequired', {
            method: methodConfig.label,
          }),
          path: ['paymentTypes'],
        });
      }
    });
  }) as z.ZodType<BankAccountFormData>;
}

/**
 * Hook to create the bank account form schema with i18n validation messages
 * Following the pattern from OnboardingFlow schemas
 */
export const useBankAccountFormSchema = () => {
  const v = useGetBankAccountValidationMessage();

  return (config: BankAccountFormConfig) =>
    createBankAccountFormSchema(config, v);
};

/**
 * Type inference helper
 */
export type BankAccountFormSchemaType = ReturnType<
  typeof createBankAccountFormSchema
>;

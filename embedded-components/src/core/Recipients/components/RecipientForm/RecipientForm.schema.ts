import { z } from 'zod';

import type { PartyType } from '@/api/generated/ep-recipients.schemas';

import type {
  PaymentMethodType,
  RecipientsConfig,
} from '../../types/paymentConfig';

// Contact validation schemas based on type
const phoneContactSchema = z.object({
  contactType: z.literal('PHONE'),
  value: z
    .string()
    .max(2048)
    .refine((val) => {
      // Allow empty values (for new contacts)
      if (!val || val.trim() === '') return true;
      // If not empty, validate format
      return /^(.|\s)*\S(.|\s)*$/.test(val);
    }, 'Invalid phone number format'),
  countryCode: z.string().refine((val) => {
    // Allow empty values (for new contacts)
    if (!val || val.trim() === '') return true;
    // If not empty, validate E.164 format
    return /^\+[1-9]\d{0,2}$/.test(val);
  }, 'Country code must be in E.164 format (e.g., +1)'),
});

const emailContactSchema = z.object({
  contactType: z.literal('EMAIL'),
  value: z
    .string()
    .max(2048)
    .refine((val) => {
      // Allow empty values (for new contacts)
      if (!val || val.trim() === '') return true;
      // If not empty, validate email format
      return z.string().email().safeParse(val).success;
    }, 'Please enter a valid email address'),
  countryCode: z.string().optional(), // Not used for email
});

const websiteContactSchema = z.object({
  contactType: z.literal('WEBSITE'),
  value: z
    .string()
    .max(2048)
    .refine((val) => {
      // Allow empty values (for new contacts)
      if (!val || val.trim() === '') return true;
      // If not empty, validate URL format
      return /^https?:\/\//.test(val);
    }, 'Website URL must start with http:// or https://'),
  countryCode: z.string().optional(), // Not used for website
});

// Union type for contact validation
const contactSchema = z.discriminatedUnion('contactType', [
  phoneContactSchema,
  emailContactSchema,
  websiteContactSchema,
]);

// Base schema with all possible fields (optional by default)
const baseRecipientFormSchema = z.object({
  // Basic info
  type: z.enum(['INDIVIDUAL', 'ORGANIZATION']),
  // recipientType: z.enum(['RECIPIENT', 'LINKED_ACCOUNT', 'SETTLEMENT_ACCOUNT']),

  // Individual fields (optional by default)
  firstName: z.string().max(70).optional(),
  lastName: z.string().max(70).optional(),

  // Organization fields (optional by default)
  businessName: z.string().max(140).optional(),

  // Payment methods (always required)
  paymentMethods: z
    .array(z.string())
    .min(1, 'At least one payment method is required'),

  // Account information (optional by default)
  accountType: z.enum(['CHECKING', 'SAVINGS', 'IBAN']).optional(),
  accountNumber: z
    .string()
    .optional()
    .superRefine((value, ctx) => {
      if (!value) return;

      const trimmedValue = value.trim();
      if (!trimmedValue) return;

      const { parent: { accountType } = {} } = ctx as unknown as {
        parent?: { accountType?: string };
      };

      if (accountType === 'IBAN') {
        if (!/^[A-Z0-9]{1,35}$/.test(trimmedValue)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'IBAN must contain only letters and numbers and be 1-35 characters long',
          });
        }
        return;
      }

      if (!/^[0-9]{4,17}$/.test(trimmedValue)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Account number must be 4-17 digits',
        });
      }
    }),
  countryCode: z.enum(['US', 'CA', 'GB', 'EU']).default('US'),
  currencyCode: z
    .string()
    .regex(/^[A-Z]{3}$/, 'Invalid currency code')
    .optional(),
  bankName: z.string().max(140).optional(),

  // Routing numbers (optional by default)
  routingNumbers: z.record(z.string()).optional(),

  // Address fields (optional by default)
  addressLine1: z.string().max(34).optional(),
  addressLine2: z.string().max(34).optional(),
  addressLine3: z.string().max(34).optional(),
  city: z.string().max(34).optional(),
  state: z.string().max(30).optional(),
  postalCode: z.string().max(10).optional(),

  // Contact information with proper validation
  contacts: z.array(contactSchema).optional(),

  // Legacy fields for backward compatibility
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(2048)
    .optional(),
  phone: z.string().max(20).optional(),
});

// Helper function to check if a contact type is required by selected payment methods
function getRequiredContactTypes(
  config: RecipientsConfig,
  selectedPaymentMethods: PaymentMethodType[]
): Set<string> {
  const requiredContactTypes = new Set<string>();

  selectedPaymentMethods.forEach((method) => {
    const methodConfig = config.paymentMethodConfigs?.[method];
    if (!methodConfig?.enabled) return;

    methodConfig.requiredFields.forEach((field) => {
      if (field === 'partyDetails.contacts.EMAIL.value') {
        requiredContactTypes.add('EMAIL');
      }
      if (field === 'partyDetails.contacts.PHONE.value') {
        requiredContactTypes.add('PHONE');
      }
    });
  });

  return requiredContactTypes;
}

// Create dynamic schema with conditional validation
export function createDynamicRecipientFormSchema(config?: RecipientsConfig) {
  return baseRecipientFormSchema.superRefine((data, ctx) => {
    const selectedPaymentMethods = (data.paymentMethods ||
      []) as PaymentMethodType[];
    const partyType = data.type;

    // 1. Party type validation
    if (partyType === 'INDIVIDUAL') {
      if (!data.firstName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'First name is required for individuals',
          path: ['firstName'],
        });
      }
      if (!data.lastName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Last name is required for individuals',
          path: ['lastName'],
        });
      }
    } else if (partyType === 'ORGANIZATION') {
      if (!data.businessName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Business name is required for organizations',
          path: ['businessName'],
        });
      }
    }

    // 2. Payment method based validation
    if (config && selectedPaymentMethods.length > 0) {
      // Collect all required and optional fields from selected payment methods
      const allRequiredFields = new Set<string>();
      const fieldValidations: Record<string, any> = {};

      selectedPaymentMethods.forEach((method) => {
        const methodConfig = config.paymentMethodConfigs?.[method];
        if (!methodConfig?.enabled) return;

        // Collect required fields
        methodConfig.requiredFields.forEach((field) => {
          allRequiredFields.add(field);
        });

        // Collect field validations
        Object.entries(methodConfig.validations || {}).forEach(
          ([field, validation]) => {
            fieldValidations[field] = validation;
          }
        );
      });

      // Apply required field validations
      allRequiredFields.forEach((fieldPath) => {
        const validation = fieldValidations[fieldPath];

        // Map config field paths to form field names
        const fieldMapping: Record<string, string> = {
          'account.type': 'accountType',
          'account.number': 'accountNumber',
          'account.countryCode': 'countryCode',
          'account.bankName': 'bankName',
          'partyDetails.address.addressLine1': 'addressLine1',
          'partyDetails.address.city': 'city',
          'partyDetails.address.state': 'state',
          'partyDetails.address.postalCode': 'postalCode',
        };

        const formFieldName =
          fieldMapping[fieldPath] || fieldPath.split('.').pop() || fieldPath;

        // Skip contact validation here - handled separately below
        if (fieldPath.includes('contacts.')) return;

        // Skip routingNumbers and related fields (handled per-method below)
        if (
          fieldPath.includes('routingNumber') ||
          fieldPath.includes('routingCodeType') ||
          fieldPath.includes('name')
        ) {
          return;
        }

        const fieldValue = data[formFieldName as keyof typeof data];

        // Determine which payment methods require this field
        const methodsRequiringField = selectedPaymentMethods.filter(
          (method) => {
            const methodConfig = config.paymentMethodConfigs?.[method];
            return (
              methodConfig?.enabled &&
              methodConfig.requiredFields.includes(fieldPath)
            );
          }
        );

        // Check if required field is missing
        if (
          !fieldValue ||
          (typeof fieldValue === 'string' && fieldValue.trim() === '')
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${formFieldName} is required for ${methodsRequiringField.join(', ')}`,
            path: [formFieldName],
          });
        }

        // Apply specific validation rules
        if (fieldValue && validation) {
          if (validation.pattern && typeof fieldValue === 'string') {
            if (!validation.pattern.test(fieldValue)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: validation.errorMessage || `Invalid ${formFieldName}`,
                path: [formFieldName],
              });
            }
          }

          if (validation.maxLength && typeof fieldValue === 'string') {
            if (fieldValue.length > validation.maxLength) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `${formFieldName} must be at most ${validation.maxLength} characters`,
                path: [formFieldName],
              });
            }
          }

          if (validation.minLength && typeof fieldValue === 'string') {
            if (fieldValue.length < validation.minLength) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `${formFieldName} must be at least ${validation.minLength} characters`,
                path: [formFieldName],
              });
            }
          }

          if (validation.customValidator) {
            const result = validation.customValidator(fieldValue, data);
            if (result !== true) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                  typeof result === 'string'
                    ? result
                    : validation.errorMessage || `Invalid ${formFieldName}`,
                path: [formFieldName],
              });
            }
          }
        }
      });

      // 3. Contact validation based on payment method requirements
      const requiredContactTypes = getRequiredContactTypes(
        config,
        selectedPaymentMethods
      );
      const contacts = data.contacts || [];

      // Check if required contact types are present
      requiredContactTypes.forEach((contactType) => {
        const hasContact = contacts.some(
          (contact) =>
            contact.contactType === contactType && contact.value?.trim()
        );

        if (!hasContact) {
          const paymentMethodsRequiringContact = selectedPaymentMethods.filter(
            (method) => {
              const methodConfig = config.paymentMethodConfigs?.[method];
              return methodConfig?.requiredFields.includes(
                `partyDetails.contacts.${contactType}.value`
              );
            }
          );

          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${contactType.toLowerCase()} contact is required for ${paymentMethodsRequiringContact.join(', ')}`,
            path: ['contacts'],
          });
        }
      });

      // 4. Routing numbers validation
      selectedPaymentMethods.forEach((method) => {
        const methodConfig = config.paymentMethodConfigs?.[method];
        if (!methodConfig?.enabled) return;

        const routingNumber = data.routingNumbers?.[method];

        if (!routingNumber) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${methodConfig.routingConfig?.routingNumberLabel || 'Routing number'} is required for ${method}`,
            path: ['routingNumbers', method],
          });
        } else if (methodConfig.routingConfig) {
          const { routingNumberPattern, routingNumberLength } =
            methodConfig.routingConfig;

          if (
            routingNumberPattern &&
            !routingNumberPattern.test(routingNumber)
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Invalid ${methodConfig.routingConfig.routingNumberLabel || 'routing number'} for ${method}`,
              path: ['routingNumbers', method],
            });
          }

          if (
            routingNumberLength &&
            routingNumber.length !== routingNumberLength
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `${methodConfig.routingConfig.routingNumberLabel || 'Routing number'} must be exactly ${routingNumberLength} characters for ${method}`,
              path: ['routingNumbers', method],
            });
          }
        }
      });
    }
  });
}

// Default schema without config (for backward compatibility)
export const recipientFormSchema = createDynamicRecipientFormSchema();

// Legacy function for backward compatibility
export const getConditionalSchema = (partyType: PartyType) => {
  return baseRecipientFormSchema.refine(
    (data) => {
      if (partyType === 'INDIVIDUAL') {
        return data.firstName && data.lastName;
      }
      if (partyType === 'ORGANIZATION') {
        return data.businessName;
      }
      return true;
    },
    {
      message:
        partyType === 'INDIVIDUAL'
          ? 'First name and last name are required for individuals'
          : 'Business name is required for organizations',
      path: partyType === 'INDIVIDUAL' ? ['firstName'] : ['businessName'],
    }
  );
};

export type FormData = z.infer<typeof baseRecipientFormSchema>;

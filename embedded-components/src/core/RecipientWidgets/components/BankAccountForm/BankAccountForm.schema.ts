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
  city: z.string().max(34).optional(),
  state: z.string().max(34).optional(), // Allow longer state values (API may return full names)
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
 * The parsed shape produced by the base schema (before superRefine).
 * Fields such as `routingNumbers` are optional here, unlike BankAccountFormData.
 */
type BankAccountSuperRefineData = z.infer<ReturnType<typeof createBaseSchema>>;

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
 * Validate account holder identity fields (always required)
 */
function validateAccountHolder(
  data: BankAccountSuperRefineData,
  v: ValidationGetter,
  ctx: z.RefinementCtx
): void {
  if (data.accountType === 'INDIVIDUAL') {
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
  } else if (data.accountType === 'ORGANIZATION') {
    if (!data.businessName || data.businessName.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: v('fields.businessName.validation.required'),
        path: ['businessName'],
      });
    }
  }
}

/**
 * Validate bank account number and type (always required)
 */
function validateBankAccountDetails(
  data: BankAccountSuperRefineData,
  config: BankAccountFormConfig,
  v: ValidationGetter,
  ctx: z.RefinementCtx
): void {
  const intl = config.internationalFieldConfig;

  if (!data.accountNumber || data.accountNumber.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: v('fields.accountNumber.validation.required'),
      path: ['accountNumber'],
    });
  } else if (intl?.accountNumberFormat) {
    // Cross-border: IBAN/CLABE/local numbers may contain letters. Enforce
    // alphanumeric (spaces allowed for grouped IBAN entry) instead of US
    // digits-only.
    if (!/^[A-Za-z0-9\s]+$/.test(data.accountNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: v('fields.accountNumber.validation.invalidCharacters'),
        path: ['accountNumber'],
      });
    }
  } else if (!/^\d+$/.test(data.accountNumber)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: v('fields.accountNumber.validation.digitsOnly'),
      path: ['accountNumber'],
    });
  }

  // The checking/savings account type is not meaningful for every destination
  // (e.g. IBAN countries, CLABE, Brazil); the FX wrapper hides it there.
  if (!intl?.hideBankAccountType && !data.bankAccountType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: v('fields.accountType.validation.required'),
      path: ['bankAccountType'],
    });
  }
}

/**
 * Validate the routing number for a single selected payment method
 */
function validateRoutingNumberForMethod(
  method: RoutingInformationTransactionType,
  methodIndex: number,
  data: BankAccountSuperRefineData,
  config: BankAccountFormConfig,
  v: ValidationGetter,
  ctx: z.RefinementCtx
): void {
  const methodConfig = config.paymentMethods.configs[method];
  if (!methodConfig?.enabled || !methodConfig.requiredFields.routingNumber) {
    return;
  }

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
        method: methodConfig.labelString,
      }),
      path:
        routingEntryIndex >= 0
          ? ['routingNumbers', routingEntryIndex, 'routingNumber']
          : ['routingNumbers', methodIndex, 'routingNumber'],
    });
    return;
  }

  // Validate routing number format (always 9 digits) unless the FX wrapper
  // relaxes it for non-US routing codes (BSB, IFSC, sort code, SWIFT/BIC, …).
  if (
    !config.internationalFieldConfig?.relaxRoutingFormat &&
    !/^\d{9}$/.test(routingEntry.routingNumber)
  ) {
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

/**
 * Validate routing numbers across all selected payment methods
 */
function validateRoutingNumbers(
  data: BankAccountSuperRefineData,
  config: BankAccountFormConfig,
  v: ValidationGetter,
  ctx: z.RefinementCtx,
  selectedMethods: RoutingInformationTransactionType[]
): void {
  const intl = config.internationalFieldConfig;
  // Cross-border (FX): a single shared bank/routing code applies regardless of
  // the selected rail. It is hidden for formats that embed it (CLABE) and
  // optional for IBAN currencies (BIC/SWIFT). Validated once at index 0.
  if (intl) {
    if (intl.hideRoutingNumber) {
      return;
    }
    const value = data.routingNumbers?.[0]?.routingNumber?.trim() ?? '';
    if (!value && intl.routingCodeRequired !== false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: v('routingNumbers.validation.codeRequired'),
        path: ['routingNumbers', 0, 'routingNumber'],
      });
    }
    return;
  }

  selectedMethods.forEach((method, methodIndex) => {
    validateRoutingNumberForMethod(method, methodIndex, data, config, v, ctx);
  });
}

/**
 * Validate the individual fields of a required address
 */
function validateAddressFields(
  address: NonNullable<BankAccountSuperRefineData['address']>,
  v: ValidationGetter,
  ctx: z.RefinementCtx
): void {
  if (!address.addressLine1 || address.addressLine1.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: v('address.validation.streetAddressRequired'),
      path: ['address', 'addressLine1'],
    });
  }

  if (!address.city || address.city.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: v('address.validation.cityRequired'),
      path: ['address', 'city'],
    });
  }

  if (!address.state || address.state.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: v('address.validation.stateRequired'),
      path: ['address', 'state'],
    });
  }

  if (!address.postalCode || address.postalCode.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: v('address.validation.postalCodeRequired'),
      path: ['address', 'postalCode'],
    });
  } else if (!/^\d{5}(-\d{4})?$/.test(address.postalCode)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: v('address.validation.postalCodeFormat'),
      path: ['address', 'postalCode'],
    });
  }
}

/**
 * Validate address presence and contents when required by payment methods
 */
function validateAddress(
  data: BankAccountSuperRefineData,
  config: BankAccountFormConfig,
  v: ValidationGetter,
  ctx: z.RefinementCtx,
  selectedMethods: RoutingInformationTransactionType[]
): void {
  if (!isAddressRequired(config, selectedMethods)) return;

  if (!data.address) {
    const methodsRequiringAddress = selectedMethods.filter(
      (method) => config.paymentMethods.configs[method]?.requiredFields.address
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
    return;
  }

  validateAddressFields(data.address, v, ctx);
}

/**
 * Validate contact fields required by the selected payment methods
 */
function validateContacts(
  data: BankAccountSuperRefineData,
  config: BankAccountFormConfig,
  v: ValidationGetter,
  ctx: z.RefinementCtx,
  selectedMethods: RoutingInformationTransactionType[]
): void {
  const requiredContactTypes = getRequiredContactTypes(config, selectedMethods);

  requiredContactTypes.forEach((contactType) => {
    const contact = data.contacts?.find((c) => c.contactType === contactType);
    if (contact && contact.value.trim()) return;

    const methodsRequiringContact = selectedMethods.filter((method) =>
      config.paymentMethods.configs[method]?.requiredFields.contacts?.includes(
        contactType
      )
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
  });
}

/**
 * Validate that locked payment methods remain selected (for linked accounts)
 */
function validateLockedPaymentMethods(
  config: BankAccountFormConfig,
  v: ValidationGetter,
  ctx: z.RefinementCtx,
  selectedMethods: RoutingInformationTransactionType[]
): void {
  selectedMethods.forEach((method) => {
    const methodConfig = config.paymentMethods.configs[method];
    if (methodConfig?.locked && !selectedMethods.includes(method)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: v('paymentMethods.validation.lockedRequired', {
          method: methodConfig.labelString,
        }),
        path: ['paymentTypes'],
      });
    }
  });
}

/**
 * Validate the account against existing accounts (duplicate detection)
 */
function validateDuplicateAccounts(
  data: BankAccountSuperRefineData,
  config: BankAccountFormConfig,
  v: ValidationGetter,
  ctx: z.RefinementCtx
): void {
  if (
    !config.existingAccounts?.length ||
    !data.accountNumber?.trim() ||
    !data.routingNumbers?.length
  ) {
    return;
  }

  const isDuplicate = config.existingAccounts.some((existing) => {
    if (existing.account?.number !== data.accountNumber) return false;
    // Match if any routing number in the form matches any routing number
    // on the existing account (same transaction type + routing number).
    return data.routingNumbers!.some((formRouting) =>
      existing.account?.routingInformation?.some(
        (existingRouting) =>
          existingRouting.routingNumber === formRouting.routingNumber &&
          existingRouting.transactionType === formRouting.paymentType
      )
    );
  });

  if (isDuplicate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: v('fields.accountNumber.validation.duplicate'),
      path: ['accountNumber'],
    });
  }
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
    const { paymentTypes = [] } = data;
    const selectedMethods = paymentTypes as RoutingInformationTransactionType[];

    // 1. Account holder information (always required)
    validateAccountHolder(data, v, ctx);

    // 2. Bank account details (always required)
    validateBankAccountDetails(data, config, v, ctx);

    // 3. Routing numbers for each selected payment method
    validateRoutingNumbers(data, config, v, ctx, selectedMethods);

    // 4. Address (conditional on payment methods)
    validateAddress(data, config, v, ctx, selectedMethods);

    // 5. Contact fields (conditional on payment methods)
    validateContacts(data, config, v, ctx, selectedMethods);

    // 6. Locked payment methods (for linked accounts)
    validateLockedPaymentMethods(config, v, ctx, selectedMethods);

    // 7. Duplicate detection against existing accounts
    validateDuplicateAccounts(data, config, v, ctx);
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

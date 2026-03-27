import type {
  Recipient,
  RecipientRequest,
  RecipientType,
  RoutingInformation,
} from '@/api/generated/ep-recipients.schemas';

import type { BankAccountFormData } from './BankAccountForm.types';

/** Placeholder id for {@link bankAccountFormDataToDisplayRecipient} (display-only, not persisted). */
export const PREFILL_DISPLAY_RECIPIENT_ID = 'pending-prefill';

/**
 * Merge host overrides on top of computed form defaults (recipient/client prefill).
 */
export function mergeBankAccountDefaultValues(
  base: BankAccountFormData,
  override?: Partial<BankAccountFormData>
): BankAccountFormData {
  if (!override) return base;
  return {
    ...base,
    ...override,
    address:
      override.address !== undefined
        ? ({
            ...(base.address ?? {}),
            ...override.address,
          } as BankAccountFormData['address'])
        : base.address,
    routingNumbers: override.routingNumbers ?? base.routingNumbers,
    paymentTypes: override.paymentTypes ?? base.paymentTypes,
    contacts: override.contacts ?? base.contacts,
  };
}

/**
 * Build a Recipient-shaped object for display (e.g. RecipientAccountDisplayCard) from form data.
 * Not suitable as an API response; use only for review UI before POST /recipients.
 */
export function bankAccountFormDataToDisplayRecipient(
  data: BankAccountFormData
): Recipient {
  const routingInformation: RoutingInformation[] = data.routingNumbers.map(
    (routingConfig) => ({
      routingCodeType: 'USABA' as const,
      routingNumber: routingConfig.routingNumber,
      transactionType: routingConfig.paymentType,
    })
  );

  const partyDetails: Recipient['partyDetails'] = {
    type: data.accountType,
    ...(data.accountType === 'INDIVIDUAL'
      ? {
          firstName: data.firstName,
          lastName: data.lastName,
        }
      : {
          businessName: data.businessName,
        }),
  };

  if (data.address) {
    partyDetails.address = {
      addressLine1: data.address.addressLine1,
      addressLine2: data.address.addressLine2,
      addressLine3: data.address.addressLine3,
      city: data.address.city,
      state: data.address.state,
      postalCode: data.address.postalCode,
      countryCode: data.address.countryCode,
    };
  }

  if (data.contacts && data.contacts.length > 0) {
    partyDetails.contacts = data.contacts;
  }

  return {
    id: PREFILL_DISPLAY_RECIPIENT_ID,
    type: 'LINKED_ACCOUNT',
    partyDetails,
    account: {
      number: data.accountNumber,
      type: data.bankAccountType,
      routingInformation,
      countryCode: 'US',
    },
  };
}

/**
 * Transform BankAccountFormData to RecipientRequest payload
 * Used for creating linked accounts and recipients
 *
 * @param data - The form data from BankAccountForm
 * @param recipientType - The type of recipient ('LINKED_ACCOUNT' or 'RECIPIENT')
 * @returns The API payload ready for submission
 */
export function transformBankAccountFormToRecipientPayload(
  data: BankAccountFormData,
  recipientType: RecipientType
): RecipientRequest {
  // Build routing information based on payment types and their routing numbers
  const routingInformation: RoutingInformation[] = data.routingNumbers.map(
    (routingConfig) => ({
      routingCodeType: 'USABA' as const,
      routingNumber: routingConfig.routingNumber,
      transactionType: routingConfig.paymentType,
    })
  );

  // Build base payload
  const payload: RecipientRequest = {
    type: recipientType,
    partyDetails: {
      type: data.accountType,
      ...(data.accountType === 'INDIVIDUAL'
        ? {
            firstName: data.firstName!,
            lastName: data.lastName!,
          }
        : {
            businessName: data.businessName!,
          }),
    },
    account: {
      type: data.bankAccountType,
      number: data.accountNumber,
      routingInformation,
      countryCode: 'US',
    },
  };

  // Add address if provided (required for Wire/RTP)
  if (data.address && payload.partyDetails) {
    payload.partyDetails.address = {
      addressLine1: data.address.addressLine1,
      addressLine2: data.address.addressLine2,
      addressLine3: data.address.addressLine3,
      city: data.address.city,
      state: data.address.state,
      postalCode: data.address.postalCode,
      countryCode: data.address.countryCode,
    };
  }

  // Add contacts if provided
  if (data.contacts && data.contacts.length > 0 && payload.partyDetails) {
    payload.partyDetails.contacts = data.contacts;
  }

  return payload;
}

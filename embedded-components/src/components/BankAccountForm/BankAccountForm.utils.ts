import type {
  RecipientRequest,
  RoutingInformation,
} from '@/api/generated/ep-recipients.schemas';

import type { BankAccountFormData } from './BankAccountForm.types';

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
  recipientType: 'LINKED_ACCOUNT' | 'RECIPIENT'
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
      addressLine1: data.address.primaryAddressLine,
      addressLine2: data.address.secondaryAddressLine,
      city: data.address.city,
      state: data.address.state,
      postalCode: data.address.postalCode,
      countryCode: 'US',
    };
  }

  // Add contacts if provided
  const contacts = [];
  if (data.email) {
    contacts.push({
      contactType: 'EMAIL' as const,
      value: data.email,
    });
  }
  if (data.phone) {
    contacts.push({
      contactType: 'PHONE' as const,
      value: data.phone,
    });
  }
  if (data.website) {
    contacts.push({
      contactType: 'WEBSITE' as const,
      value: data.website,
    });
  }
  if (contacts.length > 0 && payload.partyDetails) {
    payload.partyDetails.contacts = contacts;
  }

  return payload;
}

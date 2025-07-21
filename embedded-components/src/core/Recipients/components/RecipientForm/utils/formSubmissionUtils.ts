import {
  AccountType,
  CountryCode,
  RecipientType,
  RoutingCodeType,
  RoutingInformationTransactionType,
} from '@/api/generated/ep-recipients.schemas';
import type { RecipientRequest } from '@/api/generated/ep-recipients.schemas';

import type { FormData } from '../RecipientForm.schema';

/**
 * Builds a recipient request from form data
 */
export function buildRecipientRequest(
  data: FormData,
  recipientType: RecipientType
): RecipientRequest {
  return {
    type: recipientType,
    partyDetails: {
      type: data.type,
      ...(data.type === 'INDIVIDUAL' && {
        firstName: data.firstName!,
        lastName: data.lastName!,
      }),
      ...(data.type === 'ORGANIZATION' && {
        businessName: data.businessName!,
      }),
      ...(data.addressLine1 && {
        address: {
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          addressLine3: data.addressLine3,
          city: data.city!,
          state: data.state,
          postalCode: data.postalCode,
          countryCode: CountryCode.US,
        },
      }),
      ...(data.contacts &&
        data.contacts.length > 0 && {
          contacts: data.contacts.filter((contact) => contact.value?.trim()),
        }),
    },
    account: {
      number: data.accountNumber!,
      type: data.accountType as AccountType,
      countryCode: CountryCode.US,
      routingInformation: data.paymentMethods
        ?.filter((method) => data.routingNumbers?.[method])
        .map((method) => ({
          routingNumber: data.routingNumbers![method],
          routingCodeType: RoutingCodeType.USABA,
          transactionType:
            method as keyof typeof RoutingInformationTransactionType,
        })),
    },
  };
}

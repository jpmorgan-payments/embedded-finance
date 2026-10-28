import { getSupportedPaymentMethods } from '@/lib/recipientHelpers';
import type {
  Recipient,
  RoutingInformationTransactionType,
} from '@/api/generated/ep-recipients.schemas';

import type { BankAccountFormConfig } from '../BankAccountForm.types';

/**
 * Limit the payment methods an edit form offers to `allowedPaymentMethods`.
 *
 * Methods the recipient already has stay available so editing never hides or
 * silently drops existing routing information. Returns `config` unchanged when
 * no restriction is supplied.
 */
export function restrictPaymentMethods(
  config: BankAccountFormConfig,
  allowedPaymentMethods:
    | readonly RoutingInformationTransactionType[]
    | undefined,
  recipient?: Recipient
): BankAccountFormConfig {
  if (!allowedPaymentMethods) return config;

  const existingMethods = recipient
    ? getSupportedPaymentMethods(recipient)
    : [];
  const isPermitted = (method: RoutingInformationTransactionType) =>
    allowedPaymentMethods.includes(method) || existingMethods.includes(method);

  return {
    ...config,
    paymentMethods: {
      ...config.paymentMethods,
      available: config.paymentMethods.available.filter(isPermitted),
      defaultSelected:
        config.paymentMethods.defaultSelected?.filter(isPermitted),
    },
  };
}

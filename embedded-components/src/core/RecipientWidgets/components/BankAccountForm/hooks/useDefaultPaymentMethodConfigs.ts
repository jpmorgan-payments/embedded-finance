import { RoutingInformationTransactionType } from '@/api/generated/ep-recipients.schemas';

import type { PaymentMethodConfig } from '../BankAccountForm.types';
import { usePaymentMethodConfig } from './usePaymentMethodConfig';

/**
 * Hook to get default payment method configurations
 */
export const useDefaultPaymentMethodConfigs = (): Record<
  RoutingInformationTransactionType,
  PaymentMethodConfig
> => {
  const achConfig = usePaymentMethodConfig('ACH');
  const wireConfig = usePaymentMethodConfig('WIRE');
  const rtpConfig = usePaymentMethodConfig('RTP');

  return {
    ACH: achConfig,
    WIRE: wireConfig,
    RTP: rtpConfig,
  };
};

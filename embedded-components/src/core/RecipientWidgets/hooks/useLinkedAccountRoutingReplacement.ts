import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import {
  useAmendRecipient,
  useCreateRecipient,
} from '@/api/generated/ep-recipients';
import type {
  ApiError,
  Recipient,
  RoutingCodeType,
} from '@/api/generated/ep-recipients.schemas';
import type { ErrorType } from '@/api/use-axios-instance';

import {
  transformBankAccountFormToRecipientPayload,
  type BankAccountFormData,
} from '../components/BankAccountForm';
import { invalidateRecipientQueries } from '../utils';

export type LinkedAccountReplacementFailureStage =
  | 'create'
  | 'deactivate-original'
  | 'rollback-replacement';

type UseLinkedAccountRoutingReplacementOptions = {
  recipient?: Recipient;
  clientId?: string;
  routingCodeType?: RoutingCodeType;
  onSuccess?: (recipient: Recipient) => void;
  onError?: (error: ApiError) => void;
  onSettled?: (recipient?: Recipient, error?: ApiError) => void;
};

const asApiRequestError = (error: unknown) => error as ErrorType<ApiError>;

const missingRecipientError = () =>
  new AxiosError<ApiError>(
    'An existing linked account is required.',
    'LINKED_ACCOUNT_REQUIRED',
    undefined,
    undefined,
    {
      data: {
        title: 'Unable to update linked account',
        httpStatus: 500,
      },
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: { headers: {} } as never,
    }
  );

export function useLinkedAccountRoutingReplacement({
  recipient,
  clientId,
  routingCodeType,
  onSuccess,
  onError,
  onSettled,
}: UseLinkedAccountRoutingReplacementOptions) {
  const queryClient = useQueryClient();
  const createRecipient = useCreateRecipient();
  const amendRecipient = useAmendRecipient();
  const [failureStage, setFailureStage] =
    useState<LinkedAccountReplacementFailureStage>();

  const replacementMutation = useMutation<
    Recipient,
    ErrorType<ApiError>,
    BankAccountFormData
  >({
    mutationFn: async (formData) => {
      setFailureStage(undefined);
      if (!recipient) {
        setFailureStage('create');
        throw missingRecipientError();
      }

      const createPayload = transformBankAccountFormToRecipientPayload(
        formData,
        'LINKED_ACCOUNT',
        routingCodeType
      );
      const resolvedClientId = recipient.clientId ?? clientId;
      const resolvedPartyId = recipient.partyId ?? formData.selectedPartyId;

      if (resolvedClientId) createPayload.clientId = resolvedClientId;
      if (resolvedPartyId) {
        createPayload.partyId = resolvedPartyId;
        delete createPayload.partyDetails;
      }

      let replacementRecipient: Recipient;
      try {
        replacementRecipient = await createRecipient.mutateAsync({
          data: createPayload,
        });
      } catch (error) {
        setFailureStage('create');
        throw asApiRequestError(error);
      }

      try {
        await amendRecipient.mutateAsync({
          id: recipient.id,
          data: { status: 'INACTIVE' },
        });
      } catch (deactivateOriginalError) {
        try {
          await amendRecipient.mutateAsync({
            id: replacementRecipient.id,
            data: { status: 'INACTIVE' },
          });
        } catch (rollbackError) {
          setFailureStage('rollback-replacement');
          throw asApiRequestError(rollbackError);
        }

        setFailureStage('deactivate-original');
        throw asApiRequestError(deactivateOriginalError);
      }

      return replacementRecipient;
    },
    onSuccess: (replacementRecipient) => {
      onSuccess?.(replacementRecipient);
      onSettled?.(replacementRecipient);
    },
    onError: (error) => {
      const apiError = error.response?.data ?? {
        title: 'Unable to update linked account',
        httpStatus: 500,
      };
      onError?.(apiError);
      onSettled?.(undefined, apiError);
    },
    onSettled: () => {
      invalidateRecipientQueries(queryClient, 'LINKED_ACCOUNT');
    },
  });

  const reset = () => {
    setFailureStage(undefined);
    replacementMutation.reset();
  };

  return {
    replace: replacementMutation.mutateAsync,
    reset,
    status: replacementMutation.status,
    data: replacementMutation.data,
    error: replacementMutation.error,
    failureStage,
    isPending: replacementMutation.isPending,
  };
}

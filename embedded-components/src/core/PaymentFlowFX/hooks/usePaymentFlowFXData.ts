/**
 * usePaymentFlowFXData
 *
 * Self-contained reimplementation of PaymentFlow's account + balance + recipient
 * data plumbing (PaymentFlow keeps its private version — non-breaking mandate D6),
 * extended to enrich payees with FX metadata (currency / country) via a tolerant
 * accessor until the recipients spec upgrade lands (SPECIFICATION.md §4 step 3).
 */
import { useCallback, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';

import {
  getGetAccountBalanceQueryKey,
  useGetAccountBalanceHook,
  useGetAccounts,
} from '@/api/generated/ep-accounts';
import { useGetAllRecipientsInfinite } from '@/api/generated/ep-recipients';
import { RecipientType as ApiRecipientType } from '@/api/generated/ep-recipients.schemas';

import type {
  AccountResponse,
  PaymentMethodType,
} from '../../PaymentFlow/PaymentFlow.types';
import type { FXPayee } from '../PaymentFlowFX.types';

/**
 * Reads `account.currencyCode` with a tolerant `string` type.
 *
 * The FX recipients spec (`embedded-finance-pub-ep-recipients-1.0.55-fx.yaml`)
 * widens `RecipientAccount.currencyCode` to the 16 supported credit currencies
 * plus USD. Reading it as an open `string` keeps this hook decoupled from the
 * generated enum, so it stays safe against an older client that omits the field
 * and against future spec revisions that add currencies.
 */
function readAccountCurrency(account: unknown): string | undefined {
  return (account as { currencyCode?: string } | undefined)?.currencyCode;
}

function readAccountCountry(account: unknown): string | undefined {
  return (account as { countryCode?: string } | undefined)?.countryCode;
}

const getNextPageParam = (
  lastPage: { metadata?: { total_items?: number }; total_items?: number } & {
    recipients?: unknown[];
  },
  allPages: { recipients?: unknown[] }[]
): number | undefined => {
  const totalItems =
    lastPage?.metadata?.total_items ?? lastPage?.total_items ?? 0;
  const loadedItems = allPages.reduce(
    (acc, page) => acc + (page?.recipients?.length ?? 0),
    0
  );
  return loadedItems < totalItems ? allPages.length : undefined;
};

export interface PaymentFlowFXData {
  accounts: AccountResponse[];
  payees: FXPayee[];
  linkedAccounts: FXPayee[];
  // Accounts
  isLoadingAccounts: boolean;
  isAccountsError: boolean;
  refetchAccounts: () => void;
  // Recipients
  isLoadingRecipients: boolean;
  isRecipientsError: boolean;
  refetchRecipients: () => void;
  fetchNextRecipients: () => void;
  hasNextRecipients: boolean;
  isFetchingNextRecipients: boolean;
  totalRecipients: number;
  // Linked accounts
  isLoadingLinkedAccounts: boolean;
  isLinkedAccountsError: boolean;
  refetchLinkedAccounts: () => void;
  fetchNextLinkedAccounts: () => void;
  hasNextLinkedAccounts: boolean;
  isFetchingNextLinkedAccounts: boolean;
  totalLinkedAccounts: number;
  // Balances / aggregate
  isLoadingBalances: boolean;
  hasBalanceErrors: boolean;
  isLoading: boolean;
}

export function usePaymentFlowFXData(): PaymentFlowFXData {
  const getAccountBalance = useGetAccountBalanceHook();

  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    isError: isAccountsError,
    refetch: refetchAccounts,
  } = useGetAccounts();

  const {
    data: recipientsData,
    isLoading: isLoadingRecipients,
    isError: isRecipientsError,
    refetch: refetchRecipients,
    fetchNextPage: fetchNextRecipients,
    hasNextPage: hasNextRecipients,
    isFetchingNextPage: isFetchingNextRecipients,
  } = useGetAllRecipientsInfinite(
    { type: 'RECIPIENT', limit: 25 },
    { query: { initialPageParam: 0, getNextPageParam } }
  );

  const {
    data: linkedAccountsData,
    isLoading: isLoadingLinkedAccounts,
    isError: isLinkedAccountsError,
    refetch: refetchLinkedAccounts,
    fetchNextPage: fetchNextLinkedAccounts,
    hasNextPage: hasNextLinkedAccounts,
    isFetchingNextPage: isFetchingNextLinkedAccounts,
  } = useGetAllRecipientsInfinite(
    { type: 'LINKED_ACCOUNT', limit: 25 },
    { query: { initialPageParam: 0, getNextPageParam } }
  );

  const totalRecipients =
    recipientsData?.pages?.[0]?.metadata?.total_items ?? 0;
  const totalLinkedAccounts =
    linkedAccountsData?.pages?.[0]?.metadata?.total_items ?? 0;

  const activeAccountIds = useMemo(() => {
    if (!accountsData?.items) return [];
    return accountsData.items
      .filter(
        (account) =>
          account.state === 'OPEN' || account.state === 'PENDING_CLOSE'
      )
      .map((account) => account.id);
  }, [accountsData]);

  const balanceQueries = useQueries({
    queries: activeAccountIds.map((accountId) => ({
      queryKey: getGetAccountBalanceQueryKey(accountId!),
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        getAccountBalance(accountId!, undefined, signal),
      enabled: !!accountId,
    })),
  });

  const isLoadingBalances = balanceQueries.some((query) => query.isLoading);
  const hasBalanceErrors = balanceQueries.some((query) => query.isError);

  const balanceMap = useMemo(() => {
    const map: Record<
      string,
      {
        available: number;
        currency: string;
        hasError?: boolean;
        isLoading?: boolean;
      }
    > = {};
    balanceQueries.forEach((query, index) => {
      const accountId = activeAccountIds[index];
      if (!accountId) return;
      if (query.isLoading) {
        map[accountId] = {
          available: 0,
          currency: 'USD',
          hasError: false,
          isLoading: true,
        };
      } else if (query.isError) {
        map[accountId] = {
          available: 0,
          currency: 'USD',
          hasError: true,
          isLoading: false,
        };
      } else if (query.data) {
        const availableBalance = query.data.balanceTypes?.find(
          (bt) => bt.typeCode === 'ITAV'
        );
        map[accountId] = {
          available: availableBalance?.amount ?? 0,
          currency: query.data.currency ?? 'USD',
          hasError: false,
          isLoading: false,
        };
      }
    });
    return map;
  }, [balanceQueries, activeAccountIds]);

  const accounts: AccountResponse[] = useMemo(() => {
    if (!accountsData?.items) return [];
    return accountsData.items
      .filter(
        (account) =>
          account.state === 'OPEN' || account.state === 'PENDING_CLOSE'
      )
      .map((account) => {
        const balanceInfo = balanceMap[account.id];
        return {
          ...account,
          balance: balanceInfo
            ? {
                available: balanceInfo.available,
                currency: balanceInfo.currency,
                hasError: balanceInfo.hasError,
                isLoading: balanceInfo.isLoading,
              }
            : {
                available: 0,
                currency: 'USD',
                hasError: false,
                isLoading: true,
              },
        };
      });
  }, [accountsData, balanceMap]);

  const transformRecipientsToPayees = useCallback(
    (recipients: typeof recipientsData): FXPayee[] => {
      const allRecipients =
        recipients?.pages?.flatMap((page) => page?.recipients ?? []) ?? [];

      return allRecipients
        .filter((r) => r.status === 'ACTIVE')
        .map((recipient) => {
          const isLinkedAccount =
            recipient.type === ApiRecipientType.LINKED_ACCOUNT;
          const isOrganization =
            recipient.partyDetails?.type === 'ORGANIZATION';

          const enabledMethods: PaymentMethodType[] = [];
          recipient.account?.routingInformation?.forEach((ri) => {
            const method = ri.transactionType as PaymentMethodType;
            if (
              (method === 'ACH' || method === 'WIRE' || method === 'RTP') &&
              !enabledMethods.includes(method)
            ) {
              enabledMethods.push(method);
            }
          });

          const name = isOrganization
            ? (recipient.partyDetails?.businessName ?? 'Unknown Business')
            : `${recipient.partyDetails?.firstName ?? ''} ${
                recipient.partyDetails?.lastName ?? ''
              }`.trim() || 'Unknown';

          const currencyCode = readAccountCurrency(recipient.account);
          const countryCode =
            readAccountCountry(recipient.account) ??
            recipient.partyDetails?.address?.countryCode;

          return {
            id: recipient.id,
            type: isLinkedAccount ? 'LINKED_ACCOUNT' : 'RECIPIENT',
            name,
            accountNumber: recipient.account?.number ?? '',
            routingNumber:
              recipient.account?.routingInformation?.[0]?.routingNumber ?? '',
            bankName: undefined,
            enabledPaymentMethods:
              enabledMethods.length > 0 ? enabledMethods : ['ACH'],
            recipientType: isOrganization ? 'BUSINESS' : 'INDIVIDUAL',
            currencyCode,
            countryCode,
            details: {
              email: recipient.partyDetails?.contacts?.find(
                (c) => c.contactType === 'EMAIL'
              )?.value,
              phone: recipient.partyDetails?.contacts?.find(
                (c) => c.contactType === 'PHONE'
              )?.value,
              beneficiaryAddress: recipient.partyDetails?.address?.addressLine1,
              beneficiaryCity: recipient.partyDetails?.address?.city,
              beneficiaryState: recipient.partyDetails?.address?.state,
              beneficiaryZip: recipient.partyDetails?.address?.postalCode,
            },
          } as FXPayee;
        });
    },
    []
  );

  const payees = useMemo(
    () => transformRecipientsToPayees(recipientsData),
    [recipientsData, transformRecipientsToPayees]
  );

  const linkedAccounts = useMemo(
    () => transformRecipientsToPayees(linkedAccountsData),
    [linkedAccountsData, transformRecipientsToPayees]
  );

  const isLoading =
    isLoadingAccounts ||
    isLoadingRecipients ||
    isLoadingLinkedAccounts ||
    isLoadingBalances;

  return {
    accounts,
    payees,
    linkedAccounts,
    isLoadingAccounts,
    isAccountsError,
    refetchAccounts,
    isLoadingRecipients,
    isRecipientsError,
    refetchRecipients,
    fetchNextRecipients,
    hasNextRecipients: !!hasNextRecipients,
    isFetchingNextRecipients,
    totalRecipients,
    isLoadingLinkedAccounts,
    isLinkedAccountsError,
    refetchLinkedAccounts,
    fetchNextLinkedAccounts,
    hasNextLinkedAccounts: !!hasNextLinkedAccounts,
    isFetchingNextLinkedAccounts,
    totalLinkedAccounts,
    isLoadingBalances,
    hasBalanceErrors,
    isLoading,
  };
}

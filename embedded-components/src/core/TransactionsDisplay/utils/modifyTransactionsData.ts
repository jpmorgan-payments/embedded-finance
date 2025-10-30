import { TransactionGetResponseV2 } from '@/api/generated/ef-v2.schemas';

export interface ModifiedTransaction extends TransactionGetResponseV2 {
  payinOrPayout?: 'PAYIN' | 'PAYOUT';
  counterpartName?: string;
}

export const modifyTransactionsData = (
  transactions: TransactionGetResponseV2[],
  accountIds: string[]
): ModifiedTransaction[] => {
  const sortedTransactions = transactions.sort((a, b) => {
    // Primary sort: by createdAt timestamp (most recent first)
    const aCreatedAt = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bCreatedAt = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    if (aCreatedAt !== bCreatedAt) {
      return bCreatedAt - aCreatedAt; // Most recent first
    }

    // Secondary sort: by effectiveDate (most recent first)
    const aEffectiveDate = a.effectiveDate
      ? new Date(a.effectiveDate).getTime()
      : 0;
    const bEffectiveDate = b.effectiveDate
      ? new Date(b.effectiveDate).getTime()
      : 0;

    if (aEffectiveDate !== bEffectiveDate) {
      return bEffectiveDate - aEffectiveDate; // Most recent first
    }

    // Tertiary sort: by postingVersion (highest first)
    return (b.postingVersion ?? 0) - (a.postingVersion ?? 0);
  });

  return sortedTransactions.map((transaction) => {
    if (!accountIds.length) {
      return {
        ...transaction,
        payinOrPayout: undefined,
        counterpartName: undefined,
      };
    }

    const payinOrPayout = accountIds.includes(
      transaction.creditorAccountId ?? ''
    )
      ? 'PAYIN'
      : 'PAYOUT';
    const counterpartName =
      payinOrPayout === 'PAYIN'
        ? transaction.debtorName
        : transaction.creditorName;

    return {
      ...transaction,
      payinOrPayout,
      counterpartName,
    };
  });
};

import { FC } from 'react';

import { useListTransactionsV2 } from '@/api/generated/ef-v2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';

import { columns } from './TransactionsDisplay.columns';
import { modifyTransactionsData } from './utils/modifyTransactionsData';

export type TransactionsDisplayProps = {
  accountId: string;
};

export const TransactionsDisplay: FC<TransactionsDisplayProps> = ({
  accountId,
}) => {
  const { data, status, failureReason } = useListTransactionsV2({});

  return (
    <Card className="eb-w-full">
      <CardHeader>
        <CardTitle className="eb-text-xl eb-font-semibold">
          Transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="eb-space-y-4">
        {status === 'pending' && (
          <div className="eb-py-8 eb-text-center eb-text-gray-500">
            Loading transactions...
          </div>
        )}
        {status === 'error' && (
          <div className="eb-py-8 eb-text-center eb-text-red-500">
            Error: {failureReason?.message ?? 'Unknown error'}
          </div>
        )}
        {status === 'success' && data.items && (
          <DataTable
            columns={columns}
            data={modifyTransactionsData(data.items, accountId)}
          />
        )}
        {status === 'success' && (!data.items || data.items.length === 0) && (
          <div className="eb-py-8 eb-text-center eb-text-gray-500">
            No transactions found
          </div>
        )}
      </CardContent>
    </Card>
  );
};

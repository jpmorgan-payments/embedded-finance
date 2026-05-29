import { useEffect, useState } from 'react';

import { API_URL } from '../data/constants';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
}

export function MSWTest() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/transactions`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setTransactions(data.transactions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="mb-4 text-xl font-bold">MSW Test - Loading...</h2>
        <div className="animate-pulse">Loading transactions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="mb-4 text-xl font-bold">MSW Test - Error</h2>
        <div className="text-red-600">Error: {error}</div>
        <div className="mt-2 text-sm text-gray-600">
          API URL: {API_URL || 'Not set'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">MSW Test - Success!</h2>
      <div className="mb-4 text-sm text-gray-600">
        API URL: {API_URL || 'Not set'}
      </div>
      <div className="mb-4">
        <strong>Transactions loaded from MSW:</strong>
      </div>
      <div className="space-y-2">
        {transactions.slice(0, 3).map((transaction) => (
          <div key={transaction.id} className="rounded border p-3">
            <div className="font-medium">{transaction.description}</div>
            <div className="text-sm text-gray-600">
              Amount: ${transaction.amount} | Date: {transaction.date}
            </div>
          </div>
        ))}
      </div>
      {transactions.length > 3 && (
        <div className="mt-2 text-sm text-gray-600">
          ... and {transactions.length - 3} more transactions
        </div>
      )}
    </div>
  );
}

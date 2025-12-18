'use client';

export function TransactionHistory() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>

      <div className="overflow-hidden rounded-lg border bg-white shadow">
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Transactions
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              <tr>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  #TXN-12345
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  Sale
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-green-600">
                  $150.00
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    Completed
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  Jan 15, 2024
                </td>
              </tr>
              <tr>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  #TXN-12344
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  Withdrawal
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-red-600">
                  -$500.00
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                    Pending
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  Jan 14, 2024
                </td>
              </tr>
              <tr>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  #TXN-12343
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  Sale
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-green-600">
                  $75.50
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    Completed
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  Jan 13, 2024
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

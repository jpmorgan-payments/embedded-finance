'use client';

export function WalletOverview() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Wallet Overview</h1>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Current Balance
        </h3>
        <p className="text-3xl font-bold text-green-600">$5,234.56</p>
        <p className="text-sm text-gray-500 mt-2">Available for withdrawal</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Sale #12345</span>
            <span className="text-green-600 font-semibold">+$150.00</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Withdrawal</span>
            <span className="text-red-600 font-semibold">-$500.00</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Sale #12344</span>
            <span className="text-green-600 font-semibold">+$75.50</span>
          </div>
        </div>
      </div>
    </div>
  );
}

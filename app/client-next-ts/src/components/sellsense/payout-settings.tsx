'use client';

export function PayoutSettings() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payout Settings</h1>

      <div className="rounded-lg border bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Payout Schedule
        </h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Frequency
            </label>
            <select className="w-full rounded-md border border-gray-300 px-3 py-2">
              <option>Weekly</option>
              <option>Bi-weekly</option>
              <option>Monthly</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Minimum Amount
            </label>
            <input
              type="number"
              placeholder="100.00"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Next Payout
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Amount</p>
            <p className="text-2xl font-bold text-green-600">$3,280.50</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="text-lg font-semibold text-gray-900">Jan 22, 2024</p>
          </div>
        </div>

        <button className="mt-4 rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
          Request Early Payout
        </button>
      </div>
    </div>
  );
}

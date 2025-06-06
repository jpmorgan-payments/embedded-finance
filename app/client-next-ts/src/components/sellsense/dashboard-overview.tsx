'use client';

import type { ClientScenario, ContentTone, View } from './dashboard-layout';
import type { ThemeOption } from './use-sellsense-themes';

interface DashboardOverviewProps {
  onViewChange: (view: View) => void;
  clientScenario: ClientScenario;
  contentTone: ContentTone;
  theme: ThemeOption;
}

export function DashboardOverview({
  onViewChange: _onViewChange,
  clientScenario,
  contentTone: _contentTone,
  theme: _theme,
}: DashboardOverviewProps) {
  return (
    <div className="p-8 bg-sellsense-background-light min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-wide mb-2">
          Welcome, John!
        </h1>
        <p className="text-sm text-gray-600">Client: {clientScenario}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow-md rounded-xl p-6 flex items-center gap-5">
          <div className="bg-sellsense-secondary-bg rounded-lg p-3 flex items-center justify-center">
            <svg
              className="w-9 h-9 text-sellsense-secondary"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium tracking-wide mb-1">
              Today's Orders
            </p>
            <h3 className="text-3xl font-semibold text-sellsense-secondary">
              12
            </h3>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6 flex items-center gap-5">
          <div className="bg-sellsense-secondary-bg rounded-lg p-3 flex items-center justify-center">
            <svg
              className="w-9 h-9 text-sellsense-secondary"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium tracking-wide mb-1">
              Unshipped Orders
            </p>
            <h3 className="text-3xl font-semibold text-sellsense-secondary">
              3
            </h3>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6 flex items-center gap-5">
          <div className="bg-sellsense-secondary-bg rounded-lg p-3 flex items-center justify-center">
            <svg
              className="w-9 h-9 text-sellsense-secondary"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium tracking-wide mb-1">
              Avg. Rating
            </p>
            <h3 className="text-3xl font-semibold text-sellsense-secondary">
              4.8
            </h3>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6 flex items-center gap-5">
          <div className="bg-sellsense-secondary-bg rounded-lg p-3 flex items-center justify-center">
            <svg
              className="w-9 h-9 text-sellsense-secondary"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium tracking-wide mb-1">
              Current Balance
            </p>
            <h3 className="text-3xl font-semibold text-sellsense-secondary">
              $2,430.00
            </h3>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6 flex items-center gap-5">
          <div className="bg-sellsense-secondary-bg rounded-lg p-3 flex items-center justify-center">
            <svg
              className="w-9 h-9 text-sellsense-secondary"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium tracking-wide mb-1">
              Next Payout
            </p>
            <h3 className="text-3xl font-semibold text-sellsense-secondary">
              $1,200.00
            </h3>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Chart */}
        <div className="bg-white shadow-sm rounded-xl p-6 lg:col-span-1 h-80 flex flex-col">
          <h4 className="text-lg font-semibold mb-4">Orders per Day</h4>
          <div className="flex-1 flex items-center justify-center">
            <svg
              width="100%"
              height="200"
              viewBox="0 0 320 200"
              className="max-w-80"
            >
              <polyline
                fill="none"
                stroke="#2CB9AC"
                strokeWidth="3"
                points="10,180 60,120 110,140 160,80 210,100 260,60 310,40"
              />
              {/* Dots */}
              <circle cx="10" cy="180" r="5" fill="#2CB9AC" />
              <circle cx="60" cy="120" r="5" fill="#2CB9AC" />
              <circle cx="110" cy="140" r="5" fill="#2CB9AC" />
              <circle cx="160" cy="80" r="5" fill="#2CB9AC" />
              <circle cx="210" cy="100" r="5" fill="#2CB9AC" />
              <circle cx="260" cy="60" r="5" fill="#2CB9AC" />
              <circle cx="310" cy="40" r="5" fill="#2CB9AC" />
              {/* X axis labels */}
              <text x="10" y="195" fontSize="12" fill="#888">
                Aug 1
              </text>
              <text x="60" y="195" fontSize="12" fill="#888">
                Aug 2
              </text>
              <text x="110" y="195" fontSize="12" fill="#888">
                Aug 3
              </text>
              <text x="160" y="195" fontSize="12" fill="#888">
                Aug 4
              </text>
              <text x="210" y="195" fontSize="12" fill="#888">
                Aug 5
              </text>
              <text x="260" y="195" fontSize="12" fill="#888">
                Aug 6
              </text>
              <text x="310" y="195" fontSize="12" fill="#888">
                Aug 7
              </text>
              {/* Y axis label */}
              <text x="0" y="20" fontSize="12" fill="#888">
                Orders
              </text>
            </svg>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white shadow-sm rounded-xl p-6 lg:col-span-2 h-80 flex flex-col">
          <h4 className="text-lg font-semibold mb-4">Recent Orders</h4>
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-sellsense-background-light">
                  <th className="text-left p-2 font-semibold">Order #</th>
                  <th className="text-left p-2 font-semibold">Buyer</th>
                  <th className="text-left p-2 font-semibold">Product</th>
                  <th className="text-left p-2 font-semibold">Date</th>
                  <th className="text-left p-2 font-semibold">Amount</th>
                  <th className="text-left p-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2">20567</td>
                  <td className="p-2">Lisa Wong</td>
                  <td className="p-2">Canvas Tote Bag</td>
                  <td className="p-2">2024-08-07</td>
                  <td className="p-2">$59.99</td>
                  <td className="p-2 text-sellsense-success font-medium">
                    Paid
                  </td>
                </tr>
                <tr>
                  <td className="p-2">20566</td>
                  <td className="p-2">Priya Patel</td>
                  <td className="p-2">Bluetooth Headphones</td>
                  <td className="p-2">2024-08-07</td>
                  <td className="p-2">$120.00</td>
                  <td className="p-2 text-sellsense-warning font-medium">
                    Shipped
                  </td>
                </tr>
                <tr>
                  <td className="p-2">20565</td>
                  <td className="p-2">Samuel Green</td>
                  <td className="p-2">Stainless Steel Pan</td>
                  <td className="p-2">2024-08-07</td>
                  <td className="p-2">$45.50</td>
                  <td className="p-2 text-sellsense-success font-medium">
                    Delivered
                  </td>
                </tr>
                <tr>
                  <td className="p-2">20564</td>
                  <td className="p-2">Lisa Wong</td>
                  <td className="p-2">Ceramic Vase</td>
                  <td className="p-2">2024-08-06</td>
                  <td className="p-2">$32.00</td>
                  <td className="p-2 text-sellsense-error font-medium">
                    Returned
                  </td>
                </tr>
                <tr>
                  <td className="p-2">20563</td>
                  <td className="p-2">Priya Patel</td>
                  <td className="p-2">Wireless Mouse</td>
                  <td className="p-2">2024-08-06</td>
                  <td className="p-2">$24.99</td>
                  <td className="p-2 text-sellsense-success font-medium">
                    Paid
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

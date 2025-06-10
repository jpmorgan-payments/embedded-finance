import { Info } from 'lucide-react';

export const DemoNotice = () => {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-lg w-auto bg-white shadow-md rounded-lg border border-gray-200 px-3 py-2 opacity-85 hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-2">
        <Info size={16} className="text-gray-500 flex-shrink-0" />
        <p className="text-xs text-gray-600">
          Demo showcase for illustration purposes only. All code as-is. See{' '}
          <a
            href="https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/overview"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            official docs
          </a>
        </p>
      </div>
    </div>
  );
};

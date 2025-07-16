import { Info } from 'lucide-react';

export const DemoNotice = () => {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-auto bg-jpm-brown-100 border-l-4 border-jpm-brown-600 shadow-lg rounded-page-lg px-4 py-2 flex items-center gap-2 opacity-95 hover:opacity-100 transition-opacity flex-nowrap min-w-0">
      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-jpm-brown-50 flex-shrink-0">
        <Info size={16} className="text-jpm-brown-800" />
      </div>
      <p className="text-sm text-jpm-brown-900 font-medium leading-snug min-w-0 overflow-hidden">
        Demo showcase for illustration purposes only. All code as-is. See{' '}
        <a
          href="https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/overview"
          target="_blank"
          rel="noopener noreferrer"
          className="text-jpm-brown-800 hover:text-jpm-brown-900 underline font-semibold focus:outline-none focus:ring-2 focus:ring-jpm-brown-400 rounded"
        >
          official docs
        </a>
      </p>
    </div>
  );
};

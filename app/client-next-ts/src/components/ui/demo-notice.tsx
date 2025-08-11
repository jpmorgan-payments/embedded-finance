import { Info } from 'lucide-react';

export const DemoNotice = () => {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-xl w-auto bg-sp-brand shadow-lg rounded-lg px-3 py-2 flex items-center gap-2 opacity-95 hover:opacity-100 transition-opacity flex-nowrap min-w-0">
      <Info size={12} className="text-white" />
      <p className="text-xs text-white font-medium leading-snug min-w-0 overflow-hidden">
        Demo showcase for illustration purposes only. All code as-is. See{' '}
        <a
          href="https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/overview"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white underline font-semibold focus:outline-none focus:ring-2 focus:ring-sp-border rounded"
        >
          official docs
        </a>
      </p>
    </div>
  );
};

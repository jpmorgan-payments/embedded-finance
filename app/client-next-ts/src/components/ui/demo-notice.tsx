import { Info } from 'lucide-react';

export const DemoNotice = () => {
  return (
    <div className="fixed bottom-2 left-1/2 z-50 flex w-auto min-w-0 max-w-xl -translate-x-1/2 transform flex-nowrap items-center gap-2 rounded-lg bg-sp-brand px-3 py-2 opacity-95 shadow-lg transition-opacity hover:opacity-100">
      <Info size={12} className="text-white" />
      <p className="min-w-0 overflow-hidden text-xs font-medium leading-snug text-white">
        Demo showcase for illustration purposes only. All code as-is. See{' '}
        <a
          href="https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/overview"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded font-semibold text-white underline focus:outline-none focus:ring-2 focus:ring-sp-border"
        >
          official docs
        </a>
      </p>
    </div>
  );
};

import { Check, Code2, ExternalLink } from 'lucide-react';

import type { MaintenanceStep } from './MaintenanceProgress';

const calls = [
  { method: 'GET', path: '/clients/{id}', step: 0 },
  { method: 'PATCH', path: '/parties/{partyId}', step: 0 },
  { method: 'GET', path: '/maintenance-requests?clientId={id}', step: 1 },
  { method: 'PATCH', path: '/clients/{id}', step: 2 },
  { method: 'POST', path: '/clients/{id}/verifications', step: 3 },
];

const stepIndexes: Record<MaintenanceStep, number> = {
  profile: 0,
  review: 1,
  attest: 2,
  submitted: 3,
};

export function ApiSequence({ currentStep }: { currentStep: MaintenanceStep }) {
  const currentIndex = stepIndexes[currentStep];

  return (
    <section
      aria-labelledby="api-sequence-title"
      className="border-y border-gray-200 bg-gray-950 text-gray-100"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <div className="flex shrink-0 items-center gap-2">
          <Code2 className="h-4 w-4 text-cyan-300" />
          <h2 id="api-sequence-title" className="text-xs font-semibold">
            Commerce API sequence
          </h2>
        </div>
        <ol className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 lg:pb-0">
          {calls.map((call) => {
            const complete = call.step < currentIndex;
            const active = call.step === currentIndex;
            return (
              <li
                key={`${call.method}-${call.path}`}
                className={`flex shrink-0 items-center gap-2 rounded border px-2.5 py-1.5 font-mono text-[11px] ${
                  active
                    ? 'border-cyan-300 bg-cyan-950 text-cyan-100'
                    : complete
                      ? 'border-emerald-700 bg-emerald-950 text-emerald-100'
                      : 'border-gray-700 bg-gray-900 text-gray-400'
                }`}
              >
                {complete ? <Check className="h-3 w-3" /> : null}
                <strong>{call.method}</strong>
                <span>{call.path}</span>
              </li>
            );
          })}
        </ol>
        <a
          href="https://developer.payments.jpmorgan.com/docs/commerce/optimization-protection/capabilities/digital-onboarding/how-to/update-party"
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-cyan-200 underline-offset-4 hover:text-cyan-100 hover:underline"
        >
          Official update-party guide
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </section>
  );
}

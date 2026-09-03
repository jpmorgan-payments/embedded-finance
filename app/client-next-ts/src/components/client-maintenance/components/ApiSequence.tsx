import { Check, Code2, ExternalLink } from 'lucide-react';

import type { MaintenanceStep } from './MaintenanceProgress';

const calls = [
  { method: 'GET', path: '/clients/{id}', step: 0 },
  { method: 'PATCH', path: '/clients/{id} · product', step: 0 },
  { method: 'POST', path: '/parties', step: 0 },
  { method: 'PATCH', path: '/parties/{partyId}', step: 0 },
  { method: 'GET', path: '/maintenance-requests?clientId={id}', step: 1 },
  { method: 'GET', path: '/questions?questionIds={ids}', step: 2 },
  { method: 'PATCH', path: '/clients/{id}', step: 2 },
  { method: 'POST', path: '/clients/{id}/verifications', step: 3 },
  { method: 'GET', path: '/questions?questionIds={ids}', step: 4 },
  { method: 'GET', path: '/document-requests/{id}', step: 4 },
];

const stepIndexes: Record<MaintenanceStep, number> = {
  profile: 0,
  review: 1,
  attest: 2,
  submitted: 3,
  information: 4,
};

export function ApiSequence({ currentStep }: { currentStep: MaintenanceStep }) {
  const currentIndex = stepIndexes[currentStep];

  return (
    <section
      aria-labelledby="api-sequence-title"
      className="border-y border-gray-200 bg-gray-950 text-gray-100"
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-cyan-300" />
            <h2 id="api-sequence-title" className="text-xs font-semibold">
              Commerce API sequence
            </h2>
          </div>
          <a
            href="https://developer.payments.jpmorgan.com/docs/commerce/optimization-protection/capabilities/digital-onboarding/how-to/update-party"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200 underline-offset-4 hover:text-cyan-100 hover:underline"
          >
            Official update-party guide
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <ol className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {calls.map((call) => {
            const complete = call.step < currentIndex;
            const active = call.step === currentIndex;
            return (
              <li
                key={`${call.method}-${call.path}-${call.step}`}
                className={`flex min-w-0 items-center gap-2 rounded border px-2.5 py-1.5 font-mono text-[11px] ${
                  active
                    ? 'border-cyan-300 bg-cyan-950 text-cyan-100'
                    : complete
                      ? 'border-emerald-700 bg-emerald-950 text-emerald-100'
                      : 'border-gray-700 bg-gray-900 text-gray-400'
                }`}
              >
                {complete ? <Check className="h-3 w-3 shrink-0" /> : null}
                <strong className="shrink-0">{call.method}</strong>
                <span className="min-w-0 break-normal">{call.path}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

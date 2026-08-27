import { Check, Circle } from 'lucide-react';

export type MaintenanceStep =
  | 'profile'
  | 'review'
  | 'attest'
  | 'submitted'
  | 'information';

const steps: Array<{ id: MaintenanceStep; label: string }> = [
  { id: 'profile', label: 'Disclose changes' },
  { id: 'review', label: 'Review changes' },
  { id: 'attest', label: 'Attest' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'information', label: 'Questions & documents' },
];

export function MaintenanceProgress({
  currentStep,
}: {
  currentStep: MaintenanceStep;
}) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <nav aria-label="Maintenance progress" className="overflow-x-auto">
      <ol className="grid min-w-[46rem] grid-cols-5">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <li
              key={step.id}
              className="relative flex items-center gap-2 pb-4 pr-4"
              aria-current={isCurrent ? 'step' : undefined}
            >
              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={`absolute left-7 right-0 top-3 h-px ${
                    isComplete ? 'bg-sp-brand' : 'bg-gray-300'
                  }`}
                />
              ) : null}
              <span
                className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                  isComplete || isCurrent
                    ? 'border-sp-brand bg-sp-brand text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                {isComplete ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-2.5 w-2.5 fill-current" />
                )}
              </span>
              <span
                className={`relative z-10 bg-white pr-2 text-xs font-semibold ${
                  isCurrent ? 'text-gray-950' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

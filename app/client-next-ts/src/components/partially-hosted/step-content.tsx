import { CheckCircle2 } from 'lucide-react';

import type { IntegrationStep } from '@/components/partially-hosted/integration-steps';

interface StepContentProps {
  step: IntegrationStep;
}

export function StepContent({ step }: StepContentProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">
        What this step covers
      </h3>
      <ul className="space-y-3">
        {step.details.map((detail, index) => (
          <li key={detail + index} className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-sm leading-relaxed text-muted-foreground">
              {detail}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

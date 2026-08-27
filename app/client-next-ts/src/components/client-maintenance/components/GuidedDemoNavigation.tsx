import { ArrowRight, Loader2, Route } from 'lucide-react';

import type { MaintenanceStep } from '@/components/client-maintenance/components/MaintenanceProgress';
import { Button } from '@/components/ui/button';

type GuidedAction = {
  description: string;
  label: string;
};

function getGuidedAction({
  step,
  hasChanges,
  isInformationRequested,
  isComplete,
}: {
  step: MaintenanceStep;
  hasChanges: boolean;
  isInformationRequested: boolean;
  isComplete: boolean;
}): GuidedAction {
  if (isComplete) {
    return {
      label: 'Guided: view approved profile',
      description: 'Return to the profile with the accepted changes applied.',
    };
  }
  if (isInformationRequested) {
    return {
      label: 'Guided: review requested information',
      description:
        'Review the post-verification questions and party-linked document request below.',
    };
  }
  if (step === 'submitted') {
    return {
      label: 'Guided: show information request',
      description:
        'Continue the default illustration with a post-verification information request.',
    };
  }
  if (step === 'attest') {
    return {
      label: 'Guided: attest and submit',
      description:
        'Use the prefilled showcase attester to certify and submit the request.',
    };
  }
  if (step === 'review') {
    return {
      label: 'Guided: continue to attestation',
      description:
        'Accept the default change set for review and continue to certification.',
    };
  }
  if (hasChanges) {
    return {
      label: 'Guided: review default scenario',
      description:
        'The default product and party changes are ready for comparison.',
    };
  }
  return {
    label: 'Guided: load default scenario',
    description:
      'Load the prepared product, new-party, name-change, and party-removal example.',
  };
}

export function GuidedDemoNavigation({
  step,
  hasChanges,
  isInformationRequested,
  isComplete,
  isPending,
  onAction,
}: {
  step: MaintenanceStep;
  hasChanges: boolean;
  isInformationRequested: boolean;
  isComplete: boolean;
  isPending: boolean;
  onAction: () => void;
}) {
  const action = getGuidedAction({
    step,
    hasChanges,
    isInformationRequested,
    isComplete,
  });

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-800">
          <Route className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase text-cyan-800">
            Optional guided path
          </p>
          <p className="mt-1 text-sm text-gray-600">{action.description}</p>
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        className="w-full shrink-0 sm:w-auto"
        disabled={isPending}
        onClick={onAction}
      >
        {isPending ? <Loader2 className="animate-spin" /> : null}
        {action.label}
        {!isPending ? <ArrowRight /> : null}
      </Button>
    </div>
  );
}

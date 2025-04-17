import { InfoIcon } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';

// import { GlobalStepper } from '../../OnboardingGlobalStepper';
import { StepLayout } from '../../StepLayout/StepLayout';

export const OwnersSectionScreen = () => {
  // const globalStepper = GlobalStepper.useStepper();

  return (
    <StepLayout
      title="Owners and key roles"
      description="Provide information for owners and senior managers for your company. Keep in mind that individual people may have multiple roles."
    >
      <Alert variant="informative" className="eb-mt-6">
        <InfoIcon className="eb-h-4 eb-w-4" />
        <AlertDescription className="eb-flex eb-flex-col">
          <p className="eb-mb-2">Organization roles:</p>
          <p className="eb-font-medium">Owners</p>
          <p>Please add all owners holding 25% or more of the business.</p>
        </AlertDescription>
      </Alert>
      <div>hello</div>
    </StepLayout>
  );
};

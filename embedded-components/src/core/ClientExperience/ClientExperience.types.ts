import type { ApprovedClientMaintenanceProps } from '@/core/ApprovedClientMaintenance/ApprovedClientMaintenance.types';
import type { ClientExperienceResolution } from '@/core/ApprovedClientMaintenance/utils/resolveClientExperience';
import type { OnboardingFlowProps } from '@/core/OnboardingFlow';

export type ClientExperienceProps = {
  onboarding: OnboardingFlowProps;
  maintenance: Omit<ApprovedClientMaintenanceProps, 'clientId'>;
  onExperienceResolved?: (resolution: ClientExperienceResolution) => void;
};

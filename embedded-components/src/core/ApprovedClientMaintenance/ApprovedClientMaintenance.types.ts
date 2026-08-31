import type { MaintenanceStatus } from './models/maintenanceApi.types';

export type ApprovedClientMaintenanceOperation = 'EDIT_PARTY_NAME';

export type ApprovedClientMaintenanceEligibilityRule = {
  country: string;
  organizationType: string;
  operations: readonly ApprovedClientMaintenanceOperation[];
};

export type ApprovedClientMaintenanceProps = {
  clientId?: string;
  eligibility: readonly ApprovedClientMaintenanceEligibilityRule[];
  docUploadMaxFileSizeBytes?: number;
  className?: string;
  onStatusChange?: (status: MaintenanceStatus | undefined) => void;
};

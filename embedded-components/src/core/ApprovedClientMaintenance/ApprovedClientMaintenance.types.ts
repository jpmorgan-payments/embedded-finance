import type { MaintenanceStatus } from './models/maintenanceApi.types';

export type ApprovedClientMaintenanceOperation =
  | 'ADD_LIMITED_DDA_PAYMENTS'
  | 'EDIT_ORGANIZATION'
  | 'EDIT_PARTY_NAME'
  | 'EDIT_PARTY_BIRTH_DATE'
  | 'ADD_CONTROLLER'
  | 'ADD_BENEFICIAL_OWNER'
  | 'REMOVE_RELATED_PARTY'
  | 'DISCLOSE_INDIRECT_OWNERSHIP';

export type ApprovedClientMaintenanceEligibilityRule = {
  country: string;
  organizationType: string;
  operations: readonly ApprovedClientMaintenanceOperation[];
};

export type ApprovedClientMaintenanceProps = {
  clientId?: string;
  eligibility: readonly ApprovedClientMaintenanceEligibilityRule[];
  docUploadMaxFileSizeBytes?: number;
  initialProductVerificationAcceptedAt?: string;
  onRequestLimitedDda?: () => void | Promise<void>;
  className?: string;
  onStatusChange?: (status: MaintenanceStatus | undefined) => void;
};

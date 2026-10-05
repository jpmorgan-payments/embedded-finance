import type { KycUpdateRequestStatus } from '@/api/generated/smbdo.schemas';

/** Each operation unlocks one kind of change; a missing operation hides its controls. */
export const APPROVED_CLIENT_MAINTENANCE_OPERATIONS = [
  // Edit the business and its people, replace the controller, and manage direct owners.
  'MANAGE_PROFILE',
  // Request, and cancel, the Limited DDA Payments sub-product.
  'ADD_LIMITED_DDA_PAYMENTS',
  // Intermediary businesses and everyone who owns through them. Requires MANAGE_PROFILE.
  'MANAGE_INDIRECT_OWNERSHIP',
] as const;

export type ApprovedClientMaintenanceOperation =
  (typeof APPROVED_CLIENT_MAINTENANCE_OPERATIONS)[number];

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
  onStatusChange?: (status: KycUpdateRequestStatus | undefined) => void;
};

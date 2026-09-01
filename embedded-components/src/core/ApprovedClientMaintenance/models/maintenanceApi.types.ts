export const ACTIVE_MAINTENANCE_STATUSES = [
  'NEW',
  'REVIEW_IN_PROGRESS',
  'INFORMATION_REQUESTED',
] as const;

export const TERMINAL_MAINTENANCE_STATUSES = [
  'APPROVED',
  'DECLINED',
  'TERMINATED',
] as const;

export type ActiveMaintenanceStatus =
  (typeof ACTIVE_MAINTENANCE_STATUSES)[number];
export type TerminalMaintenanceStatus =
  (typeof TERMINAL_MAINTENANCE_STATUSES)[number];
export type MaintenanceStatus =
  | ActiveMaintenanceStatus
  | TerminalMaintenanceStatus;
export type MaintenanceAction = 'ADD' | 'MODIFY' | 'DELETE';

export type MaintenanceUpdateRequest = {
  status?: MaintenanceStatus;
  action?: MaintenanceAction;
  requestId?: string;
  submittedAt?: string;
};

export type MaintenanceIndividualDetails = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  birthDate?: string;
  countryOfResidence?: string;
};

export type MaintenanceOrganizationDetails = {
  organizationName?: string;
  dbaName?: string;
  organizationType?: string;
  countryOfFormation?: string;
};

export type MaintenanceValidationResponse = {
  validationStatus?: string;
  validationType?: string;
  fields?: unknown[];
  identities?: unknown[];
  documentRequestIds?: string[];
  roleSubType?: unknown[];
};

export type MaintenanceParty = {
  id?: string;
  parentPartyId?: string;
  partyType?: 'INDIVIDUAL' | 'ORGANIZATION' | string;
  roles?: string[];
  profileStatus?: string;
  status?: string;
  active?: boolean;
  individualDetails?: MaintenanceIndividualDetails;
  organizationDetails?: MaintenanceOrganizationDetails;
  validationResponse?: MaintenanceValidationResponse[];
  updateRequest?: MaintenanceUpdateRequest;
};

export type MaintenanceOutstanding = {
  attestationDocumentIds?: string[];
  documentRequestIds?: string[];
  questionIds?: string[];
  partyIds?: string[];
  partyRoles?: string[];
};

export type MaintenanceClient = {
  id: string;
  partyId?: string;
  status: string;
  parties?: MaintenanceParty[];
  products?: unknown[];
  productDetails?: unknown[];
  outstanding?: MaintenanceOutstanding;
  updateRequest?: MaintenanceUpdateRequest;
};

export type MaintenancePageMetadata = {
  page?: number;
  limit?: number;
  total?: number;
};

export type MaintenancePage = {
  parties?: MaintenanceParty[];
  metadata?: MaintenancePageMetadata;
};

export type MaintenanceVerificationResponse = {
  acceptedAt?: string;
};

export type MaintenanceDocumentRequestSummary = {
  id?: string;
  partyId?: string;
  status?: 'ACTIVE' | 'CLOSED' | 'EXPIRED';
};

export const isActiveMaintenanceStatus = (
  status: MaintenanceStatus | undefined
): status is ActiveMaintenanceStatus =>
  status !== undefined &&
  ACTIVE_MAINTENANCE_STATUSES.some((activeStatus) => activeStatus === status);

export const isTerminalMaintenanceStatus = (
  status: MaintenanceStatus | undefined
): status is TerminalMaintenanceStatus =>
  status !== undefined &&
  TERMINAL_MAINTENANCE_STATUSES.some(
    (terminalStatus) => terminalStatus === status
  );

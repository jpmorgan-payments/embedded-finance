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
  natureOfOwnership?: 'Direct' | 'Indirect' | string;
  nameSuffix?: string;
  jobTitle?: string;
  jobTitleDescription?: string;
  addresses?: MaintenanceAddress[];
  individualIds?: MaintenanceIndividualId[];
  phone?: MaintenancePhone;
};

export type MaintenancePhone = {
  phoneType?: string;
  countryCode?: string;
  phoneNumber?: string;
};

export type MaintenanceAddress = {
  addressType?: string;
  addressLines?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type MaintenanceIndividualId = {
  idType?: string;
  value?: string;
  issuer?: string;
};

export type MaintenanceOrganizationId = MaintenanceIndividualId;

export type MaintenanceOrganizationDetails = {
  organizationName?: string;
  dbaName?: string;
  organizationType?: string;
  countryOfFormation?: string;
  natureOfOwnership?: 'Direct' | 'Indirect' | string;
  addresses?: MaintenanceAddress[];
  organizationIds?: MaintenanceOrganizationId[];
  organizationDescription?: string;
  yearOfFormation?: string;
  industryCategory?: string;
  industryType?: string;
  industry?: { codeType?: string; code?: string };
  mcc?: string;
  associatedCountries?: string[];
  phone?: MaintenancePhone;
  website?: string;
  entitiesInOwnership?: boolean;
};

export type MaintenanceProductDetail = {
  product?: string;
  subProduct?: string;
  action?: 'ADD' | 'REMOVE';
  onboardingStatus?: MaintenanceStatus | string;
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
  email?: string;
  externalId?: string;
  individualDetails?: MaintenanceIndividualDetails;
  organizationDetails?: MaintenanceOrganizationDetails;
  validationResponse?: MaintenanceValidationResponse[];
  updateRequest?: MaintenanceUpdateRequest;
};

export type MaintenancePartyUpdateRequest = {
  active?: false;
  email?: string;
  externalId?: string;
  status?: string;
  roles?: string[];
  individualDetails?: MaintenanceIndividualDetails;
  organizationDetails?: MaintenanceOrganizationDetails;
};

export type MaintenancePartyCreateRequest = {
  partyType: 'INDIVIDUAL' | 'ORGANIZATION';
  parentPartyId: string;
  email?: string;
  roles: Array<'CONTROLLER' | 'BENEFICIAL_OWNER' | 'INTERMEDIARY_OWNER'>;
  individualDetails?: MaintenanceIndividualDetails & {
    addresses?: MaintenanceAddress[];
    individualIds?: MaintenanceIndividualId[];
  };
  organizationDetails?: MaintenanceOrganizationDetails;
};

export type MaintenanceProductUpdateRequest = {
  productDetails: Array<{
    product: 'EMBEDDED_PAYMENTS';
    subProduct: 'LIMITED_DDA_PAYMENTS';
    action: 'ADD' | 'REMOVE';
  }>;
};

export type MaintenanceOutstanding = {
  attestationDocumentIds?: string[];
  documentRequestIds?: string[];
  questionIds?: string[];
  partyIds?: string[];
  partyRoles?: string[];
};

export type MaintenanceQuestion = {
  id?: string;
  label: string;
  description?: string;
  responseType?: 'boolean' | 'string' | 'number' | 'integer' | 'enum';
  options?: string[];
};

export type MaintenanceQuestionResponse = {
  questionId: string;
  values: string[];
};

export type MaintenanceAttester = {
  firstName: string;
  middleName?: string;
  lastName: string;
  designation: string;
};

export type MaintenanceAttestation = {
  documentId: string;
  attestationTime: string;
  ipAddress: string;
  attester: MaintenanceAttester;
};

export type MaintenanceClientTaskUpdateRequest = {
  questionResponses?: MaintenanceQuestionResponse[];
  addAttestations?: MaintenanceAttestation[];
};

export type MaintenanceClient = {
  id: string;
  partyId?: string;
  status: string;
  parties?: MaintenanceParty[];
  products?: unknown[];
  productDetails?: MaintenanceProductDetail[];
  outstanding?: MaintenanceOutstanding;
  questionResponses?: MaintenanceQuestionResponse[];
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

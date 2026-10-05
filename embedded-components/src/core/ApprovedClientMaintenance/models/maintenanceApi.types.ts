import { KycUpdateRequestStatus } from '@/api/generated/smbdo.schemas';
import type {
  Attester,
  ClientResponseOutstanding,
  KycUpdateRequest,
  PageMetaData,
  ProductDetailsUpdateAction,
  UpdatePartyRequest,
} from '@/api/generated/smbdo.schemas';

export const ACTIVE_MAINTENANCE_STATUSES = [
  KycUpdateRequestStatus.NEW,
  KycUpdateRequestStatus.REVIEW_IN_PROGRESS,
  KycUpdateRequestStatus.INFORMATION_REQUESTED,
] as const;

export const TERMINAL_MAINTENANCE_STATUSES = [
  KycUpdateRequestStatus.APPROVED,
  KycUpdateRequestStatus.DECLINED,
  KycUpdateRequestStatus.TERMINATED,
] as const;

export type ActiveMaintenanceStatus =
  (typeof ACTIVE_MAINTENANCE_STATUSES)[number];
export type TerminalMaintenanceStatus =
  (typeof TERMINAL_MAINTENANCE_STATUSES)[number];

export type MaintenanceIndividualDetails = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  birthDate?: string;
  countryOfResidence?: string;
  natureOfOwnership?: string;
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

export type MaintenanceOrganizationDetails = {
  organizationName?: string;
  dbaName?: string;
  organizationType?: string;
  countryOfFormation?: string;
  natureOfOwnership?: string;
  addresses?: MaintenanceAddress[];
  organizationIds?: MaintenanceIndividualId[];
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
  action?: ProductDetailsUpdateAction;
  onboardingStatus?: string;
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
  partyType?: string;
  roles?: string[];
  profileStatus?: string;
  status?: string;
  active?: boolean;
  email?: string;
  externalId?: string;
  individualDetails?: MaintenanceIndividualDetails;
  organizationDetails?: MaintenanceOrganizationDetails;
  validationResponse?: MaintenanceValidationResponse[];
  updateRequest?: KycUpdateRequest;
};

export type MaintenancePartyUpdateRequest = Omit<
  UpdatePartyRequest,
  'roles' | 'individualDetails' | 'organizationDetails'
> & {
  parentPartyId?: string;
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
    action: ProductDetailsUpdateAction;
  }>;
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

export type MaintenanceAttestation = {
  documentId: string;
  attestationTime: string;
  ipAddress: string;
  attester: Attester;
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
  outstanding?: ClientResponseOutstanding;
  questionResponses?: MaintenanceQuestionResponse[];
  updateRequest?: KycUpdateRequest;
};

export type MaintenancePage = {
  parties?: MaintenanceParty[];
  metadata?: PageMetaData;
};

export const isActiveMaintenanceStatus = (
  status: KycUpdateRequestStatus | undefined
): status is ActiveMaintenanceStatus =>
  status !== undefined &&
  ACTIVE_MAINTENANCE_STATUSES.some((activeStatus) => activeStatus === status);

export const isTerminalMaintenanceStatus = (
  status: KycUpdateRequestStatus | undefined
): status is TerminalMaintenanceStatus =>
  status !== undefined &&
  TERMINAL_MAINTENANCE_STATUSES.some(
    (terminalStatus) => terminalStatus === status
  );

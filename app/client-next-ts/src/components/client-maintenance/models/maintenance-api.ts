// Local prototype types derived from the Commerce Digital Onboarding API v1.4.1.
// They intentionally do not use the Embedded Payments generated API models.
export type ClientStatus =
  | 'APPROVED'
  | 'DECLINED'
  | 'INFORMATION_REQUESTED'
  | 'NEW'
  | 'REVIEW_IN_PROGRESS'
  | 'SUSPENDED'
  | 'TERMINATED';

export type KycUpdateRequestStatus =
  | 'NEW'
  | 'REVIEW_IN_PROGRESS'
  | 'INFORMATION_REQUESTED'
  | 'APPROVED'
  | 'DECLINED'
  | 'TERMINATED';

export type ActiveKycUpdateRequestStatus = Extract<
  KycUpdateRequestStatus,
  'NEW' | 'REVIEW_IN_PROGRESS' | 'INFORMATION_REQUESTED'
>;

export type KycUpdateRequestAction = 'ADD' | 'MODIFY' | 'DELETE';

export type ClientProduct = 'EMBEDDED_PAYMENTS' | 'MERCHANT_SERVICES';

export type ClientSubProduct = 'LIMITED_DDA' | 'LIMITED_DDA_PAYMENTS' | 'FX';

export type ProductDetailsOnboardingStatus = ClientStatus;

export type ProductDetailsStatusItem = {
  product: ClientProduct;
  subProduct?: ClientSubProduct;
  onboardingStatus: ProductDetailsOnboardingStatus;
};

export type ProductDetailsUpdateItem = {
  product: ClientProduct;
  subProduct?: ClientSubProduct;
  action: 'ADD' | 'REMOVE';
};

export type ClientProductUpdate = {
  productDetails: ProductDetailsUpdateItem[];
};

export type IndividualJobTitle =
  | 'CEO'
  | 'CFO'
  | 'COO'
  | 'President'
  | 'Chairman'
  | 'Senior Branch Manager'
  | 'Other';

export type PartyRole =
  | 'AUTHORIZED_USER'
  | 'BENEFICIAL_OWNER'
  | 'CLIENT'
  | 'CONTROLLER'
  | 'DIRECTOR'
  | 'INTERMEDIARY_OWNER'
  | 'PRIMARY_CONTACT'
  | 'TRUSTEE';

export type Address = {
  addressType?:
    | 'LEGAL_ADDRESS'
    | 'MAILING_ADDRESS'
    | 'BUSINESS_ADDRESS'
    | 'RESIDENTIAL_ADDRESS';
  addressLines: string[];
  city: string;
  state?: string;
  postalCode: string;
  country: string;
};

export type Phone = {
  phoneType?: 'BUSINESS_PHONE' | 'MOBILE_PHONE' | 'ALTERNATE_PHONE';
  countryCode: string;
  phoneNumber: string;
};

export type IndividualIdentity = {
  idType:
    | 'SSN'
    | 'ITIN'
    | 'NATIONAL_ID'
    | 'DRIVERS_LICENSE'
    | 'PASSPORT'
    | 'SOCIAL_INSURANCE_NUMBER'
    | 'OTHER_GOVERNMENT_ID';
  value: string;
  issuer: string;
};

export type OrganizationIdentity = {
  idType:
    | 'EIN'
    | 'BUSINESS_REGISTRATION_ID'
    | 'BUSINESS_NUMBER'
    | 'BUSINESS_REGISTRATION_NUMBER'
    | 'OTHER_GOVERNMENT_ID';
  value: string;
  issuer: string;
};

export type IndividualDetails = {
  addresses?: Address[];
  birthDate?: string;
  countryOfResidence?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  individualIds?: IndividualIdentity[];
  jobTitle?: IndividualJobTitle;
  jobTitleDescription?: string;
  natureOfOwnership?: 'Direct' | 'Indirect';
  phone?: Phone;
};

export type OrganizationDetails = {
  addresses?: Address[];
  countryOfFormation?: string;
  dbaName?: string;
  industryCategory?: string;
  industryType?: string;
  organizationDescription?: string;
  organizationIds?: OrganizationIdentity[];
  organizationName?: string;
  organizationType?: string;
  phone?: Phone;
  website?: string;
  yearOfFormation?: string;
};

export type KycUpdateRequest = {
  status?: KycUpdateRequestStatus;
  action?: KycUpdateRequestAction;
  requestId?: string;
  submittedAt?: string;
};

export type PartyResponse = {
  id?: string;
  email?: string;
  active?: boolean;
  partyType?: 'INDIVIDUAL' | 'ORGANIZATION';
  parentPartyId?: string;
  profileStatus?: ClientStatus;
  roles?: PartyRole[];
  individualDetails?: IndividualDetails;
  organizationDetails?: OrganizationDetails;
  updateRequest?: KycUpdateRequest;
};

// Fields exposed by this illustration follow the narrower update-party guide.
export type MaintenancePartyUpdate = {
  active?: false;
  individualDetails?: Pick<
    IndividualDetails,
    'firstName' | 'middleName' | 'lastName' | 'birthDate'
  >;
  organizationDetails?: Pick<
    OrganizationDetails,
    'organizationName' | 'dbaName' | 'addresses'
  >;
};

export type MaintenancePartyCreate = {
  parentPartyId: string;
  partyType: 'INDIVIDUAL' | 'ORGANIZATION';
  roles: PartyRole[];
  email?: string;
  individualDetails?: IndividualDetails;
  organizationDetails?: OrganizationDetails;
};

export type ClientResponse = {
  id: string;
  partyId: string;
  products: ClientProduct[];
  productDetails?: ProductDetailsStatusItem[];
  parties: PartyResponse[];
  status: ClientStatus;
  updateRequest?: KycUpdateRequest;
  outstanding: {
    attestationDocumentIds: string[];
    documentRequestIds: string[];
    partyIds: string[];
    partyRoles: PartyRole[];
    questionIds: string[];
  };
};

export type ListKycPartyUpdateRequests = {
  parties: PartyResponse[];
  metadata: {
    page: number;
    limit: number;
    total: number;
  };
};

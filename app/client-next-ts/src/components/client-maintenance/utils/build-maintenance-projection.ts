import isEqual from 'lodash/isEqual';

import type {
  ActiveKycUpdateRequestStatus,
  ClientResponse,
  KycUpdateRequest,
  KycUpdateRequestAction,
  PartyResponse,
  ProductDetailsStatusItem,
} from '@/components/client-maintenance/models/maintenance-api';

const ACTIVE_STATUSES = new Set<ActiveKycUpdateRequestStatus>([
  'NEW',
  'REVIEW_IN_PROGRESS',
  'INFORMATION_REQUESTED',
]);

export type EditablePartyPath =
  | 'active'
  | 'email'
  | 'roles'
  | 'individualDetails.firstName'
  | 'individualDetails.middleName'
  | 'individualDetails.lastName'
  | 'individualDetails.birthDate'
  | 'individualDetails.countryOfResidence'
  | 'individualDetails.jobTitle'
  | 'individualDetails.jobTitleDescription'
  | 'individualDetails.natureOfOwnership'
  | 'individualDetails.addresses'
  | 'individualDetails.phone'
  | 'individualDetails.individualIds'
  | 'organizationDetails.organizationName'
  | 'organizationDetails.dbaName'
  | 'organizationDetails.organizationDescription'
  | 'organizationDetails.organizationType'
  | 'organizationDetails.countryOfFormation'
  | 'organizationDetails.yearOfFormation'
  | 'organizationDetails.industryCategory'
  | 'organizationDetails.industryType'
  | 'organizationDetails.addresses'
  | 'organizationDetails.phone'
  | 'organizationDetails.organizationIds'
  | 'organizationDetails.website';

export type ChangeSource = {
  requestId: string;
  submittedAt: string;
  status: ActiveKycUpdateRequestStatus;
};

export type FieldChange = {
  path: EditablePartyPath;
  label: string;
  approvedValue: unknown;
  proposedValue: unknown;
  sensitivity: 'public' | 'masked';
  source: ChangeSource;
  supersededSources: ChangeSource[];
};

export type PartyChange = {
  partyId: string;
  partyName: string;
  action: KycUpdateRequestAction;
  removesParty: boolean;
  approvedParty?: PartyResponse;
  proposedParty?: PartyResponse;
  fieldChanges: FieldChange[];
};

export type ProductChange = {
  product: ProductDetailsStatusItem['product'];
  subProduct?: ProductDetailsStatusItem['subProduct'];
  action: 'ADD';
  source: ChangeSource;
};

export type MaintenanceProjection = {
  approvedClient: ClientResponse;
  proposedClient: ClientResponse;
  productChanges: ProductChange[];
  partyChanges: PartyChange[];
  activeProposals: PartyResponse[];
  historicalProposals: PartyResponse[];
  unresolvedProposals: PartyResponse[];
};

type FieldDescriptor = {
  path: EditablePartyPath;
  label: string;
  sensitivity?: 'public' | 'masked';
  isPresent: (party: PartyResponse) => boolean;
  read: (party: PartyResponse) => unknown;
  write: (party: PartyResponse, value: unknown) => void;
};

type ProposalValue = {
  source: ChangeSource;
  value: unknown;
};

const hasOwn = (value: object, key: PropertyKey): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

function topLevelDescriptor(
  path: Extract<EditablePartyPath, 'active' | 'email' | 'roles'>,
  label: string
): FieldDescriptor {
  return {
    path,
    label,
    isPresent: (party) => hasOwn(party, path),
    read: (party) => party[path],
    write: (party, value) => {
      if (path === 'active') party.active = value as boolean | undefined;
      if (path === 'email') party.email = value as string | undefined;
      if (path === 'roles') party.roles = value as PartyResponse['roles'];
    },
  };
}

function individualDescriptor(
  key: keyof NonNullable<PartyResponse['individualDetails']>,
  label: string,
  sensitivity: 'public' | 'masked' = 'public'
): FieldDescriptor {
  return {
    path: `individualDetails.${key}` as EditablePartyPath,
    label,
    sensitivity,
    isPresent: (party) =>
      party.individualDetails !== undefined &&
      hasOwn(party.individualDetails, key),
    read: (party) => party.individualDetails?.[key],
    write: (party, value) => {
      party.individualDetails ??= {};
      Object.assign(party.individualDetails, { [key]: value });
    },
  };
}

function organizationDescriptor(
  key: keyof NonNullable<PartyResponse['organizationDetails']>,
  label: string,
  sensitivity: 'public' | 'masked' = 'public'
): FieldDescriptor {
  return {
    path: `organizationDetails.${key}` as EditablePartyPath,
    label,
    sensitivity,
    isPresent: (party) =>
      party.organizationDetails !== undefined &&
      hasOwn(party.organizationDetails, key),
    read: (party) => party.organizationDetails?.[key],
    write: (party, value) => {
      party.organizationDetails ??= {};
      Object.assign(party.organizationDetails, { [key]: value });
    },
  };
}

const FIELD_DESCRIPTORS: FieldDescriptor[] = [
  topLevelDescriptor('active', 'Active'),
  topLevelDescriptor('email', 'Email'),
  topLevelDescriptor('roles', 'Roles'),
  individualDescriptor('firstName', 'First name'),
  individualDescriptor('middleName', 'Middle name'),
  individualDescriptor('lastName', 'Last name'),
  individualDescriptor('birthDate', 'Date of birth', 'masked'),
  individualDescriptor('countryOfResidence', 'Country of residence'),
  individualDescriptor('jobTitle', 'Job title'),
  individualDescriptor('jobTitleDescription', 'Job title description'),
  individualDescriptor('natureOfOwnership', 'Nature of ownership'),
  individualDescriptor('addresses', 'Residential address'),
  individualDescriptor('phone', 'Phone'),
  individualDescriptor('individualIds', 'Government identification', 'masked'),
  organizationDescriptor('organizationName', 'Legal business name'),
  organizationDescriptor('dbaName', 'Doing business as'),
  organizationDescriptor('organizationDescription', 'Business description'),
  organizationDescriptor('organizationType', 'Organization type'),
  organizationDescriptor('countryOfFormation', 'Country of formation'),
  organizationDescriptor('yearOfFormation', 'Year of formation'),
  organizationDescriptor('industryCategory', 'Industry category'),
  organizationDescriptor('industryType', 'Industry type'),
  organizationDescriptor('addresses', 'Business address'),
  organizationDescriptor('phone', 'Business phone'),
  organizationDescriptor(
    'organizationIds',
    'Business identification',
    'masked'
  ),
  organizationDescriptor('website', 'Website'),
];

function getChangeSourceFromRequest(
  request: KycUpdateRequest | undefined
): ChangeSource | undefined {
  if (
    request?.requestId === undefined ||
    request.submittedAt === undefined ||
    request.status === undefined ||
    !ACTIVE_STATUSES.has(request.status as ActiveKycUpdateRequestStatus)
  ) {
    return undefined;
  }
  return {
    requestId: request.requestId,
    submittedAt: request.submittedAt,
    status: request.status as ActiveKycUpdateRequestStatus,
  };
}

function getChangeSource(party: PartyResponse): ChangeSource | undefined {
  return getChangeSourceFromRequest(party.updateRequest);
}

function getPartyName(party: PartyResponse | undefined): string {
  if (!party) return 'Unknown party';
  const organizationName = party.organizationDetails?.organizationName;
  if (organizationName) return organizationName;
  const individualName = [
    party.individualDetails?.firstName,
    party.individualDetails?.lastName,
  ]
    .filter(Boolean)
    .join(' ');
  return individualName || party.email || party.id || 'Unknown party';
}

function withoutUpdateRequest(party: PartyResponse): PartyResponse {
  const { updateRequest: _updateRequest, ...approvedShape } = party;
  return structuredClone(approvedShape);
}

function bySubmissionThenRequestId(
  left: PartyResponse,
  right: PartyResponse
): number {
  const leftRequest = left.updateRequest;
  const rightRequest = right.updateRequest;
  return (
    (leftRequest?.submittedAt ?? '').localeCompare(
      rightRequest?.submittedAt ?? ''
    ) ||
    (leftRequest?.requestId ?? '').localeCompare(rightRequest?.requestId ?? '')
  );
}

export function buildMaintenanceProjection(
  clientResponse: ClientResponse,
  maintenanceParties: PartyResponse[]
): MaintenanceProjection {
  const approvedClient = structuredClone(clientResponse);
  const productSource = getChangeSourceFromRequest(
    clientResponse.updateRequest
  );
  const activeProductDetails = productSource
    ? (approvedClient.productDetails ?? []).filter((detail) =>
        ACTIVE_STATUSES.has(
          detail.onboardingStatus as ActiveKycUpdateRequestStatus
        )
      )
    : [];
  approvedClient.productDetails = (approvedClient.productDetails ?? []).filter(
    (detail) =>
      !ACTIVE_STATUSES.has(
        detail.onboardingStatus as ActiveKycUpdateRequestStatus
      )
  );
  delete approvedClient.updateRequest;

  const proposedClient = structuredClone(approvedClient);
  const productChanges: ProductChange[] = [];
  if (productSource) {
    for (const detail of activeProductDetails) {
      proposedClient.productDetails ??= [];
      proposedClient.productDetails.push(structuredClone(detail));
      if (!proposedClient.products.includes(detail.product)) {
        proposedClient.products.push(detail.product);
      }
      productChanges.push({
        product: detail.product,
        subProduct: detail.subProduct,
        action: 'ADD',
        source: productSource,
      });
    }
  }
  const proposedById = new Map(
    proposedClient.parties.flatMap((party) =>
      party.id ? [[party.id, party] as const] : []
    )
  );
  const approvedById = new Map(
    approvedClient.parties.flatMap((party) =>
      party.id ? [[party.id, party] as const] : []
    )
  );
  const fieldProvenance = new Map<string, ProposalValue[]>();
  const actionByParty = new Map<string, KycUpdateRequestAction>();
  const unresolvedProposals: PartyResponse[] = [];
  const historicalProposals: PartyResponse[] = [];
  const activeProposals: PartyResponse[] = [];

  for (const party of maintenanceParties) {
    const status = party.updateRequest?.status;
    if (
      !status ||
      !ACTIVE_STATUSES.has(status as ActiveKycUpdateRequestStatus)
    ) {
      historicalProposals.push(party);
      continue;
    }
    activeProposals.push(party);
  }

  activeProposals.sort(bySubmissionThenRequestId);

  for (const proposal of activeProposals) {
    const source = getChangeSource(proposal);
    const action = proposal.updateRequest?.action;
    const partyId = proposal.id;
    if (!source || !action || !partyId) {
      unresolvedProposals.push(proposal);
      continue;
    }

    if (action === 'ADD') {
      if (proposedById.has(partyId)) {
        unresolvedProposals.push(proposal);
        continue;
      }
      const proposedParty = withoutUpdateRequest(proposal);
      proposedClient.parties.push(proposedParty);
      proposedById.set(partyId, proposedParty);
      actionByParty.set(partyId, action);
      for (const descriptor of FIELD_DESCRIPTORS) {
        if (descriptor.isPresent(proposal)) {
          fieldProvenance.set(`${partyId}:${descriptor.path}`, [
            { source, value: descriptor.read(proposal) },
          ]);
        }
      }
      continue;
    }

    const proposedParty = proposedById.get(partyId);
    if (!proposedParty) {
      unresolvedProposals.push(proposal);
      continue;
    }

    if (
      action === 'DELETE' ||
      (action === 'MODIFY' && proposal.active === false)
    ) {
      if (proposal.active === false) {
        fieldProvenance.set(`${partyId}:active`, [{ source, value: false }]);
      }
      proposedClient.parties = proposedClient.parties.filter(
        (party) => party.id !== partyId
      );
      proposedById.delete(partyId);
      actionByParty.set(partyId, action);
      continue;
    }

    actionByParty.set(partyId, action);
    for (const descriptor of FIELD_DESCRIPTORS) {
      if (!descriptor.isPresent(proposal)) continue;
      const value = structuredClone(descriptor.read(proposal));
      descriptor.write(proposedParty, value);
      const provenanceKey = `${partyId}:${descriptor.path}`;
      const entries = fieldProvenance.get(provenanceKey) ?? [];
      entries.push({ source, value });
      fieldProvenance.set(provenanceKey, entries);
    }
  }

  const partyIds = new Set([...approvedById.keys(), ...proposedById.keys()]);
  const partyChanges: PartyChange[] = [];

  for (const partyId of partyIds) {
    const approvedParty = approvedById.get(partyId);
    const proposedParty = proposedById.get(partyId);
    const action = actionByParty.get(partyId);
    if (!action) continue;

    const fieldChanges: FieldChange[] = [];
    for (const descriptor of FIELD_DESCRIPTORS) {
      const approvedValue = approvedParty
        ? descriptor.read(approvedParty)
        : undefined;
      const entries =
        fieldProvenance.get(`${partyId}:${descriptor.path}`) ?? [];
      const proposedValue = proposedParty
        ? descriptor.read(proposedParty)
        : entries.at(-1)?.value;
      if (isEqual(approvedValue, proposedValue)) continue;

      const latestEntry = entries.at(-1);
      if (!latestEntry) continue;
      const fieldChange: FieldChange = {
        path: descriptor.path,
        label: descriptor.label,
        approvedValue,
        proposedValue,
        sensitivity: descriptor.sensitivity ?? 'public',
        source: latestEntry.source,
        supersededSources: entries.slice(0, -1).map((entry) => entry.source),
      };
      fieldChanges.push(fieldChange);
    }

    partyChanges.push({
      partyId,
      partyName: getPartyName(proposedParty ?? approvedParty),
      action,
      removesParty: approvedParty !== undefined && proposedParty === undefined,
      approvedParty,
      proposedParty,
      fieldChanges,
    });
  }

  return {
    approvedClient,
    proposedClient,
    productChanges,
    partyChanges,
    activeProposals,
    historicalProposals,
    unresolvedProposals,
  };
}

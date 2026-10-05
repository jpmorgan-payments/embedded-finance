import type { Meta, StoryObj } from '@storybook/react-vite';

import { ApprovedClientMaintenance } from '../../ApprovedClientMaintenance';
import type {
  MaintenanceClient,
  MaintenanceParty,
} from '../../models/maintenanceApi.types';
import {
  LLC_WITH_DIRECT_OWNERS,
  ORGANIZATION_PARTY_ID,
  PETER,
  TINKER,
} from '../support/maintenanceStoryClients';
import {
  identityDocumentRequest,
  pendingUpdate,
  type StoryQuestion,
} from '../support/maintenanceStoryHandlers';
import {
  maintenanceStoryArgs,
  maintenanceStoryArgTypes,
  maintenanceStoryDecorator,
  withScenario,
  type MaintenanceStoryArgs,
} from '../support/maintenanceStoryMeta';

// A small draft so Review and submit leads to the blocked submission section.
const DBA_EDIT: MaintenanceParty = {
  id: ORGANIZATION_PARTY_ID,
  organizationDetails: { dbaName: 'Neverland Books Co.' },
  updateRequest: pendingUpdate(),
};

const withPeter = (changes: Partial<MaintenanceParty>): MaintenanceClient => ({
  ...LLC_WITH_DIRECT_OWNERS,
  parties: LLC_WITH_DIRECT_OWNERS.parties?.map((party) =>
    party.id === PETER.id ? { ...party, ...changes } : party
  ),
});

const CONTROLLER_WITHOUT_NAME = withPeter({
  individualDetails: {
    ...PETER.individualDetails,
    firstName: undefined,
    lastName: undefined,
  },
  validationResponse: [
    {
      validationStatus: 'NEEDS_INFO',
      validationType: 'ENTITY_VALIDATION',
      fields: [{ name: 'firstName' }, { name: 'lastName' }],
      documentRequestIds: [],
    },
  ],
});

const QUESTIONS: StoryQuestion[] = [
  {
    id: '30005',
    label: 'Does the business send payments to other countries?',
    options: ['Yes', 'No'],
  },
  {
    id: '30026',
    label: 'Describe the source of funds for the business.',
  },
];

/**
 * Work the API returns in `outstanding` that blocks submission. Open Review
 * and submit to see how each item is listed and completed.
 */
const meta: Meta<MaintenanceStoryArgs> = {
  title: 'Draft/ApprovedClientMaintenance/Edge cases/Outstanding information',
  component: ApprovedClientMaintenance,
  decorators: [maintenanceStoryDecorator],
  parameters: { layout: 'padded' },
  args: maintenanceStoryArgs,
  argTypes: maintenanceStoryArgTypes,
  render: (args) => <ApprovedClientMaintenance {...args} />,
};

export default meta;
type Story = StoryObj<MaintenanceStoryArgs>;

/**
 * Observed 2026-09-30: the API flags the controller for `firstName` and
 * `lastName` with no document request, because the name is missing. The
 * review lists the fields, names the person by role, and links to their form.
 */
export const MissingNameRequested: Story = {
  parameters: withScenario({
    client: CONTROLLER_WITHOUT_NAME,
    proposals: [DBA_EDIT],
    outstanding: { partyIds: [PETER.id!] },
  }),
};

/** The API needs information from a person but names no fields. */
export const UnspecifiedInformationRequested: Story = {
  parameters: withScenario({
    client: withPeter({
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          documentRequestIds: [],
        },
      ],
    }),
    proposals: [DBA_EDIT],
    outstanding: { partyIds: [PETER.id!] },
  }),
};

/** Identity documents for two people; each request sits with its person. */
export const RequiredDocuments: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    proposals: [DBA_EDIT],
    documentRequests: [
      identityDocumentRequest(PETER.id!, 'Peter Pan'),
      identityDocumentRequest(TINKER.id!, 'Tinker Bell'),
    ],
  }),
};

/**
 * A document request for a party that isn't on the profile. It's listed
 * under Other required documents instead of being dropped.
 */
export const DocumentForUnknownParty: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    proposals: [DBA_EDIT],
    documentRequests: [identityDocumentRequest('2299999999', 'a former owner')],
  }),
};

/** Client-level questions, one with choices and one free text. */
export const OutstandingQuestions: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    proposals: [DBA_EDIT],
    questions: QUESTIONS,
  }),
};

/** A formal attestation document to review and sign. */
export const OutstandingAttestation: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    proposals: [DBA_EDIT],
    attestationDocumentIds: ['attestation-beneficial-ownership'],
  }),
};

/**
 * The API asks for a role the profile lacks, usually a controller. Approved
 * profiles already have one, so submission is blocked with a contact-support
 * message instead of a way to fix it.
 */
export const MissingRequiredRole: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    proposals: [DBA_EDIT],
    outstanding: { partyRoles: ['CONTROLLER'] },
  }),
};

/** Every kind of outstanding work at once. */
export const EverythingAtOnce: Story = {
  parameters: withScenario({
    client: CONTROLLER_WITHOUT_NAME,
    proposals: [DBA_EDIT],
    outstanding: { partyIds: [PETER.id!] },
    documentRequests: [identityDocumentRequest(TINKER.id!, 'Tinker Bell')],
    questions: QUESTIONS,
    attestationDocumentIds: ['attestation-beneficial-ownership'],
  }),
};

/**
 * OnboardingFlow — Beneficial Owner Invitation
 *
 * Stories demonstrating the `allowBeneficialOwnerInvitation` feature flag
 * that enables inviting beneficial owners to complete their details via self-service.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  DEFAULT_CLIENT_ID,
  defaultHandlers,
  mockClientNew,
  OnboardingFlowTemplate,
  resetAndSeedClient,
} from './story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

// ============================================================================
// Mock Data — Varied Beneficial Owner Scenarios
// ============================================================================

/**
 * Owners section scenario: 2 incomplete BOs alongside the controller.
 * Org + controller data fully populated (from `mockClientNew` base) so the
 * flow recognizes earlier sections as complete and stays on `owners-section`.
 */
const mockClientOwnersWithIncompleteBOs: ClientResponse = {
  ...mockClientNew,
  parties: [
    // Organization party (already complete from mockClientNew)
    ...(mockClientNew.parties?.filter((p) => p.partyType === 'ORGANIZATION') ??
      []),
    // Controller — fully complete (from mockClientNew base)
    ...(mockClientNew.parties?.filter(
      (p) => p.partyType === 'INDIVIDUAL' && p.roles?.includes('CONTROLLER')
    ) ?? []),
    // BO 1 — has email, incomplete (missing birthDate & addresses)
    {
      id: '2000000120',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000111',
      email: 'alice.johnson@acme-llc.com',
      active: true,
      createdAt: '2024-07-10T09:15:00.000Z',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Alice',
        lastName: 'Johnson',
        jobTitle: 'CFO',
        natureOfOwnership: 'Direct',
        countryOfResidence: 'US',
      },
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          fields: [{ name: 'birthDate' }, { name: 'addresses' }],
        },
      ],
    },
    // BO 2 — no email, incomplete (missing phone & IDs)
    {
      id: '2000000121',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000111',
      active: true,
      createdAt: '2024-07-11T14:30:00.000Z',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Marcus',
        lastName: 'Chen',
        jobTitle: 'COO',
        natureOfOwnership: 'Direct',
        countryOfResidence: 'US',
      },
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          fields: [{ name: 'phone' }, { name: 'individualIds' }],
        },
      ],
    },
  ],
  outstanding: {
    ...mockClientNew.outstanding,
    partyIds: ['2000000120', '2000000121'],
  },
};

/**
 * Owners section scenario: 1 BO already invited (has AUTHORIZED_USER), 1 still pending.
 * Demonstrates the "Invited" badge + "Request info by email" button side-by-side.
 */
const mockClientOwnersWithMixedInviteState: ClientResponse = {
  ...mockClientOwnersWithIncompleteBOs,
  parties: mockClientOwnersWithIncompleteBOs.parties?.map((p) =>
    p.id === '2000000120'
      ? { ...p, roles: ['BENEFICIAL_OWNER', 'AUTHORIZED_USER'] }
      : p
  ),
};

/**
 * Review section scenario: 3 BOs — 1 already invited (AUTHORIZED_USER), 2 incomplete.
 * Distinct names/data from the owners-section mock to visually differentiate stories.
 */
const mockClientReviewWithMixedBOs: ClientResponse = {
  ...mockClientNew,
  parties: [
    ...(mockClientNew.parties?.filter((p) => p.partyType === 'ORGANIZATION') ??
      []),
    ...(mockClientNew.parties?.filter(
      (p) => p.partyType === 'INDIVIDUAL' && p.roles?.includes('CONTROLLER')
    ) ?? []),
    // BO 1 — already invited (has AUTHORIZED_USER + email)
    {
      id: '2000000130',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000111',
      email: 'rajesh.kumar@globalventures.io',
      active: true,
      createdAt: '2024-06-28T11:00:00.000Z',
      roles: ['BENEFICIAL_OWNER', 'AUTHORIZED_USER'],
      individualDetails: {
        firstName: 'Rajesh',
        lastName: 'Kumar',
        jobTitle: 'VP of Finance',
        natureOfOwnership: 'Direct',
        countryOfResidence: 'US',
      },
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          fields: [{ name: 'birthDate' }, { name: 'addresses' }],
        },
      ],
    },
    // BO 2 — incomplete, has email, not invited
    {
      id: '2000000131',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000111',
      email: 'diana.ross@globalventures.io',
      active: true,
      createdAt: '2024-07-02T16:45:00.000Z',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Diana',
        lastName: 'Ross',
        jobTitle: 'CTO',
        natureOfOwnership: 'Direct',
        countryOfResidence: 'US',
      },
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          fields: [{ name: 'individualIds' }],
        },
      ],
    },
    // BO 3 — incomplete, no email, not invited
    {
      id: '2000000132',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000111',
      active: true,
      createdAt: '2024-07-05T08:20:00.000Z',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'James',
        lastName: 'Okafor',
        jobTitle: 'Director of Operations',
        natureOfOwnership: 'Direct',
        countryOfResidence: 'US',
      },
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          fields: [{ name: 'phone' }, { name: 'addresses' }],
        },
      ],
    },
  ],
  outstanding: {
    ...mockClientNew.outstanding,
    partyIds: ['2000000130', '2000000131', '2000000132'],
  },
};

/**
 * Owners section scenario: 4 BOs (max reached) — invite button should be disabled.
 */
const mockClientOwnersFull: ClientResponse = {
  ...mockClientNew,
  parties: [
    ...(mockClientNew.parties?.filter((p) => p.partyType === 'ORGANIZATION') ??
      []),
    ...(mockClientNew.parties?.filter(
      (p) => p.partyType === 'INDIVIDUAL' && p.roles?.includes('CONTROLLER')
    ) ?? []),
    ...['Eva Martinez', "Liam O'Brien", 'Priya Patel', 'Tomasz Nowak'].map(
      (name, i) => ({
        id: `200000014${i}`,
        partyType: 'INDIVIDUAL' as const,
        parentPartyId: '2000000111',
        email: `${name.split(' ')[0].toLowerCase()}@fullcap-corp.com`,
        active: true,
        createdAt: `2024-07-${10 + i}T10:00:00.000Z`,
        roles: ['BENEFICIAL_OWNER' as const],
        individualDetails: {
          firstName: name.split(' ')[0],
          lastName: name.split(' ')[1],
          jobTitle: ['CFO', 'COO', 'CTO', 'CLO'][i],
          natureOfOwnership: 'Direct',
          countryOfResidence: 'US',
        },
      })
    ),
  ],
};

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Beneficial Owner Invitation',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding'],
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: defaultHandlers,
    },
  },
  args: {
    ...commonArgsWithCallbacks,
    allowBeneficialOwnerInvitation: true,
  },
  argTypes: {
    ...commonArgTypes,
    allowBeneficialOwnerInvitation: {
      control: 'boolean',
      description:
        'Enable the beneficial owner invitation feature (invite BO to self-complete)',
      table: { category: 'Feature Flags' },
    },
  },
  render: (args) => <OnboardingFlowTemplate {...args} />,
};

export default meta;
type Story = StoryObj<OnboardingFlowStoryArgs>;

// =============================================================================
// STORIES
// =============================================================================

/**
 * **Owners Section — Invite Enabled**
 *
 * Opens directly at the owners-section screen with `allowBeneficialOwnerInvitation` on.
 * Shows the "Invite Beneficial Owner" button alongside the standard "Add Owner" button.
 * Two incomplete BOs (Alice Johnson and Marcus Chen) are listed.
 */
export const OwnersWithInviteButton: Story = {
  name: 'Owners Section — Invite Enabled',
  loaders: [
    () =>
      resetAndSeedClient(mockClientOwnersWithIncompleteBOs, DEFAULT_CLIENT_ID),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    allowBeneficialOwnerInvitation: true,
    flowEntry: { screenId: 'owners-section' },
  },
};

/**
 * **Owners Section — Invite Disabled (Default)**
 *
 * Same data as above but with `allowBeneficialOwnerInvitation` off.
 * Only the standard "Add Owner" button is visible — no invite button.
 */
export const OwnersWithoutInviteButton: Story = {
  name: 'Owners Section — Invite Disabled (Default)',
  loaders: [
    () =>
      resetAndSeedClient(mockClientOwnersWithIncompleteBOs, DEFAULT_CLIENT_ID),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    allowBeneficialOwnerInvitation: false,
    flowEntry: { screenId: 'owners-section' },
  },
};

/**
 * **Owners Section — Mixed Invite State**
 *
 * One BO already invited (Alice — shows "Invited" badge),
 * one still pending (Marcus — shows "Request info by email" button).
 * Demonstrates both states visible on the same screen.
 */
export const OwnersMixedInviteState: Story = {
  name: 'Owners Section — Mixed (Invited + Pending)',
  loaders: [
    () =>
      resetAndSeedClient(
        mockClientOwnersWithMixedInviteState,
        DEFAULT_CLIENT_ID
      ),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    allowBeneficialOwnerInvitation: true,
    flowEntry: { screenId: 'owners-section' },
  },
};

/**
 * **Owners Section — Max Owners Reached**
 *
 * 4 beneficial owners already exist — the invite button should be disabled.
 * Demonstrates the cap behavior when inviting would exceed the limit.
 */
export const OwnersMaxReached: Story = {
  name: 'Owners Section — Max Owners (Invite Disabled)',
  loaders: [() => resetAndSeedClient(mockClientOwnersFull, DEFAULT_CLIENT_ID)],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    allowBeneficialOwnerInvitation: true,
    flowEntry: { screenId: 'owners-section' },
  },
};

/**
 * **Review — Invite to Complete (Mixed State)**
 *
 * Opens directly at the review step. Shows 3 BOs:
 * - Rajesh Kumar: already invited (AUTHORIZED_USER) — no invite button
 * - Diana Ross: incomplete with email — "Invite to Complete" button visible
 * - James Okafor: incomplete without email — "Invite to Complete" prompts for email
 */
export const ReviewWithInviteToComplete: Story = {
  name: 'Review — Invite to Complete (Mixed)',
  loaders: [
    () => resetAndSeedClient(mockClientReviewWithMixedBOs, DEFAULT_CLIENT_ID),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    allowBeneficialOwnerInvitation: true,
    flowEntry: {
      screenId: 'review-attest-section',
      stepperStepId: 'review',
    },
  },
};

/**
 * **Review — Without Invitation Flag**
 *
 * Same rich data (3 BOs in mixed state) but with the flag off.
 * No "Invite to Complete" buttons should appear.
 */
export const ReviewWithoutInvitationFlag: Story = {
  name: 'Review — No Invitation Flag',
  loaders: [
    () => resetAndSeedClient(mockClientReviewWithMixedBOs, DEFAULT_CLIENT_ID),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    allowBeneficialOwnerInvitation: false,
    flowEntry: {
      screenId: 'review-attest-section',
      stepperStepId: 'review',
    },
  },
};

/**
 * **Owners Section — Invite Completed**
 *
 * Alice Johnson was invited (AUTHORIZED_USER) and has completed all required
 * details. Her badge shows "Completed" instead of "Invited".
 * Marcus Chen remains incomplete with "Request info by email" still visible.
 */
const mockClientOwnersWithCompletedInvite: ClientResponse = {
  ...mockClientOwnersWithIncompleteBOs,
  parties: mockClientOwnersWithIncompleteBOs.parties?.map((p) => {
    if (p.id === '2000000120') {
      // Alice — invited AND fully complete
      return {
        ...p,
        roles: ['BENEFICIAL_OWNER', 'AUTHORIZED_USER'],
        individualDetails: {
          ...p.individualDetails,
          firstName: 'Alice',
          lastName: 'Johnson',
          jobTitle: 'CFO',
          countryOfResidence: 'US',
          natureOfOwnership: 'Direct',
          soleOwner: false,
          birthDate: '1980-03-15',
          addresses: [
            {
              addressType: 'RESIDENTIAL_ADDRESS',
              addressLines: ['100 Park Avenue'],
              city: 'New York',
              state: 'NY',
              postalCode: '10017',
              country: 'US',
            },
          ],
          individualIds: [
            {
              idType: 'SSN',
              issuer: 'US',
              value: '300400005',
            },
          ],
          phone: {
            phoneType: 'MOBILE_PHONE',
            countryCode: '+1',
            phoneNumber: '2125551234',
          },
        },
        validationResponse: [],
      };
    }
    return p;
  }),
};

export const OwnersInviteCompleted: Story = {
  name: 'Owners Section — Invite Completed',
  loaders: [
    () =>
      resetAndSeedClient(
        mockClientOwnersWithCompletedInvite,
        DEFAULT_CLIENT_ID
      ),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    allowBeneficialOwnerInvitation: true,
    flowEntry: { screenId: 'owners-section' },
  },
};

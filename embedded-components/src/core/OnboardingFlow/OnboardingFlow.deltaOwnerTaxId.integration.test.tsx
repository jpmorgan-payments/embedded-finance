/**
 * Integration: delta mode Save & continue persists a beneficial owner's tax id
 * through the real MSW round-trip.
 *
 * Guards the reported "Tinker Ball still says 'This individual is missing some
 * details'" scenario end to end — the owner SSN entered in the delta view must
 * actually reach (and stick on) her party.
 */
import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { db } from '@/msw/db';
import { server } from '@/msw/server';
import { cloneDeep } from 'lodash';
import { beforeEach, describe, expect, test } from 'vitest';
import { screen, userEvent, waitFor, within } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import {
  renderSeededOnboardingFlow,
  setupSeededOnboardingScenarioHooks,
} from '@/core/OnboardingFlow/onboardingSeededScenarioTestUtils';
import { resetAndSeedClient } from '@/core/OnboardingFlow/stories/story-utils';

const CLIENT_ID = 'delta-tinker-client';
const TINKER_ID = '2000000113';

// Rich LLC where the ONLY pending field is Tinker's SSN.
function buildClient(): ClientResponse {
  const client = cloneDeep(efClientCorpEBMock) as ClientResponse;
  client.id = CLIENT_ID;
  client.status = 'NEW';
  client.outstanding = {
    ...client.outstanding,
    questionIds: [],
    partyIds: [],
    partyRoles: [],
    documentRequestIds: [],
    attestationDocumentIds: [],
  };
  client.questionResponses = [];
  client.parties = client.parties?.map((party) =>
    party.id === TINKER_ID && party.individualDetails
      ? {
          ...party,
          individualDetails: { ...party.individualDetails, individualIds: [] },
        }
      : party
  );
  return client;
}

describe('OnboardingFlow delta — owner tax id round-trip', () => {
  setupSeededOnboardingScenarioHooks(server);

  beforeEach(() => {
    resetAndSeedClient(buildClient(), CLIENT_ID);
  });

  test("Tinker's SSN persists to her party after Save & continue", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    renderSeededOnboardingFlow(CLIENT_ID, {
      deltaMode: { enabled: true, maxPendingFields: 5 },
      defaultControllerNotAnOwner: true,
    });

    // Delta overview renders Tinker's pending card.
    const card = (await waitFor(
      () => {
        const el = document.getElementById(
          `delta-section-owners-section:${TINKER_ID}`
        );
        if (!el) throw new Error('Tinker card not found');
        return el;
      },
      { timeout: 10000 }
    )) as HTMLElement;

    // Fill her SSN.
    const ssnInput = within(card).getByLabelText(/social security number/i);
    await user.click(ssnInput);
    await user.type(ssnInput, '123456782');
    await user.tab();

    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    // The real MSW handler must have persisted the SSN onto Tinker's party
    // (proving the delta save actually reaches her, not just validates locally).
    await waitFor(
      () => {
        const tinker = db.party.findFirst({
          where: { id: { equals: TINKER_ID } },
        }) as {
          individualDetails?: { individualIds?: Array<{ value?: string }> };
        } | null;
        expect(tinker?.individualDetails?.individualIds?.[0]?.value).toBe(
          '123456782'
        );
      },
      { timeout: 10000 }
    );

    // Regression for the reported "Maximum 1 IDs allowed" bug: the save must not
    // leave Tinker with duplicate tax-id entries.
    const tinker = db.party.findFirst({
      where: { id: { equals: TINKER_ID } },
    }) as {
      individualDetails?: { individualIds?: Array<unknown> };
    } | null;
    expect(tinker?.individualDetails?.individualIds).toHaveLength(1);
  });

  test('an untouched owner who already has an SSN is not left with duplicate IDs after saving another owner', async () => {
    // Reproduces the reported "controllerIds: Maximum 1 IDs allowed" bug.
    // Tinker already has an SSN and is NOT edited; only Wendy's missing SSN is
    // filled. The delta save must not re-PATCH Tinker with a duplicated
    // individualIds array (controllerIds + solePropSsn both map to
    // individualDetails.individualIds and setValueByPath appends arrays).
    const WENDY_ID = '2000000114';
    const client = cloneDeep(efClientCorpEBMock) as ClientResponse;
    client.id = CLIENT_ID;
    client.status = 'NEW';
    client.outstanding = {
      ...client.outstanding,
      questionIds: [],
      partyIds: [],
      partyRoles: [],
      documentRequestIds: [],
      attestationDocumentIds: [],
    };
    client.questionResponses = [];
    // Tinker keeps her SSN (untouched, complete). Add Wendy missing an SSN.
    const tinkerParty = client.parties?.find((p) => p.id === TINKER_ID);
    const wendy = cloneDeep(tinkerParty)!;
    wendy.id = WENDY_ID;
    wendy.email = 'wendy@neverlandbook.com';
    wendy.individualDetails = {
      ...wendy.individualDetails!,
      firstName: 'Wendy',
      lastName: 'Darling',
      individualIds: [],
    };
    client.parties = [...(client.parties ?? []), wendy];
    resetAndSeedClient(client, CLIENT_ID);

    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderSeededOnboardingFlow(CLIENT_ID, {
      deltaMode: { enabled: true, maxPendingFields: 5 },
      defaultControllerNotAnOwner: true,
    });

    const wendyCard = (await waitFor(
      () => {
        const el = document.getElementById(
          `delta-section-owners-section:${WENDY_ID}`
        );
        if (!el) throw new Error('Wendy card not found');
        return el;
      },
      { timeout: 10000 }
    )) as HTMLElement;

    const ssnInput = within(wendyCard).getByLabelText(
      /social security number/i
    );
    await user.click(ssnInput);
    await user.type(ssnInput, '123456782');
    await user.tab();

    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    await waitFor(
      () => {
        const wendyDb = db.party.findFirst({
          where: { id: { equals: WENDY_ID } },
        }) as {
          individualDetails?: { individualIds?: Array<{ value?: string }> };
        } | null;
        expect(wendyDb?.individualDetails?.individualIds?.[0]?.value).toBe(
          '123456782'
        );
      },
      { timeout: 10000 }
    );

    // Tinker was never edited — her single existing SSN must stay a single ID.
    const tinker = db.party.findFirst({
      where: { id: { equals: TINKER_ID } },
    }) as {
      individualDetails?: { individualIds?: Array<unknown> };
    } | null;
    expect(tinker?.individualDetails?.individualIds).toHaveLength(1);
  });
});

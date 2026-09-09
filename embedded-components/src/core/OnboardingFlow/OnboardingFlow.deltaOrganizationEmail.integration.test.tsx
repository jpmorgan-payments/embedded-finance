import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { db } from '@/msw/db';
import { server } from '@/msw/server';
import { cloneDeep } from 'lodash';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { screen, userEvent, waitFor } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import {
  renderSeededOnboardingFlow,
  setupSeededOnboardingScenarioHooks,
} from '@/core/OnboardingFlow/onboardingSeededScenarioTestUtils';
import { buildDeltaPartyDefaultValues } from '@/core/OnboardingFlow/screens/ReviewAndAttestSectionForms/ReviewForm/DeltaPendingFieldsPanel';
import { resetAndSeedClient } from '@/core/OnboardingFlow/stories/story-utils';

const CLIENT_ID = 'delta-organization-email-client';
const ORGANIZATION_ID = '2000000111';
const CONTROLLER_EMAIL = 'test.test@jpmorgan.com';

function buildClient(organizationEmail: string): ClientResponse {
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
  client.parties = client.parties?.map((party) => {
    if (party.partyType === 'ORGANIZATION') {
      return { ...party, email: organizationEmail };
    }
    if (party.roles?.includes('CONTROLLER')) {
      return { ...party, email: CONTROLLER_EMAIL };
    }
    return party;
  });
  return client;
}

function renderDeltaMode(onPostPartySettled = vi.fn()) {
  renderSeededOnboardingFlow(CLIENT_ID, {
    deltaMode: { enabled: true, maxPendingFields: 5 },
    onPostPartySettled,
  });
  return { onPostPartySettled };
}

describe('OnboardingFlow delta — organization email defaults', () => {
  setupSeededOnboardingScenarioHooks(server);

  beforeEach(() => {
    resetAndSeedClient(buildClient(''), CLIENT_ID);
  });

  test('keeps company email empty and blocks save when only the controller has an email', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const { onPostPartySettled } = renderDeltaMode();

    const companyEmailInput = await screen.findByLabelText(
      /company email address/i,
      undefined,
      { timeout: 10_000 }
    );
    expect(companyEmailInput).toHaveValue('');
    expect(companyEmailInput).not.toHaveValue(CONTROLLER_EMAIL);

    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    await waitFor(() =>
      expect(companyEmailInput).toHaveAttribute('aria-invalid', 'true')
    );
    expect(onPostPartySettled).not.toHaveBeenCalled();

    await user.type(companyEmailInput, 'accounts@neverlandbooks.com');
    await user.tab();
    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    await waitFor(
      () => {
        const organization = db.party.findFirst({
          where: { id: { equals: ORGANIZATION_ID } },
        });
        expect(organization?.email).toBe('accounts@neverlandbooks.com');
      },
      { timeout: 10_000 }
    );
    expect(onPostPartySettled).toHaveBeenCalled();
  });

  test('loads populated organization and controller emails into only their owned fields', () => {
    const client = buildClient('company@neverlandbooks.com');
    const organizationParty = client.parties?.find(
      (party) => party.partyType === 'ORGANIZATION'
    );
    const controllerParty = client.parties?.find((party) =>
      party.roles?.includes('CONTROLLER')
    );
    const { organizationValues, controllerValues } =
      buildDeltaPartyDefaultValues(organizationParty, controllerParty);

    expect(organizationValues).toMatchObject({
      organizationEmail: 'company@neverlandbooks.com',
    });
    expect(organizationValues).not.toHaveProperty('controllerEmail');
    expect(controllerValues).toMatchObject({
      controllerEmail: CONTROLLER_EMAIL,
    });
    expect(controllerValues).not.toHaveProperty('organizationEmail');
  });
});

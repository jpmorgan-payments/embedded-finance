import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import {
  FlowProvider,
  OnboardingContext,
  useFlowContext,
  type OnboardingContextType,
} from '@/core/OnboardingFlow/contexts';
import type { SectionScreenConfig } from '@/core/OnboardingFlow/types/flow.types';

import {
  collectBaselineDeltaPendingGroups,
  collectDeltaPendingFieldErrors,
  computeCompletedDeltaPendingGroupKeys,
} from './DeltaPendingFieldsPanel';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

// LLC with a controller AND a beneficial owner, both present for the identity
// step EXCEPT the tax id — mirrors the delta "missing SSN" scenario.
const clientData = {
  id: 'client-1',
  partyId: 'org-1',
  products: ['EMBEDDED_PAYMENTS'],
  status: 'NEW',
  outstanding: {
    partyIds: [],
    partyRoles: [],
    questionIds: [],
    documentRequestIds: [],
    attestationDocumentIds: [],
  },
  parties: [
    {
      id: 'org-1',
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
      active: true,
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Acme LLC',
        countryOfFormation: 'US',
      },
    },
    {
      id: 'ctrl-1',
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER'],
      active: true,
      individualDetails: {
        firstName: 'Ada',
        lastName: 'Byron',
        birthDate: '1990-01-01',
        countryOfResidence: 'US',
        individualIds: [],
      },
    },
    {
      id: 'owner-1',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      active: true,
      individualDetails: {
        firstName: 'Grace',
        lastName: 'Hopper',
        birthDate: '1985-05-05',
        countryOfResidence: 'US',
        individualIds: [],
      },
    },
  ],
} as unknown as ClientResponse;

const onboardingContext = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY',
  showLinkAccountStep: false,
  showDownloadChecklist: false,
} as unknown as OnboardingContextType;

type Result = {
  baselineKeys: string[];
  completedValidControllerAndOwner: string[];
  completedInvalidSsn: string[];
  invalidSsnFieldErrors: Array<{ formPath: string; message: string }>;
};

function Harness({ onResult }: { onResult: (r: Result) => void }) {
  const { sections } = useFlowContext();
  const ownerSteps =
    flowConfig.screens.find((s) => s.id === 'owner-stepper')?.stepperConfig
      ?.steps ?? [];

  const baseline = collectBaselineDeltaPendingGroups({
    sections: sections as SectionScreenConfig[],
    clientData,
    savedFormValues: undefined,
    currentScreenId: 'overview',
    ownerSteps,
  });

  // Valid SSNs for both the controller (flat) and the owner (nested).
  const validOverlay = {
    controllerIds: [{ idType: 'SSN', issuer: 'US', value: '123456782' }],
    owners: {
      'owner-1': {
        controllerIds: [{ idType: 'SSN', issuer: 'US', value: '212345678' }],
      },
    },
  };
  const completedValid = computeCompletedDeltaPendingGroupKeys({
    baselinePendingGroups: baseline,
    sections: sections as SectionScreenConfig[],
    clientData,
    ownerSteps,
    liveOverlay: validOverlay,
    currentScreenId: 'overview',
  });

  // A well-known invalid SSN (123456789) must NOT satisfy the gate.
  const invalidOverlay = {
    controllerIds: [{ idType: 'SSN', issuer: 'US', value: '123456789' }],
  };
  const completedInvalid = computeCompletedDeltaPendingGroupKeys({
    baselinePendingGroups: baseline,
    sections: sections as SectionScreenConfig[],
    clientData,
    ownerSteps,
    liveOverlay: invalidOverlay,
    currentScreenId: 'overview',
  });

  const invalidSsnFieldErrors = collectDeltaPendingFieldErrors({
    baselinePendingGroups: baseline,
    sections: sections as SectionScreenConfig[],
    clientData,
    ownerSteps,
    liveOverlay: invalidOverlay,
    currentScreenId: 'overview',
  });

  onResult({
    baselineKeys: baseline.map((g) => g.key),
    completedValidControllerAndOwner: [...completedValid],
    completedInvalidSsn: [...completedInvalid],
    invalidSsnFieldErrors,
  });
  return null;
}

describe('delta identity completeness (controller + owner)', () => {
  it('detects both identity groups as pending and clears them with valid SSNs', () => {
    let result: Result | undefined;
    render(
      <QueryClientProvider client={queryClient}>
        <OnboardingContext.Provider value={onboardingContext}>
          <FlowProvider initialScreenId="overview" flowConfig={flowConfig}>
            <Harness
              onResult={(r) => {
                result = r;
              }}
            />
          </FlowProvider>
        </OnboardingContext.Provider>
      </QueryClientProvider>
    );

    // Both identity steps must be detected as pending.
    expect(result?.baselineKeys).toContain(
      'personal-section:identity-document'
    );
    expect(result?.baselineKeys).toContain(
      'owners-section:owner-1:identity-document'
    );

    // Valid SSNs clear both the controller (flat) and owner (nested) groups.
    expect(result?.completedValidControllerAndOwner).toContain(
      'personal-section:identity-document'
    );
    expect(result?.completedValidControllerAndOwner).toContain(
      'owners-section:owner-1:identity-document'
    );

    // A known-invalid SSN must NOT clear the controller group.
    expect(result?.completedInvalidSsn).not.toContain(
      'personal-section:identity-document'
    );

    // ...and it must surface a specific field error for the SSN value so the
    // user can see why "Save & continue" is blocked.
    const ssnError = result?.invalidSsnFieldErrors.find(
      (e) => e.formPath === 'controllerIds.0.value'
    );
    expect(ssnError).toBeDefined();
    expect(ssnError?.message?.length ?? 0).toBeGreaterThan(0);
  });
});

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type {
  MaintenanceClient,
  MaintenanceParty,
} from '@/core/ApprovedClientMaintenance/models/maintenanceApi.types';
import type { OnboardingFlowProps } from '@/core/OnboardingFlow';

import { ClientExperience } from './ClientExperience';

const useMaintenanceWorkspace = vi.fn();

vi.mock('@/core/EBComponentsProvider/EBComponentsProvider', () => ({
  useClientId: () => 'client-1',
  useContentTokens: () => undefined,
}));

vi.mock('@/core/OnboardingFlow', () => ({
  OnboardingFlow: () => <div>Initial onboarding</div>,
}));

vi.mock('@/core/ApprovedClientMaintenance/ApprovedClientMaintenance', () => ({
  ApprovedClientMaintenanceWorkspace: () => (
    <div>Approved client maintenance</div>
  ),
}));

vi.mock(
  '@/core/ApprovedClientMaintenance/hooks/useMaintenanceWorkspace',
  () => ({
    useMaintenanceWorkspace: () => useMaintenanceWorkspace(),
  })
);

const approvedClient: MaintenanceClient = {
  id: 'client-1',
  status: 'APPROVED',
};

const createWorkspace = (client: MaintenanceClient) => ({
  clientQuery: {
    data: client,
    isPending: false,
    isSuccess: true,
    refetch: vi.fn(),
  },
  maintenanceQuery: {
    data: { pages: [], parties: [] as MaintenanceParty[] },
    isPending: false,
    isSuccess: true,
    refetch: vi.fn(),
  },
});

const maintenanceOptions = { eligibility: [] };
const onboardingOptions: OnboardingFlowProps = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
};

describe('ClientExperience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMaintenanceWorkspace.mockReturnValue(createWorkspace(approvedClient));
  });

  test('renders the approved profile experience when there is no active maintenance', () => {
    const onExperienceResolved = vi.fn();
    render(
      <ClientExperience
        onboarding={onboardingOptions}
        maintenance={maintenanceOptions}
        onExperienceResolved={onExperienceResolved}
      />
    );

    expect(screen.getByText('Approved client maintenance')).toBeInTheDocument();
    expect(onExperienceResolved).toHaveBeenCalledWith({
      kind: 'approved-profile',
      hasMaintenanceHistory: false,
    });
  });

  test('routes party-only maintenance after relogin even when the top-level status changed', () => {
    const workspace = createWorkspace({
      ...approvedClient,
      status: 'INFORMATION_REQUESTED',
    });
    workspace.maintenanceQuery.data.parties = [
      { updateRequest: { status: 'INFORMATION_REQUESTED' } },
    ];
    useMaintenanceWorkspace.mockReturnValue(workspace);
    const onExperienceResolved = vi.fn();

    render(
      <ClientExperience
        onboarding={onboardingOptions}
        maintenance={maintenanceOptions}
        onExperienceResolved={onExperienceResolved}
      />
    );

    expect(screen.getByText('Approved client maintenance')).toBeInTheDocument();
    expect(onExperienceResolved).toHaveBeenCalledWith({ kind: 'maintenance' });
  });

  test('routes a review status to onboarding after complete discovery finds no maintenance', () => {
    useMaintenanceWorkspace.mockReturnValue(
      createWorkspace({ ...approvedClient, status: 'REVIEW_IN_PROGRESS' })
    );

    render(
      <ClientExperience
        onboarding={onboardingOptions}
        maintenance={maintenanceOptions}
      />
    );

    expect(screen.getByText('Initial onboarding')).toBeInTheDocument();
  });

  test('blocks routing when maintenance discovery is incomplete', () => {
    const workspace = createWorkspace(approvedClient);
    workspace.maintenanceQuery.isSuccess = false;
    useMaintenanceWorkspace.mockReturnValue(workspace);

    render(
      <ClientExperience
        onboarding={onboardingOptions}
        maintenance={maintenanceOptions}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('Initial onboarding')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Approved client maintenance')
    ).not.toBeInTheDocument();
  });
});

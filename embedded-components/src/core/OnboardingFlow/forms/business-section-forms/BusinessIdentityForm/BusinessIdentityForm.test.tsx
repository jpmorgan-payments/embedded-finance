import { useForm } from 'react-hook-form';
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { Form } from '@/components/ui/form';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import {
  FlowProvider,
  OnboardingContext,
  type OnboardingContextType,
} from '@/core/OnboardingFlow/contexts';

import { BusinessIdentityForm } from './BusinessIdentityForm';

// Mirrors a client created by the gateway: US jurisdiction disables the country field by default.
const usJurisdictionClient = {
  id: '1',
  products: ['EMBEDDED_PAYMENTS'],
  parties: [
    {
      id: '10',
      active: true,
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
      organizationDetails: {
        organizationType: 'C_CORPORATION',
        countryOfFormation: 'US',
        jurisdiction: 'US',
      },
    },
  ],
} as unknown as ClientResponse;

function Harness({ countryOfFormation }: { countryOfFormation: string }) {
  const form = useForm({
    defaultValues: {
      organizationName: 'Big Seller Corp',
      dbaName: '',
      yearOfFormation: '2015',
      countryOfFormation,
      organizationIdEin: '',
      organizationIdRegistration: '',
    },
  });
  return (
    <Form {...form}>
      <BusinessIdentityForm />
    </Form>
  );
}

function renderForm(
  countryOfFormation: string,
  overrides: Partial<OnboardingContextType> = {}
) {
  const context = {
    availableProducts: ['EMBEDDED_PAYMENTS'],
    availableJurisdictions: ['US'],
    clientData: usJurisdictionClient,
    clientGetStatus: 'success',
    setClientId: vi.fn(),
    organizationType: 'C_CORPORATION',
    ...overrides,
  } as OnboardingContextType;
  return render(
    <OnboardingContext.Provider value={context}>
      <FlowProvider initialScreenId="overview" flowConfig={flowConfig}>
        <Harness countryOfFormation={countryOfFormation} />
      </FlowProvider>
    </OnboardingContext.Provider>
  );
}

const EIN_LABEL = /Employer Identification Number/i;
const REGISTRATION_LABEL = /Business Registration ID/i;
const CONTACT_OPERATOR = /outside of the United States/i;

describe('BusinessIdentityForm country of formation', () => {
  test('keeps the US-only default when no countries are configured', async () => {
    renderForm('US');

    expect(await screen.findByLabelText(EIN_LABEL)).toBeInTheDocument();
    expect(screen.getByText(CONTACT_OPERATOR)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.queryByLabelText(REGISTRATION_LABEL)).not.toBeInTheDocument();
  });

  test('lets a business formed in an allowed non-US country enter a registration ID', async () => {
    renderForm('CN', { availableCountriesOfFormation: ['US', 'CN'] });

    expect(
      await screen.findByLabelText(REGISTRATION_LABEL)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(EIN_LABEL)).not.toBeInTheDocument();
    expect(screen.queryByText(CONTACT_OPERATOR)).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeEnabled();
    expect(screen.getByRole('combobox')).toHaveTextContent('[CN]');
  });

  test('still asks a US business for an EIN when non-US countries are allowed', async () => {
    renderForm('US', { availableCountriesOfFormation: ['US', 'CN'] });

    expect(await screen.findByLabelText(EIN_LABEL)).toBeInTheDocument();
    expect(screen.queryByLabelText(REGISTRATION_LABEL)).not.toBeInTheDocument();
  });
});

describe('BusinessIdentityForm.modifyFormValuesBeforeSubmit', () => {
  const modify = BusinessIdentityForm.modifyFormValuesBeforeSubmit!;

  test('submits only the registration ID for a non-US business', () => {
    expect(
      modify(
        {
          countryOfFormation: 'CN',
          organizationIdEin: '125698785',
          organizationIdRegistration: '91310000MA1FL1234X',
          solePropHasEin: '',
        },
        undefined
      )
    ).toEqual({
      countryOfFormation: 'CN',
      organizationIdRegistration: '91310000MA1FL1234X',
    });
  });

  test('submits only the EIN for a US business', () => {
    expect(
      modify(
        {
          countryOfFormation: 'US',
          organizationIdEin: '125698785',
          organizationIdRegistration: '',
          solePropHasEin: '',
        },
        undefined
      )
    ).toEqual({ countryOfFormation: 'US', organizationIdEin: '125698785' });
  });
});

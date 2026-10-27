import { useForm, useWatch } from 'react-hook-form';
import { describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { Form } from '@/components/ui/form';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import {
  FlowProvider,
  OnboardingContext,
  type OnboardingContextType,
} from '@/core/OnboardingFlow/contexts';

import { BusinessContactInfoForm } from './BusinessContactInfoForm';

function clientFormedIn(countryOfFormation: string) {
  return {
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
          countryOfFormation,
        },
      },
    ],
  } as unknown as ClientResponse;
}

function Harness({ primaryAddressLine }: { primaryAddressLine: string }) {
  const form = useForm({
    defaultValues: {
      organizationEmail: '',
      organizationPhone: { phoneType: 'BUSINESS_PHONE', phoneNumber: '' },
      organizationAddress: {
        addressType: 'BUSINESS_ADDRESS',
        primaryAddressLine,
        secondaryAddressLine: '',
        tertiaryAddressLine: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
      },
    },
  });
  const country = useWatch({
    control: form.control,
    name: 'organizationAddress.country',
  });
  return (
    <Form {...form}>
      <output data-testid="address-country">{country}</output>
      <BusinessContactInfoForm />
    </Form>
  );
}

function renderForm(countryOfFormation: string, primaryAddressLine = '') {
  const context = {
    availableProducts: ['EMBEDDED_PAYMENTS'],
    availableJurisdictions: ['US'],
    clientData: clientFormedIn(countryOfFormation),
    clientGetStatus: 'success',
    setClientId: vi.fn(),
    organizationType: 'C_CORPORATION',
  } as OnboardingContextType;
  return render(
    <OnboardingContext.Provider value={context}>
      <FlowProvider initialScreenId="overview" flowConfig={flowConfig}>
        <Harness primaryAddressLine={primaryAddressLine} />
      </FlowProvider>
    </OnboardingContext.Provider>
  );
}

describe('BusinessContactInfoForm address country', () => {
  test('starts a new address in the non-US country of formation', async () => {
    renderForm('CN');

    await waitFor(() =>
      expect(screen.getByTestId('address-country')).toHaveTextContent('CN')
    );
  });

  test('keeps an entered address country that differs from the country of formation', () => {
    renderForm('CN', '1 Market St');

    expect(screen.getByTestId('address-country')).toHaveTextContent('US');
  });

  test('leaves a US business address on US', () => {
    renderForm('US');

    expect(screen.getByTestId('address-country')).toHaveTextContent('US');
  });
});

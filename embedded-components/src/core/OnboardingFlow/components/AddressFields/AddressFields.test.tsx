import { useForm, useWatch } from 'react-hook-form';
import { describe, expect, test, vi } from 'vitest';
import { render, renderHook, screen, userEvent, waitFor } from '@test-utils';

import { Form } from '@/components/ui/form';
import { getAddressValidationIssues } from '@/core/ClientProfile/schemas/getAddressValidationIssues';
import { AddressFields } from '@/core/OnboardingFlow/components/AddressFields/AddressFields';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';
import {
  FlowProvider,
  OnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import { useAddressSchemas } from '@/core/OnboardingFlow/utils/commonSchemas';

const context = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData: undefined,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY',
  showLinkAccountStep: false,
  showDownloadChecklist: false,
  docUploadOnlyMode: false,
  docUploadMaxFileSizeBytes: 8 * 1024 * 1024,
} as OnboardingContextType;

function AddressHarness({
  country,
  initialState = 'HCW',
}: {
  country: string;
  initialState?: string;
}) {
  const form = useForm({
    defaultValues: {
      organizationAddress: {
        country,
        state: initialState,
        postalCode: '12345',
      },
    },
  });
  const state = useWatch({
    control: form.control,
    name: 'organizationAddress.state',
  });
  const postalCode = useWatch({
    control: form.control,
    name: 'organizationAddress.postalCode',
  });

  return (
    <Form {...form}>
      <button
        type="button"
        onClick={() => form.setValue('organizationAddress.country', 'US')}
      >
        Set US
      </button>
      <button
        type="button"
        onClick={() => form.setValue('organizationAddress.country', 'HK')}
      >
        Set HK
      </button>
      <output data-testid="state-value">{state}</output>
      <output data-testid="postal-code-value">{postalCode}</output>
      <AddressFields addressName="organizationAddress" />
    </Form>
  );
}

describe('AddressFields Hong Kong address', () => {
  test.each(['AE', 'QA'] as const)(
    'auto-fills n/a and hides postal code for %s without hiding state',
    async (country) => {
      const { container } = render(
        <OnboardingContext.Provider value={context}>
          <FlowProvider initialScreenId="gateway" flowConfig={flowConfig}>
            <AddressHarness country={country} initialState="" />
          </FlowProvider>
        </OnboardingContext.Provider>
      );

      await waitFor(() =>
        expect(screen.getByTestId('postal-code-value')).toHaveTextContent('n/a')
      );
      expect(
        container.querySelector('[name="organizationAddress.postalCode"]')
      ).not.toBeInTheDocument();
      expect(
        container.querySelector('[name="organizationAddress.state"]')
      ).toBeInTheDocument();

      screen.getByRole('button', { name: 'Set US' }).click();
      await waitFor(() =>
        expect(screen.getByTestId('postal-code-value')).toHaveTextContent(/^$/)
      );
      expect(
        container.querySelector('[name="organizationAddress.postalCode"]')
      ).toBeInTheDocument();
    }
  );

  test('fills HK and n/a without inputs and clears them when changing country', async () => {
    const { container } = render(
      <OnboardingContext.Provider value={context}>
        <FlowProvider initialScreenId="gateway" flowConfig={flowConfig}>
          <AddressHarness country="HK" />
        </FlowProvider>
      </OnboardingContext.Provider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('state-value')).toHaveTextContent(/^HK$/)
    );
    expect(screen.getByTestId('postal-code-value')).toHaveTextContent('n/a');
    expect(
      container.querySelector('[name="organizationAddress.state"]')
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('[name="organizationAddress.postalCode"]')
    ).not.toBeInTheDocument();

    screen.getByRole('button', { name: 'Set US' }).click();
    await waitFor(() =>
      expect(screen.getByTestId('state-value')).toHaveTextContent(/^$/)
    );
    expect(screen.getByTestId('postal-code-value')).toHaveTextContent(/^$/);
    expect(
      container.querySelector('[name="organizationAddress.state"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('[name="organizationAddress.postalCode"]')
    ).toBeInTheDocument();

    screen.getByRole('button', { name: 'Set HK' }).click();
    await waitFor(() =>
      expect(screen.getByTestId('state-value')).toHaveTextContent(/^HK$/)
    );
    expect(screen.getByTestId('postal-code-value')).toHaveTextContent('n/a');
    expect(
      container.querySelector('[name="organizationAddress.state"]')
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('[name="organizationAddress.postalCode"]')
    ).not.toBeInTheDocument();
  });

  test('auto-fills a sole self-code without assuming postal code is unavailable', async () => {
    const { container } = render(
      <OnboardingContext.Provider value={context}>
        <FlowProvider initialScreenId="gateway" flowConfig={flowConfig}>
          <AddressHarness country="SG" />
        </FlowProvider>
      </OnboardingContext.Provider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('state-value')).toHaveTextContent(/^SG$/)
    );
    expect(
      container.querySelector('[name="organizationAddress.state"]')
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('[name="organizationAddress.postalCode"]')
    ).toBeInTheDocument();
    expect(screen.getByTestId('postal-code-value')).toHaveTextContent('12345');
  });

  test('allows entering a state when the country is absent from the snapshot', () => {
    const { container } = render(
      <OnboardingContext.Provider value={context}>
        <FlowProvider initialScreenId="gateway" flowConfig={flowConfig}>
          <AddressHarness country="AX" initialState="" />
        </FlowProvider>
      </OnboardingContext.Provider>
    );

    expect(
      container.querySelector('[name="organizationAddress.state"]')
    ).toHaveAttribute('type', 'text');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('postal-code-value')).toHaveTextContent('12345');
  });

  test('offers snapshot subdivisions even when absent from the legacy static list', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <OnboardingContext.Provider value={context}>
        <FlowProvider initialScreenId="gateway" flowConfig={flowConfig}>
          <AddressHarness country="GB" initialState="" />
        </FlowProvider>
      </OnboardingContext.Provider>
    );

    await user.click(
      container.querySelector('[name="organizationAddress.state"]')!
    );
    expect(await screen.findByText('London, City of')).toBeInTheDocument();
  });

  test('preserves a prefilled state that is absent from the reference options', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <OnboardingContext.Provider value={context}>
        <FlowProvider initialScreenId="gateway" flowConfig={flowConfig}>
          <AddressHarness country="GB" initialState="ENG" />
        </FlowProvider>
      </OnboardingContext.Provider>
    );

    const stateInput = container.querySelector(
      '[name="organizationAddress.state"]'
    );
    expect(stateInput?.tagName).toBe('INPUT');
    expect(stateInput).toHaveValue('ENG');

    await user.clear(stateInput as HTMLInputElement);
    await user.click(
      container.querySelector('[name="organizationAddress.state"]')!
    );
    expect(await screen.findByText('London, City of')).toBeInTheDocument();
  });

  test('accepts a reference-only code without relaxing maintenance validation', () => {
    const address = {
      addressType: 'BUSINESS_ADDRESS' as const,
      primaryAddressLine: '1 Fleet Street',
      secondaryAddressLine: '',
      tertiaryAddressLine: '',
      city: 'London',
      state: 'LND',
      postalCode: 'SW1A 1AA',
      country: 'GB',
    };
    const { result } = renderHook(
      () => useAddressSchemas('organizationAddress'),
      {
        wrapper: ({ children }) => (
          <OnboardingContext.Provider value={context}>
            <FlowProvider initialScreenId="gateway" flowConfig={flowConfig}>
              {children}
            </FlowProvider>
          </OnboardingContext.Provider>
        ),
      }
    );

    expect(result.current.AddressSchema.safeParse(address).success).toBe(true);
    expect(
      getAddressValidationIssues(address).some(
        (issue) => issue.field === 'state'
      )
    ).toBe(true);
  });

  test.each([
    ['GB', 'lnd', true],
    ['GB', 'ENG', false],
    ['RS', '00', true],
  ])(
    'validates %s state %s against the subdivision list',
    (country, state, valid) => {
      const { result } = renderHook(
        () => useAddressSchemas('organizationAddress'),
        {
          wrapper: ({ children }) => (
            <OnboardingContext.Provider value={context}>
              <FlowProvider initialScreenId="gateway" flowConfig={flowConfig}>
                {children}
              </FlowProvider>
            </OnboardingContext.Provider>
          ),
        }
      );
      const parsed = result.current.AddressSchema.safeParse({
        addressType: 'BUSINESS_ADDRESS',
        primaryAddressLine: '1 Main Street',
        secondaryAddressLine: '',
        tertiaryAddressLine: '',
        city: 'Test City',
        state,
        postalCode: country === 'GB' ? 'SW1A 1AA' : '11000',
        country,
      });

      expect(parsed.success).toBe(valid);
    }
  );

  test('uses default labels for TM address validation', () => {
    const { result } = renderHook(
      () => useAddressSchemas('organizationAddress'),
      {
        wrapper: ({ children }) => (
          <OnboardingContext.Provider value={context}>
            <FlowProvider initialScreenId="gateway" flowConfig={flowConfig}>
              {children}
            </FlowProvider>
          </OnboardingContext.Provider>
        ),
      }
    );
    const parsed = result.current.AddressSchema.safeParse({
      addressType: 'BUSINESS_ADDRESS',
      primaryAddressLine: '1 Main Street',
      secondaryAddressLine: '',
      tertiaryAddressLine: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'TM',
    });

    expect(parsed.error?.issues.map((issue) => issue.message)).toEqual([
      'City / Town is required',
      'State / Province / Region is required',
      'Postal code is required',
    ]);
  });
});

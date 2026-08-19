import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, test } from 'vitest';
import { render, screen } from '@test-utils';

import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import {
  FlowProvider,
  OnboardingContext,
  type OnboardingContextType,
} from '@/core/OnboardingFlow/contexts';
import {
  IntermediaryAddressForm,
  useIntermediaryAddressSchema,
} from '@/core/OnboardingFlow/forms/intermediary-section-forms/IntermediaryAddressForm/IntermediaryAddressForm';
import {
  IntermediaryOrgDetailsForm,
  intermediaryOrgDetailsSchema,
} from '@/core/OnboardingFlow/forms/intermediary-section-forms/IntermediaryOrgDetailsForm/IntermediaryOrgDetailsForm';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const ctx = {
  clientData: { id: 'client-1', parties: [] },
  organizationType: 'LIMITED_LIABILITY_COMPANY',
} as unknown as OnboardingContextType;

function FormHarness({
  children,
  defaultValues = {},
}: {
  children: React.ReactNode;
  defaultValues?: Record<string, unknown>;
}) {
  const form = useForm({ defaultValues });
  return (
    <QueryClientProvider client={queryClient}>
      <OnboardingContext.Provider value={ctx}>
        <FlowProvider
          initialScreenId="intermediary-stepper"
          flowConfig={flowConfig}
        >
          <FormProvider {...form}>{children}</FormProvider>
        </FlowProvider>
      </OnboardingContext.Provider>
    </QueryClientProvider>
  );
}

describe('IntermediaryOrgDetailsForm', () => {
  test('schema requires the core organization fields', () => {
    const ok = intermediaryOrgDetailsSchema.safeParse({
      organizationName: 'MidCo',
      organizationType: 'LIMITED_LIABILITY_COMPANY',
      organizationIdEin: '12-3456789',
      countryOfFormation: 'US',
    });
    expect(ok.success).toBe(true);

    const bad = intermediaryOrgDetailsSchema.safeParse({
      organizationName: '',
      organizationType: '',
      organizationIdEin: '',
      countryOfFormation: '',
    });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      expect(bad.error.issues.length).toBeGreaterThanOrEqual(4);
    }
  });

  test('renders the organization detail fields', () => {
    render(
      <FormHarness
        defaultValues={{
          organizationName: 'MidCo',
          organizationType: 'LIMITED_LIABILITY_COMPANY',
          organizationIdEin: '',
          countryOfFormation: 'US',
        }}
      >
        <IntermediaryOrgDetailsForm />
      </FormHarness>
    );

    expect(screen.getByText(/Legal Business Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Organization Type/i)).toBeInTheDocument();
    expect(screen.getByText(/EIN/i)).toBeInTheDocument();
    expect(screen.getByText(/Country of Formation/i)).toBeInTheDocument();
  });
});

describe('IntermediaryAddressForm', () => {
  test('exposes the canonical organization-address schema', () => {
    const { result } = renderHook(() => useIntermediaryAddressSchema(), {
      wrapper: ({ children }) => <FormHarness>{children}</FormHarness>,
    });
    // The returned zod object validates an organizationAddress shape.
    expect(result.current.safeParse({}).success).toBe(false);
  });

  test('forces LEGAL_ADDRESS on submit', () => {
    const out = IntermediaryAddressForm.modifyFormValuesBeforeSubmit?.(
      {
        organizationAddress: {
          addressLines: ['1 Main St'],
          city: 'NYC',
          addressType: 'BUSINESS_ADDRESS',
        },
      } as never,
      undefined
    );
    expect(
      (out as { organizationAddress?: { addressType?: string } })
        ?.organizationAddress?.addressType
    ).toBe('LEGAL_ADDRESS');
  });

  test('renders the address fields', () => {
    render(
      <FormHarness defaultValues={{ organizationAddress: {} }}>
        <IntermediaryAddressForm />
      </FormHarness>
    );
    // AddressFields renders at least one address input group.
    expect(
      screen.getAllByText(/address|country|city|state|postal/i).length
    ).toBeGreaterThan(0);
  });
});

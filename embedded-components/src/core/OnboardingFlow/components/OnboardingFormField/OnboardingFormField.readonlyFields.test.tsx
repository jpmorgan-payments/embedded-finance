/**
 * RTL coverage for the OnboardingFlow `readonlyFields` prop — the host-configured
 * lock that renders selected fields read-only. Verifies the two lock modes
 * (`whenPopulated` default and `always`) and that composite fields
 * (`organizationAddress`) lock every sub-input as a unit.
 */
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { Form } from '@/components/ui/form';
import { AddressFields } from '@/core/OnboardingFlow/components/AddressFields/AddressFields';
import { OnboardingFormField } from '@/core/OnboardingFlow/components/OnboardingFormField/OnboardingFormField';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';
import {
  FlowProvider,
  OnboardingContext,
} from '@/core/OnboardingFlow/contexts';

const orgPartyPopulated = {
  partyType: 'ORGANIZATION',
  organizationDetails: {
    organizationName: 'Acme LLC',
    organizationType: 'LIMITED_LIABILITY_COMPANY',
    addresses: [
      {
        addressType: 'BUSINESS_ADDRESS',
        addressLines: ['1 Main St'],
        city: 'Columbus',
        state: 'OH',
        postalCode: '43004',
        country: 'US',
      },
    ],
  },
};

const clientPopulated = {
  parties: [orgPartyPopulated],
} as unknown as ClientResponse;

const clientEmpty = {
  parties: [
    {
      partyType: 'ORGANIZATION',
      organizationDetails: { organizationType: 'LIMITED_LIABILITY_COMPANY' },
    },
  ],
} as unknown as ClientResponse;

function makeContext(
  overrides: Partial<OnboardingContextType>
): OnboardingContextType {
  return {
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
    ...overrides,
  };
}

function renderInFlow(ui: ReactNode, ctx: OnboardingContextType) {
  return render(
    <OnboardingContext.Provider value={ctx}>
      <FlowProvider initialScreenId="gateway" flowConfig={flowConfig}>
        {ui}
      </FlowProvider>
    </OnboardingContext.Provider>
  );
}

function FieldHarness({
  name,
  defaultValues,
}: {
  name: string;
  defaultValues: Record<string, unknown>;
}) {
  const form = useForm<Record<string, unknown>>({ defaultValues });
  return (
    <Form {...form}>
      <OnboardingFormField control={form.control} name={name} type="text" />
    </Form>
  );
}

function AddressHarness({
  defaultValues,
}: {
  defaultValues: Record<string, unknown>;
}) {
  const form = useForm<Record<string, unknown>>({ defaultValues });
  return (
    <Form {...form}>
      <AddressFields addressName="organizationAddress" />
    </Form>
  );
}

describe('OnboardingFlow readonlyFields', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('locks a listed field that is populated from the GET client', async () => {
    renderInFlow(
      <FieldHarness
        name="organizationName"
        defaultValues={{ organizationName: 'Acme LLC' }}
      />,
      makeContext({
        clientData: clientPopulated,
        readonlyFields: { fields: ['organizationName'] },
      })
    );

    expect(await screen.findByText('Acme LLC')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  test('keeps a listed required field editable while it is still empty', async () => {
    renderInFlow(
      <FieldHarness
        name="organizationName"
        defaultValues={{ organizationName: '' }}
      />,
      makeContext({
        clientData: clientEmpty,
        readonlyFields: { fields: ['organizationName'] },
      })
    );

    expect(await screen.findByRole('textbox')).toBeInTheDocument();
  });

  test('locks a listed optional field even when it is empty', async () => {
    renderInFlow(
      <FieldHarness name="dbaName" defaultValues={{ dbaName: '' }} />,
      makeContext({
        clientData: clientEmpty,
        readonlyFields: { fields: ['dbaName'] },
      })
    );

    // dbaName is optional → locked under the default 'whenPopulated' mode.
    // A locked empty field renders the read-only 'N/A' placeholder.
    expect(await screen.findByText('N/A')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  test("mode 'always' locks a required field even when empty", async () => {
    renderInFlow(
      <FieldHarness
        name="organizationName"
        defaultValues={{ organizationName: '' }}
      />,
      makeContext({
        clientData: clientEmpty,
        readonlyFields: { fields: ['organizationName'], mode: 'always' },
      })
    );

    expect(await screen.findByText('N/A')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  test('does not lock anything when readonlyFields is omitted', async () => {
    renderInFlow(
      <FieldHarness
        name="organizationName"
        defaultValues={{ organizationName: 'Acme LLC' }}
      />,
      makeContext({ clientData: clientPopulated })
    );

    const input = await screen.findByRole('textbox');
    expect(input).toHaveValue('Acme LLC');
  });

  test('locks every sub-input of a populated composite address', async () => {
    renderInFlow(
      <AddressHarness
        defaultValues={{
          organizationAddress: {
            addressType: 'BUSINESS_ADDRESS',
            primaryAddressLine: '1 Main St',
            secondaryAddressLine: '',
            tertiaryAddressLine: '',
            city: 'Columbus',
            state: 'OH',
            postalCode: '43004',
            country: 'US',
          },
        }}
      />,
      makeContext({
        clientData: clientPopulated,
        readonlyFields: { fields: ['organizationAddress'] },
      })
    );

    expect(await screen.findByText('1 Main St')).toBeInTheDocument();
    expect(screen.getByText('Columbus')).toBeInTheDocument();
    // No editable inputs (text) or comboboxes (country/state) remain.
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});

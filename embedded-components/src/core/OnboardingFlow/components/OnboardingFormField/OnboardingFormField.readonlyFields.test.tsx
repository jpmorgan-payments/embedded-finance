/**
 * RTL coverage for the OnboardingFlow `readonlyFields` prop — the host-configured
 * lock that renders selected fields read-only. Verifies the two lock modes
 * (`whenPopulated` default and `always`), that composite fields
 * (`organizationAddress`) lock every sub-input as a unit, and that locks follow
 * the party being edited (controller fields never lock for owners).
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
import type {
  OnboardingContextType,
  ReadonlyFieldsScope,
} from '@/core/OnboardingFlow/contexts';
import {
  FlowProvider,
  OnboardingContext,
  ReadonlyFieldsScopeContext,
} from '@/core/OnboardingFlow/contexts';

const orgPartyPopulated = {
  partyType: 'ORGANIZATION',
  organizationDetails: {
    organizationName: 'Acme LLC',
    dbaName: 'Acme Services',
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
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        dbaName: '',
      },
    },
  ],
} as unknown as ClientResponse;

const orgPartyWithEmail = { ...orgPartyPopulated, email: 'hello@acme.com' };

const controllerWithEmail = {
  id: 'controller',
  partyType: 'INDIVIDUAL',
  roles: ['CONTROLLER'],
  email: 'jane@acme.com',
  individualDetails: { firstName: 'Jane', lastName: 'Doe' },
};

const controllerWithoutEmail = {
  id: 'controller',
  partyType: 'INDIVIDUAL',
  roles: ['CONTROLLER'],
  individualDetails: { firstName: 'Jane', lastName: 'Doe' },
};

const ownerWithEmail = {
  id: 'owner',
  partyType: 'INDIVIDUAL',
  roles: ['BENEFICIAL_OWNER'],
  email: 'bob@acme.com',
  individualDetails: { firstName: 'Bob', lastName: 'Roe' },
};

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

function renderInScope(
  ui: ReactNode,
  ctx: OnboardingContextType,
  scope: ReadonlyFieldsScope
) {
  return renderInFlow(
    <ReadonlyFieldsScopeContext.Provider value={scope}>
      {ui}
    </ReadonlyFieldsScopeContext.Provider>,
    ctx
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

    const box = await screen.findByRole('textbox');
    expect(box).toHaveTextContent('Acme LLC');
    // Read-only display, not an editable input, and announced as read-only.
    expect(box.tagName).toBe('DIV');
    expect(box).toHaveAttribute('aria-readonly', 'true');
    // Associated with its field label so screen readers announce them together.
    expect(box).toHaveAccessibleName(/legal name of the company/i);
    // Greyed, bordered box matching a disabled input.
    expect(box).toHaveClass(
      'eb-border',
      'eb-border-inputBorder',
      'eb-bg-gray-100',
      'eb-opacity-50'
    );
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

    const input = await screen.findByRole('textbox');
    expect(input.tagName).toBe('INPUT');
    expect(input).not.toHaveAttribute('aria-readonly', 'true');
  });

  test('keeps a listed optional field editable while it is still empty', async () => {
    renderInFlow(
      <FieldHarness name="dbaName" defaultValues={{ dbaName: '' }} />,
      makeContext({
        clientData: clientEmpty,
        readonlyFields: { fields: ['dbaName'] },
      })
    );

    const input = await screen.findByRole('textbox');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveValue('');
    expect(input).not.toHaveAttribute('aria-readonly', 'true');
  });

  test('locks a listed optional field when it is populated from the GET client', async () => {
    renderInFlow(
      <FieldHarness
        name="dbaName"
        defaultValues={{ dbaName: 'Acme Services' }}
      />,
      makeContext({
        clientData: clientPopulated,
        readonlyFields: { fields: ['dbaName'] },
      })
    );

    const box = await screen.findByRole('textbox');
    expect(box.tagName).toBe('DIV');
    expect(box).toHaveTextContent('Acme Services');
    expect(box).toHaveAttribute('aria-readonly', 'true');
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

    const box = await screen.findByRole('textbox');
    expect(box).toHaveTextContent('N/A');
    expect(box.tagName).toBe('DIV');
    expect(box).toHaveAttribute('aria-readonly', 'true');
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
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveValue('Acme LLC');
    expect(input).not.toHaveAttribute('aria-readonly', 'true');
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
    // Every sub-input renders as a read-only textbox — no editable inputs or
    // comboboxes (country/state) remain.
    const boxes = screen.getAllByRole('textbox');
    expect(boxes.length).toBeGreaterThan(0);
    boxes.forEach((box) => {
      expect(box.tagName).toBe('DIV');
      expect(box).toHaveAttribute('aria-readonly', 'true');
    });
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  describe('party scope', () => {
    test('keeps controllerEmail editable when only the business email is populated', async () => {
      renderInFlow(
        <FieldHarness
          name="controllerEmail"
          defaultValues={{ controllerEmail: '' }}
        />,
        makeContext({
          clientData: {
            parties: [orgPartyWithEmail, controllerWithoutEmail],
          } as unknown as ClientResponse,
          readonlyFields: { fields: ['controllerEmail'] },
        })
      );

      const input = await screen.findByRole('textbox');
      expect(input.tagName).toBe('INPUT');
      expect(input).not.toHaveAttribute('aria-readonly', 'true');
    });

    test('locks controllerEmail when the controller has an email', async () => {
      renderInFlow(
        <FieldHarness
          name="controllerEmail"
          defaultValues={{ controllerEmail: 'jane@acme.com' }}
        />,
        makeContext({
          clientData: {
            parties: [orgPartyWithEmail, controllerWithEmail],
          } as unknown as ClientResponse,
          readonlyFields: { fields: ['controllerEmail'] },
        })
      );

      const box = await screen.findByRole('textbox');
      expect(box.tagName).toBe('DIV');
      expect(box).toHaveTextContent('jane@acme.com');
      expect(box).toHaveAttribute('aria-readonly', 'true');
    });

    test("locks controllerEmail on the controller's own form", async () => {
      renderInScope(
        <FieldHarness
          name="controllerEmail"
          defaultValues={{ controllerEmail: 'jane@acme.com' }}
        />,
        makeContext({
          clientData: {
            parties: [orgPartyWithEmail, controllerWithEmail, ownerWithEmail],
          } as unknown as ClientResponse,
          readonlyFields: { fields: ['controllerEmail'] },
        }),
        {
          party: controllerWithEmail as ReadonlyFieldsScope['party'],
          isController: true,
        }
      );

      const box = await screen.findByRole('textbox');
      expect(box.tagName).toBe('DIV');
      expect(box).toHaveAttribute('aria-readonly', 'true');
    });

    test("never locks a beneficial owner's email, even when populated", async () => {
      renderInScope(
        <FieldHarness
          name="controllerEmail"
          defaultValues={{ controllerEmail: 'bob@acme.com' }}
        />,
        makeContext({
          clientData: {
            parties: [orgPartyWithEmail, controllerWithEmail, ownerWithEmail],
          } as unknown as ClientResponse,
          readonlyFields: { fields: ['controllerEmail'] },
        }),
        {
          party: ownerWithEmail as ReadonlyFieldsScope['party'],
          isController: false,
        }
      );

      const input = await screen.findByRole('textbox');
      expect(input.tagName).toBe('INPUT');
      expect(input).toHaveValue('bob@acme.com');
      expect(input).not.toHaveAttribute('aria-readonly', 'true');
    });

    test("mode 'always' leaves a new owner's email editable", async () => {
      renderInScope(
        <FieldHarness
          name="controllerEmail"
          defaultValues={{ controllerEmail: '' }}
        />,
        makeContext({
          clientData: {
            parties: [orgPartyWithEmail, controllerWithEmail],
          } as unknown as ClientResponse,
          readonlyFields: { fields: ['controllerEmail'], mode: 'always' },
        }),
        { party: undefined, isController: false }
      );

      const input = await screen.findByRole('textbox');
      expect(input.tagName).toBe('INPUT');
      expect(input).not.toHaveAttribute('aria-readonly', 'true');
    });

    test('checks organization fields against the scoped party', async () => {
      const intermediaryWithoutName = {
        id: 'intermediary',
        partyType: 'ORGANIZATION',
        organizationDetails: {
          organizationType: 'LIMITED_LIABILITY_COMPANY',
        },
      };
      renderInScope(
        <FieldHarness
          name="organizationName"
          defaultValues={{ organizationName: '' }}
        />,
        makeContext({
          clientData: {
            parties: [orgPartyPopulated, intermediaryWithoutName],
          } as unknown as ClientResponse,
          readonlyFields: { fields: ['organizationName'] },
        }),
        {
          party: intermediaryWithoutName as ReadonlyFieldsScope['party'],
          isController: false,
        }
      );

      const input = await screen.findByRole('textbox');
      expect(input.tagName).toBe('INPUT');
      expect(input).not.toHaveAttribute('aria-readonly', 'true');
    });
  });
});

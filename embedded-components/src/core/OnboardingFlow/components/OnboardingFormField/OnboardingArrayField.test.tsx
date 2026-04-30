/**
 * RTL coverage for {@link OnboardingArrayField}: append/remove with rule mapping disabled,
 * readonly rendering, disabled interaction, hidden rule via field mapping, and invalid rule type guard.
 */
import type { ReactNode } from 'react';
import { i18n } from '@/i18n/config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render as rtlRender } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent, within } from '@test-utils';

import { Form } from '@/components/ui/form';
import { OnboardingArrayField } from '@/core/OnboardingFlow/components/OnboardingFormField/OnboardingArrayField';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';
import {
  FlowProvider,
  OnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import type { ClientContext } from '@/core/OnboardingFlow/types/form.types';
import * as formUtils from '@/core/OnboardingFlow/utils/formUtils';

type WidgetRow = { name: string };

type WidgetForm = { widgets: WidgetRow[] };

function WidgetArrayHarness(props: {
  readonly?: boolean;
  disabled?: boolean;
  disableFieldRuleMapping?: boolean;
}) {
  const form = useForm<WidgetForm>({
    defaultValues: { widgets: [{ name: 'First' }] },
  });

  return (
    <Form {...form}>
      <OnboardingArrayField<WidgetForm, 'widgets'>
        control={form.control}
        name="widgets"
        disableFieldRuleMapping={props.disableFieldRuleMapping ?? true}
        readonly={props.readonly}
        disabled={props.disabled}
        appendValue={{ name: '' }}
        renderItem={({ field, itemLabel, renderRemoveButton }) => (
          <div key={field.id} data-testid={`widget-row-${field.id}`}>
            <span data-testid="item-label">{itemLabel}</span>
            <span>{field.name}</span>
            {renderRemoveButton()}
          </div>
        )}
        renderFooter={({ renderAppendButton }) => (
          <div data-testid="array-append-slot">{renderAppendButton()}</div>
        )}
      />
    </Form>
  );
}

const baseOnboarding: OnboardingContextType = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData: undefined,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: undefined,
  showLinkAccountStep: false,
  showDownloadChecklist: false,
  docUploadOnlyMode: false,
  docUploadMaxFileSizeBytes: 8 * 1024 * 1024,
};

function renderWithFlow(ui: ReactNode) {
  return render(
    <OnboardingContext.Provider value={baseOnboarding}>
      <FlowProvider initialScreenId="gateway" flowConfig={flowConfig}>
        {ui}
      </FlowProvider>
    </OnboardingContext.Provider>
  );
}

/** RTL render without {@link EBComponentsProvider} error boundary so render errors propagate to assertions. */
function renderWithFlowNoErrorBoundary(ui: ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return rtlRender(
    <QueryClientProvider client={qc}>
      <I18nextProvider i18n={i18n}>
        <OnboardingContext.Provider value={baseOnboarding}>
          <FlowProvider initialScreenId="gateway" flowConfig={flowConfig}>
            {ui}
          </FlowProvider>
        </OnboardingContext.Provider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

describe('OnboardingArrayField', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup({ pointerEventsCheck: 0 });
    vi.restoreAllMocks();
  });

  test('append adds a row and remove drops it when mapping is disabled', async () => {
    renderWithFlow(<WidgetArrayHarness />);

    const row = await screen.findByTestId(/widget-row-/);
    expect(row).toBeTruthy();

    const appendBtn = within(screen.getByTestId('array-append-slot')).getByRole(
      'button'
    );
    await user.click(appendBtn);

    expect(screen.getAllByTestId(/widget-row-/).length).toBe(2);

    const trashButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(trashButtons[0]);

    expect(screen.getAllByTestId(/widget-row-/).length).toBe(1);
  });

  test('readonly uses renderReadOnlyItem and hides action buttons', async () => {
    function ReadonlyHarness() {
      const form = useForm<WidgetForm>({
        defaultValues: { widgets: [{ name: 'RO' }] },
      });

      return (
        <Form {...form}>
          <OnboardingArrayField<WidgetForm, 'widgets'>
            control={form.control}
            name="widgets"
            disableFieldRuleMapping
            readonly
            renderReadOnlyItem={() => (
              <div data-testid="readonly-block">read-only snapshot</div>
            )}
            renderItem={() => <div data-testid="editable">unexpected</div>}
          />
        </Form>
      );
    }

    renderWithFlow(<ReadonlyHarness />);

    expect(await screen.findByTestId('readonly-block')).toHaveTextContent(
      /read-only snapshot/i
    );
    expect(screen.queryByTestId('editable')).toBeNull();
    expect(screen.queryByRole('button', { name: /remove/i })).toBeNull();
  });

  test('disabled interaction disables append and remove controls', async () => {
    renderWithFlow(<WidgetArrayHarness disabled />);

    await screen.findByTestId(/widget-row-/);

    const appendBtn = within(screen.getByTestId('array-append-slot')).getByRole(
      'button'
    );
    expect(appendBtn).toBeDisabled();

    const trash = screen.getByRole('button', { name: /remove/i });
    expect(trash).toBeDisabled();
  });

  test('returns null when field rule display is hidden', () => {
    const stubContext: ClientContext = {
      product: 'EMBEDDED_PAYMENTS',
      jurisdiction: 'US',
      entityType: 'LIMITED_LIABILITY_COMPANY',
    };

    vi.spyOn(formUtils, 'useFormUtilsWithClientContext').mockReturnValue({
      modifySchema: vi.fn(),
      modifyDefaultValues: vi.fn(),
      getFieldRule: vi.fn(() => ({
        ruleType: 'array',
        fieldRule: { display: 'hidden' },
      })),
      clientContext: stubContext,
    });

    renderWithFlow(<WidgetArrayHarness disableFieldRuleMapping={false} />);

    expect(screen.queryAllByTestId(/^widget-row-/)).toHaveLength(0);
  });

  test('throws when field rule is not array type', () => {
    const stubContext: ClientContext = {
      product: 'EMBEDDED_PAYMENTS',
      jurisdiction: 'US',
      entityType: 'LIMITED_LIABILITY_COMPANY',
    };

    vi.spyOn(formUtils, 'useFormUtilsWithClientContext').mockReturnValue({
      modifySchema: vi.fn(),
      modifyDefaultValues: vi.fn(),
      getFieldRule: vi.fn(() => ({
        ruleType: 'string',
        fieldRule: {},
      })),
      clientContext: stubContext,
    });

    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() =>
        renderWithFlowNoErrorBoundary(
          <WidgetArrayHarness disableFieldRuleMapping={false} />
        )
      ).toThrow(/not configured as an array field/i);
    } finally {
      errSpy.mockRestore();
    }
  });
});

import type { ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { render, screen, userEvent } from '@test-utils';

import { Form } from '@/components/ui/form';
import { OnboardingFormField } from '@/core/OnboardingFlow/components/OnboardingFormField/OnboardingFormField';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';
import {
  FlowProvider,
  OnboardingContext,
} from '@/core/OnboardingFlow/contexts';

const REQUIRED_MESSAGE = 'Date is required';
const REQUIRED_MATCHER = new RegExp(REQUIRED_MESSAGE);

const schema = z.object({
  birthDate: z.string().min(1, REQUIRED_MESSAGE),
});

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

function DateHarness() {
  const form = useForm<z.infer<typeof schema>>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(schema),
    defaultValues: { birthDate: '1990-01-15' },
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => {})}>
        <OnboardingFormField
          control={form.control}
          name="birthDate"
          type="importantDate"
          label="Date of birth"
        />
        <button type="submit">Submit</button>
      </form>
    </Form>
  );
}

const renderInFlow = (ui: ReactNode) =>
  render(
    <OnboardingContext.Provider value={context}>
      <FlowProvider initialScreenId="gateway" flowConfig={flowConfig}>
        {ui}
      </FlowProvider>
    </OnboardingContext.Provider>
  );

describe('OnboardingFormField importantDate', () => {
  test('does not show an error while the date is edited before submit', async () => {
    const user = userEvent.setup();
    renderInFlow(<DateHarness />);

    await user.clear(screen.getByLabelText('Year'));
    await user.type(screen.getByLabelText('Year'), '19');

    expect(screen.queryByText(REQUIRED_MATCHER)).not.toBeInTheDocument();
  });

  test('shows the required error again when cleared after submit', async () => {
    const user = userEvent.setup();
    renderInFlow(<DateHarness />);

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await user.clear(screen.getByLabelText('Year'));

    expect(await screen.findByText(REQUIRED_MATCHER)).toBeInTheDocument();
    expect(screen.getByLabelText('Year')).toHaveClass('eb-border-red-500');
  });
});

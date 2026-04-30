import { describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import { TermsAttestationAcknowledgementsGroup } from './TermsAttestationAcknowledgementsGroup';

describe('TermsAttestationAcknowledgementsGroup', () => {
  test('renders nothing when items is empty', () => {
    render(
      <TermsAttestationAcknowledgementsGroup
        items={[]}
        checked={{}}
        onCheckedChange={vi.fn()}
        groupAriaLabel="Terms acknowledgements"
      />
    );
    expect(
      screen.queryByRole('group', { name: 'Terms acknowledgements' })
    ).not.toBeInTheDocument();
  });

  test('invokes onCheckedChange when a row is toggled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <TermsAttestationAcknowledgementsGroup
        items={[
          {
            id: 'ack-1',
            labelKey: 'reviewAndAttest.attestation.authorizeSharing',
          },
        ]}
        checked={{}}
        onCheckedChange={onCheckedChange}
        groupAriaLabel="Terms acknowledgements"
        labelInterpolationValues={{
          platformName: 'Demo Platform',
        }}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    expect(onCheckedChange).toHaveBeenCalledWith('ack-1', true);
  });

  test('respects controlled checked state', () => {
    render(
      <TermsAttestationAcknowledgementsGroup
        items={[
          {
            id: 'ack-a',
            labelKey: 'reviewAndAttest.termsAndConditions.agreeToTerms',
          },
        ]}
        checked={{ 'ack-a': true }}
        onCheckedChange={vi.fn()}
        groupAriaLabel="Terms acknowledgements"
      />
    );

    expect(screen.getByRole('checkbox')).toBeChecked();
  });
});

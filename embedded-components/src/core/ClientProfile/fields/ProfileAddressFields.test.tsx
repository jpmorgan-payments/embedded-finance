import { useForm, useWatch } from 'react-hook-form';
import { describe, expect, test } from 'vitest';
import { render, screen, waitFor } from '@test-utils';

import { Form } from '@/components/ui/form';

import { ProfileAddressFields } from './ProfileAddressFields';

const fieldNames = {
  country: 'country',
  primaryAddressLine: 'primaryAddressLine',
  secondaryAddressLine: 'secondaryAddressLine',
  tertiaryAddressLine: 'tertiaryAddressLine',
  city: 'city',
  state: 'state',
  postalCode: 'postalCode',
} as const;

function AddressHarness({ country = 'HK' }: { country?: string }) {
  const form = useForm({
    defaultValues: {
      country,
      primaryAddressLine: '1 Harbour Road',
      secondaryAddressLine: '',
      tertiaryAddressLine: '',
      city: 'Central',
      state: 'HCW',
      postalCode: '12345',
    },
  });
  const state = useWatch({ control: form.control, name: 'state' });
  const postalCode = useWatch({ control: form.control, name: 'postalCode' });

  return (
    <Form {...form}>
      <button type="button" onClick={() => form.setValue('country', 'US')}>
        Set US
      </button>
      <button type="button" onClick={() => form.setValue('country', 'HK')}>
        Set HK
      </button>
      <output data-testid="state-value">{state}</output>
      <output data-testid="postal-code-value">{postalCode}</output>
      <ProfileAddressFields
        control={form.control}
        fieldNames={fieldNames}
        content={{
          country: 'Country',
          primaryAddressLine: 'Address line 1',
          secondaryAddressLine: 'Address line 2',
          tertiaryAddressLine: 'Address line 3',
          city: 'City',
          state: 'State',
          postalCode: 'Postal code',
        }}
      />
    </Form>
  );
}

describe('ProfileAddressFields Hong Kong address', () => {
  test.each(['AE', 'QA'] as const)(
    'auto-fills n/a and hides postal code for %s while leaving state editable',
    async (country) => {
      const { container } = render(<AddressHarness country={country} />);

      await waitFor(() =>
        expect(screen.getByTestId('postal-code-value')).toHaveTextContent('n/a')
      );
      expect(
        container.querySelector('[name="postalCode"]')
      ).not.toBeInTheDocument();
      expect(container.querySelector('[name="state"]')).toBeInTheDocument();

      screen.getByRole('button', { name: 'Set US' }).click();
      await waitFor(() =>
        expect(screen.getByTestId('postal-code-value')).toHaveTextContent(/^$/)
      );
      expect(
        container.querySelector('[name="postalCode"]')
      ).toBeInTheDocument();
    }
  );

  test('fills HK and n/a without inputs and clears them when changing country', async () => {
    const { container } = render(<AddressHarness />);

    await waitFor(() =>
      expect(screen.getByTestId('state-value')).toHaveTextContent(/^HK$/)
    );
    expect(screen.getByTestId('postal-code-value')).toHaveTextContent('n/a');
    expect(container.querySelector('[name="state"]')).not.toBeInTheDocument();
    expect(
      container.querySelector('[name="postalCode"]')
    ).not.toBeInTheDocument();

    screen.getByRole('button', { name: 'Set US' }).click();
    await waitFor(() =>
      expect(screen.getByTestId('state-value')).toHaveTextContent(/^$/)
    );
    expect(screen.getByTestId('postal-code-value')).toHaveTextContent(/^$/);
    expect(container.querySelector('[name="state"]')).toBeInTheDocument();
    expect(container.querySelector('[name="postalCode"]')).toBeInTheDocument();

    screen.getByRole('button', { name: 'Set HK' }).click();
    await waitFor(() =>
      expect(screen.getByTestId('state-value')).toHaveTextContent(/^HK$/)
    );
    expect(screen.getByTestId('postal-code-value')).toHaveTextContent('n/a');
  });
});

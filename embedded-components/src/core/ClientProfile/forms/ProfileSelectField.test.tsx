import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, test } from 'vitest';

import { Form } from '@/components/ui';

import { ProfileSelectField } from './ProfileSelectField';

function SearchableCountryField() {
  const form = useForm({ defaultValues: { country: '' } });

  return (
    <Form {...form}>
      <ProfileSelectField
        control={form.control}
        name="country"
        label="Country"
        placeholder="Select a country"
        searchPlaceholder="Search countries"
        searchable
        required
        options={[
          {
            value: 'US',
            label: 'United States',
            searchValue: 'US United States',
          },
          { value: 'CA', label: 'Canada', searchValue: 'CA Canada' },
        ]}
      />
    </Form>
  );
}

describe('ProfileSelectField', () => {
  test('searches and selects an option without onboarding context', async () => {
    const user = userEvent.setup();
    render(<SearchableCountryField />);

    await user.click(screen.getByRole('combobox', { name: 'Country' }));
    await user.type(screen.getByPlaceholderText('Search countries'), 'can');
    await user.click(screen.getByText('Canada'));

    expect(screen.getByRole('combobox', { name: 'Country' })).toHaveTextContent(
      'Canada'
    );
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, test } from 'vitest';

import { Form } from '@/components/ui';

import { ProfileImportantDateField } from './ProfileImportantDateField';

function DateHarness() {
  const form = useForm({ defaultValues: { birthDate: '' } });
  return (
    <Form {...form}>
      <ProfileImportantDateField
        control={form.control}
        name="birthDate"
        label="Date of birth"
        required
      />
      <output data-testid="value">{form.watch('birthDate')}</output>
    </Form>
  );
}

describe('ProfileImportantDateField', () => {
  test('uses the composite selector and stores a local ISO date', async () => {
    const user = userEvent.setup();
    render(<DateHarness />);

    expect(
      screen.getByRole('group', { name: 'Date of birth' })
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText('Day'), '12');
    await user.click(screen.getByLabelText('Month'));
    await user.click(screen.getByRole('option', { name: 'May' }));
    await user.type(screen.getByLabelText('Year'), '1990');

    expect(screen.getByTestId('value')).toHaveTextContent('1990-05-12');
  });
});

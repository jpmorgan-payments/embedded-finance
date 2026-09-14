import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, test } from 'vitest';

import { Form } from '@/components/ui';

import { ProfilePhoneFields } from './ProfilePhoneFields';

function PhoneHarness() {
  const form = useForm({
    defaultValues: {
      phone: { phoneType: 'MOBILE_PHONE', countryCode: '', phoneNumber: '' },
    },
  });
  const phone = form.watch('phone');

  return (
    <Form {...form}>
      <ProfilePhoneFields
        control={form.control}
        phoneTypeName="phone.phoneType"
        countryCodeName="phone.countryCode"
        phoneNumberName="phone.phoneNumber"
        phoneTypeLabel="Phone type"
        phoneTypePlaceholder="Select phone type"
        phoneTypeOptions={[
          { value: 'MOBILE_PHONE', label: 'Mobile' },
          { value: 'BUSINESS_PHONE', label: 'Business' },
        ]}
        phoneNumberLabel="Phone number"
        phoneNumberPlaceholder="Enter phone number"
      />
      <output data-testid="country-code">{phone.countryCode}</output>
      <output data-testid="number">{phone.phoneNumber}</output>
    </Form>
  );
}

describe('ProfilePhoneFields', () => {
  test('uses PhoneInput and stores API-shaped phone values', async () => {
    const user = userEvent.setup();
    render(<PhoneHarness />);

    await user.type(screen.getByLabelText('Phone number'), '2015551234');

    expect(screen.getByTestId('country-code')).toHaveTextContent('+1');
    expect(screen.getByTestId('number')).toHaveTextContent('2015551234');
  });
});

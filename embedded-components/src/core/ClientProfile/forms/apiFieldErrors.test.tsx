import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, test, vi } from 'vitest';

import { Button, Form } from '@/components/ui';

import { applyApiFieldErrors, getApiErrorReasons } from './apiFieldErrors';
import { ProfileTextField } from './ProfileTextField';

const apiError = {
  response: {
    data: {
      context: [
        {
          field: '$.individualDetails.addresses[0].postalCode',
          message:
            'Field /individualDetails/addresses/0/postalCode/ value must have the expected value. The postal code [00000] is invalid.',
        },
        {
          field: '/individualDetails/phone/phoneNumber/',
          message: 'Phone number is invalid.',
        },
        {
          field: '$.organizationDetails.organizationIds[0].value',
          message: 'The EIN [050110294] is already in use.',
        },
      ],
    },
  },
};

describe('apiFieldErrors', () => {
  test('extracts structured API reasons', () => {
    expect(getApiErrorReasons(apiError)).toHaveLength(3);
  });

  test('maps JSONPath and slash paths, sanitizes messages, and focuses first field', () => {
    const setError = vi.fn();
    const setFocus = vi.fn();
    const form = { setError, setFocus } as never;

    expect(
      applyApiFieldErrors(form, apiError, {
        'individualDetails.addresses.0.postalCode':
          'residentialAddress.postalCode',
        'individualDetails.phone.phoneNumber': 'phone.phoneNumber',
        'organizationDetails.organizationIds.0.value': 'ein',
      })
    ).toBe(true);
    expect(setError).toHaveBeenNthCalledWith(
      1,
      'residentialAddress.postalCode',
      {
        type: 'server',
        message: 'Server Error: The postal code 00000 is invalid.',
      }
    );
    expect(setError).toHaveBeenNthCalledWith(2, 'phone.phoneNumber', {
      type: 'server',
      message: 'Server Error: Phone number is invalid.',
    });
    expect(setError).toHaveBeenNthCalledWith(3, 'ein', {
      type: 'server',
      message: 'Server Error: The EIN 050110294 is already in use.',
    });
    expect(setFocus).toHaveBeenCalledWith('residentialAddress.postalCode');
  });

  test('renders and focuses a mapped error on a real masked field', async () => {
    const user = userEvent.setup();

    function Harness() {
      const form = useForm({ defaultValues: { ein: '050110294' } });
      return (
        <Form {...form}>
          <ProfileTextField
            control={form.control}
            name="ein"
            label="EIN"
            maskFormat="## - #######"
          />
          <Button
            type="button"
            onClick={() =>
              applyApiFieldErrors(form, apiError, {
                'organizationDetails.organizationIds.0.value': 'ein',
              })
            }
          >
            Apply error
          </Button>
        </Form>
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Apply error' }));

    const ein = screen.getByLabelText('EIN');
    expect(ein).toHaveAccessibleDescription(
      /Server Error: The EIN 050110294 is already in use\./
    );
    expect(ein).toHaveFocus();
  });
});

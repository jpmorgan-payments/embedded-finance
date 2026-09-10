import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { PartyResponse } from '@/components/client-maintenance/models/maintenance-api';

import { PartyEditDrawer } from './PartyEditDrawer';

const individualParty: PartyResponse = {
  id: 'party-1',
  partyType: 'INDIVIDUAL',
  roles: ['CONTROLLER'],
  individualDetails: {
    firstName: 'Jane',
    middleName: 'R.',
    lastName: 'Doe',
    birthDate: '1988-06-14',
    addresses: [
      {
        addressType: 'RESIDENTIAL_ADDRESS',
        addressLines: ['10 Market Street'],
        city: 'Brooklyn',
        state: 'NY',
        postalCode: '11201',
        country: 'US',
      },
    ],
  },
};

describe('PartyEditDrawer', () => {
  it('submits an edited individual address under individualDetails', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <PartyEditDrawer
        party={individualParty}
        isSaving={false}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    expect(
      screen.getByRole('group', { name: 'Residential address' })
    ).toBeInTheDocument();

    const addressLine = screen.getByLabelText('Address line');
    await user.clear(addressLine);
    await user.type(addressLine, '99 Atlantic Avenue');
    await user.click(
      screen.getByRole('button', { name: 'Save proposed update' })
    );

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        individualDetails: {
          addresses: [
            {
              addressType: 'RESIDENTIAL_ADDRESS',
              addressLines: ['99 Atlantic Avenue'],
              city: 'Brooklyn',
              state: 'NY',
              postalCode: '11201',
              country: 'US',
            },
          ],
        },
      })
    );
  });
});

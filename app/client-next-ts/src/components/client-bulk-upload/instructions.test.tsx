import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Instructions } from './instructions';

describe('Instructions', () => {
  it('lists the controller first, with the authorized user as a role added to it', () => {
    render(<Instructions />);

    const roles = screen
      .getByRole('heading', { name: 'Roles' })
      .closest('section') as HTMLElement;
    const terms = within(roles)
      .getAllByRole('term')
      .map((term) => term.textContent);
    expect(terms).toEqual([
      'Controller',
      'Authorized user',
      'Beneficial owner (Owner 25%+)',
    ]);

    const [controller, authorizedUser] =
      within(roles).getAllByRole('definition');
    expect(controller).toHaveTextContent(
      'authorized by the client to complete the onboarding process'
    );
    expect(authorizedUser).toHaveTextContent(
      'An additional role that is always added to the controller'
    );
  });
});

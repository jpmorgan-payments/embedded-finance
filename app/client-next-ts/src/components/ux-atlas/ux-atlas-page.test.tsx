import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { UxAtlasPage, type UxAtlasSearch } from './ux-atlas-page';

function Harness({ initial = {} }: { initial?: UxAtlasSearch }) {
  const [search, setSearch] = useState<UxAtlasSearch>(initial);
  return (
    <>
      <UxAtlasPage search={search} onSearchChange={setSearch} />
      <div data-testid="search">{JSON.stringify(search)}</div>
    </>
  );
}

const currentSearch = () =>
  JSON.parse(screen.getByTestId('search').textContent ?? '{}');

const profilePanel = () =>
  screen.getByRole('region', { name: /profile your platform/i });

describe('UxAtlasPage', () => {
  it('records answers in the search state and shows them on the map', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const soleProps = within(profilePanel()).getByRole('group', {
      name: /sole proprietorships/i,
    });
    await user.click(within(soleProps).getByRole('radio', { name: 'Yes' }));

    expect(currentSearch()).toMatchObject({ yes: 'a' });
    expect(
      screen.getByRole('button', {
        name: /A\s*Sole proprietorships\s*:\s*Yes/i,
      })
    ).toBeInTheDocument();
    expect(
      within(profilePanel()).getByText('1 of 8 answered')
    ).toBeInTheDocument();
  });

  it('marks a gated stage out of scope when answered no', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const gate = within(profilePanel()).getByRole('group', {
      name: /link an external bank account/i,
    });
    await user.click(within(gate).getByRole('radio', { name: 'No' }));

    expect(screen.getByText('Out of scope (G: No)')).toBeInTheDocument();
  });

  it('opens a module in the detail panel from the map', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(
      screen.getByRole('button', { name: /D\s*Indirect ownership/i })
    );

    expect(currentSearch()).toMatchObject({ focus: 'd' });
    const detail = screen.getByRole('region', { name: 'Indirect ownership' });
    expect(within(detail).getByText(/INTERMEDIARY_OWNER/)).toBeInTheDocument();
    expect(
      within(detail).getByRole('link', {
        name: /collect indirect ownership information/i,
      })
    ).toHaveAttribute(
      'href',
      'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/onboard-a-client/how-to/indirect-ownership'
    );
  });

  it('restores answers and focus from the URL', () => {
    render(<Harness initial={{ yes: 'g', focus: 'link-account' }} />);

    const detail = screen.getByRole('region', { name: 'Link a bank account' });
    expect(within(detail).getByText('Decide first')).toBeInTheDocument();
    expect(screen.getByText('G: Yes')).toBeInTheDocument();
  });

  it('copies the checklist as Markdown', async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ yes: 'a' }} />);

    await user.click(screen.getByRole('button', { name: /copy checklist/i }));

    expect(await navigator.clipboard.readText()).toContain(
      '### A. Sole proprietorships'
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Checklist copied as Markdown.'
    );
  });

  it('resets answers but keeps the focused item', async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ yes: 'a,b', focus: 'collect' }} />);

    await user.click(screen.getByRole('button', { name: /reset answers/i }));

    expect(currentSearch()).toEqual({ focus: 'collect' });
    expect(
      screen.getByRole('region', { name: 'Create client and collect data' })
    ).toBeInTheDocument();
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ClientBulkUploadPage } from './client-bulk-upload-page';
import { TOUR_STORAGE_KEY } from './tour-steps';

const footer = () =>
  screen.getByRole('button', { name: /review and download csv/i })
    .parentElement as HTMLElement;

async function fillFirstClient(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Row 1 Client ID'), 'S-1');
  await user.type(
    screen.getByLabelText('Row 1 Legal business name'),
    'Acme LLC'
  );
  await user.selectOptions(
    screen.getByLabelText('Row 1 Business type'),
    'LIMITED_LIABILITY_COMPANY'
  );
  await user.type(
    screen.getByLabelText('Row 1 Authorized user first name'),
    'Jane'
  );
  await user.type(
    screen.getByLabelText('Row 1 Authorized user last name'),
    'Doe'
  );
  await user.type(
    screen.getByLabelText('Row 1 Authorized user email'),
    'jane@acme.com'
  );
}

describe('ClientBulkUploadPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(TOUR_STORAGE_KEY, '1');
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  it('starts empty with download disabled and the verification step visible', () => {
    render(<ClientBulkUploadPage />);

    expect(
      screen.getByRole('button', { name: /review and download csv/i })
    ).toBeDisabled();
    expect(
      screen.getByText('Add your first client to get started.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Check the file, then send it')
    ).toBeInTheDocument();
  });

  it('requires confirming the review before the download is enabled', async () => {
    const user = userEvent.setup();
    render(<ClientBulkUploadPage />);

    await fillFirstClient(user);
    expect(
      within(footer()).getByText('Ready to review and download')
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /review and download csv/i })
    );
    const dialog = screen.getByRole('dialog', {
      name: /review before downloading/i,
    });
    const download = within(dialog).getByRole('button', {
      name: /download csv/i,
    });
    expect(download).toBeDisabled();

    await user.click(within(dialog).getByRole('checkbox'));
    expect(download).toBeEnabled();
  });

  it('blocks the download and lists problems when data is invalid', async () => {
    const user = userEvent.setup();
    render(<ClientBulkUploadPage />);

    await user.type(screen.getByLabelText('Row 1 Client ID'), 'S-1');
    await user.click(
      screen.getByRole('button', { name: /review and download csv/i })
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/before downloading/i);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByText('Enter the legal business name')
    ).toBeInTheDocument();
  });

  it('adds a row when pressing Enter on the last row', async () => {
    const user = userEvent.setup();
    render(<ClientBulkUploadPage />);

    await user.type(screen.getByLabelText('Row 1 Client ID'), 'S-1{Enter}');

    expect(screen.getByLabelText('Row 2 Client ID')).toHaveFocus();
  });

  it('shows examples in the first row and focuses its Client ID on load', () => {
    render(<ClientBulkUploadPage />);

    const clientId = screen.getByLabelText('Row 1 Client ID');
    expect(clientId).toHaveFocus();
    expect(clientId).toHaveAttribute('placeholder', 'e.g. S-1001');
    expect(
      screen.getByLabelText('Row 1 Authorized user email')
    ).toHaveAttribute('placeholder', 'e.g. jane@acme.com');
  });
});

describe('ClientBulkUploadPage first-visit tour', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  const tour = () => screen.getByRole('dialog', { name: /.+/ });

  it('opens on the first visit while keeping the cursor in Client ID', () => {
    window.localStorage.removeItem(TOUR_STORAGE_KEY);
    render(<ClientBulkUploadPage />);

    expect(tour()).toHaveTextContent('Start here: one row per business');
    expect(tour()).toHaveTextContent('S-1001');
    expect(screen.getByLabelText('Row 1 Client ID')).toHaveFocus();
  });

  it('does not reopen after it was skipped, and can be replayed', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ClientBulkUploadPage />);

    await user.click(within(tour()).getByRole('button', { name: 'Skip' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(window.localStorage.getItem(TOUR_STORAGE_KEY)).toBe('1');

    unmount();
    render(<ClientBulkUploadPage />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /show me how/i }));
    expect(tour()).toHaveTextContent('Start here: one row per business');
  });

  it('walks through every step, mentions sideways scrolling, and ends in Client ID', async () => {
    const user = userEvent.setup();
    render(<ClientBulkUploadPage />);

    const titles: string[] = [];
    for (;;) {
      titles.push(within(tour()).getByRole('heading').textContent ?? '');
      if (titles.length === 3) {
        expect(tour()).toHaveTextContent(/scroll sideways/i);
      }
      const finish = within(tour()).queryByRole('button', {
        name: 'Start entering clients',
      });
      if (finish) {
        await user.click(finish);
        break;
      }
      await user.click(within(tour()).getByRole('button', { name: 'Next' }));
    }

    expect(titles).toEqual([
      'Start here: one row per business',
      'Business details',
      'Authorized user',
      'Other owners and controllers',
      'Many clients? Paste or import',
      'Review, download, then check the file',
    ]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Row 1 Client ID')).toHaveFocus();
  });
});

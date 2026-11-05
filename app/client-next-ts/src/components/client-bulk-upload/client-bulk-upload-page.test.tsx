import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ClientBulkUploadPage } from './client-bulk-upload-page';

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
});

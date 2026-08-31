import { useForm } from 'react-hook-form';
import { describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import {
  DocumentRequestResponse,
  DocumentTypeSmbdo,
} from '@/api/generated/smbdo.schemas';
import { Form } from '@/components/ui';

import { DocumentRequestCard } from './DocumentRequestCard';

function renderCard(
  overrides: Partial<{
    documentRequest: DocumentRequestResponse;
    onReset: () => void;
  }> = {}
) {
  const onReset = overrides.onReset ?? vi.fn();
  const documentRequest: DocumentRequestResponse =
    overrides.documentRequest ??
    ({
      id: 'dr-card-1',
      clientId: 'c1',
      partyId: 'p1',
      status: 'ACTIVE',
      description: 'Upload a clear scan\nInclude all pages',
      requirements: [
        {
          documentTypes: [DocumentTypeSmbdo.BUSINESS_LICENSE],
          level: 'PRIMARY',
          minRequired: 1,
        },
      ],
      createdAt: '2024-01-01T00:00:00Z',
    } as DocumentRequestResponse);

  const Harness = () => {
    const form = useForm<Record<string, unknown>>({
      defaultValues: {},
    });

    return (
      <Form {...form}>
        <DocumentRequestCard
          documentRequest={documentRequest}
          activeRequirements={[0]}
          satisfiedDocTypes={[]}
          requirementDocTypes={{}}
          control={form.control}
          watch={form.watch}
          resetKey={0}
          onReset={onReset}
          maxFileSizeBytes={2 * 1024 * 1024}
        />
      </Form>
    );
  };

  render(<Harness />);
  return { onReset };
}

describe('DocumentRequestCard', () => {
  test('renders formatted description when provided', () => {
    renderCard();
    expect(screen.getByText('Upload a clear scan')).toBeInTheDocument();
    expect(screen.getByText('Include all pages')).toBeInTheDocument();
  });

  test('returns null when requirements are missing', () => {
    renderCard({
      documentRequest: {
        id: 'dr-empty',
        clientId: 'c1',
        partyId: 'p1',
        status: 'ACTIVE',
        requirements: [],
        createdAt: '2024-01-01T00:00:00Z',
      } as unknown as DocumentRequestResponse,
    });
    expect(
      screen.queryByRole('button', { name: /reset form/i })
    ).not.toBeInTheDocument();
  });

  test('Reset form invokes onReset', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const { onReset } = renderCard();

    await user.click(screen.getByRole('button', { name: /reset form/i }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  test('presents requirement descriptions as requirement headings', () => {
    renderCard({
      documentRequest: {
        id: 'dr-heading',
        status: 'ACTIVE',
        requirements: [
          {
            documentTypes: [DocumentTypeSmbdo.BUSINESS_LICENSE],
            minRequired: 1,
            description: 'Government-issued business document',
          },
        ],
      } as unknown as DocumentRequestResponse,
    });

    expect(
      screen.getByRole('heading', {
        level: 4,
        name: 'Government-issued business document',
      })
    ).toHaveClass('eb-border-b', 'eb-pb-3', 'eb-font-semibold');
  });
});

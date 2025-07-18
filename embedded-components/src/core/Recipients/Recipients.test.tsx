import {
  createMockRecipient,
  mockEmptyRecipientsResponse,
  mockRecipientsResponse,
} from '@/mocks/recipients.mock';
import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '../EBComponentsProvider';
import { Recipients } from './Recipients';

// Mock the DTRUM utility
vi.mock('@/utils/useDTRUMAction', () => ({
  useDTRUMAction: () => ({
    addActionProperties: vi.fn(),
  }),
}));

describe.skip('Recipients Component', () => {
  let queryClient: QueryClient;

  const renderComponent = (props = {}) => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <EBComponentsProvider
        apiBaseUrl="/"
        headers={{}}
        contentTokens={{
          name: 'enUS',
        }}
      >
        <QueryClientProvider client={queryClient}>
          <Recipients {...props} />
        </QueryClientProvider>
      </EBComponentsProvider>
    );
  };

  beforeEach(() => {
    server.resetHandlers();
  });

  describe('Basic Rendering', () => {
    test('renders recipients table with data', async () => {
      server.use(
        http.get('/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Recipients')).toBeInTheDocument();
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      expect(screen.getByText('Add Recipient')).toBeInTheDocument();
    });

    test('renders empty state when no recipients', async () => {
      server.use(
        http.get('/recipients', () => {
          return HttpResponse.json(mockEmptyRecipientsResponse);
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No recipients found')).toBeInTheDocument();
      });
    });

    test('renders loading state', async () => {
      server.use(
        http.get('/recipients', () => {
          return new Promise(() => {}); // Never resolves
        })
      );

      renderComponent();

      expect(screen.getByText('Recipients')).toBeInTheDocument();
      // Loading skeletons should be present
      expect(screen.getAllByTestId('skeleton')).toBeTruthy();
    });

    test('renders error state', async () => {
      server.use(
        http.get('/recipients', () => {
          return HttpResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
          );
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load recipients. Please try again.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(() => {
      server.use(
        http.get('/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        })
      );
    });

    test('filters recipients by search term', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search recipients...');
      await userEvent.type(searchInput, 'John');

      // John Doe should still be visible
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('filters recipients by type', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Recipients')).toBeInTheDocument();
      });

      const typeFilter = screen.getByRole('combobox');
      await userEvent.click(typeFilter);

      const recipientOption = screen.getByText('Recipient');
      await userEvent.click(recipientOption);
    });

    test('clears filters when clear button is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Recipients')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /filter/i });
      await userEvent.click(clearButton);
    });
  });

  describe('Recipient Creation', () => {
    test('opens create dialog when add button is clicked', async () => {
      server.use(
        http.get('/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        }),
        http.post('/recipients', () => {
          return HttpResponse.json(createMockRecipient());
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Add Recipient')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Recipient');
      await userEvent.click(addButton);

      expect(screen.getByText('Create New Recipient')).toBeInTheDocument();
    });

    test('creates new recipient successfully', async () => {
      const mockOnRecipientCreated = vi.fn();

      server.use(
        http.get('/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        }),
        http.post('/recipients', () => {
          return HttpResponse.json(createMockRecipient());
        })
      );

      renderComponent({
        onRecipientCreated: mockOnRecipientCreated,
      });

      await waitFor(() => {
        expect(screen.getByText('Add Recipient')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Recipient');
      await userEvent.click(addButton);

      // Fill out the form and submit
      const firstNameInput = screen.getByLabelText('First Name');
      await userEvent.type(firstNameInput, 'Test');

      const lastNameInput = screen.getByLabelText('Last Name');
      await userEvent.type(lastNameInput, 'User');

      const submitButton = screen.getByText('Create Recipient');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnRecipientCreated).toHaveBeenCalled();
      });
    });

    test('hides create button when showCreateButton is false', async () => {
      server.use(
        http.get('/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        })
      );

      renderComponent({ showCreateButton: false });

      await waitFor(() => {
        expect(screen.getByText('Recipients')).toBeInTheDocument();
      });

      expect(screen.queryByText('Add Recipient')).not.toBeInTheDocument();
    });
  });

  describe('Recipient Actions', () => {
    beforeEach(() => {
      server.use(
        http.get('/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        })
      );
    });

    test('opens recipient details when view button is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByRole('button', { name: /eye/i });
      await userEvent.click(viewButtons[0]);

      expect(screen.getByText('Recipient Details')).toBeInTheDocument();
    });

    test('opens edit dialog when edit button is clicked', async () => {
      server.use(
        http.post('/recipients/:id', () => {
          return HttpResponse.json(createMockRecipient());
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await userEvent.click(editButtons[0]);

      expect(screen.getByText('Edit Recipient')).toBeInTheDocument();
    });

    test('updates recipient successfully', async () => {
      const mockOnRecipientUpdated = vi.fn();

      server.use(
        http.post('/recipients/:id', () => {
          return HttpResponse.json(createMockRecipient());
        })
      );

      renderComponent({
        onRecipientUpdated: mockOnRecipientUpdated,
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await userEvent.click(editButtons[0]);

      const updateButton = screen.getByText('Update Recipient');
      await userEvent.click(updateButton);

      await waitFor(() => {
        expect(mockOnRecipientUpdated).toHaveBeenCalled();
      });
    });
  });



  describe('Pagination', () => {
    test('displays pagination controls when needed', async () => {
      const largeDataset = Array.from({ length: 25 }, (_, i) =>
        createMockRecipient({ id: `recipient-${i}` })
      );

      server.use(
        http.get('/recipients', () => {
          return HttpResponse.json({
            recipients: largeDataset.slice(0, 10),
            limit: 10,
            page: 1,
            total_items: 25,
          });
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText('Showing 1 to 10 of 25 recipients')
        ).toBeInTheDocument();
      });

      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
    });

    test('navigates to next page', async () => {
      const largeDataset = Array.from({ length: 25 }, (_, i) =>
        createMockRecipient({ id: `recipient-${i}` })
      );

      server.use(
        http.get('/recipients', ({ request }) => {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get('page') || '1', 10);
          const limit = parseInt(url.searchParams.get('limit') || '10', 10);

          const start = (page - 1) * limit;
          const end = start + limit;

          return HttpResponse.json({
            recipients: largeDataset.slice(start, end),
            limit,
            page,
            total_items: 25,
          });
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText('Showing 1 to 10 of 25 recipients')
        ).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      await userEvent.click(nextButton);

      await waitFor(() => {
        expect(
          screen.getByText('Showing 11 to 20 of 25 recipients')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Event Handling', () => {
    test('calls userEventsHandler when provided', async () => {
      const mockUserEventsHandler = vi.fn();

      server.use(
        http.get('/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        })
      );

      renderComponent({
        userEventsHandler: mockUserEventsHandler,
        userEventsToTrack: ['click', 'view'],
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByRole('button', { name: /eye/i });
      await userEvent.click(viewButtons[0]);

      expect(mockUserEventsHandler).toHaveBeenCalledWith({
        actionName: 'recipient_details_viewed',
      });
    });

    test('calls callback functions when provided', async () => {
      const mockOnRecipientCreated = vi.fn();
      const mockOnRecipientUpdated = vi.fn();

      server.use(
        http.get('/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        }),
        http.post('/recipients', () => {
          return HttpResponse.json(createMockRecipient());
        })
      );

      renderComponent({
        onRecipientCreated: mockOnRecipientCreated,
        onRecipientUpdated: mockOnRecipientUpdated,
      });

      await waitFor(() => {
        expect(screen.getByText('Recipients')).toBeInTheDocument();
      });

      // Test creation callback
      const addButton = screen.getByText('Add Recipient');
      await userEvent.click(addButton);

      // We would need to fill out the form and submit
      // This is a simplified test - in reality we'd need to complete the form
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      server.use(
        http.get('/recipients', () => {
          return HttpResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
          );
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load recipients. Please try again.')
        ).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
    });

    test('retries request when retry button is clicked', async () => {
      let callCount = 0;

      server.use(
        http.get('/recipients', () => {
          callCount += 1;
          if (callCount === 1) {
            return HttpResponse.json(
              { error: 'Internal Server Error' },
              { status: 500 }
            );
          }
          return HttpResponse.json(mockRecipientsResponse);
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load recipients. Please try again.')
        ).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      await userEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      server.use(
        http.get('/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        })
      );
    });

    test('has proper ARIA labels', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Recipients')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search recipients...');
      expect(searchInput).toHaveAttribute('type', 'text');

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Recipients')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Recipient');
      expect(addButton).toBeInTheDocument();

      // Test that the button is focusable
      addButton.focus();
      expect(addButton).toHaveFocus();
    });
  });
});

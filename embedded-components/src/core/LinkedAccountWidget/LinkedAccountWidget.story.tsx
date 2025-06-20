import {
  linkedAccountListMock,
  linkedAccountRejectedMock,
} from '@/mocks/efLinkedAccounts.mock';
import { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { LinkedAccountWidget } from './LinkedAccountWidget';

const LinkedAccountsWithProvider = ({
  apiBaseUrl,
  headers,
  theme,
}: {
  apiBaseUrl: string;
  headers: Record<string, string>;
  theme: Record<string, unknown>;
}) => {
  return (
    <>
      <EBComponentsProvider
        apiBaseUrl={apiBaseUrl}
        headers={headers}
        theme={theme}
      >
        <LinkedAccountWidget />
      </EBComponentsProvider>
    </>
  );
};

const meta: Meta<typeof LinkedAccountsWithProvider> = {
  title: 'LinkedAccounts with EBComponentsProvider',
  component: LinkedAccountsWithProvider,
};
export default meta;

type Story = StoryObj<typeof LinkedAccountsWithProvider>;

export const Primary: Story = {
  name: 'LinkedAccountWidget with EBComponentsProvider',
  args: {
    apiBaseUrl: '/',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/recipients', () => {
          return HttpResponse.json(linkedAccountListMock);
        }),
      ],
    },
  },
};

export const WithNoRecipients: Story = {
  name: 'With no recipients',
  args: {
    apiBaseUrl: '/',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/recipients', () => {
          return HttpResponse.json({
            ...linkedAccountListMock,
            recipients: [],
          });
        }),
      ],
    },
  },
};

export const WithTheme: Story = {
  name: 'With Custom Theme',
  ...Primary,
  args: {
    ...Primary.args,
    theme: {
      variables: {
        primaryColor: 'red',
        borderRadius: '15px',
      },
    },
  },
};

export const RejectedMockAPI: Story = {
  name: 'With rejected status',
  ...Primary,
  args: {
    ...Primary.args,
    theme: {
      variables: {
        primaryColor: 'red',
        borderRadius: '15px',
      },
    },
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/recipients', () => {
          return HttpResponse.json(linkedAccountRejectedMock);
        }),
      ],
    },
  },
};

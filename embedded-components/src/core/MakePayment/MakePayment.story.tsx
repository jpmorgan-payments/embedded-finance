import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { useDarkMode } from 'storybook-dark-mode';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { EBConfig } from '@/core/EBComponentsProvider/config.types';

import { MakePayment } from './MakePayment';

interface MakePaymentWithProviderProps extends EBConfig {
  triggerButton?: React.ReactNode;
}

const meta: Meta<MakePaymentWithProviderProps> = {
  title: 'Payment / Make Payment',
  component: MakePayment,
  parameters: {
    layout: 'centered',
    msw: {
      handlers: [
        http.post('/payments', () => {
          return HttpResponse.json({ success: true });
        }),
      ],
    },
  },
  decorators: [
    (Story, context) => {
      const isDarkMode = useDarkMode();
      const {
        apiBaseUrl,
        headers,
        theme,
        reactQueryDefaultOptions,
        contentTokens,
      } = context.args;
      return (
        <div className="eb-light">
          <EBComponentsProvider
            apiBaseUrl={apiBaseUrl}
            headers={headers}
            theme={{
              colorScheme: isDarkMode ? 'dark' : 'light',
              ...theme,
            }}
            reactQueryDefaultOptions={{
              queries: {
                refetchOnWindowFocus: false,
                retry: false,
              },
              ...reactQueryDefaultOptions,
            }}
            contentTokens={contentTokens}
          >
            <div className="eb-p-4">
              <Story />
            </div>
          </EBComponentsProvider>
        </div>
      );
    },
  ],
};
export default meta;

type Story = StoryObj<MakePaymentWithProviderProps>;

export const Default: Story = {
  args: {
    apiBaseUrl: '/api',
    headers: {
      api_gateway_client_id: 'test',
    },
    theme: {
      colorScheme: 'light',
    },
    contentTokens: {
      name: 'enUS',
    },
  },
};

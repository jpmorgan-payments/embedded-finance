/* eslint-disable import/no-useless-path-segments */
import type { Meta, StoryObj } from '@storybook/react-vite';

import { TransactionsDisplayWithProvider } from './TransactionsDisplay.story';

const meta: Meta<typeof TransactionsDisplayWithProvider> = {
  title: 'Transactions Display / Environment',
  component: TransactionsDisplayWithProvider,
};
export default meta;

type Story = StoryObj<typeof TransactionsDisplayWithProvider>;

export const Primary: Story = {
  name: 'UAT',
  args: {
    apiBaseUrl: '/paste-uat-url-here',
    headers: {
      api_gateway_client_id: 'EBCLIENT22',
    },
  },
};

export const Dev: Story = {
  name: 'DEV',
  ...Primary,
  args: {
    apiBaseUrl: '/paste-dev-url-here',
    headers: {
      api_gateway_client_id: 'OBTSTSTCL1',
    },
  },
};

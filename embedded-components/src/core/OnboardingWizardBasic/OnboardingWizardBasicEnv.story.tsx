import type { Meta } from '@storybook/react';

import OnboardingWizardBasicMeta, {
  Default,
  OnboardingWizardBasicWithProviderProps,
} from './OnboardingWizardBasic.story';

const meta: Meta<OnboardingWizardBasicWithProviderProps> = {
  ...OnboardingWizardBasicMeta,
  title: 'Onboarding Wizard Basic / Environment',
};
export default meta;

export const Mocked = Default.bind({});
Mocked.storyName = 'PDP mocked APIs';
Mocked.args = {
  ...Default.args,
  apiBaseUrl: 'https://api-mock.payments.jpmorgan.com/tsapi/',
  initialClientId: '123',
};

export const UAT = Default.bind({});
UAT.storyName = 'UAT';
UAT.args = {
  ...Default.args,
  apiBaseUrl: '/paste-uat-url-here',
  headers: {
    api_gateway_client_id: 'EBCLIENT22',
  },
};

export const DEV = Default.bind({});
DEV.storyName = 'DEV';
DEV.args = {
  ...Default.args,
  apiBaseUrl: '/paste-dev-url-here',
  headers: {
    api_gateway_client_id: 'OBTSTSTCL1',
  },
};

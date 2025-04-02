/* eslint-disable no-console */
import { useEffect, useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { useDarkMode } from 'storybook-dark-mode';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { EBConfig } from '@/core/EBComponentsProvider/config.types';
import {
  OnboardingOverviewFlowProps,
  OnboardingWizardBasic,
} from '@/core/OnboardingWizardBasic/OnboardingOverviewFlow/OnboardingOverviewFlow';

import { ORGANIZATION_TYPE_LIST } from '../utils/organizationTypeList';

export type OnboardingWizardBasicWithProviderProps =
  OnboardingOverviewFlowProps & EBConfig;

const meta: Meta<OnboardingWizardBasicWithProviderProps> = {
  title: 'Onboarding Overview Flow / Appearance & Theme',
  component: OnboardingWizardBasic,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onPostClientResponse: (data, error) => {
      if (data) {
        console.log('@@POST client response data', data);
      } else if (error) {
        console.log('@@POST client response error', error);
      }
    },
    onPostPartyResponse(response, error) {
      if (response) {
        console.log('@@POST party response data', response);
      } else if (error) {
        console.log('@@POST party response error', error);
      }
    },
    onPostClientVerificationsResponse: (data, error) => {
      if (data) {
        console.log('@@POST verifications response data', data);
      } else if (error) {
        console.log('@@POST verifications response error', error);
      }
    },
  },
  argTypes: {
    onPostClientResponse: { table: { disable: true } },
    onPostPartyResponse: { table: { disable: true } },
    onPostClientVerificationsResponse: { table: { disable: true } },
    availableProducts: {
      control: {
        type: 'check',
      },
      options: ['MERCHANT_SERVICES', 'EMBEDDED_PAYMENTS'],
    },
    availableJurisdictions: {
      control: {
        type: 'check',
      },
      options: ['US', 'CA'],
    },
    availableOrganizationTypes: {
      control: {
        type: 'check',
      },
      options: ORGANIZATION_TYPE_LIST,
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
        <EBComponentsProvider
          apiBaseUrl={apiBaseUrl}
          headers={headers}
          theme={{
            colorScheme: isDarkMode ? 'dark' : 'light',
            ...theme,
          }}
          reactQueryDefaultOptions={reactQueryDefaultOptions}
          contentTokens={contentTokens}
        >
          <Story />
        </EBComponentsProvider>
      );
    },
  ],
};

export default meta;

const Template: StoryFn<OnboardingWizardBasicWithProviderProps> = (args) => {
  const [containerHeight, setContainerHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => setContainerHeight(window.innerHeight);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  return <OnboardingWizardBasic height={`${containerHeight}px`} {...args} />;
};

export const Default = Template.bind({});
Default.storyName = 'Default Theme';
Default.args = {
  initialClientId: '',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/',
  headers: {
    api_gateway_client_id: import.meta.env.VITE_API_GATEWAY_CLIENT_ID ?? 'test',
  },
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  availableOrganizationTypes: [
    'SOLE_PROPRIETORSHIP',
    'LIMITED_LIABILITY_COMPANY',
    'LIMITED_LIABILITY_PARTNERSHIP',
    'GENERAL_PARTNERSHIP',
    'LIMITED_PARTNERSHIP',
    'C_CORPORATION',
    'S_CORPORATION',
    // not allowed:
    // 'PARTNERSHIP',
    // 'PUBLICLY_TRADED_COMPANY',
    // 'NON_PROFIT_CORPORATION',
    // 'GOVERNMENT_ENTITY',
    // 'UNINCORPORATED_ASSOCIATION',
  ],
  theme: {
    variables: {},
  },
  contentTokens: {
    name: 'enUS',
  },
  alertOnExit: false,
};

export const STheme = Default.bind({});
STheme.storyName = 'S Theme';
STheme.args = {
  ...Default.args,
  theme: {
    variables: {
      fontFamily: 'Open Sans',
      headerFontFamily: 'Amplitude',
      buttonFontFamily: 'Amplitude',
      buttonTextTransform: 'uppercase',
      buttonLetterSpacing: '0.6px',
      primaryColor: '#1B7F9E',
      buttonBorderRadius: '8px',
      secondaryColor: 'white',
      secondaryForegroundColor: '#1B7F9E',
      secondaryBorderWidth: '1px',
    },
  },
};

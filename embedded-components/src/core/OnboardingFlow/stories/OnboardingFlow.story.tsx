/* eslint-disable no-console */
import React, { useEffect, useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react-vite';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { EBConfig } from '@/core/EBComponentsProvider/config.types';
import { OnboardingFlow, OnboardingFlowProps } from '@/core/OnboardingFlow';
import { ORGANIZATION_TYPE_LIST } from '@/core/OnboardingFlow/consts';
import { SELLSENSE_THEME } from '@/core/themes';

import { handlers } from './msw.handlers';

export type OnboardingFlowWithProviderProps = OnboardingFlowProps & EBConfig;

const meta: Meta<OnboardingFlowWithProviderProps> = {
  title: 'Core/OnboardingFlow',
  component: OnboardingFlow,
  tags: ['@core', '@onboarding'],
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers,
    },
  },
  args: {
    onPostClientSettled: (data, error) => {
      if (data) {
        console.log('@@POST client response data', data);
      } else if (error) {
        console.log('@@POST client response error', error);
      }
    },
    onPostPartySettled(response, error) {
      if (response) {
        console.log('@@POST party response data', response);
      } else if (error) {
        console.log('@@POST party response error', error);
      }
    },
    onPostClientVerificationsSettled: (data, error) => {
      if (data) {
        console.log('@@POST verifications response data', data);
      } else if (error) {
        console.log('@@POST verifications response error', error);
      }
    },
  },
  argTypes: {
    onPostClientSettled: { table: { disable: true } },
    onPostPartySettled: { table: { disable: true } },
    onPostClientVerificationsSettled: { table: { disable: true } },
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
            colorScheme: 'light',
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

const Template: StoryFn<OnboardingFlowWithProviderProps> = (args) => {
  const [containerHeight, setContainerHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => setContainerHeight(window.innerHeight);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  return <OnboardingFlow height={`${containerHeight}px`} {...args} />;
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
    // 'S_CORPORATION',
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
  docUploadOnlyMode: false,
};

export const STheme = Default.bind({});
STheme.storyName = '"S" Theme';
STheme.args = {
  ...Default.args,
  theme: {
    variables: {
      fontFamily: 'Open Sans',
      headerFontFamily: 'Amplitude',
      backgroundColor: '#f6f7f8',
      inputColor: '#FFFFFF',
      inputBorderColor: '#0000004D',
      borderColor: '#0000004D',
      borderRadius: '6px',
      inputBorderRadius: '4px',
      buttonBorderRadius: '8px',
      buttonFontFamily: 'Amplitude',
      buttonTextTransform: 'uppercase',
      buttonLetterSpacing: '0.6px',
      primaryColor: '#1B7F9E',
      secondaryColor: 'transparent',
      secondaryForegroundColor: '#1B7F9E',
      secondaryBorderWidth: '1px',
      secondaryHoverColor: 'hsla(240, 4.8%, 95.9%, 0.5)',
      formLabelFontSize: '0.75rem',
      formLabelLineHeight: '1rem',
      formLabelFontWeight: '600',
      formLabelForegroundColor: '#4C5157',
    },
  },
};

export const SellSenseTheme = Default.bind({});
SellSenseTheme.storyName = 'SellSense Theme';
SellSenseTheme.args = {
  ...Default.args,
  theme: SELLSENSE_THEME,
};
SellSenseTheme.tags = ['@sellsense', '@theme'];

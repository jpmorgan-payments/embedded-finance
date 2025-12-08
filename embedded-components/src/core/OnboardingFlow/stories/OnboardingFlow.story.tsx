/* eslint-disable no-console */
import React, { useEffect, useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react-vite';

import { OnboardingFlow, OnboardingFlowProps } from '@/core/OnboardingFlow';
import { ORGANIZATION_TYPE_LIST } from '@/core/OnboardingFlow/consts';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import { handlers } from '../../../msw/handlers';

/**
 * Story args interface extending base provider args
 */
export type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

/**
 * @deprecated Use OnboardingFlowStoryArgs instead
 * Kept for backward compatibility with existing story files
 */
export type OnboardingFlowWithProviderProps = OnboardingFlowStoryArgs;

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Themes',
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
        // eslint-disable-next-line no-console
        console.log('@@POST client response data', data);
      } else if (error) {
        // eslint-disable-next-line no-console
        console.log('@@POST client response error', error);
      }
    },
    onPostPartySettled(response, error) {
      if (response) {
        // eslint-disable-next-line no-console
        console.log('@@POST party response data', response);
      } else if (error) {
        // eslint-disable-next-line no-console
        console.log('@@POST party response error', error);
      }
    },
    onPostClientVerificationsSettled: (data, error) => {
      if (data) {
        // eslint-disable-next-line no-console
        console.log('@@POST verifications response data', data);
      } else if (error) {
        // eslint-disable-next-line no-console
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
    enableSidebar: {
      control: {
        type: 'boolean',
      },
      description: 'Enable sidebar navigation with onboarding timeline',
    },
  },
};

export default meta;

const Template: StoryFn<OnboardingFlowStoryArgs> = (args) => {
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
  alertOnExit: false,
  docUploadOnlyMode: false,
};

export const STheme = Template.bind({});
STheme.storyName = '"S" Theme';
STheme.args = {
  ...Default.args,
  themePreset: 'Salt',
};

export const SellSenseTheme = Template.bind({});
SellSenseTheme.storyName = 'SellSense Theme';
SellSenseTheme.args = {
  ...Default.args,
  themePreset: 'SellSense',
};
SellSenseTheme.tags = ['@sellsense', '@theme'];

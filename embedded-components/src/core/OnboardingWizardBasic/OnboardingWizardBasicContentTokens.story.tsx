import type { Meta } from '@storybook/react-vite';

import OnboardingWizardBasicMeta, {
  Default,
  OnboardingWizardBasicWithProviderProps,
} from './OnboardingWizardBasicSP.story';

const meta: Meta<OnboardingWizardBasicWithProviderProps> = {
  ...OnboardingWizardBasicMeta,
  title: 'Onboarding Wizard Basic / Content Tokens',
};
export default meta;

export const English = Default.bind({});
English.storyName = 'English with default content';
English.args = Default.args;

export const French = Default.bind({});
French.storyName = 'French with default content';
French.args = {
  ...Default.args,
  contentTokens: {
    name: 'frCA',
  },
};

export const EnglishWithCustomContent = Default.bind({});
EnglishWithCustomContent.storyName = 'English with custom content';
EnglishWithCustomContent.args = {
  ...Default.args,
  contentTokens: {
    name: 'enUS',
    tokens: {
      onboarding: {
        title: 'Custom title',
      },
    },
  },
};

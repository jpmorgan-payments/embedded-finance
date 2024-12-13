import type { Meta } from '@storybook/react';

import OnboardingWizardBasicMeta, {
  Default,
  OnboardingWizardBasicWithProviderProps,
} from './OnboardingWizardBasic.story';

const meta: Meta<OnboardingWizardBasicWithProviderProps> = {
  ...OnboardingWizardBasicMeta,
  title: 'Onboarding Wizard Basic / Language & Content Tokens',
};
export default meta;

export const English = Default.bind({});
English.storyName = 'English with default content';
English.args = Default.args;

export const French = Default.bind({});
French.storyName = 'French with default content';
French.args = {
  ...Default.args,
  language: 'fr',
};

export const EnglishWithCustomContent = Default.bind({});
EnglishWithCustomContent.storyName = 'English with custom content';
EnglishWithCustomContent.args = {
  ...Default.args,
  contentTokenOverrides: {
    en: {
      title: 'Custom title',
    },
  },
};

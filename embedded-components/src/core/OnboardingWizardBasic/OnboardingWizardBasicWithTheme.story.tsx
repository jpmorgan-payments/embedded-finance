import type { Meta } from '@storybook/react';

import OnboardingWizardBasicMeta, {
  Default,
  OnboardingWizardBasicWithProviderProps,
} from './OnboardingWizardBasicSP.story';

const meta: Meta<OnboardingWizardBasicWithProviderProps> = {
  ...OnboardingWizardBasicMeta,
  title: 'Onboarding Wizard Basic / Appearance & Theme',
};
export default meta;

export const DefaultTheme = Default.bind({});
DefaultTheme.storyName = 'Default Theme / Appearance';
DefaultTheme.args = Default.args;

export const CustomTheme = Default.bind({});
CustomTheme.storyName = 'Custom Theme (Coming Soon)';
CustomTheme.args = {
  ...Default.args,
  theme: {
    variables: {
      headerFontFamily: 'Arial',
      fontFamily: 'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
      primaryColor: '#0060f0',
      primaryHoverColor: '#0a4386',
      primaryActiveColor: '#0b76da',
      primaryForegroundColor: '#fff',
      secondaryColor: '#d6d6d6',
      secondaryHoverColor: '#bcbcbc',
      secondaryActiveColor: '#e5e5e5',
      secondaryForegroundColor: '#414042',
      buttonBorderRadius: '.313em',
      buttonFontWeight: '600',
      buttonFontSize: '1rem',
      buttonLineHeight: '1.5rem',
    },
  },
};

export const DarkTheme = Default.bind({});
DarkTheme.storyName = 'Dark theme';
DarkTheme.args = {
  ...DefaultTheme.args,
  theme: {
    colorScheme: 'dark',
  },
};

export const FontFamily = Default.bind({});
FontFamily.storyName = 'Different font';
FontFamily.args = {
  ...Default.args,
  theme: {
    variables: {
      fontFamily: 'Nunito sans',
      borderRadius: '15px',
      primaryColor: 'teal',
    },
  },
};

export const LineStepper = Default.bind({});
LineStepper.storyName = 'Line stepper variant';
LineStepper.args = {
  ...Default.args,
  variant: 'line',
};

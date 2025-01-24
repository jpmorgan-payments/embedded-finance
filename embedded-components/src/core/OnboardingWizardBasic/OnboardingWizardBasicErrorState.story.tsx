import type { Meta, StoryFn } from '@storybook/react';
import { useDarkMode } from 'storybook-dark-mode';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { EBConfig } from '@/core/EBComponentsProvider/config.types';
import { OnboardingWizardBasicProps } from '@/core/OnboardingWizardBasic/OnboardingWizardBasic';

export type OnboardingWizardBasicWithProviderProps =
  OnboardingWizardBasicProps & EBConfig;

// Test component that throws an error
function BuggyComponent() {
  throw new Error('Test error message');
  return null;
}

const meta: Meta<OnboardingWizardBasicWithProviderProps> = {
  title: 'Onboarding Wizard Basic/ Error States',
  component: BuggyComponent,

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

const Template: StoryFn<OnboardingWizardBasicWithProviderProps> = () => (
  <BuggyComponent />
);

export const Default = Template.bind({});
Default.storyName = 'Render Error';

import type { Meta, StoryFn } from '@storybook/react-vite';

import { OnboardingWizardBasicProps } from '@/core/OnboardingWizardBasic/OnboardingWizardBasic';

import type { BaseStoryArgs } from '../../../.storybook/preview';

/**
 * Story args interface extending base provider args
 */
export type OnboardingWizardBasicErrorStoryArgs = OnboardingWizardBasicProps &
  BaseStoryArgs;

// Test component that throws an error
function BuggyComponent() {
  throw new Error('Test error message');
  return null;
}

const meta: Meta<OnboardingWizardBasicErrorStoryArgs> = {
  title: 'Legacy/OnboardingWizardBasic/ErrorStates',
  component: BuggyComponent,
  tags: ['@legacy', '@onboarding'],
};

export default meta;

const Template: StoryFn<OnboardingWizardBasicErrorStoryArgs> = () => (
  <BuggyComponent />
);

export const Default = Template.bind({});
Default.storyName = 'Render Error';
Default.args = {
  apiBaseUrl: '/',
};

import { Meta } from '@storybook/react-vite';
import { SELLSENSE_THEME } from '@storybook-themes';

import defaultMeta, {
  Default,
  OnboardingFlowWithProviderProps,
  STheme,
} from './OnboardingFlow.story';

const meta: Meta<OnboardingFlowWithProviderProps> = {
  ...defaultMeta,
  title: 'Core/OnboardingFlow/Features/Sidebar',
  tags: ['@core', '@onboarding', '@sidebar'],
  argTypes: {
    ...defaultMeta.argTypes,
    enableSidebar: {
      control: {
        type: 'boolean',
      },
      description: 'Enable sidebar navigation with onboarding timeline',
    },
  },
};

export default meta;

export const WithSidebar = Default.bind({});
WithSidebar.storyName = 'Sidebar Enabled';
WithSidebar.args = {
  ...Default.args,
  enableSidebar: true,
};
WithSidebar.parameters = {
  docs: {
    description: {
      story: `
        This story demonstrates the OnboardingFlow with the sidebar navigation enabled (\`enableSidebar: true\`).
        
        **Key Features:**
        - **Timeline Navigation**: The sidebar shows a complete timeline of all onboarding sections and steps
        - **Progress Tracking**: Visual indicators show completion status (completed, current, not started, on hold)
        - **Interactive Navigation**: Click on sections or steps to navigate directly to specific parts of the flow
        - **Responsive Design**: Sidebar is automatically hidden on mobile devices
        - **Enhanced UX**: Provides better overview and context for complex onboarding flows
        
        **Navigation Behavior:**
        - Clicking on a section navigates to that section's first incomplete step
        - Clicking on a step within the current section navigates directly to that step
        - Disabled during form submission to prevent navigation conflicts
        
        The sidebar provides users with a clear understanding of their progress and allows for non-linear navigation through the onboarding process.
      `,
    },
  },
};

export const WithoutSidebar = Default.bind({});
WithoutSidebar.storyName = 'Sidebar Disabled (Default)';
WithoutSidebar.args = {
  ...Default.args,
  enableSidebar: false,
};
WithoutSidebar.parameters = {
  docs: {
    description: {
      story: `
        This story shows the default OnboardingFlow without the sidebar (\`enableSidebar: false\` or not set).
        
        **Default Behavior:**
        - Linear progression through the onboarding flow
        - Standard responsive layout without sidebar
        - Focus on current step without overview navigation
        
        Compare this with the "Sidebar Enabled" story to see the difference in layout and navigation capabilities.
      `,
    },
  },
};

export const WithSidebarAndTheme = STheme.bind({});
WithSidebarAndTheme.storyName = 'Sidebar with Custom Theme';
WithSidebarAndTheme.args = {
  ...STheme.args,
  enableSidebar: true,
};
WithSidebarAndTheme.parameters = {
  docs: {
    description: {
      story: `
        This story demonstrates how the sidebar timeline adapts to custom theme variables while maintaining its functionality.
        
        **Theme Integration:**
        - Sidebar components inherit theme variables like colors, fonts, and border radius
        - Timeline status indicators use theme-aware colors
        - Navigation interactions respect theme hover and focus states
        - Typography follows the theme's font family settings
        
        The sidebar seamlessly integrates with any theme configuration while preserving its navigation and progress tracking capabilities.
      `,
    },
  },
};

export const WithSidebarSellSense = Default.bind({});
WithSidebarSellSense.storyName = 'Sidebar with SellSense Theme';
WithSidebarSellSense.args = {
  ...Default.args,
  enableSidebar: true,
  theme: SELLSENSE_THEME,
};
WithSidebarSellSense.tags = ['@sellsense'];
WithSidebarSellSense.parameters = {
  docs: {
    description: {
      story: `
        This story showcases the sidebar navigation with the SellSense theme, demonstrating enterprise-grade styling.
        
        **SellSense Theme Features:**
        - Professional color palette and typography
        - Enhanced visual hierarchy in the timeline
        - Branded styling that maintains accessibility
        - Consistent design language across sidebar and main content
        
        The sidebar maintains full functionality while adopting the SellSense brand identity.
      `,
    },
  },
};

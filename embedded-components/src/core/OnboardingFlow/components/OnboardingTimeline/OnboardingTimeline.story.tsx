import type { Meta, StoryObj } from '@storybook/react-vite';

import { ScreenId } from '@/core/OnboardingFlow/types';

import type { BaseStoryArgs } from '../../../../../../.storybook/preview';
import { OnboardingTimeline, TimelineSection } from './OnboardingTimeline';

/**
 * Story args interface extending base provider args
 */
interface OnboardingTimelineStoryArgs extends BaseStoryArgs {
  sections: TimelineSection[];
  currentSectionId?: string;
  currentStepId?: string;
  onSectionClick?: (sectionId: string) => void;
  onStepClick?: (sectionId: string, stepId: string) => void;
}

/**
 * Wrapper component for stories - NO EBComponentsProvider here!
 * The global decorator in preview.tsx handles the provider wrapping.
 */
const OnboardingTimelineStory = (
  props: Omit<OnboardingTimelineStoryArgs, keyof BaseStoryArgs>
) => {
  return (
    <div className="eb-flex eb-flex-1">
      <div className="eb-max-w-md eb-shrink-0 eb-border">
        <OnboardingTimeline {...props} />
      </div>
    </div>
  );
};

const meta: Meta<OnboardingTimelineStoryArgs> = {
  component: OnboardingTimelineStory,
  title: 'Core/OnboardingFlow/Components/OnboardingTimeline',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <OnboardingTimelineStory
      sections={args.sections}
      currentSectionId={args.currentSectionId}
      currentStepId={args.currentStepId}
      onSectionClick={args.onSectionClick}
      onStepClick={args.onStepClick}
    />
  ),
};

export default meta;
type Story = StoryObj<OnboardingTimelineStoryArgs>;

const mockSections: TimelineSection[] = [
  {
    id: 'business-section',
    title: 'Business Information',
    description: 'Company details and verification',
    status: 'completed',
    steps: [
      {
        id: 'business-info',
        title: 'Business Details',
        description: 'Company name, type, and registration',
        status: 'completed',
      },
      {
        id: 'business-address',
        title: 'Business Address',
        description: 'Primary business location',
        status: 'completed',
      },
      {
        id: 'contact-info',
        title: 'Contact Information',
        description: 'Business address and contact details',
        status: 'completed',
      },
      {
        id: 'industry-details',
        title: 'Industry Details',
        description: 'Business industry and operational information',
        status: 'completed',
      },
    ],
  },
  {
    id: 'personal-section',
    title: 'Personal Information',
    description: 'Your personal details and identification',
    status: 'current',
    steps: [
      {
        id: 'personal-details',
        title: 'Personal Details',
        description: 'Name, date of birth, and contact information',
        status: 'completed',
      },
      {
        id: 'address-verification',
        title: 'Address Verification',
        description: 'Residential address confirmation',
        status: 'completed',
      },
      {
        id: 'identity-document',
        title: 'Identity Document',
        description: 'Government-issued ID upload',
        status: 'current',
      },
      {
        id: 'proof-of-address',
        title: 'Proof of Address',
        description: 'Recent utility bill or bank statement',
        status: 'not_started',
      },
    ],
  },
  {
    id: 'financial-section' as ScreenId,
    title: 'Financial Information',
    description: 'Business finances and banking details',
    status: 'not_started',
    steps: [
      {
        id: 'bank-details',
        title: 'Bank Account Details',
        description: 'Primary business banking information',
        status: 'not_started',
      },
      {
        id: 'financial-statements',
        title: 'Financial Statements',
        description: 'Recent financial records and tax returns',
        status: 'not_started',
      },
      {
        id: 'revenue-info',
        title: 'Revenue Information',
        description: 'Expected transaction volumes and revenue',
        status: 'not_started',
      },
    ],
  },
  {
    id: 'compliance-section' as ScreenId,
    title: 'Compliance & Verification',
    description: 'Final checks and approvals',
    status: 'not_started',
    steps: [
      {
        id: 'kyc-verification',
        title: 'KYC Verification',
        description: 'Know Your Customer compliance check',
        status: 'not_started',
      },
      {
        id: 'risk-assessment',
        title: 'Risk Assessment',
        description: 'Business risk evaluation',
        status: 'not_started',
      },
      {
        id: 'final-approval',
        title: 'Final Approval',
        description: 'Account activation and setup completion',
        status: 'not_started',
      },
    ],
  },
];

export const Default: Story = {
  args: {
    apiBaseUrl: '/',
    sections: mockSections,
    currentSectionId: 'personal-section',
    currentStepId: 'identity-document',
  },
};

export const FirstSection: Story = {
  args: {
    apiBaseUrl: '/',
    sections: mockSections,
    currentSectionId: 'business-section',
    currentStepId: 'business-info',
  },
};

export const AllCompleted: Story = {
  args: {
    apiBaseUrl: '/',
    sections: mockSections.map((section) => ({
      ...section,
      status: 'completed' as const,
      steps: section.steps.map((step) => ({
        ...step,
        status: 'completed' as const,
      })),
    })),
    currentSectionId: 'compliance-section',
    currentStepId: 'final-approval',
  },
};

export const LastSection: Story = {
  args: {
    apiBaseUrl: '/',
    sections: mockSections,
    currentSectionId: 'compliance-section',
    currentStepId: 'kyc-verification',
  },
};

export const WithCustomHandlers: Story = {
  args: {
    apiBaseUrl: '/',
    sections: mockSections,
    currentSectionId: 'personal-section',
    currentStepId: 'identity-document',
    onSectionClick: (sectionId: string) => {
      // eslint-disable-next-line no-console
      console.log('Section clicked:', sectionId);
    },
    onStepClick: (sectionId: string, stepId: string) => {
      // eslint-disable-next-line no-console
      console.log('Step clicked:', sectionId, stepId);
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the interactive features of the timeline. Open the browser console to see click events.',
      },
    },
  },
};

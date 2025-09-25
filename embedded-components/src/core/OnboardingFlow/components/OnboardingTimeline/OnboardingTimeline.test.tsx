import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';

import { ScreenId } from '@/core/OnboardingFlow/types';

import { OnboardingTimeline, type TimelineSection } from './OnboardingTimeline';

describe('OnboardingTimeline', () => {
  const mockSections: TimelineSection[] = [
    {
      id: 'section1' as ScreenId,
      title: 'Personal Information',
      status: 'completed',
      steps: [
        {
          id: 'step1-1',
          title: 'Basic Details',
          status: 'completed',
        },
        {
          id: 'step1-2',
          title: 'Address Information',
          status: 'completed',
        },
      ],
    },
    {
      id: 'section2' as ScreenId,
      title: 'Business Information',
      status: 'current',
      steps: [
        {
          id: 'step2-1',
          title: 'Company Details',
          status: 'current',
        },
        {
          id: 'step2-2',
          title: 'Business Address',
          status: 'not_started',
        },
      ],
    },
    {
      id: 'section3' as ScreenId,
      title: 'Documents Upload',
      status: 'not_started',
      steps: [
        {
          id: 'step3-1',
          title: 'ID Documents',
          status: 'not_started',
        },
        {
          id: 'step3-2',
          title: 'Business Documents',
          status: 'not_started',
        },
      ],
    },
  ];

  const mockProps = {
    sections: mockSections,
    currentSectionId: 'section2',
    currentStepId: 'step2-1',
    onSectionClick: vi.fn(),
    onStepClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders correctly with initial data', () => {
    render(<OnboardingTimeline {...mockProps} title="Onboarding Progress" />);

    // Check header content
    expect(screen.getByText('Onboarding Progress')).toBeInTheDocument();

    // Check sections are rendered
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('Business Information')).toBeInTheDocument();
    expect(screen.getByText('Documents Upload')).toBeInTheDocument();
  });

  test('displays current section steps when section is active', () => {
    render(<OnboardingTimeline {...mockProps} />);

    // Current section steps should be visible
    expect(screen.getByText('Company Details')).toBeInTheDocument();
    expect(screen.getByText('Business Address')).toBeInTheDocument();

    // Other sections' steps should not be visible
    expect(screen.queryByText('Basic Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Address Information')).not.toBeInTheDocument();
    expect(screen.queryByText('ID Documents')).not.toBeInTheDocument();
  });

  test('handles section click interactions', async () => {
    const user = userEvent.setup();
    render(<OnboardingTimeline {...mockProps} />);

    const personalInfoSection = screen
      .getByText('Personal Information')
      .closest('button');
    expect(personalInfoSection).toBeInTheDocument();

    await user.click(personalInfoSection!);

    expect(mockProps.onSectionClick).toHaveBeenCalledWith('section1');
  });

  test('handles step click interactions', async () => {
    const user = userEvent.setup();
    render(<OnboardingTimeline {...mockProps} />);

    const companyDetailsStep = screen
      .getByText('Company Details')
      .closest('button');
    expect(companyDetailsStep).toBeInTheDocument();

    await user.click(companyDetailsStep!);

    expect(mockProps.onStepClick).toHaveBeenCalledWith('section2', 'step2-1');
  });

  test('applies correct styling for current section', () => {
    render(<OnboardingTimeline {...mockProps} />);

    const currentSectionButton = screen
      .getByText('Business Information')
      .closest('button');

    // Current section with steps and a current step should NOT have highlight
    // because the highlight is only for sections without steps or without current step
    expect(currentSectionButton).toHaveClass('eb-bg-transparent');
    expect(currentSectionButton).not.toHaveClass('eb-bg-sidebar-accent');

    // Check that there's no primary indicator line for section with current step
    const primaryIndicator =
      currentSectionButton?.querySelector('.eb-bg-primary');
    expect(primaryIndicator).not.toBeInTheDocument();
  });

  test('applies correct styling for current section without steps', () => {
    const sectionsWithoutSteps: TimelineSection[] = [
      {
        id: 'section1' as ScreenId,
        title: 'Simple Section',
        status: 'current',
        steps: [],
      },
    ];

    render(
      <OnboardingTimeline
        sections={sectionsWithoutSteps}
        currentSectionId="section1"
        onSectionClick={vi.fn()}
        onStepClick={vi.fn()}
      />
    );

    const currentSectionButton = screen
      .getByText('Simple Section')
      .closest('button');

    // Section without steps should have highlight styling
    expect(currentSectionButton).toHaveClass('eb-bg-sidebar-accent');
    expect(currentSectionButton).toHaveClass('eb-font-medium');
    expect(currentSectionButton).toHaveClass(
      'eb-text-sidebar-accent-foreground'
    );

    // Check for primary indicator line
    const primaryIndicator =
      currentSectionButton?.querySelector('.eb-bg-primary');
    expect(primaryIndicator).toBeInTheDocument();
  });

  test('applies correct styling for current step', () => {
    render(<OnboardingTimeline {...mockProps} />);

    const currentStepButton = screen
      .getByText('Company Details')
      .closest('button');
    expect(currentStepButton).toHaveClass('eb-font-medium');
    expect(currentStepButton).toHaveClass('eb-bg-sidebar-accent');
  });

  test('renders correct status icons for different states', () => {
    render(<OnboardingTimeline {...mockProps} />);

    // Check that status icons are rendered (using class selectors since icons are SVG)
    const completedIcons = document.querySelectorAll('.eb-bg-success');
    expect(completedIcons.length).toBeGreaterThan(0);

    const notStartedIcons = document.querySelectorAll(
      '.eb-text-muted-foreground\\/80'
    );
    expect(notStartedIcons.length).toBeGreaterThan(0);

    // Check for current status icons (they have border-success class)
    const currentIcons = document.querySelectorAll('.eb-border-success');
    expect(currentIcons.length).toBeGreaterThan(0);

    // Check that we have CircleDashed icons for not_started items
    const circleDashedIcons = document.querySelectorAll(
      '.lucide-circle-dashed'
    );
    expect(circleDashedIcons.length).toBeGreaterThan(0);
  });

  test('shows steps only for current section', () => {
    const propsWithDifferentCurrentSection = {
      ...mockProps,
      currentSectionId: 'section1',
      currentStepId: 'step1-1',
    };

    render(<OnboardingTimeline {...propsWithDifferentCurrentSection} />);

    // Section 1 steps should be visible
    expect(screen.getByText('Basic Details')).toBeInTheDocument();
    expect(screen.getByText('Address Information')).toBeInTheDocument();

    // Section 2 steps should not be visible
    expect(screen.queryByText('Company Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Business Address')).not.toBeInTheDocument();
  });

  test('handles sections without steps', () => {
    const sectionsWithoutSteps: TimelineSection[] = [
      {
        id: 'section1' as ScreenId,
        title: 'Simple Section',
        status: 'completed',
        steps: [],
      },
      {
        id: 'section2' as ScreenId,
        title: 'Another Section',
        status: 'current',
        steps: [],
      },
    ];

    render(
      <OnboardingTimeline
        {...mockProps}
        sections={sectionsWithoutSteps}
        currentSectionId="section2"
      />
    );

    expect(screen.getByText('Simple Section')).toBeInTheDocument();
    expect(screen.getByText('Another Section')).toBeInTheDocument();
  });

  test('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<OnboardingTimeline {...mockProps} />);

    const firstSectionButton = screen
      .getByText('Personal Information')
      .closest('button');
    expect(firstSectionButton).toBeInTheDocument();

    firstSectionButton!.focus();
    await user.keyboard('{Enter}');

    expect(mockProps.onSectionClick).toHaveBeenCalledWith('section1');
  });

  test('handles edge case with no current section', () => {
    const propsWithoutCurrent = {
      ...mockProps,
      currentSectionId: undefined,
      currentStepId: undefined,
    };

    render(<OnboardingTimeline {...propsWithoutCurrent} />);

    // Should render without errors
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('Business Information')).toBeInTheDocument();
    expect(screen.getByText('Documents Upload')).toBeInTheDocument();

    // No steps should be visible
    expect(screen.queryByText('Company Details')).not.toBeInTheDocument();
  });

  test('handles click events with preventDefault', async () => {
    const user = userEvent.setup();
    render(<OnboardingTimeline {...mockProps} />);

    const sectionButton = screen
      .getByText('Personal Information')
      .closest('button');
    const stepButton = screen.getByText('Company Details').closest('button');

    // Mock preventDefault to ensure it's called
    const preventDefaultSpy = vi.fn();
    const originalPreventDefault = Event.prototype.preventDefault;
    Event.prototype.preventDefault = preventDefaultSpy;

    await user.click(sectionButton!);
    await user.click(stepButton!);

    // Restore original method
    Event.prototype.preventDefault = originalPreventDefault;

    expect(mockProps.onSectionClick).toHaveBeenCalled();
    expect(mockProps.onStepClick).toHaveBeenCalled();
  });

  test('applies custom className', () => {
    const customClass = 'custom-timeline-class';
    const { container } = render(
      <OnboardingTimeline {...mockProps} className={customClass} />
    );

    const timelineElement = container.firstChild as HTMLElement;
    expect(timelineElement).toHaveClass(customClass);
    expect(timelineElement).toHaveClass('eb-component'); // Default classes should still be present
    expect(timelineElement).toHaveClass('eb-flex');
    expect(timelineElement).toHaveClass('eb-flex-col');
  });

  test('passes through additional props', () => {
    const dataTestId = 'timeline-test-id';
    render(<OnboardingTimeline {...mockProps} data-testid={dataTestId} />);

    const timelineElement = screen.getByTestId(dataTestId);
    expect(timelineElement).toBeInTheDocument();
  });

  test('renders connecting lines between sections and steps', () => {
    render(<OnboardingTimeline {...mockProps} />);

    // Check for connecting line elements (using transform classes as indicators)
    const connectingLines = document.querySelectorAll(
      '[class*="eb--translate-y"]'
    );
    expect(connectingLines.length).toBeGreaterThan(0);
  });

  test('displays proper visual hierarchy', () => {
    render(<OnboardingTimeline {...mockProps} />);

    // All section buttons should have consistent base styling
    const sectionTitles = screen.getAllByText(/Information|Documents/);
    sectionTitles.forEach((title) => {
      const button = title.closest('button');
      expect(button).toHaveClass('eb-peer/menu-button');
      expect(button).toHaveClass('eb-relative');
      expect(button).toHaveClass('eb-flex');
    });

    // Current section with steps should not have highlight (only shows on steps)
    const currentSectionButton = screen
      .getByText('Business Information')
      .closest('button');
    expect(currentSectionButton).toHaveClass('eb-bg-transparent');
    expect(currentSectionButton).not.toHaveClass('eb-bg-sidebar-accent');

    // Current step should have highlighted styling
    const currentStepButton = screen
      .getByText('Company Details')
      .closest('button');
    expect(currentStepButton).toHaveClass('eb-bg-sidebar-accent');
    expect(currentStepButton).toHaveClass('eb-font-medium');
    expect(currentStepButton).toHaveClass('eb-text-sidebar-accent-foreground');
  });
});

import { LucideIcon } from 'lucide-react';

export type TimelineItemStatus = 'pending' | 'current' | 'completed';

export interface TimelineStep {
  id: string;
  title: string;
  description?: string;
  status: TimelineItemStatus;
  icon?: LucideIcon;
}

export interface TimelineSection {
  id: string;
  title: string;
  description?: string;
  status: TimelineItemStatus;
  icon?: LucideIcon;
  steps: TimelineStep[];
}

export interface OnboardingTimelineProps extends React.ComponentProps<'div'> {
  /**
   * Array of timeline sections containing steps
   */
  sections: TimelineSection[];

  /**
   * ID of the currently active section
   */
  currentSectionId?: string;

  /**
   * ID of the currently active step within the current section
   */
  currentStepId?: string;

  /**
   * Callback fired when a section is clicked
   */
  onSectionClick?: (sectionId: string) => void;

  /**
   * Callback fired when a step is clicked
   */
  onStepClick?: (sectionId: string, stepId: string) => void;
}

import React from 'react';
import { LandmarkIcon, PlusCircleIcon } from 'lucide-react';

export interface EmptyStateProps {
  /** Optional custom message */
  message?: string;
  /** Optional custom description */
  description?: string;
  /** Optional CSS class name */
  className?: string;
}

/**
 * EmptyState - Displays when no linked accounts are found
 * Enhanced with icon and helpful description
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No linked accounts',
  description = 'Link a bank account to start making payments. You can use ACH, wire transfers, or real-time payments.',
  className,
}) => {
  return (
    <div
      className={`eb-flex eb-flex-col eb-items-center eb-justify-center eb-space-y-3 eb-py-12 eb-text-center ${className || ''}`}
    >
      <div className="eb-relative">
        <div className="eb-rounded-full eb-bg-muted eb-p-4">
          <LandmarkIcon className="eb-h-8 eb-w-8 eb-text-muted-foreground" />
        </div>
        <div className="eb-absolute -eb-bottom-1 -eb-right-1 eb-rounded-full eb-bg-background eb-p-0.5">
          <PlusCircleIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
        </div>
      </div>
      <div className="eb-space-y-1">
        <h3 className="eb-text-base eb-font-semibold eb-text-foreground">
          {message}
        </h3>
        <p className="eb-max-w-sm eb-text-sm eb-text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
};

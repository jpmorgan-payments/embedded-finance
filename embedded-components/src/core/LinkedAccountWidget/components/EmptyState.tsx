import React from 'react';

export interface EmptyStateProps {
  /** Optional custom message */
  message?: string;
  /** Optional CSS class name */
  className?: string;
}

/**
 * EmptyState - Displays when no linked accounts are found
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No linked accounts found',
  className,
}) => {
  return (
    <div
      className={`eb-py-8 eb-text-center eb-text-gray-500 ${className || ''}`}
    >
      {message}
    </div>
  );
};

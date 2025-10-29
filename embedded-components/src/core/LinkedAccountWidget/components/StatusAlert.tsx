import React from 'react';
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  InfoIcon,
  XCircleIcon,
} from 'lucide-react';

import { RecipientStatus } from '@/api/generated/ep-recipients.schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { STATUS_EXPLANATIONS } from '../LinkedAccountWidget.constants';

export interface StatusAlertProps {
  /** The recipient status */
  status: RecipientStatus;
  /** Optional custom title */
  title?: string;
  /** Optional custom description */
  description?: string;
  /** Optional CSS class name */
  className?: string;
  /** Optional action button or element to display below the message */
  action?: React.ReactNode;
}

/**
 * Get alert variant and icon based on status
 */
const getAlertConfig = (status: RecipientStatus) => {
  switch (status) {
    case 'ACTIVE':
      return {
        variant: 'default' as const,
        icon: CheckCircle2Icon,
        iconClass: 'eb-text-green-600',
      };
    case 'READY_FOR_VALIDATION':
      return {
        variant: 'warning' as const,
        icon: AlertCircleIcon,
        iconClass: 'eb-text-warning',
      };
    case 'REJECTED':
      return {
        variant: 'destructive' as const,
        icon: XCircleIcon,
        iconClass: 'eb-text-destructive',
      };
    case 'MICRODEPOSITS_INITIATED':
    case 'PENDING':
      return {
        variant: 'default' as const,
        icon: ClockIcon,
        iconClass: 'eb-text-blue-600',
      };
    default:
      return {
        variant: 'default' as const,
        icon: InfoIcon,
        iconClass: 'eb-text-muted-foreground',
      };
  }
};

/**
 * StatusAlert - Shows contextual information based on account status
 */
export const StatusAlert: React.FC<StatusAlertProps> = ({
  status,
  title,
  description,
  className,
  action,
}) => {
  const { variant, icon: Icon, iconClass } = getAlertConfig(status);
  const defaultDescription = STATUS_EXPLANATIONS[status];

  // Don't show alert for active accounts unless custom content is provided
  if (status === 'ACTIVE' && !title && !description) {
    return null;
  }

  return (
    <Alert variant={variant} className={className} noTitle>
      <Icon className={`eb-h-4 eb-w-4 ${iconClass}`} />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{description || defaultDescription}</AlertDescription>
      {action && <div className="eb-mt-3">{action}</div>}
    </Alert>
  );
};

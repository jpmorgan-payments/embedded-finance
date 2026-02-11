import { FC } from 'react';
import { AlertTriangleIcon, InfoIcon, XCircleIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { ErrorType } from '@/api/axios-instance';
import { ApiError } from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';

import {
  interceptError,
  isKnownError,
  type InterceptedError,
} from '../../utils';

/**
 * Props for FriendlyErrorAlert component
 */
export interface FriendlyErrorAlertProps {
  /**
   * The API error to display
   */
  error: ErrorType<ApiError> | null;

  /**
   * Custom title to display for unknown errors (passed to ServerErrorAlert)
   */
  customTitle?: string;

  /**
   * Whether to show technical details for unknown errors (passed to ServerErrorAlert)
   */
  showDetails?: boolean;

  /**
   * Optional CSS class name
   */
  className?: string;

  /**
   * i18n namespace to use for translations
   * @default 'recipients'
   */
  i18nNamespace?: 'recipients' | 'linked-accounts';
}

/**
 * Get icon component based on error variant
 */
const getIcon = (variant: 'warning' | 'error' | 'info') => {
  switch (variant) {
    case 'warning':
      return AlertTriangleIcon;
    case 'error':
      return XCircleIcon;
    case 'info':
    default:
      return InfoIcon;
  }
};

/**
 * Get alert variant based on error variant
 */
const getAlertVariant = (
  variant: 'warning' | 'error' | 'info'
): 'warning' | 'destructive' | 'default' => {
  switch (variant) {
    case 'warning':
      return 'warning';
    case 'error':
      return 'destructive';
    case 'info':
    default:
      return 'default';
  }
};

/**
 * Internal component for rendering known error alerts
 */
const KnownErrorAlert: FC<{
  interceptedError: InterceptedError;
  className?: string;
  i18nNamespace: 'recipients' | 'linked-accounts';
}> = ({ interceptedError, className, i18nNamespace }) => {
  const { t } = useTranslation(i18nNamespace);
  // Type assertion to avoid TypeScript overload issues with dynamic keys
  const translate = t as (key: string) => string;
  const { config, context } = interceptedError;

  const Icon = getIcon(config.variant);
  const alertVariant = getAlertVariant(config.variant);

  const title = translate(config.titleKey);
  const description = translate(config.descriptionKey);
  const suggestion = config.suggestionKey
    ? translate(config.suggestionKey)
    : undefined;

  return (
    <Alert
      variant={alertVariant}
      className={cn('eb-animate-fade-in', className)}
    >
      <Icon className="eb-h-4 eb-w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="eb-space-y-2">
        <p>{description}</p>
        {suggestion && (
          <p className="eb-text-sm eb-font-medium">{suggestion}</p>
        )}
        {context?.message && (
          <p className="eb-mt-2 eb-text-xs eb-opacity-80">{context.message}</p>
        )}
      </AlertDescription>
    </Alert>
  );
};

/**
 * FriendlyErrorAlert - Smart error display that shows user-friendly messages
 * for known error types and falls back to ServerErrorAlert for unknown errors.
 *
 * This component automatically intercepts API errors and displays contextual,
 * user-friendly messages for recognized error patterns (e.g., RTP unavailable).
 * For unrecognized errors, it displays the standard ServerErrorAlert.
 *
 * @example
 * ```tsx
 * // Will show friendly message for RTP_UNAVAILABLE, standard alert for others
 * <FriendlyErrorAlert
 *   error={apiError}
 *   customTitle="Unable to add recipient"
 *   showDetails
 * />
 * ```
 */
export const FriendlyErrorAlert: FC<FriendlyErrorAlertProps> = ({
  error,
  customTitle,
  showDetails = false,
  className,
  i18nNamespace = 'recipients',
}) => {
  if (!error) {
    return null;
  }

  // Try to intercept the error
  const interceptionResult = interceptError(error);

  // If we have a known error, display the friendly version
  if (isKnownError(interceptionResult)) {
    return (
      <KnownErrorAlert
        interceptedError={interceptionResult}
        className={className}
        i18nNamespace={i18nNamespace}
      />
    );
  }

  // Fall back to standard ServerErrorAlert for unknown errors
  return (
    <ServerErrorAlert
      error={error}
      customTitle={customTitle}
      showDetails={showDetails}
      className={className}
    />
  );
};

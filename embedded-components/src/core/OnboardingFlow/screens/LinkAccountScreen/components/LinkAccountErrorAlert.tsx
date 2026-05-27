import { useTranslationWithTokens } from '@/i18n';

import { ServerErrorAlert } from '@/components/ServerErrorAlert';

type LinkAccountErrorAlertProps = {
  error: unknown;
};

/**
 * Renders the standard error alert for link-account submission failures.
 * Extracts the repeated inline error message config into a reusable component.
 */
export function LinkAccountErrorAlert({ error }: LinkAccountErrorAlertProps) {
  const { t } = useTranslationWithTokens(['onboarding-overview']);

  if (!error) return null;

  return (
    <ServerErrorAlert
      error={error as any}
      customTitle={t(
        'screens.linkAccount.errorTitle',
        'Failed to link account'
      )}
      customErrorMessage={{
        '400': t(
          'screens.linkAccount.errors.400',
          'Please check the information you entered and try again.'
        ),
        '401': t(
          'screens.linkAccount.errors.401',
          'Your session has expired. Please log in and try again.'
        ),
        '409': t(
          'screens.linkAccount.errors.409',
          'This account may already exist. Please check your linked accounts.'
        ),
        '422': t(
          'screens.linkAccount.errors.422',
          'The account information is invalid. Please verify and try again.'
        ),
        '500': t(
          'screens.linkAccount.errors.500',
          'An unexpected error occurred. Please try again later.'
        ),
        default: t(
          'screens.linkAccount.errors.default',
          'An unexpected error occurred. Please try again.'
        ),
      }}
      showDetails={false}
    />
  );
}

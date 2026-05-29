/**
 * User journey identifiers for MakePayment component
 * These are automatically tracked when userEventsHandler is provided
 */
export const MAKE_PAYMENT_USER_JOURNEYS = {
  FORM_STARTED: 'payment_form_started',
  FORM_SUBMITTED: 'payment_submitted',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  ACCOUNT_SELECTED: 'payment_account_selected',
  RECIPIENT_SELECTED: 'payment_recipient_selected',
  PAYMENT_METHOD_SELECTED: 'payment_method_selected',
} as const;

/**
 * User journey identifiers for OnboardingFlow component
 * These are automatically tracked when userEventsHandler is provided
 */
export const ONBOARDING_FLOW_USER_JOURNEYS = {
  SCREEN_NAVIGATION: 'onboarding_screen_navigation',
  FORM_SUBMIT: 'onboarding_form_submit',
  DOCUMENT_UPLOAD: 'onboarding_document_upload',
  STEP_COMPLETED: 'onboarding_step_completed',
  SECTION_COMPLETED: 'onboarding_section_completed',
} as const;

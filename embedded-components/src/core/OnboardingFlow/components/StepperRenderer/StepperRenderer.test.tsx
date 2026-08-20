import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import type {
  ScreenId,
  StepperStepProps,
} from '@/core/OnboardingFlow/types/flow.types';

import { StepperRenderer } from './StepperRenderer';

const stepperRendererTestContext = vi.hoisted(() => ({
  currentScreenId: 'review-attest-section' as ScreenId,
  goTo: vi.fn(),
  goBack: vi.fn(),
  setCurrentStepper: vi.fn(),
  setCurrentStepperStepIdFallback: vi.fn(),
  setIsFormSubmitting: vi.fn(),
  updateEditingPartyId: vi.fn(),
  updateSessionData: vi.fn(),
}));

vi.mock('@/core/OnboardingFlow/contexts', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/core/OnboardingFlow/contexts')>();

  return {
    ...actual,
    useOnboardingContext: () => ({
      clientData: undefined,
      organizationType: undefined,
      alertOnPreviousStep: false,
    }),
    useFlowContext: () => ({
      currentScreenId: stepperRendererTestContext.currentScreenId,
      goTo: stepperRendererTestContext.goTo,
      goBack: stepperRendererTestContext.goBack,
      originScreenId: 'owners-section',
      editingPartyIds: {},
      updateEditingPartyId: stepperRendererTestContext.updateEditingPartyId,
      previouslyCompleted: false,
      updateSessionData: stepperRendererTestContext.updateSessionData,
      initialStepperStepId: null,
      setCurrentStepper: stepperRendererTestContext.setCurrentStepper,
      sections: [],
      shortLabelOverride: null,
      savedFormValues: {},
      setCurrentStepperStepIdFallback:
        stepperRendererTestContext.setCurrentStepperStepIdFallback,
      setIsFormSubmitting: stepperRendererTestContext.setIsFormSubmitting,
      unsavedChangesRef: { current: false },
      deltaModeActive: false,
    }),
  };
});

vi.mock('@/core/OnboardingFlow/hooks/useStableStepSchemas', () => ({
  useStableStepSchemas: () => new Map(),
}));

const TestStep = ({ handleNext }: StepperStepProps) => (
  <button type="button" onClick={handleNext}>
    Complete step
  </button>
);

describe('StepperRenderer navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stepperRendererTestContext.currentScreenId = 'review-attest-section';
  });

  test('finishes Review and Terms at overview when Owners remains in history', async () => {
    const user = userEvent.setup();

    render(
      <StepperRenderer
        steps={[
          {
            id: 'documents',
            stepType: 'static',
            titleKey: 'screens.reviewAttestSection.steps.documents.title',
            Component: TestStep,
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Complete step' }));

    expect(stepperRendererTestContext.goTo).toHaveBeenCalledWith('overview', {
      resetHistory: true,
    });
    expect(stepperRendererTestContext.goTo).not.toHaveBeenCalledWith(
      'owners-section'
    );
  });

  test('returns to Owners after completing the owner stepper', async () => {
    const user = userEvent.setup();
    stepperRendererTestContext.currentScreenId = 'owner-stepper';

    render(
      <StepperRenderer
        steps={[
          {
            id: 'owner-complete',
            stepType: 'static',
            titleKey: 'screens.ownerSteps.checkAnswers.title',
            Component: TestStep,
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Complete step' }));

    expect(stepperRendererTestContext.goTo).toHaveBeenCalledWith(
      'owners-section'
    );
  });
});

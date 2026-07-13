import type { MutableRefObject } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { Stepper } from '@stepperize/react';

import { useOnboardingContext } from '@/core/OnboardingFlow/contexts/OnboardingContext';
import { OnboardingFormValuesSubmit } from '@/core/OnboardingFlow/types';
import {
  FlowConfig,
  FlowSessionData,
  ScreenId,
  SectionScreenConfig,
  SectionScreenId,
  StaticScreenConfig,
  StepConfig,
  VisibilityContext,
} from '@/core/OnboardingFlow/types/flow.types';
import type { OnboardingDeltaModeVariant } from '@/core/OnboardingFlow/types/onboarding.types';
import {
  getOrganizationParty,
  isUSExchangePTC,
} from '@/core/OnboardingFlow/utils/dataUtils';
import { DEFAULT_DELTA_MODE_VARIANT } from '@/core/OnboardingFlow/utils/deltaMode';
import { shouldSuppressOnboardingLeaveWarnings } from '@/core/OnboardingFlow/utils/flowLeaveWarnings';

type EditingPartyIds = {
  [screenId: string]: string | undefined;
};
type GoToConfig = {
  resetHistory?: boolean;
  editingPartyId?: string;
  previouslyCompleted?: boolean;
  reviewScreenOpenedSectionId?: SectionScreenId;
  initialStepperStepId?: string;
  shortLabelOverride?: string;
};

/** Extends {@link GoToConfig} with optional fallback when the stack cannot pop (see `goBack`). */
type GoBackConfig = GoToConfig & {
  /**
   * When history has only one screen, navigate here after passing the same leave guard as
   * popping (e.g. return to overview from doc-upload-only, or cancel upload form to list).
   */
  fallbackScreenId?: ScreenId;
};

const FlowContext = createContext<{
  currentScreenId: ScreenId;
  originScreenId: ScreenId | null;
  goTo: (id: ScreenId, config?: GoToConfig) => void;
  goBack: (config?: GoBackConfig) => void;
  editingPartyIds: EditingPartyIds;
  updateEditingPartyId: (
    screenId: ScreenId,
    partyId: string | undefined
  ) => void;
  staticScreens: StaticScreenConfig[];
  sections: SectionScreenConfig[];
  sessionData: FlowSessionData;
  updateSessionData: (updates: Partial<FlowSessionData>) => void;
  previouslyCompleted: boolean;
  reviewScreenOpenedSectionId: SectionScreenId | null;
  initialStepperStepId: string | null;
  currentStepperStepId: string | undefined;
  setCurrentStepperStepIdFallback: (id: string | undefined) => void;
  setCurrentStepper: (stepper: Stepper<StepConfig[]> | null) => void;
  currentStepperGoTo: (stepId: string) => void;
  shortLabelOverride: string | null;
  savedFormValues?: Partial<OnboardingFormValuesSubmit>;
  saveFormValue: (field: keyof OnboardingFormValuesSubmit, value: any) => void;
  /**
   * Live delta pending-form values published by ReviewForm so the sidebar
   * timeline can go green-as-you-type (same overlay as the review accordion).
   */
  liveReviewFormValues?: Record<string, unknown>;
  setLiveReviewFormValues: (
    values: Record<string, unknown> | undefined
  ) => void;
  isFormSubmitting: boolean;
  setIsFormSubmitting: (isSubmitting: boolean) => void;
  unsavedChangesRef: MutableRefObject<boolean>;
  /**
   * Register/clear dirty state for a named source. Multiple sources OR together
   * (needed when delta review hosts pending + terms + accuracy forms).
   */
  setFlowUnsavedChanges: (sourceId: string, dirty: boolean) => void;
  /**
   * Latched at FlowProvider mount from entry eligibility — does not flip mid-session
   * when pending-field count changes after saves (spec §2.3).
   */
  deltaModeActive: boolean;
  /**
   * Latched with deltaModeActive. `'panel'` = top pending panel + accordion;
   * `'inline'` = always-expanded compact review with in-place editors.
   */
  deltaModeVariant: OnboardingDeltaModeVariant;
  /** Whether the current org is a publicly traded company listed on a US exchange. */
  isPTCWithUSExchange: boolean;
}>({
  currentScreenId: 'overview',
  originScreenId: null,
  goTo: () => {
    // no-op: context not yet provided (e.g. during HMR)
  },
  goBack: () => {
    // no-op: context not yet provided (e.g. during HMR)
  },
  editingPartyIds: {},
  updateEditingPartyId: () => {
    // no-op: context not yet provided (e.g. during HMR)
  },
  staticScreens: [],
  sections: [],
  sessionData: {},
  updateSessionData: () => {
    // no-op: context not yet provided (e.g. during HMR)
  },
  previouslyCompleted: false,
  reviewScreenOpenedSectionId: null,
  initialStepperStepId: null,
  isPTCWithUSExchange: false,
  currentStepperStepId: undefined,
  setCurrentStepperStepIdFallback: () => {
    // no-op: context not yet provided (e.g. during HMR)
  },
  currentStepperGoTo: () => {
    // no-op: context not yet provided (e.g. during HMR)
  },
  setCurrentStepper: () => {
    // no-op: context not yet provided (e.g. during HMR)
  },
  shortLabelOverride: null,
  savedFormValues: {},
  saveFormValue: () => {
    // no-op: context not yet provided (e.g. during HMR)
  },
  liveReviewFormValues: undefined,
  setLiveReviewFormValues: () => {
    // no-op: context not yet provided (e.g. during HMR)
  },
  isFormSubmitting: false,
  setIsFormSubmitting: () => {
    // no-op: context not yet provided (e.g. during HMR)
  },
  unsavedChangesRef: { current: false },
  setFlowUnsavedChanges: () => {
    // no-op: context not yet provided (e.g. during HMR)
  },
  deltaModeActive: false,
  deltaModeVariant: DEFAULT_DELTA_MODE_VARIANT,
});

export const FlowProvider: React.FC<{
  children: React.ReactNode;
  initialScreenId: ScreenId;
  flowConfig: FlowConfig;
  /** Seed the active step when landing directly on a stepper section (see {@link OnboardingFlowEntry}). */
  seedInitialStepperStepId?: string | null;
  /**
   * Latched delta-mode eligibility from entry (OnboardingFlow). When true, hide
   * Terms step and treat owners as complete for the session.
   */
  deltaModeActive?: boolean;
  /** Latched review UX variant when delta mode is active. Defaults to `'panel'`. */
  deltaModeVariant?: OnboardingDeltaModeVariant;
}> = ({
  children,
  initialScreenId,
  flowConfig,
  seedInitialStepperStepId,
  deltaModeActive: deltaModeActiveProp = false,
  deltaModeVariant: deltaModeVariantProp = DEFAULT_DELTA_MODE_VARIANT,
}) => {
  const [history, setHistory] = useState<ScreenId[]>([initialScreenId]);
  const [editingPartyIds, setEditingPartyIds] = useState<EditingPartyIds>({});
  const [previouslyCompleted, setPreviouslyCompleted] = useState(false);
  const [reviewScreenOpenedSectionId, setReviewScreenOpenedSectionId] =
    useState<SectionScreenId | null>(null);
  const [initialStepperStepId, setInitialStepperStepId] = useState<
    string | null
  >(() => seedInitialStepperStepId ?? null);
  const [currentStepper, setCurrentStepper] = useState<Stepper<
    StepConfig[]
  > | null>(null);
  const [shortLabelOverride, setShortLabelOverride] = useState<string | null>(
    null
  );
  const [sessionData, setSessionData] = useState<FlowSessionData>({});
  const [savedFormValues, setSavedFormValues] = useState<
    Partial<OnboardingFormValuesSubmit>
  >({});
  const [liveReviewFormValues, setLiveReviewFormValues] = useState<
    Record<string, unknown> | undefined
  >(undefined);
  const [isFormSubmitting, setIsFormSubmitting] = useState<boolean>(false);

  const unsavedChangesRef = useRef(false);
  const dirtySourcesRef = useRef(new Set<string>());
  // Ref only (no React state): dirty tracking must not re-render FlowProvider or consumers.
  // Multiple sources OR together so delta review (pending + terms + accuracy) cannot clobber.
  const setFlowUnsavedChanges = useCallback(
    (sourceId: string, dirty: boolean) => {
      if (dirty) {
        dirtySourcesRef.current.add(sourceId);
      } else {
        dirtySourcesRef.current.delete(sourceId);
      }
      unsavedChangesRef.current = dirtySourcesRef.current.size > 0;
    },
    []
  );

  const {
    organizationType,
    alertOnPreviousStep,
    alertOnExit,
    clientData,
    enablePubliclyTradedCompanies,
  } = useOnboardingContext();
  const { tString, i18n } = useTranslationWithTokens('onboarding-overview');

  // Latch at FlowProvider mount (after client fetch settles). Do not flip
  // mid-session when pending-field count changes after saves (spec §2.3).
  const [deltaModeActive] = useState(deltaModeActiveProp);
  const [deltaModeVariant] = useState(deltaModeVariantProp);

  // Delta mode: treat owners as done and hide the separate Terms step.
  useEffect(() => {
    if (!deltaModeActive) {
      return;
    }
    setSessionData((prev) =>
      prev.isOwnersSectionDone ? prev : { ...prev, isOwnersSectionDone: true }
    );
  }, [deltaModeActive]);

  // Reset saved form values when organization type changes
  useEffect(() => {
    if (organizationType) {
      setSavedFormValues({});
    }
  }, [organizationType]);

  useEffect(() => {
    if (!alertOnExit) {
      return undefined;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (
        shouldSuppressOnboardingLeaveWarnings(clientData) ||
        !unsavedChangesRef.current
      ) {
        return;
      }
      event.preventDefault();
      const message = i18n.t(
        'onboarding-overview:flowRenderer.leavePageWarning'
      );
      event.returnValue = message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [alertOnExit, clientData?.status, i18n, i18n.language]);

  const currentScreenId = history[history.length - 1];

  const staticScreens = flowConfig.screens.filter((s) => !s.isSection);

  // Derive whether the current org is a US-exchange PTC (owners section excluded)
  const orgParty = getOrganizationParty(clientData);
  const isPTCWithUSExchange =
    enablePubliclyTradedCompanies && isUSExchangePTC(orgParty);

  const visibilityCtx: VisibilityContext = { orgParty };

  const sections = flowConfig.screens
    .filter((s) => s.isSection)
    .filter((s) => s.sectionConfig.isVisible?.(visibilityCtx) ?? true)
    .map((s) => {
      if (s.stepperConfig?.steps) {
        const filteredSteps = s.stepperConfig.steps
          .filter((step) => step.isVisible?.(visibilityCtx) ?? true)
          // Delta mode merges Terms into Review — hide the documents step.
          .filter(
            (step) =>
              !(
                deltaModeActive &&
                s.id === 'review-attest-section' &&
                step.id === 'documents'
              )
          );
        return {
          ...s,
          stepperConfig: {
            ...s.stepperConfig,
            steps: filteredSteps,
          },
        };
      }
      return s;
    });

  const [currentStepperStepIdFallback, setCurrentStepperStepIdFallback] =
    useState<string | undefined>(undefined);

  useEffect(() => {
    setCurrentStepperStepIdFallback(undefined);
  }, [currentStepper?.current?.id]);

  const currentStepperStepId =
    currentStepperStepIdFallback ?? currentStepper?.current?.id ?? undefined;

  const goTo = (id: ScreenId, config?: GoToConfig) => {
    const screen = flowConfig.screens.find((s) => s.id === id);
    if (screen?.type === 'stepper') {
      setCurrentStepperStepIdFallback(
        config?.initialStepperStepId ??
          screen.stepperConfig?.steps[0]?.id ??
          undefined
      );
    }

    setEditingPartyIds((prev) => ({
      ...prev,
      [id]: config?.editingPartyId,
    }));
    setPreviouslyCompleted(config?.previouslyCompleted ?? false);
    setReviewScreenOpenedSectionId(config?.reviewScreenOpenedSectionId ?? null);
    setInitialStepperStepId(config?.initialStepperStepId ?? null);
    setShortLabelOverride(config?.shortLabelOverride ?? null);
    setHistory((prev) => {
      const base = config?.resetHistory ? [] : prev;
      // Avoid stacking consecutive duplicate entries (e.g. switching between
      // owners on owner-stepper) so that originScreenId keeps pointing at the
      // parent section rather than the duplicate sub-screen.
      if (base.length > 0 && base[base.length - 1] === id) {
        return base;
      }
      return [...base, id];
    });
  };

  const currentStepperGoTo = (stepId: string) => {
    setCurrentStepperStepIdFallback(stepId);
    currentStepper?.goTo(stepId);
  };

  const originScreenId =
    history.length > 1 ? history[history.length - 2] : null;

  const goBack = (config?: GoBackConfig) => {
    const fallbackId = config?.fallbackScreenId;
    const canPop = history.length > 1;
    const canNavigate = canPop || !!fallbackId;

    if (
      alertOnPreviousStep &&
      canNavigate &&
      !shouldSuppressOnboardingLeaveWarnings(clientData) &&
      unsavedChangesRef.current &&
      // eslint-disable-next-line no-alert -- optional UX parity with native leave warnings; no modal primitive here
      !window.confirm(tString('stepperRenderer.previousStepDataLossWarning'))
    ) {
      return;
    }
    setEditingPartyIds((prev) => ({
      ...prev,
      [currentScreenId]: config?.editingPartyId,
    }));
    setPreviouslyCompleted(config?.previouslyCompleted ?? false);
    setReviewScreenOpenedSectionId(config?.reviewScreenOpenedSectionId ?? null);
    setInitialStepperStepId(config?.initialStepperStepId ?? null);
    setShortLabelOverride(config?.shortLabelOverride ?? null);

    if (canPop) {
      setHistory((h) => h.slice(0, -1));
    } else if (fallbackId) {
      goTo(fallbackId, { resetHistory: true });
    }
  };

  const updateSessionData = (updates: Partial<FlowSessionData>) => {
    setSessionData((prev) => ({ ...prev, ...updates }));
  };

  const updateEditingPartyId = (
    screenId: ScreenId,
    partyId: string | undefined
  ) => {
    setEditingPartyIds((prev) => ({
      ...prev,
      [screenId]: partyId,
    }));
  };

  const saveFormValue = (
    field: keyof OnboardingFormValuesSubmit,
    value: any
  ) => {
    setSavedFormValues((prev) => {
      // When value is undefined, remove the key entirely so that it
      // doesn't poison object spreads (e.g. { ...formValues, ...savedFormValues }
      // in getStepperValidation / overrideDefaultValues).
      if (value === undefined) {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  return (
    <FlowContext.Provider
      value={{
        currentScreenId,
        goTo,
        goBack,
        originScreenId,
        editingPartyIds,
        updateEditingPartyId,
        staticScreens,
        sections,
        sessionData,
        updateSessionData,
        previouslyCompleted,
        reviewScreenOpenedSectionId,
        initialStepperStepId,
        currentStepperStepId,
        setCurrentStepperStepIdFallback,
        currentStepperGoTo,
        setCurrentStepper,
        shortLabelOverride,
        savedFormValues,
        saveFormValue,
        liveReviewFormValues,
        setLiveReviewFormValues,
        isFormSubmitting,
        setIsFormSubmitting,
        unsavedChangesRef,
        setFlowUnsavedChanges,
        deltaModeActive,
        deltaModeVariant,
        isPTCWithUSExchange: isPTCWithUSExchange ?? false,
      }}
    >
      {children}
    </FlowContext.Provider>
  );
};

export const useFlowContext = () => useContext(FlowContext);

import { createContext, useContext, useEffect, useState } from 'react';
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
} from '@/core/OnboardingFlow/types/flow.types';

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

const FlowContext = createContext<{
  currentScreenId: ScreenId;
  originScreenId: ScreenId | null;
  goTo: (id: ScreenId, config?: GoToConfig) => void;
  goBack: (config?: GoToConfig) => void;
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
}>({
  currentScreenId: 'overview',
  originScreenId: null,
  goTo: () => {
    throw new Error('goTo() must be used within FlowProvider');
  },
  goBack: () => {
    throw new Error('goBack() must be used within FlowProvider');
  },
  editingPartyIds: {},
  updateEditingPartyId: () => {
    throw new Error('updateEditingPartyId() must be used within FlowProvider');
  },
  staticScreens: [],
  sections: [],
  sessionData: {},
  updateSessionData: () => {
    throw new Error('setSessionData() must be used within FlowProvider');
  },
  previouslyCompleted: false,
  reviewScreenOpenedSectionId: null,
  initialStepperStepId: null,
  currentStepperStepId: undefined,
  setCurrentStepperStepIdFallback: () => {
    throw new Error(
      'setCurrentStepperStepIdFallback() must be used within FlowProvider'
    );
  },
  currentStepperGoTo: () => {
    throw new Error('currentStepperGoTo() must be used within FlowProvider');
  },
  setCurrentStepper: () => {
    throw new Error('setCurrentStepper() must be used within FlowProvider');
  },
  shortLabelOverride: null,
  savedFormValues: {},
  saveFormValue: () => {
    throw new Error('saveFormValue() must be used within FlowProvider');
  },
});

export const FlowProvider: React.FC<{
  children: React.ReactNode;
  initialScreenId: ScreenId;
  flowConfig: FlowConfig;
}> = ({ children, initialScreenId, flowConfig }) => {
  const [history, setHistory] = useState<ScreenId[]>([initialScreenId]);
  const [editingPartyIds, setEditingPartyIds] = useState<EditingPartyIds>({});
  const [previouslyCompleted, setPreviouslyCompleted] = useState(false);
  const [reviewScreenOpenedSectionId, setReviewScreenOpenedSectionId] =
    useState<SectionScreenId | null>(null);
  const [initialStepperStepId, setInitialStepperStepId] = useState<
    string | null
  >(null);
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

  const { organizationType } = useOnboardingContext();

  // Reset saved form values when organization type changes
  useEffect(() => {
    if (organizationType) {
      setSavedFormValues({});
    }
  }, [organizationType]);

  const currentScreenId = history[history.length - 1];

  const staticScreens = flowConfig.screens.filter((s) => !s.isSection);
  const sections = flowConfig.screens
    .filter((s) => s.isSection)
    .filter(
      (s) =>
        !s.sectionConfig.excludedForOrgTypes?.includes(organizationType ?? '')
    );

  const [currentStepperStepIdFallback, setCurrentStepperStepIdFallback] =
    useState<string | undefined>(undefined);

  useEffect(() => {
    setCurrentStepperStepIdFallback(undefined);
  }, [currentStepper?.current?.id]);

  const currentStepperStepId =
    currentStepperStepIdFallback ?? currentStepper?.current?.id ?? undefined;

  const goTo = (id: ScreenId, config?: GoToConfig) => {
    const screen = flowConfig.screens.find((s) => s.id === id);
    if (screen?.isSection) {
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
    setHistory((prev) => [...(config?.resetHistory ? [] : prev), id]);
  };

  const currentStepperGoTo = (stepId: string) => {
    setCurrentStepperStepIdFallback(stepId);
    currentStepper?.goTo(stepId);
  };

  const originScreenId =
    history.length > 1 ? history[history.length - 2] : null;

  const goBack = (config?: GoToConfig) => {
    setEditingPartyIds((prev) => ({
      ...prev,
      [currentScreenId]: config?.editingPartyId,
    }));
    setPreviouslyCompleted(config?.previouslyCompleted ?? false);
    setReviewScreenOpenedSectionId(config?.reviewScreenOpenedSectionId ?? null);
    setInitialStepperStepId(config?.initialStepperStepId ?? null);
    setShortLabelOverride(config?.shortLabelOverride ?? null);
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
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
    setSavedFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
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
      }}
    >
      {children}
    </FlowContext.Provider>
  );
};

export const useFlowContext = () => useContext(FlowContext);

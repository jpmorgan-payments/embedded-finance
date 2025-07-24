import { createContext, useContext, useState } from 'react';

import {
  FlowConfig,
  FlowSessionData,
  ScreenId,
  SectionScreenConfig,
  SectionScreenId,
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
  sections: SectionScreenConfig[];
  sessionData: FlowSessionData;
  updateSessionData: (updates: Partial<FlowSessionData>) => void;
  previouslyCompleted: boolean;
  reviewScreenOpenedSectionId: SectionScreenId | null;
  initialStepperStepId: string | null;
  shortLabelOverride: string | null;
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
  sections: [],
  sessionData: {},
  updateSessionData: () => {
    throw new Error('setSessionData() must be used within FlowProvider');
  },
  previouslyCompleted: false,
  reviewScreenOpenedSectionId: null,
  initialStepperStepId: null,
  shortLabelOverride: null,
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
  const [shortLabelOverride, setShortLabelOverride] = useState<string | null>(
    null
  );
  const [sessionData, setSessionData] = useState<FlowSessionData>({});

  const currentScreenId = history[history.length - 1];

  const sections = flowConfig.screens.filter((s) => s.isSection);

  const goTo = (id: ScreenId, config?: GoToConfig) => {
    setEditingPartyIds((prev) => ({
      ...prev,
      [id]: config?.editingPartyId,
    }));
    setPreviouslyCompleted(config?.previouslyCompleted ?? false);
    setReviewScreenOpenedSectionId(config?.reviewScreenOpenedSectionId ?? null);
    setInitialStepperStepId(config?.initialStepperStepId ?? null);
    setHistory((prev) => [...(config?.resetHistory ? [] : prev), id]);
    setShortLabelOverride(config?.shortLabelOverride ?? null);
  };

  const originScreenId =
    history.length > 1 ? history[history.length - 2] : null;

  const goBack = () => {
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

  return (
    <FlowContext.Provider
      value={{
        currentScreenId,
        goTo,
        goBack,
        originScreenId,
        editingPartyIds,
        updateEditingPartyId,
        sections,
        sessionData,
        updateSessionData,
        previouslyCompleted,
        reviewScreenOpenedSectionId,
        initialStepperStepId,
        shortLabelOverride,
      }}
    >
      {children}
    </FlowContext.Provider>
  );
};

export const useFlowContext = () => useContext(FlowContext);

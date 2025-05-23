import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import { UseFormReturn } from 'react-hook-form';

import {
  ApiError,
  ClientProduct,
  ClientResponse,
  ClientVerificationResponse,
  OrganizationType,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';
import { StepProps } from '@/components/ui/stepper';

import { Jurisdiction } from '../utils/types';

export type OnboardingProps = {
  initialClientId?: string;
  onSetClientId?: (clientId: string) => Promise<void>;
  onPostClientResponse?: (response?: ClientResponse, error?: ApiError) => void;
  onPostPartyResponse?: (response?: PartyResponse, error?: ApiError) => void;
  onPostClientVerificationsResponse?: (
    response?: ClientVerificationResponse,
    error?: ApiError
  ) => void;
  availableProducts: Array<ClientProduct>;
  availableJurisdictions: Array<Jurisdiction>;
  availableOrganizationTypes?: Array<OrganizationType>;
  usePartyResource?: boolean;
  blockPostVerification?: boolean;
  showLinkedAccountPanel?: boolean;
  useSingleColumnLayout?: boolean;
  mode?: 'prod' | 'test';
};

// Option: Const assertion with object (most future-proof)
export const EditMode = {
  Stepper: 'stepper',
  Review: 'review',
} as const;

export type EditModeType = (typeof EditMode)[keyof typeof EditMode];

type OnboardingContextType = OnboardingProps & {
  clientId: string;
  setClientId: (clientId: string) => Promise<void>;
  wasClientIdCreated: boolean;
  currentForm?: UseFormReturn<any, any, any>;
  setCurrentForm: (form: UseFormReturn<any, any, any> | undefined) => void;
  currentStepIndex?: number;
  setCurrentStepIndex: (index: number) => void;
  editMode: EditModeType;
  setEditMode: (editMode: EditModeType) => void;
  processStep: () => void;
  steps: StepProps[];
  setSteps: (steps: StepProps[]) => void;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

export const OnboardingContextProvider: FC<
  PropsWithChildren<OnboardingProps>
> = ({ children, ...props }) => {
  const [clientId, setClientId] = useState(props.initialClientId ?? '');
  const [wasClientIdCreated, setWasClientIdCreated] = useState(false);
  const [editMode, setEditMode] = useState<EditModeType>(EditMode.Stepper);
  const [steps, setSteps] = useState<StepProps[]>([]);

  useEffect(() => {
    setClientId(props.initialClientId ?? '');
    setWasClientIdCreated(false);
  }, [props.initialClientId]);

  const handleSetClientId = async (id: string) => {
    setClientId(id);
    setWasClientIdCreated(true);
    if (props.onSetClientId) {
      await props.onSetClientId('');
    }
  };

  const [currentForm, setCurrentForm] = useState<
    UseFormReturn<any, any, any> | undefined
  >(undefined);

  const [currentStepIndex, setCurrentStepIndex] = useState<number | undefined>(
    undefined
  );

  const processStep = () => {
    // Implementation of processStep
    if (editMode === EditMode.Stepper) {
      setCurrentStepIndex((currentStepIndex ?? 0) + 1);
    }

    if (editMode === EditMode.Review) {
      setCurrentStepIndex(steps.length - 1);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        ...props,
        clientId,
        setClientId: handleSetClientId,
        wasClientIdCreated,
        currentForm,
        setCurrentForm,
        currentStepIndex,
        setCurrentStepIndex,
        editMode,
        setEditMode,
        processStep,
        steps,
        setSteps,
        mode: props.mode || 'prod',
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboardingContext = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error(
      'useOnboardingContext must be used within a OnboardingContextProvider'
    );
  }
  return context;
};

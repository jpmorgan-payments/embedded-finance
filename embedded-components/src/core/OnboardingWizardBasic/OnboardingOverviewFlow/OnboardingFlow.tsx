import { useCallback, useEffect, useRef, useState } from 'react';
import { useEnableDTRUMTracking } from '@/utils/useDTRUMAction';
import { useTranslation } from 'react-i18next';

import { loadContentTokens } from '@/lib/utils';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { useContentTokens } from '@/core/EBComponentsProvider/EBComponentsProvider';

import { FormLoadingState } from '../FormLoadingState/FormLoadingState';
import { ServerErrorAlert } from '../ServerErrorAlert/ServerErrorAlert';
import { StepperRenderer } from './components/StepperRenderer/StepperRenderer';
import { FlowProvider, useFlowContext } from './context/FlowContext';
import { flowConfig } from './flowConfig';
import {
  OnboardingOverviewContext,
  useOnboardingOverviewContext,
} from './OnboardingContext/OnboardingContext';
import {
  OnboardingConfigDefault,
  OnboardingConfigUsedInContext,
} from './types';

export type OnboardingFlowProps = OnboardingConfigDefault &
  OnboardingConfigUsedInContext;

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  initialClientId,
  onboardingContentTokens = {},
  alertOnExit = false,
  userEventsToTrack = [],
  userEventsHandler,
  height,
  ...props
}) => {
  const [clientId, setClientId] = useState(initialClientId ?? '');

  const {
    data: clientData,
    status: clientGetStatus,
    error: clientGetError,
  } = useSmbdoGetClient(clientId, {
    query: {
      enabled: !!clientId, // Only fetch if clientId is defined
      refetchOnWindowFocus: false, // Avoid refetching on window focus
    },
  });

  // Set clientId when initialClientId prop changes
  useEffect(() => {
    setClientId(initialClientId ?? '');
  }, [initialClientId]);

  const existingOrgParty = clientData?.parties?.find(
    (party) => party.partyType === 'ORGANIZATION'
  );

  const organizationType =
    existingOrgParty?.organizationDetails?.organizationType;

  // Load content tokens
  const { tokens: globalContentTokens = {} } = useContentTokens();
  const { i18n, t } = useTranslation(['onboarding-overview', 'onboarding']);
  useEffect(() => {
    loadContentTokens(i18n.language, 'onboarding', [
      globalContentTokens.onboarding,
      onboardingContentTokens,
    ]);
  }, [
    i18n.language,
    JSON.stringify(globalContentTokens.onboarding),
    JSON.stringify(onboardingContentTokens),
  ]);

  // Prevent the user from leaving the page
  useEffect(() => {
    const handleBeforeUnload = (event: {
      preventDefault: () => void;
      returnValue: boolean;
    }) => {
      event.preventDefault();
      // Included for legacy support, e.g. Chrome/Edge < 119
      event.returnValue = true;
    };

    if (alertOnExit) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [alertOnExit]);

  // #region User Events
  const eventAnnotationHandler = useCallback((e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    if (Object.keys(target.dataset).includes('userEventTracking')) {
      userEventsHandler?.({
        actionName: `${e.type} on ${target.dataset?.userEventTracking}`,
      });
    }
  }, []);

  useEffect(() => {
    if (userEventsToTrack?.length > 0 && userEventsHandler) {
      const wrapper = document.getElementById('eb-component');
      userEventsToTrack.forEach((evt) =>
        wrapper?.addEventListener(evt, eventAnnotationHandler)
      );

      return () => {
        userEventsToTrack.forEach((evt) =>
          wrapper?.removeEventListener(evt, eventAnnotationHandler)
        );
      };
    }
    return () => {
      // Cleanup logic here (if needed)
    };
  }, []);

  useEnableDTRUMTracking({
    userEmail: 'test@test.com',
    DOMElementToTrack: 'embedded-component-layout',
    eventsToTrack: ['click', 'blur'],
  });
  // #endregion

  return (
    <OnboardingOverviewContext.Provider
      value={{
        ...props,
        clientData,
        setClientId,
        organizationType,
      }}
    >
      <div
        id="embedded-component-layout"
        className="eb-component eb-mx-auto eb-flex eb-flex-1 eb-flex-col eb-p-4 eb-pb-6 sm:eb-max-w-screen-sm sm:eb-p-10 sm:eb-pb-12"
        style={{ minHeight: height }}
        key={initialClientId}
      >
        {/* TODO: replace with actual screens */}
        {clientGetError && (
          <ServerErrorAlert
            error={clientGetError}
            className="eb-border-[#E52135] eb-bg-[#FFECEA]"
          />
        )}
        {clientGetStatus === 'pending' && initialClientId ? (
          <FormLoadingState message={t('onboarding:fetchingClientData')} />
        ) : (
          <FlowProvider
            initialScreenId={organizationType ? 'overview' : 'gateway'}
            flowConfig={flowConfig}
          >
            <FlowRenderer />
          </FlowProvider>
        )}
      </div>
    </OnboardingOverviewContext.Provider>
  );
};

const FlowRenderer: React.FC = () => {
  const { clientData, organizationType } = useOnboardingOverviewContext();
  const { currentScreenId, goTo, sessionData, updateSessionData } =
    useFlowContext();

  // Scroll to top on step change
  const mainRef = useRef<HTMLDivElement>(null);
  const initialRender = useRef(true);
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentScreenId]);

  // Redirect to gateway if organization type is not set
  useEffect(() => {
    if (!organizationType && currentScreenId !== 'gateway') {
      goTo('gateway', { resetHistory: true });
    }
  }, [organizationType, currentScreenId]);

  // Clear mocked verifying state after a timeout
  useEffect(() => {
    if (sessionData.mockedVerifyingSectionId) {
      const timeout = setTimeout(() => {
        updateSessionData({
          mockedVerifyingSectionId: undefined,
        });
      }, 1500);

      return () => clearTimeout(timeout);
    }
    return () => {};
  }, [sessionData.mockedVerifyingSectionId]);

  const screen = flowConfig.screens.find((s) => s.id === currentScreenId);

  const renderScreen = () => {
    if (!screen) {
      return <div>Unknown screen id: {currentScreenId}</div>;
    }

    if (screen.type === 'component') {
      const Comp = screen.Component;
      return <Comp />;
    }

    if (screen.type === 'stepper') {
      return <StepperRenderer {...screen.stepperConfig} />;
    }

    return <div>Unhandled screen error</div>;
  };

  return (
    <div
      className="eb-flex eb-flex-1 eb-scroll-mt-4 sm:eb-scroll-mt-10"
      ref={mainRef}
      key={clientData?.id}
    >
      <div className="eb-w-full">{renderScreen()}</div>
    </div>
  );
};

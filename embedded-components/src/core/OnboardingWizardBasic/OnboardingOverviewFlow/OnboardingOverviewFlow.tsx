import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useEnableDTRUMTracking } from '@/utils/useDTRUMAction';
import { useTranslation } from 'react-i18next';

import { loadContentTokens } from '@/lib/utils';
import { useSmbdoGetClient } from '@/api/generated/smbdo';

import { useContentTokens } from '../../EBComponentsProvider/EBComponentsProvider';
import { FormLoadingState } from '../FormLoadingState/FormLoadingState';
import { ServerErrorAlert } from '../ServerErrorAlert/ServerErrorAlert';
import { OnboardingChecklistScreen } from './OnboardingChecklistScreen/OnboardingChecklistScreen';
import {
  OnboardingOverviewContext,
  useOnboardingOverviewContext,
} from './OnboardingContext/OnboardingContext';
import { OnboardingGatewayScreen } from './OnboardingGatewayScreen/OnboardingGatewayScreen';
import { GlobalStepper } from './OnboardingGlobalStepper';
import { OnboardingOverviewScreen } from './OnboardingOverviewScreen/OnboardingOverviewScreen';
import { OnboardingSectionStepper } from './OnboardingSectionStepper/OnboardingSectionStepper';
import {
  OnboardingConfigDefault,
  OnboardingConfigUsedInContext,
} from './types';

export type OnboardingOverviewFlowProps = OnboardingConfigDefault &
  OnboardingConfigUsedInContext;

export const OnboardingWizardBasic: FC<OnboardingOverviewFlowProps> = ({
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
    isPending,
    isError,
    error,
  } = useSmbdoGetClient(clientId, {
    query: {
      // refetch settings?
    },
  });

  useEffect(() => {
    setClientId(initialClientId ?? '');
  }, [initialClientId]);

  const existingOrgParty = clientData?.parties?.find(
    (party) => party.partyType === 'ORGANIZATION'
  );
  const organizationType =
    existingOrgParty?.organizationDetails?.organizationType;

  const initialStep = organizationType ? 'overview' : 'gateway';

  // Load content tokens
  const { tokens: globalContentTokens = {} } = useContentTokens();
  const { i18n, t } = useTranslation(['onboarding-overview', 'onboarding']);
  useEffect(() => {
    loadContentTokens(i18n.language, 'onboarding', [
      globalContentTokens.onboarding,
      onboardingContentTokens,
    ]);
  }, [
    loadContentTokens,
    JSON.stringify(globalContentTokens.onboarding),
    JSON.stringify(onboardingContentTokens),
    i18n.language,
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
        {isError ? (
          <ServerErrorAlert error={error} />
        ) : isPending && initialClientId ? (
          <FormLoadingState message={t('onboarding:fetchingClientData')} />
        ) : (
          <GlobalStepper.Scoped initialStep={initialStep}>
            <OnboardingMainSteps />
          </GlobalStepper.Scoped>
        )}
      </div>
    </OnboardingOverviewContext.Provider>
  );
};

const OnboardingMainSteps = () => {
  const globalStepper = GlobalStepper.useStepper();
  const currentStepId = globalStepper.current.id;

  const { clientData, organizationType } = useOnboardingOverviewContext();

  // Scroll to top on step change
  const mainRef = useRef<HTMLDivElement>(null);
  const initialRender = useRef(true);
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentStepId]);

  // Edge case: Redirect to gateway if organization type is not set
  useEffect(() => {
    if (!organizationType && currentStepId !== 'gateway') {
      globalStepper.goTo('gateway');
    }
  }, [organizationType, currentStepId]);

  return (
    <div
      className="eb-flex eb-flex-1 eb-scroll-mt-4 sm:eb-scroll-mt-10"
      ref={mainRef}
      key={clientData?.id}
    >
      {globalStepper.switch({
        gateway: () => <OnboardingGatewayScreen />,
        checklist: () => <OnboardingChecklistScreen />,
        overview: () => <OnboardingOverviewScreen />,
        'section-stepper': () => <OnboardingSectionStepper />,
      })}
    </div>
  );
};

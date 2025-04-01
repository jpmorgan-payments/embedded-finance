import { FC, Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useEnableDTRUMTracking } from '@/utils/useDTRUMAction';
import { PencilIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { loadContentTokens } from '@/lib/utils';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { Button } from '@/components/ui';

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
      }}
    >
      <GlobalStepper.Scoped>
        <div
          id="embedded-component-layout"
          className="eb-component"
          style={{ minHeight: height }}
          key={initialClientId}
        >
          {isError ? (
            <ServerErrorAlert error={error} />
          ) : isPending && initialClientId ? (
            <FormLoadingState message={t('onboarding:fetchingClientData')} />
          ) : (
            <OnboardingMainSteps />
          )}
        </div>
      </GlobalStepper.Scoped>
    </OnboardingOverviewContext.Provider>
  );
};

const OnboardingMainSteps = () => {
  const { t } = useTranslation(['onboarding-overview', 'onboarding']);
  const globalStepper = GlobalStepper.useStepper();
  const currentStepId = globalStepper.current.id;

  const { clientData } = useOnboardingOverviewContext();
  const existingOrgParty = clientData?.parties?.find(
    (party) => party.partyType === 'ORGANIZATION'
  );
  const organizationType =
    existingOrgParty?.organizationDetails?.organizationType;

  // Scroll to top on step change
  const mainRef = useRef<HTMLDivElement>(null);
  const initialRender = useRef(true);
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    mainRef.current?.scrollIntoView({ block: 'start' });
  }, [currentStepId]);

  // Edge case: Redirect to gateway if organization type is not set
  useEffect(() => {
    if (!organizationType && currentStepId !== 'gateway') {
      globalStepper.goTo('gateway');
    }
  }, [organizationType, currentStepId]);

  return (
    <div
      className="eb-mx-auto eb-flex eb-h-full eb-flex-col eb-space-y-6 eb-p-4 eb-pb-6 md:eb-max-w-screen-md md:eb-p-10 md:eb-pb-12"
      ref={mainRef}
      key={clientData?.id}
    >
      <div>
        <div className="eb-flex eb-h-6 eb-items-end eb-space-x-2 eb-text-sm">
          {currentStepId === 'gateway' ? (
            <p>{t('welcomeText')}</p>
          ) : (
            <>
              <p>{t(`onboarding:organizationTypes.${organizationType!}`)}</p>
              <Button
                variant="ghost"
                className="eb-h-6 eb-w-6 eb-px-3"
                onClick={() => globalStepper.goTo('gateway')}
              >
                <PencilIcon className="eb-stroke-primary" />
              </Button>
            </>
          )}
        </div>

        <h2 className="eb-font-header eb-text-3xl eb-font-medium">
          {t(`steps.${currentStepId}.title`)}
        </h2>

        <p className="eb-pt-2 eb-text-sm eb-font-semibold">
          {t(`steps.${currentStepId}.description`)}
        </p>
      </div>

      <div className="eb-flex-1">
        {globalStepper.switch({
          gateway: () => <OnboardingGatewayScreen />,
          checklist: () => <OnboardingChecklistScreen />,
          overview: () => <OnboardingOverviewScreen />,
        })}
      </div>
    </div>
  );
};

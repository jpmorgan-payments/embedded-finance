import { FC, useCallback, useEffect, useState } from 'react';
import { useEnableDTRUMTracking } from '@/utils/useDTRUMAction';
import { useTranslation } from 'react-i18next';

import { loadContentTokens } from '@/lib/utils';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { Separator } from '@/components/ui/separator';

import { useContentTokens } from '../../EBComponentsProvider/EBComponentsProvider';
import { FormLoadingState } from '../FormLoadingState/FormLoadingState';
import { ServerErrorAlert } from '../ServerErrorAlert/ServerErrorAlert';
import { OnboardingChecklistScreen } from './OnboardingChecklistScreen/OnboardingChecklistScreen';
import { OnboardingOverviewContext } from './OnboardingContext/OnboardingContext';
import { OnboardingGatewayScreen } from './OnboardingGatewayScreen/OnboardingGatewayScreen';
import { GlobalStepper } from './OnboardingGlobalStepper';
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
  onSetClientId,
  height,
  ...props
}) => {
  const [clientId, setClientId] = useState(initialClientId ?? '');

  // isLoading is only true for the initial fetch
  const { isLoading, error } = useSmbdoGetClient(clientId, {
    query: {
      // refetch settings?
    },
  });

  useEffect(() => {
    setClientId(initialClientId ?? '');
  }, [initialClientId]);

  const handleSetClientId = async (id: string) => {
    setClientId(id);
    if (onSetClientId) {
      await onSetClientId('');
    }
  };

  // Load content tokens
  const { tokens: globalContentTokens = {} } = useContentTokens();
  const { i18n, t } = useTranslation('onboarding');
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
    <div
      className="eb-component md:eb-max-w-2xl"
      id="embedded-component-layout"
    >
      <OnboardingOverviewContext.Provider
        value={{
          ...props,
          clientId,
          setClientId: handleSetClientId,
        }}
      >
        <GlobalStepper.Scoped key={initialClientId}>
          <div
            className="eb-flex eb-space-y-6 eb-p-2 eb-pb-4 md:eb-p-10"
            style={{ minHeight: height }}
          >
            {error ? (
              <ServerErrorAlert error={error} />
            ) : isLoading ? (
              <FormLoadingState message={t('fetchingClientData')} />
            ) : (
              <OnboardingMainSteps />
            )}
          </div>
        </GlobalStepper.Scoped>
      </OnboardingOverviewContext.Provider>
    </div>
  );
};

const OnboardingMainSteps = () => {
  const methods = GlobalStepper.useStepper();

  return (
    <div className="eb-flex eb-flex-1 eb-flex-col eb-space-y-6">
      <div className="eb-space-y-1.5">
        <p className="eb-text-muted-foreground">Welcome!</p>
        <h2 className="eb-text-2xl eb-font-bold eb-tracking-tight">
          Let&apos;s help you get started
        </h2>
        <p className="eb-text-sm eb-font-semibold">
          Select your company's business type and we&apos;ll explain what
          information you&apos;ll need to complete the application.
        </p>
      </div>

      <Separator />

      <div className="eb-flex-1">
        {methods.switch({
          gateway: () => <OnboardingGatewayScreen />,
          checklist: () => <OnboardingChecklistScreen />,
        })}
      </div>
    </div>
  );
};

import { FC, useCallback, useEffect, useMemo, useRef } from 'react';
import { defaultResources } from '@/i18n/config';
import { useEnableDTRUMTracking } from '@/utils/useDTRUMAction';
import { DeepPartial } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { cn, loadContentTokens } from '@/lib/utils';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import {
  ClientProduct,
  ClientResponse,
  OrganizationType,
} from '@/api/generated/smbdo.schemas';

import { useContentTokens } from '../../EBComponentsProvider/EBComponentsProvider';
import {
  OnboardingContextProvider,
  OnboardingProps,
  useOnboardingContext,
} from '../OnboardingContextProvider/OnboardingContextProvider';
import { Jurisdiction } from '../utils/types';
import { OnboardingGatewayScreen } from './OnboardingGatewayScreen/OnboardingGatewayScreen';

export interface OnboardingWizardBasicProps extends OnboardingProps {
  initialStep?: number;
  variant?: 'circle' | 'circle-alt' | 'line';
  onboardingContentTokens?: DeepPartial<
    (typeof defaultResources)['enUS']['onboarding']
  >;
  alertOnExit?: boolean;
  userEventsToTrack?: string[];
  userEventsHandler?: ({ actionName }: { actionName: string }) => void;
  showLinkedAccountPanel?: boolean;
}

export const OnboardingWizardBasic: FC<OnboardingWizardBasicProps> = ({
  initialStep,
  variant,
  onboardingContentTokens = {},
  alertOnExit = false,
  userEventsToTrack = [],
  userEventsHandler,
  usePartyResource = true,
  showLinkedAccountPanel = false,
  ...props
}) => {
  const { tokens: globalContentTokens = {} } = useContentTokens();
  const { i18n } = useTranslation('onboarding');

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

  return (
    <OnboardingContextProvider
      {...{ ...props, usePartyResource, showLinkedAccountPanel }}
    >
      <OnboardingWizardBasicComponent
        initialStep={initialStep}
        variant={variant}
      />
    </OnboardingContextProvider>
  );
};

const OnboardingWizardBasicComponent: FC<
  Pick<OnboardingWizardBasicProps, 'initialStep' | 'variant'>
> = ({ initialStep, variant = 'circle-alt' }) => {
  const { t } = useTranslation('onboarding');

  const {
    clientId,
    wasClientIdCreated,
    currentStepIndex,
    setCurrentStepIndex,
    useSingleColumnLayout,
    setSteps,
  } = useOnboardingContext();

  const {
    data: clientData,
    status: clientGetStatus,
    error: clientGetError,
    refetch: refetchClient,
  } = useSmbdoGetClient(clientId ?? '', {
    query: {
      enabled: !!clientId,
    },
  });

  useEnableDTRUMTracking({
    userEmail: 'test@test.com',
    DOMElementToTrack: 'embedded-component-layout',
    eventsToTrack: ['click', 'blur'],
  });

  // const overviewSteps = [
  //   {id: 'gateway', children: }
  // ]

  return (
    <div className="eb-component" id="embedded-component-layout">
      <div className="eb-space-y-6 eb-p-2 eb-pb-4 md:eb-p-10 md:eb-pb-16">
        <OnboardingGatewayScreen />
      </div>
    </div>
  );
};

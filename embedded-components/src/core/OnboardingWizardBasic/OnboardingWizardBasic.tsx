import { FC, useCallback, useEffect, useMemo, useRef } from 'react';
import { defaultResources, i18n } from '@/i18n/config';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Step, StepItem, Stepper, StepProps } from '@/components/ui/stepper';

import { useContentTokens } from '../EBComponentsProvider/EBComponentsProvider';
import { AdditionalQuestionsStepForm } from './AdditionalQuestionsStepForm/AdditionalQuestionsStepForm';
import { BeneficialOwnerStepForm } from './BeneficialOwnerStepForm/BeneficialOwnerStepForm';
import { ClientOnboardingStateView } from './ClientOnboardingStateView/ClientOnboardingStateView';
import { ControllerStepForm } from './ControllerStepForm/ControllerStepForm';
import { DocumentUploadStepForm } from './DocumentUploadStepForm/DocumentUploadStepForm';
import { FormLoadingState } from './FormLoadingState/FormLoadingState';
import { InfoStepAlert } from './InfoStepAlert/InfoStepAlert';
import { InitialStepForm } from './InitialStepForm/InitialStepForm';
import {
  OnboardingContextProvider,
  OnboardingProps,
  useOnboardingContext,
} from './OnboardingContextProvider/OnboardingContextProvider';
import { OrganizationStepForm } from './OrganizationStepForm/OrganizationStepForm';
import { ReviewAndAttestStepForm } from './ReviewAndAttestStepForm/ReviewAndAttestStepForm';
import { ServerErrorAlert } from './ServerErrorAlert/ServerErrorAlert';
import { MissingInfoAlert } from './utils/MissingInfoAlert';
import { Jurisdiction } from './utils/types';

type OnboardingStep = StepProps &
  StepItem & {
    onlyVisibleFor?: {
      jurisdiction?: Jurisdiction[];
      product?: ClientProduct[];
      organizationType?: OrganizationType[];
    };
  };

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

  const productFromResponse = clientData?.products?.[0];
  const organizationDetailsFromResponse = clientData?.parties?.find(
    (party) => party?.partyType === 'ORGANIZATION'
  )?.organizationDetails;

  const initialSteps: OnboardingStep[] = [
    {
      id: 'InitialDetails',
      label: t('stepLabels.initialDetails'),
      children: <InitialStepForm />,
    },
    {
      id: 'OrganizationDetails',
      label: t('stepLabels.organizationDetails'),
      children: <OrganizationStepForm />,
    },
    {
      id: 'IndividualDetails',
      label: t('stepLabels.individualDetails'),
      children: <ControllerStepForm />,
    },
    {
      id: 'businessOwners',
      label: t('stepLabels.businessOwners'),
      children: <BeneficialOwnerStepForm />,
      onlyVisibleFor: {
        organizationType: ['LIMITED_LIABILITY_COMPANY'],
      },
    },
    {
      id: 'additionalQuestions',
      label: t('stepLabels.additionalQuestions'),
      children: <AdditionalQuestionsStepForm />,
    },
    {
      id: 'documentUpload',
      label: t('stepLabels.uploadDocuments'),
      children: <DocumentUploadStepForm />,
    },
    {
      id: 'reviewAndAttest',
      label: t('stepLabels.reviewAndAttest'),
      children: <ReviewAndAttestStepForm />,
    },
  ];

  const getOnboardingSteps = useCallback(
    (
      product?: ClientProduct,
      jurisdiction?: Jurisdiction,
      organizationType?: OrganizationType,
      _clientData?: ClientResponse
    ) => {
      return initialSteps.filter(
        (step) =>
          !(
            _clientData?.outstanding?.documentRequestIds?.length! === 0 &&
            step?.id === 'documentUpload'
          ) &&
          (!step.onlyVisibleFor?.jurisdiction ||
            (jurisdiction &&
              step.onlyVisibleFor.jurisdiction.includes(jurisdiction))) &&
          (!step.onlyVisibleFor?.organizationType ||
            (organizationType &&
              step.onlyVisibleFor.organizationType.includes(
                organizationType
              ))) &&
          (!step.onlyVisibleFor?.product ||
            (product && step.onlyVisibleFor.product.includes(product)))
      );
    },
    [initialSteps]
  );

  const steps = useMemo(() => {
    return getOnboardingSteps(
      productFromResponse,
      organizationDetailsFromResponse?.jurisdiction as Jurisdiction,
      organizationDetailsFromResponse?.organizationType,
      clientData
    );
  }, [
    productFromResponse,
    organizationDetailsFromResponse?.jurisdiction,
    organizationDetailsFromResponse?.organizationType,
  ]);

  useEnableDTRUMTracking({
    userEmail: 'test@test.com',
    DOMElementToTrack: 'embedded-component-layout',
    eventsToTrack: ['click', 'blur'],
  });

  const hasMounted = useRef(false);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (currentStepIndex) {
      if (hasMounted.current) {
        const currentStepRef = stepRefs.current[currentStepIndex];
        if (currentStepRef) {
          window.scrollTo({
            top:
              currentStepRef.getBoundingClientRect().top + window.scrollY - 96,
            behavior: 'smooth',
          });
        }
      } else {
        hasMounted.current = true;
      }
    }
  }, [currentStepIndex]);

  useEffect(() => {
    setSteps(steps);
  }, [steps]);

  const hasOutstandingRequirements = useMemo(() => {
    if (!clientData?.outstanding) return true; // If no data yet, assume there are requirements

    const {
      documentRequestIds = [],
      questionIds = [],
      partyIds = [],
      partyRoles = [],
    } = clientData.outstanding;

    // Only check non-attestation requirements
    return (
      documentRequestIds.length > 0 ||
      questionIds.length > 0 ||
      partyIds.length > 0 ||
      partyRoles.length > 0
    );
  }, [clientData?.outstanding]);

  useEffect(() => {
    if (initialStep !== currentStepIndex) {
      setCurrentStepIndex(initialStep ?? (wasClientIdCreated ? 1 : 0));
    }
  }, [initialStep]);

  useEffect(() => {
    if (clientData?.outstanding !== undefined && steps.length > 0) {
      if (
        !hasOutstandingRequirements &&
        currentStepIndex !== steps.length - 1
      ) {
        setCurrentStepIndex(steps.length - 1);
      }
    }
  }, [clientData?.outstanding]);

  return (
    <Card className="eb-component" id="embedded-component-layout">
      <CardHeader className="eb-p-4">
        <CardTitle className="eb-font-header">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="eb-flex eb-w-full eb-flex-col eb-gap-4 eb-p-4">
        {clientData?.status === 'NEW' && (
          <MissingInfoAlert clientData={clientData} />
        )}
        {clientData?.status === 'NEW' ||
        !clientId ||
        clientGetStatus === 'pending' ||
        clientGetStatus === 'error' ? (
          <Stepper
            key={currentStepIndex}
            initialStep={currentStepIndex ?? 0}
            steps={steps}
            variant={variant}
            mobileBreakpoint="1279px"
            {...(clientData && {
              onClickStep: (stepIndex) => setCurrentStepIndex(stepIndex),
            })}
          >
            {steps.map((stepProps, index) => {
              const { children, id, ...rest } = stepProps;
              return (
                <Step key={index} {...rest}>
                  <div
                    className="eb-flex eb-scroll-mt-10 eb-justify-center eb-px-2"
                    ref={(el) => {
                      stepRefs.current[index] = el;
                    }}
                  >
                    {clientId && clientGetStatus === 'pending' ? (
                      <FormLoadingState message={t('fetchingClientData')} />
                    ) : clientGetStatus === 'error' ? (
                      <ServerErrorAlert
                        error={clientGetError}
                        tryAgainAction={refetchClient}
                        customErrorMessage={{
                          default: t('errorMessages.default'),
                          '404': t('errorMessages.clientNotFound'),
                        }}
                      />
                    ) : (
                      <div
                        className={cn('eb-w-full eb-max-w-screen-xl', {
                          'eb-max-w-lg': useSingleColumnLayout,
                        })}
                      >
                        <InfoStepAlert stepId={id!} />
                        {children}
                      </div>
                    )}
                  </div>
                </Step>
              );
            })}
          </Stepper>
        ) : (
          <div className="eb-space-y-6">
            <ClientOnboardingStateView />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

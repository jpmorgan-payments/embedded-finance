import { FC, useEffect, useMemo } from 'react';
import { defaultResources } from '@/i18n/config';
import { DeepPartial } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { loadContentTokens } from '@/lib/utils';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { ClientProduct, OrganizationType } from '@/api/generated/smbdo.schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Step, StepItem, Stepper, StepProps } from '@/components/ui/stepper';

import { useContentTokens } from '../EBComponentsProvider/EBComponentsProvider';
import { AdditionalQuestionsStepForm } from './AdditionalQuestionsStepForm/AdditionalQuestionsStepForm';
import { BusinessOwnerStepForm } from './BusinessOwnerStepForm/BusinessOwnerStepForm';
import { ClientOnboardingStateView } from './ClientOnboardingStateView/ClientOnboardingStateView';
import { DecisionMakerStepForm } from './DecisionMakerStepForm/DecisionMakerStepForm';
import { DocumentUploadStepForm } from './DocumentUploadStepForm/DocumentUploadStepForm';
import { FormLoadingState } from './FormLoadingState/FormLoadingState';
import { IndividualStepForm } from './IndividualStepForm/IndividualStepForm';
import { InitialStepForm } from './InitialStepForm/InitialStepForm';
import {
  OnboardingContextProvider,
  OnboardingContextType,
} from './OnboardingContextProvider/OnboardingContextProvider';
import { OrganizationStepForm } from './OrganizationStepForm/OrganizationStepForm';
import { ReviewAndAttestStepForm } from './ReviewAndAttestStepForm/ReviewAndAttestStepForm';
import { ServerErrorAlert } from './ServerErrorAlert/ServerErrorAlert';
import { Jurisdiction } from './utils/types';
import { OutstandingInfoDebug } from './utils/OutstandingInfoDebug';

type OnboardingStep = StepProps &
  StepItem & {
    onlyVisibleFor?: {
      jurisdiction?: Jurisdiction[];
      product?: ClientProduct[];
      organizationType?: OrganizationType[];
    };
  };

const initialSteps: OnboardingStep[] = [
  { label: 'Initial details', children: <InitialStepForm /> },
  { label: 'Organization details', children: <OrganizationStepForm /> },
  { label: 'Individual details', children: <IndividualStepForm /> },
  {
    label: 'Decision Makers',
    children: <DecisionMakerStepForm />,
    onlyVisibleFor: {
      organizationType: ['LIMITED_LIABILITY_COMPANY'],
    },
  },
  {
    label: 'Business Owners',
    children: <BusinessOwnerStepForm />,
    onlyVisibleFor: {
      organizationType: ['LIMITED_LIABILITY_COMPANY'],
    },
  },
  { label: 'Additional Questions', children: <AdditionalQuestionsStepForm /> },
  {
    label: 'Upload Documents',
    children: <DocumentUploadStepForm />,
    onlyVisibleFor: {
      product: ['MERCHANT_SERVICES'],
    },
  },
  { label: 'Review and Attest', children: <ReviewAndAttestStepForm /> },
];

export function getOnboardingSteps(
  product?: ClientProduct,
  jurisdiction?: Jurisdiction,
  organizationType?: OrganizationType
) {
  if (product && jurisdiction && organizationType) {
    return initialSteps.filter(
      (step) =>
        !step.onlyVisibleFor ||
        (step.onlyVisibleFor.jurisdiction?.includes(jurisdiction) &&
          step.onlyVisibleFor.organizationType?.includes(organizationType) &&
          step.onlyVisibleFor.product?.includes(product))
    );
  }
  return initialSteps.filter((step) => !step.onlyVisibleFor);
}

export interface OnboardingWizardBasicProps extends OnboardingContextType {
  initialStep?: number;
  variant?: 'circle' | 'circle-alt' | 'line';
  onboardingContentTokens?: DeepPartial<
    (typeof defaultResources)['enUS']['onboarding']
  >;
  alertOnExit?: boolean;
}

export const OnboardingWizardBasic: FC<OnboardingWizardBasicProps> = ({
  initialStep = 0,
  variant = 'circle-alt',
  onboardingContentTokens = {},
  alertOnExit = false,
  ...props
}) => {
  const {
    data: clientData,
    status: clientGetStatus,
    error: clientGetError,
    refetch: refetchClient,
  } = useSmbdoGetClient(props.clientId ?? '', {
    query: {
      enabled: !!props.clientId,
    },
  });
  const { tokens: globalContentTokens = {} } = useContentTokens();
  const { t, i18n } = useTranslation('onboarding');

  // Apply content tokens
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

  const productFromResponse = clientData?.products?.[0];
  const organizationDetailsFromResponse = clientData?.parties?.find(
    (party) => party?.partyType === 'ORGANIZATION'
  )?.organizationDetails;

  const steps = useMemo(() => {
    return getOnboardingSteps(
      productFromResponse,
      organizationDetailsFromResponse?.jurisdiction as Jurisdiction,
      organizationDetailsFromResponse?.organizationType
    );
  }, [
    productFromResponse,
    organizationDetailsFromResponse?.jurisdiction,
    organizationDetailsFromResponse?.organizationType,
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

  return (
    <OnboardingContextProvider {...props}>
      <Card className="eb-component">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="eb-flex eb-w-full eb-flex-col eb-gap-4">
          <OutstandingInfoDebug clientData={clientData} />
          {props.clientId && clientGetStatus === 'pending' ? (
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
          ) : clientData?.status === 'NEW' || !props.clientId ? (
            <Stepper
              initialStep={initialStep}
              steps={steps}
              variant={variant}
              mobileBreakpoint="1279px"
            >
              {steps.map((stepProps, index) => {
                const { children, ...rest } = stepProps;
                return (
                  <Step key={index} {...rest}>
                    <div className="eb-px-1">{children}</div>
                  </Step>
                );
              })}
            </Stepper>
          ) : (
            <ClientOnboardingStateView />
          )}
        </CardContent>
      </Card>
    </OnboardingContextProvider>
  );
};

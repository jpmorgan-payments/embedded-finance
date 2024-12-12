import { FC, useEffect, useState } from 'react';
import { defaultResources } from '@/i18n/config';
import { DeepPartial } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { ClientProductList } from '@/api/generated/smbdo.schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Step, Stepper } from '@/components/ui/stepper';

import { useEBComponentsContext } from '../EBComponentsProvider/EBComponentsProvider';
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

const stepsInitial = [
  { label: 'Initial details', children: <InitialStepForm /> },
  { label: 'Organization details', children: <OrganizationStepForm /> },
  { label: 'Individual details', children: <IndividualStepForm /> },
  {
    label: 'Decision Makers',
    children: <DecisionMakerStepForm />,
    onlyVisibleFor: {
      organizationType: ['LIMITED_LIABILITY_COMPANY'],
      product: ['EMBEDDED_PAYMENTS', 'MERCHANT_SERVICES'] as ClientProductList,
    },
  },
  {
    label: 'Business Owners',
    children: <BusinessOwnerStepForm />,
    onlyVisibleFor: {
      organizationType: ['LIMITED_LIABILITY_COMPANY'],
      product: ['EMBEDDED_PAYMENTS', 'MERCHANT_SERVICES'] as ClientProductList,
    },
  },
  { label: 'Additional Questions', children: <AdditionalQuestionsStepForm /> },
  { label: 'Review and Attest', children: <ReviewAndAttestStepForm /> },
];

const stepsCanadaMS = [
  { label: 'Initial details', children: <InitialStepForm /> },
  { label: 'Organization details', children: <OrganizationStepForm /> },
  { label: 'Individual details', children: <IndividualStepForm /> },
  {
    label: 'Decision Makers',
    children: <DecisionMakerStepForm />,
    onlyVisibleFor: {
      organizationType: ['LIMITED_LIABILITY_COMPANY'],
      product: ['MERCHANT_SERVICES'] as ClientProductList,
    },
  },
  {
    label: 'Business Owners',
    children: <BusinessOwnerStepForm />,
    onlyVisibleFor: {
      organizationType: ['LIMITED_LIABILITY_COMPANY'],
      product: ['EMBEDDED_PAYMENTS', 'MERCHANT_SERVICES'] as ClientProductList,
    },
  },
  { label: 'Additional Questions', children: <AdditionalQuestionsStepForm /> },
  { label: 'Upload Documents', children: <DocumentUploadStepForm /> },
  { label: 'Review and Attest', children: <ReviewAndAttestStepForm /> },
];

interface StepProps {
  label: string;
  children: React.ReactNode;
  onlyVisibleFor?: { product?: string[]; organizationType?: string[] };
}

export interface OnboardingWizardBasicProps extends OnboardingContextType {
  initialStep?: number;
  variant?: 'circle' | 'circle-alt' | 'line';
  translationOverrides?: DeepPartial<
    Record<
      keyof typeof defaultResources,
      (typeof defaultResources)['en']['onboarding']
    >
  >;
}

export const OnboardingWizardBasic: FC<OnboardingWizardBasicProps> = ({
  initialStep = 0,
  variant = 'circle',
  translationOverrides = {},
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
  const { globalTranslationOverrides = {} } = useEBComponentsContext();
  const { t, i18n } = useTranslation('onboarding');

  // Apply translation overrides
  // TODO: extract into separate fn
  useEffect(() => {
    // Reset to default
    Object.entries(defaultResources).forEach(([lng, translations]) => {
      i18n.addResourceBundle(
        lng,
        'onboarding',
        translations.onboarding,
        false, // deep
        true // overwrite
      );
    });
    // Apply global overrides
    Object.entries(globalTranslationOverrides).forEach(
      ([lng, translations]) => {
        if (translations.onboarding) {
          i18n.addResourceBundle(
            lng,
            'onboarding',
            translations.onboarding,
            true,
            true
          );
        }
      }
    );
    // Apply local overrides
    Object.entries(translationOverrides).forEach(([lng, translation]) => {
      i18n.addResourceBundle(lng, 'onboarding', translation, true, true);
    });
    // Re-render with new translations
    i18n.changeLanguage(i18n.language);
  }, [
    JSON.stringify(globalTranslationOverrides),
    JSON.stringify(translationOverrides),
    i18n,
  ]);

  const productFromResponse = clientData?.products?.[0];

  // TODO: add a function to get steps based on the product, organization type, and jurisdiction
  const stepsToUse =
    productFromResponse === 'EMBEDDED_PAYMENTS' ? stepsInitial : stepsCanadaMS;

  const [steps, setSteps] = useState<StepProps[]>([]);

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

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // TODO: Replace with aforementioned function
  useEffect(() => {
    setSteps(
      stepsToUse.filter(
        (step) =>
          !step.onlyVisibleFor ||
          (step.onlyVisibleFor?.organizationType.some(
            (orgType) =>
              clientData?.parties?.find(
                (party) => party?.partyType === 'ORGANIZATION'
              )?.organizationDetails?.organizationType === orgType
          ) &&
            step.onlyVisibleFor?.product.some((product) =>
              clientData?.products.includes(product)
            ))
      )
    );
  }, [clientData, stepsToUse]);

  return (
    <OnboardingContextProvider {...props}>
      <Card className="eb-component">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="eb-flex eb-w-full eb-flex-col eb-gap-4">
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

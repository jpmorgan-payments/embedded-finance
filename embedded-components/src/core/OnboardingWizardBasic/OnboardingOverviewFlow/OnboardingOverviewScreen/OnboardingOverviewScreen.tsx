import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ChevronRightIcon,
  InfoIcon,
  Loader2Icon,
  PencilIcon,
  UserIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  getSmbdoGetClientQueryKey,
  useSmbdoPostClients,
  useSmbdoUpdateClient,
  useUpdateParty as useSmbdoUpdateParty,
} from '@/api/generated/smbdo';
import { PartyType, Role } from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui';

import { OnboardingFormField } from '../../OnboardingFormField/OnboardingFormField';
import { ServerErrorAlert } from '../../ServerErrorAlert/ServerErrorAlert';
import {
  convertClientResponseToFormValues,
  generateClientRequestBody,
  generatePartyRequestBody,
  mapClientApiErrorsToFormErrors,
  mapPartyApiErrorsToFormErrors,
  setApiFormErrors,
  shapeFormValuesBySchema,
  useFormWithFilters,
} from '../../utils/formUtils';
import { ORGANIZATION_TYPE_LIST } from '../../utils/organizationTypeList';
import { useOnboardingOverviewContext } from '../OnboardingContext/OnboardingContext';
import { GlobalStepper } from '../OnboardingGlobalStepper';
import { StepLayout } from '../StepLayout/StepLayout';

const items = [{}];

export const OnboardingOverviewScreen = () => {
  const queryClient = useQueryClient();
  const { clientData, organizationType } = useOnboardingOverviewContext();

  // Show message if clientData changes upon refetch? (edge case)

  const globalStepper = GlobalStepper.useStepper();

  const { t } = useTranslation(['onboarding-overview', 'onboarding', 'common']);

  return (
    <StepLayout
      subTitle={
        <div className="eb-flex eb-h-6 eb-items-end eb-space-x-2">
          <p>{t(`onboarding:organizationTypes.${organizationType!}`)}</p>
          <Button
            variant="ghost"
            className="eb-h-6 eb-w-6 eb-px-3"
            onClick={() => globalStepper.goTo('gateway')}
          >
            <PencilIcon className="eb-stroke-primary" />
          </Button>
        </div>
      }
      title={t('steps.checklist.title')}
      description={t('steps.checklist.description')}
    >
      <div className="eb-flex-auto eb-space-y-4">
        <Alert variant="informative">
          <InfoIcon className="eb-h-4 eb-w-4" />
          <AlertDescription>{t('steps.overview.infoAlert')}</AlertDescription>
        </Alert>

        <div className="eb-flex eb-flex-col eb-space-y-2">
          <p className="eb-text-sm eb-font-semibold">
            Please complete the following to verify your company
          </p>
          <div className="eb-flex eb-justify-between eb-rounded-md eb-border eb-px-4 eb-py-2 eb-text-sm">
            <div className="eb-flex eb-items-center eb-gap-2">
              <UserIcon className="eb-h-4 eb-w-4" />
              <span>Personal details</span>
            </div>
            <Button variant="ghost" size="sm" className="eb-text-primary">
              Start
              <ChevronRightIcon className="eb-h-4 eb-w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="eb-flex eb-justify-between eb-gap-4">
        <Button
          variant="secondary"
          size="lg"
          className="eb-w-full eb-text-lg"
          onClick={() => globalStepper.prev()}
        >
          {t('steps.overview.prevButton')}
        </Button>
      </div>
    </StepLayout>
  );
};

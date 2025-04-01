import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { InfoIcon, Loader2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  getSmbdoGetClientQueryKey,
  useSmbdoPostClients,
  useSmbdoUpdateClient,
  useUpdateParty as useSmbdoUpdateParty,
} from '@/api/generated/smbdo';
import { PartyType, Role } from '@/api/generated/smbdo.schemas';
import { AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form } from '@/components/ui/form';
import { Alert, Button } from '@/components/ui';

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

export const OnboardingOverviewScreen = () => {
  const queryClient = useQueryClient();
  const { clientData } = useOnboardingOverviewContext();

  // Show message if clientData changes upon refetch? (edge case)

  const globalStepper = GlobalStepper.useStepper();

  const { t } = useTranslation(['onboarding-overview', 'onboarding', 'common']);

  return (
    <div className="eb-flex eb-min-h-full eb-flex-col eb-space-y-8">
      <Alert variant="informative">
        <InfoIcon className="eb-h-4 eb-w-4" />
        <AlertDescription>{t('steps.overview.infoAlert')}</AlertDescription>
      </Alert>

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
    </div>
  );
};

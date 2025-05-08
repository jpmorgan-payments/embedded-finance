import { DownloadIcon, InfoIcon, PencilIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, Card, CardTitle } from '@/components/ui';

import { StepLayout } from '../../components/StepLayout/StepLayout';
import { useFlowContext } from '../../context/FlowContext';
// import { ORGANIZATION_TYPE_LIST } from '../../utils/organizationTypeList';
import { useOnboardingOverviewContext } from '../../OnboardingContext/OnboardingContext';

export const ChecklistScreen = () => {
  const { organizationType } = useOnboardingOverviewContext();
  const { goTo } = useFlowContext();

  const { t } = useTranslation(['onboarding-overview', 'onboarding', 'common']);

  return (
    <StepLayout
      subTitle={
        <div className="eb-flex eb-h-6 eb-items-end eb-space-x-2">
          <p>{t(`onboarding:organizationTypes.${organizationType!}`)}</p>
          <Button
            variant="ghost"
            className="eb-h-6 eb-w-6 eb-px-3"
            onClick={() => goTo('gateway')}
          >
            <PencilIcon className="eb-stroke-primary" />
          </Button>
        </div>
      }
      title={t('steps.checklist.title')}
      description={t('steps.checklist.description')}
    >
      <div className="eb-mt-1">
        <Button variant="ghost">
          <DownloadIcon /> Download checklist
        </Button>
      </div>
      <div className="eb-mt-6 eb-max-h-[480px] eb-flex-auto eb-space-y-4 eb-overflow-y-scroll eb-border-y eb-py-2">
        <Card className="eb-space-y-4 eb-rounded-lg eb-border eb-p-4">
          <CardTitle className="eb-text-xl eb-font-bold eb-tracking-tight">
            Personal details
          </CardTitle>

          <div className="eb-space-y-1">
            <p className="eb-font-semibold">
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              We'll need your information as the business's financial
              controller.
            </p>
            <ul className="eb-list-disc eb-pl-8">
              <li>Name and job title</li>
              <li>Identity document details</li>
              <li>Address and contact details</li>
            </ul>
          </div>
        </Card>

        <Card className="eb-space-y-4 eb-rounded-lg eb-border eb-p-4">
          <CardTitle className="eb-text-xl eb-font-bold eb-tracking-tight">
            Business details
          </CardTitle>

          <div className="eb-space-y-1">
            <p className="eb-font-semibold">
              Collect pertinent business details, typically found on official
              business registration documents.
            </p>
            <ul className="eb-list-disc eb-pl-8">
              <li>Business classification</li>
              <li>Registration ID details</li>
              <li>Location and contact details</li>
            </ul>
          </div>
        </Card>

        <Card className="eb-space-y-4 eb-rounded-lg eb-border eb-p-4">
          <CardTitle className="eb-text-xl eb-font-bold eb-tracking-tight">
            Owners and key roles
          </CardTitle>

          <div>
            <p className="eb-font-semibold">
              Collect personal details for key stakeholders in your business.
            </p>

            <div className="eb-space-y-1">
              <p className="eb-font-semibold">
                Controllers and beneficial owners
              </p>
              <ul className="eb-list-disc eb-pl-8">
                <li>Name and job title</li>
                <li>Identity document details</li>
                <li>Address and contact details</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="eb-space-y-4 eb-rounded-lg eb-border eb-p-4">
          <CardTitle className="eb-text-xl eb-font-bold eb-tracking-tight">
            Bank account
          </CardTitle>

          <div>
            <p className="eb-font-semibold">
              We&apos;ll need the details of the bank account you wish to
              receive payouts.
            </p>
          </div>
        </Card>
      </div>

      <div className="eb-mt-6 eb-space-y-6">
        {t('steps.checklist.alerts', { returnObjects: true }).map(
          (alert, index) => (
            <Alert
              variant="informative"
              key={index}
              className="eb-pb-3 eb-text-foreground"
            >
              <InfoIcon className="eb-h-4 eb-w-4" />
              {alert.title && <AlertTitle>{alert.title}</AlertTitle>}
              {alert.description && (
                <AlertDescription>{alert.description}</AlertDescription>
              )}
            </Alert>
          )
        )}
        <div className="eb-flex eb-justify-between eb-gap-4">
          <Button
            variant="secondary"
            size="lg"
            className="eb-w-full eb-text-lg"
            onClick={() => goTo('gateway')}
          >
            {t('steps.checklist.prevButton')}
          </Button>
          <Button
            size="lg"
            className="eb-w-full eb-text-lg"
            onClick={() => goTo('overview')}
          >
            {t('steps.checklist.nextButton')}
          </Button>
        </div>
      </div>
    </StepLayout>
  );
};

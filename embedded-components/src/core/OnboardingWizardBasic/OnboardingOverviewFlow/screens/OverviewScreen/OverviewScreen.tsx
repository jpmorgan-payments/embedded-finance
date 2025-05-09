import {
  CheckCircle2Icon,
  CheckIcon,
  ChevronRightIcon,
  InfoIcon,
  LockIcon,
  PencilIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui';

import { StepLayout } from '../../components/StepLayout/StepLayout';
import { useFlowContext } from '../../context/FlowContext';
import { useOnboardingOverviewContext } from '../../OnboardingContext/OnboardingContext';
import { getPartyByAssociatedPartyFilters } from '../../utils/dataUtils';
import { getFlowProgress } from '../../utils/flowUtils';

export const OverviewScreen = () => {
  const { organizationType, clientData } = useOnboardingOverviewContext();
  const { sections, goTo, sessionData } = useFlowContext();

  const { sectionStatuses } = getFlowProgress(
    sections,
    sessionData,
    clientData
  );

  const { t } = useTranslation(['onboarding-overview', 'onboarding', 'common']);

  // TODO:
  const kycCompleted =
    sessionData.mockedKycCompleted ||
    clientData?.status === 'INFORMATION_REQUESTED';

  return (
    <StepLayout
      subTitle={
        <div className="eb-flex eb-items-end eb-space-x-2">
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
      title={t('steps.overview.title')}
      description={t('steps.overview.description')}
    >
      <div className="eb-mt-2 eb-flex-auto eb-space-y-6">
        <Alert variant="informative" className="eb-pb-3">
          <InfoIcon className="eb-h-4 eb-w-4" />
          <AlertDescription>{t('steps.overview.infoAlert')}</AlertDescription>
        </Alert>

        <div className="eb-flex eb-flex-col eb-space-y-2">
          <p className="eb-text-sm eb-font-semibold">
            Please complete the following to verify your business
          </p>
          {sections.map((section) => {
            const sectionStatus = sectionStatuses?.[section.id];
            const sectionCompleted = [
              'done_disabled',
              'done_editable',
            ].includes(sectionStatus);
            // && sessionData.mockedVerifyingSectionId !== section.id;
            const sectionDisabled = ['done_disabled', 'on_hold'].includes(
              sectionStatus
            );
            const sectionVerifying =
              sectionStatus === 'verifying' ||
              sessionData.mockedVerifyingSectionId === section.id;

            const existingPartyData = getPartyByAssociatedPartyFilters(
              clientData,
              section.stepperConfig?.associatedPartyFilters
            );

            return (
              <div key={section.id}>
                <Button
                  variant="ghost"
                  className={cn(
                    'eb-flex eb-h-14 eb-w-full eb-justify-between eb-rounded-md eb-border eb-bg-card eb-px-4 eb-py-2 eb-text-sm',
                    {
                      'eb-italic': sectionDisabled,
                    }
                  )}
                  disabled={sectionDisabled}
                  onClick={() => {
                    goTo(section.id, {
                      editingPartyId: existingPartyData.id,
                      previouslyCompleted: sectionCompleted,
                    });
                  }}
                >
                  <div className="eb-flex eb-items-center eb-gap-2 eb-font-sans eb-font-normal eb-normal-case eb-tracking-normal">
                    <section.sectionConfig.icon className="eb-size-4" />
                    <span>{section.sectionConfig.label}</span>
                  </div>

                  <div className="eb-flex eb-px-3 [&_svg]:eb-size-6">
                    <CheckCircle2Icon
                      aria-label="Completed"
                      className={cn(
                        'eb-duration-400 eb-hidden eb-stroke-green-600 eb-opacity-0 eb-transition-opacity eb-ease-in',
                        {
                          'eb-block eb-opacity-100': sectionCompleted,
                        }
                      )}
                    />
                    {/* <Loader2Icon
                      className={cn(
                        'eb-hidden eb-animate-spin eb-stroke-primary',
                        {
                          'eb-block': sectionVerifying,
                        }
                      )}
                    /> */}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'eb-pointer-events-none eb-hidden eb-text-primary',
                      {
                        'eb-font-normal eb-italic [--eb-button-text-transform:lowercase]':
                          sectionStatus === 'on_hold',
                        'eb-flex': !sectionCompleted && !sectionVerifying,
                      }
                    )}
                  >
                    {sectionStatus === 'on_hold' ? (
                      'hold'
                    ) : (
                      <>
                        {t('common:start')}
                        <ChevronRightIcon />
                      </>
                    )}
                  </Button>
                </Button>
                {section.sectionConfig.helpText && (
                  <p
                    className={cn('eb-mt-1 eb-text-sm eb-italic', {
                      'eb-text-muted-foreground': sectionDisabled,
                    })}
                  >
                    {section.sectionConfig.helpText}
                  </p>
                )}
              </div>
            );
          })}

          {kycCompleted && (
            <Alert className="eb-border-[#00875D] eb-bg-[#EAF5F2] eb-pb-3">
              <CheckIcon className="eb-size-4 eb-stroke-[#00875D]" />
              <AlertDescription>
                Success! Your business has been verified and your account has
                been activated. Please continue below to link a bank account.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div>
          <p className="eb-text-sm eb-font-semibold">
            Let us know where to send payouts
          </p>
          {!kycCompleted && (
            <p className="eb-mt-0.5 eb-flex eb-items-center eb-gap-1 eb-text-xs eb-text-muted-foreground">
              <LockIcon className="eb-size-3" /> Verify your business to unlock
              this step
            </p>
          )}
          <Button
            variant="ghost"
            className={cn(
              'eb-mt-2 eb-flex eb-h-14 eb-w-full eb-justify-between eb-rounded-md eb-border eb-bg-card eb-px-4 eb-py-2 eb-text-sm'
            )}
            disabled={!kycCompleted}
          >
            <div className="eb-flex eb-items-center eb-gap-2 eb-font-sans eb-font-normal eb-normal-case eb-tracking-normal">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.5 4V3H6.5V4H5.5Z"
                  fill="#4C5157"
                  fillOpacity="0.4"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6 0L12 6H10V11H12V12H0V11L2 11V6H0L6 0ZM3 6V11H4V6H3ZM5 6V11H7V6H5ZM8 6V11H9V6H8ZM6 1.41421L9.58579 5H2.41421L6 1.41421Z"
                  fill="#4C5157"
                  fillOpacity={kycCompleted ? '1' : '0.8'}
                />
              </svg>

              <span>Link a bank account</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={cn('eb-pointer-events-none eb-text-primary')}
            >
              {t('common:start')}
              <ChevronRightIcon />
            </Button>
          </Button>
        </div>
      </div>

      <div className="eb-mt-6 eb-flex eb-justify-between eb-gap-4">
        <Button
          variant="secondary"
          size="lg"
          className="eb-w-full eb-text-lg"
          onClick={() => goTo('checklist')}
        >
          {t('steps.overview.prevButton')}
        </Button>
      </div>
    </StepLayout>
  );
};

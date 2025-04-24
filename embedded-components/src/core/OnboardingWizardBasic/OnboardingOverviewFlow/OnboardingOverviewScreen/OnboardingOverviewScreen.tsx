import { useEffect } from 'react';
import {
  CheckCircle2Icon,
  ChevronRightIcon,
  InfoIcon,
  Loader2Icon,
  LockIcon,
  PencilIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui';

import {
  convertClientResponseToFormValues,
  useFormUtilsWithClientContext,
} from '../../utils/formUtils';
import { useOnboardingOverviewContext } from '../OnboardingContext/OnboardingContext';
import { GlobalStepper } from '../OnboardingGlobalStepper';
import { overviewSections } from '../overviewSectionsConfig';
import { StepLayout } from '../StepLayout/StepLayout';

export const OnboardingOverviewScreen = () => {
  const { organizationType, clientData } = useOnboardingOverviewContext();

  // TODO: Show message if clientData changes upon refetch? (edge case)

  const globalStepper = GlobalStepper.useStepper();

  const { t } = useTranslation(['onboarding-overview', 'onboarding', 'common']);

  const { modifySchema } = useFormUtilsWithClientContext(clientData);

  const { justCompletedSection, completedSections } = globalStepper.getMetadata(
    'overview'
  ) as {
    justCompletedSection: string | undefined;
    // completedSections just tracks the ones completed this session
    completedSections: Record<string, false>;
  };

  // Mocked loading state: After 3 seconds, add justCompletedSection to completedSections
  useEffect(() => {
    if (justCompletedSection) {
      const timeout = setTimeout(() => {
        globalStepper.setMetadata('overview', {
          completedSections: {
            ...completedSections,
            [justCompletedSection]: true,
          },
        });
      }, 1500);

      return () => clearTimeout(timeout);
    }
    return () => {};
  }, [justCompletedSection]);

  const checkSectionIsCompleted = (id: string) => {
    const section = overviewSections.find((item) => item.id === id);
    if (!section) return false;
    if (completedSections?.[id]) return true;
    if (section.id === 'operational') {
      return clientData?.outstanding?.questionIds?.length === 0;
    }

    const { type, steps, correspondingParty } = section;
    if (type === 'stepper' && clientData) {
      const partyData = clientData.parties?.find(
        (party) =>
          party?.partyType === correspondingParty?.partyType &&
          correspondingParty?.roles?.every((role) =>
            party?.roles?.includes(role)
          ) &&
          party.active
      );
      if (!partyData) return false;

      const formValues = convertClientResponseToFormValues(
        clientData,
        partyData.id
      );

      const notComplete = steps.some((step) => {
        if (step.type === 'form') {
          const modifiedSchema = modifySchema(
            step.FormComponent.schema,
            step.FormComponent.refineSchemaFn
          );
          return modifiedSchema.safeParse(formValues).success === false;
        }
        return false;
      });
      return !notComplete;
    }
    return false;
  };

  return (
    <StepLayout
      subTitle={
        <div className="eb-flex eb-items-end eb-space-x-2">
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
          {overviewSections.map((section) => {
            const disabled = section.id === 'upload-documents';
            return (
              <div key={section.id}>
                <Button
                  variant="ghost"
                  className={cn(
                    'eb-flex eb-h-14 eb-w-full eb-justify-between eb-rounded-md eb-border eb-bg-card eb-px-4 eb-py-2 eb-text-sm',
                    {
                      'eb-italic': disabled,
                    }
                  )}
                  disabled={disabled}
                  onClick={() => {
                    if (section.type === 'stepper') {
                      globalStepper.setMetadata('section-stepper', {
                        ...section,
                        completed: checkSectionIsCompleted(section.id),
                        originStepId: 'overview',
                      });
                      globalStepper.goTo('section-stepper');
                    } else if (section.type === 'global-step') {
                      globalStepper.setMetadata(section.stepId, {
                        ...section,
                      });
                      globalStepper.goTo(section.stepId);
                    }
                  }}
                >
                  <div className="eb-flex eb-items-center eb-gap-2 eb-font-sans eb-font-normal eb-normal-case eb-tracking-normal">
                    <section.icon className="eb-size-4" />
                    <span>{section.title}</span>
                  </div>

                  {section.id === justCompletedSection ||
                  checkSectionIsCompleted(section.id) ? (
                    <div className="eb-flex eb-px-3 [&_svg]:eb-size-6">
                      <CheckCircle2Icon
                        className={cn(
                          'eb-duration-400 eb-stroke-green-600 eb-opacity-100 eb-transition-opacity eb-ease-in',
                          {
                            'eb-hidden': !checkSectionIsCompleted(section.id),
                            'eb-opacity-0': justCompletedSection === section.id,
                          }
                        )}
                      />
                      <Loader2Icon
                        className={cn('eb-animate-spin eb-stroke-primary', {
                          'eb-hidden': justCompletedSection !== section.id,
                        })}
                      />
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn('eb-pointer-events-none eb-text-primary', {
                        'eb-italic': disabled,
                        'eb-font-normal': disabled,
                        '[--eb-button-text-transform:lowercase]': disabled,
                      })}
                    >
                      {disabled ? (
                        'hold'
                      ) : (
                        <>
                          {t('common:start')}
                          <ChevronRightIcon />
                        </>
                      )}
                    </Button>
                  )}
                </Button>
                {section.helpText && (
                  <p className="eb-mt-1 eb-text-sm eb-italic">
                    {section.helpText}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div>
          <p className="eb-text-sm eb-font-semibold">
            Let us know where to send payouts
          </p>
          <p className="eb-mt-0.5 eb-flex eb-items-center eb-gap-1 eb-text-xs eb-text-muted-foreground">
            <LockIcon className="eb-size-3" /> Verify your business to unlock
            this step
          </p>
          <Button
            variant="ghost"
            className={cn(
              'eb-mt-2 eb-flex eb-h-14 eb-w-full eb-justify-between eb-rounded-md eb-border eb-bg-card eb-px-4 eb-py-2 eb-text-sm'
            )}
            disabled
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
                  fillOpacity="0.4"
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

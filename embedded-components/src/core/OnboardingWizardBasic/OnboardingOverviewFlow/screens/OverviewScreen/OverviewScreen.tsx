import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronRightIcon,
  CircleDashedIcon,
  Clock9Icon,
  DownloadIcon,
  InfoIcon,
  Loader2Icon,
  LockIcon,
  PencilIcon,
  XIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';

import { StepLayout } from '../../components/StepLayout/StepLayout';
import { useFlowContext } from '../../context/FlowContext';
import { useOnboardingOverviewContext } from '../../OnboardingContext/OnboardingContext';
import { getPartyByAssociatedPartyFilters } from '../../utils/dataUtils';
import { getFlowProgress } from '../../utils/flowUtils';

export const OverviewScreen = () => {
  const { organizationType, clientData } = useOnboardingOverviewContext();
  const { sections, goTo, sessionData, updateSessionData } = useFlowContext();

  const { sectionStatuses, stepValidations } = getFlowProgress(
    sections,
    sessionData,
    clientData
  );

  const { t } = useTranslation(['onboarding-overview', 'onboarding', 'common']);

  // TODO:
  const kycCompleted =
    sessionData.mockedKycCompleted || clientData?.status === 'APPROVED';

  const organizationTypeText = t(`organizationTypes.${organizationType!}`);

  return (
    <StepLayout
      title={
        <div className="eb-flex eb-items-center eb-justify-between">
          <p>{t('screens.overview.title')}</p>
          <Button variant="outline" size="sm">
            <DownloadIcon /> Download Checklist
          </Button>
        </div>
      }
      subTitle={
        !sessionData.hideOverviewInfoAlert && clientData?.status === 'NEW' ? (
          <Alert variant="informative" density="sm" className="eb-pb-2">
            <InfoIcon className="eb-size-4" />
            <AlertDescription>
              {t('screens.overview.infoAlert')}
            </AlertDescription>
            <button
              type="button"
              className="eb-hover:eb-opacity-100 eb-focus:eb-outline-none eb-focus:eb-ring-2 eb-focus:eb-ring-ring eb-focus:eb-ring-offset-2 eb-disabled:eb-pointer-events-none eb-absolute eb-right-4 eb-top-3 eb-rounded-sm eb-opacity-70 eb-ring-offset-background eb-transition-opacity data-[state=open]:eb-bg-accent data-[state=open]:eb-text-muted-foreground [&&]:eb-pl-0"
              onClick={() => {
                updateSessionData({
                  hideOverviewInfoAlert: true,
                });
              }}
            >
              <XIcon className="eb-size-4 eb-pl-0 eb-text-foreground" />
              <span className="eb-sr-only">Close</span>
            </button>
          </Alert>
        ) : undefined
      }
      description={t('screens.overview.description')}
    >
      <div className="eb-flex-auto eb-space-y-6">
        <Card className="eb-mt-6 eb-rounded-md eb-border-none eb-bg-card">
          <CardHeader className="eb-p-3">
            <CardTitle>
              <h2 className="eb-font-header eb-text-2xl eb-font-medium">
                Verify your business
              </h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="eb-p-3 eb-pt-0">
            {clientData?.status === 'REVIEW_IN_PROGRESS' && (
              <Alert
                variant="informative"
                density="sm"
                className="eb-mb-6 eb-pt-2.5"
              >
                <Clock9Icon className="eb-size-4" />
                <AlertTitle className="eb-text-sm eb-text-foreground">
                  Great work!
                </AlertTitle>
                <AlertDescription>
                  Please hang tight while we verify your details. This should
                  only take a moment.
                  <Loader2Icon className="eb-mt-1.5 eb-size-9 eb-animate-spin eb-stroke-primary" />
                </AlertDescription>
              </Alert>
            )}

            {clientData?.status === 'INFORMATION_REQUESTED' && (
              <Alert variant="warning" density="sm" className="eb-mb-6 eb-pb-2">
                <AlertTriangleIcon className="eb-size-4" />
                <AlertDescription>
                  We&apos;re having trouble verifying your business. Please
                  provide supporting documentation.
                </AlertDescription>
              </Alert>
            )}

            {clientData?.status === 'DECLINED' && (
              <Alert variant="destructive" density="sm" className="eb-pt-2.5">
                <AlertCircleIcon className="eb-size-4" />
                <AlertTitle className="eb-text-sm eb-text-foreground">
                  Application declined
                </AlertTitle>
                <AlertDescription>
                  We&apos;re sorry, but we cannot proceed with your application
                  at this time.
                </AlertDescription>
              </Alert>
            )}

            {clientData?.status === 'APPROVED' && (
              <Alert variant="success" density="sm" className="eb-pt-2.5">
                <CheckIcon className="eb-size-4" />
                <AlertTitle className="eb-text-sm eb-text-foreground">
                  All set!
                </AlertTitle>
                <AlertDescription>
                  Your business details have been verified
                </AlertDescription>
              </Alert>
            )}

            <div className="eb-space-y-3">
              {clientData?.status === 'NEW' && (
                <div className="eb-space-y-3 eb-rounded eb-bg-accent eb-px-4 eb-py-3">
                  <p className="eb-text-xs eb-font-semibold eb-tracking-normal eb-text-muted-foreground">
                    Your selected business type
                  </p>
                  <div>
                    <span
                      id="business-structure"
                      className="eb-inline-flex eb-h-10 eb-w-full eb-items-center eb-justify-between eb-gap-2 eb-rounded-input eb-border eb-py-2 eb-pl-3 eb-text-sm"
                    >
                      <span className="eb-flex eb-text-start eb-font-sans eb-text-sm eb-font-normal eb-normal-case eb-text-foreground">
                        {organizationTypeText}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => goTo('gateway')}
                        aria-label="Edit business type"
                        className="eb-rounded-input hover:eb-bg-black/5"
                      >
                        <PencilIcon />
                        Edit
                      </Button>
                    </span>

                    <p className="eb-mt-3 eb-flex eb-gap-2 eb-text-xs eb-italic eb-text-muted-foreground">
                      <AlertTriangleIcon className="eb-size-4" /> If you change
                      this after starting the application, you may lose your
                      saved progress.
                    </p>
                  </div>
                </div>
              )}

              {sections.map((section) => {
                const sectionStatus = sectionStatuses?.[section.id];
                const sectionDisabled = sectionStatus === 'on_hold';
                const firstInvalidStep = stepValidations[section.id]
                  ? Object.entries(stepValidations[section.id]).find(
                      ([, validation]) => !validation.isValid
                    )?.[0]
                  : undefined;

                // const sectionVerifying =
                //   sectionStatus === 'verifying' ||
                //   sessionData.mockedVerifyingSectionId === section.id;

                const existingPartyData = getPartyByAssociatedPartyFilters(
                  clientData,
                  section.stepperConfig?.associatedPartyFilters
                );

                if (sectionStatus === 'hidden') {
                  return null;
                }

                return (
                  <div key={section.id}>
                    {sectionStatus === 'on_hold' &&
                      section.sectionConfig.onHoldText && (
                        <p
                          className={cn(
                            'eb-mb-3 eb-mt-7 eb-flex eb-items-center eb-gap-2 eb-text-sm eb-font-medium',
                            {
                              'eb-text-muted-foreground': sectionDisabled,
                            }
                          )}
                        >
                          <LockIcon className="eb-size-4" />
                          {section.sectionConfig.onHoldText}
                        </p>
                      )}
                    <Card
                      className={cn(
                        'eb-rounded-md eb-border eb-bg-card eb-p-3',
                        {
                          'eb-border-dashed eb-border-muted-foreground':
                            sectionDisabled,
                        }
                      )}
                    >
                      <div className="eb-flex eb-w-full eb-items-center eb-justify-between">
                        <div className="eb-flex eb-items-center eb-gap-2">
                          <section.sectionConfig.icon
                            className={cn('eb-size-4', {
                              'eb-text-muted-foreground': sectionDisabled,
                            })}
                          />
                          <h3
                            className={cn(
                              'eb-font-header eb-text-lg eb-font-medium',
                              {
                                'eb-text-muted-foreground': sectionDisabled,
                              }
                            )}
                          >
                            {section.sectionConfig.label}
                          </h3>
                        </div>

                        <div className="eb-flex [&_svg]:eb-size-4">
                          {sectionStatus === 'completed' && (
                            <>
                              <CheckCircle2Icon className="eb-stroke-green-600" />
                              <span className="eb-sr-only">Completed</span>
                            </>
                          )}
                          {['not_started', 'on_hold'].includes(
                            sectionStatus
                          ) && (
                            <>
                              <CircleDashedIcon className="eb-stroke-gray-600" />
                              <span className="eb-sr-only">Not started</span>
                            </>
                          )}
                          {sectionStatus === 'missing_details' && (
                            <>
                              <AlertTriangleIcon className="eb-stroke-[#C75300]" />
                              <span className="eb-sr-only">
                                Missing details
                              </span>
                            </>
                          )}
                          {/* <Loader2Icon
                      className={cn(
                        'eb-hidden eb-animate-spin eb-stroke-primary',
                        {
                          'eb-block': sectionVerifying,
                        }
                      )}
                    /> */}
                        </div>
                      </div>
                      {section.sectionConfig.requirementsList && (
                        <ul className="eb-mt-1.5 eb-w-full eb-list-disc eb-whitespace-break-spaces eb-pl-8 eb-text-start eb-font-sans eb-text-sm eb-font-normal">
                          {section.sectionConfig.requirementsList.map(
                            (item, index) => (
                              <li key={index}>{item}</li>
                            )
                          )}
                        </ul>
                      )}
                      <Button
                        variant={
                          ['completed', 'on_hold'].includes(sectionStatus)
                            ? 'secondary'
                            : 'default'
                        }
                        size="sm"
                        className="eb-mt-3 eb-w-full"
                        disabled={sectionDisabled}
                        onClick={() => {
                          goTo(section.id, {
                            editingPartyId: existingPartyData.id,
                            previouslyCompleted: sectionStatus === 'completed',
                            initialStepperStepId: firstInvalidStep,
                          });
                        }}
                      >
                        {['on_hold', 'not_started'].includes(sectionStatus) && (
                          <>
                            {t('common:start')}
                            <ChevronRightIcon />
                          </>
                        )}
                        {sectionStatus === 'completed' && (
                          <>
                            {t('common:edit')}
                            <PencilIcon />
                          </>
                        )}
                        {sectionStatus === 'missing_details' && (
                          <>
                            {t('common:continue')}
                            <ChevronRightIcon />
                          </>
                        )}
                      </Button>
                    </Card>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="eb-mt-6 eb-rounded-md eb-border-none eb-bg-card">
          <CardHeader className="eb-p-3">
            <CardTitle>
              <h2 className="eb-font-header eb-text-2xl eb-font-medium">
                Link a bank account for payouts
              </h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="eb-p-3 eb-pt-0">
            <div className="eb-space-y-3">
              <div>
                <p
                  className={cn(
                    'eb-mb-3 eb-flex eb-items-center eb-gap-2 eb-text-sm eb-font-medium',
                    {
                      'eb-text-muted-foreground': !kycCompleted,
                    }
                  )}
                >
                  <LockIcon className="eb-size-4" />
                  Available after business verification
                </p>
                <Card
                  className={cn('eb-rounded-md eb-border eb-bg-card eb-p-3', {
                    'eb-border-dashed eb-border-muted-foreground':
                      !kycCompleted,
                  })}
                >
                  <div className="eb-flex eb-w-full eb-justify-between">
                    <div className="eb-flex eb-items-center eb-gap-2">
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
                      <h3
                        className={cn(
                          'eb-font-header eb-text-lg eb-font-medium',
                          {
                            'eb-text-muted-foreground': !kycCompleted,
                          }
                        )}
                      >
                        Link an account
                      </h3>
                    </div>

                    <div className="eb-flex [&_svg]:eb-size-4">
                      <CircleDashedIcon className="eb-stroke-gray-600" />
                      <span className="eb-sr-only">Not started</span>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="eb-mt-3 eb-w-full"
                    disabled={!kycCompleted}
                  >
                    {t('common:start')}
                    <ChevronRightIcon />
                  </Button>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StepLayout>
  );
};

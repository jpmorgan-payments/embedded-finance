import {
  AlertTriangleIcon,
  ExternalLinkIcon,
  InfoIcon,
  SparklesIcon,
} from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { AlertDescription } from '@/components/ui/alert';
import { Alert, Button } from '@/components/ui';
import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';

import { IndustryFormSchema } from './IndustryForm.schema';
import { useIndustrySuggestions } from './useIndustrySuggestions';

export const IndustryForm: FormStepComponent = () => {
  const { t } = useTranslation('onboarding-overview');
  const form = useFormContext<z.input<typeof IndustryFormSchema>>();

  // Get the business description from the form
  const description = form.watch('organizationDescription');

  // Use our custom hook for AI industry suggestions
  const {
    isFeatureFlagEnabled,
    recommendations,
    showRecommendations,
    showEmptyRecommendationWarning,
    showRecommendationErrorWarning,
    recommendationErrorMessage,
    isPending,
    handleSuggest,
    setShowRecommendations,
  } = useIndustrySuggestions(description);

  const handleRecommendationClick = (code: string) => {
    form.setValue('industry', code);
    setShowRecommendations(false);
  };
  return (
    <div className="eb-mt-1 eb-space-y-6">
      <Alert
        variant="informative"
        density="sm"
        noTitle
        className="eb-mt-8 eb-max-w-full"
      >
        <InfoIcon className="eb-size-4 eb-shrink-0" />
        <AlertDescription className="eb-break-words">
          This is used for regulatory and compliance purposes, so please ensure
          your selection is accurate.
        </AlertDescription>
      </Alert>
      <div>
        <OnboardingFormField
          control={form.control}
          name="organizationDescription"
          type="textarea"
          popoutTooltip
          tooltip={
            <div className="eb-space-y-3">
              <h2 className="eb-font-header eb-text-2xl eb-font-medium">
                {t(
                  'fields.organizationDescription.tooltipContent.exampleTitle'
                )}
              </h2>
              <p className="eb-text-sm">
                {t('fields.organizationDescription.tooltipContent.exampleText')}
              </p>
              <p className="eb-pb-1 eb-text-sm">
                {t(
                  'fields.organizationDescription.tooltipContent.alignmentNote'
                )}
              </p>
              <h2 className="eb-font-header eb-text-2xl eb-font-medium">
                {t(
                  'fields.organizationDescription.tooltipContent.visibilityTitle'
                )}
              </h2>
              <p className="eb-pb-1 eb-text-sm">
                {t(
                  'fields.organizationDescription.tooltipContent.visibilityText'
                )}
              </p>
            </div>
          }
        />
        {showEmptyRecommendationWarning && (
          <Alert
            variant="warning"
            density="sm"
            className="eb-mt-2 eb-max-w-full"
            title="Improve Your Business Description"
          >
            <AlertTriangleIcon className="eb-size-4 eb-shrink-0" />
            <AlertDescription className="eb-overflow-hidden eb-break-words">
              <div className="eb-max-w-full eb-space-y-1">
                <p className="eb-break-words">
                  Your business description is too vague to suggest relevant
                  industry classifications. Please provide more specific details
                  about your business activities and primary operations.
                </p>
                <div className="eb-flex eb-max-w-full eb-flex-wrap eb-items-center eb-gap-1 eb-overflow-hidden">
                  <a
                    href="https://www.example.com/business-description-guide"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View examples of good business descriptions (opens in new tab)"
                    className="eb-inline-flex eb-max-w-full eb-items-center eb-gap-1 eb-truncate eb-text-sm eb-font-medium eb-text-primary eb-underline-offset-4 hover:eb-underline"
                  >
                    <span className="eb-truncate">
                      View examples of good business descriptions
                    </span>
                    <ExternalLinkIcon className="eb-h-3 eb-w-3 eb-shrink-0" />
                  </a>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
        {showRecommendationErrorWarning && (
          <Alert
            variant="warning"
            density="sm"
            className="eb-mt-2 eb-max-w-full"
            title="Unable to generate recommendations"
          >
            <AlertTriangleIcon className="eb-size-4 eb-shrink-0" />
            <AlertDescription className="eb-overflow-hidden eb-break-words">
              <div className="eb-max-w-full eb-space-y-1">
                {recommendationErrorMessage ? (
                  <p className="eb-break-words">{recommendationErrorMessage}</p>
                ) : (
                  <p className="eb-break-words">
                    We couldn’t generate industry recommendations right now.
                    Please try again later or proceed by selecting your industry
                    manually.
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
      <div className="eb-max-w-full eb-space-y-2">
        <div className="eb-flex eb-max-w-full eb-flex-wrap eb-items-center eb-gap-2 md:eb-flex-nowrap">
          <div className="eb-min-w-0 eb-max-w-full eb-flex-1">
            <OnboardingFormField
              control={form.control}
              name="industry"
              type="industrySelect"
              popoutTooltip
              tooltip={
                <div className="eb-mb-6">
                  <h2 className="eb-mb-0 eb-font-header eb-text-2xl eb-font-medium">
                    How do I make the right choice?
                  </h2>
                  <p className="eb-mb-0 eb-mt-1 eb-text-sm">
                    Please select the same classification chosen when your
                    business or organization was registered in North America.
                  </p>
                  <h3 className="eb-mb-0 eb-mt-3 eb-text-sm eb-font-medium">
                    If you are a sole proprietor or your business is registered
                    outside of North America,
                  </h3>
                  <p className="eb-mb-0 eb-mt-1 eb-text-sm">
                    You may not have previously selected a classification. In
                    this case, please make the best choice based on your primary
                    line of business.
                  </p>
                </div>
              }
            />
          </div>
          {isFeatureFlagEnabled && (
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={!description || isPending}
              onClick={handleSuggest}
              className="eb-shrink-0 eb-whitespace-nowrap"
            >
              <SparklesIcon className="eb-mr-2 eb-size-4 eb-shrink-0" />
              <span className="eb-truncate">Suggest</span>
            </Button>
          )}
        </div>
        {isPending && (
          <div className="eb-mt-2 eb-flex eb-items-center eb-gap-2 eb-text-sm eb-text-muted-foreground">
            <div className="eb-size-3 eb-animate-spin eb-rounded-full eb-border-2 eb-border-current eb-border-t-transparent" />
            <span>Analyzing your business description...</span>
          </div>
        )}
        {showRecommendations && recommendations.length > 0 && (
          <div className="eb-mt-3 eb-max-w-full eb-overflow-hidden eb-rounded-lg eb-bg-card eb-p-4 eb-shadow-sm">
            <div className="eb-mb-3 eb-flex eb-items-center eb-gap-2">
              <SparklesIcon className="eb-size-4 eb-shrink-0 eb-text-primary" />
              <p className="eb-break-words eb-text-sm eb-font-medium">
                Recommended industries based on your description:
              </p>
            </div>
            <div className="eb-mb-3 eb-rounded-sm eb-bg-muted/50 eb-px-3 eb-py-2 eb-text-xs">
              <p className="eb-flex eb-items-center eb-gap-1.5">
                <InfoIcon className="eb-size-3 eb-shrink-0" />
                <span>
                  These recommendations are generated by AI based on your
                  business description and may not be perfectly accurate. Please
                  review carefully before selecting.
                </span>
              </p>
            </div>
            <div className="eb-flex eb-max-w-full eb-flex-col eb-gap-2 eb-overflow-hidden md:eb-flex-row md:eb-flex-wrap">
              {recommendations.map((rec) => (
                <Button
                  key={rec.naicsCode}
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => handleRecommendationClick(rec.naicsCode)}
                  className="eb-h-auto eb-max-w-full eb-justify-start eb-px-3 eb-py-2 eb-text-left eb-text-xs hover:eb-bg-primary/5 active:eb-scale-[0.98] sm:eb-max-w-fit"
                  title={`${rec.naicsCode} - ${rec.naicsDescription}`}
                >
                  <div className="eb-flex eb-max-w-full eb-items-center eb-gap-2">
                    <span className="eb-font-mono eb-shrink-0 eb-rounded-sm eb-bg-primary/10 eb-px-1.5 eb-py-0.5 eb-font-semibold eb-text-primary">
                      {rec.naicsCode}
                    </span>
                    <span className="eb-line-clamp-1 eb-truncate">
                      {rec.naicsDescription}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

IndustryForm.schema = IndustryFormSchema;

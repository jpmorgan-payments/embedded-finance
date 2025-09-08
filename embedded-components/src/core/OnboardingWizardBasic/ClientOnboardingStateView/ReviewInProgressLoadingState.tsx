import React from 'react';
import { ClockIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ReviewInProgressLoadingState: React.FC = () => {
  const { t } = useTranslation(['onboarding-old', 'common']);

  return (
    <div className="eb-flex eb-flex-col eb-items-center eb-justify-center eb-space-y-4 eb-p-8">
      <div className="eb-relative eb-flex eb-h-16 eb-w-16 eb-items-center eb-justify-center">
        <div className="eb-absolute eb-inset-0 eb-animate-ping eb-rounded-full eb-bg-yellow-400 eb-opacity-75" />
        <div className="eb-relative eb-flex eb-h-12 eb-w-12 eb-items-center eb-justify-center eb-rounded-full eb-bg-yellow-500">
          <ClockIcon className="eb-h-6 eb-w-6 eb-text-white" />
        </div>
      </div>
      <div className="eb-text-center">
        <h3 className="eb-mb-2 eb-text-lg eb-font-semibold eb-text-gray-900">
          {t(
            'clientOnboardingStatus.reviewInProgress.title',
            'Review in Progress'
          )}
        </h3>
        <p className="eb-text-sm eb-text-gray-600">
          {t(
            'clientOnboardingStatus.reviewInProgress.description',
            'Our team is carefully reviewing your application. This may take a few minutes.'
          )}
        </p>
      </div>
    </div>
  );
};

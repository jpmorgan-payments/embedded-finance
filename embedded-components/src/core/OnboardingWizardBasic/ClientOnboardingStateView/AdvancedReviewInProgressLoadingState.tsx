import React, { useEffect, useState } from 'react';
import {
  ClockIcon,
  FileCheckIcon,
  FileSearchIcon,
  FileTextIcon,
  ShieldCheckIcon,
  UserCheckIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const STAGE_DURATION_MS = 4000; // 4 seconds per stage
const ICON_STROKE_WIDTH = 1.5; // Consistent stroke width

interface Stage {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  gradient: string;
}

export const AdvancedReviewInProgressLoadingState: React.FC = () => {
  const { t } = useTranslation(['onboarding', 'common']);
  const [currentStage, setCurrentStage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const stages: Stage[] = [
    {
      icon: (
        <UserCheckIcon
          className="eb-h-8 eb-w-8 eb-text-gray-700"
          strokeWidth={ICON_STROKE_WIDTH}
        />
      ),
      title: t(
        'clientOnboardingStatus.reviewStages.customerIdentification',
        'Customer Identification'
      ),
      description: t(
        'clientOnboardingStatus.reviewStages.customerIdentificationDesc',
        'Verifying identity through government-issued documents and business registration'
      ),
      color: 'eb-bg-gray-100 eb-text-gray-900',
      gradient: 'eb-from-gray-50 eb-to-gray-200',
    },
    {
      icon: (
        <FileSearchIcon
          className="eb-h-8 eb-w-8 eb-text-gray-700"
          strokeWidth={ICON_STROKE_WIDTH}
        />
      ),
      title: t(
        'clientOnboardingStatus.reviewStages.dueDiligence',
        'Due Diligence Review'
      ),
      description: t(
        'clientOnboardingStatus.reviewStages.dueDiligenceDesc',
        'Assessing business structure, ownership, and risk profile'
      ),
      color: 'eb-bg-gray-100 eb-text-gray-900',
      gradient: 'eb-from-gray-50 eb-to-gray-200',
    },
    {
      icon: (
        <FileTextIcon
          className="eb-h-8 eb-w-8 eb-text-gray-700"
          strokeWidth={ICON_STROKE_WIDTH}
        />
      ),
      title: t(
        'clientOnboardingStatus.reviewStages.documentVerification',
        'Document Verification'
      ),
      description: t(
        'clientOnboardingStatus.reviewStages.documentVerificationDesc',
        'Authenticating submitted documentation and proof of business'
      ),
      color: 'eb-bg-gray-100 eb-text-gray-900',
      gradient: 'eb-from-gray-50 eb-to-gray-200',
    },
    {
      icon: (
        <ShieldCheckIcon
          className="eb-h-8 eb-w-8 eb-text-gray-700"
          strokeWidth={ICON_STROKE_WIDTH}
        />
      ),
      title: t(
        'clientOnboardingStatus.reviewStages.riskAssessment',
        'Risk Assessment'
      ),
      description: t(
        'clientOnboardingStatus.reviewStages.riskAssessmentDesc',
        'Evaluating risk factors and determining appropriate risk level'
      ),
      color: 'eb-bg-gray-100 eb-text-gray-900',
      gradient: 'eb-from-gray-50 eb-to-gray-200',
    },
    {
      icon: (
        <FileCheckIcon
          className="eb-h-8 eb-w-8 eb-text-gray-700"
          strokeWidth={ICON_STROKE_WIDTH}
        />
      ),
      title: t(
        'clientOnboardingStatus.reviewStages.complianceVerification',
        'Compliance Verification'
      ),
      description: t(
        'clientOnboardingStatus.reviewStages.complianceVerificationDesc',
        'Final regulatory compliance check and sanctions screening'
      ),
      color: 'eb-bg-gray-100 eb-text-gray-900',
      gradient: 'eb-from-gray-50 eb-to-gray-200',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStage((prev) => (prev + 1) % stages.length);
        setIsTransitioning(false);
      }, 500);
    }, STAGE_DURATION_MS);

    return () => clearInterval(timer);
  }, []);

  const currentStageData = stages[currentStage];

  return (
    <div className="eb-flex eb-flex-col eb-items-center eb-justify-center eb-space-y-8 eb-p-8">
      {/* Progress bar */}
      <div className="eb-relative eb-h-1 eb-w-full eb-max-w-md eb-overflow-hidden eb-rounded-full eb-bg-gray-100">
        <div
          className="eb-absolute eb-inset-y-0 eb-left-0 eb-h-full eb-bg-gray-700 eb-transition-all eb-duration-500"
          style={{
            width: `${((currentStage + 1) / stages.length) * 100}%`,
          }}
        />
      </div>

      {/* Stage indicator */}
      <div className="eb-flex eb-space-x-2">
        {stages.map((_, index) => (
          <div
            key={index}
            className={`eb-h-2 eb-w-2 eb-rounded-full eb-transition-all eb-duration-300 ${
              index === currentStage
                ? 'eb-scale-125 eb-bg-gray-900'
                : index < currentStage
                  ? 'eb-bg-gray-600'
                  : 'eb-bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Stage content with transition */}
      <div
        className={`eb-flex eb-max-w-md eb-flex-col eb-items-center eb-transition-all eb-duration-500 ${
          isTransitioning
            ? 'eb-translate-y-4 eb-opacity-0'
            : 'eb-translate-y-0 eb-opacity-100'
        }`}
      >
        {/* Icon container - simplified and centered */}
        <div className="eb-mb-6 eb-flex eb-justify-center">
          <div className="eb-relative eb-flex eb-h-20 eb-w-20 eb-items-center eb-justify-center eb-rounded-full eb-bg-gray-100 eb-shadow-lg">
            {currentStageData.icon}
          </div>
        </div>

        {/* Stage text - now properly aligned under the icon */}
        <div className="eb-text-center">
          <h3 className="eb-mb-2 eb-text-xl eb-font-semibold eb-tracking-tight eb-text-gray-900">
            {currentStageData.title}
          </h3>
          <p className="eb-text-sm eb-leading-relaxed eb-text-gray-600">
            {currentStageData.description}
          </p>
        </div>
      </div>

      {/* Overall status */}
      <div className="eb-flex eb-items-center eb-justify-center eb-space-x-2 eb-text-sm eb-font-medium eb-text-gray-500">
        <ClockIcon
          className="eb-h-4 eb-w-4 eb-text-gray-500"
          strokeWidth={ICON_STROKE_WIDTH}
        />
        <span>
          {t(
            'clientOnboardingStatus.reviewInProgress.processing',
            'Processing...'
          )}
        </span>
      </div>
    </div>
  );
};

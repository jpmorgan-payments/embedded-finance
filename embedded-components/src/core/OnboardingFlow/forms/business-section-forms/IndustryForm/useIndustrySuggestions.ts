import { useEffect, useState } from 'react';

import {
  SmbdoGetRecommendationsMutationError,
  useSmbdoGetRecommendations,
} from '@/api/generated/smbdo';
import { SmbdoGetRecommendationsBodyResourceType } from '@/api/generated/smbdo.schemas';

/**
 * Type for industry recommendations returned by the API
 */
export interface IndustryRecommendation {
  naicsCode: string;
  naicsDescription: string;
}

/**
 * Hook that provides AI-based industry suggestion functionality
 * @param description - The business description to generate recommendations for
 * @returns Object containing industry suggestion functionality and state
 */
export const useIndustrySuggestions = (description: string) => {
  // Feature flag management
  const [isFeatureFlagEnabled, setIsFeatureFlagEnabled] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<
    IndustryRecommendation[]
  >([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showEmptyRecommendationWarning, setShowEmptyRecommendationWarning] =
    useState(false);
  const [showRecommendationErrorWarning, setShowRecommendationErrorWarning] =
    useState(false);
  const [recommendationErrorMessage, setRecommendationErrorMessage] = useState<
    string | null
  >(null);

  // Use the API mutation hook
  const { mutate: getRecommendations, isPending } =
    useSmbdoGetRecommendations();

  // Check for feature flag in localStorage
  useEffect(() => {
    const featureFlag = localStorage.getItem('NAICS_SUGGESTION_FEATURE_FLAG');
    setIsFeatureFlagEnabled(featureFlag === 'true');
  }, []);

  /**
   * Request industry recommendations based on the description
   */
  const handleSuggest = () => {
    if (!description) return;

    // Reset warnings when user tries again
    setShowEmptyRecommendationWarning(false);
    setShowRecommendationErrorWarning(false);
    setRecommendationErrorMessage(null);

    const values = [
      {
        key: 'organizationDescription',
        value: description,
      },
    ];

    getRecommendations(
      {
        data: {
          resourceType: SmbdoGetRecommendationsBodyResourceType.NAICS_CODE,
          values,
        },
      },
      {
        onSuccess: (data) => {
          if (data.resource?.length) {
            setRecommendations(data.resource);
            setShowRecommendations(true);
            setShowEmptyRecommendationWarning(false);
            setShowRecommendationErrorWarning(false);
            setRecommendationErrorMessage(null);
          } else {
            setRecommendations([]);
            setShowRecommendations(false);
            setShowEmptyRecommendationWarning(true);
            setShowRecommendationErrorWarning(false);
            setRecommendationErrorMessage(null);
          }
        },
        onError: (error: SmbdoGetRecommendationsMutationError) => {
          // Hide recommendations and show an error-style warning
          setShowRecommendations(false);
          setShowEmptyRecommendationWarning(false);
          setShowRecommendationErrorWarning(true);
          setRecommendations([]);
          const apiError = error?.response?.data as
            | {
                title?: string;
                context?: Array<{ message?: string }>;
                httpStatus?: number;
              }
            | undefined;
          const contextMessage = apiError?.context?.[0]?.message;
          const titleMessage = apiError?.title;
          setRecommendationErrorMessage(
            contextMessage ||
              titleMessage ||
              'We could not process your request.'
          );
        },
      }
    );
  };

  return {
    isFeatureFlagEnabled,
    recommendations,
    showRecommendations,
    showEmptyRecommendationWarning,
    showRecommendationErrorWarning,
    recommendationErrorMessage,
    isPending,
    handleSuggest,
    setShowRecommendations,
  };
};

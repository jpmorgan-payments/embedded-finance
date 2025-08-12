import { useState, useEffect } from 'react';
import { useSmbdoGetRecommendations } from '@/api/generated/smbdo';
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
  const [recommendations, setRecommendations] = useState<IndustryRecommendation[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showEmptyRecommendationWarning, setShowEmptyRecommendationWarning] = useState(false);
  
  // Use the API mutation hook
  const { mutate: getRecommendations, isPending } = useSmbdoGetRecommendations();

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
          } else {
            setRecommendations([]);
            setShowRecommendations(false);
            setShowEmptyRecommendationWarning(true);
          }
        },
        onError: () => {
          // Hide recommendations and don't show the empty warning on error
          setShowRecommendations(false);
          setShowEmptyRecommendationWarning(false);
          setRecommendations([]);
        },
      }
    );
  };

  return {
    isFeatureFlagEnabled,
    recommendations,
    showRecommendations,
    showEmptyRecommendationWarning,
    isPending,
    handleSuggest,
    setShowRecommendations,
  };
};

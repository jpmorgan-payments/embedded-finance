import digitalOnboardingRecipe from '@ef-docs/DIGITAL_ONBOARDING_RECIPE.md?raw';

import { EmbeddedDocStory } from '@/components/embedded-doc-story';

export default function DigitalOnboardingRecipeArticle() {
  return (
    <EmbeddedDocStory
      markdown={digitalOnboardingRecipe}
      docPath="DIGITAL_ONBOARDING_RECIPE.md"
    />
  );
}

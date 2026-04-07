import hostedOnboardingGuide from '@ef-docs/partially-hosted/PARTIALLY_HOSTED_UI_INTERGRATION_GUIDE.md?raw';

import { EmbeddedDocStory } from '@/components/embedded-doc-story';

export default function PartiallyHostedOnboardingArticle() {
  return (
    <EmbeddedDocStory
      markdown={hostedOnboardingGuide}
      docPath="partially-hosted/PARTIALLY_HOSTED_UI_INTERGRATION_GUIDE.md"
    />
  );
}

import { EmbeddedDocStory } from '@/components/embedded-doc-story';

import hostedOnboardingGuide from '@ef-docs/partially-hosted/PARTIALLY_HOSTED_UI_INTERGRATION_GUIDE.md?raw';

export default function PartiallyHostedOnboardingArticle() {
  return (
    <EmbeddedDocStory
      markdown={hostedOnboardingGuide}
      docPath="partially-hosted/PARTIALLY_HOSTED_UI_INTERGRATION_GUIDE.md"
    />
  );
}

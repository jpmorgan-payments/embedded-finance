import { EmbeddedDocStory } from '@/components/embedded-doc-story';

import webhookRecipe from '@ef-docs/WEBHOOK_INTEGRATION_RECIPE.md?raw';

export default function WebhookIntegrationRecipeArticle() {
  return (
    <EmbeddedDocStory
      markdown={webhookRecipe}
      docPath="WEBHOOK_INTEGRATION_RECIPE.md"
    />
  );
}

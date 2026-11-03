import clientMaintenanceRecipe from '@ef-docs/APPROVED_CLIENT_MAINTENANCE_RECIPE.md?raw';

import { EmbeddedDocStory } from '@/components/embedded-doc-story';

export default function ApprovedClientMaintenanceRecipeArticle() {
  return (
    <EmbeddedDocStory
      markdown={clientMaintenanceRecipe}
      docPath="APPROVED_CLIENT_MAINTENANCE_RECIPE.md"
    />
  );
}

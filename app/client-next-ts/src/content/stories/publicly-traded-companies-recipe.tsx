import ptcRecipe from '@ef-docs/PUBLICLY_TRADED_COMPANIES_RECIPE.md?raw';

import { EmbeddedDocStory } from '@/components/embedded-doc-story';

export default function PubliclyTradedCompaniesRecipeArticle() {
  return (
    <EmbeddedDocStory
      markdown={ptcRecipe}
      docPath="PUBLICLY_TRADED_COMPANIES_RECIPE.md"
    />
  );
}

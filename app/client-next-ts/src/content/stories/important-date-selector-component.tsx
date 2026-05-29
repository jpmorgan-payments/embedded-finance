import importantDateRecipe from '@ef-docs/IMPORTANT_DATE_SELECTOR_RECIPE.md?raw';

import { EmbeddedDocStory } from '@/components/embedded-doc-story';

export default function ImportantDateSelectorRecipeArticle() {
  return (
    <EmbeddedDocStory
      markdown={importantDateRecipe}
      docPath="IMPORTANT_DATE_SELECTOR_RECIPE.md"
    />
  );
}

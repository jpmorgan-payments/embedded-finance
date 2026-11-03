import listTransactionsRecipe from '@ef-docs/LIST_TRANSACTIONS_RECIPE.md?raw';

import { EmbeddedDocStory } from '@/components/embedded-doc-story';

export default function ListTransactionsRecipeArticle() {
  return (
    <EmbeddedDocStory
      markdown={listTransactionsRecipe}
      docPath="LIST_TRANSACTIONS_RECIPE.md"
    />
  );
}

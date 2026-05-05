import dateParsingGuide from '@ef-docs/DATE_PARSING_GUIDE.md?raw';
import importantDateRecipe from '@ef-docs/IMPORTANT_DATE_SELECTOR_RECIPE.md?raw';
import hostedOnboardingGuide from '@ef-docs/partially-hosted/PARTIALLY_HOSTED_UI_INTERGRATION_GUIDE.md?raw';
import webhookRecipe from '@ef-docs/WEBHOOK_INTEGRATION_RECIPE.md?raw';

import { CORE_COMPONENT_FUNCTIONAL_REQUIREMENTS } from '@/lib/core-functional-requirements-data';
import {
  embeddedComponentsCoreBlob,
  embeddedComponentsDocBlob,
} from '@/lib/embedded-docs-github';

const EMBEDDED_COMPONENTS_README_BLOB =
  'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/README.md';

export function buildCoreFunctionalRequirementsMarkdown(): string {
  const lines: string[] = [
    '# Core functional requirements — cross-reference',
    '',
    'Canonical GitHub markdown files under `embedded-components/src/core/` (default branch):',
    '',
  ];

  for (const entry of CORE_COMPONENT_FUNCTIONAL_REQUIREMENTS) {
    lines.push(`## ${entry.title}`, '', entry.description, '');
    for (const doc of entry.docs) {
      const path = `${entry.folder}/${doc.file}`;
      lines.push(
        `- [${doc.label ?? doc.file}](${embeddedComponentsCoreBlob(path)})`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

export interface StoryRecipeLlmSource {
  githubViewUrl: string;
  getMarkdownCopy: () => string;
}

export const STORY_LLM_SOURCES = {
  'core-functional-requirements-index': {
    githubViewUrl: EMBEDDED_COMPONENTS_README_BLOB,
    getMarkdownCopy: buildCoreFunctionalRequirementsMarkdown,
  },
  'partially-hosted-onboarding': {
    githubViewUrl: embeddedComponentsDocBlob(
      'partially-hosted/PARTIALLY_HOSTED_UI_INTERGRATION_GUIDE.md'
    ),
    getMarkdownCopy: () => hostedOnboardingGuide,
  },
  'webhook-integration-recipe': {
    githubViewUrl: embeddedComponentsDocBlob('WEBHOOK_INTEGRATION_RECIPE.md'),
    getMarkdownCopy: () => webhookRecipe,
  },
  'important-date-selector-component': {
    githubViewUrl: embeddedComponentsDocBlob(
      'IMPORTANT_DATE_SELECTOR_RECIPE.md'
    ),
    getMarkdownCopy: () => importantDateRecipe,
  },
  'date-selector-challenges': {
    githubViewUrl: embeddedComponentsDocBlob('DATE_PARSING_GUIDE.md'),
    getMarkdownCopy: () => dateParsingGuide,
  },
} as const satisfies Record<string, StoryRecipeLlmSource>;

export type StoryRecipeIdWithLlm = keyof typeof STORY_LLM_SOURCES;

export function storyHasLlmSource(
  storyId: string
): storyId is StoryRecipeIdWithLlm {
  return storyId in STORY_LLM_SOURCES;
}

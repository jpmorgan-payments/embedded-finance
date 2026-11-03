import clientMaintenanceRecipe from '@ef-docs/APPROVED_CLIENT_MAINTENANCE_RECIPE.md?raw';
import fxPayoutClientRecipe from '@ef-docs/CROSS_BORDER_FX_PAYOUT_CLIENT_RECIPE.md?raw';
import dateParsingGuide from '@ef-docs/DATE_PARSING_GUIDE.md?raw';
import digitalOnboardingRecipe from '@ef-docs/DIGITAL_ONBOARDING_RECIPE.md?raw';
import importantDateRecipe from '@ef-docs/IMPORTANT_DATE_SELECTOR_RECIPE.md?raw';
import listTransactionsRecipe from '@ef-docs/LIST_TRANSACTIONS_RECIPE.md?raw';
import hostedOnboardingGuide from '@ef-docs/partially-hosted/PARTIALLY_HOSTED_UI_INTEGRATION_GUIDE.md?raw';
import ptcRecipe from '@ef-docs/PUBLICLY_TRADED_COMPANIES_RECIPE.md?raw';
import uxAtlas from '@ef-docs/UX_ATLAS.md?raw';
import webhookRecipe from '@ef-docs/WEBHOOK_INTEGRATION_RECIPE.md?raw';

import { CORE_COMPONENT_FUNCTIONAL_REQUIREMENTS } from '@/lib/core-functional-requirements-data';
import {
  embeddedComponentsCoreBlob,
  embeddedComponentsDocBlob,
} from '@/lib/embedded-docs-github';
import type { StoryId } from '@/lib/stories-catalog';

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
  'ux-atlas': {
    githubViewUrl: embeddedComponentsDocBlob('UX_ATLAS.md'),
    getMarkdownCopy: () => uxAtlas,
  },
  'publicly-traded-companies-recipe': {
    githubViewUrl: embeddedComponentsDocBlob(
      'PUBLICLY_TRADED_COMPANIES_RECIPE.md'
    ),
    getMarkdownCopy: () => ptcRecipe,
  },
  'approved-client-maintenance-recipe': {
    githubViewUrl: embeddedComponentsDocBlob(
      'APPROVED_CLIENT_MAINTENANCE_RECIPE.md'
    ),
    getMarkdownCopy: () => clientMaintenanceRecipe,
  },
  'list-transactions-recipe': {
    githubViewUrl: embeddedComponentsDocBlob('LIST_TRANSACTIONS_RECIPE.md'),
    getMarkdownCopy: () => listTransactionsRecipe,
  },
  'digital-onboarding-recipe': {
    githubViewUrl: embeddedComponentsDocBlob('DIGITAL_ONBOARDING_RECIPE.md'),
    getMarkdownCopy: () => digitalOnboardingRecipe,
  },
  'core-functional-requirements-index': {
    githubViewUrl: EMBEDDED_COMPONENTS_README_BLOB,
    getMarkdownCopy: buildCoreFunctionalRequirementsMarkdown,
  },
  'cross-border-fx-payout-client-recipe': {
    githubViewUrl: embeddedComponentsDocBlob(
      'CROSS_BORDER_FX_PAYOUT_CLIENT_RECIPE.md'
    ),
    getMarkdownCopy: () => fxPayoutClientRecipe,
  },
  'partially-hosted-onboarding': {
    githubViewUrl: embeddedComponentsDocBlob(
      'partially-hosted/PARTIALLY_HOSTED_UI_INTEGRATION_GUIDE.md'
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
} as const satisfies Record<StoryId, StoryRecipeLlmSource>;

export type StoryRecipeIdWithLlm = keyof typeof STORY_LLM_SOURCES;

export function storyHasLlmSource(
  storyId: string
): storyId is StoryRecipeIdWithLlm {
  return storyId in STORY_LLM_SOURCES;
}

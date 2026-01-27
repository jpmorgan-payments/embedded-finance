import { RichMarkdownViewer } from '@/components/rich-markdown-viewer';

const rawGhUrl =
  'https://raw.githubusercontent.com/jpmorgan-payments/embedded-finance/main/embedded-components/docs/WEBHOOK_INTEGRATION_RECIPE.md';
const githubBlobUrl =
  'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/WEBHOOK_INTEGRATION_RECIPE.md';
const sourceLink = {
  href: githubBlobUrl,
  label: 'WEBHOOK_INTEGRATION_RECIPE.md',
};

export default function WebhookIntegrationRecipeArticle() {
  return (
    <div>
      <p className="mb-6 rounded border border-sp-border bg-sp-accent px-4 py-3 text-page-small text-jpm-gray">
        This is a rendered version of the{' '}
        <a
          href={githubBlobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-sp-brand underline"
        >
          GitHub document
        </a>
        .
      </p>
      <RichMarkdownViewer
        sourceUrl={rawGhUrl}
        sourceLink={sourceLink}
        skipTopHeading
      />
    </div>
  );
}

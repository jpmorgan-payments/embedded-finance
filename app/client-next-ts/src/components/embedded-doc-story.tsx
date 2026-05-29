import { RichMarkdownViewer } from '@/components/rich-markdown-viewer';
import { embeddedComponentsDocBlob } from '@/lib/embedded-docs-github';

export interface EmbeddedDocStoryProps {
  /** Bundled markdown (Vite `?raw`). */
  markdown: string;
  /** Path under `embedded-components/docs/`, e.g. `WEBHOOK_INTEGRATION_RECIPE.md`. */
  docPath: string;
  /** Omit duplicate H1 when the route already shows the title in the page header. */
  skipTopHeading?: boolean;
}

/**
 * Renders bundled markdown from `embedded-components/docs/`.
 */
export function EmbeddedDocStory({
  markdown,
  docPath,
  skipTopHeading = true,
}: EmbeddedDocStoryProps) {
  const href = embeddedComponentsDocBlob(docPath);
  return (
    <RichMarkdownViewer
      content={markdown}
      sourceLink={{ href, label: docPath }}
      skipTopHeading={skipTopHeading}
    />
  );
}

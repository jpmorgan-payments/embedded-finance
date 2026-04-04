/** GitHub blob URL for files under `embedded-components/docs/` on the default branch. */
export const EMBEDDED_COMPONENTS_DOCS_BLOB_BASE =
  'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs';

export function embeddedComponentsDocBlob(relativePath: string): string {
  const trimmed = relativePath.replace(/^\/+/, '');
  return `${EMBEDDED_COMPONENTS_DOCS_BLOB_BASE}/${trimmed}`;
}

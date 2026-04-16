/** GitHub blob URL for files under `embedded-components/docs/` on the default branch. */
export const EMBEDDED_COMPONENTS_DOCS_BLOB_BASE =
  'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs';

export function embeddedComponentsDocBlob(relativePath: string): string {
  const trimmed = relativePath.replace(/^\/+/, '');
  return `${EMBEDDED_COMPONENTS_DOCS_BLOB_BASE}/${trimmed}`;
}

/** GitHub blob URL for files under `embedded-components/src/core/` on the default branch. */
export const EMBEDDED_COMPONENTS_CORE_BLOB_BASE =
  'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/src/core';

export function embeddedComponentsCoreBlob(relativePath: string): string {
  const trimmed = relativePath.replace(/^\/+/, '');
  return `${EMBEDDED_COMPONENTS_CORE_BLOB_BASE}/${trimmed}`;
}

/** GitHub tree URL for folders under `embedded-components/src/core/` on the default branch. */
export const EMBEDDED_COMPONENTS_CORE_TREE_BASE =
  'https://github.com/jpmorgan-payments/embedded-finance/tree/main/embedded-components/src/core';

export function embeddedComponentsCoreTree(relativeFolderPath: string): string {
  const trimmed = relativeFolderPath.replace(/^\/+/, '').replace(/\/+$/, '');
  return trimmed
    ? `${EMBEDDED_COMPONENTS_CORE_TREE_BASE}/${trimmed}`
    : EMBEDDED_COMPONENTS_CORE_TREE_BASE;
}

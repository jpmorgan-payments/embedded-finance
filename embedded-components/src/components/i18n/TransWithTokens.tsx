import { Trans } from 'react-i18next';

import { useContentTokens } from '@/core/EBComponentsProvider';

/**
 * A wrapper around react-i18next's Trans component that adds token ID annotations
 * when showTokenIds is enabled.
 *
 * @example
 * ```tsx
 * <TransWithTokens
 *   ns="owners"
 *   i18nKey="description"
 *   defaults="You can add up to <bold>{{max}}</bold> owners"
 *   values={{ max: 4 }}
 *   components={{ bold: <strong /> }}
 * />
 * ```
 */
export function TransWithTokens({
  i18nKey,
  ns,
  values,
  components,
  defaults,
  children,
}: {
  i18nKey: string;
  ns?: string;
  values?: Record<string, unknown>;
  components?: Record<string, React.ReactElement>;
  defaults?: string;
  children?: React.ReactNode;
}) {
  const contentTokensConfig = useContentTokens();
  const showTokenIds = contentTokensConfig?.showTokenIds ?? false;

  // Build the token ID from namespace and key
  const tokenId = ns ? `${ns}:${i18nKey}` : i18nKey;

  // Cast to any to avoid complex type inference issues with react-i18next
  const transProps = {
    i18nKey,
    ns,
    values,
    components,
    defaults,
    children,
  } as any;

  if (!showTokenIds) {
    return <Trans {...transProps} />;
  }

  return (
    <span data-content-token={tokenId} className="eb-contents">
      <Trans {...transProps} />
    </span>
  );
}

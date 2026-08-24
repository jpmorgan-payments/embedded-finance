import { type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { useContentTokens } from '@/core/EBComponentsProvider';

const richTextComponents: Record<string, ReactElement> = {
  p: <p className="eb-leading-relaxed" />,
  br: <br />,
  strong: <strong />,
  b: <strong />,
  em: <em />,
  i: <em />,
  ul: <ul className="eb-my-2 eb-list-disc eb-pl-5" />,
  ol: <ol className="eb-my-2 eb-list-decimal eb-pl-5" />,
  li: <li className="eb-mt-1" />,
};

const richTextTagPattern = /<\/?(?:p|br|strong|b|em|i|ul|ol|li)\s*\/?>/;

export const hasRichTextMarkup = (content: string) =>
  richTextTagPattern.test(content);

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
  count,
  context,
  children,
}: {
  i18nKey: string;
  ns?: string;
  values?: Record<string, unknown>;
  components?: Record<string, ReactElement>;
  defaults?: string;
  count?: number;
  context?: string;
  children?: ReactNode;
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
    components: { ...richTextComponents, ...components },
    defaults,
    count,
    context,
    children,
  } as unknown as ComponentProps<typeof Trans>;

  if (!showTokenIds) {
    return <Trans {...transProps} />;
  }

  return (
    <span data-content-token={tokenId} className="eb-contents">
      <Trans {...transProps} />
    </span>
  );
}

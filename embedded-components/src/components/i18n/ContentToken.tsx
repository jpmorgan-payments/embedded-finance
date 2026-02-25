import { createElement, FC, PropsWithChildren } from 'react';

import { useContentTokens } from '@/core/EBComponentsProvider';

export interface ContentTokenProps {
  /**
   * The full token ID in format "namespace:key.path"
   * e.g., "recipients:status.labels.ACTIVE"
   */
  tokenId: string;
  /**
   * HTML element to render. Defaults to 'span'.
   */
  as?: keyof JSX.IntrinsicElements;
  /**
   * Additional className for styling
   */
  className?: string;
}

/**
 * Wrapper component that adds data-content-token attributes for token discoverability.
 *
 * When `showTokenIds` is enabled in EBComponentsProvider's contentTokens config,
 * this component will display the token ID in the title attribute (visible on hover).
 *
 * @example
 * ```tsx
 * const { t } = useTranslation('recipients');
 *
 * <ContentToken tokenId="recipients:status.labels.ACTIVE">
 *   {t('status.labels.ACTIVE')}
 * </ContentToken>
 * ```
 *
 * Users can enable CSS debug mode with:
 * ```css
 * [data-content-token]::after {
 *   content: " [" attr(data-content-token) "]";
 *   font-size: 10px;
 *   color: #666;
 *   background: #ffeb3b;
 *   padding: 2px 4px;
 *   border-radius: 2px;
 * }
 * ```
 */
export const ContentToken: FC<PropsWithChildren<ContentTokenProps>> = ({
  tokenId,
  as = 'span',
  className,
  children,
}) => {
  const contentTokensConfig = useContentTokens();
  const showTokenIds = contentTokensConfig?.showTokenIds ?? false;

  return createElement(
    as,
    {
      'data-content-token': tokenId,
      title: showTokenIds ? `Token: ${tokenId}` : undefined,
      className,
    },
    children
  );
};

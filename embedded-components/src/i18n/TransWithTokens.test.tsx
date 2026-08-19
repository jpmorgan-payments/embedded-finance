import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { TransWithTokens } from './TransWithTokens';

function renderTranslation(
  defaults: string,
  options: {
    components?: Record<string, React.ReactElement>;
    showTokenIds?: boolean;
  } = {}
) {
  return render(
    <EBComponentsProvider
      apiBaseUrl=""
      contentTokens={{ showTokenIds: options.showTokenIds }}
    >
      <TransWithTokens
        ns="common"
        i18nKey="test.richContent"
        defaults={defaults}
        components={options.components}
      />
    </EBComponentsProvider>
  );
}

describe('TransWithTokens', () => {
  it('renders the supported structured content elements', () => {
    const { container } = renderTranslation(
      '<p>Before you continue:<br/><strong>Required</strong></p><ul><li>First item</li></ul><ol><li><em>Second item</em></li></ol>'
    );

    expect(container.querySelector('p')).toHaveTextContent(
      'Before you continue:Required'
    );
    expect(container.querySelector('br')).toBeInTheDocument();
    expect(container.querySelector('strong')).toHaveTextContent('Required');
    expect(container.querySelector('ul > li')).toHaveTextContent('First item');
    expect(container.querySelector('ol > li > em')).toHaveTextContent(
      'Second item'
    );
  });

  it('keeps unsupported markup inert', () => {
    const { container } = renderTranslation(
      'Safe<script>alert("unsafe")</script>content'
    );

    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('Safe');
    expect(container).toHaveTextContent('content');
  });

  it('allows callers to override a default component', () => {
    renderTranslation('<strong>Important</strong>', {
      components: { strong: <mark data-testid="custom-strong" /> },
    });

    expect(screen.getByTestId('custom-strong')).toHaveTextContent('Important');
  });

  it('annotates structured content when token IDs are enabled', () => {
    const { container } = renderTranslation('<ul><li>Item</li></ul>', {
      showTokenIds: true,
    });

    expect(
      container.querySelector('[data-content-token="common:test.richContent"]')
    ).toBeInTheDocument();
    expect(container.querySelector('ul > li')).toHaveTextContent('Item');
  });
});

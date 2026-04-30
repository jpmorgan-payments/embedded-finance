import { describe, expect, test } from 'vitest';
import { render } from '@test-utils';

import { formatDocumentDescription } from './documentUploadUtils';

describe('formatDocumentDescription', () => {
  test('returns null for empty description', () => {
    expect(formatDocumentDescription(undefined)).toBeNull();
    expect(formatDocumentDescription('')).toBeNull();
  });

  test('renders OR segments with Acceptable documents copy when present', () => {
    const desc =
      '1. Formation Document\nAcceptable documents are\nArticles [OR] Certificate';
    const { container } = render(<div>{formatDocumentDescription(desc)}</div>);
    expect(container.textContent).toContain('Acceptable documents are');
    expect(container.textContent).toContain('Articles');
    expect(container.textContent).toContain('Certificate');
  });

  test('handles simple newline-separated sections', () => {
    const { container } = render(
      <div>{formatDocumentDescription('Line one\nLine two')}</div>
    );
    expect(container.textContent).toContain('Line one');
    expect(container.textContent).toContain('Line two');
  });

  test('renders OR segments without "Acceptable documents are" preamble', () => {
    const desc = 'Pick one:\nIntro line [OR] Second choice';
    const { container } = render(<div>{formatDocumentDescription(desc)}</div>);
    expect(container.textContent).toContain('Intro line');
    expect(container.textContent).toContain('Second choice');
  });

  test('renders [AND] clauses as stacked paragraphs', () => {
    const desc = 'Primary requirement [AND] Secondary requirement';
    const { container } = render(<div>{formatDocumentDescription(desc)}</div>);
    expect(container.textContent).toContain('Primary requirement');
    expect(container.textContent).toContain('Secondary requirement');
  });
});

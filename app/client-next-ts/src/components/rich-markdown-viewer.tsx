import { isValidElement, useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components, ExtraProps } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Mermaid } from '@/components/mermaid';

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps;
type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & ExtraProps;
type PreProps = React.HTMLAttributes<HTMLPreElement> & ExtraProps;
type CodeProps = React.HTMLAttributes<HTMLElement> & ExtraProps & { inline?: boolean };
type TableProps = React.HTMLAttributes<HTMLTableElement> & ExtraProps;
type TableSectionProps = React.HTMLAttributes<HTMLTableSectionElement> & ExtraProps;
type TableRowProps = React.HTMLAttributes<HTMLTableRowElement> & ExtraProps;
type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement> & ExtraProps;
type OlProps = React.OlHTMLAttributes<HTMLOListElement> & ExtraProps;
type UlProps = React.HTMLAttributes<HTMLUListElement> & ExtraProps;
type LiProps = React.LiHTMLAttributes<HTMLLIElement> & ExtraProps;

const MERMAID_MARKER = 'data-render-mermaid';

function isMermaidBlock(child: unknown): child is ReactElement<{ [MERMAID_MARKER]: true }> {
  return (
    isValidElement(child) &&
    (child.props as { [MERMAID_MARKER]?: boolean })[MERMAID_MARKER] === true
  );
}

const proseClasses = [
  'prose prose-lg max-w-none rich-markdown-viewer',
  'prose-p:text-jpm-gray prose-p:mb-5 prose-p:leading-relaxed',
  'prose-ul:my-5 prose-ol:my-5 prose-li:my-1.5 prose-li:leading-relaxed',
  'prose-blockquote:my-6 prose-blockquote:border-sp-brand prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:text-jpm-gray prose-blockquote:italic',
  'prose-strong:text-jpm-gray-900 prose-a:text-sp-brand prose-a:underline',
  'prose-code:inline prose-code:rounded prose-code:bg-jpm-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none',
  'prose-pre:bg-jpm-gray-100 prose-pre:text-jpm-gray-900 prose-pre:border prose-pre:border-sp-border prose-pre:font-mono',
  'prose-table:text-jpm-gray prose-th:text-jpm-gray-900 prose-th:bg-jpm-gray-100 prose-td:border prose-td:border-sp-border',
].join(' ');

export interface RichMarkdownViewerProps {
  /** Raw URL to fetch markdown from (e.g. raw GitHub). */
  sourceUrl?: string;
  /** Markdown string when not loading from URL. */
  content?: string;
  /** Optional source link URL + label shown below content (e.g. GitHub blob). */
  sourceLink?: { href: string; label: string };
  /** When true, skip the first top-level heading (avoids duplicating the page title). */
  skipTopHeading?: boolean;
  /** Additional CSS classes for the wrapper. */
  className?: string;
}

export function RichMarkdownViewer({
  sourceUrl,
  content,
  sourceLink,
  skipTopHeading = false,
  className,
}: RichMarkdownViewerProps) {
  const [markdown, setMarkdown] = useState<string | null>(content ?? null);
  const [loading, setLoading] = useState(Boolean(sourceUrl && !content));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceUrl || content != null) {
      if (content != null) setMarkdown(content);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(sourceUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.text();
      })
      .then((text) => {
        if (!cancelled) setMarkdown(text);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sourceUrl, content]);

  const components: Components = useMemo(
    () => ({
      h1: (props: HeadingProps) => (
        <h1
          {...props}
          className={`mt-10 mb-4 text-page-hero font-semibold text-jpm-gray-900 first:mt-0 ${props.className ?? ''}`.trim()}
        />
      ),
      h2: (props: HeadingProps) => (
        <h2
          {...props}
          className={`mt-8 mb-4 text-page-h2 font-semibold text-jpm-gray-900 scroll-mt-6 ${props.className ?? ''}`.trim()}
        />
      ),
      h3: (props: HeadingProps) => (
        <h3
          {...props}
          className={`mt-6 mb-3 text-page-h3 font-semibold text-jpm-gray-900 scroll-mt-6 ${props.className ?? ''}`.trim()}
        />
      ),
      h4: (props: HeadingProps) => (
        <h4
          {...props}
          className={`mt-5 mb-2 text-page-h4 font-semibold text-jpm-gray-900 scroll-mt-6 ${props.className ?? ''}`.trim()}
        />
      ),
      h5: (props: HeadingProps) => (
        <h5
          {...props}
          className={`mt-4 mb-2 text-page-h4 font-semibold text-jpm-gray-900 ${props.className ?? ''}`.trim()}
        />
      ),
      h6: (props: HeadingProps) => (
        <h6
          {...props}
          className={`mt-4 mb-1 text-page-body font-semibold text-jpm-gray-900 ${props.className ?? ''}`.trim()}
        />
      ),
      ul: (props: UlProps) => (
        <ul {...props} className="my-5 list-disc space-y-1.5 pl-6 text-jpm-gray [&>li]:leading-relaxed" />
      ),
      ol: (props: OlProps) => (
        <ol {...props} className="my-5 list-decimal space-y-1.5 pl-6 text-jpm-gray [&>li]:leading-relaxed" />
      ),
      li: (props: LiProps) => <li {...props} className="pl-1 text-jpm-gray" />,
      a: (props: AnchorProps) => {
        const { href, children } = props;
        return (
          <a
            href={href ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="break-words text-sp-brand underline"
          >
            {children}
          </a>
        );
      },
      table: (props: TableProps) => (
        <div className="my-6 overflow-x-auto rounded border border-sp-border">
          <table {...props} className="min-w-full border-collapse text-jpm-gray" />
        </div>
      ),
      thead: (props: TableSectionProps) => <thead {...props} className="bg-jpm-gray-100" />,
      tbody: (props: TableSectionProps) => <tbody {...props} />,
      tr: (props: TableRowProps) => <tr {...props} className="border-b border-sp-border last:border-b-0" />,
      th: (props: TableCellProps) => <th {...props} className="px-4 py-3 text-left text-sm font-semibold text-jpm-gray-900" />,
      td: (props: TableCellProps) => <td {...props} className="px-4 py-3 text-sm text-jpm-gray" />,
      pre: (props: PreProps) => {
        const child = Array.isArray(props.children) ? props.children[0] : props.children;
        if (isMermaidBlock(child)) return child;
        return <pre className="my-5 overflow-x-auto rounded border border-sp-border bg-jpm-gray-100 px-4 py-3 font-mono text-sm text-jpm-gray-900">{props.children}</pre>;
      },
      code: (props: CodeProps) => {
        const { inline, className: codeClassName, children, ...rest } = props;
        if (inline) {
          return (
            <code
              className="inline rounded bg-jpm-gray-100 px-1.5 py-0.5 font-mono text-sm text-jpm-gray-900 before:content-none after:content-none"
              {...rest}
            >
              {children}
            </code>
          );
        }
        const isMermaid = /\blanguage-mermaid\b/.test(codeClassName ?? '');
        if (isMermaid) {
          return (
            <div {...{ [MERMAID_MARKER]: true }} className="my-6 overflow-x-auto [&_svg]:max-w-full">
              <Mermaid className="w-full overflow-hidden [&_svg]:h-auto [&_svg]:w-full">
                {String(children).replace(/\n$/, '')}
              </Mermaid>
            </div>
          );
        }
        return <code className="block overflow-x-auto whitespace-pre bg-transparent px-0 py-0 font-mono text-sm text-jpm-gray-900" {...rest}>{children}</code>;
      },
    }),
    []
  );

  if (loading) {
    return (
      <div
        className={proseClasses}
        aria-busy
        role="status"
        aria-label="Loading content"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-3/4 rounded bg-jpm-gray-200" />
          <div className="h-4 rounded bg-jpm-gray-200" />
          <div className="h-4 rounded bg-jpm-gray-200" />
          <div className="h-4 w-5/6 rounded bg-jpm-gray-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={proseClasses}>
        <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          Failed to load content: {error}
        </p>
        {sourceUrl && (
          <p className="mt-4">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sp-brand underline"
            >
              Open source
            </a>
          </p>
        )}
      </div>
    );
  }

  if (markdown == null) {
    return null;
  }

  const body =
    skipTopHeading && markdown ? markdown.replace(/^\s*# [^\n]+\n?/, '') : markdown;

  return (
    <div className={className}>
      <div className={proseClasses}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {body}
        </ReactMarkdown>
      </div>
      {sourceLink && (
        <p className="mt-8 border-t border-sp-border pt-6 text-page-small text-jpm-gray">
          Source:{' '}
          <a
            href={sourceLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="break-words text-sp-brand underline"
          >
            {sourceLink.label}
          </a>
        </p>
      )}
    </div>
  );
}

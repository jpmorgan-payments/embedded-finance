import type { ReactNode } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

import { cn } from '@/lib/utils';

export interface SlideViewProps {
  step: number;
  autoplay: boolean;
}

export function SlideHeader({
  kicker,
  title,
  lead,
}: {
  kicker: string;
  title: string;
  lead?: ReactNode;
}) {
  return (
    <header className="mb-8 shrink-0">
      <p className="text-[17px] font-bold uppercase tracking-[0.18em] text-ph-brand">
        {kicker}
      </p>
      <h2 className="ph-heading mt-2 text-[50px] font-bold leading-[1.1] text-ph-ink">
        {title}
      </h2>
      {lead ? (
        <p className="mt-3 max-w-[1240px] text-[24px] leading-[1.45] text-ph-muted">
          {lead}
        </p>
      ) : null}
    </header>
  );
}

/** Keeps layout stable: hidden builds stay in place, invisible to sighted and AT users. */
export function Reveal({
  shown,
  className,
  children,
}: {
  shown: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn('ph-reveal', className)}
      data-shown={shown}
      aria-hidden={!shown}
    >
      {children}
    </div>
  );
}

export function CodePanel({
  code,
  language = 'tsx',
  highlight = [],
  fontSize = 19,
  className,
  label,
}: {
  code: string;
  language?: string;
  highlight?: readonly number[];
  fontSize?: number;
  className?: string;
  label?: string;
}) {
  return (
    <figure className={cn('m-0 flex min-h-0 flex-col', className)}>
      {label ? (
        <figcaption className="mb-2 text-[15px] font-bold uppercase tracking-[0.14em] text-ph-muted">
          {label}
        </figcaption>
      ) : null}
      <Highlight theme={themes.vsDark} code={code} language={language}>
        {({
          className: prismClass,
          style,
          tokens,
          getLineProps,
          getTokenProps,
        }) => (
          <pre
            className={cn(prismClass, 'ph-code min-h-0 flex-1')}
            style={{ ...style, fontSize }}
            data-has-hl={highlight.length > 0}
          >
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line });
              return (
                <span
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  {...lineProps}
                  className={cn(lineProps.className, 'ph-code-line')}
                  data-hl={highlight.includes(i + 1)}
                >
                  {line.map((token, key) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                  {line.length === 1 && line[0].empty ? '\u00a0' : null}
                </span>
              );
            })}
          </pre>
        )}
      </Highlight>
    </figure>
  );
}

export function Pill({
  children,
  tone = 'brand',
  className,
}: {
  children: ReactNode;
  tone?: 'brand' | 'accent' | 'good' | 'bad' | 'warn' | 'neutral';
  className?: string;
}) {
  const tones = {
    brand: 'bg-ph-brand-soft text-ph-brand-strong',
    accent: 'bg-ph-accent-soft text-ph-accent',
    good: 'bg-ph-good-soft text-ph-good',
    bad: 'bg-ph-bad-soft text-ph-bad',
    warn: 'bg-ph-warn-soft text-ph-warn',
    neutral: 'bg-ph-soft text-ph-muted',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[15px] font-bold',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Mono({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md bg-ph-soft px-1.5 py-0.5 font-mono text-[0.9em] text-ph-brand-strong">
      {children}
    </code>
  );
}

/** A tiny browser window used by several slides to frame a mock UI. */
export function BrowserFrame({
  address,
  className,
  children,
}: {
  address: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-2xl border border-ph-border bg-ph-surface shadow-lg',
        className
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-ph-border bg-ph-soft px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ef4444]/70" />
        <span className="h-3 w-3 rounded-full bg-[#f59e0b]/70" />
        <span className="h-3 w-3 rounded-full bg-[#10b981]/70" />
        <span className="ml-3 truncate rounded-md bg-ph-surface px-3 py-0.5 font-mono text-[14px] text-ph-muted">
          {address}
        </span>
      </div>
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  );
}

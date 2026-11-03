import type { ReactNode } from 'react';
import { ArrowUpRight, Lightbulb, Sparkles } from 'lucide-react';

import {
  getSpotlightSections,
  type SpotlightItem,
  type SpotlightKind,
} from '@/data/spotlight-content';
import { cn, formatIsoDate } from '@/lib/utils';

const BRAND_GRADIENT =
  'bg-gradient-to-br from-[rgb(226,110,0)] via-[rgb(177,121,207)] to-[rgb(26,123,153)]';

const KIND_LABELS: Record<SpotlightKind, { label: string; cta: string }> = {
  'client-story': { label: 'Client Story', cta: 'Read story' },
  'thought-leadership': { label: 'Thought Leadership', cta: 'Read article' },
};

function ExternalCardLink({
  item,
  className,
  children,
}: {
  item: SpotlightItem;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sp-brand focus-visible:ring-offset-2',
        className
      )}
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function KindPill({ kind }: { kind: SpotlightKind }) {
  return (
    <span className="rounded-full border border-sp-border bg-sp-accent px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-sp-brand">
      {KIND_LABELS[kind].label}
    </span>
  );
}

function ReadMore({ kind }: { kind: SpotlightKind }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-sp-brand">
      {KIND_LABELS[kind].cta}
      <ArrowUpRight
        className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </span>
  );
}

function FeaturedCard({ item }: { item: SpotlightItem }) {
  return (
    <ExternalCardLink
      item={item}
      className="block overflow-hidden rounded-page-md border border-sp-border bg-jpm-white shadow-page-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <article className="grid md:grid-cols-5">
        <div
          className={cn(
            'relative flex min-h-[12rem] items-center justify-center p-10 md:col-span-2',
            BRAND_GRADIENT
          )}
        >
          <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sp-brand">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Latest
          </span>
          <span
            aria-hidden="true"
            className="text-6xl font-bold tracking-tight text-white drop-shadow-sm sm:text-7xl"
          >
            {item.monogram}
          </span>
        </div>
        <div className="flex flex-col p-6 sm:p-8 md:col-span-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-jpm-gray">
            <KindPill kind={item.kind} />
            <span className="font-semibold text-jpm-gray-900">{item.org}</span>
            <span aria-hidden="true">•</span>
            <time dateTime={item.date}>{formatIsoDate(item.date)}</time>
          </div>
          <h2 className="mt-4 text-2xl font-bold leading-snug text-jpm-gray-900 transition-colors group-hover:text-sp-brand sm:text-3xl">
            {item.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-jpm-gray">
            {item.description}
          </p>
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
            <span className="text-xs text-jpm-gray">{item.publisher}</span>
            <ReadMore kind={item.kind} />
          </div>
        </div>
      </article>
    </ExternalCardLink>
  );
}

function ClientStoryCard({ item }: { item: SpotlightItem }) {
  return (
    <ExternalCardLink
      item={item}
      className="flex h-full flex-col rounded-page-md border border-sp-border bg-jpm-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-sp-brand/50 hover:shadow-md"
    >
      <article className="flex h-full flex-col">
        <div className="mb-4 flex items-center gap-3">
          <span
            aria-hidden="true"
            className={cn(
              'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-page-sm text-lg font-bold tracking-tight text-white shadow-sm',
              BRAND_GRADIENT
            )}
          >
            {item.monogram}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-jpm-gray-900">
              {item.org}
            </p>
            <p className="truncate text-xs text-jpm-gray">{item.publisher}</p>
          </div>
        </div>
        <h3 className="text-lg font-semibold leading-snug text-jpm-gray-900 transition-colors group-hover:text-sp-brand">
          {item.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-jpm-gray">
          {item.description}
        </p>
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
          <time dateTime={item.date} className="text-sm text-jpm-gray">
            {formatIsoDate(item.date, 'short')}
          </time>
          <ReadMore kind={item.kind} />
        </div>
      </article>
    </ExternalCardLink>
  );
}

function ThoughtLeadershipCard({ item }: { item: SpotlightItem }) {
  return (
    <ExternalCardLink
      item={item}
      className="relative flex h-full flex-col overflow-hidden rounded-page-md border border-sp-border bg-jpm-white p-6 pl-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-sp-brand/50 hover:shadow-md sm:p-8 sm:pl-10"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[rgb(226,110,0)] via-[rgb(177,121,207)] to-[rgb(26,123,153)]"
      />
      <article className="flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-jpm-gray">
          <Lightbulb className="h-5 w-5 text-sp-brand" aria-hidden="true" />
          <KindPill kind={item.kind} />
          <time dateTime={item.date}>{formatIsoDate(item.date)}</time>
        </div>
        <h3 className="mt-4 text-xl font-bold leading-snug text-jpm-gray-900 transition-colors group-hover:text-sp-brand">
          {item.title}
        </h3>
        <p className="mt-3 flex-1 text-base italic leading-relaxed text-jpm-gray">
          {item.description}
        </p>
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
          <span className="text-xs text-jpm-gray">{item.publisher}</span>
          <ReadMore kind={item.kind} />
        </div>
      </article>
    </ExternalCardLink>
  );
}

function SectionHeading({
  id,
  title,
  subtitle,
}: {
  id: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6">
      <h2 id={id} className="text-2xl font-bold text-jpm-gray-900 sm:text-3xl">
        {title}
      </h2>
      <p className="mt-1 text-base text-jpm-gray">{subtitle}</p>
    </div>
  );
}

export function SpotlightPage() {
  const { latest, clientStories, thoughtLeadership } = getSpotlightSections();

  return (
    <div className="min-h-screen bg-sp-bg">
      <section className="relative overflow-hidden border-b border-sp-border bg-gradient-to-br from-sp-bg via-sp-accent/30 to-sp-bg py-12 sm:py-16">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[rgb(226,110,0)]/10 via-[rgb(177,121,207)]/10 to-[rgb(26,123,153)]/10"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-sp-border bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sp-brand">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Spotlight
          </p>
          <h1 className="mb-4 text-3xl font-bold leading-tight text-jpm-gray-900 sm:text-4xl lg:text-page-hero">
            Client stories and insights
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-jpm-gray">
            How platforms use J.P. Morgan Embedded Finance, and where embedded
            finance is heading.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6 lg:px-8">
        {latest ? <FeaturedCard item={latest} /> : null}

        {clientStories.length > 0 ? (
          <section aria-labelledby="spotlight-client-stories">
            <SectionHeading
              id="spotlight-client-stories"
              title="Client Stories"
              subtitle="See how clients are using embedded finance."
            />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {clientStories.map((item) => (
                <ClientStoryCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : null}

        {thoughtLeadership.length > 0 ? (
          <section aria-labelledby="spotlight-thought-leadership">
            <SectionHeading
              id="spotlight-thought-leadership"
              title="Thought Leadership"
              subtitle="Perspectives on where embedded finance is heading."
            />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {thoughtLeadership.map((item) => (
                <ThoughtLeadershipCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

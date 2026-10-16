import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ClipboardCopy,
  ExternalLink,
  FileText,
  Link2,
  RotateCcw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  ALTERNATIVES,
  ATLAS_MARKDOWN_URL,
  focusId,
  parseAnswers,
  PDP_EMBEDDED_PAYMENTS_URL,
  resolveFocus,
  RESOURCE_KIND_DESCRIPTIONS,
  RESOURCE_KIND_LABELS,
  RESOURCE_KIND_ORDER,
  serializeAnswers,
  toMarkdown,
  type Answer,
  type AnswersSearch,
  type ProfileId,
} from '@/lib/ux-atlas/atlas';

import { AtlasDetail } from './atlas-detail';
import { RESOURCE_KIND_ICONS, ResourceLink } from './atlas-ui';
import { JourneyMap } from './journey-map';
import { ProfilePanel } from './profile-panel';

export interface UxAtlasSearch extends AnswersSearch {
  focus?: string;
}

type CopyStatus = 'idle' | 'checklist' | 'link' | 'error';

const COPY_MESSAGES: Record<Exclude<CopyStatus, 'idle'>, string> = {
  checklist: 'Checklist copied as Markdown.',
  link: 'Link to these answers copied.',
  error: 'Copy failed. Your browser blocked clipboard access.',
};

const linkPillClass =
  'inline-flex items-center gap-1.5 rounded-full border border-sp-border bg-white px-3 py-1 text-xs font-semibold text-sp-brand shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sp-brand';

export function UxAtlasPage({
  search,
  onSearchChange,
}: {
  search: UxAtlasSearch;
  onSearchChange: (next: UxAtlasSearch) => void;
}) {
  const { yes, no, unsure } = search;
  const answers = useMemo(
    () => parseAnswers({ yes, no, unsure }),
    [yes, no, unsure]
  );
  const focus = useMemo(() => resolveFocus(search.focus), [search.focus]);
  const detailRef = useRef<HTMLElement>(null);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

  useEffect(() => {
    if (copyStatus === 'idle') return;
    const timer = window.setTimeout(() => setCopyStatus('idle'), 3000);
    return () => window.clearTimeout(timer);
  }, [copyStatus]);

  const setAnswer = (id: ProfileId, answer: Answer) =>
    onSearchChange({
      ...serializeAnswers({ ...answers, [id]: answer }),
      focus: search.focus,
    });

  const setFocus = (id: string) => {
    onSearchChange({ ...serializeAnswers(answers), focus: id });
    // Below xl the detail panel sits under the map, so bring it into view.
    if (window.matchMedia?.('(max-width: 1279px)').matches) {
      window.requestAnimationFrame(() =>
        detailRef.current?.scrollIntoView?.({
          behavior: 'smooth',
          block: 'start',
        })
      );
    }
  };

  const copy = async (text: string, status: 'checklist' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(status);
    } catch {
      setCopyStatus('error');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-sp-bg">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-sp-brand">
            Integration guide
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-gray-900">
            Embedded Payments UX Atlas
          </h1>
          <p className="mt-3 text-page-body leading-relaxed text-gray-600">
            Building your own onboarding and link-bank-account screens on the
            Embedded Payments APIs? Profile your platform, walk the journey, and
            jump to the guides, recipes, and live examples for each step.
            Confirm the requirements for your program with your J.P. Morgan
            representative.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                copy(
                  toMarkdown(answers, { shareUrl: window.location.href }),
                  'checklist'
                )
              }
            >
              {copyStatus === 'checklist' ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <ClipboardCopy className="h-4 w-4" aria-hidden />
              )}
              Copy checklist
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 bg-white"
              onClick={() => copy(window.location.href, 'link')}
            >
              {copyStatus === 'link' ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <Link2 className="h-4 w-4" aria-hidden />
              )}
              Copy link
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1.5 text-gray-600"
              onClick={() => onSearchChange({ focus: search.focus })}
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset answers
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={ATLAS_MARKDOWN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkPillClass}
            >
              <FileText className="h-3.5 w-3.5" aria-hidden />
              Read as Markdown
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <a
              href={PDP_EMBEDDED_PAYMENTS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkPillClass}
            >
              Embedded Payments on the Payments Developer Portal
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
          <p
            role="status"
            className="mt-2 min-h-[1.25rem] text-xs text-gray-600"
          >
            {copyStatus === 'idle' ? '' : COPY_MESSAGES[copyStatus]}
          </p>
          <details className="mt-1 text-sm text-gray-600">
            <summary className="cursor-pointer font-medium text-gray-700">
              What do the resource labels mean?
            </summary>
            <ul className="mt-2 space-y-1">
              {RESOURCE_KIND_ORDER.map((kind) => {
                const Icon = RESOURCE_KIND_ICONS[kind];
                return (
                  <li key={kind} className="flex items-start gap-2">
                    <Icon
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-sp-brand"
                      aria-hidden
                    />
                    <span>
                      <span className="font-semibold text-gray-800">
                        {RESOURCE_KIND_LABELS[kind]}:
                      </span>{' '}
                      {RESOURCE_KIND_DESCRIPTIONS[kind]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </details>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)_24rem]">
          <div className="lg:sticky lg:top-20">
            <ProfilePanel answers={answers} onAnswer={setAnswer} />
          </div>
          <JourneyMap
            answers={answers}
            focusId={focusId(focus)}
            onFocus={setFocus}
          />
          <div className="lg:col-span-2 xl:sticky xl:top-20 xl:col-span-1 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
            <AtlasDetail
              ref={detailRef}
              focus={focus}
              answers={answers}
              onAnswer={setAnswer}
              onFocus={setFocus}
            />
          </div>
        </div>

        <section
          aria-labelledby="ux-atlas-alternatives-heading"
          className="mt-10"
        >
          <h2
            id="ux-atlas-alternatives-heading"
            className="text-base font-semibold text-gray-900"
          >
            Not building every screen yourself?
          </h2>
          <ul className="mt-3 grid gap-4 md:grid-cols-3">
            {ALTERNATIVES.map((alt) => (
              <li
                key={alt.title}
                className="rounded-page-md bg-white p-4 shadow-page-card"
              >
                <h3 className="font-semibold text-gray-900">{alt.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{alt.whenToChoose}</p>
                <ul className="mt-3 space-y-1">
                  {alt.resources.map((r) => (
                    <li key={r.url}>
                      <ResourceLink resource={r} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

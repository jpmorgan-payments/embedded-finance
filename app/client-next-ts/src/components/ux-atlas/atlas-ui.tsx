import {
  BookOpen,
  Braces,
  ExternalLink,
  FileText,
  FlaskConical,
  LayoutTemplate,
  MonitorPlay,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  ANSWER_LABELS,
  RESOURCE_KIND_LABELS,
  RESOURCE_KIND_ORDER,
  toAppHref,
  type Answer,
  type AtlasResource,
  type ResourceKind,
} from '@/lib/ux-atlas/atlas';

export const RESOURCE_KIND_ICONS: Record<ResourceKind, LucideIcon> = {
  guide: BookOpen,
  api: Braces,
  recipe: FileText,
  storybook: LayoutTemplate,
  demo: MonitorPlay,
  test: FlaskConical,
};

/** Renders `code` spans written with backticks in atlas copy. */
export function AtlasText({ text }: { text: string }) {
  return (
    <>
      {text.split('`').map((part, i) =>
        i % 2 === 1 ? (
          <code
            key={i}
            className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.85em] text-gray-800"
          >
            {part}
          </code>
        ) : (
          part
        )
      )}
    </>
  );
}

export function ResourceLink({ resource }: { resource: AtlasResource }) {
  return (
    <a
      href={toAppHref(resource.url)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-start gap-1 text-sm text-sp-brand underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sp-brand"
    >
      {resource.label}
      <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

export function ResourceGroups({ resources }: { resources: AtlasResource[] }) {
  return (
    <div className="space-y-4">
      {RESOURCE_KIND_ORDER.map((kind) => {
        const items = resources.filter((r) => r.kind === kind);
        if (items.length === 0) return null;
        const Icon = RESOURCE_KIND_ICONS[kind];
        return (
          <div key={kind}>
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {RESOURCE_KIND_LABELS[kind]}
            </h4>
            <ul className="mt-1.5 space-y-1">
              {items.map((r) => (
                <li key={r.url}>
                  <ResourceLink resource={r} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

const ANSWER_OPTIONS: Answer[] = ['yes', 'no', 'unsure'];

export function AnswerOptions({
  name,
  value,
  onChange,
}: {
  name: string;
  value: Answer | undefined;
  onChange: (answer: Answer) => void;
}) {
  return (
    <div className="mt-2 inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5">
      {ANSWER_OPTIONS.map((option) => (
        <label key={option} className="relative">
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            className="peer sr-only"
          />
          <span
            className={cn(
              'block cursor-pointer rounded px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:text-gray-900',
              'peer-checked:bg-white peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-sp-brand',
              option === 'yes' && 'peer-checked:text-sp-brand',
              option === 'no' && 'peer-checked:text-gray-900',
              option === 'unsure' && 'peer-checked:text-amber-700'
            )}
          >
            {ANSWER_LABELS[option]}
          </span>
        </label>
      ))}
    </div>
  );
}

export const MODULE_CHIP_STYLES: Record<Answer | 'unanswered', string> = {
  unanswered: 'border-dashed border-gray-300 bg-white text-gray-700',
  yes: 'border-sp-brand bg-sp-brand text-white',
  unsure: 'border-amber-400 bg-amber-50 text-amber-900',
  no: 'border-gray-200 bg-gray-50 text-gray-400 line-through',
};

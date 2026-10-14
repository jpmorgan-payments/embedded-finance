import { cn } from '@/lib/utils';
import {
  ANSWER_LABELS,
  ATLAS_STAGES,
  getQuestion,
  isStageInScope,
  modulesForStage,
  type Answers,
  type AtlasStage,
  type ModuleQuestion,
} from '@/lib/ux-atlas/atlas';

import { MODULE_CHIP_STYLES } from './atlas-ui';

export function JourneyMap({
  answers,
  focusId,
  onFocus,
}: {
  answers: Answers;
  focusId: string;
  onFocus: (id: string) => void;
}) {
  return (
    <section
      aria-labelledby="ux-atlas-map-heading"
      className="rounded-page-md bg-white p-5 shadow-page-card"
    >
      <h2
        id="ux-atlas-map-heading"
        className="text-base font-semibold text-gray-900"
      >
        2. Walk the journey
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        Select a stage or a profile module to see what to build and where the
        guidance lives.
      </p>
      <div className="relative mt-5">
        <div
          aria-hidden
          className="absolute bottom-6 left-4 top-6 w-0.5 -translate-x-1/2 bg-sp-brand/25"
        />
        <ol className="relative space-y-5">
          {ATLAS_STAGES.map((stage) => (
            <StageRow
              key={stage.id}
              stage={stage}
              answers={answers}
              focusId={focusId}
              onFocus={onFocus}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

function StageRow({
  stage,
  answers,
  focusId,
  onFocus,
}: {
  stage: AtlasStage;
  answers: Answers;
  focusId: string;
  onFocus: (id: string) => void;
}) {
  const inScope = isStageInScope(stage, answers);
  const selected = focusId === stage.id;
  const modules = modulesForStage(stage.id);

  return (
    <li className="relative pl-12">
      <span
        aria-hidden
        className={cn(
          'absolute left-0 top-3 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold',
          !inScope && 'border-gray-300 bg-gray-50 text-gray-400',
          inScope && !selected && 'border-sp-brand bg-white text-sp-brand',
          inScope && selected && 'border-sp-brand bg-sp-brand text-white'
        )}
      >
        {stage.number}
      </span>
      <button
        type="button"
        onClick={() => onFocus(stage.id)}
        aria-pressed={selected}
        className={cn(
          'w-full rounded-page-md border p-3 text-left transition-colors hover:border-sp-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sp-brand',
          selected
            ? 'border-sp-brand bg-sp-accent'
            : 'border-gray-200 bg-white',
          !inScope && 'opacity-60'
        )}
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Stage {stage.number}
          </span>
          {stage.gate && <GateBadge stage={stage} answers={answers} />}
        </span>
        <span className="mt-0.5 block font-semibold text-gray-900">
          {stage.title}
        </span>
        <span className="mt-1 block text-sm text-gray-600">
          {stage.summary}
        </span>
        <span className="mt-2 block text-xs text-gray-500">
          {stage.build.length + (stage.decisions?.length ?? 0)} tasks ·{' '}
          {stage.resources.length} resources
        </span>
      </button>
      {modules.length > 0 && (
        <ul
          className="mt-2 flex flex-wrap gap-2"
          aria-label={`Profile modules for stage ${stage.number}`}
        >
          {modules.map((module) => (
            <li key={module.id}>
              <ModuleChip
                module={module}
                answers={answers}
                selected={focusId === module.id}
                onFocus={onFocus}
              />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function GateBadge({
  stage,
  answers,
}: {
  stage: AtlasStage;
  answers: Answers;
}) {
  const gate = getQuestion(stage.gate!);
  const answer = answers[gate.id];
  const text =
    answer === undefined
      ? `Depends on ${gate.letter}`
      : answer === 'no'
        ? `Out of scope (${gate.letter}: No)`
        : `${gate.letter}: ${ANSWER_LABELS[answer]}`;
  return (
    <span
      className={cn(
        'rounded-full border px-2 py-0.5 text-[11px] font-medium',
        answer === 'no'
          ? 'border-gray-300 bg-gray-100 text-gray-600'
          : answer === 'unsure'
            ? 'border-amber-300 bg-amber-50 text-amber-800'
            : 'border-sp-border bg-white text-gray-600'
      )}
    >
      {text}
    </span>
  );
}

function ModuleChip({
  module,
  answers,
  selected,
  onFocus,
}: {
  module: ModuleQuestion;
  answers: Answers;
  selected: boolean;
  onFocus: (id: string) => void;
}) {
  const answer = answers[module.id];
  return (
    <button
      type="button"
      onClick={() => onFocus(module.id)}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sp-brand',
        MODULE_CHIP_STYLES[answer ?? 'unanswered'],
        selected && 'ring-2 ring-sp-brand ring-offset-1'
      )}
    >
      <span className="font-semibold">{module.letter}</span>
      {module.title}
      <span className="sr-only">
        : {answer ? ANSWER_LABELS[answer] : 'Not answered'}
      </span>
    </button>
  );
}

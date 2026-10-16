import { forwardRef, type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import {
  ANSWER_LABELS,
  getQuestion,
  getStage,
  isStageInScope,
  modulesForStage,
  type Answer,
  type Answers,
  type AtlasFocus,
  type ProfileId,
} from '@/lib/ux-atlas/atlas';

import {
  AnswerOptions,
  AtlasText,
  MODULE_CHIP_STYLES,
  ResourceGroups,
} from './atlas-ui';

interface AtlasDetailProps {
  focus: AtlasFocus;
  answers: Answers;
  onAnswer: (id: ProfileId, answer: Answer) => void;
  onFocus: (id: string) => void;
}

export const AtlasDetail = forwardRef<HTMLElement, AtlasDetailProps>(
  function AtlasDetail({ focus, answers, onAnswer, onFocus }, ref) {
    return (
      <section
        ref={ref}
        aria-labelledby="ux-atlas-detail-heading"
        className="scroll-mt-24 rounded-page-md bg-white p-5 shadow-page-card"
      >
        {focus.type === 'stage' ? (
          <StageDetail
            focus={focus}
            answers={answers}
            onAnswer={onAnswer}
            onFocus={onFocus}
          />
        ) : (
          <ModuleDetail
            focus={focus}
            answers={answers}
            onAnswer={onAnswer}
            onFocus={onFocus}
          />
        )}
      </section>
    );
  }
);

function BuildList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-gray-700">
      {items.map((item) => (
        <li key={item}>
          <AtlasText text={item} />
        </li>
      ))}
    </ul>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-5 text-sm font-semibold text-gray-900">{children}</h3>
  );
}

function StageDetail({
  focus,
  answers,
  onAnswer,
  onFocus,
}: AtlasDetailProps & { focus: Extract<AtlasFocus, { type: 'stage' }> }) {
  const { stage } = focus;
  const gate = stage.gate ? getQuestion(stage.gate) : undefined;
  const modules = modulesForStage(stage.id);
  const inScope = isStageInScope(stage, answers);

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-sp-brand">
        Stage {stage.number}
      </p>
      <h2
        id="ux-atlas-detail-heading"
        className="mt-0.5 text-xl font-semibold text-gray-900"
      >
        {stage.title}
      </h2>
      <p className="mt-1 text-sm text-gray-600">{stage.summary}</p>

      {gate && (
        <fieldset
          className={cn(
            'mt-4 rounded-md border p-3',
            inScope ? 'border-sp-border' : 'border-gray-300 bg-gray-50'
          )}
        >
          <legend className="px-1 text-xs font-medium text-gray-600">
            {gate.letter}. {gate.question}
          </legend>
          <AnswerOptions
            name={`ux-atlas-detail-${gate.id}`}
            value={answers[gate.id]}
            onChange={(answer) => onAnswer(gate.id, answer)}
          />
          {!inScope && (
            <p className="mt-2 text-xs text-gray-600">
              Out of scope for your platform. It stays here for reference.
            </p>
          )}
        </fieldset>
      )}

      {stage.decisions && (
        <>
          <SubHeading>Decide first</SubHeading>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-gray-700">
            {stage.decisions.map((d) => (
              <li key={d}>
                <AtlasText text={d} />
              </li>
            ))}
          </ol>
        </>
      )}

      <SubHeading>What to build</SubHeading>
      <BuildList items={stage.build} />

      {modules.length > 0 && (
        <>
          <SubHeading>Profile modules for this stage</SubHeading>
          <ul className="mt-2 flex flex-wrap gap-2">
            {modules.map((m) => {
              const answer = answers[m.id];
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onFocus(m.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sp-brand',
                      MODULE_CHIP_STYLES[answer ?? 'unanswered']
                    )}
                  >
                    <span className="font-semibold">{m.letter}</span>
                    {m.title}
                    <span className="sr-only">
                      : {answer ? ANSWER_LABELS[answer] : 'Not answered'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <SubHeading>Resources</SubHeading>
      <div className="mt-2">
        <ResourceGroups resources={stage.resources} />
      </div>
    </>
  );
}

function ModuleDetail({
  focus,
  answers,
  onAnswer,
  onFocus,
}: AtlasDetailProps & { focus: Extract<AtlasFocus, { type: 'module' }> }) {
  const { module } = focus;
  const stage = getStage(module.stageId);

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-sp-brand">
        Profile module {module.letter} ·{' '}
        <button
          type="button"
          onClick={() => onFocus(stage.id)}
          className="uppercase underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sp-brand"
        >
          Stage {stage.number}: {stage.title}
        </button>
      </p>
      <h2
        id="ux-atlas-detail-heading"
        className="mt-0.5 text-xl font-semibold text-gray-900"
      >
        {module.title}
      </h2>
      <p className="mt-1 text-sm text-gray-600">{module.summary}</p>

      <fieldset className="mt-4 rounded-md border border-sp-border p-3">
        <legend className="px-1 text-xs font-medium text-gray-600">
          {module.letter}. {module.question}
        </legend>
        <AnswerOptions
          name={`ux-atlas-detail-${module.id}`}
          value={answers[module.id]}
          onChange={(answer) => onAnswer(module.id, answer)}
        />
      </fieldset>

      <SubHeading>What to build</SubHeading>
      <BuildList items={module.build} />

      <SubHeading>Resources</SubHeading>
      <div className="mt-2">
        <ResourceGroups resources={module.resources} />
      </div>
    </>
  );
}

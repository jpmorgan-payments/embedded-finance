import {
  countAnswered,
  PROFILE_QUESTIONS,
  type Answer,
  type Answers,
  type ProfileId,
} from '@/lib/ux-atlas/atlas';

import { AnswerOptions } from './atlas-ui';

export function ProfilePanel({
  answers,
  onAnswer,
}: {
  answers: Answers;
  onAnswer: (id: ProfileId, answer: Answer) => void;
}) {
  return (
    <section
      aria-labelledby="ux-atlas-profile-heading"
      className="rounded-page-md bg-white p-5 shadow-page-card"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2
          id="ux-atlas-profile-heading"
          className="text-base font-semibold text-gray-900"
        >
          1. Profile your platform
        </h2>
        <span className="text-xs text-gray-500">
          {countAnswered(answers)} of {PROFILE_QUESTIONS.length} answered
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-600">
        Each &ldquo;Yes&rdquo; adds data to collect or states to handle.
        &ldquo;Not sure&rdquo; counts as yes until you confirm it.
      </p>
      <ol className="mt-4 space-y-4">
        {PROFILE_QUESTIONS.map((q) => (
          <li key={q.id}>
            <fieldset>
              <legend className="text-sm text-gray-800">
                <span className="mr-1 font-semibold text-sp-brand">
                  {q.letter}.
                </span>
                {q.question}
              </legend>
              <AnswerOptions
                name={`ux-atlas-profile-${q.id}`}
                value={answers[q.id]}
                onChange={(answer) => onAnswer(q.id, answer)}
              />
            </fieldset>
          </li>
        ))}
      </ol>
    </section>
  );
}

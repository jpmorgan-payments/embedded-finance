import { efClientQuestionsMock } from '@/mocks/efClientQuestions.mock';
import { describe, expect, test } from 'vitest';

import type { ApiError, QuestionResponse } from '@/api/generated/smbdo.schemas';
import type { ErrorType } from '@/api/use-axios-instance';

import {
  buildQuestionDefaultValues,
  buildVisibleQuestionResponses,
  getQuestionServerErrors,
} from './questionForm';

// Sanctions question and its "which countries" follow-up (shown for "Yes").
const questions = efClientQuestionsMock.questions.filter((q) =>
  ['30158', '30162'].includes(q.id)
) as QuestionResponse[];

describe('questionForm', () => {
  test('buildQuestionDefaultValues prefills saved answers', () => {
    expect(
      buildQuestionDefaultValues(
        ['30158', '30162'],
        [{ questionId: '30158', values: ['true'] }]
      )
    ).toEqual({ question_30158: ['true'], question_30162: [] });
  });

  test('buildVisibleQuestionResponses drops hidden follow-up questions', () => {
    expect(
      buildVisibleQuestionResponses(
        { question_30158: ['false'], question_30162: ['stale'] },
        questions
      )
    ).toEqual([{ questionId: '30158', values: ['false'] }]);

    expect(
      buildVisibleQuestionResponses(
        { question_30158: ['true'], question_30162: ['Cuba'] },
        questions
      )
    ).toEqual([
      { questionId: '30158', values: ['true'] },
      { questionId: '30162', values: ['Cuba'] },
    ]);
  });

  test('getQuestionServerErrors maps API errors to rendered questions only', () => {
    const error = {
      response: {
        data: {
          title: 'Bad Request',
          context: [
            { message: 'Question [30162] is invalid [Add more detail.]' },
            { message: 'Question [99999] is invalid' },
            { message: 'Something else went wrong' },
          ],
        },
      },
    } as unknown as ErrorType<ApiError>;

    expect(getQuestionServerErrors(error, questions)).toEqual([
      { fieldName: 'question_30162', message: 'Add more detail.' },
    ]);
    expect(getQuestionServerErrors(null, questions)).toEqual([]);
  });
});

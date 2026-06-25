/**
 * OnboardingFlow — Questions / Operational Details
 *
 * Dedicated story group illustrating all possible question field types
 * rendered by the **Operational Details** screen (`additional-questions-section`).
 *
 * Supported field types (mapped from `responseSchema`):
 *
 * | Schema `items.type` | `enum` present? | `maxItems`      | Rendered as                |
 * |---------------------|-----------------|-----------------|----------------------------|
 * | `boolean`           | —               | 1               | RadioGroup (Yes / No)      |
 * | `string`            | yes             | > 1             | Checkbox list (multi)      |
 * | `string`            | yes             | 1 or omitted    | Select dropdown            |
 * | `string`            | no              | 1               | Text input                 |
 * | `integer`           | —               | 1               | Number input               |
 * | (money ID override) | —               | 1               | Currency input ($, 0.01)   |
 * | (date ID override)  | —               | 1               | Date input (YYYY-MM-DD)    |
 *
 * Additionally, questions can have **subQuestions** (conditional children)
 * that reveal when the parent answer matches `anyValuesMatch`.
 *
 * Every story uses `flowEntry: { screenId: 'additional-questions-section' }`
 * to land directly on the Operational Details view.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';

import type { BaseStoryArgs } from '../../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  DEFAULT_CLIENT_ID,
  defaultHandlers,
  mockClientNew,
  OnboardingFlowTemplate,
  resetAndSeedClient,
} from '../story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

// ============================================================================
// Flow Entry
// ============================================================================

const QUESTIONS_FLOW_ENTRY: OnboardingFlowProps['flowEntry'] = {
  screenId: 'additional-questions-section',
};

// ============================================================================
// Inline Question Mocks — minimal payloads covering every field type
// ============================================================================

/** Boolean question — renders as Yes/No radio group. */
const booleanQuestion = {
  content: [
    {
      description: 'Is your business currently operational?',
      label: 'Is your business currently operational?',
      locale: 'en-US',
    },
  ],
  defaultLocale: 'en-US',
  description: 'Is your business currently operational?',
  id: 'Q_BOOL_1',
  responseSchema: {
    type: 'array',
    minItems: 1,
    maxItems: 1,
    items: { type: 'boolean' },
  },
  subQuestions: [],
};

/** Integer question — renders as number input. */
const integerQuestion = {
  content: [
    {
      description: 'How many employees does your business have?',
      label: 'Number of employees:',
      locale: 'en-US',
    },
  ],
  defaultLocale: 'en-US',
  description: 'How many employees does your business have?',
  id: 'Q_INT_1',
  responseSchema: {
    type: 'array',
    minItems: 1,
    maxItems: 1,
    items: { type: 'integer' },
  },
  subQuestions: [],
};

/** Money/currency question — renders as $ input with decimals (ID in MONEY_INPUT_QUESTION_IDS). */
const moneyQuestion = {
  content: [
    {
      description: 'What is your Total Annual Revenue in local currency?',
      label: 'Total annual revenue/income:',
      locale: 'en-US',
    },
  ],
  defaultLocale: 'en-US',
  description: 'What is your Total Annual Revenue in local currency?',
  id: '30005',
  responseSchema: {
    type: 'array',
    minItems: 1,
    maxItems: 1,
    items: { type: 'integer' },
  },
  subQuestions: [],
};

/** Date question — renders as date input (ID in DATE_QUESTION_IDS). */
const dateQuestion = {
  content: [
    {
      description: 'When was your business established?',
      label: 'Business establishment date:',
      locale: 'en-US',
    },
  ],
  defaultLocale: 'en-US',
  description: 'When was your business established?',
  id: '30071',
  responseSchema: {
    type: 'array',
    minItems: 1,
    maxItems: 1,
    items: { type: 'string' },
  },
  subQuestions: [],
};

/** String (free text) question — renders as text input. */
const freeTextQuestion = {
  content: [
    {
      description: 'Please describe your primary business activity.',
      label: 'Primary business activity:',
      locale: 'en-US',
    },
  ],
  defaultLocale: 'en-US',
  description: 'Please describe your primary business activity.',
  id: 'Q_TEXT_1',
  responseSchema: {
    type: 'array',
    minItems: 1,
    maxItems: 1,
    items: { type: 'string' },
  },
  subQuestions: [],
};

/** Enum single-select — renders as Select dropdown (maxItems=1 or absent + enum). */
const enumSingleSelectQuestion = {
  content: [
    {
      description: 'What is your primary payment method?',
      label: 'Primary payment method:',
      locale: 'en-US',
    },
  ],
  defaultLocale: 'en-US',
  description: 'What is your primary payment method?',
  id: 'Q_ENUM_SINGLE',
  responseSchema: {
    type: 'array',
    minItems: 1,
    maxItems: 1,
    items: {
      type: 'string',
      enum: ['Credit Card', 'Debit Card', 'ACH Transfer', 'Wire Transfer'],
    },
  },
  subQuestions: [],
};

/** Enum multi-select — renders as Checkbox list (maxItems > 1 + enum). */
const enumMultiSelectQuestion = {
  content: [
    {
      description: 'Which regions do you operate in? (Select all that apply)',
      label: 'Operating regions:',
      locale: 'en-US',
    },
  ],
  defaultLocale: 'en-US',
  description: 'Which regions do you operate in? (Select all that apply)',
  id: 'Q_ENUM_MULTI',
  responseSchema: {
    type: 'array',
    minItems: 1,
    maxItems: 5,
    items: {
      type: 'string',
      enum: [
        'North America',
        'Europe',
        'Asia Pacific',
        'Latin America',
        'Middle East & Africa',
      ],
    },
  },
  subQuestions: [],
};

/** Boolean with conditional child — demonstrates subQuestion reveal. */
const booleanWithChildQuestion = {
  content: [
    {
      description: 'Do you process transactions in foreign currencies?',
      label: 'Do you process transactions in foreign currencies?',
      locale: 'en-US',
    },
  ],
  defaultLocale: 'en-US',
  description: 'Do you process transactions in foreign currencies?',
  id: 'Q_BOOL_PARENT',
  responseSchema: {
    type: 'array',
    minItems: 1,
    maxItems: 1,
    items: { type: 'boolean' },
  },
  subQuestions: [{ anyValuesMatch: 'true', questionIds: ['Q_CHILD_ENUM'] }],
};

/** Child enum question — shown only when parent = true. */
const childEnumQuestion = {
  content: [
    {
      description: 'Select the currencies you process.',
      label: 'Currencies processed:',
      locale: 'en-US',
    },
  ],
  defaultLocale: 'en-US',
  description: 'Select the currencies you process.',
  id: 'Q_CHILD_ENUM',
  parentQuestionId: 'Q_BOOL_PARENT',
  responseSchema: {
    type: 'array',
    minItems: 1,
    maxItems: 10,
    items: {
      type: 'string',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'AUD'],
    },
  },
  subQuestions: [],
};

// ============================================================================
// Helpers
// ============================================================================

/** Build a mock client whose `outstanding.questionIds` lists specific IDs. */
const withQuestionIds = (questionIds: string[]): ClientResponse => ({
  ...mockClientNew,
  outstanding: {
    ...mockClientNew.outstanding,
    questionIds,
  },
});

/** Seed the MSW db with a client that has the given outstanding question IDs. */
const seedQuestionsClient = (questionIds: string[]) => () =>
  resetAndSeedClient(withQuestionIds(questionIds), DEFAULT_CLIENT_ID);

/** Create an MSW handler that returns custom questions for any /questions request. */
const questionsHandler = (questions: object[]) =>
  http.get('/questions', () =>
    HttpResponse.json({
      metadata: { page: 0, total: questions.length },
      questions,
    })
  );

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Prepopulated Client/Questions',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding'],
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: defaultHandlers },
  },
  args: {
    ...commonArgsWithCallbacks,
    clientId: DEFAULT_CLIENT_ID,
    flowEntry: QUESTIONS_FLOW_ENTRY,
  },
  argTypes: {
    ...commonArgTypes,
  },
  render: (args) => <OnboardingFlowTemplate {...args} />,
};

export default meta;
type Story = StoryObj<OnboardingFlowStoryArgs>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Shows every supported field type on a single screen:
 * boolean, integer, money ($), date, free text, enum single-select,
 * and enum multi-select.
 */
export const AllFieldTypes: Story = {
  loaders: [
    seedQuestionsClient([
      'Q_BOOL_1',
      'Q_INT_1',
      '30005',
      '30071',
      'Q_TEXT_1',
      'Q_ENUM_SINGLE',
      'Q_ENUM_MULTI',
    ]),
  ],
  parameters: {
    msw: {
      handlers: [
        questionsHandler([
          booleanQuestion,
          integerQuestion,
          moneyQuestion,
          dateQuestion,
          freeTextQuestion,
          enumSingleSelectQuestion,
          enumMultiSelectQuestion,
        ]),
        ...defaultHandlers,
      ],
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    flowEntry: QUESTIONS_FLOW_ENTRY,
  },
};

/**
 * Boolean question with a conditional child (enum multi-select).
 * Select "Yes" to reveal the child question.
 */
export const ConditionalSubQuestion: Story = {
  name: 'Conditional Sub-Question',
  loaders: [seedQuestionsClient(['Q_BOOL_PARENT'])],
  parameters: {
    msw: {
      handlers: [
        questionsHandler([booleanWithChildQuestion, childEnumQuestion]),
        ...defaultHandlers,
      ],
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    flowEntry: QUESTIONS_FLOW_ENTRY,
  },
};

/**
 * Single money/currency input ($). Uses the special `MONEY_INPUT_QUESTION_IDS`
 * override to render a dollar-prefixed numeric field accepting decimals.
 */
export const CurrencyInput: Story = {
  name: 'Currency / Money Input',
  loaders: [seedQuestionsClient(['30005'])],
  parameters: {
    msw: {
      handlers: [questionsHandler([moneyQuestion]), ...defaultHandlers],
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    flowEntry: QUESTIONS_FLOW_ENTRY,
  },
};

/**
 * Single date input. Uses the special `DATE_QUESTION_IDS` override
 * to render a date-formatted text field (YYYY-MM-DD).
 */
export const DateInput: Story = {
  loaders: [seedQuestionsClient(['30071'])],
  parameters: {
    msw: {
      handlers: [questionsHandler([dateQuestion]), ...defaultHandlers],
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    flowEntry: QUESTIONS_FLOW_ENTRY,
  },
};

/**
 * Enum single-select dropdown and enum multi-select checkboxes side by side.
 */
export const EnumFields: Story = {
  name: 'Enum (Single & Multi Select)',
  loaders: [seedQuestionsClient(['Q_ENUM_SINGLE', 'Q_ENUM_MULTI'])],
  parameters: {
    msw: {
      handlers: [
        questionsHandler([enumSingleSelectQuestion, enumMultiSelectQuestion]),
        ...defaultHandlers,
      ],
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    flowEntry: QUESTIONS_FLOW_ENTRY,
  },
};

/**
 * Multiple boolean (Yes/No) questions — a typical compliance questionnaire.
 */
export const BooleanOnly: Story = {
  name: 'Boolean (Yes / No) Questions',
  loaders: [seedQuestionsClient(['Q_BOOL_1', 'Q_BOOL_PARENT'])],
  parameters: {
    msw: {
      handlers: [
        questionsHandler([
          booleanQuestion,
          booleanWithChildQuestion,
          childEnumQuestion,
        ]),
        ...defaultHandlers,
      ],
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    flowEntry: QUESTIONS_FLOW_ENTRY,
  },
};

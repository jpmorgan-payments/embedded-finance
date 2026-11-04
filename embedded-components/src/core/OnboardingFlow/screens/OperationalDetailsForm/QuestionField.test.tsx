import {
  naics524114LicensingQuestions,
  QUESTION_COUNTRY_OPTIONS,
  significantOperationsCountriesQuestion,
} from '@/mocks/efClientQuestionsCountries.mock';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, test } from 'vitest';

import type { QuestionResponse } from '@/api/generated/smbdo.schemas';
import { Form } from '@/components/ui';

import { QuestionField } from './QuestionField';
import { getQuestionFieldName } from './questionForm';

const countryOfLicense = naics524114LicensingQuestions.find(
  (question) => question.id === '30070'
) as unknown as QuestionResponse;
const licensedOrRegistered = naics524114LicensingQuestions.find(
  (question) => question.id === '30069'
) as unknown as QuestionResponse;
const significantOperations =
  significantOperationsCountriesQuestion as unknown as QuestionResponse;

function QuestionHarness({ question }: { question: QuestionResponse }) {
  const form = useForm({
    defaultValues: { [getQuestionFieldName(question.id)]: [] as string[] },
  });
  const value = form.watch(getQuestionFieldName(question.id));

  return (
    <Form {...form}>
      <QuestionField question={question} />
      <output data-testid="value">{JSON.stringify(value)}</output>
    </Form>
  );
}

const valueOf = () => JSON.parse(screen.getByTestId('value').textContent!);

describe('QuestionField', () => {
  test('keeps a short list of choices as checkboxes', () => {
    render(<QuestionHarness question={licensedOrRegistered} />);

    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  test('picks one of the 237 countries from a searchable list', async () => {
    const user = userEvent.setup();
    render(<QuestionHarness question={countryOfLicense} />);

    // None of the 237 countries are on the page until the list opens.
    expect(screen.queryByText('Afghanistan')).not.toBeInTheDocument();
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveTextContent('Select an option');

    await user.click(trigger);
    expect(screen.getAllByRole('option')).toHaveLength(
      QUESTION_COUNTRY_OPTIONS.length
    );
    await user.type(screen.getByPlaceholderText('Search'), 'Cana');
    expect(
      screen.getAllByRole('option').map((option) => option.textContent)
    ).toEqual(['Canada']);
    await user.click(screen.getByRole('option', { name: 'Canada' }));

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent('Canada');
    expect(valueOf()).toEqual(['Canada']);
  });

  test('lists the United States first, then the rest alphabetically', async () => {
    const user = userEvent.setup();
    render(<QuestionHarness question={significantOperations} />);

    await user.click(screen.getByRole('combobox'));
    const names = screen
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(names.slice(0, 3)).toEqual([
      'United States',
      'Afghanistan',
      'Albania',
    ]);
    expect(names.filter((name) => name === 'United States')).toHaveLength(1);
    expect(names).toHaveLength(QUESTION_COUNTRY_OPTIONS.length);

    await user.type(screen.getByPlaceholderText('Search'), 'United');
    expect(
      screen.getAllByRole('option').map((option) => option.textContent)
    ).toEqual(['United States', 'United Arab Emirates', 'United Kingdom']);
  });

  test('chooses several countries and shows each as a removable chip', async () => {
    const user = userEvent.setup();
    render(<QuestionHarness question={significantOperations} />);

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveTextContent('Select one or more');
    await user.click(trigger);
    await user.type(screen.getByPlaceholderText('Search'), 'Japan');
    await user.click(screen.getByRole('option', { name: 'Japan' }));
    // The list stays open for more choices.
    await user.clear(screen.getByPlaceholderText('Search'));
    await user.type(screen.getByPlaceholderText('Search'), 'Mexico');
    await user.click(screen.getByRole('option', { name: 'Mexico' }));
    await user.keyboard('{Escape}');

    expect(trigger).toHaveTextContent('2 selected');
    const chips = document.querySelector<HTMLElement>(
      '[data-selected-options]'
    )!;
    expect(within(chips).getAllByRole('listitem')).toHaveLength(2);
    expect(valueOf()).toEqual(['Japan', 'Mexico']);

    await user.click(screen.getByRole('button', { name: 'Remove Japan' }));
    expect(valueOf()).toEqual(['Mexico']);
    expect(trigger).toHaveTextContent('1 selected');
  });

  test('stops more choices once the question’s limit is reached', async () => {
    const user = userEvent.setup();
    const limited = {
      ...significantOperations,
      responseSchema: { ...significantOperations.responseSchema, maxItems: 2 },
    } as QuestionResponse;
    render(<QuestionHarness question={limited} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Albania' }));
    await user.click(screen.getByRole('option', { name: 'Algeria' }));

    expect(screen.getByRole('option', { name: 'Andorra' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    expect(screen.getByRole('option', { name: 'Albania' })).not.toHaveAttribute(
      'aria-disabled',
      'true'
    );
    expect(
      screen.getByText('You can select up to 2 options.')
    ).toBeInTheDocument();
  });
});

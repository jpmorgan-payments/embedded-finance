/**
 * Unit tests for {@link IndustryTypeSelect}, focused on the host-curated
 * `priorityCodes` pinned group:
 *
 * - Renders the pinned "Suggested for your platform" header + codes at the top
 *   of the listbox when `priorityCodes` is non-empty.
 * - Preserves host-supplied order.
 * - Silently drops unknown codes (and warns once in dev).
 * - Does not duplicate priority codes in the catalog section.
 * - Search filters both sections; when no priority matches remain, the
 *   pinned header stays visible with a quiet empty-state row.
 * - Selecting a priority item invokes `onChange` with the NAICS code.
 * - Default behavior (no `priorityCodes`) remains unchanged — no pinned header.
 */
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent, within } from '@test-utils';

import { Form, FormField } from '@/components/ui/form';
import { IndustryTypeSelect } from '@/core/OnboardingFlow/components/IndustryTypeSelect/IndustryTypeSelect';

type Values = { industry: string };

function Harness({
  priorityCodes,
  defaultValue = '',
  onChange,
}: {
  priorityCodes?: readonly string[];
  defaultValue?: string;
  onChange?: (value: string) => void;
}): ReactNode {
  const form = useForm<Values>({
    defaultValues: { industry: defaultValue },
  });
  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="industry"
        render={({ field }) => (
          <IndustryTypeSelect
            field={field}
            priorityCodes={priorityCodes}
            onChange={(value: string) => {
              field.onChange(value);
              onChange?.(value);
            }}
          />
        )}
      />
    </Form>
  );
}

async function openCombobox() {
  const trigger = screen.getByRole('combobox');
  await userEvent.click(trigger);
  // The listbox renders inside a Radix popover; wait for its search input.
  return screen.findByPlaceholderText(/search industr/i);
}

describe('IndustryTypeSelect — priorityCodes', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  test('does not render a pinned group when no priorityCodes are provided', async () => {
    render(<Harness />);
    await openCombobox();
    expect(
      screen.queryByTestId('industry-select-priority-header')
    ).not.toBeInTheDocument();
  });

  test('renders the pinned header + items in host-supplied order', async () => {
    // 722511 = Full-Service Restaurants, 311811 = Retail Bakeries
    render(<Harness priorityCodes={['311811', '722511']} />);
    await openCombobox();

    expect(
      screen.getByTestId('industry-select-priority-header')
    ).toHaveTextContent(/suggested for your platform/i);

    const bakery = await screen.findByTestId(
      'industry-select-priority-item-311811'
    );
    const restaurant = await screen.findByTestId(
      'industry-select-priority-item-722511'
    );

    // Host order: 311811 must appear before 722511 in the DOM.
    expect(
      bakery.compareDocumentPosition(restaurant) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  test('silently drops unknown codes and warns in dev', async () => {
    render(<Harness priorityCodes={['722511', '999999', '000000']} />);
    await openCombobox();

    expect(
      screen.getByTestId('industry-select-priority-item-722511')
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('industry-select-priority-item-999999')
    ).not.toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('999999'));
  });

  test('selecting a priority item invokes onChange with the NAICS code', async () => {
    const onChange = vi.fn();
    render(<Harness priorityCodes={['722511']} onChange={onChange} />);
    await openCombobox();

    const item = await screen.findByTestId(
      'industry-select-priority-item-722511'
    );
    await userEvent.click(item);

    expect(onChange).toHaveBeenCalledWith('722511');
  });

  test('search filters the pinned group; header + empty state remain when no matches', async () => {
    const onChange = vi.fn();
    render(
      <Harness priorityCodes={['722511', '311811']} onChange={onChange} />
    );
    const search = await openCombobox();

    // A query that matches NO priority code but matches catalog entries.
    await userEvent.type(search, 'soybean');

    // Header still shown so the user keeps spatial context.
    expect(
      screen.getByTestId('industry-select-priority-header')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no suggestions match your search/i)
    ).toBeInTheDocument();
    // None of the priority items should render.
    expect(
      screen.queryByTestId('industry-select-priority-item-722511')
    ).not.toBeInTheDocument();
  });

  test('priority codes are not duplicated in the catalog section', async () => {
    render(<Harness priorityCodes={['722511']} />);
    const search = await openCombobox();

    // Narrow to just our priority code so we can count occurrences.
    await userEvent.type(search, '722511');

    // Exactly one rendered row carries the priority test id.
    const items = screen.queryAllByTestId(
      'industry-select-priority-item-722511'
    );
    expect(items).toHaveLength(1);

    // And the catalog section should not also render the same code: total
    // number of CommandItem rows for "722511" must equal 1.
    const popover = items[0].closest('[role="listbox"]') ?? document.body;
    const allRowsForCode = within(popover as HTMLElement).queryAllByText(
      /Full-Service Restaurants/i
    );
    expect(allRowsForCode).toHaveLength(1);
  });
});

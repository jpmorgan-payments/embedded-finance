import { describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import { ImportantDateSelector } from './ImportantDateSelector';

const getErrorMessages = (onChange: ReturnType<typeof vi.fn>) =>
  onChange.mock.calls.map(([, errorMessage]) => errorMessage).filter(Boolean);

describe('ImportantDateSelector', () => {
  test('does not report an error while the year is still being typed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ImportantDateSelector
        value={new Date(1990, 0, 15)}
        onChange={onChange}
      />
    );

    const year = screen.getByLabelText('Year');
    await user.clear(year);
    onChange.mockClear();
    await user.type(year, '199');

    expect(getErrorMessages(onChange)).toEqual([]);

    await user.type(year, '2');

    const lastCall = onChange.mock.calls.at(-1);
    expect(lastCall?.[0]).toEqual(new Date(1992, 0, 15));
    expect(lastCall?.[1]).toBeUndefined();
  });

  test('does not mark fields red when the date is half filled or cleared', async () => {
    const user = userEvent.setup();
    render(<ImportantDateSelector value={new Date(1990, 0, 15)} />);

    await user.clear(screen.getByLabelText('Day'));
    await user.clear(screen.getByLabelText('Year'));

    expect(screen.getByLabelText('Day')).not.toHaveClass('eb-border-red-500');
    expect(screen.getByLabelText('Year')).not.toHaveClass('eb-border-red-500');
  });

  test('marks fields red when the form reports an error', () => {
    render(<ImportantDateSelector aria-invalid />);

    expect(screen.getByLabelText('Day')).toHaveClass('eb-border-red-500');
    expect(screen.getByLabelText('Year')).toHaveClass('eb-border-red-500');
  });

  test('waits for the second day digit or blur before reporting', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ImportantDateSelector
        value={new Date(1990, 1, 10)}
        onChange={onChange}
      />
    );

    const day = screen.getByLabelText('Day');
    await user.clear(day);
    onChange.mockClear();
    await user.type(day, '3');

    expect(onChange).not.toHaveBeenCalled();

    await user.tab();

    expect(onChange).toHaveBeenLastCalledWith(new Date(1990, 1, 3));
  });

  test('reports an error once a complete date is invalid', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ImportantDateSelector
        value={new Date(1990, 1, 10)}
        onChange={onChange}
      />
    );

    const day = screen.getByLabelText('Day');
    await user.clear(day);
    await user.type(day, '31');

    const lastCall = onChange.mock.calls.at(-1);
    expect(lastCall?.[0]).toBeNull();
    expect(lastCall?.[1]).toBeTruthy();
  });
});

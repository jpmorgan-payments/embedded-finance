import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PatternInput } from './PatternInput';

describe('PatternInput', () => {
  it('renders an input element', () => {
    render(<PatternInput format="### - ## - ####" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('formats typed input and reports the raw value via onChange', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<PatternInput format="### - ## - ####" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, '123456789');

    expect(input).toHaveValue('123 - 45 - 6789');
    expect(handleChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ value: '123456789' }),
      })
    );
  });

  it('obfuscates the initial value when obfuscateWhenUnfocused is set and unfocused', () => {
    render(
      <PatternInput
        format="### - ## - ####"
        value="123456789"
        obfuscateWhenUnfocused
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole('textbox')).toHaveValue('*** - ** - 6789');
  });

  it('reveals the real value when an obfuscated field gains focus', async () => {
    const user = userEvent.setup();
    render(
      <PatternInput
        format="### - ## - ####"
        value="123456789"
        obfuscateWhenUnfocused
        onChange={vi.fn()}
      />
    );

    await user.click(screen.getByRole('textbox'));

    expect(screen.getByRole('textbox')).toHaveValue('123 - 45 - 6789');
  });

  it('does not obfuscate when there is no initial value', () => {
    render(
      <PatternInput
        format="### - ## - ####"
        value=""
        obfuscateWhenUnfocused
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole('textbox')).not.toHaveValue('*** - ** - 6789');
  });
});

import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@test-utils';

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from './input-otp';

function ControlledOtp() {
  const [value, setValue] = useState('');
  return (
    <InputOTP maxLength={4} value={value} onChange={setValue}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTPGroup>
    </InputOTP>
  );
}

describe('InputOTP', () => {
  beforeAll(() => {
    document.elementFromPoint = vi.fn(() => null);
  });

  it('accepts input and updates slots', async () => {
    const user = userEvent.setup();
    render(<ControlledOtp />);

    const input = screen.getByRole('textbox');
    await user.type(input, '4829');

    expect(input).toHaveValue('4829');
    expect(screen.getAllByText('4').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('renders separator between groups', () => {
    render(<ControlledOtp />);

    expect(screen.getAllByRole('separator')).toHaveLength(1);
  });
});

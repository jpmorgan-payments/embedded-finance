import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import { StepSection } from './StepSection';

const baseProps = {
  stepNumber: 2,
  title: 'Payment Method',
  isComplete: false,
  isActive: false,
};

const renderStep = (
  props: Partial<React.ComponentProps<typeof StepSection>> = {}
) =>
  render(
    <StepSection {...baseProps} {...props}>
      <div>Panel content</div>
    </StepSection>
  );

describe('StepSection', () => {
  it('renders the title, step number, and "Select" action when idle', () => {
    renderStep();

    expect(screen.getByText('Payment Method')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Select')).toBeInTheDocument();
  });

  it('hides the step number and shows "Change" when complete', () => {
    renderStep({ isComplete: true });

    expect(screen.queryByText('2')).not.toBeInTheDocument();
    expect(screen.getByText('Change')).toBeInTheDocument();
  });

  it('shows "Cancel" and renders content when active', () => {
    renderStep({ isActive: true });

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Panel content')).toBeInTheDocument();
  });

  it('prioritizes loading over complete (shows "Loading...", hides the number)', () => {
    renderStep({ isLoading: true, isComplete: true });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('prioritizes error over complete (shows "(Required)", hides the number)', () => {
    renderStep({ hasError: true, isComplete: true });

    expect(screen.getByText('(Required)')).toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('renders the summary next to the title when complete and collapsed', () => {
    renderStep({ isComplete: true, summary: 'Checking ••1234' });

    expect(screen.getByText(/Checking ••1234/)).toBeInTheDocument();
  });

  it('calls onHeaderClick when an inactive, enabled header is clicked', async () => {
    const user = userEvent.setup();
    const onHeaderClick = vi.fn();
    renderStep({ onHeaderClick });

    await user.click(screen.getByRole('button'));

    expect(onHeaderClick).toHaveBeenCalledTimes(1);
  });

  it('calls onCollapse (not onHeaderClick) when an active header is clicked', async () => {
    const user = userEvent.setup();
    const onCollapse = vi.fn();
    const onHeaderClick = vi.fn();
    renderStep({ isActive: true, onCollapse, onHeaderClick });

    await user.click(screen.getByRole('button'));

    expect(onCollapse).toHaveBeenCalledTimes(1);
    expect(onHeaderClick).not.toHaveBeenCalled();
  });

  it('disables the header and shows the reason when disabledReason is set', async () => {
    const user = userEvent.setup();
    const onHeaderClick = vi.fn();
    renderStep({ disabledReason: 'Select account first', onHeaderClick });

    expect(screen.getByText('Select account first')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();

    await user.click(screen.getByRole('button'));

    expect(onHeaderClick).not.toHaveBeenCalled();
  });
});

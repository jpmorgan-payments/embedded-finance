import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { RemoveIntermediaryDialog } from './RemoveIntermediaryDialog';

const noopAsync = vi.fn(async () => undefined);

describe('RemoveIntermediaryDialog', () => {
  test('keeps blocker details stable while ownership data refetches', () => {
    const { rerender } = render(
      <RemoveIntermediaryDialog
        open
        name="Darling Holdings LLC"
        parentName="Marketplace Vendor LLC"
        directChildNames={['Wendy Darling']}
        dependentNames={['Wendy Darling']}
        isPending={false}
        onOpenChange={vi.fn()}
        onConfirm={noopAsync}
      />
    );

    rerender(
      <RemoveIntermediaryDialog
        open
        name="Updated Holdings LLC"
        parentName="Updated Parent LLC"
        directChildNames={[]}
        dependentNames={[]}
        isPending={false}
        onOpenChange={vi.fn()}
        onConfirm={noopAsync}
      />
    );

    expect(
      screen.getByRole('heading', {
        name: 'Remove Darling Holdings LLC from the ownership profile?',
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Wendy Darling');
    expect(
      screen.getByRole('button', {
        name: 'Keep owners and update profile',
      })
    ).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { MaintenanceFormFooter } from './MaintenanceFormFooter';

describe('MaintenanceFormFooter', () => {
  test('keeps original vertical padding without compensating bottom margin', () => {
    render(
      <div className="eb-px-4 eb-pt-4">
        <MaintenanceFormFooter sticky trailing={<button>Save</button>} />
      </div>
    );

    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('eb-py-3', 'eb--mx-4');
    expect(footer).not.toHaveClass('eb--mb-4');
    expect(footer.parentElement).toHaveClass('eb-pt-4');
    expect(footer.parentElement).not.toHaveClass('eb-pb-4', 'eb-p-4');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import { FlowContainer } from './FlowContainer';
import { FlowContextProvider, useFlowContext } from './FlowContext';
import { FlowView } from './FlowView';

describe('FlowContainer', () => {
  it('renders children inline when asModal is false', () => {
    render(
      <FlowContainer
        title="Payment"
        asModal={false}
        onClose={vi.fn()}
        reviewPanel={null}
      >
        <div>Payment Content</div>
      </FlowContainer>
    );

    expect(screen.getByText('Payment Content')).toBeInTheDocument();
  });

  it('renders with header showing title', () => {
    render(
      <FlowContainer
        title="Transfer Funds"
        asModal={false}
        onClose={vi.fn()}
        reviewPanel={null}
      >
        <div>Content</div>
      </FlowContainer>
    );

    expect(screen.getByText('Transfer Funds')).toBeInTheDocument();
  });

  it('hides header when hideHeader prop is true', () => {
    render(
      <FlowContainer
        title="Transfer Funds"
        asModal={false}
        hideHeader
        onClose={vi.fn()}
        reviewPanel={null}
      >
        <div>Content</div>
      </FlowContainer>
    );

    // The title should not appear as a visible heading
    expect(
      screen.queryByRole('heading', { name: 'Transfer Funds' })
    ).not.toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const { container } = render(
      <FlowContainer
        title="Payment"
        asModal={false}
        className="custom-class"
        onClose={vi.fn()}
        reviewPanel={null}
      >
        <div>Content</div>
      </FlowContainer>
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});

describe('FlowView', () => {
  function TestFlowViews() {
    const { currentView, pushView, popView } = useFlowContext();

    return (
      <>
        <span data-testid="current-view">{currentView}</span>
        <FlowView viewId="main">
          <div>Main View</div>
          <button type="button" onClick={() => pushView('payee-type')}>
            Go to Payee
          </button>
        </FlowView>
        <FlowView viewId="payee-type">
          <div>Payee Type View</div>
          <button type="button" onClick={popView}>
            Go Back
          </button>
        </FlowView>
      </>
    );
  }

  it('renders the view matching currentView', () => {
    render(
      <FlowContextProvider>
        <TestFlowViews />
      </FlowContextProvider>
    );

    expect(screen.getByText('Main View')).toBeInTheDocument();
  });

  it('switches views when navigating', async () => {
    const user = userEvent.setup();

    render(
      <FlowContextProvider>
        <TestFlowViews />
      </FlowContextProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Go to Payee' }));
    expect(screen.getByText('Payee Type View')).toBeInTheDocument();
  });

  it('goes back to previous view on popView', async () => {
    const user = userEvent.setup();

    render(
      <FlowContextProvider>
        <TestFlowViews />
      </FlowContextProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Go to Payee' }));
    await user.click(screen.getByRole('button', { name: 'Go Back' }));
    expect(screen.getByText('Main View')).toBeInTheDocument();
  });
});

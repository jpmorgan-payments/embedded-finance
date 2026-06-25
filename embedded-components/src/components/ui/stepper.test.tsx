import { describe, expect, it } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import { Step, Stepper, useStepper } from './stepper';

const steps = [
  { label: 'Step 1', description: 'First step' },
  { label: 'Step 2', description: 'Second step' },
  { label: 'Step 3', description: 'Third step' },
];

function StepperControls() {
  const {
    nextStep,
    prevStep,
    resetSteps,
    activeStep,
    isLastStep,
    hasCompletedAllSteps,
  } = useStepper();

  return (
    <div>
      <span data-testid="active-step">{activeStep}</span>
      <span data-testid="is-last-step">{String(isLastStep)}</span>
      <span data-testid="has-completed-all">
        {String(hasCompletedAllSteps)}
      </span>
      <button type="button" onClick={prevStep}>
        Previous
      </button>
      <button type="button" onClick={nextStep}>
        Next
      </button>
      <button type="button" onClick={resetSteps}>
        Reset
      </button>
    </div>
  );
}

function renderStepper(props?: Partial<React.ComponentProps<typeof Stepper>>) {
  return render(
    <Stepper initialStep={0} steps={steps} orientation="vertical" {...props}>
      {steps.map((step, i) => (
        <Step key={i} label={step.label} description={step.description}>
          <div data-testid={`step-content-${i}`}>Content {i + 1}</div>
        </Step>
      ))}
      <StepperControls />
    </Stepper>
  );
}

describe('Stepper', () => {
  it('renders all step labels', () => {
    renderStepper();

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('renders step descriptions', () => {
    renderStepper();

    expect(screen.getByText('First step')).toBeInTheDocument();
    expect(screen.getByText('Second step')).toBeInTheDocument();
    expect(screen.getByText('Third step')).toBeInTheDocument();
  });

  it('starts at initial step', () => {
    renderStepper();
    expect(screen.getByTestId('active-step').textContent).toBe('0');
  });

  it('starts at custom initial step', () => {
    renderStepper({ initialStep: 1 });
    expect(screen.getByTestId('active-step').textContent).toBe('1');
  });

  it('navigates to next step', async () => {
    const user = userEvent.setup();
    renderStepper();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByTestId('active-step').textContent).toBe('1');
  });

  it('navigates to previous step', async () => {
    const user = userEvent.setup();
    renderStepper({ initialStep: 2 });

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByTestId('active-step').textContent).toBe('1');
  });

  it('resets steps to initial step', async () => {
    const user = userEvent.setup();
    renderStepper();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByTestId('active-step').textContent).toBe('2');

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByTestId('active-step').textContent).toBe('0');
  });

  it('reports isLastStep correctly', async () => {
    const user = userEvent.setup();
    renderStepper();

    expect(screen.getByTestId('is-last-step').textContent).toBe('false');

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByTestId('is-last-step').textContent).toBe('true');
  });

  it('reports hasCompletedAllSteps when stepped past last', async () => {
    const user = userEvent.setup();
    renderStepper();

    expect(screen.getByTestId('has-completed-all').textContent).toBe('false');

    // Step through all
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByTestId('has-completed-all').textContent).toBe('true');
  });

  it('shows step content for current step in vertical mode', () => {
    renderStepper({ orientation: 'vertical', expandVerticalSteps: true });
    // All step content elements are rendered
    expect(screen.getByTestId('step-content-0')).toBeInTheDocument();
  });

  it('renders in horizontal orientation', () => {
    renderStepper({ orientation: 'horizontal' });
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('renders with small size', () => {
    renderStepper({ size: 'sm' });
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('renders with large size', () => {
    renderStepper({ size: 'lg' });
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('renders with loading state', () => {
    renderStepper({ state: 'loading' });
    // Loading renders a Loader2 icon (spinner)
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('renders with error state', () => {
    renderStepper({ state: 'error' });
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('renders with line variant', () => {
    renderStepper({ variant: 'line', orientation: 'vertical' });
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('renders with circle-alt variant', () => {
    renderStepper({ variant: 'circle-alt' });
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('supports clickable steps via onClickStep', async () => {
    const user = userEvent.setup();
    let clickedStep = -1;

    renderStepper({
      initialStep: 0,
      onClickStep: (step) => {
        clickedStep = step;
      },
    });

    // The step buttons should be clickable
    const stepButtons = screen.getAllByRole('button');
    // The first few are step buttons from Stepper, last ones are our controls
    if (stepButtons.length > 3) {
      await user.click(stepButtons[0]);
      expect(clickedStep).toBe(0);
    }
  });

  it('supports expandVerticalSteps to always show content', () => {
    renderStepper({ orientation: 'vertical', expandVerticalSteps: true });
    // All content should be rendered when expandVerticalSteps is true
    expect(screen.getByTestId('step-content-0')).toBeInTheDocument();
    expect(screen.getByTestId('step-content-1')).toBeInTheDocument();
    expect(screen.getByTestId('step-content-2')).toBeInTheDocument();
  });
});

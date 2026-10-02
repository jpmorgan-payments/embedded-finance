import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_DWELL_MS, slidesForTrack } from './deck-state';
import { PresentationApp, type PresentationState } from './presentation-app';
import { SLIDE_VIEWS } from './slide-views';
import { SLIDES } from './slides';

function lastState(spy: ReturnType<typeof vi.fn>): PresentationState {
  return spy.mock.calls[spy.mock.calls.length - 1][0] as PresentationState;
}

function currentSlide() {
  return document.querySelector('section[aria-roledescription="slide"]');
}

describe('PresentationApp', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens on the title slide in light theme', () => {
    render(<PresentationApp />);
    expect(currentSlide()).toHaveAttribute(
      'aria-label',
      `1 of ${SLIDES.length}: Partially Hosted UI`
    );
    expect(document.querySelector('.ph-root')).toHaveAttribute(
      'data-theme',
      'light'
    );
    expect(document.documentElement).toHaveClass('ph-deck-active');
  });

  it('steps through builds before moving to the next slide', () => {
    const onStateChange = vi.fn();
    render(
      <PresentationApp
        initial={{ slide: 'split' }}
        onStateChange={onStateChange}
      />
    );
    const builds = SLIDES.find((s) => s.id === 'split')!.builds;

    for (let i = 1; i <= builds; i += 1) {
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(lastState(onStateChange)).toMatchObject({
        slide: 'split',
        step: i,
      });
    }
    fireEvent.keyDown(window, { key: 'PageDown' });
    expect(lastState(onStateChange)).toMatchObject({
      slide: 'options',
      step: 0,
    });

    fireEvent.keyDown(window, { key: 'PageUp' });
    expect(lastState(onStateChange)).toMatchObject({
      slide: 'split',
      step: builds,
    });
  });

  it('filters the deck by audience and keeps the current slide when it belongs', async () => {
    const user = userEvent.setup();
    const onStateChange = vi.fn();
    render(
      <PresentationApp
        initial={{ slide: 'sequence' }}
        onStateChange={onStateChange}
      />
    );

    await user.selectOptions(screen.getByLabelText('Audience'), 'decision');

    const decision = slidesForTrack(SLIDES, 'decision');
    const index = decision.findIndex((s) => s.id === 'sequence') + 1;
    expect(lastState(onStateChange)).toMatchObject({
      slide: 'sequence',
      track: 'decision',
    });
    expect(
      screen.getByText(`${index} / ${decision.length}`)
    ).toBeInTheDocument();
  });

  it('moves to the next slide in the track when the current one is filtered out', async () => {
    const user = userEvent.setup();
    const onStateChange = vi.fn();
    render(
      <PresentationApp
        initial={{ slide: 'session-api' }}
        onStateChange={onStateChange}
      />
    );

    await user.selectOptions(screen.getByLabelText('Audience'), 'decision');

    expect(lastState(onStateChange)).toMatchObject({
      slide: 'experiences',
      step: 0,
    });
  });

  it('toggles dark theme from the keyboard and the toolbar', async () => {
    const user = userEvent.setup();
    render(<PresentationApp />);
    const root = document.querySelector('.ph-root');

    fireEvent.keyDown(window, { key: 't' });
    expect(root).toHaveAttribute('data-theme', 'dark');

    await user.click(screen.getByRole('button', { name: 'Dark theme' }));
    expect(root).toHaveAttribute('data-theme', 'light');
  });

  it('jumps to a slide from the overview grid', async () => {
    const user = userEvent.setup();
    const onStateChange = vi.fn();
    render(<PresentationApp onStateChange={onStateChange} />);

    fireEvent.keyDown(window, { key: 'g' });
    const dialog = screen.getByRole('dialog', { name: 'Slide overview' });
    await user.click(
      within(dialog).getByRole('button', { name: /The 2,047-character budget/ })
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(lastState(onStateChange)).toMatchObject({
      slide: 'url-budget',
      step: 0,
    });
  });

  it('shows speaker notes for the current slide', () => {
    render(<PresentationApp initial={{ slide: 'utility' }} />);
    fireEvent.keyDown(window, { key: 'n' });
    const notes = screen.getByRole('complementary', { name: 'Speaker notes' });
    expect(notes).toHaveTextContent(
      SLIDES.find((s) => s.id === 'utility')!.notes
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(
      screen.queryByRole('complementary', { name: 'Speaker notes' })
    ).not.toBeInTheDocument();
  });

  it('ignores navigation keys while a form control has focus', () => {
    const onStateChange = vi.fn();
    render(<PresentationApp onStateChange={onStateChange} />);
    const select = screen.getByLabelText('Audience');

    fireEvent.keyDown(select, { key: 'ArrowRight' });
    expect(lastState(onStateChange)).toMatchObject({
      slide: 'welcome',
      step: 0,
    });
  });

  it('auto-plays one step per dwell and stops at the end', () => {
    vi.useFakeTimers();
    const onStateChange = vi.fn();
    const last = SLIDES[SLIDES.length - 1];
    const penultimate = SLIDES[SLIDES.length - 2];
    render(
      <PresentationApp
        initial={{
          slide: penultimate.id,
          step: penultimate.builds,
          autoplay: true,
        }}
        onStateChange={onStateChange}
      />
    );

    act(() => {
      vi.advanceTimersByTime(penultimate.dwellMs ?? DEFAULT_DWELL_MS);
    });
    const states = onStateChange.mock.calls.map(
      ([s]) => s as PresentationState
    );
    expect(states).toContainEqual(
      expect.objectContaining({ slide: last.id, autoplay: true })
    );
    expect(lastState(onStateChange)).toMatchObject({
      slide: last.id,
      autoplay: false,
    });
  });

  it('has a view for every slide that renders at every build step', () => {
    for (const slide of SLIDES) {
      expect(SLIDE_VIEWS[slide.id]).toBeDefined();
      for (let step = 0; step <= slide.builds; step += 1) {
        const { unmount } = render(
          <PresentationApp initial={{ slide: slide.id, step }} />
        );
        expect(currentSlide()).toHaveAttribute(
          'aria-label',
          expect.stringContaining(slide.title)
        );
        unmount();
      }
    }
  });
});

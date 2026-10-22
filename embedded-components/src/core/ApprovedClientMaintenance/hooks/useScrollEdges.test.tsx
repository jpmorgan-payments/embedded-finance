import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { useScrollEdges } from './useScrollEdges';

function ScrollProbe() {
  const [ref, edges] = useScrollEdges<HTMLDivElement>();
  return (
    <div ref={ref} data-testid="scroller" data-edges={JSON.stringify(edges)}>
      <div />
    </div>
  );
}

const setScrollMetrics = (
  element: HTMLElement,
  metrics: { scrollTop: number; clientHeight: number; scrollHeight: number }
) => {
  Object.defineProperty(element, 'clientHeight', {
    configurable: true,
    value: metrics.clientHeight,
  });
  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    value: metrics.scrollHeight,
  });
  element.scrollTop = metrics.scrollTop;
};

describe('useScrollEdges', () => {
  test('reports hidden content above and below as the container scrolls', () => {
    render(<ScrollProbe />);
    const scroller = screen.getByTestId('scroller');

    setScrollMetrics(scroller, {
      scrollTop: 0,
      clientHeight: 400,
      scrollHeight: 1000,
    });
    fireEvent.scroll(scroller);
    expect(JSON.parse(scroller.dataset.edges!)).toEqual({
      above: false,
      below: true,
    });

    setScrollMetrics(scroller, {
      scrollTop: 300,
      clientHeight: 400,
      scrollHeight: 1000,
    });
    fireEvent.scroll(scroller);
    expect(JSON.parse(scroller.dataset.edges!)).toEqual({
      above: true,
      below: true,
    });

    setScrollMetrics(scroller, {
      scrollTop: 600,
      clientHeight: 400,
      scrollHeight: 1000,
    });
    fireEvent.scroll(scroller);
    expect(JSON.parse(scroller.dataset.edges!)).toEqual({
      above: true,
      below: false,
    });
  });

  test('reports nothing when the content fits', () => {
    render(<ScrollProbe />);
    expect(JSON.parse(screen.getByTestId('scroller').dataset.edges!)).toEqual({
      above: false,
      below: false,
    });
  });
});

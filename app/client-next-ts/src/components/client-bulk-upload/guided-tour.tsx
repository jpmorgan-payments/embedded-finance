import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface TourStep {
  /** Matches a `data-tour` attribute on the element to highlight. */
  target: string;
  title: string;
  body: ReactNode;
  example?: string;
}

interface GuidedTourProps {
  steps: TourStep[];
  open: boolean;
  onClose: (completed: boolean) => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const CARD_WIDTH = 352;
const CARD_HEIGHT_ESTIMATE = 260;
const GAP = 12;
const SPOTLIGHT_PADDING = 4;

const nextFrame = (callback: () => void): number =>
  typeof window.requestAnimationFrame === 'function'
    ? window.requestAnimationFrame(callback)
    : window.setTimeout(callback, 16);

const cancelFrame = (id: number) =>
  typeof window.cancelAnimationFrame === 'function'
    ? window.cancelAnimationFrame(id)
    : window.clearTimeout(id);

function findTarget(target: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
}

/**
 * Non-blocking coach marks: the page stays usable (focus is not trapped), so
 * people can start typing in the highlighted field while the tip is visible.
 */
export function GuidedTour({ steps, open, onClose }: GuidedTourProps) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardHeight, setCardHeight] = useState(CARD_HEIGHT_ESTIMATE);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const step = steps[index];
  const isLast = index === steps.length - 1;

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open || !step) return;
    const element = findTarget(step.target);
    element?.scrollIntoView?.({
      block: 'nearest',
      inline: 'center',
      behavior: 'smooth',
    });
    if (index > 0) nextButtonRef.current?.focus({ preventScroll: true });
  }, [open, step, index]);

  useEffect(() => {
    if (!open || !step) return;
    let frame = 0;
    const measure = () => {
      const element = findTarget(step.target);
      const box = element?.getBoundingClientRect();
      setRect((current) => {
        if (!box) return null;
        const next = {
          top: box.top,
          left: box.left,
          width: box.width,
          height: box.height,
        };
        return current &&
          current.top === next.top &&
          current.left === next.left &&
          current.width === next.width &&
          current.height === next.height
          ? current
          : next;
      });
      const height = cardRef.current?.offsetHeight;
      if (height) {
        setCardHeight((current) => (current === height ? current : height));
      }
      frame = nextFrame(measure);
    };
    measure();
    return () => cancelFrame(frame);
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open || !step || typeof document === 'undefined') return null;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const cardWidth = Math.min(CARD_WIDTH, viewportWidth - 32);
  let cardStyle: CSSProperties;
  if (rect) {
    const left = Math.min(
      Math.max(16, rect.left),
      Math.max(16, viewportWidth - cardWidth - 16)
    );
    const below = rect.top + rect.height + GAP;
    const above = rect.top - GAP - cardHeight;
    const top =
      below + cardHeight <= viewportHeight - 16
        ? below
        : above >= 16
          ? above
          : Math.max(16, viewportHeight - cardHeight - 16);
    cardStyle = { top, left, width: cardWidth };
  } else {
    cardStyle = {
      top: '50%',
      left: '50%',
      width: cardWidth,
      transform: 'translate(-50%, -50%)',
    };
  }

  const titleId = `guided-tour-title-${index}`;

  return createPortal(
    <>
      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[55] rounded-md ring-2 ring-sp-brand ring-offset-2 transition-all duration-200"
          style={{
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
            boxShadow: '0 0 0 9999px rgba(17, 24, 39, 0.35)',
          }}
        />
      ) : (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[55] bg-gray-900/35"
        />
      )}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-describedby={`${titleId}-body`}
        className="fixed z-[60] rounded-lg border border-jpm-gray-200 bg-white p-4 shadow-2xl"
        style={cardStyle}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-sp-brand">
            Quick tour · {index + 1} of {steps.length}
          </p>
          <button
            type="button"
            onClick={() => onClose(false)}
            className="-mr-1 -mt-1 rounded p-1 text-jpm-gray-400 hover:bg-jpm-gray-100 hover:text-jpm-gray-700"
            aria-label="Close tour"
          >
            <X className="size-4" />
          </button>
        </div>
        <h2
          id={titleId}
          className="mt-1 text-base font-semibold text-jpm-gray-900"
        >
          {step.title}
        </h2>
        <div
          id={`${titleId}-body`}
          aria-live="polite"
          className="mt-1 space-y-2 text-sm text-jpm-gray-700"
        >
          {step.body}
        </div>
        {step.example ? (
          <p className="mt-3 rounded-md border border-dashed border-sp-brand/50 bg-sp-accent px-2.5 py-1.5 text-xs text-jpm-gray-800">
            <span className="font-semibold text-sp-brand-800">Example: </span>
            <span className="font-mono">{step.example}</span>
          </p>
        ) : null}
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex gap-1" aria-hidden>
            {steps.map((s, i) => (
              <span
                key={s.target}
                className={cn(
                  'size-1.5 rounded-full',
                  i === index ? 'bg-sp-brand' : 'bg-jpm-gray-300'
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {index === 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onClose(false)}
              >
                Skip
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIndex(index - 1)}
              >
                Back
              </Button>
            )}
            <Button
              ref={nextButtonRef}
              type="button"
              size="sm"
              onClick={() => (isLast ? onClose(true) : setIndex(index + 1))}
            >
              {isLast ? 'Start entering clients' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
  children: string;
  className?: string;
  highlightStep?: number | number[];
}

export function Mermaid({ children, className, highlightStep }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2, 11)}`);

  useEffect(() => {
    if (!ref.current || !children) return;

    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });

    const id = idRef.current;
    const container = ref.current;
    let cancelled = false;

    void mermaid
      .render(id, children.trim())
      .then(({ svg }) => {
        if (cancelled || !container) return;

        container.innerHTML = svg;

        const svgRoot = container.querySelector<SVGSVGElement>('svg');
        if (!svgRoot) return;

        svgRoot.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svgRoot.style.width = '100%';
        svgRoot.style.height = 'auto';

        // Style participant boxes (rects) with primary brand color
        const participantRects = svgRoot.querySelectorAll<SVGRectElement>(
          'rect.actor, rect.actor-top, rect.actor-bottom'
        );
        participantRects.forEach((rect) => {
          rect.style.fill = '#1A7B99';
          rect.style.stroke = '#1A7B99';
        });

        // Style all participant text to white (including tspan elements)
        const allTexts = svgRoot.querySelectorAll<SVGTextElement>('text');
        allTexts.forEach((text) => {
          // Check if this text is inside a participant box (actor)
          const parentGroup = text.closest('g');
          const hasActorRect =
            parentGroup &&
            parentGroup.querySelector(
              'rect.actor, rect.actor-top, rect.actor-bottom'
            );
          const isActorGroup =
            parentGroup && parentGroup.classList.contains('actor');

          if (hasActorRect || isActorGroup) {
            text.style.fill = '#ffffff';
            // Also style any tspan children
            const tspans = text.querySelectorAll<SVGTSpanElement>('tspan');
            tspans.forEach((tspan) => {
              tspan.style.fill = '#ffffff';
            });
          }
        });

        // Style all message lines to brand color
        const allLines = svgRoot.querySelectorAll<SVGPathElement>(
          'path.messageLine0, path.messageLine1'
        );
        allLines.forEach((line) => {
          line.style.stroke = '#1A7B99';
        });

        if (highlightStep != null) {
          const stepsToHighlight = Array.isArray(highlightStep)
            ? highlightStep
            : [highlightStep];

          const texts = Array.from(
            svgRoot.querySelectorAll<SVGTextElement>('text')
          );

          texts.forEach((textEl) => {
            const content = textEl.textContent ?? '';
            const matchesStep = stepsToHighlight.some((step) =>
              content.trim().startsWith(`(${step})`)
            );

            if (!matchesStep) return;

            textEl.style.fill = '#1A7B99';
            textEl.style.fontWeight = '600';

            const group = textEl.closest<SVGGElement>('g');
            if (!group) return;

            const line = group.querySelector<SVGPathElement>('path');
            if (line) {
              line.style.stroke = '#1A7B99';
              line.style.strokeWidth = '2';
            }
          });
        }
      })
      .catch((error) => {
        if (cancelled || !container) return;
        // eslint-disable-next-line no-console
        console.error('Mermaid rendering error:', error);
        container.innerHTML = `<pre style="color: red; padding: 1rem;">Mermaid Error: ${error.message}</pre>`;
      });

    return () => {
      cancelled = true;
    };
  }, [children, highlightStep]);

  return (
    <div
      ref={ref}
      className={className ?? 'mermaid-container'}
      style={{ minHeight: '200px' }}
    />
  );
}

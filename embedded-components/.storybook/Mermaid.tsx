import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
  /**
   * The Mermaid diagram code to render
   */
  children: string;
}

/**
 * Mermaid diagram component for Storybook MDX files.
 *
 * Usage in MDX:
 * ```tsx
 * <Mermaid>
 * {`
 * graph TD
 *   A[Start] --> B[End]
 * `}
 * </Mermaid>
 * ```
 */
export function Mermaid({ children }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!ref.current || !children) return;

    // Initialize Mermaid if not already initialized
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });

    // Clear previous content
    ref.current.innerHTML = '';

    // Create a unique ID for this diagram
    const id = idRef.current;

    // Render the diagram
    mermaid
      .render(id, children.trim())
      .then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      })
      .catch((error) => {
        console.error('Mermaid rendering error:', error);
        if (ref.current) {
          ref.current.innerHTML = `<pre style="color: red;">Mermaid Error: ${error.message}</pre>`;
        }
      });
  }, [children]);

  return <div ref={ref} className="mermaid-container" />;
}

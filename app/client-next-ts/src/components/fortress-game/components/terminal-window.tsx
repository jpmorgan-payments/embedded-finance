// =============================================================================
// TerminalWindow — CRT-style scrolling terminal display
// =============================================================================

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TerminalLine } from '../types';
import { BusyBar } from './busy-bar';

interface TerminalWindowProps {
  lines: TerminalLine[];
  title?: string;
  /** Rendered as a live last line while a request is in flight. */
  pending?: string | null;
}

const lineColorMap: Record<TerminalLine['type'], string> = {
  input: '#00ff41',
  output: '#c0c0c0',
  error: '#ff0040',
  success: '#00ff41',
  info: '#00bfff',
  warning: '#ffb800',
  attack: '#ff0040',
};

export function TerminalWindow({ lines, title = 'TERMINAL', pending }: TerminalWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, pending]);

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="dot red" />
          <span className="dot yellow" />
          <span className="dot green" />
        </div>
        <span className="terminal-title">{title}</span>
        {pending && <span className="terminal-status">● WORKING</span>}
      </div>
      <div className="terminal-body" ref={scrollRef}>
        <AnimatePresence>
          {lines.map((line) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className="terminal-line"
              style={{ color: lineColorMap[line.type] || '#c0c0c0' }}
            >
              {line.type === 'input' && <span className="prompt">{'> '}</span>}
              {line.type === 'error' && <span className="prompt">{'✗ '}</span>}
              {line.type === 'success' && <span className="prompt">{'✓ '}</span>}
              {line.type === 'warning' && <span className="prompt">{'⚠ '}</span>}
              {line.type === 'attack' && <span className="prompt">{'☠ '}</span>}
              <span style={{ whiteSpace: 'pre-wrap' }}>{line.content}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {pending ? <BusyBar label={pending} inline /> : <span className="cursor-blink">█</span>}
      </div>
    </div>
  );
}

// =============================================================================
// DemoShortcuts — Floating panel for jumping to any round/phase during demos
// Toggle with Ctrl+D (or Cmd+D on Mac)
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../game/game-store';
import { rounds } from '../rounds/round-configs';
import type { RoundPhase } from '../types';

const PHASES: { key: RoundPhase; label: string; short: string }[] = [
  { key: 'BRIEFING', label: 'Briefing', short: 'BRF' },
  { key: 'BUILD', label: 'Build API', short: 'BLD' },
  { key: 'ATTACK_INCOMING', label: 'Attack', short: 'ATK' },
  { key: 'DEFEND', label: 'Defend', short: 'DEF' },
  { key: 'RESULT', label: 'Result', short: 'RES' },
];

export function DemoShortcuts() {
  const [open, setOpen] = useState(false);
  const jumpToRound = useGameStore((s) => s.jumpToRound);
  const setScreen = useGameStore((s) => s.setScreen);
  const currentRound = useGameStore((s) => s.currentRound);
  const currentPhase = useGameStore((s) => s.currentPhase);
  const screen = useGameStore((s) => s.screen);

  const handleToggle = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleToggle);
    return () => window.removeEventListener('keydown', handleToggle);
  }, [handleToggle]);

  const handleJump = (roundId: number, phase: RoundPhase) => {
    jumpToRound(roundId, phase);
  };

  const isActive = (roundId: number, phase: RoundPhase) =>
    screen === 'GAME' && currentRound === roundId && currentPhase === phase;

  return (
    <>
      {/* Floating toggle button */}
      <button
        className="demo-toggle"
        onClick={() => setOpen((prev) => !prev)}
        title="Demo Shortcuts (Ctrl+D)"
      >
        {open ? '✕' : '⚡'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="demo-panel"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.2 }}
          >
            <div className="demo-panel-header">
              <span>⚡ DEMO SHORTCUTS</span>
              <span className="demo-hint">Ctrl+D to toggle</span>
            </div>

            <div className="demo-nav-row">
              <button
                className={`demo-nav-btn ${screen === 'START' ? 'active' : ''}`}
                onClick={() => setScreen('START')}
              >
                START
              </button>
              <button
                className={`demo-nav-btn ${screen === 'DASHBOARD' ? 'active' : ''}`}
                onClick={() => setScreen('DASHBOARD')}
              >
                DASHBOARD
              </button>
            </div>

            <div className="demo-rounds">
              {rounds.map((round) => (
                <div key={round.id} className="demo-round-row">
                  <div className="demo-round-label">
                    R{round.id}: {round.title}
                  </div>
                  <div className="demo-phase-btns">
                    {PHASES.map((phase) => (
                      <button
                        key={phase.key}
                        className={`demo-phase-btn ${isActive(round.id, phase.key) ? 'active' : ''}`}
                        onClick={() => handleJump(round.id, phase.key)}
                        title={phase.label}
                      >
                        {phase.short}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="demo-panel-footer">
              <span className="demo-state">
                {screen === 'GAME'
                  ? `R${currentRound} · ${currentPhase}`
                  : screen}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

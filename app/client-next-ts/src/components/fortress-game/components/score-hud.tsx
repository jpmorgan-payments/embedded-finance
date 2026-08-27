// =============================================================================
// ScoreHUD — Heads-up display showing round, score, health, timer
// =============================================================================

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../game/game-store';
import { TOTAL_ROUNDS } from '../rounds/round-configs';
import { FieldGuide } from './field-guide';

export function ScoreHUD() {
  const { currentRound, score, platformHealth, currentPhase, roundStartTime, mode, busyLabel } =
    useGameStore();
  const [elapsed, setElapsed] = useState(0);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - roundStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [roundStartTime]);

  const healthColor =
    platformHealth > 60 ? '#00ff41' : platformHealth > 30 ? '#ffb800' : '#ff0040';

  return (
    <div className="score-hud">
      <div className="hud-item">
        <span className="hud-label">MISSION</span>
        <span className="hud-value">
          {mode === 'BLITZ' ? `${currentRound} · BLITZ` : `${currentRound}/${TOTAL_ROUNDS}`}
        </span>
      </div>
      <div className="hud-item">
        <span className="hud-label">PHASE</span>
        <span className={`hud-value phase-badge ${busyLabel ? 'busy' : ''}`}>
          {busyLabel ? 'WORKING…' : currentPhase.replace('_', ' ')}
        </span>
      </div>
      <div className="hud-item">
        <span className="hud-label">SCORE</span>
        <motion.span
          key={score}
          className="hud-value"
          initial={{ scale: 1.3, color: '#ffb800' }}
          animate={{ scale: 1, color: '#00ff41' }}
          transition={{ duration: 0.3 }}
        >
          {score}
        </motion.span>
      </div>
      <div className="hud-item">
        <span className="hud-label">HEALTH</span>
        <div className="health-bar-container">
          <motion.div
            className="health-bar-fill"
            style={{ backgroundColor: healthColor }}
            animate={{ width: `${platformHealth}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="hud-value" style={{ color: healthColor }}>
          {platformHealth}%
        </span>
      </div>
      <div className="hud-item">
        <span className="hud-label">TIME</span>
        <span className="hud-value">{elapsed}s</span>
      </div>
      <button
        className="hud-guide"
        onClick={() => setShowGuide(true)}
        title="Open the mission and API guide"
      >
        ◈ GUIDE
      </button>
      <AnimatePresence>
        {showGuide && <FieldGuide onClose={() => setShowGuide(false)} />}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// RoundResult — Summary screen after each round
// =============================================================================

import { motion } from 'framer-motion';
import { useGameStore } from '../game/game-store';
import { TOTAL_ROUNDS } from '../rounds/round-configs';
import { lookupError } from '../data/error-catalog';
import type { RoundConfig } from '../types';

interface RoundResultProps {
  round: RoundConfig;
}

export function RoundResult({ round }: RoundResultProps) {
  const { roundResults, currentRound, nextRound, platformHealth, mode } = useGameStore();
  const result = roundResults.find((r) => r.roundId === round.id);

  if (!result) return null;

  const isLastRound = mode === 'BLITZ' || currentRound >= TOTAL_ROUNDS;

  return (
    <div className="round-result">
      <motion.div
        className="result-header"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h2>MISSION {round.id} COMPLETE</h2>
        <h3>{round.title}</h3>
      </motion.div>

      <motion.div
        className="result-scores"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="score-row">
          <span className="score-label">Request:</span>
          <span className="score-value">+{result.apiScore}</span>
        </div>
        {result.apiNote && <div className="score-note">{result.apiNote}</div>}
        <div className="score-row">
          <span className="score-label">
            Response{result.defendedByApiCall ? ' (API request)' : ''}:
          </span>
          <span className={`score-value ${result.attackDefended ? 'defended' : 'breached'}`}>
            {result.defenseScore > 0 ? '+' : ''}
            {result.defenseScore}
          </span>
        </div>
        {result.defenseNote && <div className="score-note">{result.defenseNote}</div>}
        <div className="score-row">
          <span className="score-label">Time Bonus:</span>
          <span className="score-value">+{result.timeBonus}</span>
        </div>
        <div className="score-note">
          {result.timeTaken}s used · 1 point removed every 3 seconds
        </div>
        <div className="score-row total">
          <span className="score-label">ROUND TOTAL:</span>
          <span className="score-value">{result.totalScore}</span>
        </div>
      </motion.div>

      {result.errorCodes.length > 0 && (
        <motion.div
          className="result-codes"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.4 }}
        >
          <span className="result-codes-title">ERROR CODES SEEN</span>
          {result.errorCodes.map((code) => {
            const entry = lookupError(code);
            if (!entry) return null;
            return (
              <div key={code} className="result-code">
                <span className="result-code-id">{entry.code}</span>
                <span className="result-code-msg">{entry.message}</span>
              </div>
            );
          })}
        </motion.div>
      )}

      <motion.div
        className="result-status"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <div className={`defense-result ${result.attackDefended ? 'success' : 'fail'}`}>
          {result.attackDefended
            ? result.defendedByApiCall
              ? '✓ THREAT STOPPED WITH AN API REQUEST'
              : '✓ THREAT STOPPED'
            : '✗ RESPONSE FAILED'}
        </div>
        <div className="platform-status">HEALTH: {platformHealth}%</div>
      </motion.div>

      <motion.button
        className="btn-primary"
        onClick={nextRound}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.3 }}
      >
        {isLastRound ? '[ VIEW FINAL SCORE ]' : `[ START MISSION ${currentRound + 1} ]`}
      </motion.button>
    </div>
  );
}

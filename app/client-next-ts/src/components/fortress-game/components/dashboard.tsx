// =============================================================================
// Dashboard — Post-game summary with round-by-round breakdown
// =============================================================================

import { motion } from 'framer-motion';
import { useGameStore } from '../game/game-store';
import { Leaderboard } from './leaderboard';
import { rounds } from '../rounds/round-configs';

export function Dashboard() {
  const { playerName, score, platformHealth, roundResults, resetGame } =
    useGameStore();

  const finalScore = Math.round(score * (platformHealth / 100));
  const attacksDefended = roundResults.filter((r) => r.attackDefended).length;

  return (
    <div className="dashboard">
      <motion.div
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>GAME SUMMARY</h1>
        {playerName && <h2>Player: {playerName}</h2>}
      </motion.div>

      {roundResults.length > 0 && (
        <motion.div
          className="dashboard-summary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="summary-grid">
            <div className="summary-card">
              <span className="card-label">FINAL SCORE</span>
              <span className="card-value big">{finalScore}</span>
            </div>
            <div className="summary-card">
              <span className="card-label">PLATFORM HEALTH</span>
              <span
                className="card-value"
                style={{
                  color:
                    platformHealth > 60
                      ? '#00ff41'
                      : platformHealth > 30
                        ? '#ffb800'
                        : '#ff0040',
                }}
              >
                {platformHealth}%
              </span>
            </div>
            <div className="summary-card">
              <span className="card-label">ATTACKS DEFENDED</span>
              <span className="card-value">{attacksDefended}/{roundResults.length}</span>
            </div>
            <div className="summary-card">
              <span className="card-label">BASE SCORE</span>
              <span className="card-value">{score}</span>
            </div>
          </div>

          <div className="round-breakdown">
            <h3>MISSION SCORES</h3>
            {roundResults.map((result) => {
              const roundConfig = rounds.find((r) => r.id === result.roundId);
              return (
                <motion.div
                  key={result.roundId}
                  className="breakdown-row"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: result.roundId * 0.1, duration: 0.3 }}
                >
                  <div className="breakdown-left">
                    <span className="breakdown-round">R{result.roundId}</span>
                    <span className="breakdown-title">
                      {roundConfig?.title || 'Unknown'}
                    </span>
                  </div>
                  <div className="breakdown-scores">
                    <span>REQUEST: +{result.apiScore}</span>
                    <span className={result.attackDefended ? 'defended' : 'breached'}>
                      RESPONSE: {result.defenseScore > 0 ? '+' : ''}{result.defenseScore}
                    </span>
                    <span>TIME: +{result.timeBonus}</span>
                  </div>
                  <div className="breakdown-right">
                    <span className={`defense-badge ${result.attackDefended ? 'ok' : 'fail'}`}>
                      {result.attackDefended ? '✓' : '✗'}
                    </span>
                    <span className="breakdown-total">{result.totalScore}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      <Leaderboard />

      <motion.div
        className="dashboard-actions"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <button className="btn-primary" onClick={resetGame}>
          [ PLAY AGAIN ]
        </button>
      </motion.div>
    </div>
  );
}

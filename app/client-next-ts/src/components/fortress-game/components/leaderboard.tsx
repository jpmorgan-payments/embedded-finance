// =============================================================================
// Leaderboard — Top scores display
// =============================================================================

import { motion } from 'framer-motion';
import { useGameStore } from '../game/game-store';

export function Leaderboard() {
  const { leaderboard } = useGameStore();

  return (
    <div className="leaderboard">
      <h3 className="lb-heading">LEADERBOARD</h3>
      <div className="lb-table">
        <div className="lb-row lb-header-row">
          <span className="lb-rank">#</span>
          <span className="lb-name">NAME</span>
          <span className="lb-score">SCORE</span>
          <span className="lb-health">HEALTH</span>
        </div>
        {leaderboard.map((entry, i) => (
          <motion.div
            key={`${entry.playerName}-${i}`}
            className={`lb-row ${i < 3 ? `top-${i + 1}` : ''}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
          >
            <span className="lb-rank">{i + 1}</span>
            <span className="lb-name">{entry.playerName}</span>
            <span className="lb-score">{entry.totalScore}</span>
            <span className="lb-health">{entry.platformHealth}%</span>
          </motion.div>
        ))}
        {leaderboard.length === 0 && (
          <div className="lb-row empty">No scores yet. Be the first!</div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// RoundBriefing — Mission briefing screen before each round
// =============================================================================

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { RoundConfig } from '../types';
import { useGameStore } from '../game/game-store';

interface RoundBriefingProps {
  round: RoundConfig;
}

export function RoundBriefing({ round }: RoundBriefingProps) {
  const { setPhase, addTerminalLine, setRoundStartTime } = useGameStore();
  const [displayedText, setDisplayedText] = useState('');
  const [showButton, setShowButton] = useState(false);

  // Typewriter effect
  useEffect(() => {
    setDisplayedText('');
    setShowButton(false);
    let i = 0;
    const text = round.briefing;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setShowButton(true);
      }
    }, 8);
    return () => clearInterval(interval);
  }, [round]);

  const handleStart = () => {
    addTerminalLine({
      type: 'info',
      content: `--- ROUND ${round.id}: ${round.title} ---`,
    });
    addTerminalLine({
      type: 'info',
      content: `Endpoint: ${round.apiMethod} ${round.apiEndpoint}`,
    });
    addTerminalLine({
      type: 'info',
      content: `Fields to check: ${round.requiredFields.join(', ')}`,
    });
    setRoundStartTime(Date.now());
    setPhase('BUILD');
  };

  return (
    <div className="round-briefing">
      <motion.div
        className="briefing-header"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className="round-number">ROUND {round.id}</span>
        <h2 className="round-title">{round.title}</h2>
        <p className="round-subtitle">{round.subtitle}</p>
      </motion.div>

      <div className="briefing-text">
        <pre>{displayedText}</pre>
        <span className="cursor-blink">█</span>
      </div>

      {showButton && (
        <motion.button
          className="btn-primary"
          onClick={handleStart}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          [ START MISSION ]
        </motion.button>
      )}

      <div className="briefing-meta">
        <span>TIME: {round.buildTimeLimit}s</span>
        <span>API: {round.apiMethod} {round.apiEndpoint}</span>
      </div>
    </div>
  );
}

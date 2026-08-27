// =============================================================================
// AttackAlert — Animated alert when an attack is incoming
// =============================================================================

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { AttackScenario } from '../types';
import { useGameStore } from '../game/game-store';
import { hydratePayload, hydrateText } from '../game/grading';

interface AttackAlertProps {
  attack: AttackScenario;
}

export function AttackAlert({ attack }: AttackAlertProps) {
  const { setPhase, addTerminalLine } = useGameStore();
  const clientId = useGameStore((s) => s.clientId);
  const accountId = useGameStore((s) => s.accountId);
  const recipientId = useGameStore((s) => s.recipientId);
  const subscriptionId = useGameStore((s) => s.subscriptionId);
  const [displayedText, setDisplayedText] = useState('');
  const [showButton, setShowButton] = useState(false);
  const announcedFor = useRef<string | null>(null);

  const tokens = { clientId, accountId, recipientId, subscriptionId };

  useEffect(() => {
    // StrictMode re-runs effects in development; only announce each attack once.
    if (announcedFor.current !== attack.id) {
      announcedFor.current = attack.id;
      addTerminalLine({ type: 'attack', content: `THREAT: ${attack.name}` });
      addTerminalLine({
        type: 'attack',
        content: `OWASP: ${attack.owaspCode} — ${attack.owaspCategory}`,
      });
    }

    setDisplayedText('');
    setShowButton(false);
    let i = 0;
    const text = hydrateText(attack.narrative, tokens);
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setShowButton(true);
      }
    }, 6);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attack]);

  return (
    <div className="attack-alert">
      <motion.div
        className="attack-header"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="alert-icon">⚠</div>
        <h2 className="attack-name">{attack.name}</h2>
        <div className="owasp-badge">
          <span className="owasp-code">{attack.owaspCode}</span>
          <span className="owasp-cat">{attack.owaspCategory}</span>
        </div>
        <span className="attack-type-badge" data-type={attack.type}>
          {attack.type}
        </span>
      </motion.div>

      <div className="attack-narrative">
        <pre>{displayedText}</pre>
        <span className="cursor-blink">█</span>
      </div>

      {attack.attackPayload && (
        <motion.div
          className="attack-payload"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <span className="payload-label">REQUEST DETAILS:</span>
          <pre>{JSON.stringify(hydratePayload(attack.attackPayload, tokens), null, 2)}</pre>
        </motion.div>
      )}

      {showButton && (
        <motion.button
          className="btn-danger"
          onClick={() => setPhase('DEFEND')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          [ CHOOSE A RESPONSE ]
        </motion.button>
      )}
    </div>
  );
}

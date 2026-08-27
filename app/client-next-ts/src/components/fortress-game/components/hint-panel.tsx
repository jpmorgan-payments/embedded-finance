// =============================================================================
// HintPanel — progressive, priced help for the JSON editors
// Tier 1 names the problem, tier 2 explains the rule, tier 3 rewrites the payload.
// Every tier is re-evaluated against the payload in the editor RIGHT NOW, so a
// fault the player has already corrected is never mentioned or re-applied.
// =============================================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../game/game-store';
import { HINT_COSTS } from '../types';
import type { HintLadder, HintContext, HintFault } from '../types';

const TIER_LABELS = ['CLUE', 'EXPLAIN', 'FIX IT'];

interface HintPanelProps {
  hints: HintLadder;
  /** The payload currently in the editor, parsed. Empty object when it is not valid JSON. */
  getPayload: () => Record<string, unknown>;
  /** Applies the tier-3 fixes to the editor and reports which keys changed. */
  onApplyFix: (faults: HintFault[], ctx: HintContext) => string[];
  disabled?: boolean;
}

export function HintPanel({ hints, getPayload, onApplyFix, disabled }: HintPanelProps) {
  const level = useGameStore((s) => s.hintLevel);
  const revealHint = useGameStore((s) => s.revealHint);
  const penalty = useGameStore((s) => s.hintPenalty);
  const persona = useGameStore((s) => s.persona);
  const clientId = useGameStore((s) => s.clientId);
  const accountId = useGameStore((s) => s.accountId);
  const recipientId = useGameStore((s) => s.recipientId);
  const [tierText, setTierText] = useState<(string[] | null)[]>([null, null]);
  const [fixed, setFixed] = useState<string[]>([]);
  const [allClear, setAllClear] = useState(false);

  const exhausted = level >= HINT_COSTS.length;

  const handleReveal = () => {
    if (exhausted || disabled) return;
    const context: HintContext = { persona, clientId, accountId, recipientId };
    const remaining = hints.faults.filter((f) => f.detect(getPayload(), context));

    if (remaining.length === 0) {
      // Nothing to say costs nothing — and does not burn a tier either.
      setAllClear(true);
      return;
    }
    setAllClear(false);

    if (level < 2) {
      const key = level === 0 ? 'nudge' : 'explain';
      setTierText((prev) => prev.map((t, i) => (i === level ? remaining.map((f) => f[key]) : t)));
      revealHint();
      return;
    }

    setFixed(onApplyFix(remaining, context));
    revealHint(true);
  };

  const renderCard = (tier: 0 | 1, label: string) => {
    if (level < tier + 1) return null;
    const lines = tierText[tier];
    return (
      <motion.div
        key={`tier-${tier}`}
        className={`hint-card tier-${tier + 1}`}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="hint-tier">
          HINT {tier + 1}/3 · {label}
        </span>
        {!lines || lines.length === 0 ? (
          <p>{hints.clear}</p>
        ) : lines.length === 1 ? (
          <p>{lines[0]}</p>
        ) : (
          <ul className="hint-list">
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </motion.div>
    );
  };

  return (
    <div className="hint-block">
      <div className="hint-bar">
        <button
          className={`btn-hint ${exhausted ? 'spent' : ''}`}
          onClick={handleReveal}
          disabled={exhausted || disabled}
        >
          {exhausted
            ? '[ NO MORE HINTS ]'
            : `[ ${TIER_LABELS[level]} — ${HINT_COSTS[level]} PTS ]`}
        </button>
        <span className="hint-cost">
          {penalty > 0
            ? `${level}/${HINT_COSTS.length} used · −${penalty} pts in this step`
            : 'Need help? Each hint checks only what is still wrong.'}
        </span>
      </div>

      <AnimatePresence>
        {allClear && (
          <motion.div
            key="all-clear"
            className="hint-card tier-clear"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="hint-tier">ALL CLEAR · NO COST</span>
            <p>{hints.clear}</p>
          </motion.div>
        )}
        {renderCard(0, 'CLUE')}
        {renderCard(1, 'EXPLAIN')}
        {level >= 3 && (
          <motion.div
            key="tier-3"
            className="hint-card tier-3"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="hint-tier">HINT 3/3 · APPLIED</span>
            <p>
              {fixed.length > 0
                ? `Fixed: ${fixed.join(', ')}. Review the change, then send the request.`
                : hints.clear}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// DefensePanel — respond to an attack
// The shuffled multiple-choice list is always on screen so the phase stays fast.
// Making the real API call yourself is opt-in and worth double.
// =============================================================================

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AttackScenario, DefenseOption, RoundResult, HintContext, HintFault } from '../types';
import { HINT_SCORE_FLOOR } from '../types';
import { useGameStore } from '../game/game-store';
import {
  gradeDefensePayload,
  hydratePayload,
  hydrateText,
  applyHintFaults,
  parsePayload,
} from '../game/grading';
import { apiDocs } from '../data/api-docs';
import { HintPanel } from './hint-panel';
import { BusyBar } from './busy-bar';

/** A right answer picked off the guided list is worth this fraction of making the call. */
const GUIDED_SCORE_FACTOR = 0.5;

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Fisher-Yates, so the correct answer is not always the first one on the list. */
function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface DefensePanelProps {
  attack: AttackScenario;
  roundId: number;
}

export function DefensePanel({ attack, roundId }: DefensePanelProps) {
  const store = useGameStore();
  const { defenseAction } = attack;

  const tokens = useMemo(
    () => ({
      clientId: store.clientId,
      accountId: store.accountId,
      recipientId: store.recipientId,
      subscriptionId: store.subscriptionId,
    }),
    [store.clientId, store.accountId, store.recipientId, store.subscriptionId]
  );

  const [payload, setPayload] = useState(() =>
    JSON.stringify(hydratePayload(defenseAction.starterPayload, tokens), null, 2)
  );
  const options = useMemo(() => shuffled(attack.defenseOptions), [attack.defenseOptions]);
  const [timeLeft, setTimeLeft] = useState(attack.defenseTimeLimit);
  const [resolved, setResolved] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [selected, setSelected] = useState<DefenseOption | null>(null);

  const resetPhaseHints = useGameStore((s) => s.resetPhaseHints);

  useEffect(() => {
    resetPhaseHints();
  }, [resetPhaseHints]);

  const handleApplyHintFix = (faults: HintFault[], ctx: HintContext) => {
    const { payload: patched, changed } = applyHintFaults(payload, faults, ctx);
    setPayload(patched);
    if (changed.length > 0) {
      store.addTerminalLine({
        type: 'warning',
        content: `HINT FIXED: ${changed.join(', ')}`,
      });
    }
    return changed;
  };

  useEffect(() => {
    if (resolved) return;
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, resolved]);

  /** Side effects that make a successful defense visible on the flow-of-funds HUD. */
  const applySideEffects = () => {
    switch (attack.id) {
      case 'atk-chargeback-drain':
        store.setLedgerRestricted('client', true);
        break;
      case 'atk-avs-bypass':
        store.setRecipientValidated(true);
        store.provisionLedgerAccount('external');
        break;
      case 'atk-indirect-ownership':
        store.setClientApproved(true);
        break;
      default:
        break;
    }
  };

  const finishRound = (
    defended: boolean,
    defenseScore: number,
    defenseNote: string,
    defendedByApiCall: boolean
  ) => {
    const timeTaken = Math.floor((Date.now() - store.roundStartTime) / 1000);
    const timeBonus = Math.max(0, 50 - Math.floor(timeTaken / 3));
    store.addScore(timeBonus);

    const result: RoundResult = {
      roundId,
      apiScore: store.buildApiScore,
      apiNote: store.buildApiNote,
      defenseScore,
      defenseNote,
      timeBonus,
      totalScore: store.buildApiScore + defenseScore + timeBonus,
      validationErrors: store.validationErrorCount,
      hintsUsed: store.roundHintsUsed,
      hintPenalty: store.roundHintPenalty,
      attackDefended: defended,
      defendedByApiCall,
      timeTaken,
      errorCodes: [...store.roundErrorCodes],
    };

    store.recordRoundResult(result);
    store.setBusy('Scoring the round');
    setTimeout(() => {
      store.setBusy(null);
      store.setPhase('RESULT');
    }, 2000);
  };

  const handleTimeout = () => {
    setResolved(true);
    store.addTerminalLine({ type: 'error', content: 'TIME EXPIRED — no response was chosen.' });
    store.takeDamage(25);
    store.addScore(-50);
    finishRound(false, -50, 'time expired before a response was chosen', false);
  };

  const handleSubmitCall = () => {
    if (resolved) return;

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(payload);
    } catch {
      setHint('The request is not valid JSON. Check the punctuation and try again.');
      return;
    }

    const endpoint = hydrateText(defenseAction.endpoint, tokens);
    store.addTerminalLine({ type: 'input', content: `${defenseAction.method} ${endpoint}` });
    store.addTerminalLine({ type: 'input', content: payload });

    const grade = gradeDefensePayload(
      parsed,
      defenseAction.expectedPayload,
      defenseAction.gradedFields
    );
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (grade.passed) {
      // First-attempt success is worth full marks; a corrected retry is worth less.
      const earned = nextAttempts === 1 ? defenseAction.points : Math.round(defenseAction.points * 0.6);
      const floor = store.hintLevel > 0 ? HINT_SCORE_FLOOR : 0;
      const points = Math.max(floor, earned - store.hintPenalty);
      const deductions = [
        nextAttempts > 1 ? `60% for succeeding on attempt ${nextAttempts}` : '',
        store.hintPenalty > 0 ? `−${store.hintPenalty} for ${store.hintLevel} hints` : '',
        points > earned - store.hintPenalty ? `floored at ${floor}` : '',
      ].filter(Boolean);
      setResolved(true);
      applySideEffects();
      store.addTerminalLine({ type: 'success', content: 'HTTP 200 — request accepted' });
      store.addTerminalLine({ type: 'success', content: defenseAction.successMessage });
      store.addScore(points);
      finishRound(
        true,
        points,
        deductions.length
          ? `${defenseAction.points} base, ${deductions.join(', ')}`
          : 'stopped it first time, unaided',
        true
      );
      return;
    }

    store.addTerminalLine({ type: 'error', content: 'RESPONSE FAILED — the threat is still active' });
    store.addTerminalLine({ type: 'warning', content: defenseAction.failureMessage });

    const unfilled = grade.unfilledFields.length
      ? ` Still unfilled: ${grade.unfilledFields.join(', ')}.`
      : '';
    setHint(`${defenseAction.failureMessage}${unfilled}`);
  };

  const handleSelectOption = (option: DefenseOption) => {
    if (resolved) return;
    setSelected(option);
    setResolved(true);

    // The guided list hands you the reasoning, so a right answer here is worth half.
    const points = option.points > 0 ? Math.round(option.points * GUIDED_SCORE_FACTOR) : option.points;
    const note =
      option.points > 0
        ? `picked from the guided list — half of ${option.points}`
        : 'wrong answer picked from the guided list';

    if (option.isCorrect) {
      applySideEffects();
      store.addTerminalLine({ type: 'success', content: `DEFENSE APPLIED: ${option.label}` });
      store.addScore(points);
    } else if (option.isPartial) {
      store.addTerminalLine({ type: 'warning', content: `PARTIAL DEFENSE: ${option.label}` });
      store.addScore(points);
      store.takeDamage(10);
    } else {
      store.addTerminalLine({ type: 'error', content: `WRONG DEFENSE: ${option.label}` });
      store.addScore(points);
      store.takeDamage(25);
    }

    finishRound(option.isCorrect, points, note, false);
  };

  const doc = apiDocs[defenseAction.docHint];

  return (
    <div className="defense-panel">
      <div className="defense-header">
        <h3>RESPOND</h3>
        <motion.span
          className="defense-timer"
          animate={{
            color: timeLeft <= 10 ? '#ff0040' : timeLeft <= 20 ? '#ffb800' : '#00ff41',
          }}
        >
          {timeLeft}s
        </motion.span>
      </div>

      <div className="defense-options">
        <span className="defense-options-note">
          Choose a response, or send the API request yourself for twice the points.
        </span>
        {options.map((option, i) => (
          <motion.button
            key={option.id}
            className={`defense-option ${
              resolved && option.isCorrect
                ? 'correct'
                : resolved && selected?.id === option.id && !option.isCorrect
                  ? option.isPartial
                    ? 'partial'
                    : 'wrong'
                  : ''
            } ${selected?.id === option.id ? 'selected' : ''}`}
            onClick={() => handleSelectOption(option)}
            disabled={resolved}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.2 }}
          >
            <div className="option-label">
              {OPTION_LETTERS[i]}) {option.label}
            </div>
            <div className="option-desc">{option.description}</div>
            {resolved && option.isCorrect && (
              <span className="option-badge correct-badge">✓ CORRECT</span>
            )}
            {resolved && selected?.id === option.id && option.isPartial && (
              <span className="option-badge partial-badge">~ PARTIAL</span>
            )}
            {resolved && selected?.id === option.id && !option.isCorrect && !option.isPartial && (
              <span className="option-badge wrong-badge">✗ WRONG</span>
            )}
          </motion.button>
        ))}
      </div>

      {!showEditor && !resolved && (
        <button className="btn-secondary defense-escalate" onClick={() => setShowEditor(true)}>
          [ SEND THE API REQUEST — {defenseAction.points} PTS ]
        </button>
      )}

      {resolved && <BusyBar label="DEFENSE RESOLVED — scoring the round" />}

      <AnimatePresence>
        {showEditor && !resolved && (
          <motion.div
            className="defense-action"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <div className="defense-action-header">
              <span className="defense-action-label">{defenseAction.label}</span>
              <span className="defense-action-call">
                <span className="method-badge">{defenseAction.method}</span>
                <span className="endpoint">{hydrateText(defenseAction.endpoint, tokens)}</span>
              </span>
            </div>

            <textarea
              className="json-editor defense-editor"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={12}
              spellCheck={false}
            />

            {hint && <div className="defense-hint">{hint}</div>}

            {defenseAction.hints && (
              <HintPanel
                hints={defenseAction.hints}
                getPayload={() => parsePayload(payload)}
                onApplyFix={handleApplyHintFix}
              />
            )}

            <div className="builder-actions">
              <button className="btn-danger" onClick={handleSubmitCall}>
                [ SEND REQUEST ]
              </button>
            </div>

            {doc && (
              <details className="defense-doc">
                <summary>API help</summary>
                <p className="doc-quote">{doc.docQuote}</p>
                <a className="doc-link" href={doc.docUrl} target="_blank" rel="noreferrer">
                  {doc.docUrl}
                </a>
              </details>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

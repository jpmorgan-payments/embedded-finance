// =============================================================================
// GameScreen — Main game view orchestrating round phases
// =============================================================================

import { useGameStore } from '../game/game-store';
import { getRound } from '../rounds/round-configs';
import { AnimatePresence } from 'framer-motion';
import { TerminalWindow } from './terminal-window';
import { ScoreHUD } from './score-hud';
import { RoundBriefing } from './round-briefing';
import { ApiRequestBuilder } from './api-request-builder';
import { AttackAlert } from './attack-alert';
import { DefensePanel } from './defense-panel';
import { RoundResult } from './round-result';
import { FlowOfFunds } from './flow-of-funds';
import { WebhookInbox } from './webhook-inbox';
import { FieldGuide } from './field-guide';

export function GameScreen() {
  const { currentRound, currentPhase, terminalLines, busyLabel } = useGameStore();
  const showFieldGuide = useGameStore((s) => s.showFieldGuide);
  const dismissFieldGuide = useGameStore((s) => s.dismissFieldGuide);
  const round = getRound(currentRound);

  if (!round) {
    return <div className="error-screen">Mission data could not be loaded.</div>;
  }

  return (
    <div className="game-screen">
      <ScoreHUD />
      <FlowOfFunds />

      <div className="game-layout">
        {/* Left: Main interaction area */}
        <div className="game-main">
          {currentPhase === 'BRIEFING' && <RoundBriefing round={round} />}
          {currentPhase === 'BUILD' && <ApiRequestBuilder round={round} />}
          {currentPhase === 'ATTACK_INCOMING' && (
            <AttackAlert attack={round.attack} />
          )}
          {currentPhase === 'DEFEND' && (
            <DefensePanel key={round.id} attack={round.attack} roundId={round.id} />
          )}
          {currentPhase === 'RESULT' && <RoundResult round={round} />}
        </div>

        {/* Right: Terminal output and asynchronous callbacks */}
        <div className="game-terminal">
          <TerminalWindow
            lines={terminalLines}
            title={`EP-TERMINAL — Round ${currentRound}`}
            pending={busyLabel}
          />
          <WebhookInbox />
        </div>
      </div>

      <AnimatePresence>
        {showFieldGuide && <FieldGuide intro onClose={dismissFieldGuide} />}
      </AnimatePresence>
    </div>
  );
}

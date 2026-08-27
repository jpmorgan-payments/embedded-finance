// =============================================================================
// GameInfo — Optional overlay explaining the game concept for all audiences
// =============================================================================

import { motion } from 'framer-motion';
import { rounds, TOTAL_ROUNDS } from '../rounds/round-configs';

interface GameInfoProps {
  onClose: () => void;
}

/** Canonical project pages — stable entry points rather than per-category deep links. */
const OWASP_LINKS = [
  {
    label: 'OWASP Top 10 (2021)',
    url: 'https://owasp.org/Top10/',
    note: 'Security risks for web applications.',
  },
  {
    label: 'OWASP API Security Top 10 (2023)',
    url: 'https://owasp.org/API-Security/',
    note: 'Security risks for APIs.',
  },
  {
    label: 'OWASP Cheat Sheet Series',
    url: 'https://cheatsheetseries.owasp.org/',
    note: 'Steps for reducing common security risks.',
  },
];

export function GameInfo({ onClose }: GameInfoProps) {
  return (
    <motion.div
      className="info-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="info-panel"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="info-header">
          <span>ℹ ABOUT FINTECH FORTRESS</span>
          <button className="info-close" onClick={onClose}>✕</button>
        </div>

        <div className="info-body">
          {/* ── What Is This? ── */}
          <section className="info-section">
            <h3 className="info-heading">What is Fintech Fortress?</h3>
            <p>
              A practice game about payment APIs and security. You fix API requests, see a
              security problem, and choose how to respond.
            </p>
            <p>
              No coding or payments experience is required. Each mission includes a starter
              request, API help, hints, and feedback.
            </p>
          </section>

          {/* ── How It Works ── */}
          <section className="info-section">
            <h3 className="info-heading">How Does It Work?</h3>
            <p>Each of the {TOTAL_ROUNDS} missions follows the same five steps:</p>
            <pre className="info-diagram">{`
  1. READ      Review the goal and key rules
  2. BUILD     Fix and send the API request
  3. REVIEW    See what went wrong
  4. RESPOND   Choose an action or send an API request
  5. RESULT    Review the score
`}</pre>
          </section>

          {/* ── Missions ── */}
          <section className="info-section">
            <h3 className="info-heading">The {TOTAL_ROUNDS} Missions</h3>
            <ul className="info-covered">
              {rounds.map((round) => (
                <li key={round.id}>
                  <span className="info-covered-code">{round.id}</span>
                  {round.subtitle}
                </li>
              ))}
            </ul>
          </section>

          {/* ── What You'll Learn ── */}
          <section className="info-section">
            <h3 className="info-heading">What Will Participants Learn?</h3>
            <p>
              How client profiles, accounts, external recipients, payments, event updates, and
              documents connect. The game also shows why ownership checks, account controls,
              retry protection, verified updates, and careful account closure matter.
            </p>
          </section>

          {/* ── Scoring ── */}
          <section className="info-section">
            <h3 className="info-heading">How Scoring Works</h3>
            <pre className="info-diagram">{`
  Request ───────────── Up to 100 points per mission
                        Fewer errors and hints earn more

  Response ──────────── Send the API request: up to 150
                        Choose from the list: up to 75
                        Wrong answer or timeout: −50

  Time ──────────────── Up to 50 points

  Hints ─────────────── Cost 10, 25, then 40 points
                        A step never falls below 25

  Health ────────────── Starts at 100%
                        Failed responses lower the final score

  FINAL SCORE = Mission points × Health %
`}</pre>
          </section>

          {/* ── For Stakeholders ── */}
          <section className="info-section">
            <h3 className="info-heading">Why This Matters</h3>
            <p>
              Payment requests can be valid and still create risk. The missions connect accurate
              API use with clear security decisions. A mission takes a few minutes; the full game
              takes about fifteen.
            </p>
          </section>

          {/* ── OWASP reference ── */}
          <section className="info-section">
            <h3 className="info-heading">Learn More: OWASP</h3>
            <p>
              Each security problem is linked to a public OWASP category. Use these resources to
              learn more:
            </p>
            <ul className="info-links">
              {OWASP_LINKS.map((link) => (
                <li key={link.url}>
                  <a
                    className="info-link"
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {link.label} ↗
                  </a>
                  <span className="info-link-note">{link.note}</span>
                </li>
              ))}
            </ul>
            <p className="info-covered-title">Categories used in this game:</p>
            <ul className="info-covered">
              {rounds.map((round) => (
                <li key={round.id}>
                  <span className="info-covered-code">{round.attack.owaspCode}</span>
                  {round.attack.owaspCategory}
                </li>
              ))}
            </ul>
          </section>

          {/* ── Tech Note ── */}
          <section className="info-section info-section-dim">
            <h3 className="info-heading">Technical Note</h3>
            <p>
              The game runs in the browser. It makes no real API calls and moves no real money.
              The practice API uses published field rules, error codes, and response shapes.
            </p>
          </section>
        </div>

        <div className="info-footer">
          <button className="btn-primary" onClick={onClose}>
            [ CLOSE ]
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

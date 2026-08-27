// =============================================================================
// FieldGuide — the one-pager a player reads BEFORE round 1.
// Answers: what am I doing, what do I need, what will I touch, and how do the
// Embedded Payments resources fit together. Mission data is read from the round
// configs so this map can never drift from the game.
// =============================================================================

import { motion } from 'framer-motion';
import { rounds, TOTAL_ROUNDS } from '../rounds/round-configs';

interface FieldGuideProps {
  onClose: () => void;
  /** Shown automatically before mission 1 — adds a plain-language intro and a dismiss CTA. */
  intro?: boolean;
}

/** What each round leaves behind — the artifact later rounds build on. */
const PRODUCES: Record<number, string> = {
  1: 'clientId',
  2: 'accountId',
  3: 'recipientId',
  4: 'transactionId',
  5: 'subscriptionId',
  6: 'documentId',
};

const OPERATIONS = [
  { resource: 'Client', endpoint: 'POST /v1/clients', does: 'Onboard a business', round: 1 },
  { resource: 'Party', endpoint: 'POST /v1/parties', does: 'Add an owner or controller', round: 1 },
  { resource: 'Account', endpoint: 'POST /v2/accounts', does: 'Open a client account', round: 2 },
  { resource: 'Restriction', endpoint: 'POST /v2/accounts/{id}/restrictions', does: 'Block money in or out', round: 2 },
  { resource: 'Recipient', endpoint: 'POST /v1/recipients', does: 'Connect an external account', round: 3 },
  { resource: 'Transaction', endpoint: 'POST /v3/transactions', does: 'Send a payment', round: 4 },
  { resource: 'Webhook', endpoint: 'POST /v1/webhooks', does: 'Receive event updates', round: 5 },
  { resource: 'Document', endpoint: 'POST /v1/documents', does: 'Create an account document', round: 6 },
  { resource: 'Account', endpoint: 'PATCH /v2/accounts/{id}', does: 'Start account closure', round: 6 },
];

/** The handful of shapes that catch out almost everyone on their first integration. */
const RULES = [
  { wrong: 'amount: 5000.00', right: 'amount: "5000.00"', note: 'amount is text' },
  { wrong: 'accountType', right: 'category', note: 'no currency field' },
  { wrong: 'callbackUrl', right: 'callbackURL', note: 'capital U-R-L' },
  { wrong: 'partyDetails.name', right: 'businessName', note: 'for a business' },
  { wrong: 'organization at the root', right: 'parties[] + products[]', note: 'client request shape' },
  { wrong: 'TRANSACTIONS_COMPLETED', right: 'TRANSACTION_COMPLETED', note: 'singular event name' },
];

export function FieldGuide({ onClose, intro = false }: FieldGuideProps) {
  return (
    <motion.div
      className="info-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="info-panel guide-panel"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="info-header">
          <span>◈ FIELD GUIDE — MISSION MAP</span>
          <button className="info-close" onClick={onClose} title="Close">✕</button>
        </div>

        {intro && (
          <div className="guide-intro-bar">
            <span>
              Two minutes here will save you ten in the missions — or skip it, you can reopen this
              any time from <strong>◈ GUIDE</strong> in the top bar.
            </span>
            <button className="btn-primary guide-intro-cta" onClick={onClose}>
              [ START MISSION 1 ]
            </button>
          </div>
        )}

        <div className="info-body guide-body">
          {/* ── Intent ───────────────────────────────────────────────── */}
          <section className="guide-section">
            <div className="guide-kicker">THE PREMISE</div>
            <p className="guide-lede">
              Build a payments setup in {TOTAL_ROUNDS} missions. In each mission, fix an API
              request and then respond to a security problem.
            </p>
            <div className="guide-cards">
              <div className="guide-card">
                <span className="guide-card-title">WHAT YOU DO</span>
                <p>
                  Edit a starter request and send it. The game checks it against the published
                  API rules.
                </p>
              </div>
              <div className="guide-card">
                <span className="guide-card-title">WHERE TO LOOK</span>
                <p>
                  Open SHOW DOCS for field names. Mission 1 also has a CLIENT FILE with verified
                  business details.
                </p>
              </div>
              <div className="guide-card">
                <span className="guide-card-title">HOW TO SCORE</span>
                <p>
                  Correct requests, fewer hints, faster answers, and sending the response API
                  request earn more points.
                </p>
              </div>
            </div>
          </section>

          {/* ── Prerequisites ────────────────────────────────────────── */}
          <section className="guide-section">
            <div className="guide-kicker">BEFORE YOU START</div>
            <div className="guide-prereqs">
              <ul className="guide-check">
                <li><span className="tick">✓</span> Runs in this browser tab</li>
                <li><span className="tick">✓</span> Uses practice data and no real money</li>
                <li><span className="tick">✓</span> Requires no payments experience</li>
                <li><span className="tick">✓</span> Offers hints in every mission</li>
              </ul>
              <div className="guide-helps">
                <span className="guide-card-title">HELPS, BUT OPTIONAL</span>
                <p>
                  Basic JSON familiarity helps. JSON is the name-and-value format in the request
                  editor. The exact field names and allowed values are available in SHOW DOCS.
                </p>
              </div>
            </div>
          </section>

          {/* ── Mission map ──────────────────────────────────────────── */}
          <section className="guide-section">
            <div className="guide-kicker">THE MISSION MAP</div>
            <p className="guide-note">
              Each mission creates an ID used by a later mission.
            </p>
            <div className="guide-missions">
              {rounds.map((round) => (
                <div className="guide-mission" key={round.id}>
                  <span className="mission-num">{round.id}</span>
                  <div className="mission-main">
                    <span className="mission-title">{round.title}</span>
                    <span className="mission-sub">{round.subtitle}</span>
                  </div>
                  <code className="mission-endpoint">
                    {round.apiMethod} {round.apiEndpoint}
                  </code>
                  <span className="mission-produces">→ {PRODUCES[round.id]}</span>
                  <div className="mission-attack">
                    <span className="mission-owasp">{round.attack.owaspCode}</span>
                    <span className="mission-attack-name">{round.attack.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Data model ───────────────────────────────────────────── */}
          <section className="guide-section">
            <div className="guide-kicker">HOW THE RESOURCES RELATE</div>
            <p className="guide-note">
              A client has people, accounts, and external recipients. Transactions move money
              between accounts. Restrictions, documents, and event updates support that flow.
            </p>
            <svg className="guide-model" viewBox="0 0 880 400" role="img" aria-label="Embedded Payments resource model">
              <defs>
                <marker id="fg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" className="model-arrowhead" />
                </marker>
              </defs>

              {/* connectors first, so nodes paint over the ends */}
              <path className="model-link" d="M 230 47 H 349" markerEnd="url(#fg-arrow)" />
              <path className="model-link" d="M 440 76 V 134" markerEnd="url(#fg-arrow)" />
              <path className="model-link" d="M 525 47 H 735 V 134" markerEnd="url(#fg-arrow)" />
              <path className="model-link" d="M 355 163 H 236" markerEnd="url(#fg-arrow)" />
              <path className="model-link" d="M 400 186 V 273 H 236" markerEnd="url(#fg-arrow)" />
              <path className="model-link" d="M 490 186 V 273 H 494" markerEnd="url(#fg-arrow)" />
              <path className="model-link" d="M 670 273 H 735 V 192" markerEnd="url(#fg-arrow)" />
              <path className="model-link is-dashed" d="M 145 296 V 344" />
              <path className="model-link is-dashed" d="M 440 296 V 344" />
              <path className="model-link is-dashed" d="M 735 209 V 344" />

              <text className="model-edge" x="290" y="38">parties[]</text>
              <text className="model-edge" x="450" y="110">clientId</text>
              <text className="model-edge" x="745" y="110">clientId</text>
              <text className="model-edge" x="292" y="155">restrictionType</text>
              <text className="model-edge" x="410" y="240">parameters.accountId</text>
              <text className="model-edge" x="500" y="240">debtor</text>
              <text className="model-edge" x="682" y="240">creditor</text>

              <g className="model-node is-root">
                <rect x="355" y="24" width="170" height="46" rx="2" />
                <text x="440" y="45">CLIENT</text>
                <text className="model-sub" x="440" y="60">the onboarded business</text>
              </g>
              <g className="model-node">
                <rect x="60" y="24" width="170" height="46" rx="2" />
                <text x="145" y="45">PARTY</text>
                <text className="model-sub" x="145" y="60">owners &amp; controllers</text>
              </g>
              <g className="model-node is-core">
                <rect x="355" y="140" width="170" height="46" rx="2" />
                <text x="440" y="161">ACCOUNT</text>
                <text className="model-sub" x="440" y="176">holds the balance</text>
              </g>
              <g className="model-node is-core">
                <rect x="650" y="140" width="170" height="46" rx="2" />
                <text x="735" y="161">RECIPIENT</text>
                <text className="model-sub" x="735" y="176">external bank account</text>
              </g>
              <g className="model-node is-guard">
                <rect x="60" y="140" width="170" height="46" rx="2" />
                <text x="145" y="161">RESTRICTION</text>
                <text className="model-sub" x="145" y="176">stops money leaving</text>
              </g>
              <g className="model-node">
                <rect x="60" y="250" width="170" height="46" rx="2" />
                <text x="145" y="271">DOCUMENT</text>
                <text className="model-sub" x="145" y="286">the paper trail</text>
              </g>
              <g className="model-node is-core">
                <rect x="500" y="250" width="170" height="46" rx="2" />
                <text x="585" y="271">TRANSACTION</text>
                <text className="model-sub" x="585" y="286">money in motion</text>
              </g>
              <g className="model-node is-event">
                <rect x="60" y="344" width="760" height="44" rx="2" />
                <text x="440" y="365">WEBHOOK SUBSCRIPTION</text>
                <text className="model-sub" x="440" y="380">
                  sends status updates for the resources above
                </text>
              </g>
            </svg>
          </section>

          {/* ── Operations ───────────────────────────────────────────── */}
          <section className="guide-section">
            <div className="guide-kicker">API ACTIONS IN THE GAME</div>
            <div className="guide-ops">
              <div className="guide-ops-head">
                <span>RESOURCE</span>
                <span>OPERATION</span>
                <span>ACTION</span>
                <span>MISSION</span>
              </div>
              {OPERATIONS.map((op) => (
                <div className="guide-op" key={op.endpoint + op.round}>
                  <span className="op-resource">{op.resource}</span>
                  <code className="op-endpoint">{op.endpoint}</code>
                  <span className="op-does">{op.does}</span>
                  <span className="op-round">{op.round}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Cheat sheet ──────────────────────────────────────────── */}
          <section className="guide-section">
            <div className="guide-kicker">COMMON REQUEST MISTAKES</div>
            <p className="guide-note">
              These mistakes appear in the starter requests. Use the value on the right.
            </p>
            <div className="guide-rules">
              {RULES.map((rule) => (
                <div className="guide-rule" key={rule.right}>
                  <code className="rule-wrong">{rule.wrong}</code>
                  <span className="rule-arrow">→</span>
                  <code className="rule-right">{rule.right}</code>
                  <span className="rule-note">{rule.note}</span>
                </div>
              ))}
            </div>
          </section>

          <p className="guide-footer">
            The game uses published J.P. Morgan Embedded Payments API patterns. It does not call a
            real system or move real money.
          </p>

          {intro && (
            <div className="guide-end-cta">
              <button className="btn-primary" onClick={onClose}>
                [ START MISSION 1 ]
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

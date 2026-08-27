// =============================================================================
// FlowOfFunds — persistent ledger showing where money actually sits
// =============================================================================

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../game/game-store';

const CURRENCY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/** Left-to-right order of the funds journey, rendered as columns. */
const COLUMNS: { keys: string[]; caption: string }[] = [
  { keys: ['treasury'], caption: 'PLATFORM' },
  { keys: ['processing', 'management', 'offset'], caption: 'PROGRAM' },
  { keys: ['client'], caption: 'CLIENT' },
  { keys: ['external'], caption: 'EXTERNAL' },
];

export function FlowOfFunds() {
  const ledger = useGameStore((s) => s.ledger);
  const entries = useGameStore((s) => s.ledgerEntries);

  const byKey = Object.fromEntries(ledger.map((a) => [a.key, a]));
  const latest = entries[0];

  return (
    <div className="flow-of-funds">
      <div className="flow-header">
        <span className="flow-title">FLOW OF FUNDS</span>
        <span className="flow-hint">Treasury → Processing → Client → External</span>
      </div>

      <div className="flow-grid">
        {COLUMNS.map((column, columnIndex) => (
          <div key={column.caption} className="flow-column">
            <span className="flow-caption">{column.caption}</span>
            {column.keys.map((key) => {
              const account = byKey[key];
              if (!account) return null;
              const active = latest && (latest.from === key || latest.to === key);
              return (
                <motion.div
                  key={key}
                  className={[
                    'flow-node',
                    account.provisioned ? '' : 'pending',
                    account.restricted ? 'restricted' : '',
                    account.balance < 0 ? 'negative' : '',
                    active ? 'active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  animate={active ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="node-label">{account.label}</span>
                  <span className="node-type">{account.accountType}</span>
                  <span className="node-balance">
                    {account.provisioned ? CURRENCY.format(account.balance) : 'NOT CREATED'}
                  </span>
                  {account.restricted && <span className="node-flag">DEBITS</span>}
                </motion.div>
              );
            })}
            {columnIndex < COLUMNS.length - 1 && <span className="flow-arrow">→</span>}
          </div>
        ))}
      </div>

      <div className="flow-entries">
        <div className="flow-entry head">
          <span>METHOD</span>
          <span>ROUTE</span>
          <span className="entry-amount">AMOUNT</span>
          <span>REFERENCE</span>
          <span>STATUS</span>
        </div>
        <AnimatePresence initial={false}>
          {entries.slice(0, 4).map((entry) => (
            <motion.div
              key={entry.id}
              className={`flow-entry status-${entry.status.toLowerCase()}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <span className="entry-rail">{entry.rail}</span>
              <span className="entry-route">
                {byKey[entry.from]?.label ?? entry.from} → {byKey[entry.to]?.label ?? entry.to}
              </span>
              <span className="entry-amount">{CURRENCY.format(entry.amount)}</span>
              <span className="entry-ref">{entry.reference}</span>
              <span className="entry-status">{entry.status}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {entries.length === 0 && (
          <div className="flow-entry empty">No money has moved yet.</div>
        )}
      </div>
    </div>
  );
}

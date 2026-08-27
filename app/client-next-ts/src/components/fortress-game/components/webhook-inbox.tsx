// =============================================================================
// WebhookInbox — asynchronous events arriving mid-round
// The 201 you got from a POST was an acknowledgement; this is the outcome.
// =============================================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../game/game-store';

export function WebhookInbox() {
  const inbox = useGameStore((s) => s.inbox);
  const markInboxRead = useGameStore((s) => s.markInboxRead);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const unread = inbox.filter((e) => !e.read).length;

  const handleToggle = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
    markInboxRead(id);
  };

  return (
    <div className="webhook-inbox">
      <div className="inbox-header">
        <span className="inbox-title">EVENT UPDATES</span>
        {unread > 0 && (
          <motion.span
            className="inbox-badge"
            key={unread}
            initial={{ scale: 1.5 }}
            animate={{ scale: 1 }}
          >
            {unread}
          </motion.span>
        )}
      </div>

      <div className="inbox-list">
        <AnimatePresence initial={false}>
          {inbox.map((event) => (
            <motion.div
              key={event.id}
              className={[
                'inbox-event',
                `sev-${event.severity.toLowerCase()}`,
                event.read ? 'read' : 'unread',
                event.signatureValid ? '' : 'forged',
              ]
                .filter(Boolean)
                .join(' ')}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => handleToggle(event.id)}
            >
              <div className="event-row">
                <span className="event-type">{event.eventType}</span>
                <span className="event-time">
                  {new Date(event.receivedAt).toLocaleTimeString('en-US', { hour12: false })}
                </span>
              </div>
              <div className="event-summary">{event.summary}</div>
              {!event.signatureValid && (
                <div className="event-signature-fail">SIGNATURE VERIFICATION FAILED</div>
              )}
              {expandedId === event.id && (
                <pre className="event-payload">{JSON.stringify(event.payload, null, 2)}</pre>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {inbox.length === 0 && (
          <div className="inbox-empty">
            No updates yet. Accepted requests may finish later.
          </div>
        )}
      </div>
    </div>
  );
}

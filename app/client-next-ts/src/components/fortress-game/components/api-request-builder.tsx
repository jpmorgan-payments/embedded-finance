// =============================================================================
// ApiRequestBuilder — JSON editor for constructing API requests
// Starter payloads deliberately contain documented traps (retired enum values,
// disallowed addresses, the reference-id pattern) so the errors teach something.
// =============================================================================

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../game/game-store';
import { apiDocs } from '../data/api-docs';
import { lookupError } from '../data/error-catalog';
import { getPersonaClient, getPersonaExternalAccount } from '../data/personas';
import * as mockApi from '../api/mock-ep-api';
import { applyHintFaults, parsePayload } from '../game/grading';
import { HintPanel } from './hint-panel';
import { ClientFile } from './client-file';
import { BusyBar } from './busy-bar';
import { HINT_SCORE_FLOOR } from '../types';
import type { ApiError, RoundConfig, HintContext, HintFault } from '../types';

interface ApiRequestBuilderProps {
  round: RoundConfig;
}

export function ApiRequestBuilder({ round }: ApiRequestBuilderProps) {
  const store = useGameStore();
  const doc = apiDocs[round.apiDocHint];

  const getDefaultPayload = useCallback((): string => {
    const persona = store.persona;

    switch (round.id) {
      case 1: {
        const client = structuredClone(getPersonaClient(persona));
        // Two seeded faults on the CLIENT party: a retired organizationType and a
        // registered agent address.
        const clientParty = client.parties.find((p) => p.roles.includes('CLIENT'));
        if (clientParty?.organizationDetails) {
          clientParty.organizationDetails.organizationType = 'PARTNERSHIP' as never;
          clientParty.organizationDetails.addresses = [
            {
              addressType: 'LEGAL_ADDRESS',
              addressLines: ['c/o Registered Agent', '1209 Orange St'],
              city: 'Wilmington',
              state: 'DE',
              postalCode: '19801',
              country: 'US',
            },
          ];
        }
        return JSON.stringify(client, null, 2);
      }
      case 2:
        return JSON.stringify(
          {
            clientId: store.clientId ?? '1000010400',
            accountType: 'DDA',
            currency: 'USD',
          },
          null,
          2
        );
      case 3: {
        const external = structuredClone(getPersonaExternalAccount(persona));
        // The recipient type is stripped out — choosing it correctly is the round.
        const withoutType: Record<string, unknown> = { ...external };
        delete withoutType.type;
        return JSON.stringify(
          { ...withoutType, clientId: store.clientId ?? '1000010400' },
          null,
          2
        );
      }
      case 4:
        return JSON.stringify(
          {
            amount: 5000.0,
            currency: 'USD',
            debtor: { accountId: store.accountId ?? 'acc-xxxxx' },
            creditor: { recipientId: store.recipientId ?? 'rcp-xxxxx' },
            transactionReferenceId: 'inv-pay-001',
            type: 'PAYOUT',
            memo: 'Weekly marketplace settlement',
          },
          null,
          2
        );
      case 5:
        return JSON.stringify(
          {
            eventTypes: ['TRANSACTIONS_COMPLETED', 'RECIPIENT_READY_FOR_VALIDATION'],
            callbackUrl: 'https://your-platform.com/webhooks/ep',
            secret: 'shared-webhook-secret',
          },
          null,
          2
        );
      case 6:
        return JSON.stringify(
          {
            documentType: 'ACCOUNT_CONFIRMATION_LETTER',
            accountId: store.accountId ?? 'acc-xxxxx',
          },
          null,
          2
        );
      default:
        return '{}';
    }
  }, [round.id, store.clientId, store.accountId, store.recipientId, store.persona]);

  const [payload, setPayload] = useState(getDefaultPayload);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showClientFile, setShowClientFile] = useState(false);
  const [lastErrorCodes, setLastErrorCodes] = useState<string[]>([]);

  const resetPhaseHints = useGameStore((s) => s.resetPhaseHints);

  useEffect(() => {
    setPayload(getDefaultPayload());
    setLastErrorCodes([]);
    resetPhaseHints();
  }, [getDefaultPayload, resetPhaseHints]);

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

  /** Queues this round's callbacks so they land while the player is doing something else. */
  const scheduleEmits = () => {
    for (const emit of round.emits ?? []) {
      setTimeout(() => {
        useGameStore.getState().pushInboxEvent({
          eventType: emit.eventType,
          resourceType: emit.eventType.split('_')[0] + 'S',
          resourceId: store.accountId ?? store.clientId ?? 'res-unknown',
          summary: emit.summary,
          severity: emit.severity,
          signatureValid: true,
          payload: { eventType: emit.eventType, deliveredAt: new Date().toISOString() },
        });
      }, emit.delayMs);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setLastErrorCodes([]);
    store.setBusy(`${round.apiMethod} ${round.apiEndpoint} — waiting for a response`);
    store.addTerminalLine({ type: 'input', content: `${round.apiMethod} ${round.apiEndpoint}` });
    store.addTerminalLine({ type: 'input', content: payload });

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(payload);
    } catch (err) {
      // Nothing left the platform, so this costs no points — only the message helps.
      store.setBusy(null);
      store.addTerminalLine({
        type: 'error',
        content: `JSON PARSE ERROR — request not sent. ${(err as Error).message}`,
      });
      store.addTerminalLine({
        type: 'warning',
        content: 'Check for a missing quote or an extra comma. Fix it and try again. No points were lost.',
      });
      setIsSubmitting(false);
      return;
    }

    const idempotencyKey = `idem_${Math.random().toString(36).slice(2, 10)}`;

    try {
      let response: unknown;

      switch (round.id) {
        case 1: {
          const res = await mockApi.createClient(parsed, idempotencyKey);
          store.setClientId(res.id);
          if (res.outstanding.partyRoles.length > 0) {
            store.addTerminalLine({
              type: 'warning',
              content: `OUTSTANDING: ${res.outstanding.partyRoles.join(', ')} still required before approval.`,
            });
          }
          response = res;
          break;
        }
        case 2: {
          const res = await mockApi.createAccount(parsed, idempotencyKey);
          store.setAccountId(res.id);
          store.provisionLedgerAccount('client');
          // Seed the client account so Round 4 has something to pay out.
          const entryId = store.postLedgerEntry({
            from: 'processing',
            to: 'client',
            amount: 12400,
            rail: 'INTERNAL',
            reference: 'initial_settlement',
            status: 'PENDING',
          });
          mockApi.seedAccount(res, 12400);
          setTimeout(() => useGameStore.getState().settleLedgerEntry(entryId, 'COMPLETED'), 1200);
          response = res;
          break;
        }
        case 3: {
          const res = await mockApi.createRecipient(parsed, idempotencyKey);
          store.setRecipientId(res.id);
          store.provisionLedgerAccount('external');
          store.setRecipientValidated(res.status === 'ACTIVE');
          if (res.status !== 'ACTIVE') {
            store.addTerminalLine({
              type: 'warning',
              content:
                'The account is READY_FOR_VALIDATION. Ownership has not been checked, so payments are blocked.',
            });
          }
          response = res;
          break;
        }
        case 4: {
          const res = await mockApi.createTransaction(parsed, idempotencyKey, {
            // Pinned to mid-morning so a rail cut-off can never soft-lock an evening demo.
            simulatedHour: 10,
          });
          const entryId = store.postLedgerEntry({
            from: 'client',
            to: 'external',
            amount: Number(res.amount),
            rail: res.type,
            reference: res.transactionReferenceId,
            status: 'PENDING',
          });
          store.addTerminalLine({
            type: 'info',
            content: 'Status PENDING. Wait for an event update to confirm the result.',
          });
          setTimeout(() => useGameStore.getState().settleLedgerEntry(entryId, 'COMPLETED'), 4000);
          response = res;
          break;
        }
        case 5: {
          const res = await mockApi.createWebhookSubscription(parsed);
          store.setSubscriptionId(res.id);
          response = res;
          break;
        }
        case 6: {
          const res = await mockApi.generateDocument(parsed);
          store.setDocumentId(res.id);
          store.addTerminalLine({
            type: 'info',
            content: 'Status 202 Accepted. Wait for DOCUMENT_GENERATED before downloading the file.',
          });
          response = res;
          break;
        }
      }

      store.addTerminalLine({
        type: 'success',
        content: round.id === 6 ? 'HTTP 202 Accepted' : 'HTTP 201 Created',
      });
      store.addTerminalLine({ type: 'output', content: JSON.stringify(response, null, 2) });

      const errorPenalty = store.validationErrorCount * 20;
      const hintPenalty = store.hintPenalty;
      const floor = store.hintLevel > 0 ? HINT_SCORE_FLOOR : 0;
      const apiScore = Math.max(floor, 100 - errorPenalty - hintPenalty);
      store.addScore(apiScore);
      const deductions = [
        errorPenalty > 0 ? `−${errorPenalty} for ${store.validationErrorCount} rejected attempts` : '',
        hintPenalty > 0 ? `−${hintPenalty} for ${store.hintLevel} hints` : '',
        apiScore > 100 - errorPenalty - hintPenalty ? `floored at ${floor}` : '',
      ].filter(Boolean);
      const apiNote = deductions.length
        ? `100 base, ${deductions.join(', ')}`
        : 'clean first submission';
      store.setBuildApiScore(apiScore, apiNote);
      store.addTerminalLine({
        type: 'success',
        content: `API SCORE: +${apiScore} (${apiNote})`,
      });

      scheduleEmits();
      store.setBusy('Request accepted — preparing the next step');
      setTimeout(() => {
        store.setBusy(null);
        store.setPhase('ATTACK_INCOMING');
      }, 1500);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      store.setBusy(null);
      store.incrementErrors();
      store.addTerminalLine({
        type: 'error',
        content: `HTTP ${apiErr.httpStatus} — ${apiErr.title}`,
      });

      const codes: string[] = [];
      for (const ctx of apiErr.context ?? []) {
        codes.push(ctx.code);
        store.recordErrorCode(ctx.code);
        store.addTerminalLine({
          type: 'error',
          content: `  [${ctx.code}] ${ctx.message}${ctx.field ? ` (field: ${ctx.field})` : ''}`,
        });
      }
      setLastErrorCodes([...new Set(codes)]);
      store.addTerminalLine({ type: 'warning', content: 'Fix the request and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="api-builder">
      <div className="api-builder-header">
        <span className="method-badge">{round.apiMethod}</span>
        <span className="endpoint">{round.apiEndpoint}</span>
        {round.id === 1 && (
          <button className="btn-small" onClick={() => setShowClientFile(!showClientFile)}>
            {showClientFile ? '[ HIDE CLIENT FILE ]' : '[ CLIENT FILE ]'}
          </button>
        )}
        <button className="btn-small" onClick={() => setShowDocs(!showDocs)}>
          {showDocs ? '[ HIDE DOCS ]' : '[ SHOW DOCS ]'}
        </button>
      </div>

      {showClientFile && round.id === 1 && <ClientFile persona={store.persona} />}

      {showDocs && doc && (
        <motion.div
          className="api-docs-panel"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <p className="doc-description">{doc.description}</p>
          <div className="doc-fields">
            <strong>Fields to check:</strong>
            <ul>
              {doc.requiredFields.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
          <div className="doc-example">
            <strong>Example request:</strong>
            <pre>{doc.example}</pre>
          </div>
          <a className="doc-link" href={doc.docUrl} target="_blank" rel="noreferrer">
            {doc.docUrl}
          </a>
        </motion.div>
      )}

      {lastErrorCodes.length > 0 && (
        <motion.div
          className="error-cards"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {lastErrorCodes.map((code) => {
            const entry = lookupError(code);
            if (!entry) return null;
            return (
              <div key={code} className="error-card">
                <span className="error-card-code">{entry.code}</span>
                <span className="error-card-message">{entry.message}</span>
                <p className="error-card-teaches">{entry.teaches}</p>
              </div>
            );
          })}
          {doc && <p className="error-card-quote">“{doc.docQuote}”</p>}
        </motion.div>
      )}

      <div className="payload-editor">
        <label className="input-label">REQUEST BODY:</label>
        <textarea
          className={`json-editor ${isSubmitting ? 'is-busy' : ''}`}
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={20}
          spellCheck={false}
          disabled={isSubmitting}
        />
      </div>

      {isSubmitting && (
        <BusyBar label={`SENDING — ${round.apiMethod} ${round.apiEndpoint}`} />
      )}

      {round.hints && (
        <HintPanel
          hints={round.hints}
          getPayload={() => parsePayload(payload)}
          onApplyFix={handleApplyHintFix}
          disabled={isSubmitting}
        />
      )}

      <div className="builder-actions">
        <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? '[ SENDING… ]' : '[ SEND REQUEST ]'}
        </button>
        <button
          className="btn-secondary"
          onClick={() => setPayload(getDefaultPayload())}
          disabled={isSubmitting}
        >
          [ RESET ]
        </button>
      </div>
    </div>
  );
}

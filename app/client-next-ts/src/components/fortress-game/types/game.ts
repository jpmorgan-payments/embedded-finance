// =============================================================================
// Game State Type Definitions
// =============================================================================

import type { AccountCategory, WebhookEventType } from './api';

export type RoundPhase =
  | 'BRIEFING'
  | 'BUILD'
  | 'ATTACK_INCOMING'
  | 'DEFEND'
  | 'RESULT';

export type GameScreen = 'START' | 'GAME' | 'DASHBOARD';

/** Blitz is the conference-booth mode: one round, no briefing, straight to the leaderboard. */
export type GameMode = 'CAMPAIGN' | 'BLITZ';

export type PersonaId = 'FAIRY_TALE' | 'MONICA_GELLAR';

export interface PersonaSummary {
  id: PersonaId;
  name: string;
  subtitle: string;
  difficulty: 'STANDARD' | 'HARD';
  blurb: string;
  /** Wrinkles that make this persona play differently. */
  quirks: string[];
}

// --- Flow of funds ledger -----------------------------------------------------

export interface LedgerAccount {
  key: string;
  label: string;
  accountType: AccountCategory | 'EXTERNAL';
  balance: number;
  /** Whether the account exists yet — greyed out in the HUD until created. */
  provisioned: boolean;
  restricted: boolean;
  external?: boolean;
}

export interface LedgerEntry {
  id: string;
  from: string;
  to: string;
  amount: number;
  rail: string;
  reference: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'HELD';
  timestamp: number;
}

// --- Webhook inbox ------------------------------------------------------------

export interface InboxEvent {
  id: string;
  eventType: WebhookEventType;
  resourceType: string;
  resourceId: string;
  summary: string;
  /** Events that demand a response before the player can safely continue. */
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  /** Forged events must be rejected; the signature never verifies. */
  signatureValid: boolean;
  read: boolean;
  receivedAt: number;
  payload: Record<string, unknown>;
}

// --- Hints --------------------------------------------------------------------

/** Live values a hint may need to name the resource the player actually owns. */
export interface HintContext {
  persona: PersonaId;
  clientId: string | null;
  accountId: string | null;
  recipientId: string | null;
}

/** Deleting a key from the editor is expressed as a value, since the merge is shallow. */
export const HINT_REMOVE = '__REMOVE__';

/** One thing that can be wrong with a payload. Hints only mention faults still present. */
export interface HintFault {
  id: string;
  /** True while the fault is still in the payload the player is holding. */
  detect: (payload: Record<string, unknown>, ctx: HintContext) => boolean;
  /** Tier 1 — names the problem without naming the answer. */
  nudge: string;
  /** Tier 2 — the rule behind it, and what the value should be. */
  explain: string;
  /** Tier 3 — fields merged into the editor. HINT_REMOVE deletes a key. */
  fix: (ctx: HintContext, payload: Record<string, unknown>) => Record<string, unknown>;
}

export interface HintLadder {
  faults: HintFault[];
  /** Shown instead of a hint when nothing detectable is left to fix. */
  clear: string;
}

/** Escalating price of tiers 1, 2 and 3. */
export const HINT_COSTS = [10, 25, 40];
/** A round where hints were taken still banks this much for the phase. */
export const HINT_SCORE_FLOOR = 25;

// --- Defenses -----------------------------------------------------------------

/**
 * A defense is an actual Embedded Payments call the player composes, not a quiz
 * answer. The multiple-choice options remain as a scaffold for players who stall.
 */
export interface DefenseAction {
  id: string;
  label: string;
  method: string;
  endpoint: string;
  /** The payload the player must produce, matched field-by-field. */
  expectedPayload: Record<string, unknown>;
  /** Prefilled skeleton with the decisive fields blanked out. */
  starterPayload: Record<string, unknown>;
  /** Fields that actually matter for grading. */
  gradedFields: string[];
  successMessage: string;
  failureMessage: string;
  points: number;
  docHint: string;
  hints?: HintLadder;
}

export interface DefenseOption {
  id: string;
  label: string;
  description: string;
  isCorrect: boolean;
  isPartial: boolean;
  points: number;
}

export interface AttackScenario {
  id: string;
  name: string;
  owaspCategory: string;
  owaspCode: string;
  type: 'TECHNICAL' | 'BUSINESS' | 'CYBER';
  description: string;
  narrative: string; // Terminal-style story text shown during attack
  attackPayload: Record<string, unknown>; // The malicious request shown to player
  /** Preferred resolution: make the real defensive API call. */
  defenseAction: DefenseAction;
  /** Fallback resolution offered after a failed attempt or on request. */
  defenseOptions: DefenseOption[];
  defenseTimeLimit: number; // seconds
}

export interface RoundConfig {
  id: number;
  title: string;
  subtitle: string;
  briefing: string;
  apiEndpoint: string;
  apiMethod: string;
  apiDocHint: string;
  requiredFields: string[];
  buildTimeLimit: number; // seconds
  /** Webhook events this round emits into the inbox, delivered on a delay. */
  emits?: { eventType: WebhookEventType; delayMs: number; summary: string; severity: InboxEvent['severity'] }[];
  /** Progressive help for the BUILD phase, priced in points. */
  hints?: HintLadder;
  attack: AttackScenario;
}

export interface RoundResult {
  roundId: number;
  /** Net of any hint and rejected-attempt deductions, exactly as it was added to the score. */
  apiScore: number;
  /** Explains how apiScore was arrived at, since the row itself is already net. */
  apiNote: string;
  /** Net, and negative when a wrong defense cost points. */
  defenseScore: number;
  defenseNote: string;
  timeBonus: number;
  /** Always equals apiScore + defenseScore + timeBonus. */
  totalScore: number;
  validationErrors: number;
  hintsUsed: number;
  hintPenalty: number;
  attackDefended: boolean;
  /** True when the attack was stopped with a real API call rather than the guided list. */
  defendedByApiCall: boolean;
  timeTaken: number;
  /** Distinct EP error codes the player triggered — surfaced in the debrief. */
  errorCodes: string[];
}

export interface PlayerScore {
  playerName: string;
  totalScore: number;
  platformHealth: number;
  roundResults: RoundResult[];
  completedAt: string;
  totalTime: number;
  mode: GameMode;
  persona: PersonaId;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info' | 'warning' | 'attack';
  content: string;
  timestamp: number;
}

export interface GameState {
  // Screen
  screen: GameScreen;

  // Player
  playerName: string;
  mode: GameMode;
  persona: PersonaId;

  // Game progress
  currentRound: number;
  currentPhase: RoundPhase;
  platformHealth: number; // 0-100
  score: number;

  // Round tracking
  roundResults: RoundResult[];
  roundStartTime: number;
  validationErrorCount: number;
  /** Every EP error code seen this round, for the debrief cards. */
  roundErrorCodes: string[];

  // Hints — level and penalty are per phase, the round totals feed the debrief.
  hintLevel: number;
  hintPenalty: number;
  roundHintsUsed: number;
  roundHintPenalty: number;
  /** API score actually awarded in BUILD, so the debrief matches the HUD. */
  buildApiScore: number;
  buildApiNote: string;
  /** True until the player dismisses the field guide shown at the start of a run. */
  showFieldGuide: boolean;

  // Terminal
  terminalLines: TerminalLine[];

  /** Set while an async call or a scripted pause is running, null when idle. */
  busyLabel: string | null;

  // API state (carried between rounds)
  clientId: string | null;
  accountId: string | null;
  recipientId: string | null;
  subscriptionId: string | null;
  documentId: string | null;
  /** Whether the client cleared verification and outstanding requirements. */
  clientApproved: boolean;
  /** Whether the linked account passed Account Validation Service checks. */
  recipientValidated: boolean;

  // Flow of funds
  ledger: LedgerAccount[];
  ledgerEntries: LedgerEntry[];

  // Webhook inbox
  inbox: InboxEvent[];

  // Leaderboard
  leaderboard: PlayerScore[];
}


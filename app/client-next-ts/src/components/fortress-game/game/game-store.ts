// =============================================================================
// Game Store — Zustand state management for Fintech Fortress
// =============================================================================

import { create } from 'zustand';
import type {
  GameState,
  RoundResult,
  PlayerScore,
  TerminalLine,
  RoundPhase,
  GameScreen,
  GameMode,
  PersonaId,
  LedgerAccount,
  LedgerEntry,
  InboxEvent,
} from '../types';
import { seedLeaderboard } from '../data/leaderboard';
import { TOTAL_ROUNDS } from '../rounds/round-configs';
import { resetMockApi, seedDemoAccount, seedDemoRecipient } from '../api/mock-ep-api';
import { HINT_COSTS } from '../types';

const STORAGE_KEY = 'fintech-fortress-leaderboard';

/**
 * The platform's account topology, mirroring the Embedded Payments core concepts:
 * treasury funds processing, processing allocates to client accounts, management
 * holds platform fees and offset covers negative balances.
 */
function createLedger(): LedgerAccount[] {
  return [
    { key: 'treasury', label: 'Treasury DDA', accountType: 'DDA', balance: 250000, provisioned: true, restricted: false },
    { key: 'processing', label: 'Processing', accountType: 'PROCESSING', balance: 50000, provisioned: true, restricted: false },
    { key: 'management', label: 'Management', accountType: 'MANAGEMENT', balance: 0, provisioned: true, restricted: false },
    { key: 'offset', label: 'Client Offset', accountType: 'CLIENT_OFFSET', balance: 25000, provisioned: true, restricted: false },
    { key: 'client', label: 'Client Limited DDA', accountType: 'LIMITED_DDA', balance: 0, provisioned: false, restricted: false },
    { key: 'external', label: 'Linked Bank Account', accountType: 'EXTERNAL', balance: 0, provisioned: false, restricted: false, external: true },
  ];
}

function loadLeaderboard(): PlayerScore[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return [...seedLeaderboard];
}

function saveLeaderboard(leaderboard: PlayerScore[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leaderboard));
  } catch {
    // Ignore storage errors
  }
}

interface GameActions {
  // Navigation
  setScreen: (screen: GameScreen) => void;

  // Player
  setPlayerName: (name: string) => void;
  setMode: (mode: GameMode) => void;
  setPersona: (persona: PersonaId) => void;

  // Game flow
  startGame: () => void;
  dismissFieldGuide: () => void;
  setPhase: (phase: RoundPhase) => void;
  nextRound: () => void;
  endGame: () => void;
  resetGame: () => void;

  // Demo shortcuts
  jumpToRound: (round: number, phase: RoundPhase) => void;

  // Score & Health
  addScore: (points: number) => void;
  takeDamage: (amount: number) => void;
  recordRoundResult: (result: RoundResult) => void;
  incrementErrors: () => void;
  resetErrorCount: () => void;
  recordErrorCode: (code: string) => void;

  // Hints
  revealHint: (chargeable?: boolean) => void;
  resetPhaseHints: () => void;
  setBuildApiScore: (score: number, note: string) => void;

  // Terminal
  addTerminalLine: (line: Omit<TerminalLine, 'id' | 'timestamp'>) => void;
  clearTerminal: () => void;
  setBusy: (label: string | null) => void;

  // API state
  setClientId: (id: string) => void;
  setAccountId: (id: string) => void;
  setRecipientId: (id: string) => void;
  setSubscriptionId: (id: string) => void;
  setDocumentId: (id: string) => void;
  setClientApproved: (approved: boolean) => void;
  setRecipientValidated: (validated: boolean) => void;

  // Flow of funds
  provisionLedgerAccount: (key: string) => void;
  setLedgerRestricted: (key: string, restricted: boolean) => void;
  postLedgerEntry: (entry: Omit<LedgerEntry, 'id' | 'timestamp'>) => string;
  settleLedgerEntry: (entryId: string, status: LedgerEntry['status']) => void;

  // Webhook inbox
  pushInboxEvent: (event: Omit<InboxEvent, 'id' | 'receivedAt' | 'read'>) => void;
  markInboxRead: (id: string) => void;
  clearInbox: () => void;

  // Timer
  setRoundStartTime: (time: number) => void;

  // Leaderboard
  addToLeaderboard: (entry: PlayerScore) => void;
}

type GameStore = GameState & GameActions;

const initialProgress = {
  currentRound: 1,
  currentPhase: 'BRIEFING' as RoundPhase,
  platformHealth: 100,
  score: 0,
  roundResults: [] as RoundResult[],
  validationErrorCount: 0,
  roundErrorCodes: [] as string[],
  hintLevel: 0,
  hintPenalty: 0,
  roundHintsUsed: 0,
  roundHintPenalty: 0,
  buildApiScore: 0,
  buildApiNote: 'no request sent',
  showFieldGuide: false,
  terminalLines: [] as TerminalLine[],
  busyLabel: null,
  clientId: null,
  accountId: null,
  recipientId: null,
  subscriptionId: null,
  documentId: null,
  clientApproved: false,
  recipientValidated: false,
  ledgerEntries: [] as LedgerEntry[],
  inbox: [] as InboxEvent[],
};

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  screen: 'START',
  playerName: '',
  mode: 'CAMPAIGN',
  persona: 'FAIRY_TALE',
  ...initialProgress,
  roundStartTime: Date.now(),
  ledger: createLedger(),
  leaderboard: loadLeaderboard(),

  // Actions
  setScreen: (screen) => set({ screen }),

  setPlayerName: (playerName) => set({ playerName }),

  setMode: (mode) => set({ mode }),

  setPersona: (persona) => set({ persona }),

  startGame: () => {
    resetMockApi();
    set({
      screen: 'GAME',
      ...initialProgress,
      // Every run starts with the briefing-before-the-briefings; demo jumps do not.
      showFieldGuide: true,
      roundStartTime: Date.now(),
      ledger: createLedger(),
    });
  },

  dismissFieldGuide: () => set({ showFieldGuide: false }),

  setPhase: (currentPhase) => set({ currentPhase }),

  nextRound: () => {
    const { currentRound, mode } = get();
    // Blitz is a single round for booth traffic.
    if (mode === 'BLITZ' || currentRound >= TOTAL_ROUNDS) {
      get().endGame();
      return;
    }
    set({
      currentRound: currentRound + 1,
      currentPhase: 'BRIEFING',
      validationErrorCount: 0,
      roundErrorCodes: [],
      hintLevel: 0,
      hintPenalty: 0,
      roundHintsUsed: 0,
      roundHintPenalty: 0,
      buildApiScore: 0,
      buildApiNote: 'no request sent',
      roundStartTime: Date.now(),
    });
  },

  endGame: () => {
    const state = get();
    const totalTime = state.roundResults.reduce((sum, r) => sum + r.timeTaken, 0);
    const entry: PlayerScore = {
      playerName: state.playerName,
      totalScore: Math.round(state.score * (state.platformHealth / 100)),
      platformHealth: state.platformHealth,
      roundResults: state.roundResults,
      completedAt: new Date().toISOString(),
      totalTime,
      mode: state.mode,
      persona: state.persona,
    };
    get().addToLeaderboard(entry);
    set({ screen: 'DASHBOARD' });
  },

  resetGame: () => {
    resetMockApi();
    set({
      screen: 'START',
      playerName: '',
      mode: 'CAMPAIGN',
      persona: 'FAIRY_TALE',
      ...initialProgress,
      roundStartTime: Date.now(),
      ledger: createLedger(),
    });
  },

  jumpToRound: (round, phase) => {
    const state = get();
    resetMockApi();
    // Pre-populate downstream state so any round can be demoed in isolation.
    // Jumping past BUILD means this round's own resource already exists.
    const built = phase === 'ATTACK_INCOMING' || phase === 'DEFEND' || phase === 'RESULT';
    const reached = built ? round + 1 : round;
    const ledger = createLedger();
    const ids: Partial<GameState> = {};
    if (reached >= 2) {
      // Client ids are ten digits — anything else fails the format check downstream.
      ids.clientId = String(1000000000 + Math.floor(Math.random() * 899999999));
      ids.clientApproved = true;
    }
    if (reached >= 3) {
      ids.accountId = `acc-demo-${crypto.randomUUID().slice(0, 8)}`;
      const client = ledger.find((a) => a.key === 'client');
      if (client) {
        client.provisioned = true;
        client.balance = 12400;
      }
    }
    if (reached >= 4) {
      ids.recipientId = `rcp-demo-${crypto.randomUUID().slice(0, 8)}`;
      ids.recipientValidated = true;
      const external = ledger.find((a) => a.key === 'external');
      if (external) external.provisioned = true;
    }
    if (reached >= 6) {
      ids.subscriptionId = `wh-demo-${crypto.randomUUID().slice(0, 8)}`;
    }

    // The mock API must know about these IDs too, or every lookup returns 11001.
    if (ids.accountId) seedDemoAccount(ids.accountId, ids.clientId ?? null);
    if (ids.recipientId) seedDemoRecipient(ids.recipientId, ids.clientId ?? null);

    set({
      screen: 'GAME',
      playerName: state.playerName || 'DemoUser',
      ...initialProgress,
      ...ids,
      currentRound: round,
      currentPhase: phase,
      roundStartTime: Date.now(),
      ledger,
    });
  },

  addScore: (points) => set((s) => ({ score: s.score + points })),

  takeDamage: (amount) =>
    set((s) => ({ platformHealth: Math.max(0, s.platformHealth - amount) })),

  recordRoundResult: (result) =>
    set((s) => ({ roundResults: [...s.roundResults, result] })),

  incrementErrors: () =>
    set((s) => ({ validationErrorCount: s.validationErrorCount + 1 })),

  resetErrorCount: () => set({ validationErrorCount: 0, roundErrorCodes: [] }),

  recordErrorCode: (code) =>
    set((s) =>
      s.roundErrorCodes.includes(code)
        ? s
        : { roundErrorCodes: [...s.roundErrorCodes, code] }
    ),

  revealHint: (chargeable = true) =>
    set((s) => {
      if (s.hintLevel >= HINT_COSTS.length) return s;
      const cost = chargeable ? HINT_COSTS[s.hintLevel] : 0;
      return {
        hintLevel: s.hintLevel + 1,
        hintPenalty: s.hintPenalty + cost,
        roundHintsUsed: s.roundHintsUsed + 1,
        roundHintPenalty: s.roundHintPenalty + cost,
      };
    }),

  resetPhaseHints: () => set({ hintLevel: 0, hintPenalty: 0 }),

  setBuildApiScore: (buildApiScore, buildApiNote) => set({ buildApiScore, buildApiNote }),

  addTerminalLine: (line) =>
    set((s) => ({
      terminalLines: [
        ...s.terminalLines,
        {
          ...line,
          id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
        },
      ],
    })),

  clearTerminal: () => set({ terminalLines: [] }),

  setBusy: (busyLabel) => set({ busyLabel }),

  setClientId: (clientId) => set({ clientId }),
  setAccountId: (accountId) => set({ accountId }),
  setRecipientId: (recipientId) => set({ recipientId }),
  setSubscriptionId: (subscriptionId) => set({ subscriptionId }),
  setDocumentId: (documentId) => set({ documentId }),
  setClientApproved: (clientApproved) => set({ clientApproved }),
  setRecipientValidated: (recipientValidated) => set({ recipientValidated }),

  provisionLedgerAccount: (key) =>
    set((s) => ({
      ledger: s.ledger.map((a) => (a.key === key ? { ...a, provisioned: true } : a)),
    })),

  setLedgerRestricted: (key, restricted) =>
    set((s) => ({
      ledger: s.ledger.map((a) => (a.key === key ? { ...a, restricted } : a)),
    })),

  postLedgerEntry: (entry) => {
    const id = `led-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({
      ledgerEntries: [{ ...entry, id, timestamp: Date.now() }, ...s.ledgerEntries].slice(0, 25),
    }));
    return id;
  },

  settleLedgerEntry: (entryId, status) =>
    set((s) => {
      const entry = s.ledgerEntries.find((e) => e.id === entryId);
      if (!entry || entry.status !== 'PENDING') return s;

      const ledgerEntries = s.ledgerEntries.map((e) =>
        e.id === entryId ? { ...e, status } : e
      );
      // Only a completed entry moves value between accounts.
      if (status !== 'COMPLETED') return { ledgerEntries };

      return {
        ledgerEntries,
        ledger: s.ledger.map((a) => {
          if (a.key === entry.from) return { ...a, balance: a.balance - entry.amount };
          if (a.key === entry.to) return { ...a, balance: a.balance + entry.amount };
          return a;
        }),
      };
    }),

  pushInboxEvent: (event) =>
    set((s) => ({
      inbox: [
        {
          ...event,
          id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          receivedAt: Date.now(),
          read: false,
        },
        ...s.inbox,
      ].slice(0, 20),
    })),

  markInboxRead: (id) =>
    set((s) => ({
      inbox: s.inbox.map((e) => (e.id === id ? { ...e, read: true } : e)),
    })),

  clearInbox: () => set({ inbox: [] }),

  setRoundStartTime: (roundStartTime) => set({ roundStartTime }),

  addToLeaderboard: (entry) => {
    const updated = [...get().leaderboard, entry]
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 20);
    saveLeaderboard(updated);
    set({ leaderboard: updated });
  },
}));

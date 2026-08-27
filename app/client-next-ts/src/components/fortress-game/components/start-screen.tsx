// =============================================================================
// StartScreen — Title screen with player name entry
// =============================================================================

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../game/game-store';
import { personaSummaries } from '../data/personas';
import { TOTAL_ROUNDS } from '../rounds/round-configs';
import { GameInfo } from './game-info';
import { FieldGuide } from './field-guide';

const ASCII_TITLE = `
 ███████╗██╗███╗   ██╗████████╗███████╗ ██████╗██╗  ██╗
 ██╔════╝██║████╗  ██║╚══██╔══╝██╔════╝██╔════╝██║  ██║
 █████╗  ██║██╔██╗ ██║   ██║   █████╗  ██║     ███████║
 ██╔══╝  ██║██║╚██╗██║   ██║   ██╔══╝  ██║     ██╔══██║
 ██║     ██║██║ ╚████║   ██║   ███████╗╚██████╗██║  ██║
 ╚═╝     ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝

 ███████╗ ██████╗ ██████╗ ████████╗██████╗ ███████╗███████╗███████╗
 ██╔════╝██╔═══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔════╝██╔════╝██╔════╝
 █████╗  ██║   ██║██████╔╝   ██║   ██████╔╝█████╗  ███████╗███████╗
 ██╔══╝  ██║   ██║██╔══██╗   ██║   ██╔══██╗██╔══╝  ╚════██║╚════██║
 ██║     ╚██████╔╝██║  ██║   ██║   ██║  ██║███████╗███████║███████║
 ╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝
`;

export function StartScreen() {
  const [name, setName] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [nameError, setNameError] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const {
    setPlayerName,
    startGame,
    setScreen,
    setMode,
    setPersona,
    persona,
    jumpToRound,
    leaderboard,
  } = useGameStore();

  const nameValid = name.trim().length >= 2;

  /** Rather than a dead disabled button, say what is missing and put the cursor there. */
  const requireName = (): boolean => {
    if (nameValid) return true;
    setNameError(true);
    nameInput.current?.focus();
    return false;
  };

  const handleStart = () => {
    if (!requireName()) return;
    setPlayerName(name.trim());
    setMode('CAMPAIGN');
    startGame();
  };

  /** Booth mode: a single randomly chosen round, so the queue keeps moving. */
  const handleBlitz = () => {
    if (!requireName()) return;
    setPlayerName(name.trim());
    setMode('BLITZ');
    jumpToRound(1 + Math.floor(Math.random() * TOTAL_ROUNDS), 'BRIEFING');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleStart();
  };

  return (
    <div className="start-screen">
      <motion.pre
        className="ascii-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {ASCII_TITLE}
      </motion.pre>

      <motion.div
        className="start-tagline"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <p>Build a fintech platform. Defend it from attackers.</p>
        <p className="subtitle">
          Learn with J.P. Morgan Embedded Payments API examples
        </p>
      </motion.div>

      <motion.div
        className="start-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <div className={`field-block ${nameError ? 'invalid' : ''}`}>
          <label className="input-label" htmlFor="playerName">
            <span className="step-marker">STEP 1</span> ENTER YOUR NAME
            <span className="required-marker">* required</span>
          </label>
          <input
            id="playerName"
            ref={nameInput}
            className={`terminal-input ${nameError ? 'invalid' : ''} ${nameValid ? 'valid' : ''}`}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(false);
            }}
            onKeyDown={handleKeyDown}
            placeholder="type a name…"
            maxLength={20}
            aria-invalid={nameError}
            aria-describedby="playerNameHelp"
            autoFocus
          />
          <span id="playerNameHelp" className={`field-help ${nameError ? 'error' : ''}`}>
            {nameError
              ? '✗ Enter at least 2 characters to start.'
              : nameValid
                ? `✓ Playing as ${name.trim()}. Your name will appear on the leaderboard.`
                : 'Use 2–20 characters. Your name will appear on the leaderboard.'}
          </span>
        </div>

        <span className="input-label">
          <span className="step-marker">STEP 2</span> CHOOSE YOUR CLIENT
        </span>
        <div className="persona-grid">
          {personaSummaries.map((p) => (
            <button
              key={p.id}
              className={`persona-card ${persona === p.id ? 'selected' : ''}`}
              onClick={() => setPersona(p.id)}
            >
              <span className="persona-name">{p.name}</span>
              <span className="persona-subtitle">{p.subtitle}</span>
              <span className={`persona-difficulty ${p.difficulty.toLowerCase()}`}>
                {p.difficulty}
              </span>
              <p className="persona-blurb">{p.blurb}</p>
              <ul className="persona-quirks">
                {p.quirks.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className="start-mode-actions">
          <button
            className={`btn-primary ${nameValid ? '' : 'locked'}`}
            onClick={handleStart}
            title={nameValid ? undefined : 'Enter a handle first'}
          >
            [ START FULL GAME ]
          </button>
          <button
            className={`btn-secondary ${nameValid ? '' : 'locked'}`}
            onClick={handleBlitz}
            title="One random round, straight to the leaderboard"
          >
            [ QUICK PLAY — 1 MISSION ]
          </button>
        </div>
      </motion.div>

      <motion.div
        className="start-actions"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.5 }}
      >
        <button className="btn-secondary" onClick={() => setScreen('DASHBOARD')}>
          [ VIEW LEADERBOARD ]
        </button>
        <button className="btn-secondary" onClick={() => setShowGuide(true)}>
          [ FIELD GUIDE ]
        </button>
        <button className="btn-secondary" onClick={() => setShowInfo(true)}>
          [ WHAT IS THIS? ]
        </button>
      </motion.div>

      {leaderboard.length > 0 && (
        <motion.div
          className="start-leaderboard-preview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <span className="lb-title">TOP PLAYERS:</span>
          {leaderboard.slice(0, 3).map((s, i) => (
            <span key={i} className="lb-entry">
              {i + 1}. {s.playerName} — {s.totalScore}
            </span>
          ))}
        </motion.div>
      )}

      <div className="scanline" />

      <AnimatePresence>
        {showInfo && <GameInfo onClose={() => setShowInfo(false)} />}
        {showGuide && <FieldGuide onClose={() => setShowGuide(false)} />}
      </AnimatePresence>
    </div>
  );
}

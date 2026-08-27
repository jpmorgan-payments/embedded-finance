import { useEffect } from 'react';

import { Dashboard } from './components/dashboard';
import { DemoShortcuts } from './components/demo-shortcuts';
import { GameScreen } from './components/game-screen';
import { StartScreen } from './components/start-screen';
import { useGameStore } from './game/game-store';

import './fortress-game.css';

export function FortressGameApp() {
  const screen = useGameStore((s) => s.screen);

  // The game sizes everything in rem, which resolves against <html> rather than the wrapper.
  useEffect(() => {
    document.documentElement.classList.add('fortress-game-active');
    return () =>
      document.documentElement.classList.remove('fortress-game-active');
  }, []);

  return (
    <div className="fortress-game-root">
      <div className="app-container">
        {screen === 'START' && <StartScreen />}
        {screen === 'GAME' && <GameScreen />}
        {screen === 'DASHBOARD' && <Dashboard />}
        <DemoShortcuts />
        <div className="scanline-overlay" />
      </div>
    </div>
  );
}

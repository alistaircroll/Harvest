/**
 * Harvest - Creature Lab
 * Main Application Component
 */

import './App.css';
import { useState } from 'react';
import { CreatureDisplay } from './components/creature/CreatureDisplay';
import { CombatScreen } from './components/combat/CombatScreen';
import { createStarterCreature } from './utils/creatures';
import { createWildCreature } from './data/wildCreatures';
import type { PlayerCreature, PartSlot, WildCreature } from './types';

type GameScreen = 'laboratory' | 'combat';

function App() {
  // Initialize with starter rat creature
  const [creature] = useState<PlayerCreature>(() => createStarterCreature());
  const [selectedSlot, setSelectedSlot] = useState<PartSlot | null>(null);
  const [screen, setScreen] = useState<GameScreen>('laboratory');
  const [wildCreature, setWildCreature] = useState<WildCreature | null>(null);

  const handleSlotClick = (slot: PartSlot) => {
    setSelectedSlot(current => current === slot ? null : slot);
  };

  // Start combat with a wild creature
  const handleStartCombat = () => {
    // Create a random wild creature (for now, always rat)
    const wild = createWildCreature('rat', 'city');
    setWildCreature(wild);
    setScreen('combat');
  };

  // Handle victory - harvest parts
  const handleVictory = (loot: WildCreature['lootTable']) => {
    console.log('Victory! Loot:', loot);
    // TODO: Show loot selection screen
    setScreen('laboratory');
    setWildCreature(null);
  };

  // Handle defeat - lose a random part
  const handleDefeat = () => {
    console.log('Defeat! Lose a part');
    // TODO: Implement part loss
    setScreen('laboratory');
    setWildCreature(null);
  };

  // Handle flee
  const handleFlee = () => {
    setScreen('laboratory');
    setWildCreature(null);
  };

  // Render combat screen
  if (screen === 'combat' && wildCreature) {
    return (
      <main className="app">
        <CombatScreen
          playerCreature={creature}
          wildCreature={wildCreature}
          onVictory={handleVictory}
          onDefeat={handleDefeat}
          onFlee={handleFlee}
        />
      </main>
    );
  }

  // Render laboratory screen
  return (
    <main className="app">
      {/* Header */}
      <header className="app__header">
        <h1>Creature Lab</h1>
        <p className="app__subtitle">Build Your Perfect Companion</p>
      </header>

      {/* Creature Display */}
      <section className="app__creature">
        <CreatureDisplay
          creature={creature}
          selectedSlot={selectedSlot}
          onSlotClick={handleSlotClick}
          isInteractive={true}
          showStats={true}
        />
      </section>

      {/* Action Buttons */}
      <section className="app__actions">
        <button
          className="btn btn--primary btn--large"
          onClick={handleStartCombat}
        >
          Go Walking
        </button>
      </section>
    </main>
  );
}

export default App;

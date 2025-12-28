/**
 * Harvest - Creature Lab
 * Main Application Component
 */

import './App.css';
import { useState, useCallback } from 'react';
import { Laboratory } from './components/laboratory/Laboratory';
import { CombatScreen } from './components/combat/CombatScreen';
import { useCreature } from './hooks/useCreature';
import { createWildCreature } from './data/wildCreatures';
import type { WildCreature, MVPPartSlot, BodyPart } from './types';

type GameScreen = 'laboratory' | 'combat';

function App() {
  // Use creature hook for state management
  const {
    creature,
    freezer,
    availablePartsForSlot,
    hasAlternatives,
    swapPart,
    harvestPart,
    loseRandomPart,
    healCreature,
  } = useCreature();

  const [screen, setScreen] = useState<GameScreen>('laboratory');
  const [wildCreature, setWildCreature] = useState<WildCreature | null>(null);

  // Start combat with a wild creature
  const handleGoWalking = useCallback(() => {
    // Create a random wild creature (for now, always rat)
    const wild = createWildCreature('rat', 'city');
    setWildCreature(wild);
    setScreen('combat');
  }, []);

  // Handle swap part from laboratory
  const handleSwapPart = useCallback((slot: MVPPartSlot, part: BodyPart) => {
    swapPart(slot, part);
  }, [swapPart]);

  // Handle victory - harvest parts
  const handleVictory = useCallback((loot: WildCreature['lootTable']) => {
    console.log('Victory! Loot:', loot);
    // Harvest a random part from loot (loot is an object with part types as keys)
    const lootParts = [loot.torso, loot.head, loot.arm, loot.leg, loot.tail];
    const randomLoot = lootParts[Math.floor(Math.random() * lootParts.length)];
    harvestPart(randomLoot);
    // Heal creature
    healCreature();
    // Return to lab
    setScreen('laboratory');
    setWildCreature(null);
  }, [harvestPart, healCreature]);

  // Handle defeat - lose a random part
  const handleDefeat = useCallback(() => {
    console.log('Defeat!');
    const lostPart = loseRandomPart();
    if (lostPart) {
      console.log('Lost part:', lostPart);
    }
    // Heal creature
    healCreature();
    // Return to lab
    setScreen('laboratory');
    setWildCreature(null);
  }, [loseRandomPart, healCreature]);

  // Handle flee
  const handleFlee = useCallback(() => {
    setScreen('laboratory');
    setWildCreature(null);
  }, []);

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
      <Laboratory
        creature={creature}
        freezer={freezer}
        availablePartsForSlot={availablePartsForSlot}
        hasAlternatives={hasAlternatives}
        onSwapPart={handleSwapPart}
        onGoWalking={handleGoWalking}
      />
    </main>
  );
}

export default App;

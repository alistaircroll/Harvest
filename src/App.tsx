/**
 * Harvest - Creature Lab
 * Main Application Component
 */

import './App.css';
import { useState } from 'react';
import { CreatureDisplay } from './components/creature/CreatureDisplay';
import { createStarterCreature } from './utils/creatures';
import type { PlayerCreature, PartSlot } from './types';

function App() {
  // Initialize with starter rat creature
  const [creature] = useState<PlayerCreature>(() => createStarterCreature());
  const [selectedSlot, setSelectedSlot] = useState<PartSlot | null>(null);

  const handleSlotClick = (slot: PartSlot) => {
    setSelectedSlot(current => current === slot ? null : slot);
  };

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
        <button className="btn btn--primary btn--large">
          Go Walking
        </button>
      </section>
    </main>
  );
}

export default App;

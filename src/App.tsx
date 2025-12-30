/**
 * Stitch-a-Pet - Creature Lab
 * Main Application Component
 */

import './App.css';
import { useState, useCallback, useEffect } from 'react';
import { IntroScreen } from './components/intro/IntroScreen';
import { Laboratory } from './components/laboratory/Laboratory';
import { CombatScreen } from './components/combat/CombatScreen';
import { VictoryScreen } from './components/screens/VictoryScreen';
import { DefeatScreen } from './components/screens/DefeatScreen';
import { AbilityTutorialModal } from './components/tutorial/AbilityTutorialModal';
import { useCreature } from './hooks/useCreature';
import { useEncounteredAbilities } from './hooks/useEncounteredAbilities';
import { createWildCreature } from './data/loaders/creatureLoader';
import type { WildCreature, MVPPartSlot, BodyPart, Attack } from './types';
import './components/intro/intro.css';

type GameScreen = 'intro' | 'laboratory' | 'combat' | 'victory' | 'defeat';

function App() {
  // Use creature hook for state management
  const {
    creature,
    freezer,
    swapPart,
    moveToFreezer,
    emptyFreezerSlot,
    resetCreature,
    loseRandomPart,
    healCreature,
    isDead,
  } = useCreature();

  const [screen, setScreen] = useState<GameScreen>('intro');
  const [wildCreature, setWildCreature] = useState<WildCreature | null>(null);
  const [lootTable, setLootTable] = useState<WildCreature['lootTable'] | null>(null);
  const [lostPart, setLostPart] = useState<BodyPart | null>(null);
  const [petName, setPetName] = useState<string>('');
  const [showElectricity, setShowElectricity] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // Tutorial state
  const [pendingTutorials, setPendingTutorials] = useState<Attack[]>([]);
  const [tutorialIndex, setTutorialIndex] = useState(0);

  // Encountered abilities tracking
  const { getNewAbilities, markAbilitiesSeen } = useEncounteredAbilities();

  // Handle intro completion
  const handleIntroComplete = useCallback((name: string) => {
    setPetName(name);
    setScreen('laboratory');
    // Trigger electricity effect
    setShowElectricity(true);
  }, []);

  // After electricity effect, show welcome message
  useEffect(() => {
    if (showElectricity) {
      const timer = setTimeout(() => {
        setShowElectricity(false);
        setShowWelcome(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [showElectricity]);

  // Dismiss welcome message
  const handleDismissWelcome = useCallback(() => {
    setShowWelcome(false);
  }, []);

  // Start combat with a wild creature
  const handleGoWalking = useCallback(() => {
    // Create a random wild creature (for now, always rat)
    const wild = createWildCreature('rat', 'city');
    setWildCreature(wild);

    // Check for new special abilities to show tutorials
    const newAbilities = getNewAbilities(wild);
    if (newAbilities.length > 0) {
      setPendingTutorials(newAbilities);
      setTutorialIndex(0);
    } else {
      setScreen('combat');
    }
  }, [getNewAbilities]);

  // Handle tutorial dismissal
  const handleTutorialDismiss = useCallback(() => {
    if (tutorialIndex < pendingTutorials.length - 1) {
      // Move to next tutorial
      setTutorialIndex(prev => prev + 1);
    } else {
      // All tutorials shown, mark as seen and start combat
      const abilityIds = pendingTutorials.map(a => a.id || a.name.toLowerCase().replace(/\s+/g, '_'));
      markAbilitiesSeen(abilityIds);
      setPendingTutorials([]);
      setTutorialIndex(0);
      setScreen('combat');
    }
  }, [tutorialIndex, pendingTutorials, markAbilitiesSeen]);

  // Handle swap part from laboratory (drag-drop)
  const handleSwapPart = useCallback((slot: MVPPartSlot, part: BodyPart, freezerIndex: number) => {
    swapPart(slot, part, freezerIndex);
  }, [swapPart]);

  // Handle move creature part to freezer
  const handleMoveToFreezer = useCallback((slot: MVPPartSlot, freezerIndex: number) => {
    moveToFreezer(slot, freezerIndex);
  }, [moveToFreezer]);

  // Handle empty freezer slot
  const handleEmptySlot = useCallback((freezerIndex: number) => {
    emptyFreezerSlot(freezerIndex);
  }, [emptyFreezerSlot]);

  // Handle new game
  const handleNewGame = useCallback(() => {
    resetCreature();
    setPetName('');
    setScreen('intro');
  }, [resetCreature]);

  // Handle victory - show victory screen with loot
  const handleVictory = useCallback((loot: WildCreature['lootTable']) => {
    setLootTable(loot);
    setScreen('victory');
  }, []);

  // Handle defeat - show defeat screen
  const handleDefeat = useCallback(() => {
    const lost = loseRandomPart();
    setLostPart(lost);
    setScreen('defeat');
  }, [loseRandomPart]);

  // Handle swapping loot part onto creature (old part discarded)
  const handleSwapLoot = useCallback((slot: MVPPartSlot, newPart: BodyPart) => {
    // Old part is permanently discarded per lore
    swapPart(slot, newPart, 0); // freezerIndex doesn't matter, old part not stored
  }, [swapPart]);

  // Continue from victory screen
  const handleContinueFromVictory = useCallback(() => {
    healCreature();
    setScreen('laboratory');
    setWildCreature(null);
    setLootTable(null);
  }, [healCreature]);

  // Continue from defeat screen
  const handleContinueFromDefeat = useCallback(() => {
    // Always return to lab to rebuild, even if dead
    // Healing happens automatically if not dead, otherwise manual rebuild required
    if (!isDead) {
      healCreature();
    }
    setScreen('laboratory');
    setWildCreature(null);
    setLostPart(null);
  }, [healCreature, isDead]);

  // Handle flee
  const handleFlee = useCallback(() => {
    setScreen('laboratory');
    setWildCreature(null);
  }, []);

  // Render ability tutorial modal (shows before combat starts)
  if (pendingTutorials.length > 0 && wildCreature) {
    const currentAbility = pendingTutorials[tutorialIndex];
    return (
      <main className="app">
        <AbilityTutorialModal
          ability={currentAbility}
          creatureType={wildCreature.type}
          onDismiss={handleTutorialDismiss}
          currentIndex={tutorialIndex}
          totalCount={pendingTutorials.length}
        />
      </main>
    );
  }

  // Render intro screen
  if (screen === 'intro') {
    return (
      <main className="app">
        <IntroScreen onComplete={handleIntroComplete} />
      </main>
    );
  }

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

  // Render victory screen
  if (screen === 'victory' && lootTable) {
    return (
      <main className="app">
        <VictoryScreen
          lootTable={lootTable}
          creature={creature}
          onSwapPart={handleSwapLoot}
          onContinue={handleContinueFromVictory}
        />
      </main>
    );
  }

  // Render defeat screen
  if (screen === 'defeat') {
    return (
      <main className="app">
        <DefeatScreen
          lostPart={lostPart}
          creature={creature}
          onContinue={handleContinueFromDefeat}
        />
      </main>
    );
  }

  // Render laboratory screen
  return (
    <main className="app">
      {/* Electricity flash effect */}
      {showElectricity && (
        <div className="electricity-overlay electricity-overlay--active" />
      )}

      {/* Welcome message overlay */}
      {showWelcome && (
        <div className="welcome-message" onClick={handleDismissWelcome}>
          <div>
            <p className="welcome-message__text">
              Time to take <strong>{petName}</strong> for a walk.
              <br /><br />
              Maybe you'll find some <span className="welcome-message__emphasis">... parts</span> to make it better.
            </p>
            <button className="welcome-message__button" onClick={handleDismissWelcome}>
              Let's Go
            </button>
          </div>
        </div>
      )}

      <Laboratory
        creature={creature}
        freezer={freezer}
        isDead={isDead}
        onSwapPart={handleSwapPart}
        onMoveToFreezer={handleMoveToFreezer}
        onEmptySlot={handleEmptySlot}
        onGoWalking={handleGoWalking}
        onNewGame={handleNewGame}
      />
    </main>
  );
}

export default App;

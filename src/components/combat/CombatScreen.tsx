/**
 * CombatScreen Component
 * 
 * Main combat interface showing player vs wild creature battle.
 * Click on body parts to queue all attacks from that part.
 */

import { useState } from 'react';
import type { PlayerCreature, WildCreature, SelectedAttack } from '../../types';
import { useCombat } from '../../hooks/useCombat';
import { HPBar, APDisplay, CombatLog, AttackSelector } from './CombatUI';
import { CombatCreatureDisplay } from './CombatCreatureDisplay';
import { getAnimalDisplayName } from '../../utils/creatures';
import './combat.css';

// Import silhouette images
const silhouetteImages: Partial<Record<string, string>> = {};
const silhouetteModules = import.meta.glob<{ default: string }>(
    '../../assets/silhouettes/*.png',
    { eager: true }
);

for (const path of Object.keys(silhouetteModules)) {
    const filename = path.split('/').pop()?.replace('.png', '').replace('silhouette-', '');
    if (filename) {
        silhouetteImages[filename] = silhouetteModules[path].default;
    }
}

interface CombatScreenProps {
    playerCreature: PlayerCreature;
    wildCreature: WildCreature;
    onVictory: (loot: WildCreature['lootTable']) => void;
    onDefeat: () => void;
    onFlee?: () => void;
}

/**
 * Combat screen with player creature vs wild creature
 */
export function CombatScreen({
    playerCreature,
    wildCreature,
    onVictory,
    onDefeat,
    onFlee
}: CombatScreenProps) {
    const [apShake, setApShake] = useState(false);

    const {
        state,
        phase,
        playerHp,
        enemyHp,
        playerAp,
        playerMaxAp,
        enemyMaxAp,
        availableAttacks,
        selectedAttacks,
        selectedSlots,
        addAttack,
        addAttacks,
        removeAttack,
        clearAttacks,
        executeTurn,
        log
    } = useCombat({
        playerCreature,
        wildCreature
    });

    const handleInsufficientAP = () => {
        setApShake(true);
        setTimeout(() => setApShake(false), 500);
    };

    // Handle victory/defeat
    const handleContinue = () => {
        if (phase === 'victory') {

            // ... (skipping unchanged lines is hard with replace_file_content if I want to be precise, I'll just target the destructure block first)
            // Wait, replace_file_content is single block.
            // I will do two replaces. One for destructure, one for usage.
            // Actually, I can just replace the destructure block now.

            onVictory(wildCreature.lootTable);
        } else {
            onDefeat();
        }
    };

    // Handle clicking a body part
    const handlePartClick = (attacks: SelectedAttack[]) => {
        addAttacks(attacks);
    };

    return (
        <div className="combat-screen">
            {/* Victory/Defeat Overlay */}
            {(phase === 'victory' || phase === 'defeat') && (
                <div className="combat-screen__result">
                    <h1 className={`combat-screen__result-title ${phase === 'victory' ? 'combat-screen__result-title--victory' : 'combat-screen__result-title--defeat'}`}>
                        {phase === 'victory' ? 'Victory!' : 'Defeat!'}
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                        {phase === 'victory'
                            ? `You harvested parts from the ${wildCreature.type}!`
                            : 'Your creature was defeated... You lose a random part!'
                        }
                    </p>
                    <button
                        className="combat-screen__result-button"
                        onClick={handleContinue}
                    >
                        Continue
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="combat-screen__header">
                <span className="combat-screen__turn">Turn {state.turn}</span>
                {onFlee && phase === 'player_turn' && (
                    <button
                        onClick={onFlee}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--color-dusty-taupe)',
                            color: 'var(--color-dusty-taupe)',
                            padding: '8px 16px',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer'
                        }}
                    >
                        Flee
                    </button>
                )}
            </div>

            {/* Combat Arena with Creatures */}
            <div className="combat-screen__arena combat-screen__arena--with-creatures">
                {/* Player Side */}
                <div className="combat-screen__player">
                    <span className="combat-screen__creature-label">Your Creature</span>
                    <div className="combat-screen__stats">
                        <HPBar
                            current={playerHp}
                            max={state.playerCreature.maxHp}
                            label="HP"
                        />
                        <APDisplay current={playerAp} max={playerMaxAp} shake={apShake} />
                    </div>
                </div>

                {/* Player Creature Visual */}
                <div className="combat-screen__creature-visual">
                    <CombatCreatureDisplay
                        creature={state.playerCreature}
                        selectedSlots={selectedSlots}
                        remainingAp={playerAp}
                        onPartClick={handlePartClick}
                        disabled={phase !== 'player_turn'}
                    />
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-dusty-taupe)', textAlign: 'center' }}>
                        Click a body part to queue attacks
                    </p>
                </div>

                {/* VS */}
                <div className="combat-screen__versus">VS</div>

                {/* Enemy Creature Visual */}
                <div className="combat-screen__creature-visual">
                    <div style={{
                        width: 120,
                        height: 120,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {silhouetteImages[wildCreature.type] ? (
                            <img
                                src={silhouetteImages[wildCreature.type]}
                                alt={`${wildCreature.type} silhouette`}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                                }}
                            />
                        ) : (
                            <span style={{ fontSize: '3rem' }}>🐀</span>
                        )}
                    </div>
                </div>

                {/* Enemy Side */}
                <div className="combat-screen__enemy">
                    <span className="combat-screen__creature-label">
                        Wild {getAnimalDisplayName(wildCreature.type)}
                    </span>
                    <div className="combat-screen__stats">
                        <HPBar
                            current={enemyHp}
                            max={wildCreature.totalHp}
                            label="HP"
                            isEnemy
                        />
                        <APDisplay current={enemyMaxAp} max={wildCreature.apPerTurn} />
                    </div>
                </div>
            </div>

            {/* Attack Queue */}
            {phase === 'player_turn' && (
                <AttackSelector
                    availableAttacks={availableAttacks}
                    selectedAttacks={selectedAttacks}
                    remainingAp={playerAp}
                    onAttackSelect={addAttack} // addAttacks expects array, but AttackSelector calls with single.
                    onAttackRemove={removeAttack}
                    onClear={clearAttacks}
                    onExecute={executeTurn}
                    onInsufficientAP={handleInsufficientAP}
                />
            )}

            {/* Combat Log */}
            <CombatLog log={log} />
        </div>
    );
}

export default CombatScreen;

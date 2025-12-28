/**
 * CombatScreen Component
 * 
 * Main combat interface showing player vs wild creature battle.
 * Click on body parts to queue all attacks from that part.
 */

import type { PlayerCreature, WildCreature, SelectedAttack } from '../../types';
import { useCombat } from '../../hooks/useCombat';
import { HPBar, APDisplay, CombatLog } from './CombatUI';
import { CombatCreatureDisplay } from './CombatCreatureDisplay';
import { getAnimalDisplayName } from '../../utils/creatures';
import './combat.css';

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
    const {
        state,
        phase,
        playerHp,
        enemyHp,
        playerAp,
        playerMaxAp,
        enemyMaxAp,
        selectedAttacks,
        selectedSlots,
        addAttacks,
        removeAttack,
        clearAttacks,
        executeTurn,
        log
    } = useCombat({
        playerCreature,
        wildCreature
    });

    // Handle victory/defeat
    const handleContinue = () => {
        if (phase === 'victory') {
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
                        <APDisplay current={playerAp} max={playerMaxAp} />
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
                        Click a body part to attack
                    </p>
                </div>

                {/* VS */}
                <div className="combat-screen__versus">VS</div>

                {/* Enemy Creature Visual (placeholder - could add enemy images) */}
                <div className="combat-screen__creature-visual">
                    <div style={{
                        width: 100,
                        height: 100,
                        background: 'var(--color-bg-elevated)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem'
                    }}>
                        🐀
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
                <div className="attack-selector">
                    <div className="attack-selector__queue">
                        <div className="attack-selector__queue-header">
                            <span className="attack-selector__queue-title">Attack Queue</span>
                            {selectedAttacks.length > 0 && (
                                <button
                                    className="attack-selector__clear"
                                    onClick={clearAttacks}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <div className="attack-selector__queue-list">
                            {selectedAttacks.length === 0 ? (
                                <span className="attack-selector__empty">Click body parts to queue attacks...</span>
                            ) : (
                                selectedAttacks.map((sa, index) => (
                                    <div key={index} className="attack-selector__queued-attack">
                                        <span>{sa.attack.name}</span>
                                        <button onClick={() => removeAttack(index)}>✕</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Execute button */}
                    <button
                        className="attack-selector__execute"
                        onClick={executeTurn}
                        disabled={selectedAttacks.length === 0}
                    >
                        Execute Turn ({selectedAttacks.length} attack{selectedAttacks.length !== 1 ? 's' : ''})
                    </button>
                </div>
            )}

            {/* Combat Log */}
            <CombatLog log={log} />
        </div>
    );
}

export default CombatScreen;

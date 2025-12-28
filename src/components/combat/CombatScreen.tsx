/**
 * CombatScreen Component
 * 
 * Main combat interface showing player vs wild creature battle.
 */

import type { PlayerCreature, WildCreature } from '../../types';
import { useCombat } from '../../hooks/useCombat';
import { HPBar, APDisplay, AttackSelector, CombatLog } from './CombatUI';
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
        availableAttacks,
        selectedAttacks,
        addAttack,
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

            {/* Combat Arena */}
            <div className="combat-screen__arena">
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
                    {/* Mini creature preview could go here */}
                </div>

                {/* VS */}
                <div className="combat-screen__versus">VS</div>

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

            {/* Combat Log */}
            <CombatLog log={log} />

            {/* Attack Selector (only during player turn) */}
            {phase === 'player_turn' && (
                <AttackSelector
                    availableAttacks={availableAttacks}
                    selectedAttacks={selectedAttacks}
                    remainingAp={playerAp}
                    onAttackSelect={addAttack}
                    onAttackRemove={removeAttack}
                    onClear={clearAttacks}
                    onExecute={executeTurn}
                />
            )}
        </div>
    );
}

export default CombatScreen;

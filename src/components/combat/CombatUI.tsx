/**
 * Combat UI Components
 * 
 * HPBar, APDisplay, and AttackSelector for combat screen.
 */

import type { SelectedAttack } from '../../types';
import { AttackCard } from './AttackCard';
import './combat.css';

// ================================
// HP Bar Component
// ================================

interface HPBarProps {
    current: number;
    max: number;
    label?: string;
    isEnemy?: boolean;
}

export function HPBar({ current, max, label, isEnemy = false }: HPBarProps) {
    const percentage = Math.max(0, Math.min(100, (current / max) * 100));
    const isLow = percentage <= 25;
    const isMedium = percentage > 25 && percentage <= 50;

    return (
        <div className={`hp-bar ${isEnemy ? 'hp-bar--enemy' : ''}`}>
            {label && <span className="hp-bar__label">{label}</span>}
            <div className="hp-bar__track">
                <div
                    className={`hp-bar__fill ${isLow ? 'hp-bar__fill--low' : ''} ${isMedium ? 'hp-bar__fill--medium' : ''}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="hp-bar__value">{current}/{max}</span>
        </div>
    );
}

// ================================
// AP Display Component
// ================================

interface APDisplayProps {
    current: number;
    max: number;
    shake?: boolean;
}

export function APDisplay({ current, max, shake = false }: APDisplayProps) {
    const pips = [];

    for (let i = 0; i < max; i++) {
        const isActive = i < current;
        pips.push(
            <div
                key={i}
                className={`ap-pip ${isActive ? 'ap-pip--active' : 'ap-pip--spent'}`}
            />
        );
    }

    return (
        <div className={`ap-display ${shake ? 'ap-display--shake' : ''}`}>
            <span className="ap-display__label">AP</span>
            <div className="ap-display__pips">{pips}</div>
        </div>
    );
}

// ================================
// Attack Selector Component
// ================================

interface AttackSelectorProps {
    availableAttacks: SelectedAttack[];
    selectedAttacks: SelectedAttack[];
    remainingAp: number;
    onAttackSelect: (attack: SelectedAttack) => void;
    onAttackRemove: (index: number) => void;
    onClear: () => void;
    onExecute: () => void;
    onInsufficientAP?: () => void;
}

export function AttackSelector({
    availableAttacks,
    selectedAttacks,
    remainingAp,
    onAttackSelect,
    onAttackRemove,
    onClear,
    onExecute,
    onInsufficientAP
}: AttackSelectorProps) {
    return (
        <div className="attack-selector">
            {/* Selected attacks queue */}
            <div className="attack-selector__queue">
                <div className="attack-selector__queue-header">
                    <span className="attack-selector__queue-title">Attack Queue</span>
                    {selectedAttacks.length > 0 && (
                        <button
                            className="attack-selector__clear"
                            onClick={onClear}
                        >
                            Clear
                        </button>
                    )}
                </div>
                <div className="attack-selector__queue-list">
                    {selectedAttacks.length === 0 ? (
                        <span className="attack-selector__empty">Select attacks below...</span>
                    ) : (
                        selectedAttacks.map((sa, index) => (
                            <div key={index} className="attack-selector__queued-attack">
                                <span>{sa.attack.name}</span>
                                <button onClick={() => onAttackRemove(index)}>✕</button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Available attacks */}
            <div className="attack-selector__available">
                {availableAttacks.map((sa, index) => {
                    const canAfford = sa.attack.apCost <= remainingAp;
                    return (
                        <AttackCard
                            key={`${sa.sourcePartSlot}-${index}`}
                            attack={sa.attack}
                            sourceAnimal={sa.sourceAnimal}
                            disabled={!canAfford}
                            onClick={() => canAfford && onAttackSelect(sa)}
                            onDisabledClick={onInsufficientAP}
                        />
                    );
                })}
            </div>

            {/* Execute button */}
            <button
                className="attack-selector__execute"
                onClick={onExecute}
                disabled={selectedAttacks.length === 0}
            >
                Execute Turn ({selectedAttacks.length} attack{selectedAttacks.length !== 1 ? 's' : ''})
            </button>
        </div>
    );
}

// ================================
// Combat Log Component
// ================================

interface CombatLogProps {
    log: { turn: number; message: string; type: string }[];
}

export function CombatLog({ log }: CombatLogProps) {
    return (
        <div className="combat-log">
            {log.slice(-8).map((entry, index) => (
                <div
                    key={index}
                    className={`combat-log__entry combat-log__entry--${entry.type}`}
                >
                    {entry.message}
                </div>
            ))}
        </div>
    );
}

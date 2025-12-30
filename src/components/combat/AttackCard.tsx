import { useState } from 'react';
import type { Attack, AnimalType } from '../../types';
import { getAnimalDisplayName } from '../../utils/creatures';
import './combat.css';

interface AttackCardProps {
    attack: Attack;
    sourceAnimal?: AnimalType;
    disabled?: boolean;
    selected?: boolean;
    onClick?: () => void;
    onDisabledClick?: () => void;
}

export function AttackCard({
    attack,
    sourceAnimal,
    disabled = false,
    selected = false,
    onClick,
    onDisabledClick
}: AttackCardProps) {
    const [shake, setShake] = useState(false);

    const handleClick = () => {
        if (disabled) {
            setShake(true);
            setTimeout(() => setShake(false), 500);
            onDisabledClick?.();
            return;
        }
        onClick?.();
    };

    const hasEffect = attack.effect !== null;

    // Interpret Speed based on AP Cost (Lower AP = Faster/More actions)
    const isFast = attack.apCost <= 2;
    const isSlow = attack.apCost >= 4;

    return (
        <button
            className={`attack-card ${disabled ? 'attack-card--disabled' : ''} ${selected ? 'attack-card--selected' : ''} ${hasEffect ? 'attack-card--special' : ''} ${shake ? 'attack-card--shake' : ''}`}
            onClick={handleClick}
            // Do not use disabled attribute, to allow click for shake
            aria-disabled={disabled}
        >
            <div className="attack-card__header">
                <div className="attack-card__cost-badge">
                    <span className="attack-card__ap">{attack.apCost}</span>
                    <span className="attack-card__ap-label">AP</span>
                </div>
                {isFast && <span className="attack-card__speed" title="Fast">⚡</span>}
                {isSlow && <span className="attack-card__speed" title="Slow">🐢</span>}
            </div>

            <div className="attack-card__body">
                <span className="attack-card__name">{attack.name}</span>

                <div className="attack-card__stats">
                    {attack.damage > 0 && (
                        <span className="attack-card__stat attack-card__stat--dmg">
                            {attack.damage} <span className="attack-card__stat-label">DMG</span>
                        </span>
                    )}
                    {/* Show heal as stat if primary */}
                    {attack.effect?.type === 'heal' && (
                        <span className="attack-card__stat attack-card__stat--heal">
                            +{attack.effect.value} <span className="attack-card__stat-label">HP</span>
                        </span>
                    )}
                </div>

                {attack.effect && attack.effect.type !== 'heal' && (
                    <div className="attack-card__effect">
                        {attack.effect.type === 'dot' && `Bleed ${attack.effect.value}`}
                        {attack.effect.type === 'stun' && `Stun`}
                        {attack.effect.type === 'freeze' && `Freeze`}
                        {attack.effect.type === 'debuff_defense' && `Break Def`}
                        {/* Fallback for others */}
                        {!['dot', 'stun', 'freeze', 'debuff_defense'].includes(attack.effect.type) && attack.effect.type}
                    </div>
                )}
            </div>

            {sourceAnimal && (
                <div className="attack-card__footer">
                    from {getAnimalDisplayName(sourceAnimal)}
                </div>
            )}
        </button>
    );
}

/**
 * BodyPartCard Component
 * 
 * Displays a single body part with its stats and attacks.
 * Used in creature display, parts drawer, and freezer.
 */

import type { BodyPart, Attack } from '../../types';
import { getAnimalDisplayName } from '../../utils/creatures';
import './creature.css';

interface BodyPartCardProps {
    part: BodyPart | null;
    slotType?: string;
    isSelected?: boolean;
    isInteractive?: boolean;
    onClick?: () => void;
    compact?: boolean;
}

/**
 * Card displaying a body part with stats and attacks
 */
export function BodyPartCard({
    part,
    slotType,
    isSelected = false,
    isInteractive = true,
    onClick,
    compact = false,
}: BodyPartCardProps) {
    // Empty slot
    if (!part) {
        return (
            <div
                className={`body-part-card body-part-card--empty`}
                onClick={isInteractive ? onClick : undefined}
            >
                <div className="body-part-card__header">
                    <span className="body-part-card__animal">Empty</span>
                    {slotType && (
                        <span className="body-part-card__type">{slotType}</span>
                    )}
                </div>
            </div>
        );
    }

    const hasHp = 'hpBonus' in part && part.hpBonus;


    return (
        <div
            className={`body-part-card ${isSelected ? 'body-part-card--selected' : ''}`}
            onClick={isInteractive ? onClick : undefined}
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
        >
            {/* Header: Animal name + Part type */}
            <div className="body-part-card__header">
                <span className="body-part-card__animal">
                    {getAnimalDisplayName(part.animalType)}
                </span>
                <span className="body-part-card__type">
                    {part.partType}
                </span>
            </div>

            {/* Stats: HP (if applicable) + Defense */}
            {!compact && (
                <div className="body-part-card__stats">
                    {hasHp && (
                        <div className="body-part-card__stat body-part-card__stat--hp">
                            <span>♥</span>
                            <span>+{(part as { hpBonus: number }).hpBonus}</span>
                        </div>
                    )}
                    {part.defense > 0 && (
                        <div className="body-part-card__stat body-part-card__stat--def">
                            <span>🛡</span>
                            <span>+{part.defense}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Attacks */}
            {!compact && part.attacks.length > 0 && (
                <div className="body-part-card__attacks">
                    {part.attacks.map((attack, index) => (
                        <AttackRow key={index} attack={attack} />
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Single attack row within a body part card
 */
function AttackRow({ attack }: { attack: Attack }) {
    const isSpecial = attack.effect !== null;

    return (
        <div className={`body-part-card__attack ${isSpecial ? 'body-part-card__attack--special' : ''}`}>
            <span className="body-part-card__attack-name">
                {attack.name}
            </span>
            <span className="body-part-card__attack-cost">
                {attack.apCost}AP
                {attack.damage > 0 && ` / ${attack.damage}`}
                {attack.effect?.type === 'heal' && ` +${attack.effect.value}HP`}
                {attack.effect?.type === 'dot' && ` +${attack.effect.value}/t`}
            </span>
        </div>
    );
}

export default BodyPartCard;

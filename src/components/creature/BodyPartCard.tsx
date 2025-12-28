/**
 * BodyPartCard Component
 * 
 * Displays a single body part with its stats and attacks.
 * Shows artwork when available, falls back to text display.
 */

import type { BodyPart, Attack, PartType, AnimalType } from '../../types';
import { getAnimalDisplayName } from '../../utils/creatures';
import './creature.css';

// Import body part images
// Vite handles these as URL imports
const bodyPartImages: Partial<Record<`${AnimalType}-${PartType}`, string>> = {};

// Dynamically import available images
const imageModules = import.meta.glob<{ default: string }>(
    '../../assets/body-parts/*.png',
    { eager: true }
);

// Parse the imported modules into our lookup object
for (const path of Object.keys(imageModules)) {
    const filename = path.split('/').pop()?.replace('.png', '');
    if (filename) {
        bodyPartImages[filename as `${AnimalType}-${PartType}`] = imageModules[path].default;
    }
}

/**
 * Get the image URL for a body part if available
 */
function getBodyPartImage(animalType: AnimalType, partType: PartType): string | null {
    const key = `${animalType}-${partType}` as `${AnimalType}-${PartType}`;
    return bodyPartImages[key] || null;
}

interface BodyPartCardProps {
    part: BodyPart | null;
    slotType?: string;
    isSelected?: boolean;
    isInteractive?: boolean;
    isFuture?: boolean;  // Locked future slot
    onClick?: () => void;
    compact?: boolean;
    showImage?: boolean; // Whether to display artwork
}

/**
 * Card displaying a body part with stats and attacks
 */
export function BodyPartCard({
    part,
    slotType,
    isSelected = false,
    isInteractive = true,
    isFuture = false,
    onClick,
    compact = false,
    showImage = true,
}: BodyPartCardProps) {
    // Future/locked slot
    if (isFuture) {
        return (
            <div className="body-part-card body-part-card--future body-part-card--compact">
                <div className="body-part-card__header">
                    {slotType && (
                        <span className="body-part-card__type">{slotType}</span>
                    )}
                </div>
            </div>
        );
    }

    // Empty slot
    if (!part) {
        return (
            <div
                className={`body-part-card body-part-card--empty ${compact ? 'body-part-card--compact' : ''}`}
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
    const imageUrl = showImage ? getBodyPartImage(part.animalType, part.partType) : null;

    return (
        <div
            className={`body-part-card ${isSelected ? 'body-part-card--selected' : ''} ${compact ? 'body-part-card--compact' : ''} ${imageUrl ? 'body-part-card--has-image' : ''}`}
            onClick={isInteractive ? onClick : undefined}
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
        >
            {/* Body Part Image */}
            {imageUrl && (
                <div className="body-part-card__image-container">
                    <img
                        src={imageUrl}
                        alt={`${part.animalType} ${part.partType}`}
                        className="body-part-card__image"
                    />
                </div>
            )}

            {/* Header: Animal name + Part type */}
            <div className="body-part-card__header">
                <span className="body-part-card__animal">
                    {getAnimalDisplayName(part.animalType)}
                </span>
                <span className="body-part-card__type">
                    {slotType || part.partType}
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

/**
 * BodyPartCard Component
 * 
 * Card displaying a body part with stats and attacks.
 * Used both in creature display and selection interfaces.
 * Supports drag-and-drop for freezer part swapping.
 */

import { useState } from 'react';
import type { BodyPart, Attack, PartType, AnimalType, MVPPartSlot } from '../../types';
import { getAnimalDisplayName } from '../../utils/creatures';
import './creature.css';

// Import body part images dynamicallyte handles these as URL imports
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
    slotPartType?: PartType; // The part type this slot accepts (for drop validation)
    creatureSlot?: MVPPartSlot; // The creature slot this card represents (for drag data)
    isSelected?: boolean;
    isInteractive?: boolean;
    isDraggable?: boolean; // Whether this part can be dragged to freezer
    isFuture?: boolean;  // Locked future slot
    isHighlighted?: boolean; // Has frozen alternatives
    onClick?: () => void;
    onDrop?: (droppedPart: BodyPart, freezerIndex: number) => void; // Called when a part is dropped here
    compact?: boolean;
    showImage?: boolean; // Whether to display artwork
    mirrorImage?: boolean; // Flip image horizontally (for right-side limbs)
}

/**
 * Card displaying a body part with stats and attacks
 */
export function BodyPartCard({
    part,
    slotType,
    slotPartType,
    creatureSlot,
    isSelected = false,
    isInteractive = true,
    isDraggable = false,
    isFuture = false,
    isHighlighted = false,
    onClick,
    onDrop,
    compact = false,
    showImage = true,
    mirrorImage = false,
}: BodyPartCardProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isValidDrop, setIsValidDrop] = useState(false);

    // Handle drag start for creature-to-freezer drag
    const handleDragStart = (e: React.DragEvent) => {
        if (!isDraggable || !part || !creatureSlot) return;
        e.dataTransfer.setData('application/json', JSON.stringify({
            source: 'creature',
            creatureSlot: creatureSlot,
            partType: part.partType,
            part: part,
        }));
        e.dataTransfer.effectAllowed = 'move';
    };

    // Handle drag over - check compatibility
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!onDrop || !slotPartType) return;

        try {
            // Check if the dragged part is compatible
            const data = e.dataTransfer.types.includes('application/json');
            if (data) {
                setIsDragOver(true);
                // We can't read the data during dragover, so we allow it
                // and validate on drop
                e.dataTransfer.dropEffect = 'move';
            }
        } catch {
            // Ignore errors
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        if (!onDrop) return;
        setIsDragOver(true);
        // Try to read data type from types array for validation hint
        // This is a hint only; actual validation happens on drop
        setIsValidDrop(true); // Assume valid, validate on drop
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        setIsValidDrop(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        setIsValidDrop(false);

        if (!onDrop || !slotPartType) return;

        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            const droppedPartType = data.partType as PartType;

            // Check compatibility
            const isCompatible = droppedPartType === slotPartType;

            if (isCompatible && data.part) {
                onDrop(data.part as BodyPart, data.freezerIndex);
            }
        } catch {
            // Invalid drop data
        }
    };
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
            className={`body-part-card ${isSelected ? 'body-part-card--selected' : ''} ${compact ? 'body-part-card--compact' : ''} ${imageUrl ? 'body-part-card--has-image' : ''} ${isHighlighted ? 'body-part-card--highlighted' : ''} ${isDragOver ? 'body-part-card--drag-over' : ''} ${isDragOver && isValidDrop ? 'body-part-card--drop-valid' : ''} ${isDraggable ? 'body-part-card--draggable' : ''}`}
            onClick={isInteractive ? onClick : undefined}
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            draggable={isDraggable && !!part}
            onDragStart={isDraggable ? handleDragStart : undefined}
            onDragOver={onDrop ? handleDragOver : undefined}
            onDragEnter={onDrop ? handleDragEnter : undefined}
            onDragLeave={onDrop ? handleDragLeave : undefined}
            onDrop={onDrop ? handleDrop : undefined}
        >
            {/* Body Part Image */}
            {imageUrl && (
                <div className="body-part-card__image-container">
                    <img
                        src={imageUrl}
                        alt={`${part.animalType} ${part.partType}`}
                        className={`body-part-card__image ${mirrorImage ? 'body-part-card__image--mirrored' : ''}`}
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

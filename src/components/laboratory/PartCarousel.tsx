/**
 * PartCarousel Component
 * 
 * Modal overlay for selecting body parts with left/right navigation.
 * Shows current part large in center with preview stats.
 */

import { useState, useCallback, useEffect } from 'react';
import type { BodyPart, AnimalType, PartType } from '../../types';
import { getAnimalDisplayName, getPartTypeDisplayName } from '../../utils/creatures';
import './laboratory.css';

// Import body part images dynamically
const bodyPartImages: Partial<Record<`${AnimalType}-${PartType}`, string>> = {};
const imageModules = import.meta.glob<{ default: string }>(
    '../../assets/body-parts/*.png',
    { eager: true }
);

for (const path of Object.keys(imageModules)) {
    const filename = path.split('/').pop()?.replace('.png', '');
    if (filename) {
        bodyPartImages[filename as `${AnimalType}-${PartType}`] = imageModules[path].default;
    }
}

function getBodyPartImage(animalType: AnimalType, partType: PartType): string | null {
    const key = `${animalType}-${partType}` as `${AnimalType}-${PartType}`;
    return bodyPartImages[key] || null;
}

interface PartCarouselProps {
    /** Available parts to choose from */
    parts: BodyPart[];
    /** Currently equipped part (for highlighting) */
    currentPart: BodyPart | null;
    /** Slot name for display */
    slotName: string;
    /** Called when user locks in a selection */
    onSelect: (part: BodyPart) => void;
    /** Called when user cancels */
    onCancel: () => void;
}

export function PartCarousel({
    parts,
    currentPart,
    slotName,
    onSelect,
    onCancel
}: PartCarouselProps) {
    // Find initial index (current part or 0)
    const initialIndex = currentPart
        ? parts.findIndex(p => p.animalType === currentPart.animalType && p.partType === currentPart.partType)
        : 0;

    const [selectedIndex, setSelectedIndex] = useState(Math.max(0, initialIndex));
    const [isLocking, setIsLocking] = useState(false);

    const selectedPart = parts[selectedIndex];
    const isCurrentPart = currentPart && selectedPart &&
        currentPart.animalType === selectedPart.animalType &&
        currentPart.partType === selectedPart.partType;

    // Navigate left
    const goLeft = useCallback(() => {
        setSelectedIndex(prev => (prev - 1 + parts.length) % parts.length);
    }, [parts.length]);

    // Navigate right
    const goRight = useCallback(() => {
        setSelectedIndex(prev => (prev + 1) % parts.length);
    }, [parts.length]);

    // Lock in selection
    const handleLockIn = useCallback(() => {
        if (!selectedPart) return;

        setIsLocking(true);
        // Brief delay for animation
        setTimeout(() => {
            onSelect(selectedPart);
        }, 300);
    }, [selectedPart, onSelect]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowLeft':
                    goLeft();
                    break;
                case 'ArrowRight':
                    goRight();
                    break;
                case 'Enter':
                    handleLockIn();
                    break;
                case 'Escape':
                    onCancel();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goLeft, goRight, handleLockIn, onCancel]);

    if (!selectedPart) {
        return (
            <div className="part-carousel__overlay" onClick={onCancel}>
                <div className="part-carousel__modal">
                    <p>No parts available for this slot.</p>
                    <button onClick={onCancel}>Close</button>
                </div>
            </div>
        );
    }

    const imageUrl = getBodyPartImage(selectedPart.animalType, selectedPart.partType);

    // Get prev/next parts for preview
    const prevIndex = (selectedIndex - 1 + parts.length) % parts.length;
    const nextIndex = (selectedIndex + 1) % parts.length;
    const prevPart = parts[prevIndex];
    const nextPart = parts[nextIndex];

    return (
        <div className="part-carousel__overlay" onClick={onCancel}>
            <div className="part-carousel__modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="part-carousel__header">
                    <h2 className="part-carousel__title">Select {slotName}</h2>
                    <span className="part-carousel__counter">
                        {selectedIndex + 1} / {parts.length}
                    </span>
                </div>

                {/* Carousel */}
                <div className="part-carousel__carousel">
                    {/* Left Arrow + Preview */}
                    <button
                        className="part-carousel__arrow part-carousel__arrow--left"
                        onClick={goLeft}
                        disabled={parts.length <= 1}
                    >
                        <span className="part-carousel__arrow-icon">◀</span>
                        {parts.length > 1 && (
                            <span className="part-carousel__preview-label">
                                {getAnimalDisplayName(prevPart.animalType)}
                            </span>
                        )}
                    </button>

                    {/* Center Part */}
                    <div className={`part-carousel__selected ${isLocking ? 'part-carousel__selected--locking' : ''} ${isCurrentPart ? 'part-carousel__selected--current' : ''}`}>
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={`${selectedPart.animalType} ${selectedPart.partType}`}
                                className="part-carousel__image"
                            />
                        ) : (
                            <div className="part-carousel__placeholder">
                                {getAnimalDisplayName(selectedPart.animalType)}
                            </div>
                        )}

                        {/* Part Info */}
                        <div className="part-carousel__info">
                            <h3 className="part-carousel__part-name">
                                {getAnimalDisplayName(selectedPart.animalType)} {getPartTypeDisplayName(selectedPart.partType)}
                            </h3>

                            {/* Stats */}
                            <div className="part-carousel__stats">
                                {(selectedPart.hpBonus ?? 0) > 0 && (
                                    <span className="part-carousel__stat part-carousel__stat--hp">
                                        +{selectedPart.hpBonus} HP
                                    </span>
                                )}
                                {selectedPart.defense > 0 && (
                                    <span className="part-carousel__stat part-carousel__stat--def">
                                        +{selectedPart.defense} DEF
                                    </span>
                                )}
                            </div>

                            {/* Attacks */}
                            {selectedPart.attacks.length > 0 && (
                                <div className="part-carousel__attacks">
                                    {selectedPart.attacks.map((attack, i) => (
                                        <div key={i} className="part-carousel__attack">
                                            <span className="part-carousel__attack-name">{attack.name}</span>
                                            <span className="part-carousel__attack-cost">{attack.apCost} AP</span>
                                            <span className="part-carousel__attack-damage">{attack.damage} dmg</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {isCurrentPart && (
                                <span className="part-carousel__current-badge">Currently Equipped</span>
                            )}
                        </div>
                    </div>

                    {/* Right Arrow + Preview */}
                    <button
                        className="part-carousel__arrow part-carousel__arrow--right"
                        onClick={goRight}
                        disabled={parts.length <= 1}
                    >
                        {parts.length > 1 && (
                            <span className="part-carousel__preview-label">
                                {getAnimalDisplayName(nextPart.animalType)}
                            </span>
                        )}
                        <span className="part-carousel__arrow-icon">▶</span>
                    </button>
                </div>

                {/* Actions */}
                <div className="part-carousel__actions">
                    <button
                        className="part-carousel__cancel"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className="part-carousel__lock-in"
                        onClick={handleLockIn}
                        disabled={isLocking}
                    >
                        {isLocking ? '✓' : 'Lock In'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PartCarousel;

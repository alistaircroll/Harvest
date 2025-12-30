/**
 * FreezerPanel Component
 * 
 * Displays 3 backup part slots with icy styling.
 * Parts are DRAGGABLE to creature slots.
 * Slots are DROP TARGETS for creature parts.
 * Includes "Empty" button with two-step confirmation.
 */

import { useState } from 'react';
import type { BodyPart, AnimalType, PartType, MVPPartSlot, DragPayload } from '../../types';
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

interface FreezerPanelProps {
    /** Freezer slots (3 slots, can be null) */
    freezer: (BodyPart | null)[];
    /** Called when a part starts being dragged from freezer */
    onDragStart?: (index: number, part: BodyPart) => void;
    /** Called when drag ends */
    onDragEnd?: () => void;
    /** Called to empty a freezer slot */
    onEmptySlot?: (index: number) => void;
    /** Called when a creature part is dropped onto a freezer slot */
    onCreaturePartDrop?: (freezerIndex: number, creatureSlot: MVPPartSlot, creaturePart: BodyPart) => void;
}

export function FreezerPanel({
    freezer,
    onDragStart,
    onDragEnd,
    onEmptySlot,
    onCreaturePartDrop,
}: FreezerPanelProps) {
    // Track which slot is in "confirm empty" mode
    const [confirmingEmpty, setConfirmingEmpty] = useState<number | null>(null);
    // Track slot being dragged over
    const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number, part: BodyPart) => {
        // Set drag data for freezer->creature drag
        const payload: DragPayload = {
            source: 'freezer',
            freezerIndex: index,
            partType: part.partType,
            part: part,
        };
        e.dataTransfer.setData('application/json', JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(index, part);
    };

    const handleDragEnd = () => {
        onDragEnd?.();
        setDragOverSlot(null);
    };

    // Handle drop from creature onto freezer slot
    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverSlot(null);

        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json')) as DragPayload;

            // Only accept drops from creature
            if (data.source !== 'creature' || !data.creatureSlot) return;

            onCreaturePartDrop?.(index, data.creatureSlot, data.part);
        } catch {
            // Invalid drop data
        }
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverSlot(index);
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragLeave = () => {
        setDragOverSlot(null);
    };

    const handleEmptyClick = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirmingEmpty === index) {
            // Second click - confirm empty
            onEmptySlot?.(index);
            setConfirmingEmpty(null);
        } else {
            // First click - enter confirm mode
            setConfirmingEmpty(index);
            // Auto-cancel after 3 seconds
            setTimeout(() => setConfirmingEmpty(null), 3000);
        }
    };

    const handleCancelConfirm = (e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmingEmpty(null);
    };

    return (
        <div className="freezer-panel">
            <div className="freezer-panel__header">
                <span className="freezer-panel__title">❄️ Freezer</span>
                <span className="freezer-panel__hint">Drag parts to swap</span>
            </div>

            <div className="freezer-panel__slots">
                {freezer.map((part, index) => (
                    <div
                        key={index}
                        className={`freezer-slot ${part ? 'freezer-slot--filled' : 'freezer-slot--empty'} ${dragOverSlot === index ? 'freezer-slot--drag-over' : ''}`}
                        draggable={!!part}
                        onDragStart={(e) => part && handleDragStart(e, index, part)}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                    >
                        {part ? (
                            <>
                                {/* Frost overlay */}
                                <div className="freezer-slot__frost" />

                                {/* Part image or placeholder */}
                                {(() => {
                                    const imageUrl = getBodyPartImage(part.animalType, part.partType);
                                    return imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={`${part.animalType} ${part.partType}`}
                                            className="freezer-slot__image"
                                        />
                                    ) : (
                                        <span className="freezer-slot__placeholder">
                                            {getAnimalDisplayName(part.animalType).charAt(0)}
                                        </span>
                                    );
                                })()}

                                {/* Part label */}
                                <span className="freezer-slot__label">
                                    {getPartTypeDisplayName(part.partType)}
                                </span>

                                {/* Empty button with two-step confirmation */}
                                {onEmptySlot && (
                                    <button
                                        className={`freezer-slot__empty-btn ${confirmingEmpty === index ? 'freezer-slot__empty-btn--confirm' : ''}`}
                                        onClick={(e) => handleEmptyClick(index, e)}
                                        onBlur={() => setConfirmingEmpty(null)}
                                    >
                                        {confirmingEmpty === index ? '⚠️ Confirm' : '✕ Empty'}
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Empty ice cube */}
                                <div className="freezer-slot__ice-cube">
                                    <span>🧊</span>
                                </div>
                                <span className="freezer-slot__label">Drop here</span>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Cancel confirm if clicked outside */}
            {confirmingEmpty !== null && (
                <div
                    className="freezer-panel__cancel-overlay"
                    onClick={handleCancelConfirm}
                />
            )}
        </div>
    );
}

export default FreezerPanel;

/**
 * FreezerPanel Component
 * 
 * Displays 3 backup part slots with icy styling.
 * Shows stored parts or empty ice cube placeholders.
 */

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

interface FreezerPanelProps {
    /** Freezer slots (3 slots, can be null) */
    freezer: (BodyPart | null)[];
    /** Called when a frozen part is clicked */
    onPartClick?: (index: number, part: BodyPart) => void;
    /** Whether defrosting is allowed (typically after death) */
    canDefrost?: boolean;
}

export function FreezerPanel({
    freezer,
    onPartClick,
    canDefrost = false
}: FreezerPanelProps) {
    return (
        <div className="freezer-panel">
            <div className="freezer-panel__header">
                <span className="freezer-panel__title">❄️ Freezer</span>
                <span className="freezer-panel__count">
                    {freezer.filter(p => p !== null).length}/3
                </span>
            </div>

            <div className="freezer-panel__slots">
                {freezer.map((part, index) => (
                    <button
                        key={index}
                        className={`freezer-slot ${part ? 'freezer-slot--filled' : 'freezer-slot--empty'} ${canDefrost && part ? 'freezer-slot--can-defrost' : ''}`}
                        onClick={() => part && onPartClick?.(index, part)}
                        disabled={!part || (!canDefrost && !onPartClick)}
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
                            </>
                        ) : (
                            <>
                                {/* Empty ice cube */}
                                <div className="freezer-slot__ice-cube">
                                    <span>🧊</span>
                                </div>
                                <span className="freezer-slot__label">Empty</span>
                            </>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default FreezerPanel;

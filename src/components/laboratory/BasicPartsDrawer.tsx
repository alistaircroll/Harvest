/**
 * BasicPartsDrawer Component
 * 
 * Displays unlimited basic rat parts (arm, leg, tail) that can be dragged to creature.
 * Provides a recovery mechanism for players who have lost limbs.
 */

import type { BodyPart, PartType, DragPayload } from '../../types';
import { BodyPartCard } from '../creature/BodyPartCard';
import { arms, legs, tails } from '../../data/loaders/bodyPartLoader';
import './laboratory.css';

interface BasicPartsDrawerProps {
    onDragStart?: () => void;
    onDragEnd?: () => void;
}

export function BasicPartsDrawer({ onDragStart, onDragEnd }: BasicPartsDrawerProps) {
    // Basic rat parts (unlimited supply)
    const basicParts: { part: BodyPart; partType: PartType }[] = [
        { part: arms.rat, partType: 'arm' },
        { part: legs.rat, partType: 'leg' },
        { part: tails.rat, partType: 'tail' },
    ];

    const handleDragStart = (part: BodyPart) => (e: React.DragEvent) => {
        const payload: DragPayload = {
            source: 'loot', // Treat as loot so it can be equipped
            partType: part.partType,
            part: part,
        };
        e.dataTransfer.setData('application/json', JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'copy'; // Copy, not move (unlimited supply)
        onDragStart?.();
    };

    const handleDragEnd = () => {
        onDragEnd?.();
    };

    return (
        <div className="basic-parts-drawer">
            <div className="basic-parts-drawer__header">
                <h3 className="basic-parts-drawer__title">Basic Parts</h3>
                <p className="basic-parts-drawer__subtitle">
                    Unlimited supply - drag to your creature
                </p>
            </div>

            <div className="basic-parts-drawer__grid">
                {basicParts.map(({ part, partType }) => (
                    <div
                        key={partType}
                        className="basic-parts-drawer__slot"
                        draggable={true}
                        onDragStart={handleDragStart(part)}
                        onDragEnd={handleDragEnd}
                    >
                        <BodyPartCard
                            part={part}
                            isInteractive={false}
                            compact={true}
                            showImage={true}
                        />
                        <div className="basic-parts-drawer__badge">∞</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default BasicPartsDrawer;

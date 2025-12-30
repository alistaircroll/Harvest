/**
 * VictoryScreen Component
 * 
 * Post-combat harvesting interface.
 * Loot parts can ONLY be dragged to creature slots (not freezer).
 * Old parts are permanently discarded per lore constraints.
 */

import { useState } from 'react';
import type { WildCreature, PlayerCreature, BodyPart, MVPPartSlot, PartSlot, DragPayload, PartType } from '../../types';
import { CreatureDisplay } from '../creature/CreatureDisplay';
import { BodyPartCard } from '../creature/BodyPartCard';
import { getAnimalDisplayName } from '../../utils/creatures';
import './screens.css';

interface VictoryScreenProps {
    lootTable: WildCreature['lootTable'];
    creature: PlayerCreature;
    onSwapPart: (slot: MVPPartSlot, newPart: BodyPart) => void;
    onContinue: () => void;
}

export function VictoryScreen({
    lootTable,
    creature,
    onSwapPart,
    onContinue
}: VictoryScreenProps) {
    // Track which loot parts have been harvested (to grey them out)
    const [harvestedParts, setHarvestedParts] = useState<Set<PartType>>(new Set());

    // Handle drop on creature slot
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- freezerIndex required by callback signature
    const handleCreatureDrop = (slot: PartSlot, droppedPart: BodyPart, _freezerIndex: number) => {
        // Verify this is from loot (not freezer)
        // The drop handler will check source, but we can also track it here
        onSwapPart(slot as MVPPartSlot, droppedPart);

        // Mark this part type as harvested
        setHarvestedParts(prev => new Set(prev).add(droppedPart.partType));
    };

    // Skip all loot and return to lab
    const handleSkipAll = () => {
        onContinue();
    };

    // Loot parts array
    const lootParts: { part: BodyPart; partType: PartType }[] = [
        { part: lootTable.torso, partType: 'torso' },
        { part: lootTable.head, partType: 'head' },
        { part: lootTable.arm, partType: 'arm' },
        { part: lootTable.leg, partType: 'leg' },
        { part: lootTable.tail, partType: 'tail' },
    ];

    return (
        <div className="victory-screen">
            {/* Header */}
            <header className="result-header result-header--victory">
                <h1 className="result-header__title">🎉 VICTORY! 🎉</h1>
                <p className="result-header__subtitle">
                    You defeated the {getAnimalDisplayName(lootTable.torso.animalType)}!
                </p>
            </header>

            {/* Loot Section */}
            <section className="loot-section">
                <h2 className="loot-section__title">Harvested Parts</h2>
                <p className="loot-section__warning">
                    ⚠️ Parts must be attached now! Drag to your creature or discard.
                </p>

                <div className="loot-grid">
                    {lootParts.map(({ part, partType }) => (
                        <LootPartCard
                            key={partType}
                            part={part}
                            isHarvested={harvestedParts.has(partType)}
                        />
                    ))}
                </div>
            </section>

            {/* Creature Section */}
            <section className="creature-section">
                <h2 className="creature-section__title">Your Creature</h2>
                <p className="creature-section__hint">Drag loot here to swap parts</p>

                <CreatureDisplay
                    creature={creature}
                    isInteractive={false}
                    showStats={true}
                    onPartDrop={handleCreatureDrop}
                    isDraggable={false}
                />
            </section>

            {/* Actions */}
            <footer className="result-footer">
                <button
                    className="btn btn--ghost"
                    onClick={handleSkipAll}
                >
                    Skip All Loot
                </button>
                <button
                    className="btn btn--primary btn--large"
                    onClick={onContinue}
                >
                    Continue to Lab
                </button>
            </footer>
        </div>
    );
}

/**
 * LootPartCard - Draggable loot part
 */
interface LootPartCardProps {
    part: BodyPart;
    isHarvested: boolean;
}

function LootPartCard({ part, isHarvested }: LootPartCardProps) {
    const handleDragStart = (e: React.DragEvent) => {
        const payload: DragPayload = {
            source: 'loot',
            partType: part.partType,
            part: part,
        };
        e.dataTransfer.setData('application/json', JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            className={`loot-part ${isHarvested ? 'loot-part--harvested' : ''}`}
            draggable={!isHarvested}
            onDragStart={handleDragStart}
        >
            <BodyPartCard
                part={part}
                isInteractive={false}
                compact={true}
                showImage={true}
            />
            {isHarvested && (
                <div className="loot-part__overlay">
                    <span>✓ Harvested</span>
                </div>
            )}
        </div>
    );
}

export default VictoryScreen;

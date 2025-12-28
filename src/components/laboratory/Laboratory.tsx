/**
 * Laboratory Screen
 * 
 * Main hub for creature customization and management.
 * Tap body parts to open carousel selector.
 */

import { useState } from 'react';
import type { MVPPartSlot, BodyPart } from '../../types';
import { CreatureDisplay } from '../creature/CreatureDisplay';
import { PartCarousel } from './PartCarousel';
import { FreezerPanel } from './FreezerPanel';
import { getSlotDisplayName } from '../../utils/creatures';
import './laboratory.css';

interface LaboratoryProps {
    /** Current creature state */
    creature: ReturnType<typeof import('../../hooks/useCreature').useCreature>['creature'];
    /** Freezer contents */
    freezer: ReturnType<typeof import('../../hooks/useCreature').useCreature>['freezer'];
    /** Get available parts for a slot */
    availablePartsForSlot: (slot: MVPPartSlot) => BodyPart[];
    /** Swap a body part */
    onSwapPart: (slot: MVPPartSlot, part: BodyPart) => void;
    /** Called when user wants to go walking */
    onGoWalking: () => void;
}

export function Laboratory({
    creature,
    freezer,
    availablePartsForSlot,
    onSwapPart,
    onGoWalking
}: LaboratoryProps) {
    // Track which slot is being edited
    const [editingSlot, setEditingSlot] = useState<MVPPartSlot | null>(null);

    // Get current part in slot being edited
    const currentPart = editingSlot
        ? creature.slots[editingSlot as keyof typeof creature.slots] as BodyPart | null
        : null;

    // Get available parts for the slot being edited
    const availableParts = editingSlot
        ? availablePartsForSlot(editingSlot)
        : [];

    // Handle slot click - open carousel
    const handleSlotClick = (slot: MVPPartSlot) => {
        setEditingSlot(slot);
    };

    // Handle carousel lock-in
    const handleSelectPart = (part: BodyPart) => {
        if (editingSlot) {
            onSwapPart(editingSlot, part);
            setEditingSlot(null);
        }
    };

    // Handle carousel cancel
    const handleCancelCarousel = () => {
        setEditingSlot(null);
    };

    return (
        <div className="laboratory">
            {/* Header */}
            <header className="laboratory__header">
                <h1 className="laboratory__title">🧪 Creature Lab</h1>
                <p className="laboratory__subtitle">Tap a body part to customize</p>
            </header>

            {/* Creature Display */}
            <section className="laboratory__creature">
                <CreatureDisplay
                    creature={creature}
                    selectedSlot={editingSlot}
                    onSlotClick={(slot) => handleSlotClick(slot as MVPPartSlot)}
                    isInteractive={true}
                    showStats={true}
                />
                <p className="laboratory__hint">← → to navigate • Enter to lock in</p>
            </section>

            {/* Freezer Panel */}
            <FreezerPanel
                freezer={freezer}
                canDefrost={false}
            />

            {/* Actions */}
            <section className="laboratory__actions">
                <button
                    className="btn btn--primary btn--large"
                    onClick={onGoWalking}
                >
                    Go Walking 🚶
                </button>
            </section>

            {/* Part Carousel Modal */}
            {editingSlot && (
                <PartCarousel
                    parts={availableParts}
                    currentPart={currentPart}
                    slotName={getSlotDisplayName(editingSlot)}
                    onSelect={handleSelectPart}
                    onCancel={handleCancelCarousel}
                />
            )}
        </div>
    );
}

export default Laboratory;

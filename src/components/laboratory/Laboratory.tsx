/**
 * Laboratory Screen
 * 
 * Main hub for creature customization and management.
 * Bidirectional drag-and-drop between creature and freezer.
 */

import { useState, useCallback } from 'react';
import type { MVPPartSlot, BodyPart, PartSlot } from '../../types';
import { CreatureDisplay } from '../creature/CreatureDisplay';
import { FreezerPanel } from './FreezerPanel';
import './laboratory.css';

interface LaboratoryProps {
    /** Current creature state */
    creature: ReturnType<typeof import('../../hooks/useCreature').useCreature>['creature'];
    /** Freezer contents */
    freezer: ReturnType<typeof import('../../hooks/useCreature').useCreature>['freezer'];
    /** Swap a body part - swaps creature slot with freezer slot */
    onSwapPart: (slot: MVPPartSlot, newPart: BodyPart, freezerIndex: number) => void;
    /** Move creature part to freezer (may leave slot empty) */
    onMoveToFreezer: (slot: MVPPartSlot, freezerIndex: number) => void;
    /** Empty a freezer slot */
    onEmptySlot: (freezerIndex: number) => void;
    /** Called when user wants to go walking */
    onGoWalking: () => void;
    /** Called when user confirms new game */
    onNewGame: () => void;
}

// MVP slots that support swapping
const MVP_SLOTS: Set<PartSlot> = new Set(['head', 'torso', 'leftArm1', 'rightArm1', 'leftLeg1', 'rightLeg1', 'tail']);

export function Laboratory({
    creature,
    freezer,
    onSwapPart,
    onMoveToFreezer,
    onEmptySlot,
    onGoWalking,
    onNewGame,
}: LaboratoryProps) {
    // Track confirming state for New Game
    const [confirmingNewGame, setConfirmingNewGame] = useState(false);

    // Handle drop on creature slot (from freezer)
    const handleCreatureDrop = useCallback((slot: PartSlot, droppedPart: BodyPart, freezerIndex: number) => {
        if (MVP_SLOTS.has(slot)) {
            onSwapPart(slot as MVPPartSlot, droppedPart, freezerIndex);
        }
    }, [onSwapPart]);

    // Handle drop on freezer slot (from creature)
    const handleFreezerDrop = useCallback((freezerIndex: number, creatureSlot: MVPPartSlot, _creaturePart: BodyPart) => {
        // If freezer slot has a part, swap; otherwise just move creature part to freezer
        const freezerPart = freezer[freezerIndex];
        if (freezerPart) {
            // Swap: creature part goes to freezer, freezer part goes to creature
            onSwapPart(creatureSlot, freezerPart, freezerIndex);
        } else {
            // Move: creature part goes to empty freezer slot
            onMoveToFreezer(creatureSlot, freezerIndex);
        }
    }, [freezer, onSwapPart, onMoveToFreezer]);

    // Handle New Game button click
    const handleNewGameClick = useCallback(() => {
        if (confirmingNewGame) {
            onNewGame();
            setConfirmingNewGame(false);
        } else {
            setConfirmingNewGame(true);
            // Auto-cancel after 3 seconds
            setTimeout(() => setConfirmingNewGame(false), 3000);
        }
    }, [confirmingNewGame, onNewGame]);

    // Count frozen parts for UI hint
    const frozenCount = freezer.filter(p => p !== null).length;

    return (
        <div className="laboratory">
            {/* Header */}
            <header className="laboratory__header">
                <h1 className="laboratory__title">🧪 Creature Lab</h1>
                <p className="laboratory__subtitle">
                    {frozenCount > 0
                        ? 'Drag parts between creature and freezer'
                        : 'Collect parts from battles to customize'
                    }
                </p>
            </header>

            {/* Creature Display with draggable parts */}
            <section className="laboratory__creature">
                <CreatureDisplay
                    creature={creature}
                    isInteractive={false}
                    showStats={true}
                    onPartDrop={handleCreatureDrop}
                    isDraggable={true}
                />
            </section>

            {/* Freezer Panel with drop targets */}
            <FreezerPanel
                freezer={freezer}
                onEmptySlot={onEmptySlot}
                onCreaturePartDrop={handleFreezerDrop}
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

            {/* New Game Button */}
            <section className="laboratory__footer">
                <button
                    className={`btn btn--ghost btn--small ${confirmingNewGame ? 'btn--danger' : ''}`}
                    onClick={handleNewGameClick}
                >
                    {confirmingNewGame ? '⚠️ Confirm Restart?' : 'New Game'}
                </button>
            </section>
        </div>
    );
}

export default Laboratory;

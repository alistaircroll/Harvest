/**
 * CreatureDisplay Component
 * 
 * Renders the player's creature in a humanoid layout.
 * Future-proofed for 8 limbs, wings, shell, and head attachments.
 * MVP mode shows simplified layout with position-1 limbs only.
 */

import type { PlayerCreature, PartSlot, BodyPart, PartType } from '../../types';
import { BodyPartCard } from './BodyPartCard';
import { getCreatureAttacks } from '../../utils/creatures';
import './creature.css';

interface CreatureDisplayProps {
    creature: PlayerCreature;
    selectedSlot?: PartSlot | null;
    onSlotClick?: (slot: PartSlot) => void;
    onPartDrop?: (slot: PartSlot, droppedPart: BodyPart, freezerIndex: number) => void;
    isInteractive?: boolean;
    isDraggable?: boolean; // Whether creature parts can be dragged to freezer
    showStats?: boolean;
    showFutureSlots?: boolean;
    highlightedSlots?: Set<PartSlot>;
}

// Map slot to its compatible PartType
function getSlotPartType(slot: PartSlot): PartType {
    if (slot === 'head') return 'head';
    if (slot === 'torso') return 'torso';
    if (slot === 'tail') return 'tail';
    if (slot.includes('Arm') || slot.includes('Antenna') || slot.includes('Wing')) return 'arm';
    if (slot.includes('Leg')) return 'leg';
    return 'torso';
}

/**
 * Full creature visualization with all body part slots
 */
export function CreatureDisplay({
    creature,
    selectedSlot = null,
    onSlotClick,
    onPartDrop,
    isInteractive = true,
    isDraggable = false,
    showStats = true,
    showFutureSlots = false,
    highlightedSlots,
}: CreatureDisplayProps) {
    const { slots, maxHp, currentHp, totalDefense } = creature;
    const totalAttacks = getCreatureAttacks(slots).length;

    const handleSlotClick = (slot: PartSlot) => {
        if (isInteractive && onSlotClick) {
            onSlotClick(slot);
        }
    };

    // Helper to create drop handler for a slot
    const createDropHandler = (slot: PartSlot) => {
        if (!onPartDrop) return undefined;
        const slotType = getSlotPartType(slot);
        return (droppedPart: BodyPart, freezerIndex: number) => {
            if (droppedPart.partType === slotType) {
                onPartDrop(slot, droppedPart, freezerIndex);
            }
        };
    };

    return (
        <div className="creature-display-wrapper">
            {/* Stats Summary */}
            {showStats && (
                <div className="creature-stats">
                    <div className="creature-stats__item creature-stats__item--hp">
                        <span className="creature-stats__value">{currentHp}/{maxHp}</span>
                        <span className="creature-stats__label">HP</span>
                    </div>
                    <div className="creature-stats__item creature-stats__item--def">
                        <span className="creature-stats__value">{totalDefense}</span>
                        <span className="creature-stats__label">Defense</span>
                    </div>
                    <div className="creature-stats__item creature-stats__item--attacks">
                        <span className="creature-stats__value">{totalAttacks}</span>
                        <span className="creature-stats__label">Attacks</span>
                    </div>
                </div>
            )}

            {/* Creature Layout */}
            <div className={`creature-display ${showFutureSlots ? '' : 'creature-display--mvp'}`}>

                {/* Future: Horns */}
                {showFutureSlots && (
                    <div className="creature-display__slot creature-display__slot--horns">
                        <BodyPartCard part={slots.leftHorn} slotType="L.Horn" isFuture compact />
                        <BodyPartCard part={slots.rightHorn} slotType="R.Horn" isFuture compact />
                    </div>
                )}

                {/* Head */}
                <div className="creature-display__slot creature-display__slot--head">
                    <BodyPartCard
                        part={slots.head}
                        slotType="Head"
                        slotPartType="head"
                        creatureSlot="head"
                        isSelected={selectedSlot === 'head'}
                        isInteractive={isInteractive && highlightedSlots?.has('head')}
                        isHighlighted={highlightedSlots?.has('head')}
                        isDraggable={isDraggable}
                        onClick={() => handleSlotClick('head')}
                        onDrop={createDropHandler('head')}
                    />
                </div>

                {/* Future: Antennae */}
                {showFutureSlots && (
                    <div className="creature-display__slot creature-display__slot--antennae">
                        <BodyPartCard part={slots.leftAntenna} slotType="L.Ant" isFuture compact />
                        <BodyPartCard part={slots.rightAntenna} slotType="R.Ant" isFuture compact />
                    </div>
                )}

                {/* Future: Arms 2-4 (left side) */}
                {showFutureSlots && (
                    <>
                        <div className="creature-display__slot creature-display__slot--left-arm-2">
                            <BodyPartCard part={slots.leftArm2} slotType="L.Arm2" isFuture compact />
                        </div>
                        <div className="creature-display__slot creature-display__slot--left-arm-3">
                            <BodyPartCard part={slots.leftArm3} slotType="L.Arm3" isFuture compact />
                        </div>
                        <div className="creature-display__slot creature-display__slot--left-arm-4">
                            <BodyPartCard part={slots.leftArm4} slotType="L.Arm4" isFuture compact />
                        </div>
                    </>
                )}

                {/* Left Arm 1 (MVP) */}
                <div className="creature-display__slot creature-display__slot--left-arm-1">
                    <BodyPartCard
                        part={slots.leftArm1}
                        slotType="L.Arm"
                        slotPartType="arm"
                        creatureSlot="leftArm1"
                        isSelected={selectedSlot === 'leftArm1'}
                        isInteractive={isInteractive && highlightedSlots?.has('leftArm1')}
                        isHighlighted={highlightedSlots?.has('leftArm1')}
                        isDraggable={isDraggable}
                        onClick={() => handleSlotClick('leftArm1')}
                        onDrop={createDropHandler('leftArm1')}
                        compact
                    />
                </div>

                {/* Torso (center) */}
                <div className="creature-display__slot creature-display__slot--torso">
                    <BodyPartCard
                        part={slots.torso}
                        slotType="Torso"
                        isSelected={selectedSlot === 'torso'}
                        isInteractive={false} // Torso can't be removed
                        onClick={() => handleSlotClick('torso')}
                    />
                </div>

                {/* Right Arm 1 (MVP) */}
                <div className="creature-display__slot creature-display__slot--right-arm-1">
                    <BodyPartCard
                        part={slots.rightArm1}
                        slotType="R.Arm"
                        slotPartType="arm"
                        creatureSlot="rightArm1"
                        isSelected={selectedSlot === 'rightArm1'}
                        isInteractive={isInteractive && highlightedSlots?.has('rightArm1')}
                        isHighlighted={highlightedSlots?.has('rightArm1')}
                        isDraggable={isDraggable}
                        onClick={() => handleSlotClick('rightArm1')}
                        onDrop={createDropHandler('rightArm1')}
                        compact
                        mirrorImage
                    />
                </div>

                {/* Future: Arms 2-4 (right side) */}
                {showFutureSlots && (
                    <>
                        <div className="creature-display__slot creature-display__slot--right-arm-2">
                            <BodyPartCard part={slots.rightArm2} slotType="R.Arm2" isFuture compact />
                        </div>
                        <div className="creature-display__slot creature-display__slot--right-arm-3">
                            <BodyPartCard part={slots.rightArm3} slotType="R.Arm3" isFuture compact />
                        </div>
                        <div className="creature-display__slot creature-display__slot--right-arm-4">
                            <BodyPartCard part={slots.rightArm4} slotType="R.Arm4" isFuture compact />
                        </div>
                    </>
                )}

                {/* Legs - MVP Layout uses combined legs slot */}
                {!showFutureSlots ? (
                    <div className="creature-display__slot creature-display__slot--legs">
                        <BodyPartCard
                            part={slots.leftLeg1}
                            slotType="L.Leg"
                            slotPartType="leg"
                            creatureSlot="leftLeg1"
                            isSelected={selectedSlot === 'leftLeg1'}
                            isInteractive={isInteractive && highlightedSlots?.has('leftLeg1')}
                            isHighlighted={highlightedSlots?.has('leftLeg1')}
                            isDraggable={isDraggable}
                            onClick={() => handleSlotClick('leftLeg1')}
                            onDrop={createDropHandler('leftLeg1')}
                            compact
                        />
                        <BodyPartCard
                            part={slots.rightLeg1}
                            slotType="R.Leg"
                            slotPartType="leg"
                            creatureSlot="rightLeg1"
                            isSelected={selectedSlot === 'rightLeg1'}
                            isInteractive={isInteractive && highlightedSlots?.has('rightLeg1')}
                            isHighlighted={highlightedSlots?.has('rightLeg1')}
                            isDraggable={isDraggable}
                            onClick={() => handleSlotClick('rightLeg1')}
                            onDrop={createDropHandler('rightLeg1')}
                            compact
                            mirrorImage
                        />
                    </div>
                ) : (
                    <>
                        {/* Left Leg 1-4 */}
                        <div className="creature-display__slot creature-display__slot--left-leg-1">
                            <BodyPartCard
                                part={slots.leftLeg1}
                                slotType="L.Leg"
                                isSelected={selectedSlot === 'leftLeg1'}
                                isInteractive={isInteractive}
                                onClick={() => handleSlotClick('leftLeg1')}
                                compact
                            />
                        </div>
                        <div className="creature-display__slot creature-display__slot--left-leg-2">
                            <BodyPartCard part={slots.leftLeg2} slotType="L.Leg2" isFuture compact />
                        </div>
                        <div className="creature-display__slot creature-display__slot--left-leg-3">
                            <BodyPartCard part={slots.leftLeg3} slotType="L.Leg3" isFuture compact />
                        </div>
                        <div className="creature-display__slot creature-display__slot--left-leg-4">
                            <BodyPartCard part={slots.leftLeg4} slotType="L.Leg4" isFuture compact />
                        </div>

                        {/* Right Leg 1-4 */}
                        <div className="creature-display__slot creature-display__slot--right-leg-1">
                            <BodyPartCard
                                part={slots.rightLeg1}
                                slotType="R.Leg"
                                isSelected={selectedSlot === 'rightLeg1'}
                                isInteractive={isInteractive}
                                onClick={() => handleSlotClick('rightLeg1')}
                                compact
                                mirrorImage
                            />
                        </div>
                        <div className="creature-display__slot creature-display__slot--right-leg-2">
                            <BodyPartCard part={slots.rightLeg2} slotType="R.Leg2" isFuture compact />
                        </div>
                        <div className="creature-display__slot creature-display__slot--right-leg-3">
                            <BodyPartCard part={slots.rightLeg3} slotType="R.Leg3" isFuture compact />
                        </div>
                        <div className="creature-display__slot creature-display__slot--right-leg-4">
                            <BodyPartCard part={slots.rightLeg4} slotType="R.Leg4" isFuture compact />
                        </div>
                    </>
                )}

                {/* Tail */}
                <div className="creature-display__slot creature-display__slot--tail">
                    <BodyPartCard
                        part={slots.tail}
                        slotType="Tail"
                        slotPartType="tail"
                        creatureSlot="tail"
                        isSelected={selectedSlot === 'tail'}
                        isInteractive={isInteractive && highlightedSlots?.has('tail')}
                        isHighlighted={highlightedSlots?.has('tail')}
                        isDraggable={isDraggable}
                        onClick={() => handleSlotClick('tail')}
                        onDrop={createDropHandler('tail')}
                        compact
                    />
                </div>

                {/* Future: Wings */}
                {showFutureSlots && (
                    <div className="creature-display__slot creature-display__slot--wings">
                        <BodyPartCard part={slots.leftWing} slotType="L.Wing" isFuture compact />
                        <BodyPartCard part={slots.rightWing} slotType="R.Wing" isFuture compact />
                    </div>
                )}

                {/* Future: Shell */}
                {showFutureSlots && (
                    <div className="creature-display__slot creature-display__slot--shell">
                        <BodyPartCard part={slots.shell} slotType="Shell" isFuture compact />
                    </div>
                )}
            </div>
        </div>
    );
}

export default CreatureDisplay;

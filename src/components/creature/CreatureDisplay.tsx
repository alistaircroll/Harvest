/**
 * CreatureDisplay Component
 * 
 * Renders the player's creature in a humanoid layout.
 * Body parts are arranged: head at top, arms on sides, torso center,
 * legs below, tail at bottom.
 */

import type { PlayerCreature, PartSlot } from '../../types';
import { BodyPartCard } from './BodyPartCard';
import { getCreatureAttacks } from '../../utils/creatures';
import './creature.css';

interface CreatureDisplayProps {
    creature: PlayerCreature;
    selectedSlot?: PartSlot | null;
    onSlotClick?: (slot: PartSlot) => void;
    isInteractive?: boolean;
    showStats?: boolean;
}

/**
 * Full creature visualization with all body part slots
 */
export function CreatureDisplay({
    creature,
    selectedSlot = null,
    onSlotClick,
    isInteractive = true,
    showStats = true,
}: CreatureDisplayProps) {
    const { slots, maxHp, currentHp, totalDefense } = creature;
    const totalAttacks = getCreatureAttacks(slots).length;

    const handleSlotClick = (slot: PartSlot) => {
        if (isInteractive && onSlotClick) {
            onSlotClick(slot);
        }
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

            {/* Humanoid Layout */}
            <div className="creature-display">
                {/* Head */}
                <div className="creature-display__slot creature-display__slot--head">
                    <BodyPartCard
                        part={slots.head}
                        slotType="Head"
                        isSelected={selectedSlot === 'head'}
                        isInteractive={isInteractive}
                        onClick={() => handleSlotClick('head')}
                    />
                </div>

                {/* Left Arm */}
                <div className="creature-display__slot creature-display__slot--left-arm">
                    <BodyPartCard
                        part={slots.leftArm}
                        slotType="L.Arm"
                        isSelected={selectedSlot === 'leftArm'}
                        isInteractive={isInteractive}
                        onClick={() => handleSlotClick('leftArm')}
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

                {/* Right Arm */}
                <div className="creature-display__slot creature-display__slot--right-arm">
                    <BodyPartCard
                        part={slots.rightArm}
                        slotType="R.Arm"
                        isSelected={selectedSlot === 'rightArm'}
                        isInteractive={isInteractive}
                        onClick={() => handleSlotClick('rightArm')}
                        compact
                    />
                </div>

                {/* Legs (side by side) */}
                <div className="creature-display__slot creature-display__slot--legs">
                    <BodyPartCard
                        part={slots.leftLeg}
                        slotType="L.Leg"
                        isSelected={selectedSlot === 'leftLeg'}
                        isInteractive={isInteractive}
                        onClick={() => handleSlotClick('leftLeg')}
                        compact
                    />
                    <BodyPartCard
                        part={slots.rightLeg}
                        slotType="R.Leg"
                        isSelected={selectedSlot === 'rightLeg'}
                        isInteractive={isInteractive}
                        onClick={() => handleSlotClick('rightLeg')}
                        compact
                    />
                </div>

                {/* Tail */}
                <div className="creature-display__slot creature-display__slot--tail">
                    <BodyPartCard
                        part={slots.tail}
                        slotType="Tail"
                        isSelected={selectedSlot === 'tail'}
                        isInteractive={isInteractive}
                        onClick={() => handleSlotClick('tail')}
                        compact
                    />
                </div>
            </div>
        </div>
    );
}

export default CreatureDisplay;

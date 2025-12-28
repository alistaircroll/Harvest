/**
 * CombatCreatureDisplay Component
 * 
 * Displays creature artwork during combat with clickable body parts.
 * Clicking a body part queues all attacks from that part.
 */

import type { PlayerCreature, PartSlot, SelectedAttack, AnimalType, PartType } from '../../types';
import { getCreatureAttacks } from '../../utils/creatures';
import '../creature/creature.css';
import './combat.css';

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

interface CombatCreatureDisplayProps {
    creature: PlayerCreature;
    selectedSlots: PartSlot[];
    remainingAp: number;
    onPartClick: (attacks: SelectedAttack[]) => void;
    disabled?: boolean;
}

/**
 * Compact creature display for combat with clickable body parts
 */
export function CombatCreatureDisplay({
    creature,
    selectedSlots,
    remainingAp,
    onPartClick,
    disabled = false
}: CombatCreatureDisplayProps) {
    const { slots } = creature;

    // Get all attacks grouped by slot
    const allAttacks = getCreatureAttacks(slots);

    // Group attacks by source slot
    const attacksBySlot: Record<PartSlot, SelectedAttack[]> = {} as Record<PartSlot, SelectedAttack[]>;
    for (const attack of allAttacks) {
        if (!attacksBySlot[attack.sourcePartSlot]) {
            attacksBySlot[attack.sourcePartSlot] = [];
        }
        attacksBySlot[attack.sourcePartSlot].push(attack);
    }

    // Calculate AP cost for attacks from a slot
    const getSlotApCost = (slot: PartSlot): number => {
        const attacks = attacksBySlot[slot] || [];
        return attacks.reduce((sum, a) => sum + a.attack.apCost, 0);
    };

    // Check if slot is affordable
    const canAffordSlot = (slot: PartSlot): boolean => {
        return getSlotApCost(slot) <= remainingAp;
    };

    // Handle clicking a body part
    const handlePartClick = (slot: PartSlot) => {
        if (disabled) return;
        const attacks = attacksBySlot[slot] || [];
        if (attacks.length > 0 && canAffordSlot(slot)) {
            onPartClick(attacks);
        }
    };

    // Render a clickable body part
    const renderBodyPart = (slot: PartSlot, mirrored: boolean = false) => {
        const part = slots[slot as keyof typeof slots];
        if (!part) return null;

        const attacks = attacksBySlot[slot] || [];
        const hasAttacks = attacks.length > 0;
        const isSelected = selectedSlots.includes(slot);
        const canAfford = canAffordSlot(slot);
        const apCost = getSlotApCost(slot);

        const imageUrl = getBodyPartImage(part.animalType, part.partType);

        return (
            <button
                className={`combat-body-part ${hasAttacks ? 'combat-body-part--clickable' : ''} ${isSelected ? 'combat-body-part--selected' : ''} ${!canAfford && hasAttacks ? 'combat-body-part--disabled' : ''}`}
                onClick={() => handlePartClick(slot)}
                disabled={disabled || !hasAttacks || !canAfford}
            >
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt={`${part.animalType} ${part.partType}`}
                        className={`combat-body-part__image ${mirrored ? 'combat-body-part__image--mirrored' : ''}`}
                    />
                )}
                {hasAttacks && canAfford && (
                    <span className="combat-body-part__cost">{apCost}</span>
                )}
            </button>
        );
    };

    return (
        <div className="combat-creature-display">
            {/* Row 1: Head */}
            <div className="combat-creature-display__row">
                {renderBodyPart('head')}
            </div>

            {/* Row 2: Arms + Torso */}
            <div className="combat-creature-display__row combat-creature-display__row--middle">
                {renderBodyPart('leftArm1')}
                {renderBodyPart('torso')}
                {renderBodyPart('rightArm1', true)}
            </div>

            {/* Row 3: Legs */}
            <div className="combat-creature-display__row">
                {renderBodyPart('leftLeg1')}
                {renderBodyPart('rightLeg1', true)}
            </div>

            {/* Row 4: Tail */}
            <div className="combat-creature-display__row">
                {renderBodyPart('tail')}
            </div>
        </div>
    );
}

export default CombatCreatureDisplay;

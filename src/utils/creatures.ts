/**
 * Creature Utilities
 * 
 * Functions for creating, calculating stats, and managing player creatures.
 */

import type {
    PlayerCreature,
    CreatureSlots,
    BodyPart,
    PartSlot,
    AnimalType,
    SelectedAttack
} from '../types';
import { torsos, heads, arms, legs, tails, getPartsWithSpecialAbilities } from '../data/bodyParts';

// ================================
// Creature Creation
// ================================

/**
 * Create a starter rat creature (used on first login / after death)
 */
export function createStarterCreature(): PlayerCreature {
    const slots: CreatureSlots = {
        torso: torsos.rat,
        head: heads.rat,
        leftArm: arms.rat,
        rightArm: arms.rat,
        leftLeg: legs.rat,
        rightLeg: legs.rat,
        tail: tails.rat,
    };

    return createCreatureFromSlots(slots);
}

/**
 * Create a creature from slot assignments
 */
export function createCreatureFromSlots(slots: CreatureSlots): PlayerCreature {
    const { maxHp, totalDefense } = calculateCreatureStats(slots);

    return {
        slots,
        maxHp,
        currentHp: maxHp,
        totalDefense,
        activeEffects: [],
    };
}

// ================================
// Stat Calculations
// ================================

const BASE_HP = 10; // Added to torso + head HP per spec

/**
 * Calculate total creature stats from body parts
 */
export function calculateCreatureStats(slots: CreatureSlots): {
    maxHp: number;
    totalDefense: number;
} {
    // HP comes from torso + head + base
    let maxHp = BASE_HP;
    maxHp += slots.torso.hpBonus;

    if (slots.head) {
        maxHp += slots.head.hpBonus;
    }

    // Defense comes from all parts
    let totalDefense = 0;
    totalDefense += slots.torso.defense;

    if (slots.head) totalDefense += slots.head.defense;
    if (slots.leftArm) totalDefense += slots.leftArm.defense;
    if (slots.rightArm) totalDefense += slots.rightArm.defense;
    if (slots.leftLeg) totalDefense += slots.leftLeg.defense;
    if (slots.rightLeg) totalDefense += slots.rightLeg.defense;
    if (slots.tail) totalDefense += slots.tail.defense;

    return { maxHp, totalDefense };
}

// ================================
// Attack Collection
// ================================

/**
 * Get all available attacks from creature's body parts
 */
export function getCreatureAttacks(slots: CreatureSlots): SelectedAttack[] {
    const attacks: SelectedAttack[] = [];

    // Helper to add attacks from a slot
    const addAttacksFromSlot = (slot: PartSlot, part: BodyPart | null) => {
        if (!part) return;

        for (const attack of part.attacks) {
            // Check for Pounce requirement (both cat legs)
            if (attack.requiresBothLegs) {
                const hasBothCatLegs =
                    slots.leftLeg?.animalType === 'cat' &&
                    slots.rightLeg?.animalType === 'cat';
                if (!hasBothCatLegs) continue;
            }

            attacks.push({
                attack,
                sourcePartSlot: slot,
                sourceAnimal: part.animalType,
            });
        }
    };

    // Collect from all slots
    addAttacksFromSlot('torso', slots.torso);
    addAttacksFromSlot('head', slots.head);
    addAttacksFromSlot('leftArm', slots.leftArm);
    addAttacksFromSlot('rightArm', slots.rightArm);
    addAttacksFromSlot('leftLeg', slots.leftLeg);
    addAttacksFromSlot('rightLeg', slots.rightLeg);
    addAttacksFromSlot('tail', slots.tail);

    return attacks;
}

/**
 * Get attacks affordable with remaining AP
 */
export function getAffordableAttacks(
    slots: CreatureSlots,
    remainingAp: number
): SelectedAttack[] {
    return getCreatureAttacks(slots).filter(
        ({ attack }) => attack.apCost <= remainingAp
    );
}

// ================================
// Part Slot Management
// ================================

/**
 * Get part from a specific slot
 */
export function getPartFromSlot(slots: CreatureSlots, slot: PartSlot): BodyPart | null {
    return slots[slot] as BodyPart | null;
}

/**
 * Count non-null limbs (arms, legs, tail)
 */
export function countLimbs(slots: CreatureSlots): number {
    let count = 0;
    if (slots.leftArm) count++;
    if (slots.rightArm) count++;
    if (slots.leftLeg) count++;
    if (slots.rightLeg) count++;
    if (slots.tail) count++;
    return count;
}

/**
 * Check if creature is "dead" (only torso remaining)
 * Per spec: death when reduced to head+torso only (no limbs)
 */
export function isCreatureDead(slots: CreatureSlots): boolean {
    return countLimbs(slots) === 0;
}

/**
 * Get all non-empty part slots for random loss selection
 */
export function getRemovableSlots(slots: CreatureSlots): PartSlot[] {
    const removable: PartSlot[] = [];
    // Torso can never be removed
    // Head can be lost (triggers lab return if last part)
    if (slots.head) removable.push('head');
    if (slots.leftArm) removable.push('leftArm');
    if (slots.rightArm) removable.push('rightArm');
    if (slots.leftLeg) removable.push('leftLeg');
    if (slots.rightLeg) removable.push('rightLeg');
    if (slots.tail) removable.push('tail');
    return removable;
}

/**
 * Remove a part from the creature (after defeat)
 */
export function removePart(
    slots: CreatureSlots,
    slot: PartSlot
): { newSlots: CreatureSlots; removedPart: BodyPart | null } {
    const removedPart = getPartFromSlot(slots, slot);

    const newSlots: CreatureSlots = {
        ...slots,
        [slot]: slot === 'torso' ? slots.torso : null, // Torso can't be removed
    };

    return { newSlots, removedPart };
}

/**
 * Equip a part to a slot
 */
export function equipPart(
    slots: CreatureSlots,
    slot: PartSlot,
    part: BodyPart
): CreatureSlots {
    return {
        ...slots,
        [slot]: part,
    };
}

// ================================
// Starter Freezer Parts
// ================================

/**
 * Get 2 random special parts for starter freezer
 */
export function getStarterFreezerParts(): [BodyPart, BodyPart] {
    const specials = getPartsWithSpecialAbilities();

    // Shuffle and pick 2
    const shuffled = [...specials].sort(() => Math.random() - 0.5);

    return [shuffled[0], shuffled[1]];
}

// ================================
// Display Helpers
// ================================

/**
 * Get display name for a part slot
 */
export function getSlotDisplayName(slot: PartSlot): string {
    const names: Record<PartSlot, string> = {
        torso: 'Torso',
        head: 'Head',
        leftArm: 'Left Arm',
        rightArm: 'Right Arm',
        leftLeg: 'Left Leg',
        rightLeg: 'Right Leg',
        tail: 'Tail',
    };
    return names[slot];
}

/**
 * Get display name for an animal type (capitalized)
 */
export function getAnimalDisplayName(animal: AnimalType): string {
    return animal.charAt(0).toUpperCase() + animal.slice(1);
}

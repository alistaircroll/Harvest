/**
 * Creature Utilities
 * 
 * Functions for creating, calculating stats, and managing player creatures.
 * Future-proofed for 8-limb creatures, wings, shell, and head attachments.
 */

import type {
    PlayerCreature,
    CreatureSlots,
    BodyPart,
    PartSlot,
    MVPPartSlot,
    AnimalType,
    SelectedAttack
} from '../types';
import { torsos, heads, arms, legs, tails, getPartsWithSpecialAbilities } from '../data/bodyParts';

// ================================
// Creature Creation
// ================================

/**
 * Create a starter rat creature (used on first login / after death)
 * Uses MVP slots only (arm1, leg1)
 */
export function createStarterCreature(): PlayerCreature {
    const slots: CreatureSlots = {
        // Core
        torso: torsos.rat,
        head: heads.rat,
        tail: tails.rat,

        // MVP arms (position 1)
        leftArm1: arms.rat,
        rightArm1: arms.rat,

        // MVP legs (position 1)
        leftLeg1: legs.rat,
        rightLeg1: legs.rat,

        // Future arm slots (empty)
        leftArm2: null,
        rightArm2: null,
        leftArm3: null,
        rightArm3: null,
        leftArm4: null,
        rightArm4: null,

        // Future leg slots (empty)
        leftLeg2: null,
        rightLeg2: null,
        leftLeg3: null,
        rightLeg3: null,
        leftLeg4: null,
        rightLeg4: null,

        // Future wings and shell (empty)
        leftWing: null,
        rightWing: null,
        shell: null,

        // Future head attachments (empty)
        leftHorn: null,
        rightHorn: null,
        leftAntenna: null,
        rightAntenna: null,
        leftGill: null,
        rightGill: null,
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
    // HP comes from torso + head + shell (future) + base
    let maxHp = BASE_HP;
    maxHp += slots.torso.hpBonus;

    if (slots.head) maxHp += slots.head.hpBonus;
    if (slots.shell) maxHp += slots.shell.hpBonus;

    // Defense comes from all parts
    let totalDefense = 0;

    // Core
    totalDefense += slots.torso.defense;
    if (slots.head) totalDefense += slots.head.defense;
    if (slots.tail) totalDefense += slots.tail.defense;

    // All arm slots
    if (slots.leftArm1) totalDefense += slots.leftArm1.defense;
    if (slots.rightArm1) totalDefense += slots.rightArm1.defense;
    if (slots.leftArm2) totalDefense += slots.leftArm2.defense;
    if (slots.rightArm2) totalDefense += slots.rightArm2.defense;
    if (slots.leftArm3) totalDefense += slots.leftArm3.defense;
    if (slots.rightArm3) totalDefense += slots.rightArm3.defense;
    if (slots.leftArm4) totalDefense += slots.leftArm4.defense;
    if (slots.rightArm4) totalDefense += slots.rightArm4.defense;

    // All leg slots
    if (slots.leftLeg1) totalDefense += slots.leftLeg1.defense;
    if (slots.rightLeg1) totalDefense += slots.rightLeg1.defense;
    if (slots.leftLeg2) totalDefense += slots.leftLeg2.defense;
    if (slots.rightLeg2) totalDefense += slots.rightLeg2.defense;
    if (slots.leftLeg3) totalDefense += slots.leftLeg3.defense;
    if (slots.rightLeg3) totalDefense += slots.rightLeg3.defense;
    if (slots.leftLeg4) totalDefense += slots.leftLeg4.defense;
    if (slots.rightLeg4) totalDefense += slots.rightLeg4.defense;

    // Future attachments
    if (slots.leftWing) totalDefense += slots.leftWing.defense;
    if (slots.rightWing) totalDefense += slots.rightWing.defense;
    if (slots.shell) totalDefense += slots.shell.defense;
    if (slots.leftHorn) totalDefense += slots.leftHorn.defense;
    if (slots.rightHorn) totalDefense += slots.rightHorn.defense;
    if (slots.leftAntenna) totalDefense += slots.leftAntenna.defense;
    if (slots.rightAntenna) totalDefense += slots.rightAntenna.defense;
    if (slots.leftGill) totalDefense += slots.leftGill.defense;
    if (slots.rightGill) totalDefense += slots.rightGill.defense;

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
            // Check for Pounce requirement (both cat legs at position 1)
            if (attack.requiresBothLegs) {
                const hasBothCatLegs =
                    slots.leftLeg1?.animalType === 'cat' &&
                    slots.rightLeg1?.animalType === 'cat';
                if (!hasBothCatLegs) continue;
            }

            attacks.push({
                attack,
                sourcePartSlot: slot,
                sourceAnimal: part.animalType,
            });
        }
    };

    // Core slots
    addAttacksFromSlot('torso', slots.torso);
    addAttacksFromSlot('head', slots.head);
    addAttacksFromSlot('tail', slots.tail);

    // MVP arms
    addAttacksFromSlot('leftArm1', slots.leftArm1);
    addAttacksFromSlot('rightArm1', slots.rightArm1);

    // MVP legs
    addAttacksFromSlot('leftLeg1', slots.leftLeg1);
    addAttacksFromSlot('rightLeg1', slots.rightLeg1);

    // Future arm slots
    addAttacksFromSlot('leftArm2', slots.leftArm2);
    addAttacksFromSlot('rightArm2', slots.rightArm2);
    addAttacksFromSlot('leftArm3', slots.leftArm3);
    addAttacksFromSlot('rightArm3', slots.rightArm3);
    addAttacksFromSlot('leftArm4', slots.leftArm4);
    addAttacksFromSlot('rightArm4', slots.rightArm4);

    // Future leg slots
    addAttacksFromSlot('leftLeg2', slots.leftLeg2);
    addAttacksFromSlot('rightLeg2', slots.rightLeg2);
    addAttacksFromSlot('leftLeg3', slots.leftLeg3);
    addAttacksFromSlot('rightLeg3', slots.rightLeg3);
    addAttacksFromSlot('leftLeg4', slots.leftLeg4);
    addAttacksFromSlot('rightLeg4', slots.rightLeg4);

    // Future attachments
    addAttacksFromSlot('leftWing', slots.leftWing);
    addAttacksFromSlot('rightWing', slots.rightWing);
    addAttacksFromSlot('shell', slots.shell);
    addAttacksFromSlot('leftHorn', slots.leftHorn);
    addAttacksFromSlot('rightHorn', slots.rightHorn);
    addAttacksFromSlot('leftAntenna', slots.leftAntenna);
    addAttacksFromSlot('rightAntenna', slots.rightAntenna);
    addAttacksFromSlot('leftGill', slots.leftGill);
    addAttacksFromSlot('rightGill', slots.rightGill);

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
 * Count non-null limbs (MVP: arm1, leg1, tail only)
 */
export function countMVPLimbs(slots: CreatureSlots): number {
    let count = 0;
    if (slots.leftArm1) count++;
    if (slots.rightArm1) count++;
    if (slots.leftLeg1) count++;
    if (slots.rightLeg1) count++;
    if (slots.tail) count++;
    return count;
}

/**
 * Count all limbs including future slots
 */
export function countAllLimbs(slots: CreatureSlots): number {
    let count = 0;

    // Arms
    if (slots.leftArm1) count++;
    if (slots.rightArm1) count++;
    if (slots.leftArm2) count++;
    if (slots.rightArm2) count++;
    if (slots.leftArm3) count++;
    if (slots.rightArm3) count++;
    if (slots.leftArm4) count++;
    if (slots.rightArm4) count++;

    // Legs
    if (slots.leftLeg1) count++;
    if (slots.rightLeg1) count++;
    if (slots.leftLeg2) count++;
    if (slots.rightLeg2) count++;
    if (slots.leftLeg3) count++;
    if (slots.rightLeg3) count++;
    if (slots.leftLeg4) count++;
    if (slots.rightLeg4) count++;

    // Tail
    if (slots.tail) count++;

    return count;
}

/**
 * Check if creature is "dead" (only torso remaining)
 * Per spec: death when reduced to head+torso only (no limbs)
 */
export function isCreatureDead(slots: CreatureSlots): boolean {
    return countAllLimbs(slots) === 0;
}

/**
 * Get all non-empty MVP part slots for random loss selection
 */
export function getRemovableMVPSlots(slots: CreatureSlots): MVPPartSlot[] {
    const removable: MVPPartSlot[] = [];
    // Torso can never be removed
    if (slots.head) removable.push('head');
    if (slots.leftArm1) removable.push('leftArm1');
    if (slots.rightArm1) removable.push('rightArm1');
    if (slots.leftLeg1) removable.push('leftLeg1');
    if (slots.rightLeg1) removable.push('rightLeg1');
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
        tail: 'Tail',
        // MVP arms/legs
        leftArm1: 'L.Arm',
        rightArm1: 'R.Arm',
        leftLeg1: 'L.Leg',
        rightLeg1: 'R.Leg',
        // Future arms
        leftArm2: 'L.Arm 2',
        rightArm2: 'R.Arm 2',
        leftArm3: 'L.Arm 3',
        rightArm3: 'R.Arm 3',
        leftArm4: 'L.Arm 4',
        rightArm4: 'R.Arm 4',
        // Future legs
        leftLeg2: 'L.Leg 2',
        rightLeg2: 'R.Leg 2',
        leftLeg3: 'L.Leg 3',
        rightLeg3: 'R.Leg 3',
        leftLeg4: 'L.Leg 4',
        rightLeg4: 'R.Leg 4',
        // Attachments
        leftWing: 'L.Wing',
        rightWing: 'R.Wing',
        shell: 'Shell',
        leftHorn: 'L.Horn',
        rightHorn: 'R.Horn',
        leftAntenna: 'L.Antenna',
        rightAntenna: 'R.Antenna',
        leftGill: 'L.Gill',
        rightGill: 'R.Gill',
    };
    return names[slot];
}

/**
 * Get display name for an animal type (capitalized)
 */
export function getAnimalDisplayName(animal: AnimalType): string {
    return animal.charAt(0).toUpperCase() + animal.slice(1);
}

/**
 * Check if a slot is an MVP slot (used in current version)
 */
export function isMVPSlot(slot: PartSlot): boolean {
    const mvpSlots: PartSlot[] = [
        'torso', 'head',
        'leftArm1', 'rightArm1',
        'leftLeg1', 'rightLeg1',
        'tail'
    ];
    return mvpSlots.includes(slot);
}

/**
 * Check if a slot is a future slot (locked in MVP)
 */
export function isFutureSlot(slot: PartSlot): boolean {
    return !isMVPSlot(slot);
}

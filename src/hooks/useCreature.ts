/**
 * useCreature Hook
 * 
 * Manages player creature state, freezer contents, and part inventory.
 * Provides actions for swapping parts, freezing/defrosting, and harvesting.
 */

import { useState, useCallback, useMemo } from 'react';
import type {
    PlayerCreature,
    BodyPart,
    MVPPartSlot,
    PartType,
    CreatureSlots
} from '../types';
import { createStarterCreature, calculateCreatureStats } from '../utils/creatures';
import { torsos, heads, arms, legs, tails } from '../data/bodyParts';

// All available basic parts (MVP inventory)
const ALL_BASIC_PARTS: BodyPart[] = [
    // Torsos
    torsos.rat, torsos.squirrel, torsos.cat, torsos.dog, torsos.skunk,
    // Heads
    heads.rat, heads.squirrel, heads.cat, heads.dog, heads.skunk,
    // Arms
    arms.rat, arms.squirrel, arms.cat, arms.dog, arms.skunk,
    // Legs
    legs.rat, legs.squirrel, legs.cat, legs.dog, legs.skunk,
    // Tails
    tails.rat, tails.squirrel, tails.cat, tails.dog, tails.skunk,
];

const MAX_FREEZER_SLOTS = 3;

interface UseCreatureReturn {
    // State
    creature: PlayerCreature;
    freezer: (BodyPart | null)[];
    inventory: BodyPart[];

    // Computed
    availablePartsForSlot: (slot: MVPPartSlot) => BodyPart[];
    freezerSlotsUsed: number;

    // Actions
    swapPart: (slot: MVPPartSlot, newPart: BodyPart) => void;
    freezePart: (part: BodyPart) => boolean;
    defrostPart: (freezerIndex: number) => BodyPart | null;
    harvestPart: (part: BodyPart) => void;
    loseRandomPart: () => BodyPart | null;
    healCreature: () => void;

    // Combat integration
    updateCreatureAfterCombat: (updatedCreature: PlayerCreature) => void;
}

export function useCreature(): UseCreatureReturn {
    // Creature state
    const [creature, setCreature] = useState<PlayerCreature>(() => createStarterCreature());

    // Freezer (3 slots, can be null)
    const [freezer, setFreezer] = useState<(BodyPart | null)[]>([null, null, null]);

    // Inventory of available parts (starts with all basic parts)
    const [inventory, setInventory] = useState<BodyPart[]>(ALL_BASIC_PARTS);

    // Get slot type from MVPPartSlot
    const getSlotPartType = useCallback((slot: MVPPartSlot): PartType => {
        if (slot === 'head') return 'head';
        if (slot === 'torso') return 'torso';
        if (slot === 'tail') return 'tail';
        if (slot.includes('Arm')) return 'arm';
        if (slot.includes('Leg')) return 'leg';
        return 'torso'; // fallback
    }, []);

    // Get parts available for a specific slot
    const availablePartsForSlot = useCallback((slot: MVPPartSlot): BodyPart[] => {
        const partType = getSlotPartType(slot);
        return inventory.filter(part => part.partType === partType);
    }, [inventory, getSlotPartType]);

    // Freezer slots used count
    const freezerSlotsUsed = useMemo(() =>
        freezer.filter(p => p !== null).length,
        [freezer]
    );

    // Swap a body part in a slot
    const swapPart = useCallback((slot: MVPPartSlot, newPart: BodyPart) => {
        setCreature(prev => {
            const newSlots = { ...prev.slots } as CreatureSlots;

            // Assign to the appropriate slot
            switch (slot) {
                case 'head':
                    newSlots.head = newPart as typeof newSlots.head;
                    break;
                case 'torso':
                    newSlots.torso = newPart as typeof newSlots.torso;
                    break;
                case 'tail':
                    newSlots.tail = newPart as typeof newSlots.tail;
                    break;
                case 'leftArm1':
                    newSlots.leftArm1 = newPart as typeof newSlots.leftArm1;
                    break;
                case 'rightArm1':
                    newSlots.rightArm1 = newPart as typeof newSlots.rightArm1;
                    break;
                case 'leftLeg1':
                    newSlots.leftLeg1 = newPart as typeof newSlots.leftLeg1;
                    break;
                case 'rightLeg1':
                    newSlots.rightLeg1 = newPart as typeof newSlots.rightLeg1;
                    break;
            }

            // Recalculate stats
            const stats = calculateCreatureStats(newSlots);

            return {
                ...prev,
                slots: newSlots,
                maxHp: stats.maxHp,
                currentHp: Math.min(prev.currentHp, stats.maxHp),
                totalDefense: stats.totalDefense,
            };
        });
    }, []);

    // Freeze a part (add to freezer)
    const freezePart = useCallback((part: BodyPart): boolean => {
        const emptyIndex = freezer.findIndex(p => p === null);
        if (emptyIndex === -1) return false; // Freezer full

        setFreezer(prev => {
            const newFreezer = [...prev];
            newFreezer[emptyIndex] = part;
            return newFreezer;
        });

        return true;
    }, [freezer]);

    // Defrost a part (remove from freezer)
    const defrostPart = useCallback((freezerIndex: number): BodyPart | null => {
        if (freezerIndex < 0 || freezerIndex >= MAX_FREEZER_SLOTS) return null;

        const part = freezer[freezerIndex];
        if (!part) return null;

        setFreezer(prev => {
            const newFreezer = [...prev];
            newFreezer[freezerIndex] = null;
            return newFreezer;
        });

        return part;
    }, [freezer]);

    // Harvest a part (add to inventory after victory)
    const harvestPart = useCallback((part: BodyPart) => {
        setInventory(prev => [...prev, part]);
    }, []);

    // Lose a random non-essential part (on defeat)
    const loseRandomPart = useCallback((): BodyPart | null => {
        // Can only lose arms, legs, or tail (not head or torso)
        const loseableSlots: MVPPartSlot[] = ['leftArm1', 'rightArm1', 'leftLeg1', 'rightLeg1', 'tail'];
        const occupiedSlots = loseableSlots.filter(slot => creature.slots[slot as keyof typeof creature.slots]);

        if (occupiedSlots.length === 0) return null;

        const randomSlot = occupiedSlots[Math.floor(Math.random() * occupiedSlots.length)];
        const lostPart = creature.slots[randomSlot as keyof typeof creature.slots];

        setCreature(prev => {
            const newSlots = { ...prev.slots };
            (newSlots as Record<string, BodyPart | null>)[randomSlot] = null;

            const stats = calculateCreatureStats(newSlots);

            return {
                ...prev,
                slots: newSlots,
                maxHp: stats.maxHp,
                currentHp: Math.min(prev.currentHp, stats.maxHp),
                totalDefense: stats.totalDefense,
            };
        });

        return lostPart;
    }, []);

    // Heal creature to full HP
    const healCreature = useCallback(() => {
        setCreature(prev => ({
            ...prev,
            currentHp: prev.maxHp,
            activeEffects: [],
        }));
    }, []);

    // Update creature after combat (sync HP, effects)
    const updateCreatureAfterCombat = useCallback((updatedCreature: PlayerCreature) => {
        setCreature(updatedCreature);
    }, []);

    return {
        creature,
        freezer,
        inventory,
        availablePartsForSlot,
        freezerSlotsUsed,
        swapPart,
        freezePart,
        defrostPart,
        harvestPart,
        loseRandomPart,
        healCreature,
        updateCreatureAfterCombat,
    };
}

export default useCreature;

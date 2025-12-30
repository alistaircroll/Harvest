/**
 * useCreature Hook
 * 
 * Manages player creature state, freezer contents, and part swapping.
 * The freezer is the core inventory - you can only swap equipped parts
 * with frozen parts of the same type.
 */

import { useState, useCallback, useMemo } from 'react';
import type {
    PlayerCreature,
    BodyPart,
    MVPPartSlot,
    PartType,
    CreatureSlots
} from '../types';
import { FREEZER_SLOTS } from '../types';
import { createStarterCreature, calculateCreatureStats } from '../utils/creatures';

interface UseCreatureReturn {
    // State
    creature: PlayerCreature;
    freezer: (BodyPart | null)[];

    // Computed
    /** Get available parts for a slot: equipped + frozen parts of same type */
    availablePartsForSlot: (slot: MVPPartSlot) => BodyPart[];
    /** Check if a slot has alternatives in the freezer */
    hasAlternatives: (slot: MVPPartSlot) => boolean;
    freezerSlotsUsed: number;
    canFreeze: boolean;
    isDead: boolean;

    // Actions
    /** Swap a part - old part goes to specified freezer slot, new part gets equipped */
    swapPart: (slot: MVPPartSlot, newPart: BodyPart, freezerIndex: number) => void;
    /** Move creature part to freezer slot (leaves slot empty) */
    moveToFreezer: (slot: MVPPartSlot, freezerIndex: number) => void;
    /** Empty a freezer slot permanently */
    emptyFreezerSlot: (freezerIndex: number) => void;
    /** Reset to new creature (for New Game) */
    resetCreature: () => void;
    /** Add a part to an empty freezer slot */
    freezePart: (part: BodyPart) => boolean;
    /** Remove a part from the freezer */
    defrostPart: (freezerIndex: number) => BodyPart | null;
    /** Add harvested part to freezer (from combat victory) */
    harvestPart: (part: BodyPart) => boolean;
    /** Lose a random non-essential part (on defeat) */
    loseRandomPart: () => BodyPart | null;
    /** Heal creature to full HP */
    healCreature: () => void;
}

export function useCreature(): UseCreatureReturn {
    // Creature state
    const [creature, setCreature] = useState<PlayerCreature>(() => createStarterCreature());

    // Freezer (3 slots, can be null)
    const [freezer, setFreezer] = useState<(BodyPart | null)[]>([null, null, null]);

    // Get slot type from MVPPartSlot
    const getSlotPartType = useCallback((slot: MVPPartSlot): PartType => {
        if (slot === 'head') return 'head';
        if (slot === 'torso') return 'torso';
        if (slot === 'tail') return 'tail';
        if (slot.includes('Arm')) return 'arm';
        if (slot.includes('Leg')) return 'leg';
        return 'torso'; // fallback
    }, []);

    // Get the currently equipped part for a slot
    const getEquippedPart = useCallback((slot: MVPPartSlot): BodyPart | null => {
        return creature.slots[slot as keyof CreatureSlots] as BodyPart | null;
    }, [creature.slots]);

    // Get frozen parts of a specific type
    const getFrozenPartsOfType = useCallback((partType: PartType): BodyPart[] => {
        return freezer.filter((p): p is BodyPart => p !== null && p.partType === partType);
    }, [freezer]);

    // Get available parts for a slot: equipped + frozen parts of same type
    const availablePartsForSlot = useCallback((slot: MVPPartSlot): BodyPart[] => {
        const partType = getSlotPartType(slot);
        const equipped = getEquippedPart(slot);
        const frozen = getFrozenPartsOfType(partType);

        // Start with equipped part, then add frozen alternatives
        const available: BodyPart[] = [];
        if (equipped) available.push(equipped);

        // Add frozen parts that aren't the same as equipped
        for (const part of frozen) {
            const isDuplicate = equipped &&
                part.animalType === equipped.animalType &&
                part.partType === equipped.partType;
            if (!isDuplicate) {
                available.push(part);
            }
        }

        return available;
    }, [getSlotPartType, getEquippedPart, getFrozenPartsOfType]);

    // Check if a slot has alternatives (frozen parts of same type)
    const hasAlternatives = useCallback((slot: MVPPartSlot): boolean => {
        const partType = getSlotPartType(slot);
        const frozenOfType = getFrozenPartsOfType(partType);
        return frozenOfType.length > 0;
    }, [getSlotPartType, getFrozenPartsOfType]);

    // Freezer slots used count
    const freezerSlotsUsed = useMemo(() =>
        freezer.filter(p => p !== null).length,
        [freezer]
    );

    // Can freeze more parts?
    const canFreeze = freezerSlotsUsed < FREEZER_SLOTS;

    // Check if creature is in death state (only head+torso, no limbs)
    const isDead = useMemo(() => {
        const limbSlots: MVPPartSlot[] = ['leftArm1', 'rightArm1', 'leftLeg1', 'rightLeg1', 'tail'];
        return limbSlots.every(slot => creature.slots[slot as keyof CreatureSlots] === null);
    }, [creature.slots]);

    // Helper: Update creature slots and recalculate stats
    const updateCreatureSlots = useCallback((updateFn: (slots: CreatureSlots) => void) => {
        setCreature(prev => {
            const newSlots = { ...prev.slots } as CreatureSlots;
            updateFn(newSlots); // Mutate the copy

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

    // Helper: Set specific slot (cleaner than switch)
    const setSlot = (slots: CreatureSlots, slot: MVPPartSlot, part: BodyPart | null) => {
        const key = slot as keyof CreatureSlots;
        (slots as unknown as Record<string, BodyPart | null>)[key] = part;
    };

    // Swap a body part - old part goes to specified freezer slot, new part gets equipped
    const swapPart = useCallback((slot: MVPPartSlot, newPart: BodyPart, freezerIndex: number) => {
        // Get old part first
        const oldPart = creature.slots[slot as keyof CreatureSlots];

        // Update creature
        updateCreatureSlots(slots => {
            setSlot(slots, slot, newPart);
        });

        // Put old part in the specified freezer slot
        if (oldPart) {
            setFreezer(prevFreezer => {
                const newFreezer = [...prevFreezer];
                newFreezer[freezerIndex] = oldPart as BodyPart; // We know it's a body part if it was in the slot
                return newFreezer;
            });
        }
    }, [creature.slots, updateCreatureSlots]);

    // Empty a freezer slot permanently
    const emptyFreezerSlot = useCallback((freezerIndex: number) => {
        setFreezer(prev => {
            const newFreezer = [...prev];
            newFreezer[freezerIndex] = null;
            return newFreezer;
        });
    }, []);

    // Move creature part to freezer slot (leaves creature slot empty/null)
    const moveToFreezer = useCallback((slot: MVPPartSlot, freezerIndex: number) => {
        const partToMove = creature.slots[slot as keyof CreatureSlots];

        if (!partToMove) return; // Nothing to move

        // Update creature (remove part)
        updateCreatureSlots(slots => {
            setSlot(slots, slot, null);
        });

        // Put part in freezer slot
        setFreezer(prevFreezer => {
            const newFreezer = [...prevFreezer];
            newFreezer[freezerIndex] = partToMove as BodyPart;
            return newFreezer;
        });
    }, [creature.slots, updateCreatureSlots]);

    // Reset to new creature (for New Game)
    const resetCreature = useCallback(() => {
        setCreature(createStarterCreature());
        setFreezer([null, null, null]);
    }, []);

    // Freeze a part (add to an empty freezer slot)
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
        if (freezerIndex < 0 || freezerIndex >= FREEZER_SLOTS) return null;

        const part = freezer[freezerIndex];
        if (!part) return null;

        setFreezer(prev => {
            const newFreezer = [...prev];
            newFreezer[freezerIndex] = null;
            return newFreezer;
        });

        return part;
    }, [freezer]);

    // Harvest a part (add to freezer after victory)
    const harvestPart = useCallback((part: BodyPart): boolean => {
        return freezePart(part);
    }, [freezePart]);

    // Lose a random non-essential part (on defeat)
    const loseRandomPart = useCallback((): BodyPart | null => {
        // Can only lose arms, legs, or tail (not head or torso)
        const loseableSlots: MVPPartSlot[] = ['leftArm1', 'rightArm1', 'leftLeg1', 'rightLeg1', 'tail'];

        // Use current creature state directly
        const occupiedSlots = loseableSlots.filter(slot =>
            creature.slots[slot as keyof CreatureSlots]
        );

        if (occupiedSlots.length === 0) return null;

        const randomSlot = occupiedSlots[Math.floor(Math.random() * occupiedSlots.length)];
        const lostPart = creature.slots[randomSlot as keyof CreatureSlots] as BodyPart;

        // Update state
        updateCreatureSlots(slots => {
            setSlot(slots, randomSlot, null);
        });

        return lostPart;
    }, [creature.slots, updateCreatureSlots]);

    // Heal creature to full HP
    const healCreature = useCallback(() => {
        setCreature(prev => ({
            ...prev,
            currentHp: prev.maxHp,
            activeEffects: [],
        }));
    }, []);

    return {
        creature,
        freezer,
        availablePartsForSlot,
        hasAlternatives,
        freezerSlotsUsed,
        canFreeze,
        isDead,
        swapPart,
        moveToFreezer,
        emptyFreezerSlot,
        resetCreature,
        freezePart,
        defrostPart,
        harvestPart,
        loseRandomPart,
        healCreature,
    };
}

export default useCreature;

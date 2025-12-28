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
import { createStarterCreature, calculateCreatureStats } from '../utils/creatures';

const MAX_FREEZER_SLOTS = 3;

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
    const canFreeze = freezerSlotsUsed < MAX_FREEZER_SLOTS;

    // Swap a body part - old part goes to specified freezer slot, new part gets equipped
    const swapPart = useCallback((slot: MVPPartSlot, newPart: BodyPart, freezerIndex: number) => {
        setCreature(prev => {
            const newSlots = { ...prev.slots } as CreatureSlots;
            const oldPart = newSlots[slot as keyof CreatureSlots];

            // Assign new part to the appropriate slot
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

            // Put old part in the specified freezer slot
            setFreezer(prevFreezer => {
                const newFreezer = [...prevFreezer];
                newFreezer[freezerIndex] = oldPart;
                return newFreezer;
            });

            return {
                ...prev,
                slots: newSlots,
                maxHp: stats.maxHp,
                currentHp: Math.min(prev.currentHp, stats.maxHp),
                totalDefense: stats.totalDefense,
            };
        });
    }, []);

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
        setCreature(prev => {
            const newSlots = { ...prev.slots } as CreatureSlots;
            const partToMove = newSlots[slot as keyof CreatureSlots];

            if (!partToMove) return prev; // Nothing to move

            // Set slot to null (creature loses this part)
            switch (slot) {
                case 'head':
                    newSlots.head = null as unknown as typeof newSlots.head;
                    break;
                case 'leftArm1':
                    newSlots.leftArm1 = null as unknown as typeof newSlots.leftArm1;
                    break;
                case 'rightArm1':
                    newSlots.rightArm1 = null as unknown as typeof newSlots.rightArm1;
                    break;
                case 'leftLeg1':
                    newSlots.leftLeg1 = null as unknown as typeof newSlots.leftLeg1;
                    break;
                case 'rightLeg1':
                    newSlots.rightLeg1 = null as unknown as typeof newSlots.rightLeg1;
                    break;
                case 'tail':
                    newSlots.tail = null as unknown as typeof newSlots.tail;
                    break;
                // torso cannot be moved
                default:
                    return prev;
            }

            // Recalculate stats
            const stats = calculateCreatureStats(newSlots);

            // Put part in freezer slot
            setFreezer(prevFreezer => {
                const newFreezer = [...prevFreezer];
                newFreezer[freezerIndex] = partToMove;
                return newFreezer;
            });

            return {
                ...prev,
                slots: newSlots,
                maxHp: stats.maxHp,
                currentHp: Math.min(prev.currentHp, stats.maxHp),
                totalDefense: stats.totalDefense,
            };
        });
    }, []);

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

    // Harvest a part (add to freezer after victory)
    const harvestPart = useCallback((part: BodyPart): boolean => {
        return freezePart(part);
    }, [freezePart]);

    // Lose a random non-essential part (on defeat)
    const loseRandomPart = useCallback((): BodyPart | null => {
        // Can only lose arms, legs, or tail (not head or torso)
        const loseableSlots: MVPPartSlot[] = ['leftArm1', 'rightArm1', 'leftLeg1', 'rightLeg1', 'tail'];

        // Use functional update to get current creature state
        let lostPart: BodyPart | null = null;

        setCreature(prev => {
            const occupiedSlots = loseableSlots.filter(slot =>
                prev.slots[slot as keyof typeof prev.slots]
            );

            if (occupiedSlots.length === 0) return prev;

            const randomSlot = occupiedSlots[Math.floor(Math.random() * occupiedSlots.length)];
            lostPart = prev.slots[randomSlot as keyof typeof prev.slots] as BodyPart;

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

    return {
        creature,
        freezer,
        availablePartsForSlot,
        hasAlternatives,
        freezerSlotsUsed,
        canFreeze,
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

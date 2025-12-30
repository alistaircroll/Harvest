/**
 * useEncounteredAbilities Hook
 * 
 * Tracks which special abilities the player has encountered.
 * Persists to localStorage so tutorials only show once.
 */

import { useState, useCallback, useEffect } from 'react';
import type { WildCreature, Attack } from '../types';

const STORAGE_KEY = 'harvest_encountered_abilities';
const STORAGE_VERSION = 1;

interface StoredData {
    version: number;
    seenAbilities: string[];
}

/**
 * Load encountered abilities from localStorage
 */
function loadFromStorage(): Set<string> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return new Set();

        const data: StoredData = JSON.parse(stored);

        // Check version for future migrations
        if (data.version !== STORAGE_VERSION) {
            return new Set();
        }

        return new Set(data.seenAbilities);
    } catch {
        return new Set();
    }
}

/**
 * Save encountered abilities to localStorage
 */
function saveToStorage(abilities: Set<string>): void {
    const data: StoredData = {
        version: STORAGE_VERSION,
        seenAbilities: Array.from(abilities)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export interface EncounteredAbilitiesResult {
    /** Check if a specific ability has been seen */
    hasSeenAbility: (attackId: string) => boolean;

    /** Mark an ability as seen */
    markAbilitySeen: (attackId: string) => void;

    /** Mark multiple abilities as seen */
    markAbilitiesSeen: (attackIds: string[]) => void;

    /** Get list of new (unseen) special abilities from a creature */
    getNewAbilities: (creature: WildCreature) => Attack[];

    /** Reset all encountered abilities (for dev/testing) */
    resetAll: () => void;

    /** All currently seen ability IDs */
    seenAbilityIds: string[];
}

export function useEncounteredAbilities(): EncounteredAbilitiesResult {
    const [seen, setSeen] = useState<Set<string>>(() => loadFromStorage());

    // Sync to localStorage when seen changes
    useEffect(() => {
        saveToStorage(seen);
    }, [seen]);

    const hasSeenAbility = useCallback((attackId: string): boolean => {
        return seen.has(attackId);
    }, [seen]);

    const markAbilitySeen = useCallback((attackId: string): void => {
        setSeen(prev => {
            if (prev.has(attackId)) return prev;
            const next = new Set(prev);
            next.add(attackId);
            return next;
        });
    }, []);

    const markAbilitiesSeen = useCallback((attackIds: string[]): void => {
        setSeen(prev => {
            let changed = false;
            const next = new Set(prev);
            for (const id of attackIds) {
                if (!next.has(id)) {
                    next.add(id);
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, []);

    const getNewAbilities = useCallback((creature: WildCreature): Attack[] => {
        // Filter to attacks that have effects (special abilities) and haven't been seen
        return creature.attacks.filter(attack => {
            // Must have an effect to be a "special ability"
            if (!attack.effect) return false;
            // Generate ID from attack.id or attack.name (with null safety)
            const attackId = attack.id || (attack.name ? attack.name.toLowerCase().replace(/\s+/g, '_') : '');
            // Must not have been seen before
            return attackId && !seen.has(attackId);
        });
    }, [seen]);

    const resetAll = useCallback((): void => {
        setSeen(new Set());
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return {
        hasSeenAbility,
        markAbilitySeen,
        markAbilitiesSeen,
        getNewAbilities,
        resetAll,
        seenAbilityIds: Array.from(seen)
    };
}

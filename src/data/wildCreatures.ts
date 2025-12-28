/**
 * Wild Creatures Data
 * 
 * Definitions for all 5 MVP wild creatures in the City biome.
 * Data sourced from CreatureLab_GameSpec_v1.md Appendix C.
 */

import type {
    WildCreatureDefinition,
    WildCreature,
    AnimalType,
    Biome
} from '../types';
import { torsos, heads, arms, legs, tails } from './bodyParts';

// ================================
// Wild Creature Definitions
// ================================

export const wildCreatureDefinitions: Record<Biome, WildCreatureDefinition[]> = {
    city: [
        {
            type: 'rat',
            totalHp: 40,
            defense: 0,
            apPerTurn: 4,
            attacks: [
                { name: 'Nibble', apCost: 1, damage: 4, effect: null },
                { name: 'Scratch', apCost: 1, damage: 5, effect: null },
                { name: 'Kick', apCost: 1, damage: 4, effect: null },
                { name: 'Tail Whip', apCost: 1, damage: 3, effect: null },
            ],
        },
        {
            type: 'squirrel',
            totalHp: 45,
            defense: 1,
            apPerTurn: 5,
            attacks: [
                { name: 'Chitter', apCost: 1, damage: 3, effect: null },
                { name: 'Scratch', apCost: 1, damage: 5, effect: null },
                { name: 'Kick', apCost: 1, damage: 4, effect: null },
                {
                    name: 'Climb a Tree',
                    apCost: 2,
                    damage: 0,
                    effect: { type: 'buff_evasion', value: 50, duration: 1 }
                },
            ],
        },
        {
            type: 'cat',
            totalHp: 55,
            defense: 1,
            apPerTurn: 5,
            attacks: [
                { name: 'Bite', apCost: 2, damage: 8, effect: null },
                { name: 'Swipe', apCost: 1, damage: 6, effect: null },
                {
                    name: 'Cat Scratch Fever',
                    apCost: 2,
                    damage: 4,
                    effect: { type: 'dot', value: 3, duration: 3, stacks: true }
                },
                { name: 'Pounce', apCost: 4, damage: 10, effect: null },
            ],
        },
        {
            type: 'dog',
            totalHp: 65,
            defense: 3,
            apPerTurn: 5,
            attacks: [
                { name: 'Bite', apCost: 2, damage: 7, effect: null },
                { name: 'Paw Slap', apCost: 1, damage: 5, effect: null },
                { name: 'Kick', apCost: 1, damage: 5, effect: null },
                {
                    name: 'Lick It Better',
                    apCost: 2,
                    damage: 0,
                    effect: { type: 'heal', value: 8 }
                },
            ],
        },
        {
            type: 'skunk',
            totalHp: 55,
            defense: 3,
            apPerTurn: 5,
            attacks: [
                { name: 'Nip', apCost: 1, damage: 5, effect: null },
                { name: 'Claw', apCost: 1, damage: 5, effect: null },
                { name: 'Kick', apCost: 1, damage: 4, effect: null },
                {
                    name: 'Stinky Spray',
                    apCost: 3,
                    damage: 0,
                    effect: { type: 'debuff_ap', value: 2, duration: 2, stacks: false }
                },
            ],
        },
    ],
    // Future biomes (empty for MVP)
    park: [],
    pond: [],
    forest: [],
    beach: [],
    mountains: [],
    jungle: [],
};

// ================================
// Factory Functions
// ================================

/**
 * Create a wild creature instance for combat
 */
export function createWildCreature(
    type: AnimalType,
    biome: Biome = 'city',
    difficultyMultiplier: number = 1.0
): WildCreature {
    const definition = wildCreatureDefinitions[biome].find(c => c.type === type);

    if (!definition) {
        throw new Error(`No wild creature of type ${type} found in biome ${biome}`);
    }

    const scaledHp = Math.floor(definition.totalHp * difficultyMultiplier);
    const scaledDefense = Math.floor(definition.defense * difficultyMultiplier);

    return {
        type: definition.type,
        biome,
        totalHp: scaledHp,
        currentHp: scaledHp,
        defense: scaledDefense,
        apPerTurn: definition.apPerTurn,
        attacks: definition.attacks,
        activeEffects: [],
        lootTable: {
            torso: torsos[type],
            head: heads[type],
            arm: arms[type],
            leg: legs[type],
            tail: tails[type],
        },
    };
}

/**
 * Get random creatures for encounter selection
 */
export function getRandomEncounters(biome: Biome, count: number = 3): AnimalType[] {
    const available = wildCreatureDefinitions[biome];

    if (available.length === 0) {
        throw new Error(`No creatures available in biome ${biome}`);
    }

    const encounters: AnimalType[] = [];

    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * available.length);
        encounters.push(available[randomIndex].type);
    }

    return encounters;
}

/**
 * Get all creature types available in a biome
 */
export function getAvailableCreatures(biome: Biome): AnimalType[] {
    return wildCreatureDefinitions[biome].map(c => c.type);
}

/**
 * Get creature by type (for info display)
 */
export function getCreatureDefinition(
    type: AnimalType,
    biome: Biome = 'city'
): WildCreatureDefinition | undefined {
    return wildCreatureDefinitions[biome].find(c => c.type === type);
}

// ================================
// Difficulty Tiers (for future use)
// ================================

export const difficultyTiers: Record<Biome, number> = {
    city: 1.0,
    park: 1.2,
    pond: 1.4,
    forest: 1.6,
    beach: 1.8,
    mountains: 2.0,
    jungle: 2.5,
};

/**
 * Body Parts Data
 * 
 * Complete definition of all 25 MVP body parts with stats and attacks.
 * Data sourced from CreatureLab_GameSpec_v1.md Appendix B.
 */

import type {
    AnimalType,
    PartType,
    TorsoBodyPart,
    HeadBodyPart,
    LimbBodyPart,
    BodyPart,
    Attack
} from '../types';

// ================================
// Torsos (5 variants)
// Torsos provide HP and defense but no attacks
// ================================

export const torsos: Record<AnimalType, TorsoBodyPart> = {
    rat: {
        partType: 'torso',
        animalType: 'rat',
        hpBonus: 20,
        defense: 0,
        attacks: [],
    },
    squirrel: {
        partType: 'torso',
        animalType: 'squirrel',
        hpBonus: 22,
        defense: 1,
        attacks: [],
    },
    cat: {
        partType: 'torso',
        animalType: 'cat',
        hpBonus: 25,
        defense: 1,
        attacks: [],
    },
    dog: {
        partType: 'torso',
        animalType: 'dog',
        hpBonus: 30,
        defense: 2,
        attacks: [],
    },
    skunk: {
        partType: 'torso',
        animalType: 'skunk',
        hpBonus: 25,
        defense: 2,
        attacks: [],
    },
};

// ================================
// Heads (5 variants)
// Heads provide HP, some defense, and 1-2 attacks
// ================================

export const heads: Record<AnimalType, HeadBodyPart> = {
    rat: {
        partType: 'head',
        animalType: 'rat',
        hpBonus: 10,
        defense: 0,
        attacks: [
            { name: 'Nibble', apCost: 1, damage: 4, effect: null },
        ],
    },
    squirrel: {
        partType: 'head',
        animalType: 'squirrel',
        hpBonus: 10,
        defense: 0,
        attacks: [
            { name: 'Chitter', apCost: 1, damage: 3, effect: null },
        ],
    },
    cat: {
        partType: 'head',
        animalType: 'cat',
        hpBonus: 12,
        defense: 0,
        attacks: [
            { name: 'Bite', apCost: 2, damage: 8, effect: null },
            {
                name: 'Hiss',
                apCost: 1,
                damage: 0,
                effect: { type: 'debuff_defense', value: 1, duration: 2 }
            },
        ],
    },
    dog: {
        partType: 'head',
        animalType: 'dog',
        hpBonus: 15,
        defense: 1,
        attacks: [
            { name: 'Bite', apCost: 2, damage: 7, effect: null },
            {
                name: 'Lick It Better',
                apCost: 2,
                damage: 0,
                effect: { type: 'heal', value: 8 }
            },
        ],
    },
    skunk: {
        partType: 'head',
        animalType: 'skunk',
        hpBonus: 12,
        defense: 1,
        attacks: [
            { name: 'Nip', apCost: 1, damage: 5, effect: null },
        ],
    },
};

// ================================
// Arms (5 variants)
// Arms provide defense and 1-2 attacks
// ================================

export const arms: Record<AnimalType, LimbBodyPart> = {
    rat: {
        partType: 'arm',
        animalType: 'rat',
        defense: 0,
        attacks: [
            { name: 'Scratch', apCost: 1, damage: 5, effect: null },
        ],
    },
    squirrel: {
        partType: 'arm',
        animalType: 'squirrel',
        defense: 0,
        attacks: [
            { name: 'Scratch', apCost: 1, damage: 5, effect: null },
        ],
    },
    cat: {
        partType: 'arm',
        animalType: 'cat',
        defense: 0,
        attacks: [
            { name: 'Swipe', apCost: 1, damage: 6, effect: null },
            {
                name: 'Cat Scratch Fever',
                apCost: 2,
                damage: 4,
                effect: { type: 'dot', value: 3, duration: 3, stacks: true }
            },
        ],
    },
    dog: {
        partType: 'arm',
        animalType: 'dog',
        defense: 1,
        attacks: [
            { name: 'Paw Slap', apCost: 1, damage: 5, effect: null },
        ],
    },
    skunk: {
        partType: 'arm',
        animalType: 'skunk',
        defense: 0,
        attacks: [
            { name: 'Claw', apCost: 1, damage: 5, effect: null },
        ],
    },
};

// ================================
// Legs (5 variants)
// Legs provide defense and 1-2 attacks
// ================================

export const legs: Record<AnimalType, LimbBodyPart> = {
    rat: {
        partType: 'leg',
        animalType: 'rat',
        defense: 0,
        attacks: [
            { name: 'Kick', apCost: 1, damage: 4, effect: null },
        ],
    },
    squirrel: {
        partType: 'leg',
        animalType: 'squirrel',
        defense: 0,
        attacks: [
            { name: 'Kick', apCost: 1, damage: 4, effect: null },
            {
                name: 'Climb a Tree',
                apCost: 2,
                damage: 0,
                effect: { type: 'buff_evasion', value: 50, duration: 1 }
            },
        ],
    },
    cat: {
        partType: 'leg',
        animalType: 'cat',
        defense: 0,
        attacks: [
            { name: 'Kick', apCost: 1, damage: 5, effect: null },
            {
                name: 'Pounce',
                apCost: 2,
                damage: 10,
                effect: null,
                requiresBothLegs: true  // Must have both cat legs to use
            },
        ],
    },
    dog: {
        partType: 'leg',
        animalType: 'dog',
        defense: 1,
        attacks: [
            { name: 'Kick', apCost: 1, damage: 5, effect: null },
        ],
    },
    skunk: {
        partType: 'leg',
        animalType: 'skunk',
        defense: 0,
        attacks: [
            { name: 'Kick', apCost: 1, damage: 4, effect: null },
        ],
    },
};

// ================================
// Tails (5 variants)
// Tails provide defense and 1-2 attacks
// ================================

export const tails: Record<AnimalType, LimbBodyPart> = {
    rat: {
        partType: 'tail',
        animalType: 'rat',
        defense: 0,
        attacks: [
            { name: 'Tail Whip', apCost: 1, damage: 3, effect: null },
        ],
    },
    squirrel: {
        partType: 'tail',
        animalType: 'squirrel',
        defense: 0,
        attacks: [
            { name: 'Fluffy Distract', apCost: 1, damage: 2, effect: null },
            {
                name: 'Distract',
                apCost: 1,
                damage: 0,
                effect: { type: 'debuff_accuracy', value: 1, duration: 1 }
            },
        ],
    },
    cat: {
        partType: 'tail',
        animalType: 'cat',
        defense: 0,
        attacks: [
            { name: 'Tail Whip', apCost: 1, damage: 4, effect: null },
        ],
    },
    dog: {
        partType: 'tail',
        animalType: 'dog',
        defense: 0,
        attacks: [
            { name: 'Tail Wag', apCost: 1, damage: 3, effect: null },
            {
                name: 'Happy Wag',
                apCost: 1,
                damage: 0,
                effect: { type: 'buff_defense', value: 1, duration: 2 }
            },
        ],
    },
    skunk: {
        partType: 'tail',
        animalType: 'skunk',
        defense: 0,
        attacks: [
            { name: 'Tail Slap', apCost: 1, damage: 3, effect: null },
            {
                name: 'Stinky Spray',
                apCost: 3,
                damage: 0,
                effect: { type: 'debuff_ap', value: 2, duration: 2, stacks: false }
            },
        ],
    },
};

// ================================
// Utility Functions
// ================================

/**
 * Get a body part by type and animal
 */
export function getBodyPart(partType: PartType, animalType: AnimalType): BodyPart {
    switch (partType) {
        case 'torso':
            return torsos[animalType];
        case 'head':
            return heads[animalType];
        case 'arm':
            return arms[animalType];
        case 'leg':
            return legs[animalType];
        case 'tail':
            return tails[animalType];
    }
}

/**
 * Get all basic parts (for laboratory drawer)
 */
export function getAllBasicParts(): BodyPart[] {
    const animals: AnimalType[] = ['rat', 'squirrel', 'cat', 'dog', 'skunk'];
    const parts: BodyPart[] = [];

    for (const animal of animals) {
        parts.push(torsos[animal]);
        parts.push(heads[animal]);
        parts.push(arms[animal]);
        parts.push(legs[animal]);
        parts.push(tails[animal]);
    }

    return parts;
}

/**
 * Get parts with special abilities (for freezer starting condition)
 */
export function getPartsWithSpecialAbilities(): BodyPart[] {
    const specials: BodyPart[] = [
        heads.dog,      // Lick It Better (heal)
        heads.cat,      // Hiss (defense debuff)
        arms.cat,       // Cat Scratch Fever (DoT)
        legs.squirrel,  // Climb a Tree (evasion)
        legs.cat,       // Pounce (high damage)
        tails.dog,      // Happy Wag (defense buff)
        tails.skunk,    // Stinky Spray (AP debuff)
        tails.squirrel, // Distract (accuracy debuff)
    ];
    return specials;
}

/**
 * Get all attacks from a list of body parts
 */
export function getAllAttacksFromParts(parts: (BodyPart | null)[]): Attack[] {
    return parts
        .filter((part): part is BodyPart => part !== null)
        .flatMap(part => part.attacks);
}

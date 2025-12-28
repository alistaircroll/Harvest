/**
 * Creature Lab - Type Definitions
 * 
 * Core game types for body parts, creatures, combat, and player state.
 */

// ================================
// Enums and Constants
// ================================

export type PartType = 'torso' | 'head' | 'arm' | 'leg' | 'tail';
export type AnimalType = 'rat' | 'squirrel' | 'cat' | 'dog' | 'skunk';
export type Biome = 'city' | 'park' | 'pond' | 'forest' | 'beach' | 'mountains' | 'jungle';

export type EffectType =
    | 'dot'           // Damage over time
    | 'heal'          // Restore HP
    | 'debuff_defense'// Reduce target defense
    | 'debuff_ap'     // Reduce target max AP
    | 'debuff_accuracy' // Reduce target accuracy
    | 'buff_defense'  // Increase own defense
    | 'buff_evasion'; // Chance to dodge

export type PartSlot =
    | 'torso'
    | 'head'
    | 'leftArm'
    | 'rightArm'
    | 'leftLeg'
    | 'rightLeg'
    | 'tail';

// ================================
// Effect System
// ================================

export interface Effect {
    type: EffectType;
    value: number;
    duration?: number;      // Number of turns (undefined for instant effects like heal)
    stacks?: boolean;       // Whether multiple applications stack
}

export interface ActiveEffect extends Effect {
    remainingDuration: number;
    sourceId?: string;      // Track source for stacking calculations
}

// ================================
// Attack System
// ================================

export interface Attack {
    name: string;
    apCost: number;
    damage: number;
    effect: Effect | null;
    requiresBothLegs?: boolean;  // Cat's Pounce requires both legs
}

export interface SelectedAttack {
    attack: Attack;
    sourcePartSlot: PartSlot;
    sourceAnimal: AnimalType;
}

// ================================
// Body Parts
// ================================

export interface BodyPartBase {
    partType: PartType;
    animalType: AnimalType;
    defense: number;
    attacks: Attack[];
}

export interface TorsoBodyPart extends BodyPartBase {
    partType: 'torso';
    hpBonus: number;
}

export interface HeadBodyPart extends BodyPartBase {
    partType: 'head';
    hpBonus: number;
}

export interface LimbBodyPart extends BodyPartBase {
    partType: 'arm' | 'leg' | 'tail';
    hpBonus?: never;  // Limbs don't have HP bonus
}

export type BodyPart = TorsoBodyPart | HeadBodyPart | LimbBodyPart;

// Helper type for data files
export interface BodyPartData {
    hpBonus?: number;
    defense: number;
    attacks: Attack[];
}

// ================================
// Creatures
// ================================

export interface CreatureSlots {
    torso: TorsoBodyPart;
    head: HeadBodyPart | null;
    leftArm: LimbBodyPart | null;
    rightArm: LimbBodyPart | null;
    leftLeg: LimbBodyPart | null;
    rightLeg: LimbBodyPart | null;
    tail: LimbBodyPart | null;
}

export interface PlayerCreature {
    slots: CreatureSlots;
    // Computed values (calculated from parts)
    maxHp: number;
    currentHp: number;
    totalDefense: number;
    activeEffects: ActiveEffect[];
}

export interface WildCreature {
    type: AnimalType;
    biome: Biome;
    totalHp: number;
    currentHp: number;
    defense: number;
    apPerTurn: number;
    attacks: Attack[];
    activeEffects: ActiveEffect[];
    // Loot table - what parts can be harvested
    lootTable: {
        torso: TorsoBodyPart;
        head: HeadBodyPart;
        arm: LimbBodyPart;
        leg: LimbBodyPart;
        tail: LimbBodyPart;
    };
}

// ================================
// Combat State
// ================================

export type CombatPhase =
    | 'player_turn'
    | 'enemy_turn'
    | 'resolution'
    | 'victory'
    | 'defeat';

export interface CombatState {
    phase: CombatPhase;
    turn: number;

    // Player state
    playerCreature: PlayerCreature;
    playerAp: number;
    playerMaxAp: number;
    playerAttackQueue: SelectedAttack[];

    // Enemy state
    wildCreature: WildCreature;
    enemyAp: number;
    enemyAttackQueue: Attack[];

    // Combat log
    log: CombatLogEntry[];
}

export interface CombatLogEntry {
    turn: number;
    message: string;
    type: 'attack' | 'effect' | 'heal' | 'info';
}

// ================================
// Game State
// ================================

export type GameScreen =
    | 'auth'
    | 'laboratory'
    | 'biome_select'
    | 'creature_select'
    | 'combat'
    | 'victory'
    | 'defeat';

export interface FreezerSlot {
    part: BodyPart | null;
}

export interface GameState {
    currentScreen: GameScreen;
    playerCreature: PlayerCreature;
    freezer: [FreezerSlot, FreezerSlot, FreezerSlot];
    inventory: BodyPart[];
    selectedBiome: Biome | null;
    currentCombat: CombatState | null;
    isDead: boolean;  // True if creature only has head + torso
}

// ================================
// Player (Firestore Document)
// ================================

export interface PlayerStats {
    battlesWon: number;
    battlesLost: number;
    totalPartsHarvested: number;
    deaths: number;
}

export interface PlayerDocument {
    odayId: string;
    email: string;
    displayName: string | null;
    creature: CreatureSlots;
    freezer: [BodyPart | null, BodyPart | null, BodyPart | null];
    inventory: BodyPart[];
    stats: PlayerStats;
    createdAt: Date;
    updatedAt: Date;
}

// ================================
// Utility Types
// ================================

export interface CreatureStats {
    maxHp: number;
    totalDefense: number;
    totalAttacks: Attack[];
}

// Wild creature definition (for data file)
export interface WildCreatureDefinition {
    type: AnimalType;
    totalHp: number;
    defense: number;
    apPerTurn: number;
    attacks: Attack[];
}

// ================================
// Constants
// ================================

export const BASE_PLAYER_AP = 6;
export const BASE_PLAYER_HP = 10;  // Added to torso + head HP
export const FREEZER_SLOTS = 3;
export const DEFAULT_DIFFICULTY = 1.0;

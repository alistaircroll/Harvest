/**
 * Creature Lab - Type Definitions
 * 
 * Core game types for body parts, creatures, combat, and player state.
 * 
 * FUTURE-PROOFING: This type system supports the full creature design:
 * - Torsos with up to 8 limbs (4 per side), wings, and shell
 * - Heads with horn, antennae, and gill attachment slots
 * - MVP only uses a subset of these slots
 */

// ================================
// Enums and Constants
// ================================

// Part types - includes future parts
export type PartType =
    | 'torso'
    | 'head'
    | 'arm'
    | 'leg'
    | 'tail'
    // Future part types
    | 'wing'
    | 'shell'
    | 'horn'
    | 'antennae'
    | 'gill';

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

// All possible limb positions (future-proofed for 8 limbs)
export type LimbPosition = 1 | 2 | 3 | 4;
export type LimbSide = 'left' | 'right';

// Part slots - future-proofed for full creature
export type PartSlot =
    // Core (always present)
    | 'torso'
    | 'head'
    | 'tail'
    // MVP limbs (positions 1-2)
    | 'leftArm1' | 'rightArm1'   // Upper arms (MVP: leftArm, rightArm)
    | 'leftLeg1' | 'rightLeg1'   // Upper legs (MVP: leftLeg, rightLeg)
    // Future limbs (positions 2-4)
    | 'leftArm2' | 'rightArm2'
    | 'leftArm3' | 'rightArm3'
    | 'leftArm4' | 'rightArm4'
    | 'leftLeg2' | 'rightLeg2'
    | 'leftLeg3' | 'rightLeg3'
    | 'leftLeg4' | 'rightLeg4'
    // Future torso attachments
    | 'leftWing' | 'rightWing'
    | 'shell'
    // Future head attachments
    | 'leftHorn' | 'rightHorn'
    | 'leftAntenna' | 'rightAntenna'
    | 'leftGill' | 'rightGill';

// MVP-only slot type (what we currently use)
export type MVPPartSlot =
    | 'torso'
    | 'head'
    | 'leftArm1' | 'rightArm1'
    | 'leftLeg1' | 'rightLeg1'
    | 'tail';

// Legacy slot names for compatibility
export type LegacyPartSlot =
    | 'torso'
    | 'head'
    | 'leftArm' | 'rightArm'
    | 'leftLeg' | 'rightLeg'
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
    // Future: maxLimbSlots?: number; // For octopus (8), spider (8), etc.
}

export interface HeadBodyPart extends BodyPartBase {
    partType: 'head';
    hpBonus: number;
    // Future: hasHornSlots?: boolean;
    // Future: hasAntennaSlots?: boolean;
    // Future: hasGillSlots?: boolean;
}

export interface LimbBodyPart extends BodyPartBase {
    partType: 'arm' | 'leg' | 'tail';
    hpBonus?: never;  // Limbs don't have HP bonus
}

// Future attachment types
export interface WingBodyPart extends BodyPartBase {
    partType: 'wing';
    hpBonus?: never;
}

export interface ShellBodyPart extends BodyPartBase {
    partType: 'shell';
    hpBonus: number;  // Shell provides HP
}

export interface HeadAttachmentPart extends BodyPartBase {
    partType: 'horn' | 'antennae' | 'gill';
    hpBonus?: never;
}

export type BodyPart =
    | TorsoBodyPart
    | HeadBodyPart
    | LimbBodyPart
    | WingBodyPart
    | ShellBodyPart
    | HeadAttachmentPart;

// Helper type for data files
export interface BodyPartData {
    hpBonus?: number;
    defense: number;
    attacks: Attack[];
}

// ================================
// Creatures - Future-Proofed Layout
// ================================

/**
 * Full creature slots supporting 8 limbs + attachments
 * MVP only populates arm1, leg1 positions
 */
export interface CreatureSlots {
    // Core (permanent)
    torso: TorsoBodyPart;

    // Head + attachments
    head: HeadBodyPart | null;
    leftHorn: HeadAttachmentPart | null;     // Future
    rightHorn: HeadAttachmentPart | null;    // Future
    leftAntenna: HeadAttachmentPart | null;  // Future
    rightAntenna: HeadAttachmentPart | null; // Future
    leftGill: HeadAttachmentPart | null;     // Future
    rightGill: HeadAttachmentPart | null;    // Future

    // Arms (up to 4 per side)
    leftArm1: LimbBodyPart | null;   // MVP: main left arm
    rightArm1: LimbBodyPart | null;  // MVP: main right arm
    leftArm2: LimbBodyPart | null;   // Future
    rightArm2: LimbBodyPart | null;  // Future
    leftArm3: LimbBodyPart | null;   // Future
    rightArm3: LimbBodyPart | null;  // Future
    leftArm4: LimbBodyPart | null;   // Future
    rightArm4: LimbBodyPart | null;  // Future

    // Legs (up to 4 per side)
    leftLeg1: LimbBodyPart | null;   // MVP: main left leg
    rightLeg1: LimbBodyPart | null;  // MVP: main right leg
    leftLeg2: LimbBodyPart | null;   // Future
    rightLeg2: LimbBodyPart | null;  // Future
    leftLeg3: LimbBodyPart | null;   // Future
    rightLeg3: LimbBodyPart | null;  // Future
    leftLeg4: LimbBodyPart | null;   // Future
    rightLeg4: LimbBodyPart | null;  // Future

    // Tail
    tail: LimbBodyPart | null;

    // Back attachments
    leftWing: WingBodyPart | null;   // Future
    rightWing: WingBodyPart | null;  // Future
    shell: ShellBodyPart | null;     // Future
}

/**
 * MVP-only creature slots (what we display in Sprint 1)
 */
export interface MVPCreatureSlots {
    torso: TorsoBodyPart;
    head: HeadBodyPart | null;
    leftArm1: LimbBodyPart | null;
    rightArm1: LimbBodyPart | null;
    leftLeg1: LimbBodyPart | null;
    rightLeg1: LimbBodyPart | null;
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
// MVP Slot Helpers
// ================================

/** MVP-only part slots */
export const MVP_PART_SLOTS: MVPPartSlot[] = [
    'torso', 'head',
    'leftArm1', 'rightArm1',
    'leftLeg1', 'rightLeg1',
    'tail'
];

/** Future slots (not used in MVP, shown as empty/locked) */
export const FUTURE_LIMB_SLOTS: PartSlot[] = [
    'leftArm2', 'rightArm2',
    'leftArm3', 'rightArm3',
    'leftArm4', 'rightArm4',
    'leftLeg2', 'rightLeg2',
    'leftLeg3', 'rightLeg3',
    'leftLeg4', 'rightLeg4',
];

export const FUTURE_ATTACHMENT_SLOTS: PartSlot[] = [
    'leftWing', 'rightWing',
    'shell',
    'leftHorn', 'rightHorn',
    'leftAntenna', 'rightAntenna',
    'leftGill', 'rightGill',
];

// ================================
// Constants
// ================================

export const BASE_PLAYER_AP = 6;
export const BASE_PLAYER_HP = 10;  // Added to torso + head HP
export const FREEZER_SLOTS = 3;
export const DEFAULT_DIFFICULTY = 1.0;
export const MAX_LIMBS_PER_SIDE = 4;  // Future: up to 4 arms + 4 legs per side

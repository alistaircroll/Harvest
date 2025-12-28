/**
 * Combat Utilities
 * 
 * Core combat calculations and turn resolution logic.
 */

import type {
    Attack,
    WildCreature,
    ActiveEffect,
    SelectedAttack,
    CombatLogEntry
} from '../types';

// ================================
// Damage Calculation
// ================================

/**
 * Calculate damage dealt by an attack, accounting for defense
 */
export function calculateDamage(
    attack: Attack,
    targetDefense: number
): number {
    // Damage = base damage - defense (minimum 1)
    const damage = Math.max(1, attack.damage - targetDefense);
    return damage;
}

/**
 * Calculate total defense from active effects
 */
export function getEffectiveDefense(
    baseDefense: number,
    activeEffects: ActiveEffect[]
): number {
    let defense = baseDefense;

    for (const effect of activeEffects) {
        if (effect.type === 'buff_defense') {
            defense += effect.value;
        }
        if (effect.type === 'debuff_defense') {
            defense -= effect.value;
        }
    }

    return Math.max(0, defense);
}

/**
 * Check if attack hits (accounting for evasion)
 */
export function doesAttackHit(
    targetEffects: ActiveEffect[]
): boolean {
    // Check for evasion buff
    const evasion = targetEffects.find(e => e.type === 'buff_evasion');
    if (evasion) {
        // Evasion value is % chance to dodge
        const dodgeRoll = Math.random() * 100;
        if (dodgeRoll < evasion.value) {
            return false; // Dodged!
        }
    }

    return true;
}

// ================================
// Effect Processing
// ================================

/**
 * Apply damage-over-time effects at start of turn
 */
export function processDotEffects(
    effects: ActiveEffect[],
    currentHp: number,
    log: CombatLogEntry[],
    turn: number,
    targetName: string
): { newHp: number; newEffects: ActiveEffect[] } {
    let hp = currentHp;
    const updatedEffects: ActiveEffect[] = [];

    for (const effect of effects) {
        if (effect.type === 'dot') {
            // Apply DoT damage
            hp -= effect.value;
            log.push({
                turn,
                message: `${targetName} takes ${effect.value} poison damage!`,
                type: 'effect'
            });
        }

        // Decrement duration
        const newDuration = effect.remainingDuration - 1;
        if (newDuration > 0) {
            updatedEffects.push({
                ...effect,
                remainingDuration: newDuration
            });
        } else {
            log.push({
                turn,
                message: `${effect.type} effect expired on ${targetName}`,
                type: 'info'
            });
        }
    }

    return { newHp: Math.max(0, hp), newEffects: updatedEffects };
}

/**
 * Apply AP debuff effect
 */
export function getEffectiveMaxAp(
    baseAp: number,
    activeEffects: ActiveEffect[]
): number {
    let ap = baseAp;

    for (const effect of activeEffects) {
        if (effect.type === 'debuff_ap') {
            ap -= effect.value;
        }
    }

    return Math.max(1, ap); // Minimum 1 AP
}

/**
 * Apply a new effect, handling stacking
 */
export function applyEffect(
    activeEffects: ActiveEffect[],
    newEffect: ActiveEffect,
    sourceId: string
): ActiveEffect[] {
    const effects = [...activeEffects];

    // Check if this effect type already exists
    const existingIndex = effects.findIndex(e => e.type === newEffect.type);

    if (existingIndex >= 0) {
        const existing = effects[existingIndex];

        if (newEffect.stacks) {
            // Stacking effects add together
            effects[existingIndex] = {
                ...existing,
                value: existing.value + newEffect.value,
                remainingDuration: Math.max(existing.remainingDuration, newEffect.remainingDuration)
            };
        } else {
            // Non-stacking effects refresh duration only
            effects[existingIndex] = {
                ...existing,
                remainingDuration: newEffect.remainingDuration
            };
        }
    } else {
        // New effect
        effects.push({
            ...newEffect,
            sourceId
        });
    }

    return effects;
}

// ================================
// Attack Resolution
// ================================

export interface AttackResult {
    damage: number;
    hit: boolean;
    effectApplied: ActiveEffect | null;
    healAmount: number;
}

/**
 * Resolve a single attack
 */
export function resolveAttack(
    attack: Attack,
    attackerName: string,
    targetDefense: number,
    targetEffects: ActiveEffect[],
    log: CombatLogEntry[],
    turn: number
): AttackResult {
    const result: AttackResult = {
        damage: 0,
        hit: true,
        effectApplied: null,
        healAmount: 0
    };

    // Check if attack hits
    if (!doesAttackHit(targetEffects)) {
        result.hit = false;
        log.push({
            turn,
            message: `${attackerName}'s ${attack.name} missed!`,
            type: 'attack'
        });
        return result;
    }

    // Calculate and apply damage
    if (attack.damage > 0) {
        const effectiveDefense = getEffectiveDefense(targetDefense, targetEffects);
        result.damage = calculateDamage(attack, effectiveDefense);
        log.push({
            turn,
            message: `${attackerName} uses ${attack.name} for ${result.damage} damage!`,
            type: 'attack'
        });
    }

    // Apply effect if present
    if (attack.effect) {
        const effect = attack.effect;

        if (effect.type === 'heal') {
            result.healAmount = effect.value;
            log.push({
                turn,
                message: `${attackerName} heals for ${effect.value} HP!`,
                type: 'heal'
            });
        } else if (effect.duration) {
            result.effectApplied = {
                ...effect,
                remainingDuration: effect.duration
            };
            log.push({
                turn,
                message: `${attack.name} applies ${effect.type}!`,
                type: 'effect'
            });
        }
    }

    return result;
}

// ================================
// Enemy AI
// ================================

/**
 * Simple AI: randomly select attacks until AP depleted
 */
export function selectEnemyAttacks(
    creature: WildCreature,
    availableAp: number
): Attack[] {
    const selected: Attack[] = [];
    let remainingAp = availableAp;

    // Get affordable attacks
    const affordable = creature.attacks.filter(a => a.apCost <= remainingAp);

    if (affordable.length === 0) {
        return selected;
    }

    // Keep selecting random attacks until AP depleted
    while (remainingAp > 0) {
        const canAfford = creature.attacks.filter(a => a.apCost <= remainingAp);
        if (canAfford.length === 0) break;

        // Random selection
        const randomIndex = Math.floor(Math.random() * canAfford.length);
        const attack = canAfford[randomIndex];

        selected.push(attack);
        remainingAp -= attack.apCost;
    }

    return selected;
}

// ================================
// Combat State Helpers
// ================================

/**
 * Check if creature is dead
 */
export function isCreatureDefeated(currentHp: number): boolean {
    return currentHp <= 0;
}

/**
 * Get AP cost of all selected attacks
 */
export function getTotalApCost(attacks: SelectedAttack[]): number {
    return attacks.reduce((total, sa) => total + sa.attack.apCost, 0);
}

/**
 * Get AP cost of attack array
 */
export function getAttackArrayApCost(attacks: Attack[]): number {
    return attacks.reduce((total, a) => total + a.apCost, 0);
}

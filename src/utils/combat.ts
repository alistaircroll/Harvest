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
    CombatLogEntry,
    PlayerCreature,
    Condition,
    Effect
} from '../types';

// ================================
// Context & Conditions
// ================================

export interface EffectContext {
    targetHp?: number;
    targetMaxHp?: number;
    targetEffects?: ActiveEffect[];
    selfHp?: number;
    selfMaxHp?: number;
    selfEffects?: ActiveEffect[];
    turn?: number;
}

/**
 * Check if a condition is met
 */
export function checkCondition(condition: Condition | undefined, context: EffectContext): boolean {
    if (!condition) return true;

    if (condition.targetHpBelow !== undefined && context.targetHp !== undefined && context.targetMaxHp) {
        if ((context.targetHp / context.targetMaxHp) * 100 >= condition.targetHpBelow) return false;
    }
    if (condition.targetHpAbove !== undefined && context.targetHp !== undefined && context.targetMaxHp) {
        if ((context.targetHp / context.targetMaxHp) * 100 <= condition.targetHpAbove) return false;
    }
    if (condition.selfHpBelow !== undefined && context.selfHp !== undefined && context.selfMaxHp) {
        if ((context.selfHp / context.selfMaxHp) * 100 >= condition.selfHpBelow) return false;
    }
    if (condition.turnNumber !== undefined && context.turn !== undefined) {
        if (context.turn !== condition.turnNumber) return false;
    }
    if (condition.oddTurn && context.turn !== undefined) {
        if (context.turn % 2 === 0) return false;
    }
    if (condition.evenTurn && context.turn !== undefined) {
        if (context.turn % 2 !== 0) return false;
    }
    // Condition: hasEffect / lacksEffect
    if (condition.hasEffect && context.targetEffects) {
        if (!context.targetEffects.some(e => e.type === condition.hasEffect)) return false;
    }
    if (condition.lacksEffect && context.targetEffects) {
        if (context.targetEffects.some(e => e.type === condition.lacksEffect)) return false;
    }

    return true;
}

// ================================
// Initiative & Speed
// ================================

/**
 * Calculate effective speed including buffs/debuffs
 */
export function getEffectiveSpeed(
    baseSpeed: number,
    activeEffects: ActiveEffect[]
): number {
    let speed = baseSpeed;

    for (const effect of activeEffects) {
        if (effect.type === 'buff_speed' || effect.type === 'haste') {
            speed += effect.value;
        }
        if (effect.type === 'debuff_speed') {
            speed -= effect.value;
        }
    }

    return Math.max(0, speed);
}

/**
 * Calculate initiative for an attack
 * 
 * Formula: Attack Speed + Head Speed Bonus (player only) + Active Effects ± Random(0-10)
 * Higher initiative = acts first in the turn queue.
 */
export function calculateInitiative(
    attack: Attack,
    creature: PlayerCreature | WildCreature
): number {
    let speed = attack.speed;

    // Add head bonus (if player creature)
    if ('slots' in creature && creature.slots.head) {
        speed += creature.slots.head.speedBonus;
    }

    // Add active effects
    speed = getEffectiveSpeed(speed, creature.activeEffects);

    // Random variance to prevent ties
    speed += Math.floor(Math.random() * 11); // 0-10

    return speed;
}

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
    healAmount: number;
    effects: ActiveEffect[];
    apChange: number;
}

/**
 * Evaluate a single effect
 */
export function evaluateEffect(effect: Effect, context: EffectContext): {
    damage?: number;
    heal?: number;
    apChange?: number;
    newEffects: ActiveEffect[];
} {
    // Check chance
    if (effect.chance !== undefined && Math.random() * 100 > effect.chance) {
        return { newEffects: [] };
    }

    // Check condition
    if (!checkCondition(effect.condition, context)) {
        return { newEffects: [] };
    }

    const result: {
        damage?: number;
        heal?: number;
        apChange?: number;
        newEffects: ActiveEffect[];
    } = { newEffects: [] };

    // Handle immediate effects vs duration effects
    switch (effect.type) {
        case 'damage':
        case 'true_damage':
        case 'overkill':
            result.damage = effect.value;
            break;
        case 'heal':
        case 'hot': // immediate part if any? usually HOT is duration
            if (!effect.duration) result.heal = effect.value;
            else result.newEffects.push({ ...effect, remainingDuration: effect.duration!, currentStacks: 1 });
            break;
        case 'ap_steal':
        case 'ap_refund':
        case 'ap_burst':
            result.apChange = effect.value;
            break;
        case 'debuff_ap': // immediate reduction?
            // Usually this is "reduce target AP" which is immediate state change,
            // OR "reduce max AP" which is duration.
            // Taxonomy says Modifiers: 'debuff_ap'. Usually duration.
            if (effect.duration) {
                result.newEffects.push({ ...effect, remainingDuration: effect.duration!, currentStacks: 1 });
            } else {
                result.apChange = -effect.value;
            }
            break;
        default:
            // Default to duration effect if duration exists
            if (effect.duration) {
                result.newEffects.push({
                    ...effect,
                    remainingDuration: effect.duration,
                    currentStacks: 1
                });
            }
            break;
    }

    return result;
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
    turn: number,
    // Optional context data if available (e.g. self HP)
    attackerContext?: { hp: number; maxHp: number; effects: ActiveEffect[] },
    targetHp?: number,
    targetMaxHp?: number
): AttackResult {
    const result: AttackResult = {
        damage: 0,
        hit: true,
        healAmount: 0,
        effects: [],
        apChange: 0
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

    // Calculate base damage
    if (attack.damage > 0) {
        const effectiveDefense = getEffectiveDefense(targetDefense, targetEffects);
        result.damage = calculateDamage(attack, effectiveDefense);
        log.push({
            turn,
            message: `${attackerName} uses ${attack.name} for ${result.damage} damage!`,
            type: 'attack'
        });
    }

    // Evaluate Effect
    if (attack.effect) {
        const context: EffectContext = {
            targetHp,
            targetMaxHp,
            targetEffects,
            selfHp: attackerContext?.hp,
            selfMaxHp: attackerContext?.maxHp,
            selfEffects: attackerContext?.effects,
            turn
        };

        const evalResult = evaluateEffect(attack.effect, context);

        if (evalResult.damage) {
            result.damage += evalResult.damage;
            // log extra damage?
            log.push({ turn, message: `Extra damage from effect: ${evalResult.damage}!`, type: 'attack' });
        }
        if (evalResult.heal) {
            result.healAmount += evalResult.heal;
            log.push({ turn, message: `${attackerName} heals for ${evalResult.heal}!`, type: 'heal' });
        }
        if (evalResult.apChange) {
            result.apChange += evalResult.apChange;
            log.push({ turn, message: `AP ${evalResult.apChange > 0 ? 'recovered' : 'drained'} (${Math.abs(evalResult.apChange)})!`, type: 'effect' });
        }
        if (evalResult.newEffects.length > 0) {
            result.effects.push(...evalResult.newEffects);
            evalResult.newEffects.forEach(e => {
                log.push({
                    turn,
                    message: `${attack.name} applies ${e.type}!`,
                    type: 'effect'
                });
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

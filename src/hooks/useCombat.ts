/**
 * useCombat Hook
 * 
 * Manages combat state, turns, and attack resolution.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
    PlayerCreature,
    WildCreature,
    CombatState,
    CombatPhase,
    SelectedAttack,
    CombatLogEntry,
    PartSlot
} from '../types';
import { BASE_PLAYER_AP } from '../types';
import {
    resolveAttack,
    processDotEffects,
    selectEnemyAttacks,
    getEffectiveMaxAp,
    applyEffect,
    isCreatureDefeated,
    getTotalApCost,
    calculateInitiative
} from '../utils/combat';
import { getCreatureAttacks } from '../utils/creatures';

interface UseCombatOptions {
    playerCreature: PlayerCreature;
    wildCreature: WildCreature;
}

interface UseCombatReturn {
    state: CombatState;
    phase: CombatPhase;
    playerHp: number;
    enemyHp: number;
    playerAp: number;
    playerMaxAp: number;
    enemyMaxAp: number;
    availableAttacks: SelectedAttack[];
    selectedAttacks: SelectedAttack[];
    selectedSlots: PartSlot[];
    canAddAttack: (attack: SelectedAttack) => boolean;
    canAddAttacks: (attacks: SelectedAttack[]) => boolean;
    addAttack: (attack: SelectedAttack) => void;
    addAttacks: (attacks: SelectedAttack[]) => void;
    removeAttack: (index: number) => void;
    clearAttacks: () => void;
    executeTurn: () => void;
    log: CombatLogEntry[];
}

export function useCombat({
    playerCreature,
    wildCreature
}: UseCombatOptions): UseCombatReturn {

    // Combat state
    const [state, setState] = useState<CombatState>(() => ({
        phase: 'player_turn',
        turn: 1,
        playerCreature: { ...playerCreature },
        playerAp: BASE_PLAYER_AP,
        playerMaxAp: BASE_PLAYER_AP,
        playerAttackQueue: [],
        wildCreature: { ...wildCreature },
        enemyAp: wildCreature.apPerTurn,
        enemyAttackQueue: [],
        initiativeQueue: [],
        currentInitiativeIndex: 0,
        log: [{
            turn: 1,
            message: `A wild ${wildCreature.type} appears!`,
            type: 'info'
        }]
    }));

    // Derived values
    const playerHp = state.playerCreature.currentHp;
    const enemyHp = state.wildCreature.currentHp;
    const playerAp = state.playerAp;
    const playerMaxAp = getEffectiveMaxAp(BASE_PLAYER_AP, state.playerCreature.activeEffects);
    const enemyMaxAp = getEffectiveMaxAp(state.wildCreature.apPerTurn, state.wildCreature.activeEffects);

    // Get all available attacks from player creature
    const availableAttacks = useMemo(() =>
        getCreatureAttacks(state.playerCreature.slots),
        [state.playerCreature.slots]
    );

    // Selected attacks queue
    const selectedAttacks = state.playerAttackQueue;

    // Check if player can add an attack
    const canAddAttack = useCallback((attack: SelectedAttack) => {
        const currentCost = getTotalApCost(state.playerAttackQueue);
        return currentCost + attack.attack.apCost <= state.playerAp;
    }, [state.playerAttackQueue, state.playerAp]);

    // Check if player can add multiple attacks
    const canAddAttacks = useCallback((attacks: SelectedAttack[]) => {
        const currentCost = getTotalApCost(state.playerAttackQueue);
        const newCost = getTotalApCost(attacks);
        return currentCost + newCost <= state.playerAp;
    }, [state.playerAttackQueue, state.playerAp]);

    // Add attack to queue
    const addAttack = useCallback((attack: SelectedAttack) => {
        if (!canAddAttack(attack)) return;

        setState(prev => ({
            ...prev,
            playerAttackQueue: [...prev.playerAttackQueue, attack]
        }));
    }, [canAddAttack]);

    // Add multiple attacks to queue
    const addAttacks = useCallback((attacks: SelectedAttack[]) => {
        if (!canAddAttacks(attacks)) return;

        setState(prev => ({
            ...prev,
            playerAttackQueue: [...prev.playerAttackQueue, ...attacks]
        }));
    }, [canAddAttacks]);

    // Remove attack from queue
    const removeAttack = useCallback((index: number) => {
        setState(prev => ({
            ...prev,
            playerAttackQueue: prev.playerAttackQueue.filter((_, i) => i !== index)
        }));
    }, []);

    // Clear attack queue
    const clearAttacks = useCallback(() => {
        setState(prev => ({
            ...prev,
            playerAttackQueue: []
        }));
    }, []);

    // Get selected slots (for visual highlighting)
    const selectedSlots = useMemo(() => {
        const slots = new Set<PartSlot>();
        for (const attack of state.playerAttackQueue) {
            slots.add(attack.sourcePartSlot);
        }
        return Array.from(slots);
    }, [state.playerAttackQueue]);

    // Execute step of initiative queue
    const resolveNextAction = useCallback(() => {
        setState(prev => {
            const queue = prev.initiativeQueue;
            const index = prev.currentInitiativeIndex;

            // If queue finished, end turn
            if (index >= queue.length) {
                // Process DoT effects at end of turn
                const newLog = [...prev.log];
                let playerCreatureState = { ...prev.playerCreature };
                let wildCreatureState = { ...prev.wildCreature };
                const turn = prev.turn;

                // Enemy DoT
                if (wildCreatureState.activeEffects.length > 0) {
                    const dotResult = processDotEffects(
                        wildCreatureState.activeEffects,
                        wildCreatureState.currentHp,
                        newLog,
                        turn,
                        wildCreatureState.type
                    );
                    wildCreatureState = {
                        ...wildCreatureState,
                        currentHp: dotResult.newHp,
                        activeEffects: dotResult.newEffects
                    };
                }

                // Player DoT
                if (playerCreatureState.activeEffects.length > 0) {
                    const dotResult = processDotEffects(
                        playerCreatureState.activeEffects,
                        playerCreatureState.currentHp,
                        newLog,
                        turn,
                        'Your creature'
                    );
                    playerCreatureState = {
                        ...playerCreatureState,
                        currentHp: dotResult.newHp,
                        activeEffects: dotResult.newEffects
                    };
                }

                // Check DoT deaths
                if (isCreatureDefeated(wildCreatureState.currentHp)) {
                    newLog.push({ turn, message: `The ${wildCreatureState.type} succumbs to poison!`, type: 'info' });
                    return {
                        ...prev,
                        phase: 'victory',
                        playerCreature: playerCreatureState,
                        wildCreature: wildCreatureState,
                        log: newLog,
                        initiativeQueue: [],
                        currentInitiativeIndex: 0
                    };
                }
                if (isCreatureDefeated(playerCreatureState.currentHp)) {
                    newLog.push({ turn, message: 'Your creature succumbs to poison!', type: 'info' });
                    return {
                        ...prev,
                        phase: 'defeat',
                        playerCreature: playerCreatureState,
                        wildCreature: wildCreatureState,
                        log: newLog,
                        initiativeQueue: [],
                        currentInitiativeIndex: 0
                    };
                }

                // Next turn
                const newTurn = turn + 1;
                newLog.push({ turn: newTurn, message: `--- Turn ${newTurn} ---`, type: 'info' });

                return {
                    ...prev,
                    phase: 'player_turn',
                    turn: newTurn,
                    playerCreature: playerCreatureState,
                    wildCreature: wildCreatureState,
                    playerAp: getEffectiveMaxAp(BASE_PLAYER_AP, playerCreatureState.activeEffects),
                    playerAttackQueue: [],
                    enemyAp: getEffectiveMaxAp(wildCreatureState.apPerTurn, wildCreatureState.activeEffects),
                    log: newLog,
                    initiativeQueue: [],
                    currentInitiativeIndex: 0
                };
            }

            // --- PROCESS ACTION ---
            const entry = queue[index];
            const newLog = [...prev.log];
            const playerCreatureState = { ...prev.playerCreature };
            const wildCreatureState = { ...prev.wildCreature };
            let currentPlayerAp = prev.playerAp; // Track AP changes
            let currentEnemyAp = prev.enemyAp;
            let phase = prev.phase;

            // Check for stun/freeze
            const actingCreature = entry.actorId === 'player' ? playerCreatureState : wildCreatureState;
            const actorName = entry.actorId === 'player' ? 'Your creature' : `The ${wildCreatureState.type}`;

            const isDisabled = actingCreature.activeEffects.some(e =>
                e.type === 'stun' || e.type === 'freeze' || e.type === 'sleep'
            );

            if (isDisabled) {
                newLog.push({
                    turn: prev.turn,
                    message: `${actorName} is disabled and cannot act!`,
                    type: 'info'
                });

                return {
                    ...prev,
                    phase,
                    playerCreature: playerCreatureState,
                    wildCreature: wildCreatureState,
                    playerAp: currentPlayerAp,
                    enemyAp: currentEnemyAp,
                    log: newLog,
                    currentInitiativeIndex: index + 1
                };
            }

            // Resolve Attack
            if (entry.actorId === 'player') {
                const attack = entry.attack as SelectedAttack;
                const result = resolveAttack(
                    attack.attack,
                    'You',
                    wildCreatureState.defense,
                    wildCreatureState.activeEffects,
                    newLog,
                    prev.turn,
                    { hp: playerCreatureState.currentHp, maxHp: playerCreatureState.maxHp, effects: playerCreatureState.activeEffects },
                    wildCreatureState.currentHp,
                    wildCreatureState.totalHp
                );

                // Apply results
                if (result.hit && result.damage > 0) {
                    wildCreatureState.currentHp = Math.max(0, wildCreatureState.currentHp - result.damage);
                }
                if (result.healAmount > 0) {
                    playerCreatureState.currentHp = Math.min(playerCreatureState.maxHp, playerCreatureState.currentHp + result.healAmount);
                }
                if (result.effects.length > 0) {
                    result.effects.forEach(eff => {
                        wildCreatureState.activeEffects = applyEffect(
                            wildCreatureState.activeEffects,
                            eff,
                            attack.sourcePartSlot
                        );
                    });
                }
                if (result.apChange !== 0) {
                    currentPlayerAp = Math.max(0, currentPlayerAp + result.apChange);
                }
            } else {
                // Enemy Attack
                const attack = entry.attack as import('../types').Attack;
                const result = resolveAttack(
                    attack,
                    wildCreatureState.type,
                    playerCreatureState.totalDefense,
                    playerCreatureState.activeEffects,
                    newLog,
                    prev.turn,
                    { hp: wildCreatureState.currentHp, maxHp: wildCreatureState.totalHp, effects: wildCreatureState.activeEffects },
                    playerCreatureState.currentHp,
                    playerCreatureState.maxHp
                );

                if (result.hit && result.damage > 0) {
                    playerCreatureState.currentHp = Math.max(0, playerCreatureState.currentHp - result.damage);
                }
                if (result.effects.length > 0) {
                    result.effects.forEach(eff => {
                        playerCreatureState.activeEffects = applyEffect(
                            playerCreatureState.activeEffects,
                            eff,
                            'enemy' // Source is enemy
                        );
                    });
                }
                if (result.apChange !== 0) {
                    currentEnemyAp = Math.max(0, currentEnemyAp + result.apChange);
                }
            }

            // Check Immediate Deaths
            if (isCreatureDefeated(wildCreatureState.currentHp)) {
                newLog.push({ turn: prev.turn, message: `The ${wildCreatureState.type} is defeated!`, type: 'info' });
                phase = 'victory';
            } else if (isCreatureDefeated(playerCreatureState.currentHp)) {
                newLog.push({ turn: prev.turn, message: 'Your creature is defeated!', type: 'info' });
                phase = 'defeat';
            }

            return {
                ...prev,
                phase,
                playerCreature: playerCreatureState,
                wildCreature: wildCreatureState,
                playerAp: currentPlayerAp,
                enemyAp: currentEnemyAp,
                log: newLog,
                currentInitiativeIndex: index + 1
            };
        });
    }, []);

    // Effect to drive the queue
    useEffect(() => {
        if (state.phase === 'resolution' && state.currentInitiativeIndex <= state.initiativeQueue.length) {
            // Check if combat ended inside resolution
            if (state.playerCreature.currentHp <= 0 || state.wildCreature.currentHp <= 0) return;

            const timer = setTimeout(() => {
                resolveNextAction();
            }, 800); // 800ms delay between actions
            return () => clearTimeout(timer);
        }
    }, [state.phase, state.currentInitiativeIndex, state.initiativeQueue.length, resolveNextAction, state.playerCreature.currentHp, state.wildCreature.currentHp]);


    // Commit turn: Build queue and start resolution
    const executeTurn = useCallback(() => {
        setState(prev => {
            const queue: import('../types').InitiativeEntry[] = [];
            const newLog = [...prev.log];

            newLog.push({ turn: prev.turn, message: '--- Resolution Phase ---', type: 'info' });

            // 1. Add Player Attacks
            prev.playerAttackQueue.forEach(sa => {
                queue.push({
                    actorId: 'player',
                    speed: calculateInitiative(sa.attack, prev.playerCreature),
                    attack: sa
                });
            });

            // 2. Add Enemy Attacks
            const enemyAttacks = selectEnemyAttacks(prev.wildCreature, prev.enemyAp);
            enemyAttacks.forEach(a => {
                queue.push({
                    actorId: 'enemy',
                    speed: calculateInitiative(a, prev.wildCreature),
                    attack: a
                });
            });

            // 3. Sort by Speed (High to Low)
            queue.sort((a, b) => b.speed - a.speed);

            // Log the order (debug/flavor)
            // queue.forEach(entry => {
            //    const name = entry.actorId === 'player' ? (entry.attack as SelectedAttack).attack.name : (entry.attack as Attack).name;
            //    newLog.push({ turn: prev.turn, message: `> ${name} (Speed: ${entry.speed})`, type: 'info' });
            // });

            return {
                ...prev,
                phase: 'resolution',
                initiativeQueue: queue,
                currentInitiativeIndex: 0,
                log: newLog
            };
        });
    }, []);

    return {
        state,
        phase: state.phase,
        playerHp,
        enemyHp,
        playerAp: playerAp - getTotalApCost(selectedAttacks),
        playerMaxAp,
        enemyMaxAp,
        availableAttacks,
        selectedAttacks,
        selectedSlots,
        canAddAttack,
        canAddAttacks,
        addAttack,
        addAttacks,
        removeAttack,
        clearAttacks,
        executeTurn,
        log: state.log
    };
}

export default useCombat;

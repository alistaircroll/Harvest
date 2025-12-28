/**
 * useCombat Hook
 * 
 * Manages combat state, turns, and attack resolution.
 */

import { useState, useCallback, useMemo } from 'react';
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
    getTotalApCost
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

    // Execute a complete turn
    const executeTurn = useCallback(() => {
        setState(prev => {
            const newLog = [...prev.log];
            const turn = prev.turn;

            // Clone creature states
            let playerCreatureState = { ...prev.playerCreature };
            let wildCreatureState = { ...prev.wildCreature };

            // ----- PLAYER ATTACKS PHASE -----
            newLog.push({ turn, message: '--- Your Turn ---', type: 'info' });

            for (const selectedAttack of prev.playerAttackQueue) {
                const { attack } = selectedAttack;

                const result = resolveAttack(
                    attack,
                    'You',
                    wildCreatureState.defense,
                    wildCreatureState.activeEffects,
                    newLog,
                    turn
                );

                // Apply damage to enemy
                if (result.hit && result.damage > 0) {
                    wildCreatureState = {
                        ...wildCreatureState,
                        currentHp: Math.max(0, wildCreatureState.currentHp - result.damage)
                    };
                }

                // Apply heal to self
                if (result.healAmount > 0) {
                    playerCreatureState = {
                        ...playerCreatureState,
                        currentHp: Math.min(
                            playerCreatureState.maxHp,
                            playerCreatureState.currentHp + result.healAmount
                        )
                    };
                }

                // Apply effect to enemy
                if (result.effectApplied) {
                    wildCreatureState = {
                        ...wildCreatureState,
                        activeEffects: applyEffect(
                            wildCreatureState.activeEffects,
                            result.effectApplied,
                            selectedAttack.sourcePartSlot
                        )
                    };
                }

                // Check if enemy defeated
                if (isCreatureDefeated(wildCreatureState.currentHp)) {
                    newLog.push({ turn, message: `The ${wildCreatureState.type} is defeated!`, type: 'info' });

                    return {
                        ...prev,
                        phase: 'victory' as CombatPhase,
                        playerCreature: playerCreatureState,
                        wildCreature: wildCreatureState,
                        playerAttackQueue: [],
                        log: newLog
                    };
                }
            }

            // ----- ENEMY ATTACKS PHASE -----
            newLog.push({ turn, message: `--- ${wildCreatureState.type}'s Turn ---`, type: 'info' });

            // Enemy AI selects attacks
            const enemyAttacks = selectEnemyAttacks(wildCreatureState, enemyMaxAp);

            for (const attack of enemyAttacks) {
                const result = resolveAttack(
                    attack,
                    wildCreatureState.type,
                    playerCreatureState.totalDefense,
                    playerCreatureState.activeEffects,
                    newLog,
                    turn
                );

                // Apply damage to player
                if (result.hit && result.damage > 0) {
                    playerCreatureState = {
                        ...playerCreatureState,
                        currentHp: Math.max(0, playerCreatureState.currentHp - result.damage)
                    };
                }

                // Apply effect to player
                if (result.effectApplied) {
                    playerCreatureState = {
                        ...playerCreatureState,
                        activeEffects: applyEffect(
                            playerCreatureState.activeEffects,
                            result.effectApplied,
                            'enemy'
                        )
                    };
                }

                // Check if player defeated
                if (isCreatureDefeated(playerCreatureState.currentHp)) {
                    newLog.push({ turn, message: 'Your creature is defeated!', type: 'info' });

                    return {
                        ...prev,
                        phase: 'defeat' as CombatPhase,
                        playerCreature: playerCreatureState,
                        wildCreature: wildCreatureState,
                        playerAttackQueue: [],
                        log: newLog
                    };
                }
            }

            // ----- END OF TURN: Process DoT effects -----
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

                if (isCreatureDefeated(wildCreatureState.currentHp)) {
                    newLog.push({ turn, message: `The ${wildCreatureState.type} succumbs to poison!`, type: 'info' });
                    return {
                        ...prev,
                        phase: 'victory' as CombatPhase,
                        playerCreature: playerCreatureState,
                        wildCreature: wildCreatureState,
                        playerAttackQueue: [],
                        log: newLog
                    };
                }
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

                if (isCreatureDefeated(playerCreatureState.currentHp)) {
                    newLog.push({ turn, message: 'Your creature succumbs to poison!', type: 'info' });
                    return {
                        ...prev,
                        phase: 'defeat' as CombatPhase,
                        playerCreature: playerCreatureState,
                        wildCreature: wildCreatureState,
                        playerAttackQueue: [],
                        log: newLog
                    };
                }
            }

            // ----- NEXT TURN -----
            const newTurn = turn + 1;
            newLog.push({ turn: newTurn, message: `--- Turn ${newTurn} ---`, type: 'info' });

            return {
                ...prev,
                phase: 'player_turn' as CombatPhase,
                turn: newTurn,
                playerCreature: playerCreatureState,
                playerAp: getEffectiveMaxAp(BASE_PLAYER_AP, playerCreatureState.activeEffects),
                playerAttackQueue: [],
                wildCreature: wildCreatureState,
                enemyAp: getEffectiveMaxAp(wildCreatureState.apPerTurn, wildCreatureState.activeEffects),
                log: newLog
            };
        });
    }, [enemyMaxAp]);

    // Callbacks for victory/defeat
    // (Would typically be called after animation completes)

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

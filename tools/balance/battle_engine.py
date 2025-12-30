"""
Battle Engine for Monte Carlo Combat Simulator

Core combat resolution logic, ported from TypeScript.
"""

import random
from typing import List, Tuple, Optional
from dataclasses import dataclass

from .types import (
    Attack, Creature, ActiveEffect, Effect, EffectType, BattleResult
)


@dataclass
class QueuedAction:
    """Action in the initiative queue"""
    attacker: str  # "player" or "enemy"
    attack: Attack
    initiative: int


# Configurable initiative variance (can be set via CLI)
INITIATIVE_VARIANCE = 10


def calculate_initiative(attack: Attack, creature: Creature) -> int:
    """
    Calculate initiative for an attack.
    Higher initiative = goes first.
    
    Formula: attack.speed + creature.speed_bonus + random(0, INITIATIVE_VARIANCE)
    """
    base = attack.speed + creature.speed_bonus
    variance = random.randint(0, INITIATIVE_VARIANCE)
    return base + variance


def build_initiative_queue(
    player: Creature, 
    player_attacks: List[Attack],
    enemy: Creature, 
    enemy_attacks: List[Attack]
) -> List[QueuedAction]:
    """Build and sort the initiative queue for a turn"""
    queue: List[QueuedAction] = []
    
    for attack in player_attacks:
        initiative = calculate_initiative(attack, player)
        queue.append(QueuedAction("player", attack, initiative))
    
    for attack in enemy_attacks:
        initiative = calculate_initiative(attack, enemy)
        queue.append(QueuedAction("enemy", attack, initiative))
    
    # Sort by initiative (descending - higher goes first)
    queue.sort(key=lambda x: x.initiative, reverse=True)
    
    return queue


def apply_effect(
    effect: Effect,
    target: Creature,
    source: Creature
) -> Optional[ActiveEffect]:
    """
    Apply an effect to a target creature.
    Returns ActiveEffect if it should be tracked, None otherwise.
    """
    if effect.type == EffectType.HEAL:
        # Immediate heal, no tracking needed
        if effect.target == "self":
            source.heal(effect.value)
        else:
            target.heal(effect.value)
        return None
    
    if effect.type in (EffectType.BLEED, EffectType.DOT):
        # DoT effects are tracked
        return ActiveEffect(
            effect=effect,
            remaining_turns=effect.duration,
            stacks=1,
            source=f"dot_{effect.type.value}"
        )
    
    if effect.type == EffectType.BUFF_EVASION:
        # Evasion buff tracked on self
        return ActiveEffect(
            effect=effect,
            remaining_turns=effect.duration,
            stacks=1,
            source="evasion_buff"
        )
    
    if effect.type == EffectType.DEBUFF_AP:
        # AP debuff tracked on target
        return ActiveEffect(
            effect=effect,
            remaining_turns=effect.duration,
            stacks=1,
            source="ap_debuff"
        )
    
    if effect.type in (EffectType.BUFF_DEFENSE, EffectType.DEBUFF_DEFENSE):
        return ActiveEffect(
            effect=effect,
            remaining_turns=effect.duration,
            stacks=1,
            source="defense_mod"
        )
    
    # Other effects - track generically
    return ActiveEffect(
        effect=effect,
        remaining_turns=effect.duration,
        stacks=1,
        source=effect.type.value
    )


def check_evasion(target: Creature) -> bool:
    """Check if target evades an attack based on active evasion buffs"""
    for active in target.active_effects:
        if active.effect.type == EffectType.BUFF_EVASION:
            if random.randint(1, 100) <= active.effect.value:
                return True
    return False


def get_effective_defense(creature: Creature) -> int:
    """Calculate effective defense including buffs/debuffs"""
    defense = creature.defense
    
    for active in creature.active_effects:
        if active.effect.type == EffectType.BUFF_DEFENSE:
            defense += active.effect.value
        elif active.effect.type == EffectType.DEBUFF_DEFENSE:
            defense -= active.effect.value
    
    return max(0, defense)


def get_effective_ap(creature: Creature) -> int:
    """Calculate effective AP including debuffs"""
    ap = creature.ap_per_turn
    
    for active in creature.active_effects:
        if active.effect.type == EffectType.DEBUFF_AP:
            ap -= active.effect.value
    
    return max(1, ap)  # Always at least 1 AP


def resolve_attack(
    attacker: Creature,
    defender: Creature,
    attack: Attack
) -> Tuple[int, bool]:
    """
    Resolve a single attack.
    
    Returns: (damage_dealt, was_evaded)
    """
    # Check evasion
    if check_evasion(defender):
        return (0, True)
    
    # Calculate damage
    effective_defense = get_effective_defense(defender)
    damage = max(0, attack.damage - effective_defense)
    
    # Apply damage
    actual_damage = defender.take_damage(damage)
    
    # Apply effect if any
    if attack.effect is not None:
        active = apply_effect(attack.effect, defender, attacker)
        if active is not None:
            # Add to appropriate creature
            if attack.effect.target == "self":
                attacker.active_effects.append(active)
            else:
                defender.active_effects.append(active)
    
    return (actual_damage, False)


def process_dot_effects(creature: Creature) -> int:
    """
    Process DoT effects at end of turn.
    Returns total damage dealt.
    """
    total_damage = 0
    
    for active in creature.active_effects:
        if active.effect.type in (EffectType.BLEED, EffectType.DOT):
            damage = active.effect.value * active.stacks
            creature.take_damage(damage)
            total_damage += damage
    
    return total_damage


def tick_effects(creature: Creature) -> None:
    """Decrement effect durations and remove expired effects"""
    for active in creature.active_effects:
        active.remaining_turns -= 1
    
    creature.active_effects = [
        a for a in creature.active_effects if a.remaining_turns > 0
    ]


def simulate_battle(
    player: Creature,
    enemy: Creature,
    player_strategy: 'Strategy',
    enemy_strategy: 'Strategy',
    max_turns: int = 50
) -> BattleResult:
    """
    Simulate a complete battle between player and enemy.
    
    Args:
        player: Player creature (will be mutated)
        enemy: Enemy creature (will be mutated)
        player_strategy: Strategy for player attack selection
        enemy_strategy: Strategy for enemy attack selection
        max_turns: Maximum turns before draw (enemy wins)
    
    Returns:
        BattleResult with outcome
    """
    turn = 0
    player_total_damage = 0
    enemy_total_damage = 0
    
    while turn < max_turns:
        turn += 1
        
        # Get effective AP for this turn
        player_ap = get_effective_ap(player)
        enemy_ap = get_effective_ap(enemy)
        
        # Select attacks for this turn
        player_attacks = player_strategy.select_turn_attacks(player, enemy, player_ap)
        enemy_attacks = enemy_strategy.select_turn_attacks(enemy, player, enemy_ap)
        
        # Build initiative queue
        queue = build_initiative_queue(player, player_attacks, enemy, enemy_attacks)
        
        # Resolve actions in initiative order
        for action in queue:
            if action.attacker == "player":
                if player.is_dead:
                    continue
                damage, _ = resolve_attack(player, enemy, action.attack)
                player_total_damage += damage
            else:
                if enemy.is_dead:
                    continue
                damage, _ = resolve_attack(enemy, player, action.attack)
                enemy_total_damage += damage
            
            # Check for battle end
            if player.is_dead or enemy.is_dead:
                break
        
        if player.is_dead or enemy.is_dead:
            break
        
        # End of turn: process DoT effects
        process_dot_effects(player)
        process_dot_effects(enemy)
        
        # Tick effect durations
        tick_effects(player)
        tick_effects(enemy)
        
        if player.is_dead or enemy.is_dead:
            break
    
    # Determine winner
    if player.is_dead:
        winner = "enemy"
    elif enemy.is_dead:
        winner = "player"
    else:
        # Stalemate: compare remaining HP percentage
        player_hp_pct = player.current_hp / player.max_hp
        enemy_hp_pct = enemy.current_hp / enemy.max_hp
        
        if player_hp_pct > enemy_hp_pct:
            winner = "player"
        elif enemy_hp_pct > player_hp_pct:
            winner = "enemy"
        else:
            # True tie: random winner
            import random
            winner = random.choice(["player", "enemy"])
    
    return BattleResult(
        winner=winner,
        turns=turn,
        player_hp_remaining=max(0, player.current_hp),
        enemy_hp_remaining=max(0, enemy.current_hp),
        player_damage_dealt=player_total_damage,
        enemy_damage_dealt=enemy_total_damage
    )


# Import Strategy here to avoid circular imports
from .strategies import Strategy

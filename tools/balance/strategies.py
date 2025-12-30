"""
AI Strategies for Monte Carlo Combat Simulator

Each wild creature type has a specific strategy that determines attack selection.
"""

import random
from abc import ABC, abstractmethod
from typing import List

from .types import Attack, Creature, EffectType


class Strategy(ABC):
    """Base strategy class"""
    
    @abstractmethod
    def select_turn_attacks(
        self, 
        creature: Creature, 
        opponent: Creature, 
        available_ap: int
    ) -> List[Attack]:
        """Select attacks for a turn given available AP"""
        pass
    
    def get_affordable_attacks(
        self, 
        creature: Creature, 
        remaining_ap: int
    ) -> List[Attack]:
        """Get attacks that can be afforded with remaining AP"""
        return [a for a in creature.attacks if a.ap_cost <= remaining_ap]


class ChaoticStrategy(Strategy):
    """
    Random attack selection (Rat).
    Just picks random affordable attacks until AP runs out.
    """
    
    def select_turn_attacks(
        self, 
        creature: Creature, 
        opponent: Creature, 
        available_ap: int
    ) -> List[Attack]:
        selected: List[Attack] = []
        remaining_ap = available_ap
        
        while remaining_ap > 0:
            affordable = self.get_affordable_attacks(creature, remaining_ap)
            if not affordable:
                break
            
            attack = random.choice(affordable)
            selected.append(attack)
            remaining_ap -= attack.ap_cost
        
        return selected


class AggressiveStrategy(Strategy):
    """
    Prioritize high-damage attacks (Cat).
    Prefers attacks with highest damage-per-AP ratio.
    """
    
    def select_turn_attacks(
        self, 
        creature: Creature, 
        opponent: Creature, 
        available_ap: int
    ) -> List[Attack]:
        selected: List[Attack] = []
        remaining_ap = available_ap
        
        while remaining_ap > 0:
            affordable = self.get_affordable_attacks(creature, remaining_ap)
            if not affordable:
                break
            
            # Sort by damage-per-AP (descending)
            affordable.sort(key=lambda a: a.damage / max(1, a.ap_cost), reverse=True)
            
            # Take best damage option
            attack = affordable[0]
            selected.append(attack)
            remaining_ap -= attack.ap_cost
        
        return selected


class BalancedStrategy(Strategy):
    """
    Mix of damage and utility (Squirrel).
    Uses defensive abilities when HP is low, otherwise attacks.
    """
    
    def select_turn_attacks(
        self, 
        creature: Creature, 
        opponent: Creature, 
        available_ap: int
    ) -> List[Attack]:
        selected: List[Attack] = []
        remaining_ap = available_ap
        
        # Check for defensive move if HP low
        hp_percent = creature.current_hp / creature.max_hp
        
        if hp_percent < 0.4:
            # Look for evasion or defensive buff
            defensive = [
                a for a in creature.attacks 
                if a.effect and a.effect.type in (
                    EffectType.BUFF_EVASION, 
                    EffectType.BUFF_DEFENSE
                )
                and a.ap_cost <= remaining_ap
            ]
            if defensive:
                attack = defensive[0]
                selected.append(attack)
                remaining_ap -= attack.ap_cost
        
        # Fill remaining AP with damage
        while remaining_ap > 0:
            affordable = self.get_affordable_attacks(creature, remaining_ap)
            if not affordable:
                break
            
            # Prefer damage attacks
            damage_attacks = [a for a in affordable if a.damage > 0]
            if damage_attacks:
                attack = random.choice(damage_attacks)
            else:
                attack = random.choice(affordable)
            
            selected.append(attack)
            remaining_ap -= attack.ap_cost
        
        return selected


class SurvivalStrategy(Strategy):
    """
    Prioritize healing when low HP (Dog).
    Uses heal when HP < 50%, otherwise attacks.
    """
    
    def select_turn_attacks(
        self, 
        creature: Creature, 
        opponent: Creature, 
        available_ap: int
    ) -> List[Attack]:
        selected: List[Attack] = []
        remaining_ap = available_ap
        
        hp_percent = creature.current_hp / creature.max_hp
        
        # Heal if below 50%
        if hp_percent < 0.5:
            heals = [
                a for a in creature.attacks 
                if a.effect and a.effect.type == EffectType.HEAL
                and a.ap_cost <= remaining_ap
            ]
            if heals:
                attack = heals[0]
                selected.append(attack)
                remaining_ap -= attack.ap_cost
        
        # Fill with attacks
        while remaining_ap > 0:
            affordable = [
                a for a in creature.attacks 
                if a.ap_cost <= remaining_ap and a.damage > 0
            ]
            if not affordable:
                break
            
            attack = random.choice(affordable)
            selected.append(attack)
            remaining_ap -= attack.ap_cost
        
        return selected


class ControlStrategy(Strategy):
    """
    Prioritize debuffs and status effects (Skunk).
    Uses Stinky Spray early, then attacks.
    """
    
    def __init__(self):
        self.used_signature = False
    
    def select_turn_attacks(
        self, 
        creature: Creature, 
        opponent: Creature, 
        available_ap: int
    ) -> List[Attack]:
        selected: List[Attack] = []
        remaining_ap = available_ap
        
        # Use signature debuff early if not used yet
        if not self.used_signature:
            debuffs = [
                a for a in creature.attacks 
                if a.effect and a.effect.type == EffectType.DEBUFF_AP
                and a.ap_cost <= remaining_ap
            ]
            if debuffs:
                attack = debuffs[0]
                selected.append(attack)
                remaining_ap -= attack.ap_cost
                self.used_signature = True
        
        # Fill with damage attacks
        while remaining_ap > 0:
            affordable = [
                a for a in creature.attacks 
                if a.ap_cost <= remaining_ap and a.damage > 0
            ]
            if not affordable:
                break
            
            attack = random.choice(affordable)
            selected.append(attack)
            remaining_ap -= attack.ap_cost
        
        return selected


# Strategy factory
STRATEGIES = {
    "chaotic": ChaoticStrategy,
    "aggressive": AggressiveStrategy,
    "balanced": BalancedStrategy,
    "survival": SurvivalStrategy,
    "control": ControlStrategy
}


def get_strategy(strategy_name: str) -> Strategy:
    """Get a strategy instance by name"""
    cls = STRATEGIES.get(strategy_name, ChaoticStrategy)
    return cls()

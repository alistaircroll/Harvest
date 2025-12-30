"""
Data Types for Monte Carlo Combat Simulator

Dataclasses mirroring the TypeScript game types for combat simulation.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Literal
from enum import Enum


class EffectType(Enum):
    """Effect types matching the game's 144-effect taxonomy"""
    BLEED = "bleed"
    DOT = "dot"
    HEAL = "heal"
    BUFF_EVASION = "buff_evasion"
    BUFF_DEFENSE = "buff_defense"
    BUFF_SPEED = "buff_speed"
    DEBUFF_ACCURACY = "debuff_accuracy"
    DEBUFF_DEFENSE = "debuff_defense"
    DEBUFF_AP = "debuff_ap"
    DEBUFF_SPEED = "debuff_speed"
    MARK = "mark"
    EXECUTE = "execute"
    STUN = "stun"
    FREEZE = "freeze"
    SHIELD = "shield"


@dataclass
class Effect:
    """Combat effect (buff, debuff, DoT, heal, etc.)"""
    type: EffectType
    value: int
    duration: int = 1
    stacks: bool = False
    max_stacks: int = 1
    target: str = "opponent"
    description: str = ""
    
    # Condition for conditional effects (e.g., execute)
    condition: Optional[Dict] = None


@dataclass
class Attack:
    """Attack definition"""
    id: str
    name: str
    ap_cost: int
    damage: int
    speed: int
    effect: Optional[Effect] = None
    description: str = ""
    category: str = "basic"
    tags: List[str] = field(default_factory=list)
    requires_both_legs: bool = False


@dataclass
class BodyPart:
    """Body part with stats and attacks"""
    id: str
    part_type: str  # head, torso, arm, leg, tail
    animal_type: str  # rat, squirrel, cat, dog, skunk
    hp_bonus: int = 0
    defense: int = 0
    speed_bonus: int = 0
    attacks: List[str] = field(default_factory=list)  # Attack IDs
    rarity: str = "common"
    biomes: List[str] = field(default_factory=list)


@dataclass
class ActiveEffect:
    """Active effect on a creature during combat"""
    effect: Effect
    remaining_turns: int
    stacks: int = 1
    source: str = ""  # ID of attack that applied this


@dataclass
class Creature:
    """Base creature (player or wild) for combat simulation"""
    name: str
    max_hp: int
    current_hp: int
    defense: int
    speed_bonus: int
    ap_per_turn: int
    attacks: List[Attack]
    active_effects: List[ActiveEffect] = field(default_factory=list)
    
    def clone(self) -> 'Creature':
        """Create a deep copy for simulation"""
        return Creature(
            name=self.name,
            max_hp=self.max_hp,
            current_hp=self.current_hp,
            defense=self.defense,
            speed_bonus=self.speed_bonus,
            ap_per_turn=self.ap_per_turn,
            attacks=self.attacks.copy(),
            active_effects=[]  # Fresh effects for new simulation
        )
    
    @property
    def is_dead(self) -> bool:
        return self.current_hp <= 0
    
    def take_damage(self, amount: int) -> int:
        """Apply damage after defense, return actual damage taken"""
        effective_damage = max(0, amount - self.defense)
        self.current_hp = max(0, self.current_hp - effective_damage)
        return effective_damage
    
    def heal(self, amount: int) -> int:
        """Heal HP, return actual amount healed"""
        old_hp = self.current_hp
        self.current_hp = min(self.max_hp, self.current_hp + amount)
        return self.current_hp - old_hp


@dataclass
class WildCreatureDefinition:
    """Wild creature template for spawning"""
    type: str  # rat, squirrel, cat, dog, skunk
    total_hp: int
    defense: int
    ap_per_turn: int
    attacks: List[Attack]
    strategy: str = "chaotic"  # Strategy name


# Strategy type for type hints
StrategyType = Literal["chaotic", "aggressive", "balanced", "survival", "control"]


@dataclass
class BattleResult:
    """Result of a single simulated battle"""
    winner: str  # "player" or "enemy"
    turns: int
    player_hp_remaining: int
    enemy_hp_remaining: int
    player_damage_dealt: int = 0
    enemy_damage_dealt: int = 0


@dataclass
class SimulationStats:
    """Aggregate statistics from multiple simulations"""
    total_battles: int
    player_wins: int
    enemy_wins: int
    avg_turns: float
    avg_player_hp_remaining: float
    avg_enemy_hp_remaining: float
    win_rate: float
    
    # Confidence interval (95%)
    win_rate_low: float = 0.0
    win_rate_high: float = 0.0

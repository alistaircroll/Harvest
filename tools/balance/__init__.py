"""
Monte Carlo Combat Balance Simulator

Package for simulating combat and auto-tuning creature stats.
"""

from .types import (
    Attack, Effect, EffectType, BodyPart, Creature,
    BattleResult, SimulationStats, ActiveEffect
)
from .data_loader import (
    load_attacks, load_body_parts,
    create_player_creature, create_wild_creature,
    get_creature_strategy
)

__all__ = [
    # Types
    'Attack', 'Effect', 'EffectType', 'BodyPart', 'Creature',
    'BattleResult', 'SimulationStats', 'ActiveEffect',
    # Data loading
    'load_attacks', 'load_body_parts',
    'create_player_creature', 'create_wild_creature',
    'get_creature_strategy'
]

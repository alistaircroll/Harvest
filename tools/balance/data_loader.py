"""
Data Loader for Monte Carlo Combat Simulator

Loads game data from JSON files and converts to Python dataclasses.
"""

import json
from pathlib import Path
from typing import Dict, List, Optional

from .types import (
    Attack, Effect, EffectType, BodyPart, 
    Creature, WildCreatureDefinition
)


# Path to game data directory
DATA_DIR = Path(__file__).parent.parent.parent / "src" / "data" / "game-data"


def load_json(filename: str) -> dict:
    """Load a JSON file from the data directory"""
    filepath = DATA_DIR / filename
    with open(filepath, 'r') as f:
        return json.load(f)


def parse_effect(effect_data: Optional[dict]) -> Optional[Effect]:
    """Parse effect data from JSON to Effect dataclass"""
    if effect_data is None:
        return None
    
    try:
        effect_type = EffectType(effect_data.get("type", "dot"))
    except ValueError:
        # Unknown effect type, default to DOT
        effect_type = EffectType.DOT
    
    return Effect(
        type=effect_type,
        value=effect_data.get("value", 0),
        duration=effect_data.get("duration", 1),
        stacks=effect_data.get("stacks", False),
        max_stacks=effect_data.get("maxStacks", 1),
        target=effect_data.get("target", "opponent"),
        description=effect_data.get("description", ""),
        condition=effect_data.get("condition")
    )


def load_attacks() -> Dict[str, Attack]:
    """Load all attacks from attacks.json"""
    data = load_json("attacks.json")
    attacks = {}
    
    for attack_id, attack_data in data.get("attacks", {}).items():
        attacks[attack_id] = Attack(
            id=attack_id,
            name=attack_data.get("name", attack_id),
            ap_cost=attack_data.get("apCost", 1),
            damage=attack_data.get("damage", 0),
            speed=attack_data.get("speed", 50),
            effect=parse_effect(attack_data.get("effect")),
            description=attack_data.get("description", ""),
            category=attack_data.get("category", "basic"),
            tags=attack_data.get("tags", []),
            requires_both_legs=attack_data.get("requiresBothLegs", False)
        )
    
    return attacks


def load_body_parts() -> Dict[str, Dict[str, BodyPart]]:
    """
    Load all body parts from body-parts.json
    
    Returns: Dict[part_type, Dict[animal_type, BodyPart]]
    """
    data = load_json("body-parts.json")
    parts: Dict[str, Dict[str, BodyPart]] = {}
    
    for part_category, animals in data.get("bodyParts", {}).items():
        # Convert plural to singular (e.g., "heads" -> "head")
        part_type = part_category.rstrip('s')
        parts[part_type] = {}
        
        for animal_type, part_data in animals.items():
            parts[part_type][animal_type] = BodyPart(
                id=part_data.get("id", f"{animal_type}_{part_type}"),
                part_type=part_type,
                animal_type=animal_type,
                hp_bonus=part_data.get("hpBonus", 0),
                defense=part_data.get("defense", 0),
                speed_bonus=part_data.get("speedBonus", 0),
                attacks=part_data.get("attacks", []),
                rarity=part_data.get("rarity", "common"),
                biomes=part_data.get("biomes", [])
            )
    
    return parts


def create_player_creature(
    attacks_db: Dict[str, Attack],
    parts_db: Dict[str, Dict[str, BodyPart]],
    parts_config: Optional[Dict[str, str]] = None,
    missing_limbs: int = 0
) -> Creature:
    """
    Create a player creature for simulation.
    
    Args:
        attacks_db: All attacks loaded from JSON
        parts_db: All body parts loaded from JSON
        parts_config: Dict mapping part_type to animal_type (default: all rat)
        missing_limbs: Number of limbs to remove (0-4)
    
    Returns:
        Creature ready for combat simulation
    """
    # Default to full rat creature
    if parts_config is None:
        parts_config = {
            "head": "rat",
            "torso": "rat",
            "arm": "rat",
            "leg": "rat",
            "tail": "rat"
        }
    
    # Collect stats
    total_hp = 0
    total_defense = 0
    speed_bonus = 0
    creature_attacks: List[Attack] = []
    
    # Determine which limbs are equipped
    equipped_parts = list(parts_config.keys())
    
    # Remove limbs if specified (arms, legs, tail can be removed)
    removable = ["arm", "leg", "tail"]
    limbs_removed = 0
    for part_type in list(removable):
        if limbs_removed >= missing_limbs:
            break
        if part_type in equipped_parts:
            equipped_parts.remove(part_type)
            limbs_removed += 1
    
    for part_type, animal_type in parts_config.items():
        if part_type not in equipped_parts:
            continue
            
        part = parts_db.get(part_type, {}).get(animal_type)
        if part is None:
            continue
        
        total_hp += part.hp_bonus
        total_defense += part.defense
        speed_bonus += part.speed_bonus
        
        # Resolve attack IDs to Attack objects
        for attack_id in part.attacks:
            if attack_id in attacks_db:
                creature_attacks.append(attacks_db[attack_id])
    
    return Creature(
        name="Player",
        max_hp=total_hp,
        current_hp=total_hp,
        defense=total_defense,
        speed_bonus=speed_bonus,
        ap_per_turn=6,  # Player always has 6 AP
        attacks=creature_attacks
    )


def create_wild_creature(
    creature_type: str,
    attacks_db: Dict[str, Attack],
    hp_override: Optional[int] = None,
    defense_override: Optional[int] = None,
    ap_override: Optional[int] = None
) -> Creature:
    """
    Create a wild creature for simulation.
    
    Uses hardcoded definitions matching wildCreatures.ts.
    Overrides allow for autotuning.
    """
    # Wild creature definitions (from wildCreatures.ts)
    definitions = {
        "rat": {
            "hp": 40,
            "defense": 0,
            "ap": 4,
            "attacks": ["nibble", "scratch", "kick", "tail_whip"],
            "strategy": "chaotic"
        },
        "squirrel": {
            "hp": 45,
            "defense": 1,
            "ap": 5,
            "attacks": ["chitter", "scratch_squirrel", "kick_squirrel", "climb_a_tree"],
            "strategy": "balanced"
        },
        "cat": {
            "hp": 55,
            "defense": 1,
            "ap": 5,
            "attacks": ["bite", "swipe", "cat_scratch_fever", "pounce"],
            "strategy": "aggressive"
        },
        "dog": {
            "hp": 65,
            "defense": 3,
            "ap": 5,
            "attacks": ["bite_dog", "paw_slap", "kick_dog", "lick_it_better"],
            "strategy": "survival"
        },
        "skunk": {
            "hp": 55,
            "defense": 3,
            "ap": 5,
            "attacks": ["bite_skunk", "claw", "kick", "stinky_spray"],
            "strategy": "control"
        }
    }
    
    defn = definitions.get(creature_type)
    if defn is None:
        raise ValueError(f"Unknown creature type: {creature_type}")
    
    # Resolve attacks
    creature_attacks = []
    for attack_id in defn["attacks"]:
        if attack_id in attacks_db:
            creature_attacks.append(attacks_db[attack_id])
    
    hp = hp_override if hp_override is not None else defn["hp"]
    defense = defense_override if defense_override is not None else defn["defense"]
    ap = ap_override if ap_override is not None else defn["ap"]
    
    return Creature(
        name=creature_type.capitalize(),
        max_hp=hp,
        current_hp=hp,
        defense=defense,
        speed_bonus=0,  # Wild creatures don't have speed bonus
        ap_per_turn=ap,
        attacks=creature_attacks
    )


# Strategy assignments for wild creatures
CREATURE_STRATEGIES = {
    "rat": "chaotic",
    "squirrel": "balanced",
    "cat": "aggressive",
    "dog": "survival",
    "skunk": "control"
}


def get_creature_strategy(creature_type: str) -> str:
    """Get the strategy type for a wild creature"""
    return CREATURE_STRATEGIES.get(creature_type, "chaotic")

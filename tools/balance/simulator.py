"""
Monte Carlo Simulation Runner

Runs N simulations and collects statistics.
"""

import math
from typing import Dict, Optional
from dataclasses import dataclass

from .types import Creature, SimulationStats, BattleResult
from .battle_engine import simulate_battle
from .strategies import Strategy, get_strategy
from .data_loader import get_creature_strategy


def run_simulations(
    player: Creature,
    enemy: Creature,
    n: int = 1000,
    player_strategy: Optional[Strategy] = None,
    enemy_strategy: Optional[Strategy] = None,
    enemy_type: str = "rat"
) -> SimulationStats:
    """
    Run N simulated battles and collect statistics.
    
    Args:
        player: Player creature template
        enemy: Enemy creature template
        n: Number of simulations to run
        player_strategy: Strategy for player (default: aggressive)
        enemy_strategy: Strategy for enemy (default: based on type)
        enemy_type: Enemy creature type (for strategy lookup)
    
    Returns:
        SimulationStats with aggregate results
    """
    # Default strategies
    if player_strategy is None:
        player_strategy = get_strategy("aggressive")
    
    if enemy_strategy is None:
        strategy_name = get_creature_strategy(enemy_type)
        enemy_strategy = get_strategy(strategy_name)
    
    # Run simulations
    results: list[BattleResult] = []
    player_wins = 0
    
    for _ in range(n):
        # Clone creatures for fresh state
        p = player.clone()
        e = enemy.clone()
        
        # Reset strategy state
        if hasattr(enemy_strategy, 'used_signature'):
            enemy_strategy.used_signature = False
        
        result = simulate_battle(p, e, player_strategy, enemy_strategy)
        results.append(result)
        
        if result.winner == "player":
            player_wins += 1
    
    # Calculate statistics
    win_rate = player_wins / n
    enemy_wins = n - player_wins
    
    avg_turns = sum(r.turns for r in results) / n
    
    # Average HP remaining for winners
    player_win_results = [r for r in results if r.winner == "player"]
    enemy_win_results = [r for r in results if r.winner == "enemy"]
    
    avg_player_hp = (
        sum(r.player_hp_remaining for r in player_win_results) / len(player_win_results)
        if player_win_results else 0
    )
    avg_enemy_hp = (
        sum(r.enemy_hp_remaining for r in enemy_win_results) / len(enemy_win_results)
        if enemy_win_results else 0
    )
    
    # 95% confidence interval for win rate
    # Using Wilson score interval for better accuracy with extreme rates
    z = 1.96  # 95% confidence
    denominator = 1 + z**2 / n
    center = (win_rate + z**2 / (2*n)) / denominator
    spread = z * math.sqrt((win_rate * (1 - win_rate) + z**2 / (4*n)) / n) / denominator
    
    return SimulationStats(
        total_battles=n,
        player_wins=player_wins,
        enemy_wins=enemy_wins,
        avg_turns=avg_turns,
        avg_player_hp_remaining=avg_player_hp,
        avg_enemy_hp_remaining=avg_enemy_hp,
        win_rate=win_rate,
        win_rate_low=max(0, center - spread),
        win_rate_high=min(1, center + spread)
    )


def run_full_matchup_grid(
    attacks_db: dict,
    parts_db: dict,
    n_per_matchup: int = 1000
) -> Dict[str, Dict[str, SimulationStats]]:
    """
    Run simulations for all player vs enemy matchups.
    
    Returns:
        Dict[enemy_type, Dict[player_config, SimulationStats]]
    """
    from .data_loader import create_player_creature, create_wild_creature
    
    enemy_types = ["rat", "squirrel", "cat", "dog", "skunk"]
    player_configs = [
        ("full", 0),
        ("missing_1", 1),
        ("missing_2", 2),
    ]
    
    results: Dict[str, Dict[str, SimulationStats]] = {}
    
    for enemy_type in enemy_types:
        results[enemy_type] = {}
        
        for config_name, missing_limbs in player_configs:
            player = create_player_creature(
                attacks_db, parts_db, 
                missing_limbs=missing_limbs
            )
            enemy = create_wild_creature(enemy_type, attacks_db)
            
            stats = run_simulations(
                player, enemy,
                n=n_per_matchup,
                enemy_type=enemy_type
            )
            
            results[enemy_type][config_name] = stats
    
    return results


def print_matchup_report(
    grid: Dict[str, Dict[str, SimulationStats]]
) -> None:
    """Print a formatted report of matchup results"""
    print("\n" + "="*70)
    print("MONTE CARLO BALANCE REPORT")
    print("="*70)
    
    for enemy_type, configs in grid.items():
        print(f"\n--- vs {enemy_type.upper()} ---")
        for config_name, stats in configs.items():
            ci = f"[{stats.win_rate_low:.1%} - {stats.win_rate_high:.1%}]"
            print(
                f"  {config_name:12} | "
                f"Win Rate: {stats.win_rate:5.1%} {ci} | "
                f"Avg Turns: {stats.avg_turns:.1f}"
            )


def run_mirror_matches(
    attacks_db: dict,
    n_per_matchup: int = 500
) -> Dict[str, SimulationStats]:
    """
    Run mirror match simulations (creature vs itself).
    Target: ~50% win rate for balanced creatures.
    """
    from .data_loader import create_wild_creature
    
    creature_types = ["rat", "squirrel", "cat", "dog", "skunk"]
    results: Dict[str, SimulationStats] = {}
    
    for creature_type in creature_types:
        # Create two copies of the same creature
        c1 = create_wild_creature(creature_type, attacks_db)
        c2 = create_wild_creature(creature_type, attacks_db)
        
        # Both use the same strategy (fair fight)
        strategy_name = get_creature_strategy(creature_type)
        
        stats = run_simulations(
            c1, c2,
            n=n_per_matchup,
            enemy_type=creature_type  # Use same strategy for both
        )
        
        results[creature_type] = stats
    
    return results


def print_mirror_report(results: Dict[str, SimulationStats]) -> None:
    """Print mirror match results"""
    print("\n" + "="*70)
    print("MIRROR MATCH REPORT (Target: ~50%)")
    print("="*70)
    
    for creature_type, stats in results.items():
        ci = f"[{stats.win_rate_low:.1%} - {stats.win_rate_high:.1%}]"
        # Check if within acceptable range (40-60%)
        status = "✓" if 0.4 <= stats.win_rate <= 0.6 else "✗"
        print(
            f"  {creature_type:10} vs {creature_type:10} | "
            f"Win Rate: {stats.win_rate:5.1%} {ci} | {status}"
        )


# Progression paths - representative upgrade sequences
PROGRESSION_PATHS = {
    "aggressive": [
        # Start with rat, upgrade for damage
        {"head": "rat", "torso": "rat", "arm": "rat", "leg": "rat", "tail": "rat"},
        {"head": "rat", "torso": "rat", "arm": "cat", "leg": "rat", "tail": "rat"},  # Get cat arm (CSF)
        {"head": "cat", "torso": "rat", "arm": "cat", "leg": "rat", "tail": "rat"},  # Cat head (bite)
        {"head": "cat", "torso": "cat", "arm": "cat", "leg": "cat", "tail": "rat"},  # Full cat offensive
        {"head": "cat", "torso": "dog", "arm": "cat", "leg": "cat", "tail": "cat"},  # Dog torso for HP
    ],
    "defensive": [
        # Start with rat, upgrade for survivability
        {"head": "rat", "torso": "rat", "arm": "rat", "leg": "rat", "tail": "rat"},
        {"head": "rat", "torso": "squirrel", "arm": "rat", "leg": "rat", "tail": "rat"},  # More HP
        {"head": "dog", "torso": "squirrel", "arm": "rat", "leg": "rat", "tail": "rat"},  # Heal
        {"head": "dog", "torso": "dog", "arm": "dog", "leg": "rat", "tail": "rat"},  # Tank build
        {"head": "dog", "torso": "dog", "arm": "dog", "leg": "squirrel", "tail": "dog"},  # Full tank
    ],
    "control": [
        # Start with rat, get debuffs
        {"head": "rat", "torso": "rat", "arm": "rat", "leg": "rat", "tail": "rat"},
        {"head": "rat", "torso": "rat", "arm": "rat", "leg": "rat", "tail": "skunk"},  # Stinky Spray
        {"head": "skunk", "torso": "rat", "arm": "rat", "leg": "rat", "tail": "skunk"},  # Skunk head
        {"head": "skunk", "torso": "skunk", "arm": "skunk", "leg": "rat", "tail": "skunk"},  # More defense
        {"head": "skunk", "torso": "dog", "arm": "cat", "leg": "cat", "tail": "skunk"},  # Hybrid
    ],
}


def run_progression_test(
    attacks_db: dict,
    parts_db: dict,
    path_name: str = "aggressive",
    n_per_matchup: int = 200
) -> Dict[str, Dict[int, SimulationStats]]:
    """
    Test a progression path against all enemies.
    
    Returns: Dict[enemy_type, Dict[progression_step, SimulationStats]]
    """
    from .data_loader import create_player_creature, create_wild_creature
    
    path = PROGRESSION_PATHS.get(path_name, PROGRESSION_PATHS["aggressive"])
    enemy_types = ["rat", "squirrel", "cat", "dog", "skunk"]
    
    results: Dict[str, Dict[int, SimulationStats]] = {}
    
    for enemy_type in enemy_types:
        results[enemy_type] = {}
        enemy = create_wild_creature(enemy_type, attacks_db)
        
        for step, parts_config in enumerate(path):
            player = create_player_creature(attacks_db, parts_db, parts_config)
            
            stats = run_simulations(
                player, enemy,
                n=n_per_matchup,
                enemy_type=enemy_type
            )
            
            results[enemy_type][step] = stats
    
    return results


def print_progression_report(
    results: Dict[str, Dict[int, SimulationStats]],
    path_name: str
) -> None:
    """Print progression test results"""
    print("\n" + "="*70)
    print(f"PROGRESSION PATH: {path_name.upper()}")
    print("="*70)
    
    # Get number of steps
    first_enemy = list(results.keys())[0]
    num_steps = len(results[first_enemy])
    
    # Print header
    header = "Step  | " + " | ".join(f"{t:^8}" for t in results.keys())
    print(header)
    print("-" * len(header))
    
    for step in range(num_steps):
        row = f"  {step}   | "
        for enemy_type in results.keys():
            stats = results[enemy_type][step]
            row += f"{stats.win_rate:>6.0%}   | "
        print(row)

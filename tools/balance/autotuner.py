"""
Autotuner for Monte Carlo Combat Balance

Uses differential evolution to optimize wild creature parameters
until simulated win rates match target values.
"""

import json
import time
from pathlib import Path
from typing import Dict, List, Tuple, Callable
from dataclasses import dataclass, field

try:
    from scipy.optimize import differential_evolution, OptimizeResult
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False
    print("Warning: scipy not installed. Install with: pip install scipy")

from .types import Creature, SimulationStats
from .data_loader import load_attacks, load_body_parts, create_player_creature
from .simulator import run_simulations
from .strategies import get_strategy


# Target win rates: Dict[enemy_type, Dict[player_config, target_rate]]
WIN_RATE_TARGETS = {
    "rat": {
        "full": 0.90,       # 90% win vs rat with full creature
        "missing_1": 0.75,  # 75% with 1 limb missing
        "missing_2": 0.50,  # 50% with 2 limbs missing
    },
    "squirrel": {
        "full": 0.75,
        "missing_1": 0.60,
        "missing_2": 0.40,
    },
    "cat": {
        "full": 0.55,
        "missing_1": 0.40,
        "missing_2": 0.25,
    },
    "dog": {
        "full": 0.40,
        "missing_1": 0.25,
        "missing_2": 0.15,
    },
    "skunk": {
        "full": 0.50,
        "missing_1": 0.35,
        "missing_2": 0.20,
    },
}

# Parameter bounds for each creature
# Format: (min, max) for each parameter
PARAM_BOUNDS = {
    "hp": (25, 100),
    "defense": (0, 5),
    "ap": (3, 7),
}

# Parameters to tune per creature
TUNABLE_PARAMS = ["hp", "defense", "ap"]


@dataclass
class TuningResult:
    """Result of autotuning"""
    creature_type: str
    original_params: Dict[str, float]
    tuned_params: Dict[str, float]
    original_fitness: float
    tuned_fitness: float
    iterations: int
    elapsed_time: float


def create_tuned_creature(
    creature_type: str,
    params: Dict[str, float],
    attacks_db: dict
) -> Creature:
    """Create a wild creature with tuned parameters"""
    from .data_loader import create_wild_creature
    
    return create_wild_creature(
        creature_type, 
        attacks_db,
        hp_override=int(params.get("hp")),
        defense_override=int(params.get("defense")),
        ap_override=int(params.get("ap"))
    )


def evaluate_creature_fitness(
    creature_type: str,
    params: Dict[str, float],
    attacks_db: dict,
    parts_db: dict,
    sims_per_matchup: int = 100
) -> float:
    """
    Evaluate fitness of a creature configuration.
    
    Returns: Total squared error from target win rates (lower is better)
    """
    targets = WIN_RATE_TARGETS.get(creature_type, {})
    if not targets:
        return float('inf')
    
    total_error = 0.0
    
    # Test against each player configuration
    configs = [
        ("full", 0),
        ("missing_1", 1),
        ("missing_2", 2),
    ]
    
    for config_name, missing_limbs in configs:
        target_rate = targets.get(config_name, 0.5)
        
        # Create player and enemy
        player = create_player_creature(
            attacks_db, parts_db, 
            missing_limbs=missing_limbs
        )
        enemy = create_tuned_creature(creature_type, params, attacks_db)
        
        # Run simulations
        stats = run_simulations(
            player, enemy,
            n=sims_per_matchup,
            enemy_type=creature_type
        )
        
        # Calculate squared error
        error = (stats.win_rate - target_rate) ** 2
        total_error += error
    
    return total_error


def params_to_vector(params: Dict[str, float]) -> List[float]:
    """Convert parameter dict to optimization vector"""
    return [params[k] for k in TUNABLE_PARAMS]


def vector_to_params(vector: List[float]) -> Dict[str, float]:
    """Convert optimization vector to parameter dict"""
    return {k: v for k, v in zip(TUNABLE_PARAMS, vector)}


def get_original_params(creature_type: str) -> Dict[str, float]:
    """Get original parameters for a creature from wildCreatures.ts"""
    # Hardcoded from wildCreatures.ts
    original = {
        "rat": {"hp": 40, "defense": 0, "ap": 4},
        "squirrel": {"hp": 45, "defense": 1, "ap": 5},
        "cat": {"hp": 55, "defense": 1, "ap": 5},
        "dog": {"hp": 65, "defense": 3, "ap": 5},
        "skunk": {"hp": 55, "defense": 3, "ap": 5},
    }
    return original.get(creature_type, {"hp": 50, "defense": 1, "ap": 5})


def tune_creature(
    creature_type: str,
    attacks_db: dict,
    parts_db: dict,
    sims_per_matchup: int = 100,
    max_iterations: int = 50,
    verbose: bool = True
) -> TuningResult:
    """
    Tune a single creature's parameters to match target win rates.
    
    Uses differential evolution for gradient-free optimization.
    """
    if not HAS_SCIPY:
        raise RuntimeError("scipy is required for autotuning. Install with: pip install scipy")
    
    original_params = get_original_params(creature_type)
    
    # Calculate original fitness
    original_fitness = evaluate_creature_fitness(
        creature_type, original_params, attacks_db, parts_db, sims_per_matchup
    )
    
    if verbose:
        print(f"\n{'='*50}")
        print(f"Tuning {creature_type.upper()}")
        print(f"{'='*50}")
        print(f"Original: HP={original_params['hp']}, Def={original_params['defense']}, AP={original_params['ap']}")
        print(f"Original fitness (lower is better): {original_fitness:.4f}")
    
    # Define bounds for optimization
    bounds = [PARAM_BOUNDS[k] for k in TUNABLE_PARAMS]
    
    # Track best result
    best_fitness = original_fitness
    best_params = original_params.copy()
    
    start_time = time.time()
    
    # Optimization callback
    iteration_count = [0]
    
    def callback(xk, convergence=None):
        iteration_count[0] += 1
        if verbose and iteration_count[0] % 5 == 0:
            params = vector_to_params(xk)
            print(f"  Iteration {iteration_count[0]}: HP={int(params['hp'])}, Def={int(params['defense'])}, AP={int(params['ap'])}")
    
    # Objective function
    def objective(vector: List[float]) -> float:
        params = vector_to_params(vector)
        # Round to integers for actual use
        params = {k: round(v) for k, v in params.items()}
        return evaluate_creature_fitness(
            creature_type, params, attacks_db, parts_db, sims_per_matchup
        )
    
    # Run differential evolution
    result: OptimizeResult = differential_evolution(
        objective,
        bounds=bounds,
        maxiter=max_iterations,
        seed=42,
        polish=False,
        callback=callback,
        workers=1,  # Single-threaded for reproducibility
        tol=0.01,
        atol=0.001,
        updating='deferred',
        disp=False
    )
    
    elapsed = time.time() - start_time
    
    # Get tuned parameters
    tuned_params = vector_to_params(result.x)
    tuned_params = {k: round(v) for k, v in tuned_params.items()}
    tuned_fitness = result.fun
    
    if verbose:
        print(f"\nTuned: HP={tuned_params['hp']}, Def={tuned_params['defense']}, AP={tuned_params['ap']}")
        print(f"Tuned fitness: {tuned_fitness:.4f} (was {original_fitness:.4f})")
        print(f"Elapsed: {elapsed:.1f}s, Iterations: {iteration_count[0]}")
    
    return TuningResult(
        creature_type=creature_type,
        original_params=original_params,
        tuned_params=tuned_params,
        original_fitness=original_fitness,
        tuned_fitness=tuned_fitness,
        iterations=iteration_count[0],
        elapsed_time=elapsed
    )


def tune_all_creatures(
    sims_per_matchup: int = 100,
    max_iterations: int = 50,
    verbose: bool = True
) -> Dict[str, TuningResult]:
    """Tune all wild creatures"""
    attacks = load_attacks()
    parts = load_body_parts()
    
    results = {}
    
    for creature_type in WIN_RATE_TARGETS.keys():
        result = tune_creature(
            creature_type,
            attacks,
            parts,
            sims_per_matchup=sims_per_matchup,
            max_iterations=max_iterations,
            verbose=verbose
        )
        results[creature_type] = result
    
    return results


def export_tuned_params(
    results: Dict[str, TuningResult],
    output_path: str = "tuned_creatures.json"
) -> None:
    """Export tuned parameters to JSON file"""
    output = {
        "version": "1.0.0",
        "tuned_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "creatures": {}
    }
    
    for creature_type, result in results.items():
        output["creatures"][creature_type] = {
            "original": result.original_params,
            "tuned": result.tuned_params,
            "fitness_improvement": result.original_fitness - result.tuned_fitness
        }
    
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\nExported tuned parameters to: {output_path}")


def print_tuning_summary(results: Dict[str, TuningResult]) -> None:
    """Print a summary of tuning results"""
    print("\n" + "="*70)
    print("AUTOTUNING SUMMARY")
    print("="*70)
    
    print("\n{:10} | {:>12} | {:>12} | {:>10}".format(
        "Creature", "Original", "Tuned", "Fitness Δ"
    ))
    print("-" * 50)
    
    for creature_type, result in results.items():
        orig = f"HP{result.original_params['hp']}/D{result.original_params['defense']}/AP{result.original_params['ap']}"
        tuned = f"HP{result.tuned_params['hp']}/D{result.tuned_params['defense']}/AP{result.tuned_params['ap']}"
        delta = result.original_fitness - result.tuned_fitness
        sign = "+" if delta > 0 else ""
        
        print(f"{creature_type:10} | {orig:>12} | {tuned:>12} | {sign}{delta:>9.4f}")
    
    print("\n" + "="*70)
    print("To apply these changes, update src/data/wildCreatures.ts")
    print("="*70)

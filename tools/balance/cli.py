"""
CLI for Monte Carlo Combat Balance Simulator

Usage:
    python -m tools.balance.cli simulate          Run simulations
    python -m tools.balance.cli simulate --enemy rat
    python -m tools.balance.cli grid              Run full matchup grid
    python -m tools.balance.cli tune              Run autotuner (WIP)
"""

import argparse
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from tools.balance.data_loader import (
    load_attacks, load_body_parts,
    create_player_creature, create_wild_creature
)
from tools.balance.simulator import (
    run_simulations, run_full_matchup_grid, print_matchup_report
)
from tools.balance.strategies import get_strategy


def cmd_simulate(args):
    """Run simulations against a specific enemy"""
    # Apply variance setting
    import tools.balance.battle_engine as engine
    engine.INITIATIVE_VARIANCE = args.variance
    
    print(f"Loading game data...")
    attacks = load_attacks()
    parts = load_body_parts()
    
    print(f"Creating creatures...")
    player = create_player_creature(
        attacks, parts,
        missing_limbs=args.missing_limbs
    )
    enemy = create_wild_creature(args.enemy, attacks)
    
    print(f"\nPlayer: {player.max_hp} HP, {len(player.attacks)} attacks")
    print(f"Enemy ({args.enemy}): {enemy.max_hp} HP, {len(enemy.attacks)} attacks")
    print(f"Initiative variance: 0-{args.variance}")
    
    print(f"\nRunning {args.n} simulations...")
    stats = run_simulations(
        player, enemy,
        n=args.n,
        enemy_type=args.enemy
    )
    
    print(f"\n{'='*50}")
    print(f"RESULTS: Player vs {args.enemy.upper()}")
    print(f"{'='*50}")
    print(f"Battles:    {stats.total_battles}")
    print(f"Player Wins: {stats.player_wins} ({stats.win_rate:.1%})")
    print(f"Enemy Wins:  {stats.enemy_wins}")
    print(f"Avg Turns:   {stats.avg_turns:.1f}")
    print(f"95% CI:      [{stats.win_rate_low:.1%} - {stats.win_rate_high:.1%}]")
    
    if stats.player_wins > 0:
        print(f"Avg HP (win): {stats.avg_player_hp_remaining:.1f}")


def cmd_grid(args):
    """Run full matchup grid"""
    # Apply variance setting
    import tools.balance.battle_engine as engine
    engine.INITIATIVE_VARIANCE = args.variance
    
    print("Loading game data...")
    attacks = load_attacks()
    parts = load_body_parts()
    
    print(f"Running {args.n} simulations per matchup (variance: 0-{args.variance})...")
    print("This may take a moment...")
    
    grid = run_full_matchup_grid(attacks, parts, n_per_matchup=args.n)
    print_matchup_report(grid)


def cmd_tune(args):
    """Run autotuner to optimize creature parameters"""
    import tools.balance.battle_engine as engine
    engine.INITIATIVE_VARIANCE = args.variance
    
    print("="*60)
    print("MONTE CARLO AUTOTUNER")
    print("="*60)
    print(f"Simulations per matchup: {args.sims}")
    print(f"Max iterations: {args.iterations}")
    print(f"Initiative variance: 0-{args.variance}")
    
    try:
        from tools.balance.autotuner import (
            tune_all_creatures, export_tuned_params, print_tuning_summary
        )
    except ImportError as e:
        print(f"Error importing autotuner: {e}")
        print("Make sure scipy is installed: pip install scipy")
        return
    
    if args.creature:
        # Tune single creature
        from tools.balance.autotuner import tune_creature
        from tools.balance.data_loader import load_attacks, load_body_parts
        
        attacks = load_attacks()
        parts = load_body_parts()
        
        result = tune_creature(
            args.creature,
            attacks, parts,
            sims_per_matchup=args.sims,
            max_iterations=args.iterations,
            verbose=True
        )
        
        results = {args.creature: result}
    else:
        # Tune all creatures
        results = tune_all_creatures(
            sims_per_matchup=args.sims,
            max_iterations=args.iterations,
            verbose=True
        )
    
    print_tuning_summary(results)
    
    if args.output:
        export_tuned_params(results, args.output)


def cmd_mirror(args):
    """Run mirror match tests (creature vs itself)"""
    import tools.balance.battle_engine as engine
    engine.INITIATIVE_VARIANCE = args.variance
    
    print("Loading game data...")
    attacks = load_attacks()
    
    print(f"Running mirror matches ({args.n} sims each, variance: 0-{args.variance})...")
    
    from tools.balance.simulator import run_mirror_matches, print_mirror_report
    results = run_mirror_matches(attacks, n_per_matchup=args.n)
    print_mirror_report(results)


def cmd_progression(args):
    """Test progression paths"""
    import tools.balance.battle_engine as engine
    engine.INITIATIVE_VARIANCE = args.variance
    
    print("Loading game data...")
    attacks = load_attacks()
    parts = load_body_parts()
    
    print(f"Running progression test: {args.path} ({args.n} sims each)...")
    
    from tools.balance.simulator import (
        run_progression_test, print_progression_report, PROGRESSION_PATHS
    )
    
    if args.path not in PROGRESSION_PATHS:
        print(f"Unknown path. Available: {list(PROGRESSION_PATHS.keys())}")
        return
    
    results = run_progression_test(attacks, parts, args.path, n_per_matchup=args.n)
    print_progression_report(results, args.path)


def main():
    parser = argparse.ArgumentParser(
        description="Monte Carlo Combat Balance Simulator"
    )
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Simulate command
    sim_parser = subparsers.add_parser("simulate", help="Run simulations")
    sim_parser.add_argument(
        "--enemy", "-e",
        choices=["rat", "squirrel", "cat", "dog", "skunk"],
        default="rat",
        help="Enemy creature type"
    )
    sim_parser.add_argument(
        "--missing-limbs", "-m",
        type=int, default=0,
        help="Number of limbs player is missing (0-4)"
    )
    sim_parser.add_argument(
        "-n", type=int, default=1000,
        help="Number of simulations to run"
    )
    sim_parser.add_argument(
        "--variance", "-v",
        type=int, default=10,
        help="Initiative variance width (default: 10, meaning 0-10 random)"
    )
    sim_parser.set_defaults(func=cmd_simulate)
    
    # Grid command
    grid_parser = subparsers.add_parser("grid", help="Run full matchup grid")
    grid_parser.add_argument(
        "-n", type=int, default=500,
        help="Simulations per matchup"
    )
    grid_parser.add_argument(
        "--variance", "-v",
        type=int, default=10,
        help="Initiative variance width (default: 10)"
    )
    grid_parser.set_defaults(func=cmd_grid)
    
    # Tune command
    tune_parser = subparsers.add_parser("tune", help="Run autotuner")
    tune_parser.add_argument(
        "--creature", "-c",
        choices=["rat", "squirrel", "cat", "dog", "skunk"],
        default=None,
        help="Tune single creature (default: all)"
    )
    tune_parser.add_argument(
        "--sims", "-s",
        type=int, default=100,
        help="Simulations per matchup (default: 100)"
    )
    tune_parser.add_argument(
        "--iterations", "-i",
        type=int, default=30,
        help="Max optimization iterations (default: 30)"
    )
    tune_parser.add_argument(
        "--variance", "-v",
        type=int, default=10,
        help="Initiative variance width"
    )
    tune_parser.add_argument(
        "--output", "-o",
        type=str, default=None,
        help="Output JSON file for tuned parameters"
    )
    tune_parser.set_defaults(func=cmd_tune)
    
    # Mirror match command
    mirror_parser = subparsers.add_parser("mirror", help="Run mirror match tests")
    mirror_parser.add_argument(
        "-n", type=int, default=500,
        help="Simulations per matchup"
    )
    mirror_parser.add_argument(
        "--variance", "-v",
        type=int, default=10,
        help="Initiative variance width"
    )
    mirror_parser.set_defaults(func=cmd_mirror)
    
    # Progression test command
    prog_parser = subparsers.add_parser("progression", help="Test progression paths")
    prog_parser.add_argument(
        "--path", "-p",
        choices=["aggressive", "defensive", "control"],
        default="aggressive",
        help="Progression path to test"
    )
    prog_parser.add_argument(
        "-n", type=int, default=200,
        help="Simulations per matchup"
    )
    prog_parser.add_argument(
        "--variance", "-v",
        type=int, default=10,
        help="Initiative variance width"
    )
    prog_parser.set_defaults(func=cmd_progression)
    
    args = parser.parse_args()
    
    if args.command is None:
        parser.print_help()
        return
    
    args.func(args)


if __name__ == "__main__":
    main()

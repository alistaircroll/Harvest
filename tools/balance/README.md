# Balance Autotuner Documentation

> Monte Carlo simulation and differential evolution optimization for game balance.

---

## Quick Start

```bash
# Run from project root
cd /Users/acroll/.gemini/Harvest

# Install dependencies (one-time)
pip install scipy

# Run full matchup grid
python -m tools.balance.cli grid -n 500

# Run autotuner for all creatures
python -m tools.balance.cli tune --sims 100 --iterations 30 --output tuned.json

# Tune single creature
python -m tools.balance.cli tune --creature cat --sims 200
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLI (cli.py)                                  │
│     simulate | grid | tune | mirror | progression                │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌─────────────────┐ ┌───────────┐ ┌───────────────┐
    │   simulator.py  │ │ autotuner │ │ strategies.py │
    │ run_simulations │ │   .py     │ │ AI behaviors  │
    └─────────────────┘ └───────────┘ └───────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
                    ┌─────────────────┐
                    │ battle_engine.py│
                    │ Combat mechanics │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ data_loader.py  │
                    │ Load game data  │
                    └─────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐
    │attacks.json │ │body-parts.  │ │creatures.json   │
    │             │ │   json      │ │(for reference)  │
    └─────────────┘ └─────────────┘ └─────────────────┘
```

---

## Data Sources

The simulator reads directly from the game-data JSON files:

| File | Location | Used For |
|------|----------|----------|
| `attacks.json` | `src/data/game-data/` | Attack definitions (AP cost, damage, speed, effects) |
| `body-parts.json` | `src/data/game-data/` | Body part stats (HP bonus, defense, attack IDs) |
| `creatures.json` | `src/data/game-data/` | Wild creature definitions (HP, defense, AP, attack IDs) |
| `biomes.json` | `src/data/game-data/` | Biome difficulty multipliers |
| `balance.json` | `src/data/game-data/` | Output: Tuned parameters |

### Key Code Location

All data loading happens in `tools/balance/data_loader.py`:

```python
DATA_DIR = Path(__file__).parent.parent.parent / "src" / "data" / "game-data"

def load_attacks() -> Dict[str, Attack]:
    data = load_json("attacks.json")
    # Parses attacks with effects, damage, speed, etc.

def load_body_parts() -> Dict[str, Dict[str, BodyPart]]:
    data = load_json("body-parts.json")
    # Returns Dict[part_type, Dict[animal_type, BodyPart]]
```

---

## Autotuner Algorithm

### Target Win Rates

Defined in `autotuner.py`:

```python
WIN_RATE_TARGETS = {
    "rat":      {"full": 0.90, "missing_1": 0.75, "missing_2": 0.50},
    "squirrel": {"full": 0.75, "missing_1": 0.60, "missing_2": 0.40},
    "cat":      {"full": 0.55, "missing_1": 0.40, "missing_2": 0.25},
    "dog":      {"full": 0.40, "missing_1": 0.25, "missing_2": 0.15},
    "skunk":    {"full": 0.50, "missing_1": 0.35, "missing_2": 0.20},
}
```

- `full`: Player has all 5 body parts
- `missing_1`: Player missing 1 limb (arm/leg/tail)
- `missing_2`: Player missing 2 limbs

### Tunable Parameters

```python
PARAM_BOUNDS = {
    "hp":      (25, 100),    # Total HP
    "defense": (0, 5),       # Damage reduction
    "ap":      (3, 7),       # Action points per turn
}
```

### Optimization Process

1. **Fitness Function**: Sum of squared errors between simulated and target win rates
2. **Algorithm**: `scipy.optimize.differential_evolution` (gradient-free)
3. **Per Creature**: 3 matchups × N simulations = 3N combat simulations per fitness evaluation

```python
def evaluate_creature_fitness(creature_type, params, ...):
    total_error = 0.0
    for config in ["full", "missing_1", "missing_2"]:
        simulated_rate = run_simulations(player, enemy, n=sims_per_matchup)
        target_rate = WIN_RATE_TARGETS[creature_type][config]
        error = (simulated_rate - target_rate) ** 2
        total_error += error
    return total_error  # Lower is better
```

---

## Adding New Content

### When Adding New Creatures

1. **Add to `creatures.json`** with stats and attack IDs
2. **Add to `data_loader.py`**:
   ```python
   # In create_wild_creature() definitions dict
   "new_creature": {
       "hp": 50,
       "defense": 1,
       "ap": 5,
       "attacks": ["attack_id_1", "attack_id_2"],
       "strategy": "balanced"  # chaotic|balanced|aggressive|survival|control
   }
   ```
3. **Add to `autotuner.py`**:
   ```python
   WIN_RATE_TARGETS = {
       # ... existing ...
       "new_creature": {
           "full": 0.60,       # How easy should full player beat it?
           "missing_1": 0.45,
           "missing_2": 0.25,
       },
   }
   ```
4. **Add strategy in `strategies.py`** if creating new behavior
5. **Run autotuner**:
   ```bash
   python -m tools.balance.cli tune --creature new_creature
   ```

### When Adding New Attacks

1. **Add to `attacks.json`** with full definition
2. **Reference attack ID** in body part or creature definition
3. **No autotuner changes needed** unless effect changes combat mechanics significantly

### When Adding New Biomes

1. **Add to `biomes.json`** with difficulty multiplier
2. **Add creatures** to `creatures.json` for that biome
3. **Add targets** for new creatures to `WIN_RATE_TARGETS`
4. **Update `simulator.py`** if biome affects combat (e.g., terrain effects)

### When Adding New Body Parts

1. **Add to `body-parts.json`** with stats and attack IDs
2. **No autotuner changes** unless part significantly changes player power curve

---

## AI Strategies

Defined in `tools/balance/strategies.py`:

| Strategy | Behavior | Used By |
|----------|----------|---------|
| `chaotic` | Random attack selection | Rat |
| `balanced` | Mix of damage and effects | Squirrel |
| `aggressive` | Maximize damage output | Cat |
| `survival` | Prioritize healing when low | Dog |
| `control` | Use debuffs, then damage | Skunk |

Creature-to-strategy mapping in `data_loader.py`:

```python
CREATURE_STRATEGIES = {
    "rat": "chaotic",
    "squirrel": "balanced",
    "cat": "aggressive",
    "dog": "survival",
    "skunk": "control"
}
```

---

## CLI Commands

| Command | Description | Example |
|---------|-------------|---------|
| `simulate` | Single matchup | `--enemy cat --missing-limbs 1 -n 1000` |
| `grid` | All matchups | `-n 500` |
| `tune` | Run autotuner | `--creature dog --sims 100 --output out.json` |
| `mirror` | Creature vs itself | `-n 500` |
| `progression` | Test upgrade paths | `--path aggressive` |

### Common Options

- `-n`: Number of simulations per matchup
- `--variance`: Initiative randomness (default: 10)
- `--output`: Export results to JSON file

---

## Output Files

### Autotuner Output (tuned.json)

```json
{
  "version": "1.0.0",
  "tuned_at": "2025-12-29T19:30:00Z",
  "creatures": {
    "rat": {
      "original": {"hp": 40, "defense": 0, "ap": 4},
      "tuned": {"hp": 38, "defense": 0, "ap": 4},
      "fitness_improvement": 0.0215
    }
  }
}
```

### Apply to Game

Copy tuned values to `src/data/game-data/creatures.json`:

```json
{
  "id": "wild_rat",
  "totalHp": 38,  // ← tuned value
  "defense": 0,
  "apPerTurn": 4
}
```

---

## Performance Notes

- **100 sims/matchup × 3 configs × 30 iterations** ≈ 9,000 battles per creature
- **Full tune (5 creatures)** ≈ 45,000 battles, ~2-5 minutes
- **Increase sims** for more accurate results (diminishing returns above 500)
- Use `--variance 0` for deterministic testing

---

## File Structure

```
tools/balance/
├── __init__.py
├── cli.py              # Command-line interface
├── autotuner.py        # Differential evolution optimizer
├── simulator.py        # Monte Carlo runner
├── battle_engine.py    # Combat mechanics
├── strategies.py       # AI behaviors
├── data_loader.py      # Load from game-data/
└── types.py            # Dataclass definitions
```

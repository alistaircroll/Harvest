# CREATURE LAB
## Game Design Specification Document
**Version 1.0 - MVP Scope | December 2024**

---

# 1. Executive Summary

Creature Lab is a mobile-first roguelike creature-building game where players assume the role of a lonely scientist constructing a companion from harvested animal body parts. The game combines turn-based combat (inspired by Pokemon), body-part collection mechanics, and roguelike progression with a darkly comedic Tim Burton aesthetic.

**Core Fantasy:** You are Dr. Frankenstein meets a pet store owner—morally questionable, emotionally lonely, building the perfect companion one limb at a time.

**Target Platform:** Mobile web app (React, Node.js, Firebase, deployed on Vercel)

**Target Audience:** Casual mobile gamers aged 13+, particularly those who enjoy creature-collectors, roguelikes, or quirky indie games

**Session Length:** ~2 minutes per battle, ~30 minutes per session

---

# 2. Game Overview

## 2.1 Narrative Frame

You are a reclusive scientist working in a cluttered laboratory filled with preserved specimens, mysterious equipment, and body parts in jars. Lonely and eccentric, you decide to build yourself a companion—a creature stitched together from whatever parts you can find. Your laboratory has basic parts scavenged from common city animals, but to build something truly special, you'll need to venture out into the world.

When walking with your creature, wild animals attack. If you win, you harvest one of their body parts to upgrade your companion. If you lose, they steal one of yours. The world is hostile, but with careful planning and strategic part selection, you can build the ultimate creature.

## 2.2 Core Gameplay Loop

1. **Laboratory:** Assemble/modify your creature from available parts, manage freezer storage
2. **Exploration:** Choose a biome, view silhouettes of available wild creatures, select one to approach
3. **Combat:** Turn-based battle using action points to select attacks from your body parts
4. **Victory:** Harvest one body part from the defeated creature
5. **Defeat:** Lose a random body part (or sacrificial part if equipped); if reduced to head+torso only, return to lab
6. **Repeat:** Continue building until satisfied or death resets progress

## 2.3 Roguelike Elements

**Death Penalty:** When your creature is reduced to only head and torso (loses all limbs), you return to the laboratory and must start rebuilding with basic parts.

**Freezer Insurance:** You have 3 freezer slots where you can store body parts. These persist across deaths. When you die, you may defrost stored parts to rebuild faster. Defrosting empties that freezer slot. You can deposit parts any time you're in the lab, but can only withdraw (defrost) after death.

**Sacrificial Parts:** Some body parts (like gecko tails in future biomes) are "sacrificial"—if you have one and lose a battle, that part is always taken instead of a random part. Trade-off: sacrificial parts consume an action point automatically each turn.

---

# 3. Creature Anatomy System

## 3.1 Body Part Types

Your creature is composed of distinct body part slots. Each slot accepts one part of its type. The MVP includes these slots:

| Slot | Quantity | Notes |
|------|----------|-------|
| Torso | 1 (permanent) | Cannot be lost. Determines max limb slots. Provides base HP. |
| Head | 1 | Includes eyes and mouth. Can be lost (triggers lab return if last part). |
| Arms | 2 (left, right) | Primary attack limbs. Can be asymmetric. |
| Legs | 2 (left, right) | Provide evasion/movement attacks. |
| Tail | 1 | Special abilities, potential sacrificial slot. |

## 3.2 MVP Creature Variants

The MVP includes 5 wild creatures, all from the City biome:

- **Cat** – Special: Cat Scratch Fever (arm) – DoT debuff
- **Dog** – Special: Lick It Better (head) – Healing
- **Skunk** – Special: Stinky Spray (tail) – AP reduction debuff
- **Squirrel** – Special: Climb a Tree (legs) – Evasion buff
- **Rat** – No special abilities. Weakest creature. Baseline for testing.

---

# 4. Body Parts Data Model

Each body part has base stats and one or more attacks. This section provides the complete data model for all 25 MVP body parts.

## 4.1 Stat Definitions

- **HP Bonus:** Added to creature's total HP pool (torso and head only)
- **Defense:** Flat damage reduction applied to incoming attacks
- **AP Cost:** Action points consumed to use an attack
- **Damage:** Base damage dealt by the attack
- **Effect:** Special effect (DoT, buff, debuff, heal)

## 4.2 Global Combat Values

- **Base Action Points:** 6 AP per turn for player creature
- **Wild Creature AP:** Varies by creature (see stat tables)
- **Difficulty Parameter:** Global multiplier (default 1.0) applied to wild creature stats for tuning

## 4.3 Torso Stats

Torsos provide HP and defense but have no attacks.

| Animal | HP Bonus | Defense | Notes |
|--------|----------|---------|-------|
| Rat | 20 | 0 | Baseline. Weakest torso. |
| Squirrel | 22 | 1 | Slightly better than rat. |
| Cat | 25 | 1 | Agile, moderate stats. |
| Dog | 30 | 2 | Sturdy, good HP. |
| Skunk | 25 | 2 | Defensive option. |

## 4.4 Head Stats (includes eyes + mouth)

| Animal | HP Bonus | Def | Attack 1 | AP/Dmg | Attack 2 (Special) |
|--------|----------|-----|----------|--------|-------------------|
| Rat | 10 | 0 | Nibble | 1 / 4 | None |
| Squirrel | 10 | 0 | Chitter | 1 / 3 | None |
| Cat | 12 | 0 | Bite | 2 / 8 | Hiss: 1 AP, -1 enemy Def for 2 turns |
| Dog | 15 | 1 | Bite | 2 / 7 | Lick It Better: 2 AP, heal 8 HP |
| Skunk | 12 | 1 | Nip | 1 / 5 | None |

## 4.5 Arm Stats

| Animal | Def | Attack 1 | AP/Dmg | Attack 2 (Special) |
|--------|-----|----------|--------|-------------------|
| Rat | 0 | Scratch | 1 / 5 | None |
| Squirrel | 0 | Scratch | 1 / 5 | None |
| Cat | 0 | Swipe | 1 / 6 | Cat Scratch Fever: 2 AP, 4 dmg + 3 dmg/turn for 3 turns |
| Dog | 1 | Paw Slap | 1 / 5 | None |
| Skunk | 0 | Claw | 1 / 5 | None |

## 4.6 Leg Stats

| Animal | Def | Attack 1 | AP/Dmg | Attack 2 (Special) |
|--------|-----|----------|--------|-------------------|
| Rat | 0 | Kick | 1 / 4 | None |
| Squirrel | 0 | Kick | 1 / 4 | Climb a Tree: 2 AP, +50% evasion this turn |
| Cat | 0 | Kick | 1 / 5 | Pounce: 2 AP, 10 dmg (must use both legs) |
| Dog | 1 | Kick | 1 / 5 | None |
| Skunk | 0 | Kick | 1 / 4 | None |

## 4.7 Tail Stats

| Animal | Def | Attack 1 | AP/Dmg | Attack 2 (Special) |
|--------|-----|----------|--------|-------------------|
| Rat | 0 | Tail Whip | 1 / 3 | None |
| Squirrel | 0 | Fluffy Distract | 1 / 2 | Distract: -1 enemy accuracy for 1 turn |
| Cat | 0 | Tail Whip | 1 / 4 | None |
| Dog | 0 | Tail Wag | 1 / 3 | Happy Wag: 1 AP, +1 own Def for 2 turns |
| Skunk | 0 | Tail Slap | 1 / 3 | Stinky Spray: 3 AP, -2 enemy AP for 2 turns (no stack) |

## 4.8 Wild Creature Stat Blocks

Wild creatures are pre-built entities with fixed stats. They use simplified AI to select attacks.

| Creature | Total HP | Total Def | AP/Turn | Available Attacks |
|----------|----------|-----------|---------|-------------------|
| Rat | 40 | 0 | 4 | Nibble (1/4), Scratch (1/5), Kick (1/4), Tail Whip (1/3) |
| Squirrel | 45 | 1 | 5 | Chitter (1/3), Scratch (1/5), Kick (1/4), Climb a Tree (2/evasion) |
| Cat | 55 | 1 | 5 | Bite (2/8), Swipe (1/6), Cat Scratch Fever (2/4+DoT), Pounce (4/10) |
| Dog | 65 | 3 | 5 | Bite (2/7), Paw Slap (1/5), Kick (1/5), Lick It Better (2/heal 8) |
| Skunk | 55 | 3 | 5 | Nip (1/5), Claw (1/5), Kick (1/4), Stinky Spray (3/-2 AP debuff) |

---

# 5. Combat System

## 5.1 Turn Structure

1. **Turn Start:** Both creatures reset AP to their max. Apply any ongoing effects (DoT damage, expiring buffs/debuffs).
2. **Player Selection:** Player views available attacks from all body parts. Each attack shows AP cost, damage, and effects. Player selects attacks until AP is exhausted or they choose to end turn.
3. **Enemy Selection:** AI selects attacks for wild creature (see AI Logic section).
4. **Resolution:** All attacks resolve simultaneously. Damage is calculated, effects applied.
5. **End Check:** If either creature HP <= 0, battle ends. Otherwise, next turn.

## 5.2 Damage Calculation

```
Damage = (Attack Damage) - (Target Defense), minimum 1
```

Defense is the sum of all body part defense values. DoT effects ignore defense.

## 5.3 Effect Types

- **DoT (Damage over Time):** Deals X damage at start of target's turn for Y turns. Stacks.
- **Debuff - Defense:** Reduces target defense by X for Y turns.
- **Debuff - AP:** Reduces target max AP by X for Y turns. Does not stack.
- **Buff - Defense:** Increases own defense by X for Y turns.
- **Buff - Evasion:** X% chance to avoid all damage this turn.
- **Heal:** Restore X HP to self. Cannot exceed max HP.

## 5.4 Wild Creature AI

MVP uses simple weighted random selection:

- If HP < 30%: Prioritize healing attacks if available (70% chance), else attack
- If player has active debuff: 30% chance to use another debuff, else attack
- Default: Select random attacks weighted toward higher damage options

## 5.5 Victory and Defeat

**Victory:** Player selects one body part to harvest from defeated creature. The harvested part is immediately equipped (replacing existing part of that type) or stored if creature slots are full. Player may also choose to discard the part.

**Defeat:** Wild creature steals one part. If player has a sacrificial part, that part is taken. Otherwise, random non-torso part is taken. If player is reduced to head+torso only, they return to lab and must rebuild (can defrost freezer parts).

**Flee (pre-battle only):** On the creature selection screen, player may choose not to engage and return to biome selection. No cost in MVP.

---

# 6. Laboratory System

## 6.1 Laboratory Functions

The laboratory is the player's home base between expeditions.

- **View Creature:** See current creature composition, total stats, available attacks
- **Swap Parts:** Remove a part and replace with one from inventory or basic lab parts
- **Manage Freezers:** Deposit parts into 3 freezer slots for death insurance
- **Basic Parts:** Lab always has unlimited rat/cat/dog/squirrel/skunk parts (level 1)
- **Go Walking:** Leave lab and enter biome selection

## 6.2 Starting Condition

New player starts with:

- Full rat creature (rat torso, rat head, 2 rat arms, 2 rat legs, rat tail)
- 2 random parts with special abilities already in freezers (e.g., dog head in freezer 1, skunk tail in freezer 2)

## 6.3 Freezer Rules

- 3 freezer slots total
- Deposit: Any time in lab, player can put a part into an empty freezer
- Withdraw (defrost): Only available after death. Defrosting removes part from freezer and equips it.
- Parts in freezer are safe from loss during defeat

---

# 7. Exploration System

## 7.1 Biome Selection (MVP: City Only)

Player selects a biome from available options. MVP includes only City. Future biomes (Park, Pond, Forest, Beach, Mountains, Jungle) will be added post-MVP with increasing difficulty and unique creatures.

## 7.2 Creature Selection (Silhouette System)

After choosing a biome, player sees 3 silhouettes of wild creatures. Each silhouette shows creature type (cat, dog, etc.) but not exact stats. Player chooses which creature to approach, initiating combat. Player may also return to lab without fighting.

This gives players agency over which parts they hunt while maintaining some mystery about exact creature strength.

---

# 8. User Interface Specification

## 8.1 Screen Flow

```
Main Menu → Laboratory ↔ Biome Selection → Creature Selection → Combat → Victory/Defeat → (return to Laboratory or continue)
```

## 8.2 Laboratory Screen

- **Creature Display:** Card-based layout per user drawing. Torso in center, head above, arms to sides, legs below, tail at bottom. Each body part is a tappable card showing animal type, stats, and attacks.
- **Freezer Panel:** 3 slots at bottom or side of screen. Show frozen part or "Empty" placeholder.
- **Basic Parts Drawer:** Expandable panel showing all available lab parts (rat, cat, dog, squirrel, skunk × each part type)
- **Go Walking Button:** Prominent button to leave lab

## 8.3 Combat Screen

- **Layout:** Player creature on left, wild creature on right
- **HP Bars:** Above each creature, showing current/max HP
- **AP Display:** Player's remaining AP shown prominently (e.g., "4/6 AP")
- **Attack Panel:** Scrollable list of available attacks from all body parts. Each shows: Attack name, source body part, AP cost, damage/effect. Greyed out if insufficient AP.
- **Selected Attacks Queue:** Shows attacks player has selected this turn
- **End Turn Button:** Confirms attack selection and resolves turn
- **Status Effects:** Icons below HP bars showing active buffs/debuffs with remaining duration

## 8.4 Visual Style

- **Aesthetic:** Tim Burton / Addams Family. Hand-drawn, sketchy, slightly unsettling but charming.
- **Color Palette:** Muted purples, greens, grays. Accents of sickly yellow and blood red.
- **Typography:** Gothic or handwritten style for headers, clean sans-serif for stats/numbers.
- **Stitching Motif:** Lines connecting body parts suggest stitches. Cards have rough, torn edges.

---

# 9. Technical Architecture

## 9.1 Tech Stack

- **Frontend:** React (functional components, hooks)
- **Backend:** Node.js (API if needed, but mostly client-side)
- **Database:** Firebase Firestore (player data, creature state)
- **Auth:** Firebase Authentication (email/password, Google sign-in)
- **Hosting:** Vercel
- **State Management:** React Context or Zustand for client state

## 9.2 Data Model

### Player Document (Firestore)

```json
{
  "odayId": "string",
  "odayemail": "string",
  "creature": {
    "torso": "BodyPart",
    "head": "BodyPart",
    "leftArm": "BodyPart",
    "rightArm": "BodyPart",
    "leftLeg": "BodyPart",
    "rightLeg": "BodyPart",
    "tail": "BodyPart"
  },
  "freezer": ["BodyPart | null", "BodyPart | null", "BodyPart | null"],
  "inventory": ["BodyPart"],
  "stats": {
    "battlesWon": "number",
    "battlesLost": "number",
    "totalPartsHarvested": "number"
  }
}
```

### Body Part Object

```json
{
  "partType": "torso | head | arm | leg | tail",
  "animalType": "rat | squirrel | cat | dog | skunk",
  "hpBonus": "number",
  "defense": "number",
  "attacks": [
    {
      "name": "string",
      "apCost": "number",
      "damage": "number",
      "effect": "Effect | null"
    }
  ]
}
```

### Effect Object

```json
{
  "type": "dot | debuff_defense | debuff_ap | buff_defense | buff_evasion | heal",
  "value": "number",
  "duration": "number",
  "stacks": "boolean"
}
```

### Wild Creature (Static JSON)

```json
{
  "creatureType": "rat | squirrel | cat | dog | skunk",
  "biome": "city",
  "totalHp": "number",
  "defense": "number",
  "apPerTurn": "number",
  "attacks": ["Attack"],
  "lootTable": {
    "torso": "BodyPart",
    "head": "BodyPart",
    "arm": "BodyPart",
    "leg": "BodyPart",
    "tail": "BodyPart"
  }
}
```

## 9.3 Key Components

| Component | Purpose |
|-----------|---------|
| `CreatureDisplay` | Renders card-based creature visualization |
| `BodyPartCard` | Individual part with stats and attack info |
| `CombatEngine` | Manages turn state, attack resolution, AI |
| `AttackSelector` | Lists available attacks, handles selection |
| `Laboratory` | Part swapping, freezer management |
| `BiomeSelector` | Choose exploration destination |
| `CreatureSelector` | Silhouette selection for hunting |
| `VictoryScreen` | Part harvesting after win |
| `DefeatScreen` | Part loss notification, death handling |

---

# 10. Art Asset Requirements

## 10.1 Body Part Art (25 assets)

Each body part needs one hand-drawn asset. Style: sketchy, slightly unsettling, stitching details where attached.

| Part Type | Variants Needed |
|-----------|-----------------|
| Torso | Rat, Squirrel, Cat, Dog, Skunk |
| Head | Rat, Squirrel, Cat, Dog, Skunk (each includes eyes + mouth) |
| Arm | Rat, Squirrel, Cat, Dog, Skunk |
| Leg | Rat, Squirrel, Cat, Dog, Skunk |
| Tail | Rat, Squirrel, Cat, Dog, Skunk |

## 10.2 UI Art

- Laboratory background
- City biome background
- 5 creature silhouettes (cat, dog, skunk, squirrel, rat)
- Freezer unit graphic (3 slots)
- Card frame/border graphic
- HP bar assets
- AP indicator icons
- Status effect icons (DoT, defense up/down, AP down, evasion, healing)

**Total MVP Art Assets: ~40**

---

# 11. Future Enhancements (Post-MVP)

These features are documented but NOT included in MVP scope:

- **Additional Biomes:** Park, Pond, Forest, Beach, Mountains, Jungle with unique creatures
- **XP System:** Parts gain XP through use, enabling upgrades
- **Research Points:** Currency for meta-upgrades (slot expansion, HP increase)
- **Symmetry Bonuses:** Matching parts provide stat bonuses
- **Creature Leveling:** Wild creatures scale with player progression
- **Advanced Torsos:** Octopus (8 limbs), Spider (8 legs), etc.
- **Head Upgrades:** Horns, antennae, gills as additional head features
- **Wings:** Flight-based abilities and body slot
- **Shell:** Defensive body slot
- **Sacrificial Parts:** Gecko tail-style loss insurance
- **Elemental System:** Type matchups (fire vs ice, etc.)
- **Black Market:** Trade parts with NPC
- **Random Events:** Encounters during walks beyond combat
- **Lab Upgrades:** Permanent improvements that persist
- **Flee Mechanic:** Spend RP to escape mid-battle
- **Story Mode:** Narrative with boss encounters

---

# 12. Sprint Breakdown

Each sprint is designed to produce a testable increment. Verify functionality before proceeding.

## Sprint 0: Project Setup (1-2 days)

**Goal:** Working development environment with placeholder content

1. Initialize React project with Vite
2. Configure Firebase project (Firestore, Auth)
3. Set up Vercel deployment pipeline
4. Create basic routing (home, lab, combat screens as placeholders)
5. Create body part data JSON with all 25 parts and stats
6. Create wild creature data JSON with all 5 creatures

**Test:** App loads on Vercel, data files import correctly

### Deliverables

- `/src/data/bodyParts.json` - All 25 body parts with stats
- `/src/data/wildCreatures.json` - All 5 wild creatures with stats
- Basic React app with routing
- Firebase configuration
- Vercel deployment working

---

## Sprint 1: Creature Display (2-3 days)

**Goal:** Visual creature representation with placeholder art

1. Build `BodyPartCard` component (shows part type, animal, stats)
2. Build `CreatureDisplay` component (arranges cards in humanoid layout)
3. Create placeholder art (colored rectangles with text labels)
4. Implement creature state (hardcoded rat creature)
5. Calculate total HP and defense from parts

**Test:** Creature displays correctly, stats sum properly

### Deliverables

- `BodyPartCard` component
- `CreatureDisplay` component
- Placeholder CSS for card layout
- Creature stat calculation utilities

---

## Sprint 2: Combat Foundation (3-4 days)

**Goal:** Basic turn-based combat without special abilities

1. Build `CombatScreen` layout (player creature vs wild creature)
2. Implement HP bars for both creatures
3. Build `AttackSelector` (list attacks, show AP costs)
4. Implement AP tracking (6 AP per turn, decrement on attack selection)
5. Implement basic damage calculation (attack damage - defense)
6. Implement turn resolution (player attacks, then enemy attacks)
7. Implement simple enemy AI (random attack selection within AP)
8. Implement win/lose detection

**Test:** Player can fight rat vs rat, combat resolves, winner declared

### Deliverables

- `CombatScreen` component
- `AttackSelector` component
- `CombatEngine` logic (turn management, damage calc)
- Basic enemy AI
- HP bar components

---

## Sprint 3: Special Abilities (2-3 days)

**Goal:** All MVP special effects working

1. Implement effect system (track active effects per creature)
2. Implement DoT (Cat Scratch Fever): damage per turn, stacking, duration
3. Implement Healing (Lick It Better): restore HP
4. Implement AP Debuff (Stinky Spray): reduce enemy max AP, no stacking
5. Implement Evasion Buff (Climb a Tree): % chance to dodge
6. Display active effects as icons with duration
7. Update enemy AI to use special abilities appropriately

**Test:** Each special ability works correctly in combat

### Deliverables

- Effect system with duration tracking
- DoT implementation
- Healing implementation
- AP debuff implementation
- Evasion buff implementation
- Status effect display component

---

## Sprint 4: Laboratory (2-3 days)

**Goal:** Player can view and modify creature

1. Build `Laboratory` screen with creature display
2. Implement basic parts drawer (all level-1 parts available)
3. Implement part swapping (tap part → select replacement)
4. Implement freezer UI (3 slots, deposit functionality)
5. Implement "Go Walking" button to enter exploration

**Test:** Can swap parts, deposit to freezer, navigate to combat

### Deliverables

- `Laboratory` screen component
- `PartsDrawer` component
- `FreezerPanel` component
- Part swap logic
- Navigation to exploration

---

## Sprint 5: Exploration Loop (2 days)

**Goal:** Complete pre-combat flow

1. Build `BiomeSelector` screen (City only, placeholder for others)
2. Build `CreatureSelector` screen (3 silhouettes, random creatures)
3. Implement creature selection (tap silhouette → start combat)
4. Implement "return to lab" option from creature selection

**Test:** Full loop: lab → biome → creature select → combat → return

### Deliverables

- `BiomeSelector` component
- `CreatureSelector` component
- Silhouette display logic
- Random creature generation for encounters

---

## Sprint 6: Victory/Defeat (2-3 days)

**Goal:** Combat outcomes affect game state

1. Build `VictoryScreen` (show defeated creature parts, allow selection)
2. Implement part harvesting (add selected part to creature or inventory)
3. Build `DefeatScreen` (show lost part, return to lab option)
4. Implement part loss (random part removed from creature)
5. Implement death detection (only head+torso left)
6. Implement freezer defrost on death (available when rebuilding)

**Test:** Win → harvest part; Lose → lose part; Death → defrost and rebuild

### Deliverables

- `VictoryScreen` component
- `DefeatScreen` component
- Part harvesting logic
- Part loss logic
- Death/rebuild flow
- Freezer defrost functionality

---

## Sprint 7: Persistence (2-3 days)

**Goal:** Game state persists across sessions

1. Implement Firebase Auth (email/password signup/login)
2. Create player document on first login (starter rat + 2 frozen parts)
3. Save creature state to Firestore after each change
4. Load creature state from Firestore on login
5. Handle offline/sync edge cases

**Test:** Login, play, close app, reopen, state preserved

### Deliverables

- Auth flow (signup, login, logout)
- Player document creation
- Real-time state sync with Firestore
- Loading states and error handling

---

## Sprint 8: Polish & Art (3-5 days)

**Goal:** MVP-ready visual quality

1. Replace placeholder art with hand-drawn assets
2. Implement visual feedback (attack animations, damage numbers)
3. Add sound effects (optional but recommended)
4. Mobile optimization (touch targets, responsive layout)
5. Bug fixes and balance tuning
6. User testing with target audience

**Test:** External playtesters can complete full game loop without confusion

### Deliverables

- All 25 body part art assets integrated
- UI art assets integrated
- Animation system
- Mobile-responsive CSS
- Bug fixes from playtesting

---

## Estimated Timeline

**Total: 20-28 days of development time**

(Not including art creation, which can be parallel)

| Sprint | Duration | Cumulative |
|--------|----------|------------|
| Sprint 0 | 1-2 days | 1-2 days |
| Sprint 1 | 2-3 days | 3-5 days |
| Sprint 2 | 3-4 days | 6-9 days |
| Sprint 3 | 2-3 days | 8-12 days |
| Sprint 4 | 2-3 days | 10-15 days |
| Sprint 5 | 2 days | 12-17 days |
| Sprint 6 | 2-3 days | 14-20 days |
| Sprint 7 | 2-3 days | 16-23 days |
| Sprint 8 | 3-5 days | 19-28 days |

---

# Appendix A: Quick Reference Card

For developer reference during implementation:

## Combat Formulas

```
Damage = max(1, AttackDamage - TargetDefense)
Total HP = Torso HP Bonus + Head HP Bonus
Total Defense = Sum of all part Defense values
Evasion = flat % chance to take 0 damage from all attacks that turn
```

## Special Ability Summary

| Ability | Source | Cost | Effect |
|---------|--------|------|--------|
| Cat Scratch Fever | Cat Arm | 2 AP | 4 dmg + 3 DoT × 3 turns, stacks |
| Lick It Better | Dog Head | 2 AP | Heal 8 HP |
| Stinky Spray | Skunk Tail | 3 AP | -2 enemy AP for 2 turns, no stack |
| Climb a Tree | Squirrel Legs | 2 AP | +50% evasion this turn |
| Pounce | Cat Legs (both) | 4 AP | 10 damage |
| Hiss | Cat Head | 1 AP | -1 enemy Def for 2 turns |
| Happy Wag | Dog Tail | 1 AP | +1 own Def for 2 turns |
| Distract | Squirrel Tail | 1 AP | -1 enemy accuracy for 1 turn |

## Starting Creature

- Full rat: 40 HP total (20 torso + 10 head + 10 base), 0 defense, 6 AP
- Plus 2 random special-ability parts in freezer

## File Structure (Recommended)

```
/src
  /components
    /creature
      BodyPartCard.jsx
      CreatureDisplay.jsx
    /combat
      CombatScreen.jsx
      AttackSelector.jsx
      HPBar.jsx
      StatusEffects.jsx
    /lab
      Laboratory.jsx
      PartsDrawer.jsx
      FreezerPanel.jsx
    /exploration
      BiomeSelector.jsx
      CreatureSelector.jsx
    /screens
      VictoryScreen.jsx
      DefeatScreen.jsx
  /data
    bodyParts.json
    wildCreatures.json
  /hooks
    useCombat.js
    useCreature.js
    useFirebase.js
  /utils
    combat.js
    creatures.js
  /context
    GameContext.jsx
  App.jsx
  main.jsx
```

---

# Appendix B: Body Parts JSON Structure

```json
{
  "bodyParts": {
    "torso": {
      "rat": { "hpBonus": 20, "defense": 0, "attacks": [] },
      "squirrel": { "hpBonus": 22, "defense": 1, "attacks": [] },
      "cat": { "hpBonus": 25, "defense": 1, "attacks": [] },
      "dog": { "hpBonus": 30, "defense": 2, "attacks": [] },
      "skunk": { "hpBonus": 25, "defense": 2, "attacks": [] }
    },
    "head": {
      "rat": {
        "hpBonus": 10,
        "defense": 0,
        "attacks": [
          { "name": "Nibble", "apCost": 1, "damage": 4, "effect": null }
        ]
      },
      "squirrel": {
        "hpBonus": 10,
        "defense": 0,
        "attacks": [
          { "name": "Chitter", "apCost": 1, "damage": 3, "effect": null }
        ]
      },
      "cat": {
        "hpBonus": 12,
        "defense": 0,
        "attacks": [
          { "name": "Bite", "apCost": 2, "damage": 8, "effect": null },
          { "name": "Hiss", "apCost": 1, "damage": 0, "effect": { "type": "debuff_defense", "value": 1, "duration": 2 } }
        ]
      },
      "dog": {
        "hpBonus": 15,
        "defense": 1,
        "attacks": [
          { "name": "Bite", "apCost": 2, "damage": 7, "effect": null },
          { "name": "Lick It Better", "apCost": 2, "damage": 0, "effect": { "type": "heal", "value": 8 } }
        ]
      },
      "skunk": {
        "hpBonus": 12,
        "defense": 1,
        "attacks": [
          { "name": "Nip", "apCost": 1, "damage": 5, "effect": null }
        ]
      }
    },
    "arm": {
      "rat": {
        "defense": 0,
        "attacks": [
          { "name": "Scratch", "apCost": 1, "damage": 5, "effect": null }
        ]
      },
      "squirrel": {
        "defense": 0,
        "attacks": [
          { "name": "Scratch", "apCost": 1, "damage": 5, "effect": null }
        ]
      },
      "cat": {
        "defense": 0,
        "attacks": [
          { "name": "Swipe", "apCost": 1, "damage": 6, "effect": null },
          { "name": "Cat Scratch Fever", "apCost": 2, "damage": 4, "effect": { "type": "dot", "value": 3, "duration": 3, "stacks": true } }
        ]
      },
      "dog": {
        "defense": 1,
        "attacks": [
          { "name": "Paw Slap", "apCost": 1, "damage": 5, "effect": null }
        ]
      },
      "skunk": {
        "defense": 0,
        "attacks": [
          { "name": "Claw", "apCost": 1, "damage": 5, "effect": null }
        ]
      }
    },
    "leg": {
      "rat": {
        "defense": 0,
        "attacks": [
          { "name": "Kick", "apCost": 1, "damage": 4, "effect": null }
        ]
      },
      "squirrel": {
        "defense": 0,
        "attacks": [
          { "name": "Kick", "apCost": 1, "damage": 4, "effect": null },
          { "name": "Climb a Tree", "apCost": 2, "damage": 0, "effect": { "type": "buff_evasion", "value": 50, "duration": 1 } }
        ]
      },
      "cat": {
        "defense": 0,
        "attacks": [
          { "name": "Kick", "apCost": 1, "damage": 5, "effect": null },
          { "name": "Pounce", "apCost": 2, "damage": 10, "effect": null, "requiresBothLegs": true }
        ]
      },
      "dog": {
        "defense": 1,
        "attacks": [
          { "name": "Kick", "apCost": 1, "damage": 5, "effect": null }
        ]
      },
      "skunk": {
        "defense": 0,
        "attacks": [
          { "name": "Kick", "apCost": 1, "damage": 4, "effect": null }
        ]
      }
    },
    "tail": {
      "rat": {
        "defense": 0,
        "attacks": [
          { "name": "Tail Whip", "apCost": 1, "damage": 3, "effect": null }
        ]
      },
      "squirrel": {
        "defense": 0,
        "attacks": [
          { "name": "Fluffy Distract", "apCost": 1, "damage": 2, "effect": null },
          { "name": "Distract", "apCost": 1, "damage": 0, "effect": { "type": "debuff_accuracy", "value": 1, "duration": 1 } }
        ]
      },
      "cat": {
        "defense": 0,
        "attacks": [
          { "name": "Tail Whip", "apCost": 1, "damage": 4, "effect": null }
        ]
      },
      "dog": {
        "defense": 0,
        "attacks": [
          { "name": "Tail Wag", "apCost": 1, "damage": 3, "effect": null },
          { "name": "Happy Wag", "apCost": 1, "damage": 0, "effect": { "type": "buff_defense", "value": 1, "duration": 2 } }
        ]
      },
      "skunk": {
        "defense": 0,
        "attacks": [
          { "name": "Tail Slap", "apCost": 1, "damage": 3, "effect": null },
          { "name": "Stinky Spray", "apCost": 3, "damage": 0, "effect": { "type": "debuff_ap", "value": 2, "duration": 2, "stacks": false } }
        ]
      }
    }
  }
}
```

---

# Appendix C: Wild Creatures JSON Structure

```json
{
  "wildCreatures": {
    "city": [
      {
        "type": "rat",
        "totalHp": 40,
        "defense": 0,
        "apPerTurn": 4,
        "attacks": [
          { "name": "Nibble", "apCost": 1, "damage": 4, "effect": null },
          { "name": "Scratch", "apCost": 1, "damage": 5, "effect": null },
          { "name": "Kick", "apCost": 1, "damage": 4, "effect": null },
          { "name": "Tail Whip", "apCost": 1, "damage": 3, "effect": null }
        ]
      },
      {
        "type": "squirrel",
        "totalHp": 45,
        "defense": 1,
        "apPerTurn": 5,
        "attacks": [
          { "name": "Chitter", "apCost": 1, "damage": 3, "effect": null },
          { "name": "Scratch", "apCost": 1, "damage": 5, "effect": null },
          { "name": "Kick", "apCost": 1, "damage": 4, "effect": null },
          { "name": "Climb a Tree", "apCost": 2, "damage": 0, "effect": { "type": "buff_evasion", "value": 50, "duration": 1 } }
        ]
      },
      {
        "type": "cat",
        "totalHp": 55,
        "defense": 1,
        "apPerTurn": 5,
        "attacks": [
          { "name": "Bite", "apCost": 2, "damage": 8, "effect": null },
          { "name": "Swipe", "apCost": 1, "damage": 6, "effect": null },
          { "name": "Cat Scratch Fever", "apCost": 2, "damage": 4, "effect": { "type": "dot", "value": 3, "duration": 3, "stacks": true } },
          { "name": "Pounce", "apCost": 4, "damage": 10, "effect": null }
        ]
      },
      {
        "type": "dog",
        "totalHp": 65,
        "defense": 3,
        "apPerTurn": 5,
        "attacks": [
          { "name": "Bite", "apCost": 2, "damage": 7, "effect": null },
          { "name": "Paw Slap", "apCost": 1, "damage": 5, "effect": null },
          { "name": "Kick", "apCost": 1, "damage": 5, "effect": null },
          { "name": "Lick It Better", "apCost": 2, "damage": 0, "effect": { "type": "heal", "value": 8 } }
        ]
      },
      {
        "type": "skunk",
        "totalHp": 55,
        "defense": 3,
        "apPerTurn": 5,
        "attacks": [
          { "name": "Nip", "apCost": 1, "damage": 5, "effect": null },
          { "name": "Claw", "apCost": 1, "damage": 5, "effect": null },
          { "name": "Kick", "apCost": 1, "damage": 4, "effect": null },
          { "name": "Stinky Spray", "apCost": 3, "damage": 0, "effect": { "type": "debuff_ap", "value": 2, "duration": 2, "stacks": false } }
        ]
      }
    ]
  }
}
```

---

*— End of Specification —*

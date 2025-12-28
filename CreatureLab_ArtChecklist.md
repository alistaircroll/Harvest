# Creature Lab Art Asset Specification

## Overview

| Property | Value |
|----------|-------|
| **Total assets needed** | 47 |
| **Style** | Hand-drawn, sketchy, Tim Burton/Addams Family vibe. Slightly unsettling but charming. Stitching details where parts attach. |
| **Format** | PNG with transparent background |
| **Color Mode** | RGB, 8-bit |

---

## ⚠️ CRITICAL: Future-Proofing Guidelines

**READ THIS BEFORE DRAWING ANYTHING.**

The MVP has simple creatures, but future versions will have:
- Torsos with **8 limbs** (octopus, spider)
- Heads with **horns, antennae, gills**
- **Wings** attached to torso
- **Shells** on torso back

If we don't plan for this now, we redraw everything later. Follow these rules:

### Torso Future-Proofing

Current MVP torsos have: neck (top), 2 arm slots (sides), 2 leg slots (bottom), tail slot (bottom-center).

Future torsos will have: up to **4 arm slots per side**, wing slots (upper back), shell coverage (back).

**Rules for MVP torsos:**
1. Keep the torso **vertically centered** in the canvas with space above and below
2. Draw arms attaching at the **upper third** of the torso sides (not middle)
3. Leave the **lower two-thirds of the sides visually "empty"** — no major features there
4. This means future torsos can show additional arm attachment points lower down

```
Current MVP Torso:          Future 8-Limb Torso:
     [neck]                      [neck]
  [arm]   [arm]              [arm1]   [arm1]
     |body|                  [arm2]   [arm2]
     |body|                  [arm3]   [arm3]  
  [leg]   [leg]              [arm4]   [arm4]
    [tail]                   (no legs - tentacles)
                               [tail]
```

**Action:** When drawing MVP torsos, make sure the arm attachment stitches are in the upper 1/3 of the side. The rest of the side should be "body" with no major features blocking future arm slots.

### Head Future-Proofing

Current MVP heads have: eyes, mouth (built-in), ears.

Future heads will have: **horn slots** (top), **antennae slots** (top), **gill slots** (sides/neck area).

**Rules for MVP heads:**
1. Keep the **top of the head clear** — no tall ears, no fur spikes, nothing that blocks where horns would go
2. Ears should be to the **sides**, not straight up
3. Leave space at the **neck/jaw area** for future gill attachments
4. Horns and antennae will be **separate overlay assets** in future — the head just needs clear space

```
Current MVP Head:           Future Head with Horns:
                                [horn] [horn]
    (ear)   (ear)              (ear)   (ear)
      [eyes]                     [eyes]
      [nose]                     [nose]
      [mouth]                    [mouth]
                               [gills on neck]
```

**Action:** Draw ears pointing sideways/back, not straight up. Keep top of skull relatively flat/clear. Rat/squirrel ears can point up (they're small), but cat/dog ears should fold or point sideways.

### Limb Future-Proofing

Arms and legs just need consistent attachment points.

**Rules:**
1. All arms attach at the **same point** (upper-left of canvas, facing left)
2. All legs attach at the **same point** (upper-left of canvas, facing left)
3. The attachment point should have **visible stitches** that align across all animal types

This way a cat-arm and a dog-arm connect to any torso identically.

### Tail Future-Proofing

Tails are fine as-is. Future tails (gecko sacrificial tail, etc.) will follow the same format.

---

## Art Dimensions Summary

| Asset Type | Dimensions | @2x (Retina) | Notes |
|------------|------------|--------------|-------|
| **Body Parts** | 160×160px | 320×320px | Square canvas, art can be asymmetric within |
| **Silhouettes** | 200×200px | 400×400px | Full creature shape, solid dark fill |
| **Status Icons** | 32×32px | 64×64px | Simple, readable at small size |
| **Card Frame** | 200×280px | 400×560px | Portrait orientation for body part cards |
| **HP Bar Frame** | 200×24px | 400×48px | Just the border, code fills color |
| **AP Pips** | 24×24px | 48×48px | Action point indicators |
| **Freezer** | 320×120px | 640×240px | 3 compartments visible |
| **Backgrounds** | 750×1334px | 1500×2668px | iPhone aspect ratio |
| **App Icon** | 1024×1024px | — | No transparency |
| **Favicon** | 32×32px | — | Simplified app icon |

> **Recommendation:** Create @2x versions for all assets. The app will scale down for standard displays.

---

## Priority Order

1. **Rat (complete creature)** — needed to test basic gameplay
2. **Card frame** — needed to display any part
3. **Cat (complete creature)** — needed to test combat with special abilities
4. **HP bar + AP pips** — needed for combat screen
5. **Status icons** — needed once special abilities work
6. **Silhouettes** — needed for creature selection screen
7. **Remaining creatures** (Dog, Squirrel, Skunk)
8. **Freezer UI** — needed for laboratory
9. **Backgrounds** — lowest priority, can use solid colors initially
10. **App icons** — only needed for launch

---

## Body Parts (25 assets)

### Naming Convention
```
[animal]-[part].png
[animal]-[part]@2x.png
```

### Canvas Positioning (IMPORTANT)

All body parts are 160×160px (320×320px @2x). Position art consistently:

| Part | Position in Canvas |
|------|-------------------|
| **Torso** | Centered. Neck at top edge, tail-attachment at bottom-center. |
| **Head** | Centered horizontally. Neck-attachment at bottom edge. |
| **Arm** | Left side of canvas. Shoulder-attachment at upper-left corner area. |
| **Leg** | Left side of canvas. Hip-attachment at upper-left corner area. |
| **Tail** | Centered horizontally. Attachment point at top-center. Extends downward. |

---

### RAT (draw first!)

| # | Asset | Filename | Visual Notes |
|---|-------|----------|--------------|
| 1 | Rat Torso | `rat-torso.png` | Scrawny, visible ribs. Pale grayish-pink. Arm stitches in **upper third** of sides. |
| 2 | Rat Head | `rat-head.png` | Pointy snout, beady red/black eyes, yellowed teeth. Small ears (can point up — they're small). |
| 3 | Rat Arm | `rat-arm.png` | Thin, scraggly, tiny claws. Shoulder stitches upper-left. |
| 4 | Rat Leg | `rat-leg.png` | Thin, bony, small naked feet. Hip stitches upper-left. |
| 5 | Rat Tail | `rat-tail.png` | Long, naked/hairless, pink, slightly gross. Attachment at top. |

---

### CAT (draw second — has special abilities)

| # | Asset | Filename | Visual Notes |
|---|-------|----------|--------------|
| 6 | Cat Torso | `cat-torso.png` | Sleek, flexible. Dark gray/black fur. Arm stitches in **upper third** of sides. |
| 7 | Cat Head | `cat-head.png` | **Ears pointing sideways/back** (not straight up — leaves room for future horns). Slit yellow/green eyes, smug, whiskers. |
| 8 | Cat Arm | `cat-arm.png` | Paw with **visible extended claws** (for Cat Scratch Fever). |
| 9 | Cat Leg | `cat-leg.png` | Athletic, springy, ready to pounce. |
| 10 | Cat Tail | `cat-tail.png` | Long, curved upward, fluffy or sleek-tipped. |

---

### DOG (has healing ability)

| # | Asset | Filename | Visual Notes |
|---|-------|----------|--------------|
| 11 | Dog Torso | `dog-torso.png` | Sturdy, barrel-chested. Brown/tan/gray fur. Arm stitches **upper third**. |
| 12 | Dog Head | `dog-head.png` | **Floppy ears** (hanging down, not up). **Tongue visible/lolling** for Lick It Better. Friendly-ish. |
| 13 | Dog Arm | `dog-arm.png` | Stocky paw, fur tufts. |
| 14 | Dog Leg | `dog-leg.png` | Strong, sturdy. |
| 15 | Dog Tail | `dog-tail.png` | **Wagging position** (curved/swoosh), fluffy. |

---

### SQUIRREL (has evasion ability)

| # | Asset | Filename | Visual Notes |
|---|-------|----------|--------------|
| 16 | Squirrel Torso | `squirrel-torso.png` | Small, compact, slightly hunched. Reddish-brown or gray. Arm stitches **upper third**. |
| 17 | Squirrel Head | `squirrel-head.png` | **Huge paranoid eyes**, small round ears (to sides, low), prominent front teeth, puffy cheeks. |
| 18 | Squirrel Arm | `squirrel-arm.png` | Small with tiny grabby claws. |
| 19 | Squirrel Leg | `squirrel-leg.png` | **Strong back legs** for climbing/jumping. |
| 20 | Squirrel Tail | `squirrel-tail.png` | **HUGE and fluffy** — iconic bushy tail, nearly fills canvas. |

---

### SKUNK (has AP debuff ability)

| # | Asset | Filename | Visual Notes |
|---|-------|----------|--------------|
| 21 | Skunk Torso | `skunk-torso.png` | Stocky, **white stripe down the back** (V-shape from shoulders). Black fur. Arm stitches **upper third**. |
| 22 | Skunk Head | `skunk-head.png` | White V-stripe on forehead, small beady eyes, pointy snout. Ears small and to sides. |
| 23 | Skunk Arm | `skunk-arm.png` | Short, stocky with digging claws. |
| 24 | Skunk Leg | `skunk-leg.png` | Short and sturdy. |
| 25 | Skunk Tail | `skunk-tail.png` | **Big, raised, fluffy** — "about to spray" pose. White stripe. |

---

## Silhouettes (5 assets)

Full creature silhouettes for creature selection screen. Wild animals (normal, not Frankenstein).

**Dimensions:** 200×200px (400×400px @2x)  
**Color:** Solid `#1d1e2c` (Shadow Grey)

| # | Asset | Filename | Notes |
|---|-------|----------|-------|
| 26 | Rat Silhouette | `silhouette-rat.png` | Full rat, hunched, long tail visible |
| 27 | Cat Silhouette | `silhouette-cat.png` | Stalking/hunting pose |
| 28 | Dog Silhouette | `silhouette-dog.png` | Alert stance, ears up |
| 29 | Squirrel Silhouette | `silhouette-squirrel.png` | On hind legs, bushy tail prominent |
| 30 | Skunk Silhouette | `silhouette-skunk.png` | Tail raised warning pose |

---

## Status Effect Icons (7 assets)

**Dimensions:** 32×32px (64×64px @2x)  
**Style:** Simple, bold, readable small. Sketchy lines matching body parts.

| # | Asset | Filename | Visual |
|---|-------|----------|--------|
| 31 | Poison/DoT | `icon-dot.png` | Dripping blood drops OR green poison bubbles |
| 32 | Defense Up | `icon-def-up.png` | Shield with up-arrow. Honeydew (#dff8eb) tint. |
| 33 | Defense Down | `icon-def-down.png` | Cracked shield OR down-arrow. Dusty Taupe (#96897b). |
| 34 | AP Down | `icon-ap-down.png` | **Stink cloud** (for Skunk). Sickly yellow/green. |
| 35 | Evasion | `icon-evasion.png` | Speed lines / motion blur OR ghostly figure |
| 36 | Healing | `icon-heal.png` | Heart OR bandage cross. Honeydew (#dff8eb). |
| 37 | Accuracy Down | `icon-accuracy-down.png` | Dizzy swirl OR crosshair with X |

---

## UI Elements (6 assets)

| # | Asset | Filename | Size | Notes |
|---|-------|----------|------|-------|
| 38 | Card Frame | `ui-card-frame.png` | 200×280px | Torn edges, stitching border. Transparent interior (~180×200px content area). |
| 39 | HP Bar Frame | `ui-hp-bar-frame.png` | 200×24px | Just border. Gothic/cracked style. |
| 40 | HP Bar Fill | `ui-hp-bar-fill.png` | 200×24px | Optional texture pattern. Honeydew base. |
| 41 | AP Pip Active | `ui-ap-active.png` | 24×24px | Full/lit action point. Cherry Rose (#9e1946). |
| 42 | AP Pip Spent | `ui-ap-spent.png` | 24×24px | Empty/dark point. Shadow Grey (#1d1e2c). |
| 43 | Freezer | `ui-freezer.png` | 320×120px | 3 compartments. Jars or specimen drawers. Frost effects optional. |

---

## Backgrounds (2 assets)

**Dimensions:** 750×1334px (1500×2668px @2x)  
**Format:** JPG acceptable

| # | Asset | Filename | Visual |
|---|-------|----------|--------|
| 44 | Laboratory | `bg-laboratory.png` | Mad scientist lab: jars, bubbling equipment, operating table, dim lighting |
| 45 | City Biome | `bg-city.png` | Urban alleyway: dumpsters, fire escapes, graffiti, night/dusk |

---

## App Icons (2 assets)

| # | Asset | Filename | Size | Notes |
|---|-------|----------|------|-------|
| 46 | App Icon | `icon-app.png` | 1024×1024px | No transparency. Stitched creature head or lab motif. |
| 47 | Favicon | `favicon.png` | 32×32px | Simplified app icon |

---

## Color Palette Reference

| Color | Hex | Use |
|-------|-----|-----|
| Honeydew | `#dff8eb` | Health, success, positive |
| Dusty Taupe | `#96897b` | Neutral, secondary, borders |
| Cherry Rose | `#9e1946` | Danger, actions, accents |
| Shadow Grey | `#1d1e2c` | Dark surfaces, shadows |
| Prussian Blue | `#020122` | Deepest background |

---

## Quick Start Checklist

### Phase 1: Playable Combat (11 assets)
```
□ rat-torso.png
□ rat-head.png
□ rat-arm.png
□ rat-leg.png
□ rat-tail.png
□ ui-card-frame.png
□ cat-torso.png
□ cat-head.png
□ cat-arm.png
□ cat-leg.png
□ cat-tail.png
```

### Phase 2: Combat UI (6 assets)
```
□ ui-hp-bar-frame.png
□ ui-ap-active.png
□ ui-ap-spent.png
□ icon-dot.png
□ icon-heal.png
□ icon-ap-down.png
```

### Phase 3: Full MVP (30 remaining)
```
□ dog-torso.png, dog-head.png, dog-arm.png, dog-leg.png, dog-tail.png
□ squirrel-torso.png, squirrel-head.png, squirrel-arm.png, squirrel-leg.png, squirrel-tail.png
□ skunk-torso.png, skunk-head.png, skunk-arm.png, skunk-leg.png, skunk-tail.png
□ icon-def-up.png, icon-def-down.png, icon-evasion.png, icon-accuracy-down.png
□ silhouette-rat.png, silhouette-cat.png, silhouette-dog.png, silhouette-squirrel.png, silhouette-skunk.png
□ ui-freezer.png, ui-hp-bar-fill.png
□ bg-laboratory.png, bg-city.png
□ icon-app.png, favicon.png
```

---

## Asset Count Summary

| Category | Count |
|----------|-------|
| Body Parts | 25 |
| Silhouettes | 5 |
| Status Icons | 7 |
| UI Elements | 6 |
| Backgrounds | 2 |
| App Icons | 2 |
| **Total** | **47** |

---

## File Delivery

### Folder Structure
```
/assets
  /body-parts
    rat-torso.png
    rat-torso@2x.png
    ...
  /silhouettes
  /icons
  /ui
  /backgrounds
```

Save to shared folder with exact filenames. Files drop directly into `/public/assets/`.

---

*Happy drawing! 🎨🧵*

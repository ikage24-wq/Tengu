# Life skills: the expansion (2026-11-03)

The player's picks: spots on every map, life-skill levels, crafting, and life skills as a **full
alternate path** (a character can be levelled mostly through life skills, with its own EXP and its
own best-in-slot crafted gear). And every life-skill motion redrawn, re-rigged and reanimated to
the Wind Dancer standard (CLAUDE.md). Life skills never stop being optional: hunting stays a full
path too.

## Skills and levels (`src/core/life.js`, the shared API)

Five skills, each level 1-50 with its own EXP (`char.life[skill] = { level, exp }`): **Fishing,
Gathering** (herbs, flowers, fruit, honey, wood, fibre), **Mining** (ore and gems), **Cooking**,
**Crafting**. Every action gives life EXP and some character EXP (`charExpFor(tier, kind)`, tuned
so an hour of life skills in a tier's region levels a character about as fast as an hour of hunting
there). Levels make the skill better (faster, more and rarer finds, better crafts) and open the
next tier: `TIER_LEVEL = [, 1, 12, 24, 36]`.

### Levels in play (built)
- Every gather, mine, catch and dish gives life EXP and character EXP (shown over the hero). A
  tier's own spots pay best; spots a tier below what the skill has opened pay half.
- A spot or recipe of a richer region (`tier`, or its own `lv`) needs the skill's level; below it the
  game says which level it needs.
- Each level past 1: 1.2% quicker, 1.2% likelier to find one more (a second fish, an extra serving),
  2% better rare chances, spots rest 0.6% less, a bite's window 0.6% longer. A tool
  (`char.lifeTools[skill]`, an item with `life: { skill, speed, yield, rare }`) adds its own.
- Character EXP: an hour of a tier's life actions pays 0.9-1.05x an hour of hunting there
  (tests/life.test.js), by the hero's level, capped at the tier's top level.
- The Life Skills window (G, and its menu button) shows each level, EXP, the next level and the tool.

## Regions, tiers and materials (shared names: every builder uses these ids)

| Tier | Maps (level) | Ore | Gem (rare from ore) | Wood | Fibre |
|---|---|---|---|---|---|
| 1 | meadow1, meadow2, trainfield, canyon, dawnbeach (1-12) | `copper_ore` | `rose_quartz` | `oak_log` | `cotton` |
| 2 | woods, glade, hollow_gate, ruins (11-24) | `iron_ore` | `amethyst` | `maple_log` | `silkmoss` |
| 3 | shrine, ridge, cave, springs (23-38) | `silver_ore` | `sapphire` | `cedar_log` | `lotus_fiber` |
| 4 | peak, sky, starfall, bossroom (36-50) | `mithril_ore` | `starstone` | `skywood_log` | `cloud_cotton` |

Each region also gets its own herbs, flowers, fruit and fish for cooking (the builder of the spots
names them), one night-only rare per region, and spots that fit each zone (ore in cliffs and caves,
wood in woods, herbs in meadows, fish where there's water; fishing nooks no monster walks to).
Towns get a fishing nook where there is water.

## Crafting

A craft bench in every town, near the plaza. Recipes by tier and Crafting level, from the
materials above plus monster drops:
- **Gear:** an Artisan line for every job at Lv 10, 20, 30, 40 and 50, a little better than shop and
  drop gear of the same level, with a quality roll that rises with Crafting level (the alternate
  path's best-in-slot).
- **Potions and food helpers** from herbs; **polishing stones** for Tora's forge; small
  accessories (rings, earrings, charms) with life-skill or combat stats; **tools** (rod, pick,
  sickle, axe) that raise a life skill's speed or yield.

## Motion (the Wind Dancer standard)

Every life action is drawn as what it is, with anticipation, follow-through, a held beat and idle
life: gathering (`gather`, kneel and pick), picking fruit (`pluck`, reach up on tiptoe), mining
(`mine`, a pickaxe swung with weight, sparks), chopping wood (`chop`, new: an axe swing into a
trunk, chips flying), gathering fibre (`pluck`), fishing (cast, wait with idle life, bite, a tug of
war reel, the catch held up), cooking at the stove (`cook`, stir, toss, taste) and crafting at the
bench (`craft`, hammer, file, hold it up). The spots themselves are animated (swaying herbs,
glinting ore, bobbing floats, smoke from the stove, sparks on the anvil) and rest visibly after
use.

Built (part 4): the moves are in `render/life-moves.js` (`gather`, `pluck` for fruit and honey,
`reap` for fibre with a sickle, `mine`, `chop`, the fishing set `fishcast` / `fishwait` /
`fishperk` / `fishbite` / `fishcatch` / `fishmiss`, `cook`, `craft`), each holding its own tool
(`render/tools.js`: pickaxe, axe, sickle, basket, rod, ladle, hammer, file). The kind of spot picks
the move (`LIFE_BY_KIND` in `render/life.js`), whatever `KINDS[kind].move` says, and the move fits
whatever length the world gives it. Cooking plays when a dish is cooked; the craft bench plays its
move with `playLifePose(world, 'craft', { at: benchX, find: itemId })` (`world/lifepose.js`). The
spots (`render/gathering.js`) are drawn per kind and tier (copper, iron, silver, mithril; oak,
maple, cedar, skywood; cotton, silkmoss, lotus, cloud cotton), from a spot's `tier`, what it gives,
or its region; dev sheet `tools/spots-sheet.html`.

## The player's choices (2026-11-03)
- Crafted gear: a little better than drop and shop gear of the same level, with a quality roll
  that rises with Crafting level; hunters still get good gear from drops and bosses.
- No minigames: walk up, press Up, watch the motion. Levels and tools make it faster and richer.
- Built in four parts (spots on every map, levels in play, crafting, motion), each shown to the
  player with pictures before moving on.

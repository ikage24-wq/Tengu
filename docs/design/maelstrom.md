# Maelstrom

The Tide Mage's damage path at level 30 (2026-11-09), after Elowen's trial (break 20 Gem Mimics in
the Crystal Cave). Her sister path is the healer, the Tidecaller (docs/design/tidecaller.md). Held to the Tide Mage's standard
(docs/design/tide-mage.md).

## Who she is

The Tide Mage who called up the deep: crushing pressure, vortices, and the glowing things of the
abyss. Heavier and more forceful than the Tide Mage: grounded stances, power held and then let go.
Staff only, drawn exactly as equipped, always forward of her so its head never crosses her face.

- **Colour:** midnight navy water lit from inside, glowing aqua, a magenta accent.
- **Shapes, hers alone:** spears of pressurised water, spinning vortices and funnels, beams, spirals,
  glowing motes of plankton. Her water uses the same living-water kit as the Tide Mage's (rippling
  edges, long currents), in the deep palette.

## Basic attacks (world/melee.js, `PATH_COMBOS.maelstrom`, `PATH_VARIANTS.maelstrom`)

1. A spear of water through two (`msspear`), a pressure jet (`msjet`), or two glowing bubbles that
   go off (`msglow`).
2. A vortex bolt (`msbolt`), two crossing spears (`mscross`), or a slashing current (`msslash`).
3. Finisher: a vortex opened ahead that drags them in and bursts (`msopen`), a high-pressure beam
   through the line (`msbeamfin`), or a column of black water slammed down (`msslam`).

Command moves: up + attack drives a spiral of black water up (`msspiral`); in the air she hurls
spears down (`msairspear`); out of a run she dives through a wave (`msdash`). Her spears and bolts
leave from her hands, chest high, so they always fly level.

## Depth (her gauge)

Her hits build it; it drains once the fighting stops. The deeper it runs, the harder she hits (up
to a quarter more). Full (the Abyss): every hit opens a small vortex on what it struck that shreds
it three times more (one vortex per monster at a time). The finisher spends it.

## Skills

Her own: **Tidal Lance** (a great piercing lance), **Undertow** (a vortex at range that drags and
shreds), **Hydro Cannon** (a braced, held beam), **Depth Charge** (three glowing charges that go off
together), **Deep Sea Mastery** (passive), and **Maelstrom** (finisher: a whirlpool across the
screen).

The Tide Mage's, played her own way (`paths.maelstrom` in each skill; same numbers): Bubble Shield
is **Abyss Shell**, Tide Pool **Glowing Pool**, Riptide **Black Current**, Tidal Wave **Black Wave**,
Flow **Deep Flow**, Wave Rider **Deep Dive**, Great Wave **Black Tide**.

## Where things live

Moves: render/moves.js (`ms*`). Effects: tools/fx-art.js (`ms*`, `python tools/build-fx.py --only
ms`), drawn by render/tide-fx.js. Aura: render/aura.js `depthAura`. Sounds: tools/build-fight.py
(`ms*`). Icons: render/icons/skills.js. Trial: data/quests.js `mage_trial`, scenes in
data/scenes.js.

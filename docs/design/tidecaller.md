# Tidecaller

The Tide Mage's healer path at level 30 (2026-11-09), after Elowen's trial (break 20 Gem Mimics in
the Crystal Cave; the same trial as the Maelstrom's, the path is picked after it). The party's
healer: she takes the healer's seat in the dungeon finder, and the finder brings in Tidecallers
(Tide Mages before 30) to heal. Held to the Tide Mage's standard (docs/design/tide-mage.md).

## Who she is

The Tide Mage the moon answers. Graceful and flowing, sung rather than hurled: she sways, turns and
conducts the water with long sweeping gestures, up on her toes, her free hand as much a part of each
spell as the staff. Staff only, drawn exactly as equipped, always forward of her so its head never
crosses her face.

- **Colour:** seafoam and mint water inked in deep teal, pearl white, pale moon gold. Her foam is
  white touched with mint, never cream.
- **Shapes, hers alone:** pearls, moon crescents, scallop shells, rising bubbles, raindrops, soft
  rings and columns of light. Her water uses the same living-water kit as the Tide Mage's (rippling
  edges, long currents), in her palette; her light is soft and warm, never a flash.

## Basic attacks (world/melee.js, `PATH_COMBOS.tidecaller`, `PATH_VARIANTS.tidecaller`)

1. A pearl of water flicked off the staff (`tcpearl`), two shells skipped along the floor
   (`tcshell`), or a shower of drops stirred down on them (`tcdrops`).
2. A ribbon of water swept round in a dancer's turn (`tcribbon`), a crescent wave (`tccrescent`), or
   a chain of bubbles (`tcchain`).
3. Finisher: a pillar of moonlight called down, water winding up round it (`tcpillar`), a spring
   welling up under them (`tcspring`), or a great crescent wave rolled through the line (`tcwave`).
   All three mend the party round her a little.

Command moves: up + attack calls a spring up under whatever flies (`tcrise`); in the air she rains
drops down from a hang (`tcairdrops`); out of a run she glides in on a ribbon of foam (`tcglide`).

## Moonsong (her gauge)

Her hits and her heals build it; it fades once the fighting stops. The fuller it runs, the stronger
she heals (up to a third more). Full (Spring Tide): her heals leave a bubble on everyone they reach
(8% of their HP, 6 s), every basic attack that lands drops a healing droplet on whoever in the party
is hurt most, and a ring of moonlight turns at her feet. The finisher spends it.

## Skills

Her own: **Healing Rain** (a rain cloud over the party, mending every second), **Spring Surge** (a
burst heal round her that throws monsters back), **Moon Blessing** (a long party buff: defence, less
from every hit, faster MP), **Tide's Return** (brings a fallen party member back up), **Moonfall**
(a great crescent falls on them; its light mends the party), **Tidesong** (passive: stronger heals,
faster MP, steadier magic), and **Moon Tide** (finisher: the tide floods the screen, mending
everyone and bringing the fallen back).

The Tide Mage's, played her own way (`paths.tidecaller` in each skill; same numbers): Bubble Shield
is **Pearl Shell**, Tide Pool **Moon Pool**, Riptide **Moon Pull**, Tidal Wave **Silver Wave**, Flow
**Lunar Flow**, Wave Rider **Foam Glide**, Great Wave **Silver Tide**.

Her damage is tuned to the support share (tools/tune.mjs), a bit under the damage jobs; she makes
up for it in healing.

## Where things live

Moves: render/moves.js (`tc*`). Effects: tools/fx-art.js (`tc*`, `python tools/build-fx.py --only
tc`), drawn by render/tide-fx.js. Aura: render/aura.js `moonAura`. Sounds: tools/build-fight.py
(`tc*`). Icons: render/icons/skills.js. Healer bots: world/dungeon.js `healerTurn` (her moves and
water when the healer is a Tidecaller).

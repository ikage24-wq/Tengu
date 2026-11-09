# Tide Mage

The new Mage (2026-11-09), made from scratch after the old Mage line was wiped (2026-11-08). The
player picked her from four pitches (Gravity, Ink Brush, Tide, Bloom). The one standard she is
held to is high quality.

## Who she is

A mage of the sea. All her magic is water out of the head of her staff, worked with her whole
body: she coils and cracks a whip, bowls a wave along the floor, raises a great wave over her head
and brings it down. She uses staffs only (wands are to be deleted), and the staff is always drawn
exactly as equipped: the water comes off its head, nothing is added to it.

She has some support (a shield and a heal for the party) and branches at level 30 into a healer
path (the Tidecaller, docs/design/tidecaller.md) or a ranged damage path (the Maelstrom,
docs/design/maelstrom.md).

- **Colour:** deep sea teal inked in navy, white foam, a coral accent.
- **Shapes, hers alone:** curling wave crests capped with foam, round bubbles with a white glint,
  spray droplets, ripple rings.
- **Stat:** INT. Every blow is a magic hit.

## Basic attacks (world/melee.js, `PATH_COMBOS.tidemage` and `PATH_VARIANTS.tidemage`)

Three steps, each drawn from a pool so holding attack never repeats a string:

1. A whip of water cracked out level (`tmwhip`), three bubbles blown off the staff that pop
   (`tmbubbles`), or the staff driven into the floor to throw a splash up (`tmsplash`).
2. A wave sent rolling along the floor (`tmroll`), a double whip (`tmtwin`), or a geyser burst up
   under them (`tmgeyser`).
3. Finisher: a great curling wave crashed down the line (`tmcrash`), a whirlpool spun round her
   that drags them in and flings them out (`tmwhirl`), or a wave she rides in on (`tmsurf`).

Command moves: up + attack spouts water up under whatever flies (`tmspout`); in the air she pours a
waterfall down from a hang (`tmfall`, the second a big one); out of a run she surfs in on a wave.

## Tide (her gauge)

Her water that lands builds it, and so do her heals and shields; it ebbs once the fighting stops.
The fuller it runs, the bigger her waves (up to a third larger, drawn and hit alike). Full (High
Tide): every basic attack sends a little wave rolling after it, and she and the party near her
mend 1% of their HP a second. The finisher needs it full and spends it.

## Skills (data/skills.js)

- **Bubble Shield** (support): a bubble round her and the party that soaks up blows (12 s, 30 s
  cooldown).
- **Tide Pool** (support): a pool on the floor; everyone near mends every second (8 s, 24 s
  cooldown).
- **Riptide:** a current drags the monsters round her together, then the water crashes down on them.
- **Tidal Wave:** a great wave rears up and rolls through every monster ahead.
- **Flow** (buff): faster casting and harder magic for a minute.
- **Wave Rider** (movement): she surfs forward on a wave, untouchable on it.
- **Ocean Heart** (passive, grows with level): truer, steadier magic and faster MP.
- **Great Wave** (finisher): on full Tide, she rises on the swell and a giant wave sweeps the
  screen, mending her and the party as it passes.

## Where things live

- Moves: render/moves.js (`tm*`). Effects: tools/fx-art.js (`tm*`), built with
  `python tools/build-fx.py --only tm` (the project's own Electron, tools/draw-fx-electron.cjs,
  where Playwright isn't installed), drawn by render/tide-fx.js. Aura: render/aura.js `tideAura`.
- Sounds: tools/build-fight.py (`tm*`), cut from the Sonniss bundles (assets/audio/SOURCES.md).
- Icons: render/icons/skills.js. Instructor: Elowen (data/npcs.js), her scene in data/scenes.js.

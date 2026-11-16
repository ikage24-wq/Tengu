# Moon Moth

The new Thief (2026-11-16), made from scratch after the Archer and Thief lines were wiped the same
day. The player picked her from four pitches (Venom Fang, Ember Rogue, Gilded Cutpurse, Moon Moth)
and asked for a smaller first pass: her basic attacks, her gauge and four skills, checked in play
before the other four skills and the two level-30 paths are made. Held to the Tide Mage's standard.

## Who she is

A night thief who fights in a cloud of moths. Quick, light on her feet, a dagger in each hand: she
flicks and spins through the pack, shadow-steps through a flurry of moth wings and comes out the
far side cutting. Her moths gather round her as the fight goes on, and under a full moon they pour
down on everything.

- **Weapons:** daggers, drawn exactly as equipped, one in each hand (the off hand holds a copy of
  the same dagger). The dagger items are real knives again (they were chakrams for the Wind Dancer).
- **Colour:** lilac and moon silver, inked in deep dusk violet, with the warm gold of a moth's eye
  spot as the accent.
- **Shapes, hers alone:** spirit moths (round petal wings glowing pale at the root with a little
  gold crescent moon on each, short soft tails, a small round body, curled feelers with bead tips;
  cute, never realistic: real moth anatomy, eye spots, crowded swarms and speck dust read as gross,
  2026-11-16, so a few moths at a time), a light sprinkle of sparkles that drifts slowly down (never up, like the other jobs' motes),
  blooms of moonlight, and lilac crescents where her daggers cut (the shared crescent slash in her
  colours). No plain puffs: her bursts are moths, light and dust, and her great wings crumble into
  dust rather than fading (polish pass, 2026-11-16).
- **Stat:** LUK. Instructor: Vex, in Pastel Harbor.

## Basic attacks (world/melee.js, `PATH_COMBOS.moonmoth` and `PATH_VARIANTS.moonmoth`)

Three steps, each drawn from a pool so holding attack never plays the same string twice in a row:

1. A quick flick across the body with the front dagger (`mmflick`), or two stabs, one from each
   hand (`mmtwin`).
2. A pirouette with both daggers out, cutting all round (`mmspin`), or a rising cut that flicks the
   monster up (`mmhook`).
3. Finisher: both daggers crossed over her chest, then thrown wide like wings opening, a burst of
   moths off the cut (`mmwings`); or a little flutter up and a diving cross-cut (`mmswoop`).

Command moves: up + attack, a rising double cut that follows them up (`mmrise`); in the air, two
fluttering cuts that hold her up (`mmaircut`); out of a run, she breaks into moths and cuts through
the line (`mmstep`, the same move as Moth Step).

## Quick (2026-11-16, the player: "kinda slow to be a thief")

Both thieves were sped up: basic steps of about 0.22-0.32 s and finishers of about 0.44 s, every
step a hit from each dagger (the same damage split between the two), skills about a third quicker
and the finishers a little shorter. Quick feet: she runs 10% faster (the player only, `THIEF_FEET`;
the crowd's thieves walk with their groups), and her **flutter jump**: Jump again in the air springs
her on the way she holds with a tiny hop, in a burst of moths, once per jump (mostly forward: a
taller second jump reached ledges the maps' ropes are for).

## Moondust (her gauge)

Her cuts that land build it, a third again for each extra monster a blow catches; it settles once
the fighting stops. The fuller it runs, the more she crits (up to a fifth more often). Full (Full
Moon): every basic attack that lands sends a moth fluttering off to nip another monster nearby, and
Midnight Swarm is ready. HUD: a moon icon. Aura: wing dust drifting down round her as it builds;
full, three moths circle her.

## Skills (data/skills.js)

- **Moth Step** (movement): she breaks into a cloud of moths, re-forms past them turned round (she
  turns while still moths) and cuts whatever she passed through, a backstab on anything facing
  away. Nothing touches her while she's moths.
- **Wing Flurry:** six cuts in a blur, both daggers, wing dust whirling off them; the last cut
  throws them back.
- **Moth Swarm:** she flings both hands forward and a swarm pours out ahead, nibbling through every
  monster in a line.
- **Night Eyes** (passive, grows with level): truer cuts, more crits.
- **Midnight Swarm** (finisher): on a full Moondust, she springs up as a full moon rises behind her,
  throws her arms wide, and the swarm pours down across the screen through every monster.

Her level-30 paths, after Vex's trial (Lamias at the Hot Spring Pools): the **Eclipse**, the
boss-killer (docs/design/eclipse.md, built 2026-11-16), and the **Silkweaver**, the controller (to
make). Still to make: four more Moon Moth skills (a dodge buff, a blinding powder, a lure, a feint)
and a thief armour set (there is none yet, so thieves fight in plain gear).

## Where things live

- Moves: render/moves.js (`mm*`). Effects: tools/fx-art.js (`mm*`), built with
  `python tools/build-fx.py --only mm`, drawn by render/moth-fx.js. Aura: render/aura.js `mothAura`.
- Sounds: tools/build-fight.py (`mm*`), cut from the Sonniss library. Icons: render/icons/skills.js.
- Instructor: Vex (data/npcs.js), her scene in data/scenes.js.

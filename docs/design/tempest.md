# Tempest

The Thunderguard's damage path at level 30 (2026-11-09), after Brann's trial. The storm let loose:
where the Thunderguard winds the charge up and lets it go in one crack, the Tempest never stops
moving. He is speed itself, red lightning. Held to the Tide Mage's standard. (He replaces the
Berserker as the Warrior line's damage path; the Stormwall, docs/design/stormwall.md, is the tank.)

## Who he is

A fighter who has become the lightning bolt: light on his feet, always leaning into the next blow,
his blade drawing long whipping streaks. Where the Thunderguard plants and strikes, the Tempest
flashes through: a cut, a blink, a cut from the other side. Each blow leaves a red afterimage of him
behind for a beat. Sword, axe and spear, each drawn exactly as equipped; fist under the chin, an
upright blade behind his head, as the whole line.

- **Colour:** red lightning. A white-hot core, pale rose, crimson, deep wine, inked in near-black
  plum; a thin gold for sparks. Storm charcoal for the clouds.
- **Shapes, his alone:** long whipping streaks (cut paths drawn as lightning ribbons), flash-steps
  (a jagged red bolt from where he was to where he is), afterimages of himself, slanting rain cut by
  the wind, crimson speed lines, and the line's crescent slash in red.
- **Feel:** a flurry. Short wind-ups, follow-throughs that roll straight into the next blow, a
  forward lean, footwork that skims. Finishers end with him somewhere else.

## Basic attacks

Four steps, each from a pool of three:

1. An instant cut that streaks (`tpstreak`), a backhand-forehand double (`tpdouble`), or a flash-step
   through one with a cut on the way (`tpflash`).
2. A spinning heel-turn cut (`tpturn`), a rising slash that throws them a little and follows them up
   (`tplift`), or three jabs so quick they blur (`tpjabs`).
3. An X of two streaks (`tpcross`), a low sweep that cuts their legs and kicks red sparks off the
   floor (`tpsweep`), or a lunge that drives a lightning streak through the line (`tplunge`).
4. Finisher: a blink behind the farthest one and a cut back through all of them (`tpblink`), a
   whirlwind of red streaks round him (`tpwhirl`), or a leap and a diving cut that lands as a red bolt
   (`tpdive`).

Command moves: up + attack, a rising cut chained with a second up through them (`tpskyward`); in the
air, three fast cuts then a red dive (`tpaircut`, `tpairfall`); out of a run, a flash-step clean
through the line (`tpdash`); down + attack, a skidding slam that throws sparks (`tpslam`).

## Velocity (his gauge; internally `gale`)

His hits build it, quickly, and it falls fast once he stops hitting (two seconds' grace). The fuller
it runs, the faster he swings (up to a quarter quicker). Every blow at half or more leaves a red
afterimage of him that strikes again a beat later, lighter. Full (Lightspeed): the afterimage hits as
hard as he does, each finisher flash-steps him to the far side of the pack, and Red Thunder is ready.

## Skills

His own:
- **Flash Step** (movement): a red bolt from where he was to where he is, cutting everything between;
  can be pressed twice in a row.
- **Thousand Cuts:** a blur of a dozen streaks in front of him in a second, the last one huge.
- **Crimson Arc:** a wide red crescent of lightning flung down the line, then a second back the
  other way.
- **Afterimage** (buff): for a while three afterimages of him follow his every swing.
- **Storm Blade** (passive, grows): faster, harder blows, more critical hits.
- **Red Thunder** (finisher, full Velocity): he blinks from monster to monster across the screen,
  striking each, the air filling with red streaks where he's been, then reappears in the middle and a
  red bolt falls on all of them.

The Thunderguard's, played his own way (same numbers; `paths.tempest`): Thunder Rush is **Red Rush**
(a streak, not a charge), Storm Cleave **Crimson Cleave**, Cyclone Edge **Red Cyclone** (faster,
tighter), Lightning Rod **Red Spears** (bolts that slant in with the wind), Thunderclap **Warcry**
(a crack of red thunder: a damage dealer's taunt is short), Static Guard **Afterburn** (a blur of
speed: he takes less and moves faster), Thunderfall **Skyfall** (a red bolt from the sky).

## Where things live

Moves: render/moves.js (`tp*`). Effects: tools/fx-art.js (`tp*`), drawn by render/storm-fx.js.
Afterimages: render/scene.js. Aura: render/aura.js `galeAura`. Sounds: tools/build-fight.py (`tp*`).

# Thunderguard

The Warrior remade (2026-11-09; the job's id stays `warrior`, its name is Thunderguard). The player
picked the storm from four pitches (Stonewarden, Forgeborn, Thunderguard, Lionheart), asked for it
to be made to the Tide Mage's standard ("don't be cheap about it, go full out"), and for the old
Warrior's skills and moves to be wiped once it's done. He is both a damage dealer and a tank, and
branches at level 30 into a tank path or a damage path (to be made; Paladin and Berserker stand in
until then).

## Who he is

A warrior who fights inside a thunderstorm of his own making. Fast build-ups and sudden explosive
strikes: he winds the charge into the blade, then lets it go in one crack. Grounded, wide stances,
quick feet; every finisher ends in a thunderclap. Sword, axe and spear, each drawn exactly as
equipped (the storm lives in his moves and effects, never on the weapon); the fist stays under his
chin and an upright blade passes behind his head, as the whole Warrior line does.

- **Colour:** storm blue and deep storm navy, white-gold lightning with a white-hot core, sky-blue
  static.
- **Shapes, his alone:** thick forked anime bolts (inked, banded, with a soft glow), thunderclap
  rings, static sparks and crackles, storm clouds, and the line's shared crescent slash in his storm
  colours with crackle along its edge.
- **Stat:** STR.

## Basic attacks (world/melee.js, `PATH_COMBOS.warrior`, `PATH_VARIANTS.warrior`)

Four steps, each from a pool:

1. A snapping cut off the shoulder (`tgcut`), a double flick (`tgflick`), or a darting lunge that
   leaves a spark streak (`tglunge`).
2. The return cut (`tgreturn`), a shoulder check that bursts with static and dazes (`tgbash`), or a
   low sweep that crackles along the floor (`tgsweep`).
3. A full spin in a ring of static (`tgspin`), a charged thrust that fires a bolt through the line
   (`tgdrive`), or a rising cut that lifts them on a column of lightning (`tgrise`).
4. Finisher: a leaping overhead that calls a bolt down on the impact (`tgstrike`), a two-handed
   cleave into the floor and a thunderclap (`tgclap`), or a spiralling uppercut into a lightning
   column (`tgstorm`).

Command moves: up + attack, an uppercut riding a bolt (`tgskyward`); in the air, two cuts then a
plunge that lands in a lightning strike (`tgaircut`, `tgplunge`); out of a run, a lightning flash
cut (`tgflash`); down + attack, a slam and a thunderclap (`tgslam`).

## Charge (his gauge; internally `volt`)

His blows build it (faster the more one blow catches) and so do the hits he takes; it fades once
the fighting stops. The fuller it runs, the harder he hits (up to a fifth more) and the less he
takes (up to a tenth less). Full (Overcharge): every blow he lands sends lightning jumping to up to
two more monsters nearby, a static shell shocks whatever hits him, nothing knocks him back, and
Thunderfall is ready.

## Skills (data/skills.js)

- **Thunder Rush** (movement): he becomes a streak of lightning and flashes forward through them.
- **Storm Cleave:** a wound-up two-handed cleave that hurls a giant crescent of lightning down the
  line.
- **Cyclone Edge:** he spins with the weapon out, a storm whirling round him, hitting everything
  around again and again, and ends in a thunderclap that flings them.
- **Lightning Rod:** he drives the weapon into the floor and three bolts strike the monsters ahead.
- **Thunderclap** (tank): the weapon slammed flat on the floor; a thunderclap booms out, every
  monster around turns on him and is dazed, and the party around him takes less damage for a while.
- **Static Guard** (tank): a crackling shell of static wraps him: he takes much less, nothing knocks
  him back, and whatever hits him is shocked.
- **Storm Steel** (passive, grows): steadier, harder blows with every weapon.
- **Storm Body** (passive, grows): more HP and armour.
- **Thunderfall** (finisher, full Charge): he leaps up into the storm gathering overhead, hangs
  there drawing the lightning into his weapon, then falls riding a giant bolt; the floor splits
  with lightning and bolts rain round him.

## Where things live

Moves: render/moves.js (`tg*`). Effects: tools/fx-art.js (`tg*`, `python tools/build-fx.py --only
tg`), drawn by render/storm-fx.js. Aura: render/aura.js `voltAura`. Sounds: tools/build-fight.py
(`tg*`). Icons: render/icons/skills.js.

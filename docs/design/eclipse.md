# Eclipse

The Moon Moth's damage path at level 30 (2026-11-16): the boss-killer. The player picked it, with the
Silkweaver (control) as the other path, from four pitches (Eclipse, Silkweaver, Lamplighter, Atlas),
and asked for the full path in one go. Asks for Vex's trial first.

## Who she is

The Moon Moth who learned to put out the light. When the moon covers the sun the world goes dark
except for a ring of gold fire; that ring is hers. She picks one monster, marks it with a moth's eye
spot, gets behind it and ends it. Daggers, a dagger in each hand, drawn exactly as equipped.

- **Colour:** deep eclipse violet, nearly black, with the gold of the corona; silver glints.
- **Shapes, hers alone:** the eclipse (a dark disc with a gold corona flaring round it and the
  "diamond ring" flash on its rim), marks that are little eclipses (a gold sun with long rays round a
  small dark moon), dark moths with gold crescents (her version of the Moon Moth's spirit moths), and
  gold-edged dark crescents where she cuts. No eyes anywhere: gold eyeballs read as gross
  (2026-11-16).
- **Stat:** LUK. Single-target focused, with one crowd skill (Corona) for packs.

## Marks

Some of her blows leave a mark, a little eclipse, on what they hit (up to three, for 8 s): her combo's
finisher, Eye of the Night and Corona. Umbral Edge spends a monster's marks for a much harder blow;
Total Eclipse sets off every mark on the screen.

## Basic attacks (`PATH_COMBOS.eclipse`, `PATH_VARIANTS.eclipse`)

1. A low reverse-grip stab (`ecjab`), or a feint one way and a cut the other (`ecfeint`).
2. Both daggers raked across (`ecslice`), or a rising rake that lifts them (`ecrake`).
3. Finisher, marks what it hits: both daggers driven into one point as an eclipse forms
   (`ecpierce`), or a spin that throws a ring of corona round her (`ecturn`).

Command moves: up + attack, a rising cut through a gold ring (`ecrise`); in the air, two dark cuts
(`ecaircut`); out of a run, she sinks into a disc of shadow and comes out behind the line (`ecslip`).

## Umbra (her gauge)

Her hits build it, backstabs and hits on marked monsters twice as fast; it fades once the fighting
stops. The fuller it runs, the harder her crits land (up to 40% more). Full (Totality): every blow
she lands is a crit, and Total Eclipse is ready.

## Her skills

- **Shadow Step** (movement): she steps into a disc of shadow and out of one behind the nearest
  monster ahead, stabbing its back.
- **Eye of the Night:** she flicks little eclipses at the three nearest monsters: a little damage and
  a mark on each.
- **Umbral Edge:** two slow, deep stabs into one monster; every mark on it makes the second far
  harder, and spends them.
- **Corona:** she spins and a ring of gold fire flares out all round her, hitting and marking
  everything in it.
- **Umbral Mastery** (passive, grows with level): truer cuts and much harder crits.
- **Total Eclipse** (finisher): on a full Umbra, the moon slides over the sun and the screen goes
  dark but for the corona; she blinks from monster to monster stabbing each, then the diamond ring
  flashes and every mark on the screen goes off.

Her Moon Moth skills, her way: Moth Step is **Umbra Step** (dark moths with gold crescents), Wing Flurry
is **Black Flurry**, Moth Swarm is **Shadow Swarm**, Midnight Swarm is **New Moon** (a dark moon
in its corona, the dark swarm pouring down), Moth Veil is **Umbral Veil**, Dazzle Dust is **Corona
Dust**, Moonlure is **Eclipse Lantern** and Wing Feint is **Shadow Feint**.

## Where things live

Moves: render/moves.js (`ec*`). Effects: tools/fx-art.js (`ec*`), drawn by render/moth-fx.js.
Gauge, marks, combo: world/melee.js. Skills: data/skills.js. Trial: Vex's, data/quests.js
(`thief_trial`), scenes in data/scenes.js.

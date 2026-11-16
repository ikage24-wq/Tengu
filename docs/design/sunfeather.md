# Sunfeather (the Archer) and her paths, Phoenix and Songbird

The new Archer (2026-11-16), made from scratch after the old Archer line was wiped the same day.
The player picked her from four pitches (Sunfeather, Paper Crane, Bloomshot, Frostbow), asked for
the whole line at once, a bow for the job with one path on a crossbow (the Phoenix), and Kestrel as
her teacher again with a level-30 trial. Held to the Tide Mage's standard (making-a-job.md).

## Sunfeather (first job, level 5, DEX, bow; Kestrel at the Archer Lodge in Sprout Village)

A dawn archer. Her arrows are streaks of morning light that burst into little sunbirds; she skips
and hops about the field keeping her distance, cheerful and warm.

- **Weapon:** a bow, drawn exactly as equipped: it really draws, the string snaps, and the arrow on
  the string is hers (a light arrow), the bow never restyled.
- **Colour:** sunrise gold and peach, a coral blush, inked in warm rose-brown; white cores.
- **Shapes, hers alone:** light arrows (a gold streak with two little feathers at the tail), the
  rising sun (a half disc with long soft rays), sunbirds (round chubby sparrows, tiny wings, a peach
  blush: cute, never realistic), soft feathers drifting and turning as they fall.
- **Daybreak (her gauge):** shots that land build it, more for each one landed in a row; a hit on
  her halves it; it fades once the fighting stops. The fuller it runs, the faster she shoots (up to
  15%). Full (Sunrise): every basic shot that lands fans into three (two small light arrows off
  it), and Sunrise Volley is ready.
- **Basic string** (`sf*`): a snap shot, or two quick shots; a skip forward shooting mid-skip, or a
  hop back shooting as she lands; finisher, a full draw and a big sun-arrow through three, or an
  arrow that bursts into three sunbirds that peck the monsters round it. Commands: up + attack shoots
  up through them; in the air, she tips forward and shoots down; out of a run, a forward roll up
  into a shot.
- **Skills:**
  - **Sky Hop** (movement): a backflip away from them, shooting down at the top of it.
  - **Sparrow Volley:** five arrows fanned out that turn into sunbirds and fly at the five nearest.
  - **Sunbeam Shot:** a long draw, glowing brighter, and a beam of light through everything in line.
  - **Feather Rain:** an arrow loosed high; feathers of light rain down over the ground ahead.
  - **Golden Hour** (buff, 30-60 s): her shots come faster and hit harder.
  - **Pin Feather:** a heavy arrow pins the first monster in line where it stands, a gold feather in
    it, for a couple of seconds.
  - **Dawn Eyes** (passive, grows): truer shots, steadier damage, more crits.
  - **Sunrise Volley** (finisher): the sun rises behind her, she looses one great arrow straight up,
    and it bursts into a storm of light arrows raining across the screen.

## Phoenix (damage path, level 30, crossbow)

The Sunfeather who caught fire. A heavy crossbow, cranked and fired from one knee; every bolt
trails flame, and what it hits burns.

- **Colour:** flame orange and crimson with gold, inked in deep red-brown. **Shapes:** flame
  feathers (teardrop feathers that are flames), a phoenix (a cute round fire bird with a long flame
  tail), embers that rise (her fire goes up), bolts with flaming tails.
- **Kindling (her gauge):** bolts that land build it, hits on burning monsters faster. The fuller it
  runs, the harder her burns bite (up to 60% more). Full (Blaze): every bolt bursts where it lands,
  catching those beside it, and Rebirth is ready.
- **Basic string** (`ph*`): a heavy bolt, or two bolts; a cranked bolt that sets them alight, or a
  kick back and a shot; finisher, down on one knee and a huge flaming bolt through the line, or a
  spread of three burning bolts. Commands: up shoots up, air shoots down, out of a run a knee slide
  into a shot.
- **Skills:** **Flame Wing** (movement: flame wings flare and carry her forward over the ground,
  burning what she passes), **Firebrand Bolt** (a bolt through a line, setting all of them alight),
  **Ember Spread** (five burning bolts fanned at close range), **Smoulder** (a bolt that sticks in
  one monster and bursts a moment later, hard, spreading its fire to those beside it), **Phoenix
  Mastery** (passive), **Rebirth** (finisher: a great bolt into the sky, a phoenix bursts out of it
  and sweeps down across the screen in flame, then rises).
- Her versions of the Sunfeather's skills, in flame (`paths`).

## Songbird (support path, level 30, bow)

The Sunfeather who sings. Her arrows carry music; songbirds follow her and mend her party.

- **Colour:** sky blue and sunny yellow with white, inked in navy. **Shapes:** round songbirds
  (bluebirds and canaries), musical notes (round, cute), ribbons of stave lines flowing.
- **Melody (her gauge):** her shots and heals build it. The fuller it runs, the more her heals mend
  (up to a third more). Full (Chorus): every basic shot that lands also mends her and the party round
  her a little, and Grand Chorus is ready.
- **Basic string** (`sb*`): an arrow trailing notes, or a quick trill of two; a fan of three, or a
  twirl and a shot; finisher, a big arrow trailing a ribbon that bursts in notes (mending the party a
  little), or an arrow arced high that bursts in a shower of notes. Commands like hers.
- **Skills:** **Song Step** (movement: she glides forward on a ribbon of music, shooting back),
  **Healing Melody** (mends her and the party round her), **Lullaby** (an arrow trailing notes: what
  it hits falls asleep a while), **Anthem** (party buff: harder hits and steadier footing),
  **Songbird Mastery** (passive: stronger heals), **Grand Chorus** (finisher: a flock of songbirds
  sings, a wave of music mends the whole party, brings back the fallen and hits every monster ahead).
- Her versions of the Sunfeather's skills, in song (`paths`).

## Balance (tools/balance.mjs, measured 2026-11-16)

Single target / pack, as a share of the damage jobs' average: Sunfeather about 99% / 102% at 20 and
96% / 100% at 28; Phoenix about 96% / 97% at 40 and 93% / 97% at 50; Songbird about 100% / 96% at
40 and 99% / 90% at 50 at first, then brought down to the healers' 88% with the Tidecaller
(2026-11-16: about 89% / 91% at 40 and 87% / 85% at 50; tools/tune.mjs has the targets). The rain
skills cap how many of their arrows one monster takes (`rainCap`), or Feather Rain melts a lone
target.

## Where things live

Moves: render/moves.js (`sf*`, `ph*`, `sb*`). Effects: tools/fx-art.js (same prefixes), drawn by
render/sun-fx.js. Gauges and combos: world/melee.js. Skills: data/skills.js. Trial: Kestrel's
(`archer_trial`, data/quests.js), scenes in data/scenes.js.

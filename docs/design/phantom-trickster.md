# The Phantom Trickster (the Acrobat Archer's bow path; replaces the Beastmaster)

The player's picks (2026-11-02): a stage magician archer, plum and silver, mysterious and teasing,
the Illusion gauge (copies of her that shoot beside her), Grand Illusion as her finisher, and her
copies as simple see-through echoes of her own body (no rig of their own). Snow wolf, the
Beastmaster's companion, is gone. Held to the Wind Dancer standard (CLAUDE.md).

## Who she is

A stage magician with a bow: unhurried, a smirk, every shot dressed up as a trick. A flourish of the
free hand before the draw, a swirl of the cape, a "ta-da", a card flicked from her fingers, a bow
when it lands.

- **Colour:** plum and silver (red on her card hearts).
- **Shapes:** plum arrows trailing wisps of smoke, silver sparkles, playing cards and their suits,
  silver doves, puffs of plum stage smoke, a top hat.
- **Her bow:** whatever bow you equip, exactly as it looks (a job never restyles the weapon,
  CLAUDE.md); wherever it would cross her face it passes behind her head.

## How she fights

- **Her string (render/moves.js `pt*`):** a flourish then a shot, a cape swirl coming round to loose
  two, and a "ta-da" reveal loosing a big arrow, ending in a little bow. Pool: a card flick then a
  quick shot, a lazy lean firing two from the hip, a curtsy rising into a big arrow.
- **Commands:** a hand on her hip shooting up, floating with her cape billowing to shoot down, a
  smoke-step glide out of a run, and her air leap is a cape swirl with two arrows.
- **Illusion** (her gauge, internally Bond): her shots that land build it; it fades once the
  fighting stops. Half full, a see-through plum copy of her stands behind her and looses an arrow
  of its own every other shot; full, two, shooting with every arrow (a third with Hall of Mirrors).
- **Skills (ids kept; world/phantom.js):** Sleight of Hand (passive), Vanishing Arrow (a shot
  vanishes and strikes again from behind), Dove Arrow (doves fly on to the monsters round the
  target), Card Trick (a fan of three cards), Smoke Bomb (stuns everything close and loses them),
  Mirror Dodge (a copy takes a hit and pops in smoke), Showstopper (her copies hit harder), Hall of
  Mirrors (a third copy), and **Grand Illusion** (the finisher): she vanishes in smoke, a ring of
  copies appears round the screen and they all loose at once, and she reappears for a bow.

## Status (2026-11-02)

Built, replacing the Beastmaster in place (the path keeps the `beastmaster` id and its skill ids).

- Moves: ptflourish, ptswirl, ptreveal, ptcard, ptlean, ptcurtsy, ptup, ptair, ptdash, ptbomb,
  ptshow, ptillusion.
- Effects (tools/fx-art.js): `ptarrow`, `ptbig`, `pthit`, `ptsmoke`, `ptdove`, `ptcard`,
  `ptillusion`, `ptaura`, `embphantom`. Her copies are drawn by render/scene.js (`drawCopies`).
  Icons, the Illusion gauge (a top hat), sounds.
- Bots: a Phantom Trickster in the party flourishes and swirls as she shoots and casts Grand
  Illusion.
- Removed: Snow wolf (her code, drawings, sounds, title-screen walk and tests), the Wild Hunt
  barrage and its figures (the barrage engine in world/melee.js is left without a stream), and the
  old Beastmaster arrows and effects.

## Animation rework (2026-11-03)

- Her long recurve is drawn in the archers' shared clean line (`bowDraw`), held lower and canted
  forward (a showman's tilt that keeps its curled tips off her face), resting low at her hip
  between tricks; after the loose it rolls forward.
- Each opener is its own trick: Flourish sweeps the free hand out, over her head and away wide
  before the draw; Card cocks the wrist to the shoulder and flicks a card with a wink, weight
  snapping forward, before a quick shot; Lazy Lean leans right back on the back foot, the front
  heel out, and looses from the hip with the bow canted over. Cape Swirl tucks the bow low for the
  turn. Shooting up tips the bow right back (its top limb behind her head).
- The run's smoke-step glides in a long low lunge along the floor. Grand Illusion has real beats at
  both ends of her vanishing: arms flung open, a whirl, a high finger snap; then she springs out of
  the smoke with a half turn, lands arms wide ("ta-da"), and takes a deep, slow stage bow.

## Footwork and effects pass (2026-11-04)

- She moves like a showman now: a glide forward into the flourish, the cape swirl lifts her off
  the floor, the card flick skips in, the curtsy springs up into its shot, the "ta-da" leaps
  forward into the big arrow, and the lazy lean is a moonwalk backward. After a trick she clicks
  her heels in the air, and settles with a slow rise onto her toes and back (`ptFloat`). About a
  tenth quicker.
- Effects at their real size: arrows ~32 px (were ~17), cards ~16 px (were 4-5, specks), doves
  ~22 px; the hit mark ~36-50 px. Smoke Bomb's smoke is ~120 px wide (was ~30 for a 100-140 px
  reach) and a plum ring of smoke and cards rolls out to the reach (`celshockplum`). Trick puffs
  and Grand Illusion's smoke are larger too.

## Her own Acrobat skills (2026-11-04)

The Acrobat Archer's skills she keeps (same numbers) are now her own tricks (`src/data/path-skills.js`):

- **Handspring is Vanishing Act** (`ptvanish`): a flick of the hand and a cape sweep with a half turn
  and a wink, and she is gone in a puff of plum smoke (actually unseen, `world.vanish`); she steps out
  of another puff behind the monster already turning, draws as she comes round and looses back.
- **Grand Somersault is Levitation** (`ptlevitate`): the magician's levitation. A whirl of the cape,
  then she floats up and lies back flat on the air, toes pointed; at the top she swings upright and
  snaps her fingers, a giant top hat (`celpthat`) appears over the stage, flips over and pours plum
  arrows, cards and doves down on everything below while she looses up into it (the rain falls as
  her plum arrows); she drifts down into a deep stage bow.
- **Springboard is Top Hat** (`pthattrap`): she tips her hat, sweeps it off in a bow, sets it down
  brim-up and taps it twice with her bow; it rocks with a twinkle until a monster steps in, then hops
  and doves and cards burst out of it as it flings them up (`celpttrap`).
- Firework Arrow already bursts in her smoke, and the trap's spring and the buff power-up come in her
  plum now too.

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
- **Her bow:** the Acrobat Archer's short recurve in a 'phantom' finish: plum limbs, silver
  crescent-moon tips, a silver tassel from a diamond on the grip; held canted at chest height.

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

# The Candy Volcano: the levels 35-40 group dungeon (design, 2026-11-02)

The sixth group dungeon, after the Star Observatory (30-35), following the ladder plan
(docs/design/dungeon-ladder.md).

## The story

Behind the steam of Serpent Springs a mountain has grown out of sugar: the Candy Volcano, warm and
sweet and rumbling. Queen Bonbon, the sweet-toothed spirit at its heart, has been stirring it hotter
to make the biggest dessert in the world, and if it erupts the whole island gets buried in
caramel. Chef Praline, a confectioner who climbed down to the springs to escape, finds groups.

## Where

The **Sugar Trail**, off the far end of Serpent Springs (33-35). **Chef Praline** finds groups.
Entry from level 35; the finder brings players of 35-39.

## The run: a valley, then the cone

Down into the candy valley and the mines below it, then up the volcano's cone to the crater.

| # | Room | Shape | Task / gimmick | Set-piece |
|---|---|---|---|---|
| 1 | The Gumdrop Valley | A valley: high at both ends, low in the middle | **Sticky taffy** patches slow you down; gather the three sugar crystals | |
| 2 | The Licorice Mine | Long tunnels over a pit of hot caramel | **Minecarts** ride the rails across the pit (the caramel floor burns) | |
| 3 | The Candy Kitchen | A big kitchen on two floors | **Puzzle:** the cauldron's recipe (a different one each run); add candies from the dispensers, exactly; one too many spoils the pot | Puzzle room |
| 4 | The Caramel Forge | A forge hall over cooling caramel | **Mid-boss: Toffee, the Caramel Smith** | |
| 5 | The Gingerbread Ramparts | A long wall-walk with towers | **Mid-boss: Gretel, the Gingerbread Knight** | |
| 6 | The Crater | Islands of rock candy in a caramel lake | **Final boss: Queen Bonbon**, the caramel rising | |

## Monsters (levels 35-39), on a new rig

The **gummy rig** (render/mobs/candy.js): the manor rig on springs. Every move is a bounce: the
hips ride a damped spring that overshoots and settles, hops land with a jiggle that runs out through
hair, ears and props (never a squash of the body), and idle poses bob like a jelly.

- **Gummy Bear Brawler**: a gummy-bear hood, see-through jelly boxing gloves; bouncy hop-punches.
- **Cotton Candy Fairy**: a cloud of spun-sugar hair, sugar-glass wings; a puff of candy floss.
- **Lollipop Witch**: a swirl lollipop staff, a striped hat; a spiral of sugar.
- **Peppermint Spinner**: a peppermint-swirl skirt that spins; a twirling slash.
- **Chocolate Knight Girl**: chocolate armour with a foil-wrapper cape; a heavy slam.
- **Jelly Bean Ninja**: jelly bean colours, candy shuriken; throws a spread of them.

## Bosses

- **Toffee, the Caramel Smith** (Forge): a blacksmith with a caramel hammer and an anvil. Hammer
  quakes along the floor (jump), pools of hot caramel left where her sparks land (they linger and
  burn), and at half health the forge's bellows blow (everyone pushed).
- **Gretel, the Gingerbread Knight** (Ramparts): a gingerbread knight with a candy-cane lance. Lance
  charges the length of the wall (out of the lane), icing shields that block hits from the front
  (go round behind), and a frosting rain.
- **Queen Bonbon** (Crater): phase 1 sugar bombs on marked spots; phase 2 the caramel rises over the
  floor now and then (up on the rock-candy islands); phase 3 Eruption (the whole crater flares: jump)
  while bombs keep falling. Calmed at the end: she makes everyone a cake instead.

## Rewards and music

Sugar Gems (tokens), Lv 40 gear, the **Confectioner** set (a chef's toque with a cherry, a frilly
apron collar, a cape of layered cake). Music: "Sugar Rush" (Latin house, D major, nylon guitar and
trumpet) and, for the bosses, "Eruption" (B minor, brass stabs and timpani over a funk bass).

## The 2026-11-03 redraw

The sweets-folk and bosses were redrawn creature-first (render/mobs/candy.js and candyboss.js),
retiring the costumed girls on the gummy rig: a see-through gummy bear boxer, a cotton-candy sheep
with sugar-glass wings, a living lollipop in a witch hat, a peppermint whose wrapper ends are its
arms, a chocolate-bar knight with a wafer sword, and a jelly bean ninja. Toffee is a chubby beaver
smith with a caramel-dripping hammer, Gretel a gingerbread knight with a candy-cane lance and an
iced cookie shield, and Queen Bonbon a giant three-tier cake with a face, a crown and a cherry.

## The 2026-11-27 remake

The regulars were remade from scratch as new creatures of Queen Bonbon's sweet country, each on its own
copy of a blank base (render/calf/, chinchilla/, chameleon/, badger/, meerkat/; the old sweet rigs
retired), each with its own face, a themed idle act and three moves:

- **Strawberry Calf** (gummybear): a strawberry-milk calf with a gumdrop cowbell. Grazes candy flowers,
  frolics, rings its bell, practises its tiny moo. Head Butt, Hoof Stamp, Bell Clang.
- **Floss Chinchilla** (cottoncandy): fur of spun sugar; bathes in powdered sugar, nibbles sugar
  crystals, popcorns. Floss Puff (thrown), Popcorn Pop, Sugar Shake. A spoiled pot in the Candy
  Kitchen boils over into floss and one climbs out.
- **Swirl Chameleon** (lollipopwitch): its tail a swirl lollipop, its candy stripes rippling colour, two
  turret eyes. Gumdrop Fling (thrown), Tongue Snap, Tail Whip.
- **Mint Wrapper** (peppermint): kept from 2026-11-25 (a kid still in their sweet wrapper); new even blunt
  bangs, clean lashes, an idle act in pieces, its own marks and a third move, the Crinkle Clap.
- **Truffle Ladybug** (chocoknight, render/trufflebug/, since 2026-11-27 on its own copy of the bug base's
  ladybug, in the Cocoa Badger's place): a ladybug whose shell is a chocolate truffle, pink icing drizzled
  across it and a candied cherry on top; the volcano's heat worries it, so it fans itself, and its cherry is
  always a little loose. Shell Bash, Tumble, Hop-and-Slam.
- **Gummy Caterpillar** (jellyninja, render/gummypillar/, since 2026-11-27 on its own copy of the bug base's
  caterpillar, in the Jelly Bean Meerkat's place): a caterpillar of fruit gummies, a flavour to each
  segment; it walks inchworm-style, slurps licorice laces from the mine and flicks jelly beans at you.
  Jelly Bean (thrown), Bonk, Roll.

The forge's and the ramparts' bosses were remade the same day, from scratch, with brand-new fights
(world/volcano.js; their cast looks in render/toffee/looks.js and render/gretel/looks.js):

- **Toffee, the Caramel Smith** (render/toffee/): a chubby caramel salamander smith in a mint work shirt and
  a cocoa apron, her hammer's head a block of hard-crack caramel, her little anvil carried on her back.
  Idle: polishing the hammer, tasting a strand of caramel, a caramel bubble, practice taps. Swings: Bonk,
  Scoop, Tail Swat. Phases named for the sugar's stages: Soft Ball (Hot Off the Anvil buster, Caramel
  Drizzle spread, Sugar Glass stack, Quench! get-out), Hard Ball (her anvil comes off her back: Anvil Toss,
  Ring the Anvil (hug the anvil), Taffy Pull (out of its path), Hard Crack! raid-wide), Hard Crack (faster,
  doubled). Entrance: hammering a glowing bar at her anvil, then heaving the anvil onto her back.
- **Gretel, the Gingerbread Knight** (render/gretel/): a living gingerbread cookie in mint fondant armour,
  an icing spatula for a sword and a heart cookie cutter for a shield, gumdrop buttons. Idle: polishing the
  cutter, sword drill, a fallen crumb iced back on, sentry march. Swings: Thrust, Shield Bash, Overhead
  Chop. Phases: Rolled Out (Spatula Smack buster, Gumdrop Buttons spread, Royal Icing stack, Heartcutter
  Bash (get behind her)), Cut Out (her cookie cutters come down: Roll Out! (get inside one), Press! (get
  out), Preheat! raid-wide), Into the Oven! (in, out and in again, faster). Entrance: drumming on her
  cutter, then piping a line of icing between you.

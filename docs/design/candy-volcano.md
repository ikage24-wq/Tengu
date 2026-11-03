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

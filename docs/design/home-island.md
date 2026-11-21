# Your island

Built 2026-11-04 (the player picked: a tropical beach cove, a Home Shell plus a slow boat ride,
five stages, a hermit crab carpenter, decorating inside and out). Research:
`docs/art/research/home-mounts.md`. Pictures: `docs/design/samples/island/`.

**Reworked 2026-11-21 (the player's "full rework": very useful and nice looking).** The island is
now tall instead of one long strip, and it does things for you: a bed that rests you, the trunk
onto your storage, a stove, Shelly's craft bench, a sell crate, garden plots, the island's own fish
and a secret grotto. Saves from before it move in once: furniture left outside goes back into the
bag to place again (the hut's main room didn't move, so what's inside stays).

## Getting it and getting there

- **Captain Rook's quest "A Deed to a Little Island"** (Pastel Harbor, Lv 10) gives you the island
  and a **Home Shell**.
- **The Home Shell** takes you home from anywhere outside a dungeon, trial or voyage. Used on the
  island, it takes you back to where you were. It is never used up.
- **The slow way:** Captain Bobbin at the harbor quay sails you out on the Sea Biscuit (about half
  a minute, and you can fish off the stern). From the island, your skiff at the end of the dock
  (Up) sails you back to the harbor.
- The island is yours alone. No bots or passers-by come there.

## The layout (stage 5)

A beach runs along the bottom; the rock rises behind it in tiers (world/home.js `masses`, drawn by
render/terrain.js behind the sand: warm sandstone in layers, a thick turf on top, boulders, cracks,
moss, flowers and vines on the faces, a shaded cleft behind the pond so it climbs as one hill).
Everything you use often is on the beach where you land; the climbs lead to gathering, fishing,
the secret and the view (the towns' rule).

| Where | What | How you get there |
|---|---|---|
| The dock | Your skiff, the **sell crate** at its foot (sells at the shops' prices) | Where you land |
| Shell Beach | Shelly and her conch workshop, her **craft bench**, the bouncy clam | Along the beach |
| Your hut | **Bed** (log off inside: rested EXP), **trunk** (your storage), **stove** | The hut's door |
| The pond (2) | A waterfall off the summit into a pond with a fishing jetty | Along the beach |
| The grotto (2) | Behind the falls: a crystal cave round a glowing pool, the island's legend | Its mouth by the falls |
| Garden terrace | 2 to 6 **garden plots** | Ladder, or the clam's bounce |
| The rocky rise (3) | An ore vein, a chanterelle patch, a cherry tree | Ladder from the beach |
| Coral Islet (4) | The sea stack: cotton, a prickly pear, a shack and a hammock | Rope bridge from the rise |
| Sunset Summit (5) | The lighthouse, the trophy terrace, the **zip line** down to the dock | Ladder from the rise |
| Sea fishing | The beach's far end, out toward the sea stack | Along the beach |

A tier Shelly hasn't opened is there from the start, overgrown and with no way up. The summit's sky
warms toward sunset as you climb; at night the lamps and the lighthouse are lit and its beam
sweeps the sea.

## Shelly and the five stages

Shelly is a hermit crab carpenter with a big pink spiral shell on her back and coral claw
mittens. She opens the next stage when you bring what she needs:

| Stage | Opens | Shelly needs |
|---|---|---|
| 1 Shell Beach | The beach, the dock and sell crate, the workshop and bench, your hut (bed, trunk, stove), sea fishing, the garden terrace with 2 plots | (free with the deed) |
| 2 Tide Pond | The waterfall, the pond and its jetty, the grotto, the hut's kitchen nook, a 3rd plot | 3,000 gold, 10 Oak Logs, 6 Cotton, 6 Snail Buds |
| 3 The Rocky Rise | The rise and its ladder, ore, herbs and a fruit tree, the hut's loft, a 4th plot | 8,000 gold, 12 Copper Ore, 8 Maple Logs, 10 Lucky Clover |
| 4 Coral Islet | The rope bridge and the sea stack, the hut's sunroom, a 5th plot | 20,000 gold, 20 Maple Logs, 10 Iron Ore, 8 Silkmoss, 6 Hollow Acorns |
| 5 Sunset Summit | The summit's ladder, the lighthouse, the trophy terrace, the zip line, a 6th plot | 50,000 gold, 15 Cedar Logs, 10 Silver Ore, 8 Lotus Fibre |

The hut grows on the outside too: a window box (2), a porch rail and shell chime (3), a second
window and a welcome mat (4), a star on the roof (5). Nothing withers and there is no upkeep.

## What it's for

- **Rest.** Log off inside your hut and you wake up rested, like a night at the Gilded Kettle but
  at half its rate (world/inn.js; the inn is still the better night). Up at the bed says so.
- **Storage.** The trunk opens the same storage Pip and Marlo keep (not a second one).
- **Cooking and crafting.** The stove (in the main room, then the kitchen nook) and Shelly's bench.
- **Selling.** The sell crate: the shop's sell screen, nothing to buy.
- **Garden plots** (ui/plant.js). Up at an empty plot and pick something you gathered: any herb,
  fruit or fibre (not ore, logs, gems, honey or kelp). It needs the Gathering level of its tier,
  grows into 3 (the night-only rares into 2) in 24 minutes of real time, so it grows while you're
  away, and waits for you once it's ripe. You pick it by hand, for Gathering EXP. A friend
  visiting can look but not pick.
- **Fishing.** Three waters with the island's own fish: the sea (Seashell Wrasse), the pond
  (Waterfall Dace) and the grotto (Grotto Glowloach, and the legend, the Lantern Koi, at night
  only; Shelly's rumour tells of it). Each everyday one cooks into its own dish.
- **Getting about.** Ladders, the clam's bounce onto the garden, the rope bridge, and the zip line:
  Up at the summit's post, hang on, and it brakes you onto the dock (Jump lets go). It's the
  island's shortcut home.
- **Gathering.** The rise's ore, chanterelles and cherries, the sea stack's cotton and prickly pears.

## The hut inside

The main room (plank walls, beams, the big round window, the mint door, a rug, two wall shelves)
has a boxed bed with a patchwork quilt by the left wall and a sea chest under the right shelf.
It grows: a kitchen nook to the right (2, the stove moves in, with a window, tiles, a counter, jars
and pans), a loft over the main room on brackets, up a ladder by the left wall (3), and a sunroom
past the kitchen with tall arched windows onto the sea (4). Anything you use stays on the floor.

## Furniture and decorating (just for looks: the player's choice)

- **Crafted** at any bench, in the **Home** tab, from what you gather, mine, fish and hunt.
  Recipes need an island; the bakery set opens with the Tide Pond (stage 2), Starry Night with the
  Rocky Rise (3), the crown cushion with Coral Islet (4).
- **23 pieces in four sets:** Seaside Cottage, Sweet Bakery, Starry Night, Trophies and Catches.
- **Decorate mode** (Y, or the Decorate button at home): a bar of your furniture at the bottom; a
  see-through preview snaps to where it would go, green where it fits, red with a reason where it
  doesn't. Click to set down, click a placed piece to move it, F flips, Delete puts it away,
  Ctrl+Z / Ctrl+Y undo and redo, Shift places off the grid. Not in the grotto.
- **Where things go:** floor pieces on the ground or a ledge (never in the water), rugs on the
  floor, small pieces on tables and shelves, wall pieces inside on the back wall, string lights
  from a beam. Up to 60 pieces on the island and 60 in the hut.

## Visiting friends

Online, right-click a friend and **Visit their island**: you arrive at their dock and see their
island at its own stage with their furniture and their records on the trophies. Only people on the
same island see each other there. You can't move their furniture, pick their plots or use their
trunk or crate. Your Home Shell or their skiff takes you back.

## Water

The pond, the grotto's pool and the sea are real water: you wade slowly through it, or skim across
on the Shell Skipper.

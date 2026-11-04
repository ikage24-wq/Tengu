# Mounts

Built 2026-11-04 (the player picked: each mount moves its own way, earned mostly in play, hop off
to attack). Research: `docs/art/research/home-mounts.md` (MapleStory, Terraria, FFXIV, Yoshi).
Recordings of each one in the game: `docs/design/samples/mounts/`.

## How riding works

- **H** gets on and off your chosen mount, with a poof of pastel cloud each way. On a phone, the
  Ride button (paw) does the same once you own a mount. Pick which one in the Collection (B),
  Mounts tab, or from Clover.
- Every mount is faster than walking (115-165%). Each has **one trick and one trade-off**, so none
  is simply the best.
- **Attacking or using a skill hops you off** and the move comes out at once. Potions still work
  while riding. Fishing, gathering and crafting put the mount away.
- **Ropes:** the mount waits while you climb and pops back when you step off (the gecko climbs
  with you).
- No tiredness, no feeding, no upkeep.
- Friends online see you ride (and your trick); about half the bots past level 15 own a mount and
  ride it while getting about, hopping off to fight, gather or stand around.

## The six

| Mount | Trick | Trade-off | Earned |
|---|---|---|---|
| Puff Bun, a marshmallow bunny | Jumps half again as high, lands softly | Slowest on land (130%) | Clover's quest "Bun Round-Up" in Sprout's Pond Garden, Lv 15 |
| Paper Crane, folded washi | Hold Jump in the air to glide | Normal jump | Your first Hard dungeon clear |
| Nimbus, a sleepy cloud | Floats level off an edge for 1.2 s (it thins as it runs out) | Normal jump | Nimbus Whistle, 40 Party Tokens at any Party Board |
| Kettle Racer, a teakettle on wheels with a tanuki | Fastest (165%); double-tap for a steam dash | Jumps low (85%) | Kettle Racer Key, crafted at a bench (Crafting Lv 12) |
| Shell Skipper, a sea turtle | Skims water at 175% | Plods on land (115%) | Sometimes swims up after a catch at sea (about 1 in 60) |
| Ivy Gecko, a leafy gecko | Runs up ropes and ladders at double speed without getting off | — | Hidden on a twig high in the Mossy Woods treetops (the map's secret) |

## Water

Maps can now have `water` (a surface over a lower bed). Walking through it is a wade (60%
speed) with ripples round you; the Shell Skipper rides on top. The island (next) has lots of it.

## Art

Each mount is its own creature on its own little rig (`src/render/mounts.js`): its own gait,
idle life (the bun's nose twitch, the crane preening, the cloud dozing, the kettle's lid rattle,
the turtle's head bob, the gecko's licks), springy follow-through on ears, wings, tails and puffs,
and the rider's bob following the mount's a beat later. Nothing squashes or stretches. Stage page:
`tools/mount-stage.html`; in the game: `tools/ride-stage.html`.

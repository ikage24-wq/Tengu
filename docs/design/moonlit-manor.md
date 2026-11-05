# Moonlit Manor: the levels 15-20 group dungeon (design, 2026-11-02)

The second group dungeon, between Rootwood Hollow (10-15) and the chapter 5 dungeon (30-40). An
MMO "dungeon" in the FFXIV sense: an instanced run for four (tank, healer, two damage), six rooms,
each with its own task, two mid-bosses and a final boss. Picked by the player: a haunted manor,
six rooms like the Hollow, with a chase room and a puzzle room.

## The story

On the hill above Mossy Woods stands Moonlit Manor, dark for a hundred years. Lately its windows
glow every night and music drifts down the hill: **Lady Marigold**, the manor's ghostly hostess, has
thrown her midnight party again, and every traveller who answers the invitation never comes home.
The group goes in to break up the party and bring the guests back. Spooky-cute, never scary: ghosts
with blush, candles with faces, a hostess who is lonely more than wicked, freed at the end.

## Where

A new gate on the high floor of Mossy Woods (11-18), a garden path up to the manor's iron gates; a
warden NPC (Mr. Pumpkins, the old groundskeeper) runs the group finder like Bramble at the Hollow.
Entry from level 15; the finder brings players of 15-19.

## The rooms

| # | Room | Shape | Task | Set-piece |
|---|---|---|---|---|
| 1 | The Moonlit Garden | Hedges and topiaries climbing to the front steps, fountains, lanterns | Light the garden lanterns (3) | |
| 2 | The Portrait Gallery | A tall hall on three floors, portraits on every wall | **Puzzle:** turn the four portraits to match the family crest, shown by candles; the group splits across the floors | Puzzle room |
| 3 | The Ballroom | A grand round floor under a chandelier, balconies | **Mid-boss: the Waltzing Armours** (two suits of armour dancing as a pair) | |
| 4 | The Library | Shelves to the ceiling, rolling ladders, floating books | Return the lost books (3) to their shelves | |
| 5 | The Endless Hallway | A long corridor | **Chase:** Madame Velvet's tea trolley rumbles after the group; run, jump the flying plates, pull the door levers; at the end, **mid-boss: Madame Velvet** | Chase room |
| 6 | The Moonlit Rooftop | The roof under a huge moon, chimneys and weathervanes | **Final boss: Lady Marigold, the Eternal Hostess** | |

## Monsters (levels 15-20)

The player's call: the regular monsters are **manor maidens**, humanoid monster women at the quality
of the maidens (render/mobs/maidens.js: heroine heads and faces, two-bone limbs, a gait of their
own), and the bosses at the quality of the queens or better (render/mobs/queens.js).

- **Ghost Maid**: a translucent maid floating with a feather duster and a tray, lace cap, misty
  skirt fading to nothing.
- **Porcelain Doll**: a life-size doll with ringlets and a frilly dress, jointed limbs that move a
  little stiffly, a cracked-glaze cheek.
- **Candle Bride**: a ghostly bride with a candelabra, veil drifting, wax-drip lace; leaves wax
  puddles.
- **Topiary Dryad**: a garden spirit of trimmed hedge with rose-bud hair and shears (the garden).
- **Lantern Ghost Girl**: a little ghost girl with a lantern of cold blue fire, hood, bare feet.
- **Armour Knight Girl**: a dullahan-style knight girl in pastel armour, her helmet floating beside
  her (the ballroom's guards).
- **Tea Party Hatter**: a tea-mad hostess with a giant top hat and a teapot that pours scalding tea.

## Bosses

- **The Waltzing Armours** (ballroom): two armours dancing as a pair. They spin across the floor
  together (a sweep shown on the floor first); hit one and the other guards it; part them (the tank
  pulls one away) and they stagger. If one falls, the other dances alone, faster.
- **Madame Velvet, the head housekeeper** (hallway; was the Grand Butler): a tall, elegant ghost with a ring of keys and a tea trolley. She serves tea that scalds (circles to step out of), throws a stack
  of plates across the hall (jump them), and rings the bell to call Teacup Mimics.
- **Lady Marigold, the Eternal Hostess** (rooftop): phase 1, Tea for Two (teacups rain on marked
  spots); phase 2, the Guests Arrive (ghost dancers to clear while she floats out of reach); phase 3,
  the Last Waltz (she sweeps the roof in a moonlit spin, the group jumps the chimneys). At the end she
  is freed, not slain: the guests come home and she thanks the group, at peace.

## Rewards

The rewards for clearing it: EXP, gold, Cash, your job's Lv 20 gear in a rolled colour, **Moonlit Ribbons** (the
dungeon's tokens), grown by the run's grade and doubled on Hard; the first clear of the day adds
more. Its own gear set, **Moonlit Masquerade** (a masquerade outfit), like the Hollow's Rootwood set.

## As built (2026-11-02)

- **Monsters** on a new rig (render/mobs/manorrig.js: a taller skeleton keyed per animation with eased
  in-betweens), art in render/mobs/manor.js: the Porcelain Doll (stiff doll steps, parasol jab),
  Ghost Maid (floats on a mist curl, duster flick), Candle Bride (glides, veil streaming,
  candelabra gout), Topiary Dryad (skipping, shears snap), Lantern Ghost (tiptoes on air, cold-fire
  ring), Armour Knight (marching, floating helmet beside her, heavy slash), Tea Party Hatter (jaunty
  skip, giant hat, flung tea).
- **Bosses** drawn on the same rig scaled up (render/mobs/manorboss.js, `grand` scales the figure,
  its strokes and its face together): Dame Rondo and Dame Minuet (the Waltzing Armours), Madame
  Velvet with her trolley, Lady Marigold in her gown of marigold petals.
- (2026-11-03/04: the monsters and bosses were redrawn as chibi creatures in render/mobs/manorfolk.js
  and manorfolkboss.js on the boss rig; the first art and its rig were removed, and
  render/mobs/manorboss.js keeps only the trolley for the hallway chase.)
- **Rooms** (data/maps.js, world/manor.js, render/manor.js): the gate is Manor Hill, off the top
  bough of Mossy Woods, with Mr. Pumpkins. Garden fountains spout on a beat and throw you up the
  terraces; the gallery's portraits turn and lock on the crest's picture (a new crest each run);
  the ballroom's chandelier falls mid-fight (its chain is the climb to the room's secret); the
  library's lost books flutter along the shelves and page storms push one floor at a time; the
  hallway trolley chases the group, doors open by their levers, plates fly ahead; the rooftop has
  chimneys to stand on and the weathervane's secret.
- **Boss fights**, changed from the plan where it played better:
  - The Armours take hold now and then (side by side they guard each other, a gold ring shows it),
    then break into the Grand Waltz, sweeping the floor wall to wall. One down, the other dances
    alone, faster.
  - Madame Velvet rings for her Ghost Maids (not Teacup Mimics: the maids are already in the house
    and read better), serves scalding tea circles, and sends plates skimming the floor (jump).
  - Lady Marigold: Tea for Two, then the Guests Arrive (Candle Brides and Armour Knights; she can't be
    hit until they're gone, then she's dizzy), then the Last Waltz (moonlight sweeps the roof).
    Freed at the end, not slain.
- **Music**: "Midnight Waltz" (a music-box waltz in C minor, celesta and glockenspiel) and "The
  Last Waltz" for the boss rooms; a creaking-house ambience.
- **Rewards**: Moonlit Ribbons, Lv 20 gear, the Moonlit Masquerade set (a little top hat with a
  masquerade mask pinned to it, a lace jabot, a swallow-tailed coat).

## Build order

1. Maps: the gate on Mossy Woods and the six rooms (shapes, ledges, ropes, the chase corridor).
2. Art: the manor theme (backdrops, floors, props), six monsters, three bosses, the warden.
3. Room tasks: lanterns, the portrait puzzle, the books, the chase.
4. Bosses' moves.
5. Rewards, the set, the story beat, bots and the group finder, tests.

## The 2026-11-03 redraw

The residents and bosses were redrawn creature-first (render/mobs/manorfolk.js and
manorfolkboss.js), retiring the costumed girls on the manor rig (the rig stays for the dungeons
that still use it): a china bunny doll with a parasol, a ghost-cat maid with a feather duster, a
living candle bride, a topiary swan, a flame wisp in an iron lantern, a little empty suit of armour
with a too-big helm, and a teapot in a top hat who pours hot tea. The waltzing armours are big
chibi suits (Rondo slim and plumed with a rapier, Minuet bell-skirted with a fan-shield), Madame
Velvet a plump plum ghost in a mob cap who hurls plates, and Lady Marigold a giant marigold
blossom spirit who sweeps a storm of petals with her fan.

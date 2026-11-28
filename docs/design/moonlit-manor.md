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
| 3 | The Ballroom | The Mirrored Ballroom: a marble floor below, the same floor upside down overhead, mirrors and moonlit windows, a great clock stopped at twelve, a crystal chandelier, balconies | **Mid-boss: Dame Rondo and Dame Minuet, the Mirror Twins** (twin ghost ladies, one on the floor, one hanging from the ceiling) | |
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
  (Now the Topiary Hedgehog: Topsy, a round little hedgehog whose prickles are a clipped box
  hedge, who rolls about like a topiary ball; render/topiarydryad/, 2026-11-26.)
- **Lantern Ghost Girl**: a little ghost girl with a lantern of cold blue fire, hood, bare feet.
- **Armour Knight Girl**: a dullahan-style knight girl in pastel armour, her helmet floating beside
  her (the ballroom's guards).
- **Teacup Hermit** (was the Tea Party Hatter; remade 2026-11-26): Pemberton, a little rose-pink hermit crab
  living in a porcelain teacup, monocle and moustache; lobs sugar cubes, pinches, clonks with his cup.

## Bosses

- **Dame Rondo and Dame Minuet, the Mirror Twins** (ballroom; remade from scratch 2026-11-28 as twin
  ghost ladies, after the Waltzing Armours and then a penguin and a bat): opposite colours (jet black /
  snow white), faces (stern / grinning) and gimmicks; each keeps one hidden red eye under her bangs that
  stops time. One dances on the floor, the other hangs upside down from the ceiling. See the boss fights
  below.
- **Madame Velvet, the head housekeeper** (hallway; was the Grand Butler): a tall, elegant ghost with a ring of keys and a tea trolley. She serves tea that scalds (circles to step out of), throws a stack
  of plates across the hall (jump them), and rings the bell to call Teacup Mimics.
- **Lady Marigold, the Eternal Hostess** (rooftop; remade 2026-11-26, render/marigold/): a lonely
  ghost hostess who floats, her marigold-petal gown melting into a long glowing train, a plum chignon
  with a marigold in it, her dance card (every line blank) at her wrist and a pocket watch stopped at
  midnight at her hip. She makes her entrance down the moon's beam. A new fight on a cast bar: Welcome,
  Guests! (Invitations: spread; Don't Leave!: come in close; A Toast!: stack; May I Have This Dance?:
  the tank), Second Helpings below 65% (her Basset Butlers walk in with pumpkin tarts: stop them before
  they reach her, or she eats one and heals; Give Me Room!, then at once Don't Leave!), and Midnight
  below 30% (Midnight Chimes strike the roof in four stretches in turn; Not Yet!; the Hundred-Year
  Waltz on everyone). At the end she is freed, not slain: the guests come home and she thanks the
  group, at peace.
- **Basset Butler** (her adds; the Pumpkin Butler remade 2026-11-26, render/pumpkinbutler/): Humphrey,
  a little red-and-white basset hound in a plum waistcoat and white gloves, carrying a silver tray
  and cloche with a pumpkin tart under it; Cloche Clang, Ear Swat and Deep Bow.

## Rewards

The rewards for clearing it: EXP, gold, Cash, your job's Lv 20 gear in a rolled colour, **Moonlit Ribbons** (the
dungeon's tokens), grown by the run's grade and doubled on Hard; the first clear of the day adds
more. Its own gear set, **Moonlit Masquerade** (a masquerade outfit), like the Hollow's Rootwood set.

## As built (2026-11-02)

- **Monsters** on a new rig (render/mobs/manorrig.js: a taller skeleton keyed per animation with eased
  in-betweens), art in render/mobs/manor.js: the Porcelain Doll (stiff doll steps, parasol jab),
  Ghost Maid (floats on a mist curl, duster flick), Candle Bride (glides, veil streaming,
  candelabra gout), Topiary Dryad (skipping, shears snap), Lantern Ghost (tiptoes on air, cold-fire
  ring), Armour Knight (marching, floating helmet beside her, heavy slash), Teacup Hermit (a prim
  tiptoe scuttle, a lobbed sugar cube).
- **Bosses** drawn on the same rig scaled up (render/mobs/manorboss.js, `grand` scales the figure,
  its strokes and its face together): Dame Rondo and Dame Minuet (now the Mirror Twins, on their own
  copies of the blank bases' maiden: render/twins/), Madame
  Velvet with her trolley, Lady Marigold in her gown of marigold petals.
- (2026-11-03/04: the monsters and bosses were redrawn as chibi creatures in render/mobs/manorfolk.js
  and manorfolkboss.js on the boss rig; the first art and its rig were removed, and
  render/mobs/manorboss.js keeps only the trolley for the hallway chase.)
- **Rooms** (data/maps.js, world/manor.js, render/manor.js): the gate is Manor Hill, off the top
  bough of Mossy Woods, with Mr. Pumpkins. Garden fountains spout on a beat and throw you up the
  terraces; the gallery's portraits turn and lock on the crest's picture (a new crest each run);
  the Mirrored Ballroom (render/twins/room.js) is the twins' own room, its chandelier's crown the ledge
  up in the dome (its chain is the climb to the room's secret); the
  library's lost books flutter along the shelves and page storms push one floor at a time; the
  hallway trolley chases the group, doors open by their levers, plates fly ahead; the rooftop has
  chimneys to stand on and the weathervane's secret.
- **Boss fights**, changed from the plan where it played better:
  - The Mirror Twins (world/twins.js, 2026-11-28), three phases by their health together, every move
    on the cast bar. Only the twin on the floor can be reached (the one on the ceiling, from the
    balconies). Frozen Moment: the red eye stops time, the whole group is frozen while the twins trade
    places through their mirrors and set new steps in the stopped air, which land a moment after time
    starts again. Rondo: Metronome (rings on her beat, faster each time), Conductor's Cue (a stave along
    the floor). Minuet: Boo! (she pops out behind you), Rewind (pulled back to where you stood),
    Eyes on Me (look away or be frozen). Both: Mirror Step (the floor here and its reflection up high),
    Twin Bond (the healthier mends the other: keep them even).
    - First Dance (to 60%); Change Partners (to 25%: faster, two steps set in every stopped moment);
      Pas de Deux (the finale: both red eyes, a great wave, then faster still).
    - One down, the other comes down to the floor and dances everything herself.
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
living candle bride, a topiary swan (remade 2026-11-26 as the Topiary Hedgehog), a flame wisp in an iron lantern, a little empty suit of armour
with a too-big helm, and a teapot in a top hat who pours hot tea. The ballroom's pair are the Mirror
Twins, twin ghost ladies (2026-11-28; before them a penguin and a bat, 2026-11-26), Madame
Velvet a plump plum ghost in a mob cap who hurls plates, and Lady Marigold a giant marigold
blossom spirit who sweeps a storm of petals with her fan.

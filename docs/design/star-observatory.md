# The Star Observatory: the levels 30-35 group dungeon (design, 2026-11-02)

The fifth group dungeon, after the Clockwork Carnival (25-30), following the ladder plan
(docs/design/dungeon-ladder.md). The plan called it the Celestial Library-Observatory.

## The story

At the top of Moonlit Ridge stands a tower that only appears on clear nights: the Star
Observatory, where the stars of the island are catalogued. Its keeper, Astraea, has stopped the
stars turning so that nothing she loves will ever fall, and the night sky is going still and cold.
Professor Lumen, an old stargazer, has the key to the tower door.

## Where

The **Observatory Steps**, off the end of Moonlit Ridge (29-32). **Professor Lumen** finds
groups. Entry from level 30; the finder brings players of 30-34.

## The run: a climb that turns

Each room is a floor of the tower, and the sky changes as you climb.

| # | Room | Shape | Task / gimmick | Set-piece |
|---|---|---|---|---|
| 1 | The Starlit Stair | A tall climb up the tower's outside | **Meteor showers** fall on the floors now and then; light the three star lamps | |
| 2 | The Constellation Hall | A wide hall, lamps in a star pattern | **Puzzle:** five star lamps; using one flips it and the lamps joined to it in the constellation. Light all five | Puzzle room |
| 3 | The Weightless Reading Room | Floating shelves far apart | **Low gravity:** long, floaty jumps between the shelves | |
| 4 | The Archive | A long hall of bookcases | **Mid-boss: Folio, the Archivist** | |
| 5 | The Orrery | Planet platforms orbiting a brass sun | **Mid-boss: the Eclipse Twins**, Sol and Luna | |
| 6 | The Telescope Crown | The open dome under the great telescope | **Final boss: Astraea, the Star Keeper** | |

## Monsters (levels 30-34), on a new rig

The **astral rig** (render/mobs/astral.js): the manor rig with orbiters. Each astral monster has
little things in orbit around it (moons, stars, pages, pebbles) on tilted rings that pass in front
of and behind the body, and it drifts on a slow figure-eight instead of walking.

- **Comet Courier**: a messenger girl riding her own comet tail, letters in a satchel; dashes.
- **Nebula Witch**: a dress of nebula cloud, a starry hat; a nebula burst from her wand.
- **Star-chart Cartographer**: a long scroll chart and a brass compass; flings the compass needle.
- **Owl Librarian** (was the Moth Librarian until 2026-11-18): a little owlet in a scholar's cap and gown with a lantern; bonks you with a book.
- **Meteor Golem Girl**: rock gauntlets with glowing cracks; a heavy punch.
- **Gemini Ghosts**: two little twin ghosts holding hands; a twin spin.

## Bosses

- **Folio, the Archivist** (Archive): an owl-ish librarian with an enormous book. She hurls stacks of
  overdue books (marked spots), calls Owl Librarians, and at half health the bookcases slide in from
  both ends of the hall (stay in the middle).
- **The Eclipse Twins, Sol and Luna** (Orrery): the room is split into a sunlit half and a shadowed
  half, swapping at each eclipse. Sol can only really be hurt in the shadow, Luna only in the light:
  the tank drags them across. Sunbeams and moonbeams strike marked spots.
- **Astraea, the Star Keeper** (Telescope Crown): phase 1 Meteor Shower (marked spots); phase 2
  Constellations (lines of stars light up across the floor, stand in the gaps); phase 3 Supernova (the
  whole floor flares: jump it) while the stars pull everyone light (low gravity). At the end she lets
  the stars turn again.

## Rewards and music

Astral Shards (tokens), Lv 35 gear, the **Stargazer** set (a crescent circlet, a star-chart scarf, a
cape of night sky with constellations). Music: "Clockwork Stars" (harpsichord over celesta, A minor,
baroque-pop) and, for the bosses, "Event Horizon" (church organ and brass, C minor).

## The 2026-11-03 redraw

The sky-folk and bosses were redrawn creature-first (render/mobs/astral.js and astralboss.js),
retiring the costumed girls on the astral rig: a comet-riding sparrow courier, a nebula-cloud
witch, a hermit crab living in a brass telescope, a fluffy moth librarian with a lamp, a meteor
rock golem with glowing cracks, and twin star ghosts holding hands. Folio is a grand bookworm in
glasses on an enormous book, the Eclipse Twins a sun-fox in a blazing halo and a moon-rabbit before
a crescent, and Astraea a starry stag with constellation antlers and a ring of orbiting stars.

## The 2026-11-26 remake

The regular monsters were remade from scratch on their own copies of the blank bases (the bosses come
next), each a new creature from the tower's place and story, the old ids kept for saves and quests:

- **Star Glider** (`cometcourier`, render/glider/): a sugar glider on the Starlit Stair who catches the
  falling stars in its pouch, so its tummy glows; star-freckled gliding skin, a long bushy tail. Glide
  Swoop, Star Toss, Tail Twirl.
- **Spyglass Loris** (`starcarto`, render/loris/): the tower's slow little star surveyor, huge night
  eyes, a brass spyglass and a tube of star charts; throws its arms over its head when startled. Lens
  Flare (a glint of starlight, `shot: 'starglint'`), Spyglass Bonk, Chart Unroll.
- **Nebula Knitter** (`nebulawitch`, render/alpaca/): an alpaca whose fleece is a star nursery; she knits
  the night sky and hums. Yarn Comet (`shot: 'nebulayarn'`), Needle Jab, Fleece Puff.
- **Raven Scribe** (`mothlibrarian`, render/raven/): the Archive's copyist, copying the star records out
  in starlight ink; Folio calls them to her. Mimics the Archive clock, can't leave shiny things alone.
  Quill Jab, Ink Flick, Page Flurry.
- **Meteor Maiden** (`meteorgolem`, render/meteormaiden/): her idea kept, rebuilt to today's standard
  with her own hair and face (no hero hair). Meteor Smash, Shooting Star, Comet Combo.

## The 2026-11-27 boss remake (Folio and the Eclipse Twins)

Remade from scratch on their own copies of the blank bases, each with a new fight (world/observatory.js),
a cast bar, named rotations and their own telegraph looks (render/folio/looks.js, render/eclipse/looks.js):

- **Folio, the Archivist** (`folio`, render/folio/, the winged base): a prim young snowy owl of a librarian,
  snowy hair in a wound bun with a quill through it, brass reading glasses pushed up on her hair, a snowy
  owl's wings folded down her back, a midnight indigo coat-dress, the Archive's keys at her hip, a white
  quill, and the Great Catalogue floating at her side. Quiet, Please: Hardback (the Catalogue slammed shut
  on the tank), Toppling Stacks (a row of bookcases topples down the hall: stand in the one Reading Nook, or
  up on a ledge), Riffle (a gust of pages on everyone), Noted (ink lands where each of you stood). Top
  Shelf, Bottom Shelf (to a third): books fly along the top shelves (stay on the floor) or skid along the
  floor (jump), then both. Closing Time: the stacks fall from both ends toward the nook, Noted then Bottom
  Shelf, Speed Reading. She calls two Raven Scribes at 70% and 40%. Entrance: up on a rolling ladder reading,
  a glide down on her owl's wings, a library card, OVERDUE stamped in starlight ink.
- **Sol and Luna, the Eclipse Twins** (`eclipsesol`, `eclipseluna`, render/eclipse/, the maiden base): Sol a
  fox-eared sun girl (a sun ring round her head, a fox's tail, a coral jacket), Luna a rabbit-eared moon girl
  (a night-blue capelet, a moon-white dress, her mochi mallet). The old sunlit and shadowed halves are gone:
  they move as a pair. Sunrise, Moonrise: Solar Flare, Moon Mallet (three rings of mochi pound out round
  Luna), Sunspots, Share the Mochi, Opposition (they dash to opposite ends: Sol's sunbeam burns the floor of
  her half, Luna's moonbeam sweeps head-high through hers), Diamond Ring. Eclipse Season (either at 60%):
  Conjunction (hand in hand in the middle: only the shadow under them is safe) and Crossing (they dash past
  each other, trading places). Alone: the survivor fights on with her sister's keepsake, both sisters' moves
  and Totality. Entrance: a big wave and a shy one, then back to back, an eclipse ring round them both.

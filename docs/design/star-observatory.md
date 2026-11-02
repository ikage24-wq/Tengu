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

The **astral rig** (render/mobs/astralrig.js): the manor rig with orbiters. Each astral monster has
little things in orbit around it (moons, stars, pages, pebbles) on tilted rings that pass in front
of and behind the body, and it drifts on a slow figure-eight instead of walking.

- **Comet Courier**: a messenger girl riding her own comet tail, letters in a satchel; dashes.
- **Nebula Witch**: a dress of nebula cloud, a starry hat; a nebula burst from her wand.
- **Star-chart Cartographer**: a long scroll chart and a brass compass; flings the compass needle.
- **Moth Librarian**: moth wings and feathery antennae, a little lamp; a puff of glittering scale dust.
- **Meteor Golem Girl**: rock gauntlets with glowing cracks; a heavy punch.
- **Gemini Ghosts**: two little twin ghosts holding hands; a twin spin.

## Bosses

- **Folio, the Archivist** (Archive): an owl-ish librarian with an enormous book. She hurls stacks of
  overdue books (marked spots), calls Moth Librarians, and at half health the bookcases slide in from
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

# The Star Witch (replaces the Spirit Mage; her paths: the Starlight Idol and the Astronomer)

The player's picks (2026-11-02): a starfall caster, wand and staff, midnight blue and gold, no
familiar, a bright prodigy, the Constellation gauge with Starfall, and two star heals so she can
take the healer's seat in the early dungeons. Held to the Wind Dancer standard (CLAUDE.md).

## Who she is

A cheerful young witch who is very, very good at magic and knows it: wand twirls, finger-guns of
starlight, a wink after a big spell. Her magic is the night sky: star bolts, comets, falling stars
and constellations that snap into shape over the monsters.

- **Colour:** midnight blue with warm gold stars (and white starlight cores).
- **Shapes:** five-point stars, comet tails, constellations (stars joined by thin lines).
- **Feel:** snappy. The old mage's dance casts took a full second; every Star Witch cast is out in
  about a fifth of a second, on the Warrior's formula.

## How she fights

- **Wand (quick stars):** a flick that sends a star bolt, a twirl that sends two, a spin that flings
  a star through the line, and a finisher that snaps a little constellation over them. Pool: a
  wink-cast, a sidearm sweep of three small stars, a hop-cast, a show-off pose.
- **Staff (heavy comets):** a thrust that fires a comet, a swing that lobs one, a plant that calls a
  meteor down on them, and a staff spin into a big comet slam. Pool: a twirl, a sweep, an overhead
  slam.
- **Commands:** up + attack shoots a star up at fliers; in the air she casts down; out of a run a
  slide-cast.
- **Constellation** (her gauge, the old Spirit internally): her spells that land light the stars of
  a constellation over her head, seven in all; it fades once the fighting stops. Full: every bolt
  splits into three.
- **Skills:** Shooting Star (a three-part cast combo), Star Step (she pops into sparkles and appears
  ahead), Comet (a big comet through the line), Wishing Star (a falling star that heals the party),
  Star Veil (a shield of starlight on the party), Mana Mastery, and **Starfall**, her finisher (full
  Constellation): the whole constellation comes crashing down as a meteor shower on everything
  ahead.
- **No familiar:** the Spirit Doll goes.

## Her paths

At 30 she becomes the Starlight Idol (the healer, with a wand: docs/design/starlight-idol.md) or the
Astronomer (damage, with a staff: planets and orbiting moons, docs/design/astronomer.md).

## Status (2026-11-02)

Built, replacing the Spirit Mage in place (the job keeps the `spiritmage` id and her skill ids, so
saves, Elowen's trial, the dungeon healer and her paths carry over; the name is Star Witch).

- Moves (render/moves.js `sw*`, `ss*`): the wand string swflick, swtwirl, swspin, swsnap and its
  pool swwink, swsweep, swhop, swshowoff; the staff string ssthrust, ssswing, ssplant, ssslam (its
  pool borrows her own wand figures); swup, swair, swdash; swblink (Star Step), swwish, swveil,
  swstarfall. Her face gets a wink (render/hero.js `rig.eyes = 'wink'`).
- Basic attacks (world/melee.js `starwand`, `starstaff`, first job only; her paths keep the Spirit
  Mage's dance): star bolts, comets, and a meteor from the sky (`sky`). Full Constellation splits
  bolts and comets into three (`STAR_SPLIT`).
- Skills (ids kept): Shooting Star (`spiritbolt`), Star Step, Comet (`spiritwave`), Wishing Star
  (`blessing`), Star Veil (`spiritward`), Mana Mastery, Starfall (`heavenslantern`, a meteor rain).
- Wands and staves are redrawn as star wands (held at the end) and witch staves (held near the foot),
  with new names.
- Effects (tools/fx-art.js): `stbolt`, `stcomet`, `sthit`, `stconst`, `stmeteor`, `stwish`,
  `stveil`, `embwitch`. Icons, the Constellation gauge (seven stars), her aura, sounds.
- Removed: the Spirit Doll and Kami's Favour.

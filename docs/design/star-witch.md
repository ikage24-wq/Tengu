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

## Animation pass (2026-11-03)

- Every wand cast now ends on a pose of its own instead of the same arm-out hold: the flick holds a
  fencer's lunge, the twirl turns her shoulder with the wand pointed at the floor, the spin's throw
  carries the wand down behind her into a finger-gun, the snap (the finisher) crouches and pulls
  back, then whips the wand up overhead on her toes with a wink, the wink-cast tips the wand up
  beside (never over) her cheek, the sweep runs on into a leaning arabesque, the hop lands on a
  ta-da. Wand twirls go behind her head while the wand points up, so the star never crosses her face.
- Wishing Star clasps the wand low and wishes, then raises it high on her toes; Star Veil ends
  with the open palm pushing and the wand upright at her hip; Starfall ends with the wand flipped
  up high in front, a hand on her hip and a wink (no more stab into the floor).
- The staff has its own figures (render/moves.js `ss*`): a crescent arc over the top into a lunge,
  a two-handed twirl from the middle of the staff (`grip` slides the hand up the shaft) ending
  tucked under her arm, a planted cast (staff foot on the ground, free hand to the sky), a comet
  flourish over the top that ends held high, a one-two of jabs back onto the shoulder, an air swing
  from the hip, and a dash with the staff trailing low then whipped over. Her skills cast with a
  staff use the staff's figures (`STAFF_FORM` in moveAt), same timing.


## Footwork and effects pass (2026-11-04)

The Starlight Idol treatment, in the Star Witch's own showing-off way:

- **Travel:** every step of both strings and their pools carries her forward (wand: flick 10,
  twirl 12, spin 14, snap 18, wink 8, sweep 14, hop 20, show-off 12; staff: 8-16), the run-cast
  slides 56, and Shooting Star and Comet step in too.
- **Bounce:** a skip into the flick, the wink-cast, the sweep and the staff's thrust and crescent
  (front knee thrown high, `SW_SKIP`); a skip between the twirl's two points; the spin is a
  spinning hop; the snap and the comet flourish leap higher; the staff vaults up before the plant
  and jumps into the slam; the up-cast springs off the ground. Bigger leans and lunges throughout.
- **No frozen ends:** each pose is held sooner and then she bobs on her toes twice, pleased with
  herself (`swBob`), back to rest by the end; Star Veil too.
- **Snappier:** her strings about a tenth quicker; stars 860, comets 780 (Shooting Star 880/800,
  Comet 840); Wishing Star 0.8 s, Star Veil 0.72 s, Starfall 1.45 s.
- **Effects drawn to size** (game px, measured): the star bolt went from a 10 px speck to 24 px
  (star) with a 45 px tail; the comet from 24 to 44 px; meteors from 12 to 26 px (Starfall's rain
  18 px); her hit mark from 20-30 to 42-60 px; Starfall's impact flash 60 to 120 px across. Each is
  redrawn larger from the same art (`grown()`), not stretched.
- **Starfall's constellation spans the sky it rains from:** it was 86 px wide over a 380 px rain;
  now a four-times redraw (`stsky`) spread over the whole stretch ahead of her.
- **Wishing Star and Star Veil show who they reach:** a ring of her stars races out to their
  220 px party reach.

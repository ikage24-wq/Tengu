# The Acrobat Archer (the Archer remade)

The player's picks (2026-11-02): an acrobat archer, mint and gold, a playful show-off, the Combo
gauge with Showtime, and Grand Somersault as her finisher. Held to the Wind Dancer standard
(CLAUDE.md). Her bow path is the Phantom Trickster (docs/design/phantom-trickster.md), her
crossbow path the Arbalist Engineer.

## Who she is

A show archer who shoots mid-trick: skips, flips, splits, rolls and pirouettes, the bow drawn and
loosed from the top of each, a wink after the good ones.

- **Colour:** mint and gold (a touch of pink in her confetti).
- **Shapes:** gold arrows trailing curling mint ribbons, five-point gold stars, confetti, round
  circus bursts.
- **Her bow:** the 'acro' finish draws her bow as a short trick recurve, half a hunter's bow's
  height, mint limbs curling back at the tips, gold star caps, a gold grip with a mint ribbon; she
  holds it canted at chest height, so it never reaches up across her face.

## How she fights

- **Her string (render/moves.js `ac*`):** a skip shot loosed as she lands, a back handspring with
  an arrow off the top and another as she lands, and a split leap loosing a big arrow from mid-air.
  Pool: a forward roll into a kneeling shot, a pirouette into a fan of three, a front flip with a
  big arrow off the top.
- **Commands:** a backbend shot up at fliers (up + attack), legs kicked out shooting down from the
  air (and Down + attack), a dive roll out of a run coming up shooting, and her air leap is a back
  handspring in the air.
- **Combo** (her gauge, internally Momentum): shots that land build it, more for each in a row; her
  flips, rolls and handsprings keep it from fading; a hit taken knocks half of it away. Full
  (**Showtime**): every shot she looses splits into three arrows.
- **Skills (ids kept):** Firework Arrow (blastarrow: shots sometimes go off like fireworks), Ribbon
  Snare (snarearrow: a ribbon ties the target up in a bow), Springboard (springtrap: a circus
  springboard that bounces monsters up), Handspring (vault), Steady Hands, Light Feet, and **Grand
  Somersault** (cometarrow, the finisher): a huge leap with three somersaults, a ring of gold
  bursting at the top, golden arrows raining on everything round her, and a landing with a wink.

## Status (2026-11-02)

Built, replacing the Archer in place (the job keeps the `archer` id and its skill ids; the name is
Acrobat Archer).

- Moves: acskip, acflip, acsplit, acroll, acspin, acfront, acup, acair, acdive, achandspring,
  acspring, acsomersault (`bowShot` in render/moves.js times each draw and release).
- Effects (tools/fx-art.js): `acarrow`, `acbig`, `achit`, `acfirework`, `acribbon`, `acspring`,
  `acburst`, `acaura`, `embacro`. Icons, the Combo gauge, her aura, sounds.
- Bots: an Archer in the party skips, flips and rolls as she shoots, and casts Grand Somersault.
- The old Archer's figures (draw, quickshot and the like) stay for the moves other jobs share.

## Animation rework (2026-11-03)

- Every draw is one clean archer's line (`bowDraw` in render/moves.js): the bow arm long and a
  little low, the bow tipped back a touch so the arrow runs under her jaw (never through her lips),
  the string hand anchored under the chin and the head held back off the string. After the loose
  the bow rolls forward in her hand (the top limb tips away from her face), and between tricks it
  sits low and tipped forward.
- Shooting up: a backbend with the bow arm thrust up and out and the bow tipped right back, its top
  limb passing behind her head. Pirouette: up on one toe with a passé knee, arms opened wide (bow
  out ahead, tipped forward) for two turns. Grand Somersault: she pitches nose-down to aim, so the
  arrows run out below her face, then tucks into one more forward turn on the drop.
- Kneels (rolls, dives) now really kneel: the hips sink and the back knee goes down (a shared fix:
  crouch depths in the rig were too shallow to read on the squashed figure).

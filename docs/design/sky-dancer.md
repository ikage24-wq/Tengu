# The Sky Dancer (the Wind Dancer's glove path; replaces the Kitsune)

The player's picks (2026-11-02): she never lands, sky blue, every blow lifts her, Tailwind. Held to
the Wind Dancer standard (CLAUDE.md): her own moves for her name, fluid, the face always clear, her
own effects.

## Who she is

The Wind Dancer who has given herself to the wind: she dances on the air over the monsters, her
gloved palms and pointed feet throwing crescents of wind down at them. Light, airy, joyful.

- **Colour:** sky blue and white, with a touch of pale gold sunlight.
- **Shapes:** crescents of wind, feathers, little clouds, and whirlwinds.

## How she fights

On the Warrior's formula, like the Wind Dancer.

- **Every blow lifts her:** on the ground her first blow hops her up, and each blow after holds
  her there and nudges her a little higher (up to a ceiling over where she took off). Keep
  attacking and she stays up, dancing on the air; stop and she drifts down softly.
- **Her string (her own figures, render/moves.js `sd*`):** a palm push that throws a gust down at
  them, a scissor kick, an aerial spin that blows a ring of wind round her, and a crescent kick
  that hurls a great gust down the line. Her pool: a twirl, a flutter of both palms, an axe heel
  and a sweeping kick. Up + attack: a rising spiral that throws them up. Out of a run: a glide
  with both palms out.
- **Tailwind** (her gauge, the Kitsune's Tails internally): hits landed while she's up in the air
  build it (a little on the ground); it fades once the fighting stops. Full: a whirlwind forms
  under her feet, she flies freely (Up and Down move her through the air), and her gusts are twice
  as big.
- **Procs:** Updraft (a gust sometimes leaves a rising whirl that throws them up), Zephyr (a blow in
  the air sometimes sends a second gust after the first), plus the Wind Dancer's.
- **Buttons:** Pirouette (from the Wind Dancer) and **Sky Waltz**, her finisher: she spins up a
  giant tornado that lifts every monster into the sky, then slams them all down.

## Status (2026-11-02)

Built, replacing the Kitsune in place (the path keeps the `kitsune` id, so saves and Vex's trial
carry over; the name is Sky Dancer).

- Moves (render/moves.js `sd*`): sdpalm, sdscissor, sdspin, sdcrescent, the pool's sdtwirl,
  sdflutter, sdheel, sdsweep, the commands' sdrise (up) and sdglide (run), and sdwaltz (finisher).
- The lift (world/melee.js `skyLift`, `tickSky`): every step springs her back up to a cruising
  height over where she took off (a little higher each blow, up to a ceiling), she sinks only
  slowly while a move plays, and drifts down softly for a few seconds after her last blow. Her
  string is danced in the air (no separate air string).
- Tailwind (Tails internally): hits build it, three times as fast in the air; full, Up and Down fly
  her and her gusts are big (`skyProcs`).
- Skills: Sky Mastery, Updraft, Zephyr, Sky Waltz (finisher; its tornado stands on the ground she
  took off from, `floor`).
- Effects (tools/fx-art.js): `skygust`, `skyhit`, `skywhirl`, `embsky`, `skytornado`. Icons, HUD
  gauge (Tailwind / TAILWIND), aura, sounds, sky-blue gloves and outfit trim.
- The Kitsune's fox-fire stars, illusions, decoy, trap, barrage and Nine-Tail Blaze are removed (the
  Shrine Maiden's fox guardian is separate and stays).

## Animation pass (2026-11-03)

Her figures were redrawn to read as airborne in the poses themselves, not only from the float
(render/moves.js `sd*`; docs/design/wind-dancer.md gives the rig's limits): knees tuck before a push
and the legs stretch long behind it (palm push, glide), the scissor kick goes above her waist, the
spins and the rising spiral draw the legs up together with the arms in a wide V, the crescent swings
the leg from far behind up high and chops it down, the axe heel raises a straight leg high in front
and chops, the sweep swings the back leg out level through the turn, and the flutter beats both
arms from high to low with the body tipping on each beat. Sky Waltz climbs through its turns, pulls
in tight, drives both palms down for the slam, then opens into her signature pose: floating high,
one leg pointed long in front and the other in attitude behind, arms wide.

## Footwork and effects pass (2026-11-04)

She dances on the air with more lift and travel: every figure of her strings carries her forward
(8-16 px, the glide 84) and is about a tenth quicker, and her gusts fly about 15% faster. She swoops
up into the gather and dives into the push, beats her legs in a cabriole before the scissor kick
(`CABRIOLE` in render/moves.js), sails higher through the spins and the axe heel, and dives on each
chop; after each figure she floats back up with two soft bobs instead of hanging still. Sky Waltz
is a tenth shorter, climbs higher and dives harder into the slam.

Sky Waltz's tornado is drawn twice its old size and wider at its foot, so it spans the monsters it
lifts (200 px), and the slam's ring races out to 230; it stands behind her, never over her face.
Updraft's whirl is about 100 px across (was 32). Her aerial spin and sweeping kick send a ring of
wind out to their reach with clouds bursting at both edges (they had only a small cloud), and her
gusts in flight are a little larger.

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

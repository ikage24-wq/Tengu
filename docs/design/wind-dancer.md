# The Wind Dancer (replaces the Thief, Shinobi and Kitsune)

The player found the Thief line no fun to play and asked for it to be deleted and remade from
scratch (2026-11-02). Their picks: the Wind Dancer, fighting on the Warrior's formula (the job
they said feels good), chakrams and the small glove, coral and cream, a showy performer. The old
Thief line is deleted when this one is ready; characters on it move here.

## Who she is

A travelling dancer who fights like every battle is a show: twirls, a pose after a finish, a bow
to the crowd. Cheeky and confident. LUK, quick, mostly airborne.

- **Colour:** warm coral pink with cream and a touch of gold. Nothing else in the game is coral.
- **Shapes:** swirling ribbons, crescent gusts, spinning rings. Never the Warrior's crosses, the
  Archer's feathers or the Beastmaster's leaves.
- **Weapons** (the Thief's two kinds, kept as items, redrawn and renamed):
  - daggers become **twin chakrams**, ring blades she spins and throws that come back;
  - the gauntlet stays **the small glove**: she fights with wind from her hands and ribbons.

## How she fights (the Warrior's formula)

What makes the Warrior feel good, kept on purpose:

- **Hits land fast**, about a fifth of a second after the press, never a long wind-up.
- **A four-step basic string with a heavy finish** (hit-stop and shake), drawn from a pool of
  swings so it never plays the same twice (CLAUDE.md: basic attacks never feel stale).
- **Three or four skills that go off by themselves** from her attacks (procs), so holding attack
  keeps the fight busy.
- **Only two buttons** besides attack: a getaway move and the big finisher on a full gauge.
- **Her gauge: Encore.** It builds as her hits land in a quick chain, faster when she's in the
  air; it drains when the fighting stops. Full (**Standing Ovation**), her chakrams and gusts
  strike twice. The finisher needs it full and spends it all.

## The paths (at 30)

- **Blade Dancer** (chakrams): spins and throws, rings that bounce between monsters.
- **Sky Dancer** (gloves): gusts, ribbons and updrafts, a dancer who never lands.

Each gets its own string, procs, getaway move and finisher, built the same way.

## Status

- **Built (first job, 2026-11-02):** she is the Thief remade in place (the job keeps the id
  `thief`, so saves, gear, Vex and her quests carry over). Her four-blow strings and pools for
  chakrams and gloves, command moves, Encore (the old Shadow gauge) with Standing Ovation (every
  attack strikes twice), the procs Ribbon Lash, Gust Line, Spotlight and Light Feet, Pirouette, and
  Grand Finale. Her effects: `wdhit`, `wdswirl`, `wdgust`, `wdfinale`, `embdancer` in
  tools/fx-art.js (built with tools/build-fx-edge.py). Chakrams are the dagger items redrawn.
- **Paths:** the Blade Dancer (chakrams) is built and has replaced the Shinobi (docs/design/blade-dancer.md);
  the Sky Dancer (gloves, never lands, sky blue) is built and has replaced the Kitsune
  (docs/design/sky-dancer.md).
- **Outfit (2026-11-02, the player's pick: showgirl):** the dancers' gear line (render/jobgear/dancer.js)
  climbs from a street performer's bow and bodice to top hats and bolero jackets, a ringmaster's
  tailcoat with a tiara and plume fan, and a grand plumed crown with a feather bustle. Each path
  trims it in its own colour (render/hero.js PATH_TRIMS: the Blade Dancer's rose gold, the Sky Dancer's sky blue).
- **Still to do:** her own skill icons (she wears the old Thief's for now), sounds.

## Animation pass (2026-11-03)

Her moves were redrawn to read at game size and keep her face clear (render/moves.js `wd*`):

- **What the rig allows.** Her head is most of her height and starts right above the shoulders, so
  the weapon arm stays at or under about 105-110 degrees (higher, the hand comes up over her face),
  a raised chakram tips forward (weapon angle 65-75, out past her cheek, never pointing straight
  up), and the free hand flies wide or low, never above her jaw (`dancerHand`). Big swings go under
  (from low behind, past the hip, up in front), never over the top. The arm and ring keep to their
  drawn line with no automatic run-on (`DANCER_LINES` in `sway`).
- **Legs that read.** Working legs are long and clear of the body (`dancerLeg`: a straight leg at
  an angle from the hip), so a kick is a kick: the arabesque's leg goes out level behind with the
  body tipped well forward, the grand jeté and air split are flat splits, the fan kick sweeps up in
  front while the ring waits at her hip, the pirouette has the foot at the knee (passé). A leg
  raised much past level in front hides behind her head, so high kicks stop there.
- **Each figure its own shape:** piqué (high ring line, back leg in attitude), pirouette (passé
  turn, opening into a forward leg), arabesque (body horizontal), fouetté (the leg lashes out each
  turn, then the ta-da pose with the ring high), chassé (feet meet in the air, long low lunge),
  chaînés into a deep révérence; gloves: a lunge with both palms, a rond de bras that sweeps under,
  a relevé on one toe, a pirouette into a high front kick, a twisting lunge. Grand Finale climbs
  through three passé turns into a pose with the front leg kicked high, then a deep bow.

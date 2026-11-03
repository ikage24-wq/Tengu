# The Astronomer (the Star Witch's damage path; replaces the Onmyoji)

The player's picks (2026-11-02): an orbit caster, deep violet and silver, a calm dreamy stargazer,
and Planetary Alignment as her finisher. No summons (the yokai troupe goes). Held to the Wind
Dancer standard (CLAUDE.md).

## Who she is

A calm, dreamy stargazer who conducts the planets like a slow dance. Every figure flows, soft in
and out, never a snap; her gaze drifts up to the sky between casts; her staff moves in wide,
unhurried arcs held out from her, low or to the side, never across her face; her free hand floats
out to guide the planets.

- **Colour:** deep violet and silver.
- **Shapes:** violet planets banded and ringed in silver, little silver moons, thin silver orbit
  lines, and calm curves of things going round.
- **Her staff:** an orrery (the 'astro' finish on a staff): a slim silver staff, shorter than a
  witch's staff so it never reads as a lance, its head a violet world in tilted silver rings with a
  little moon riding the outer one; a second ring, a gem and stars up the tiers.

## How she fights

- **Her string (render/moves.js `as*`):** a long arc flinging a planet, a slow conducted circle
  sending two, and a ringed world swept out low that rolls through the line. Pool: a stargaze that
  drops a planet out of the sky, a slow pirouette, tracing an orbit, and gathering the night sky in
  both arms.
- **Commands:** the staff raised to the sky (up + attack), floating with knees drawn up and planets
  lowered at them (in the air), a glide out of a run.
- **Orbit** (her gauge, internally Binding): the moons round her, one for every fifth of it. Her
  spells that land build it; it fades once the fighting stops. Each moon in turn flies off at a
  monster close by on its own and rejoins the orbit. Full (**Full Orbit**, all five): they fly out
  twice as often.
- **Skills (world/astro.js):**
  - **Ringed Planet** (ofudabarrage): she spins an invisible globe, then pushes: a great ringed
    world rolls through every monster in the line.
  - **Gravity Well** (seimanseal): a small world hangs where she points for a while, pulling the
    monsters round it in and crushing them again and again.
  - **Lunar Tide** (yokairally): her moons circle faster, fly out more often and strike harder.
  - **Planetary Alignment** (troupecombo, her finisher, Full Orbit): she rises and draws a line
    across the sky; five planets fall into a row ahead of her and fire one beam through every
    monster in it.
  - **Celestial Lore** (onmyodo, passive): magic attack, steadier spells, sharper aim.

## Status (2026-11-02)

Built, replacing the Onmyoji in place (the path keeps the `onmyoji` id and its skill ids, so saves
and Elowen's trial carry over). She keeps to the staff.

- Moves: asfling, asconduct, asring and the pool's asgaze, aspirouette, astrace, asgather; asup,
  asair, asglide; asglobe, aswell, astide, asalign.
- Effects (tools/fx-art.js): `asplanet`, `asbig`, `ashit`, `asmoon`, `aswell`, `astide`,
  `asalign`, `embastro`. Icons, the Orbit gauge (a planet, five steps), her moons drawn orbiting
  her, sounds.
- Bots: an Astronomer in the party flings her planets and casts Planetary Alignment.
- Removed: the yokai troupe (the oni, the yuki-onna and the tengu: their code, drawings, outfits,
  hair, faces and sounds), the talismans, the star seal, the old dances, and the old Spirit Mage
  string that only her paths still used.

## Animation pass (2026-11-03)

Each figure now ends on its own held pose, measured and looking up: the fling ends on her toes with
the orrery held high, gazing after the planet; conducting beats a real four (down, out, in, up) and
closes the bar with the free hand raised; the ringed world sinks into a low bow, the orrery low
to the side and a hand at her heart; the pirouette is a full turn (clean mirror flips, the staff
kept behind her as she goes round) into an arabesque; tracing touches five stars in turn, then
lowers the staff and points up at the figure. The commands keep her fist low (the air cast from the
hip, the glide trailing the staff behind her and bringing it over the top), Lunar Tide stands the
staff upright by her hip (not up her face), and Planetary Alignment floats down with the orrery
lowered.


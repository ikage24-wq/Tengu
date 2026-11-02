# The Blade Dancer (the Wind Dancer's chakram path; replaces the Shinobi)

The player's picks (2026-11-02): bouncing rings, rose gold, built first. Held to the Wind Dancer
standard (CLAUDE.md): her own moves for her name, fluid, the face always clear, her own effects.

## Who she is

The Wind Dancer who has made the chakram her partner: a ring-throwing showgirl whose rings fly out,
ricochet from monster to monster and come back to her hand, caught on a turn. Showy, precise,
playful.

- **Colour:** her coral with **rose gold**, and flashing **gold rings**.
- **Shapes:** spinning rings and their trails, bright sparks where a ring bounces, orbits.

## How she fights

On the Warrior's formula, like the Wind Dancer.

- **Her string (her own figures, render/moves.js `bd*`):** a backhand flick throw (the ring bounces
  once), a cross toss (two rings cross in the air), a catch on a turn (it cuts all round her as it
  comes home), and an overhand hurl that ricochets through up to four monsters.
- **Ricochet** (her gauge, the Shinobi's Ki internally): every ring that lands and every bounce fills
  it; it drains when the fighting stops. Full (**Carousel**): two rose-gold rings orbit her and cut
  whatever comes near, on their own.
- **Procs:** Rebound (a ring sometimes bounces twice more), Twin Rings (a second ring sometimes flies
  with a throw), plus the Wind Dancer's.
- **Buttons:** Pirouette (from the Wind Dancer) and **Golden Carousel**, her finisher: rings gather
  into a great spinning carousel round her, then fly out and ricochet through everything.

## Status (2026-11-02)

Built, replacing the Shinobi in place (the path keeps the `shinobi` id, so saves and Vex's trial
carry over; the name is Blade Dancer).

- Moves (render/moves.js `bd*`): bdflick, bdcross, bdcatch, bdhurl, the pool's bdskip, bdlasso,
  bdlob, bdspinhurl, the commands' bdlob (up), bdairflick and bdairtwin (air), bdslide (run), and
  bdcarousel (the finisher). A move's `thrown` takes the ring out of her hand while it flies.
- The ring (world/melee.js `ringThrow`): a shot with `bounce` flies at a monster, ricochets on to
  the nearest it hasn't hit (each bounce 85% as strong, a `bdbounce` spark), then flies home to her
  hand wherever she has moved to.
- Ricochet (Ki internally) builds from rings landing and more from bounces; full, the Carousel's
  two rings cut what's close (`tickCarousel`).
- Skills: Ring Mastery, Rebound, Twin Rings, Golden Carousel (finisher, six rings flung out with
  three to five bounces each).
- Effects (tools/fx-art.js): `bdring`, `bdbounce`, `bdhit`, `embblade`, `bdcarousel`. Icons,
  HUD gauge (Ricochet / CAROUSEL), aura, sounds (`bdbounce`, `bdcarousel`, `carouselfull`).
- Outfit: the dancers' showgirl line, trimmed in her rose gold with gold gems.

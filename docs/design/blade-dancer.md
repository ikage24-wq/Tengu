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

## Animation pass (2026-11-03)

Her throws were redrawn so the empty hand never falls into a plain stance while the ring flies
(render/moves.js `bd*`; docs/design/wind-dancer.md gives the rig's limits): the flick points after
the ring on one toe with the back leg lifted; the cross toss crosses her arms over her chest, then
springs them open with the back leg out; the hurl drives into a deep lunge with the back leg
stretched long; the skim holds a low crouch; the lasso swings below her hand (free hand on her hip,
foot pointed) and steps into a pointing lunge; the lob rises onto one toe, hand still raised; the
spin hurl tips into an arabesque; the slide drops onto the back knee leaning back. Golden Carousel
climbs about ten pixels through its turns, coils with the ring drawn behind her, and flings it into
a held arabesque high in the air before the catch and curtsy.

## Footwork and effects pass (2026-11-04)

A showgirl's footwork: every throw of her strings steps her forward (8-18 px, the slide 72) and is
about a tenth quicker; her rings fly about an eighth faster. She skips into the flick with the front
knee popped up (the kick-line skip, `KICKLINE` in render/moves.js) and bounces while it flies, hops
on the cross toss's second ring, sails through the turning catch, leaps off the coil into the hurl,
bobs on her heels with each pass of the lasso, springs after the lob, and pops up out of the crouch
and the slide; held poses settle with two little rebounds. Golden Carousel is a tenth shorter and
climbs higher.

Golden Carousel's track is drawn as wide as its cuts reach (120 px either side, was 50) with
bigger rings, behind everyone; her ring in flight is a little larger (about 35 px, the big one 50).

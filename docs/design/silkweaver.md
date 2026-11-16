# Silkweaver

The Moon Moth's control path at level 30 (2026-11-16): the controller. The player picked it, with the
Eclipse (damage) as the other path, from four pitches (Eclipse, Silkweaver, Lamplighter, Atlas).
Asks for Vex's trial first (the same trial as the Eclipse: either path, once).

## Who she is

Moths come out of cocoons; the Silkweaver goes back to where they began. She spins moonlit silk
off her daggers: threads that catch, slow and tie up whatever she cuts, until it hangs wrapped in a
cocoon. She keeps a pack tied up and helpless while she (and her party) works through it. Daggers,
one in each hand, drawn exactly as equipped (never a spindle or needle in her hands: the silk comes
off the blades and her fingers).

- **Colour:** pearl white and warm cream, inked in soft plum, with a fine gold thread.
- **Shapes, hers alone:** silk threads (smooth curves that glint as they catch the light), loose
  loops of thread round a monster (one per thread), cocoons (a soft wrapped oval, the thread spiralling
  round it), a great pearl moon like a spool of silk, and pearl moths (the Moon Moth's spirit moths in
  pearl and gold). Cute and soft, never creepy: no webs, no spiders, nothing sticky or dripping.
- **Stat:** LUK. Crowd control first: she hits a little lighter than the Eclipse on one monster and
  carries better through a pack.

## Threads

Many of her blows tie a thread to what they hit (up to three, for 6 s since the last). Each thread
slows the monster by a fifth. The third wraps it in a **cocoon**: it hangs helpless for 2 s and takes
a quarter more from her blows; then it breaks free and can't be cocooned again for 5 s (its threads
start over). Bosses take threads (slowed half as much) but are never cocooned.

## Basic attacks (`PATH_COMBOS.silkweaver`, `PATH_VARIANTS.silkweaver`)

1. A quick cut trailing a silver thread (`svcut`), or a cut and a thread flicked from the off hand
   that snaps at them farther off (`svflick`).
2. A turn that winds silk round her as both daggers cut all round (`svwrap`), or a rising cut on a
   thread that lifts them (`svlift`).
3. Finisher, ties a thread: both daggers crossed and pulled apart so a thread snaps taut across
   them (`svbind`), or a thread lashed out to the one ahead and yanked in to her daggers (`svyank`).

Command moves: up + attack, she climbs a thread up through them cutting (`svrise`); in the air, two
cuts hanging off a thread (`svaircut`); out of a run, she zips along a thread through the line and
cuts back at what she passed (`svzip`).

## Spool (her gauge)

Her hits build it, hits on threaded or cocooned monsters half again faster; it fades once the
fighting stops. The fuller it runs, the longer her cocoons hold (up to half again). Full (Full
Spool): every blow she lands ties a thread, and Moonspun Cocoon is ready.

## Her skills

- **Silk Swing** (movement): she casts a thread up high and swings forward on it over the monsters,
  landing beyond them and cutting back at all she passed, a thread on each. Nothing touches her on
  the swing.
- **Binding Thread:** she flings a spray of threads that catch the five nearest monsters ahead: a
  little damage and a thread on each.
- **Reel In:** she grabs every thread she has tied near her and hauls: the threaded monsters are
  yanked in to her and cut as they arrive, harder for every thread on them.
- **Spindle:** she spins like a spindle, silk whirling out round her: everything near is cut twice
  and gets a thread from each cut.
- **Weaver's Mastery** (passive, grows with level): truer cuts, and her threads and cocoons last
  longer.
- **Moonspun Cocoon** (finisher): on a full Spool, a pearl moon rises behind her like a great spool;
  threads shoot out to every monster in front of her and wrap them all in cocoons; she pulls the
  threads tight and every cocoon bursts into pearl moths.

Her Moon Moth skills, her way (pearl moths, silk instead of dust, and a thread on what they hit):
Moth Step is **Silk Step**, Wing Flurry is **Silk Flurry**, Moth Swarm is **Silkmoth Swarm**, Midnight
Swarm is **Pearl Moon**, Moth Veil is **Silk Veil**, Dazzle Dust is **Pearl Dust**, Moonlure is
**Silk Lantern** and Wing Feint is **Silk Feint**.

## Where things live

Moves: render/moves.js (`sv*`). Effects: tools/fx-art.js (`sv*`; her versions of the Moon Moth's are
`silklit`), drawn by render/moth-fx.js. Threads, cocoons, gauge, combo: world/melee.js. Skills:
data/skills.js. Trial: Vex's, data/quests.js (`thief_trial`), scenes in data/scenes.js.

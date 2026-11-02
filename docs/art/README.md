# Art, animation, and effects: what we've learned

Everything here came out of deep research across five languages (English, Japanese, Korean,
Chinese, Russian), roughly 350 sources: pixel-art tutorials, artists' process posts, pixel fan art
of anime and game characters, game dev talks and postmortems (GDC, CEDEC, NDC), and real data from
games such as MapleStory. Follow these rules for every new piece of art, animation, or effect, and
carry an improvement across every part of the game it applies to.

- [art-bible.md](art-bible.md): the rules for faces, outlines, colour, hair, and animation polish,
  with exact sizes and palettes. Read it before drawing anything.
- [research/](research/): the full findings, each with its source, the game or artist, and where it
  applies in Tengu: [en](research/en.md), [ja](research/ja.md), [ko](research/ko.md),
  [zh](research/zh.md), [ru](research/ru.md), [fx](research/fx.md) (effects and game feel),
  [env](research/env.md) (maps, UI, icons), [anim](research/anim.md) (animation craft), [archery](research/archery.md) (bows, crossbows, archer skill effects),
  [fanart](research/fanart.md) (how pros put anime characters into small sprites),
  [avatar](research/avatar.md) (dress-up avatar games the player named as references: SELFY /
  attrade and CocoPPa Play; read before any hair, outfit or cosmetic work),
  [sakuemon](research/sakuemon.md) (Sakuemon's pixel animation: the player's main reference for body
  proportions, idles, attacks, jumps and walks),
  [diives](research/diives.md) (Diives' safe-for-work character acting: expressions, emotion symbols,
  squash and timing),
  [combat](research/combat.md) (combo counters, links, finishers and cut-ins, juggles, blending
  between moves)).
- [briefs/](briefs/): the briefs the art and improvement passes worked from (conventions, quality
  bar, review loop).

## The rules in short

**Faces and eyes**
- Eyes are 4–6 clean shapes, never a dozen tiny ones: one bold lash polygon (thickest at the outer
  corner, ending in a wing), a lash shadow across the top of the white, an iris in three bands (dark
  top, mid, light bottom crescent) with a pupil that fits the species, a big catchlight and a small
  one in the same place in both eyes, and a light lower lid (never dark).
- 3/4 view: mouth and chin on the face's centre line, the far eye about 70% the width of the near
  one, a tiny nose hint, shaped lips. Shadows under the bangs, on the far cheek, and under the chin.
- The face holds the strongest contrast in the sprite. Eye colour must contrast the hair colour.
  Hair separates from skin by value (a bangs shadow where face meets hair).
- Every mood is acted by the whole face and differs per character: no stock `> <` everywhere.
- Ears come in styles (`hero.js` `EAR_STYLES`: round, elf, long elf, pointed: broad and swept up and out like MapleStory elves, droopy: long and slender, reaching out and drooping down a little). Elf ears are a pointed leaf
  drawn at the ears' layer, under the side locks, so the hair covers the base and the tip pokes
  out past it; the back ear is the front one mirrored in shadow, and from behind both tips show.
  The crowd and other players get a share of every new look option, so the world shows them too.
- Brows come in styles (`hero.js` `BROW_STYLES`: soft, thick, round hikimayu dots, thin, arched,
  sharp, hidden), each built as a tapered ribbon (or an oval) that follows the expression's raise
  and tilt, and every face shows them (at rest when the expression doesn't move them). Each brow
  sits on a thin skin-coloured edge, so it reads over the bangs even when the hair is as dark as
  the brow.
- Hurt and knocked-out faces replace the expression, not layer on it: no sparkles, notes,
  winks or puffed cheeks over `> <` (`hero.js` `headShapes`). Marks around the head (sparkles,
  notes, sweat) float clear of the hair's outline and never sit on an eye; a style that hides an
  eye (the swoop) moves winks and raised brows to the eye that shows.
- Kits: `src/render/mobs/faces.js` (creatures) and `src/render/mobs/heroine.js` (3/4 anime faces,
  scales down to small heads).

**Lines, colour, shading**
- Outlines are a darkened shade of the part's own hue, never neutral black. Selective outlines:
  lighter on edges facing the light, darkest at the bottom and back (done by the renderer for
  monster sprites, `selout`).
- Character outlines stay as they are: the player tried a thinner line and a line in each part's
  own colour (instead of the deep, near-navy ink) and chose to keep the original.
- Shadows shift hue (cooler or toward magenta) instead of going grey; highlights shift warm. At
  most 4 tones per material. No pillow shading; light from one direction.
- Gear and weapons shade by material (`src/render/jobgear/kit.js`): each flat shape gets planes
  clipped inside it (a half-plane clip, so the silhouette never changes). Metal: shadow plane on the
  back, the base kept as reflected light on the far edge, a highlight patch at the upper front and a
  specular corner. Cloth: one back shadow, no highlight. Gems: inverted (dark near the light).
  Upright parts shade on the back, wide parts underneath. Step ramps by chroma, not HSL saturation,
  or pale tints turn into strong peaches and lilacs in shadow.
- Skin and hair ramps by multiplying with a tint (`hero.js` `skinRamp`, `hairRamp`): the shadow
  darkens and rotates hue in one step and works for every tone from pale to deep brown (the
  lavender `shadowTone` turns tan skin grey). Draw such faces flat (F) and place the shadows by hand.
- On deep skin a pale multiply tint only reddens, so a cast shadow reads as a lighter, warmer band:
  deepen the tint as the skin darkens (`skinRamp` `deep`) so every tone drops a similar value step.
  Dark hair's sheen is its own hue lifted and enriched (near-black takes a cool indigo), never
  mixed toward cream, which turns grey.
- Bright marks (sparkles, stars, glints) give their own outline with `line` on the shape (pixel.js);
  `sparkLine(c)` is a warm gold from the mark's colour. The automatic darkened line greys them.
- Form shadow on round monster parts: a crescent on the back and underside whose inner edge is the
  same oval nudged toward the upper-front light and tapered to nothing at both ends (never a ring);
  notch that edge for fur. Ramps from `ramp()` in `mobs/meadow.js` (hue turns toward violet in
  shadow; pastels need negative `sat` or the shadows go garish).
- Minimum readable line is 2/3 of an art pixel; no stray single pixels; snap feature anchors to the
  1/3-pixel grid so faces don't flicker as heads bob.

**Hair**
- Clumps with pointed or V-notched tips of different lengths (4–7 across the bangs), one highlight
  band across the crown, back hair one shade darker, flaring out below the jaw.
- Motion: the root leads and the tip follows; layers offset by about a frame; tips trace a
  figure-8; never ping-pong the same frames.
- Separate clumps by drawing each lock over a copy of its lower half in shadow 1, nudged down and
  back: it shows only where clumps overlap and at the tips (no stripes). Bangs cast a copy of
  themselves (plus the hairline) 1 px down in skin shadow, drawn under the eyes.
- A two-link hair chain is enough: a root spring on the body and a softer tip spring chasing it;
  points blend from root to tip by depth (`b`, `b²`) and lift a little when they disagree.
  Bend every hanging shape point by point (cut outlines into ~1.5 px steps, ellipses included),
  easing in below the skull (smoothstep), or a long sheet shears like a card; let locks further
  from the middle trail a touch more so they fan instead of moving as one (`hero.js` `swayShape`).
- Every hairstyle needs its own silhouette: if two read the same in a thumbnail, cut one
  (retired styles map to their closest kept look in `hairStyleOf`, so saves still draw).
  Capes are the same two-link chain (`animator.js` `cape`/`capeTip`, kit.js `hang`): the root
  spring rides the shoulders (stiffer, damping ratio ~0.5), the hem chases it on a softer one
  (~0.4), so it lags a start and swings past on a stop before settling.
- Gear sets (`jobgear/sets.js`) draw their own signature pieces (hat, back piece) for every job
  and layer their motif over the job's own top and gloves, so a set reads at a glance on any job
  while the job's cut still shows; a full set adds a themed aura (`live.js` `setAura`).
- The creator's outfits (`jobgear/starter.js`) are a gear family drawn in a palette from the
  picked color plus a paired pastel accent (pink with sky, peach with mint, yellow with
  lavender...). Each has its own silhouette and one signature glyph that reads at game size (a
  sailor collar, an apron, a hood, a plaid skirt, bulging puffer rows), its own shoes, and where
  it suits, a hat or glasses (an equipped hat replaces it; hairstyle thumbnails show the head
  bare). Small details blur into noise at 1x: no scattered dots or highlight specks on cloth.
- Skirts, tassets and the hems of dresses and robes drape over the posed legs (`gear.js` `drape`):
  per row, push the cloth's side out past wherever a leg reaches beyond its resting edge, plus a
  little give from every leg move so wide dresses still swing; a push holds for every row below it
  and tapers up to the waist, so the side flares as one A-line instead of kinking at the knee.
  Subdivide outlines first so edges bend; plain dresses and robes also hang on the cloth springs.

**Animation**
- Attacks: wind-up held, a short strike, a held impact, then settle (MapleStory: 300/150/350 ms).
  The impact frame shows the moment damage lands. Monster wind-ups are exaggerated; the player's are
  short.
- Hurt: a held, most-squashed first frame, a jelly wobble back, a lean away from the blow.
  Death: knocked up on an arc, bounce, hold, flash, poof. A fallen hero (you or a party member,
  `town.js` `drawFallen`) is knocked up and back turning onto their back, bounces once, lies
  still, and a ghost rises out after a beat.
- Walk bob dips as each foot lands; idle breathes in slowly and out quickly with a sideways sway
  and a held beat; landing squash scales with fall speed (Celeste numbers).
- Cycles keep a fixed length however many frames they have; walkers step with the ground they
  cover (`stride`), so feet never slide.
- Springs are solved exactly so hair and capes move the same at any frame rate.
- Chibi legs are too short to cover a run's ground at a calm cadence: give the run a short stance
  (24%) with a float between steps and the walk a longer one (52%), and a stride per gait so the
  planted foot travels exactly the ground covered (`animator.js` `strideAt`, legs narrowed by KX).
  Keep strides short (walk 17, run 38): the ground a planted foot slides must stay well under the
  legs' height on screen, or every step becomes the splits. Quick little steps suit a chibi.
- A front-facing body walking sideways: turn the pelvis (hips drawn together, `rig.hipIn`) and
  shade the far leg so the legs scissor in depth instead of splaying into an X; arms swing only
  outward on screen, a swing across the body showing as the hand lifting toward the viewer, and
  their elbows bend mostly in depth (`arm()` `side`), never out like wings.
- Wing beats are keyed, not a sine: hold at the top, a fast downstroke, a slow recovery; each wing
  bone takes the beat a little later than the one before it, and the body rises a beat after the
  push (the retired summons did this; they are in git history). Companions that shoot on a timer
  wind up while the next shot is due, strike on the shot, hold about 0.2 s, then settle.
- Face-kit shapes (`mobs/faces.js`) come out in plain coordinates: carry them through your part
  transform, or the face stays put while the head moves.

**Effects and game feel**
- An impact plays in layers: a dark contrast beat, a flash that jumps from tiny to big, then sparks.
  Fire fades fast, smoke slowly and tears apart. Bright effects get a darker rim so they read on
  pastel maps.
- Hit-stop: short on light hits (about 0.03–0.05 s), capped at 0.1 s; weight past that comes from a
  slow-motion tail, a flash, and a camera kick. Middle hits of a multi-hit don't stop; one strike on
  many monsters never stacks.
- Screen shake is trauma that stacks and drains (camera moves by its square along smooth noise).
  Struck monsters shudder during hit-stop.
- Damage numbers pop in with an overshoot, drift on alternating arcs, and total multi-hits.
- Hit-stop freezes effects too, so a one-frame dark contrast disc in front of a big burst holds on
  screen and reads as a flat ball over the hero: skip it on effects that land with hit-stop (the
  Berserker's `rageburst`). `deep()` of a warm red mixes toward ink purple and reads pink or mauve
  on our pastel skies; give red effects their own near-black crimson or a hand-picked red ramp.
- A move's own untouchable stretch (dashes, dodges, finishers) must not use the hurt blink: it
  reads as weakness and made finishers flicker. Only blink while recovering from a hit.
- Speed (the player asked for no lag): characters are one picture per pose, redrawn whenever any
  part moves, so drawing a sprite must stay fast (the rasterizer grows outlines from edge cells
  only and fills polygons without allocating). Anyone but the player and a boss draws through a
  per-frame budget (`spriteBudgeted` in pixel.js): past it they keep last frame's picture for a
  frame. The effects' glow is skipped when nothing bright is on screen.
- Motion is smooth (the player's ask): monsters walk and idle through four
  in-between poses per drawn frame, so a stride or a breath flows instead of stepping; attack
  frames stay whole, since their uneven timing is the point. The in-betweens are drawn in the
  background (`sprite-worker.js`, `spriteLater` in pixel.js) and the whole frame stands in until
  one is ready, so no hitch. A new monster design must pose its walk and idle from the frame's
  phase (`f / n`), and read any per-frame table with `keyAt` (mobs/kit.js), which blends between
  entries; `tests/anim.test.js` draws every design at every in-between. The hero's idle acting
  runs at 30 steps a second.
- Moves cut into each other ease out of the previous pose over about 70 ms (`hero.js`
  `blendMove`, `scene.js` BLEND): angles take the short way round, rig tweaks switch halfway.
- Each path's effects keep one shape language (fx.md C14), so a hit says whose it is: the
  Ranger's wind is rounded curls, ribbons and leaves (`archery.js`); the Sniper's is straight hard
  streaks, four-point glints on the corner, and a rose sight. Shot trails are tapered ribbons that
  step white, main, deep from head to tail (fx.md D), not faded copies.
- **Effects are Tengu's own art, HD with a soft glow** (the player first picked "matched to the
  sprites" out of 18 sample styles, after rejecting gradient glows, pixel packs, HD packs and
  black-outlined anime cel; later, shown 11 ways to smooth them, picked HD + soft glow):
  - Drawn in `tools/fx-art.js` as soft pastel shapes: 4-tone ramps (white, light, base, shade)
    that lean violet in the shadows, an outline colour that is a darker shade of the effect's own
    hue, rounded crescents and petal bursts, beads and the game's curvy four-point sparkle.
  - Then rendered in HD (`FXHD.render`): three strip pixels per game pixel with smooth edges,
    plus a soft glow blurred from the bright parts only (so dark outlines never smudge), drawn
    under the art. The game draws them smoothed and fades each drawing into the next (an
    in-between), so a 12 fps strip flows at the screen's rate.
  - The small pieces still drawn in code (stars and shots in flight, trails, hit sparks, dust,
    poofs, dungeon attacks) get the same soft glow on screen in HD: a bright-only copy of them is
    blurred and laid under them (`drawGlowing` in post.js); the strips sit that pass out, since
    their glow is already drawn in.
  - Every effect is a few key drawings: pop in, hold a beat, break into beads and sparkles.
  - Effects that play large (rings across a group, the magic circle, a whirlwind, a finisher's
    rupture) have big versions (`*big`) that play their strip larger; in HD that stays sharp, so
    they share the small one's strip instead of a second file.
  - Warriors: swipes laid along the blade's own swing (steel blue, the Paladin's gold, the
    Berserker's rose red); hits leave the Warrior's cross of blades, the Paladin's star of light,
    the Berserker's claws; buffs rise as a pillar of light with the path's emblem, except the
    Berserker's, which flare up in fire and climbing embers (`celembers`) round his emblem. The two
    paths once shared shapes in two colours (red pillars and smooth red rings beside her gold ones,
    and the same swings), so they read alike: now his ground is torn open in three claw gashes
    (`celgash`) and his waves are rings of jagged teeth (`celshockred`), while pillars, smooth rings
    and stars stay hers. Give each path its own shapes, not only its own colour; Grand Verdict
    drives a sword of light down over the magic circle; Crimson Eclipse raises a crimson eclipse.
    The Warrior (first job) is steel blue and white: his Valor aura is steel chevrons and diamonds
    rising round him (the steel emblem over his head when Unbroken); Titan Breaker gathers a giant
    steel sword out of shards over his leap, then drives it into the ground in a cross of steel
    light while the ground splits open with blades of light (`celfissure`); Iron Guard snaps up a
    steel honeycomb shield.
  - Archers: the Ranger's emerald wind (curls of wind, gusts of leaves, a wind-orb spirit, a
    tornado, rings of wind); the Sniper's ice-blue lens of light tearing through each monster a
    bolt pierces (every Sniper bolt pierces the line), snowflakes and a frost burst, a puffy blast,
    a rose sight for the Deadeye.
  - The Spirit Mage: white spirit light with a warm gold heart, no outline, and the shrine's own
    shapes on everything: zigzag paper streamers (shide, drawn bolder than real so their folds
    read at game size), scarlet cords and gold bells. Her bolts are wisps trailing streamers
    (`celspiritorb`); hits flash and fling paper scraps (`celspirithit`); Spirit Wave is her ring
    racing out both ways (`celringspirit`, twice, the second fainter); Blessing a column of warm
    light (`celblessing`, also each of Heaven's Lantern's rays); Spirit Ward a see-through sphere
    bound with a sacred rope (`celspiritward`, on party members too), bursting in light when it
    breaks; Heaven's Lantern a giant ribbed paper lantern (`cellanternbig`, held on its glowing
    drawings while the rays fall). The doll's tricks are comic, not grand: a fan smack, a bell
    bonk with comic stars, a streamer whirl, and a chewed-paper spitball (`celspitball`) that
    lands as a dripping splat with wobble lines (`celspitsplat`). Her dance and the doll are
    animated, not effects: see render/moves.js (`DANCE_STYLES.grounded`) and render/spiritdoll.js.
    tools/build-fx.py needs Playwright; without it, new strips can be drawn from fx-art.js in any
    browser (`FXHD.render`) and stripped the same way (frames trimmed to the box they share).
  - Skills a path inherits from its first job take the path's look, not the first job's: the
    Archer's Blast Arrow bursts in fire for her, a gale of wind and leaves for the Beastmaster
    (`celgaleblast`) and a thunderclap for the Stormcaller (`celthunderblast`), and a sprung trap
    flings its monster up in the same burst. Every path's buff pillar has its own emblem: the
    Beastmaster's wolf head on a crescent moon (`celembwind`), the Stormcaller's bolt out of a
    thundercloud (`celembstorm`). A new school needs adding to `tint` in warrior-fx.js, or its
    pillar and ring quietly fall back to the Warrior's steel blue (the Stormcaller's once did).
  - The Stormcaller's lightning is "Crackle" (the player picked it from three styles shown side by
    side; the old thick inked zigzags with a star at the end read as cartoony): fractal channels
    (midpoint displacement, so kinks at every scale) drawn as plasma with no outline (a faint
    violet halo, a violet body, a thin white-hot core), two to five strands twisting round each
    other, a fresh channel every drawing so it flickers, a soft flash and arcs crawling over the
    ground where it lands (`crackle` in fx-art.js; `zigzag` in archery.js draws the live arcs the
    same way). Light itself has no ink line. Everything else of hers was then brought in line (a
    bold inked ring or crystal pillar beside the soft lightning looked cartoony): her ring is
    lightning racing out over the ground, her buff pillar a column of crackling strands, her
    bolts in flight streaks of glowing plasma, charged ground arcs crawling over it, and her storm
    cloud is soft (the player picked "Billowing" of four: a density field of noise-warped
    ellipses torn soft at the edge by more noise, lit from above, billows given relief by ridged
    noise, lit from inside by lightning; `cloud` in fx-art.js). Only her emblem keeps an outline,
    being a badge.
  - The Paladin and the Berserker followed (the player asked them to match, free to change
    anything until they did): light and fire have no outline. Her pillar is a shaft of sunlight
    with shimmering rays and drifting motes, her ring a soft wave of light, her hit a lens flare's
    long thin rays, a heavy blow bursts light up out of the ground through soft dust; his fire is
    real flame shaped by rising noise (white-hot base to deep red tongues), his gashes molten with
    charred lips, his claws red-hot rakes cooling to dull red, embers that cool as they climb,
    soft black smoke, molten cracks, a shockwave of torn flame, and a black sun with a corona of
    real fire. Everything else of theirs (swipes, whirls, dashes, war cry, shields, plates, the
    sword of light, the magic circle, blood) goes through `asLight` in fx-art.js: the same drawing
    with its ink line dropped and its tones graded from a white-hot core to a faint halo. Their
    hits throw only sparks of their own colour (no cartoon star or ring), their crits are their own
    (a bigger flare; a white-hot burst with claws; for the Stormcaller a bigger crackle), a bleed
    drips real blood, and their stomps kick up earthy dust. Emblems keep their outline.
  - The Warrior then followed, in his steel blue and white: his cut is a motion blur behind the
    blade (a razor-bright edge smearing back into a fading cold wake, a glint at its tip), his hit
    two bright cuts crossing with orange-white sparks of struck metal, his ring a ring of rushing
    air, his pillar cold light with sheen sliding up it like light along a blade, a heavy blow
    soft dust with chips of stone and sparks. The rest of his (whirl, dashes, gathering, war cry,
    Iron Guard, Titan Breaker's sword, crack and cross, Valor aura) goes through `asLight`. His
    crits are a big cross of cuts, and his stomps and Titan Breaker kick up soft dust (the `haze`
    particle; `REAL` in warrior-fx.js), not outlined cartoon puffs.
  - The Archer (first job) is warm gold with sky blue: gold arrows trailing sky-blue streaks,
    hits that pop a gold star with a sky swoosh and burst into feathers, gusts of gold feathers
    off the bow, a feather emblem, gold feathers circling her as Momentum builds, and for Falcon
    Dive a great golden falcon of light (wings of long gold feathers tipped sky blue) that wheels
    over her and dives through the line. Gold alone was too close to the Paladin's light, so the
    sky blue is what makes a hit read as hers.
  - The Thief (first job) is violet and midnight with moonlight silver: thin violet dagger swipes,
    a violet X with a silver glint on every hit, puffs of violet smoke for steps and vanishing,
    violet streaks behind thrown stars, wisps of shadow and little crescents rising as Shadow
    builds, a crescent-and-dagger emblem, a full moon for Full Moon Volley and a giant crescent
    moon for both finishers' last cut. Her Phantom is a violet shadow copy of the hero herself.
    The moon first came out a flat white disc (the match snaps pale tones to white), so it is
    drawn a step darker, lavender with violet shading.
    Brought up to the realistic look (the player asked, to match the other jobs): no outlines,
    light, motion and smoke. Her cuts are fine motion blurs of violet with a moonlight-silver edge;
    a hit is two thin cuts crossing with a silver glint and violet sparks; her smoke is a soft
    curling noise field (no balls); the moon is real moonlight, a pale disc with soft grey seas in
    a soft halo; the finishers' crescent is a blade of moonlight with a violet haze; her stars are
    steel blurred by their spin with a glint flicking off them; her Phantom is a see-through copy
    trailing smoke. Two things went wrong on the way: the moon's halo was drawn as stacked discs
    and showed hard rings (a painted fall-off fixed it), and the crescent drawn from many short
    strokes banded where they overlapped (painted as one field instead). The first realistic cuts
    were also too faint to read over a bright map; they need a solid violet body under the glow.
  - The Blade Dancer (2026-11-02; she replaced the Shinobi below) is rose gold and gold in the HD
    soft-glow style: her ring in flight spins with a rose smear curling behind it the way it flies
    (home to her hand too); a ricochet is a gold flash with sparks kicked off in a V; her hit is a
    ring-cut looping right round the monster; her badge two linked rings; full Ricochet is two rings
    orbiting her waist, passing in front and behind; Golden Carousel is six rings riding a gold
    track round her, faster and faster, then flung out in a burst. Her held chakram takes a
    rose-gold finish.
  - The Star Witch (2026-11-02; she replaced the Spirit Mage) is midnight blue and warm gold with
    white star cores, HD soft glow: her bolt is a spinning five-point gold star with a midnight comet
    tail; her staff fires comets (a big star in a gold ring with a long tail) and calls meteors
    down; her hit is a little four-star constellation snapping shut round the monster; her gauge is
    a constellation of seven stars over her head that light one by one; Wishing Star is a star
    falling into a column of gold light, Star Veil a dome of linked stars; her badge a witch's hat
    with a gold star. Wands are star wands held at the end, staves witch staves held near the foot.
  - The Sky Dancer (2026-11-02; she replaced the Kitsune below) is sky blue and white with a touch of
    pale sunlight, HD soft glow: her gust is a crescent of wind with a feather riding its head and
    streaks of air behind; her hit is a soft cloud bursting with a swirl through it that drifts
    apart into puffs and feathers; a whirlwind of stacked rings turns under her feet as Tailwind
    builds (full, she rides it); her badge is a wing over a cloud; Sky Waltz is a tornado that
    builds into a tall column and slams out along the ground in clouds and sunlight. Her gloves
    take a sky-blue finish.
  - The Thief's paths as they were, a pair from the same shrine, both realistic (no outlines). The
    Shinobi (replaced by the Blade Dancer) was ink: her cuts are wet brush strokes that dry out into bristle streaks at the tail, with a thin
    red sheen and drops flying off; a hit is a splash of ink with a thin red cut; seal tags are
    paper with a red brush glyph that burst in a red circle of light; her smoke is white; her
    emblem a red seal stamp; Ki is ink rising round her; her finisher a giant fox painted in ink
    in one sweep of the brush. Ink alone vanished on dark maps, so every ink shape keeps a little
    red light (an edge, a ring, a seal). The Kitsune is blue fox fire: every flame is a shape's
    distance field burned by turbulence scrolling up through it, so the edge breaks into tongues
    that lick up and tear off; it's deep blue through the body and white only at the hottest core
    (all-white flames read as torn paper with a blue outline), with gold sparks; her tails are
    plumes of it fanned behind her, her emblem a fox's face in flame, her finisher a fox of fire
    with nine tails. Smooth teardrop flames first came out looking like water drops: real fire
    needs the turbulence.
  - The Mage was removed (a new magic class is being built from scratch) and her pink petal art
    with her. What stays from her is the heal: a mint flower of light with a rising column (it
    replaced the old code-drawn heal sparkles everywhere: party heals, GM heals, HP coming back).
  - Monsters and some buffs' lasting looks are still code-drawn and need the same pass.
- The Ranger first read as bland next to the Sniper: pale mint wind vanished on purple maps,
  hits were thin white rings, and she had no big moment. Wind is now a saturated emerald with a
  dark teal ink rim; hits layer a star flash, two crossing wind slashes, a swirl and leaves; skill
  arrows are drawn big; and she has signature moments (wind spirits at full Gale, a tornado, a
  storm sky). Every path needs a bold colour and at least one moment of its own.
- Archers (research/archery.md):
  - A bow's string bends back to the draw hand with the arrow on it while drawing.
  - On the loose the string snaps straight in one frame (never eased), then rings as two faint
    lines for a few frames.
  - The draw hand flies back past the ear and holds there; the follow-through is the longest beat.
  - Volleys hold spare arrows fanned in the draw hand.
  - Air shots tip the body forward with the bow arm down, and pop up a little on each loose.
  - A crossbow never bends: the back hand's cocking pull after the shot is its motion, and between
    shots it rests at low ready, just under the aim, so a shot settles instead of dropping.
  - Sniper bolts give the view a small kick. No tracer line: the player wants to see the bolt
    itself fly (a thin white line read as a laser, not an arrow), so bolts are drawn big, with
    fins, at a speed you can follow (720-950 px/s; MapleStory's arrows are always visible).
  - Lock-ons dim the world and pop sights on one at a time, each tick a step higher.
  - Charging shots glow in steps (none, blue, white with a rose rim), with a flash at each step.
  - Ice cracks first, flashes white at the instant it breaks, then shards fly and mist lingers.
  - Not done yet: arrow hits still freeze the whole world; the research says only the arrow and
    the target should stop.
- A blast is a sequence (fx.md C12, C17): a white flash, then lumps that burst outward and tear
  open as they go, then smoke that rises and breaks up. One swelling fireball reads as a flat
  orange disc.
- No finisher cut-ins: the player asked for them to be removed.
- The player prefers effects that move smoothly over held anime frames: `fxkit.js` `stepped` now
  passes progress straight through.
- Effects keep playing through hit-stop (`main.js`: only the world freezes), as Toylogic's notes
  say; otherwise a one-frame flash, a white first drawing or a wash hangs on screen as a blob.
- Smears trace the blade's own path (`effects.js` `bladePath`/`bladeSmear`): the tip and hand
  sampled from the hero's pose over the cut, trimmed to where the blade is actually moving (drop
  the slow wind-up), corner-cut twice so it curves, drawn as a tapered ribbon. Every move, old or
  new, gets a smear that matches it.
- Monster hit flash is a light tint (0.8, then a short fade), not solid white: a crowd hit at
  once otherwise blooms into white blobs.
- A body twist (`turn`) below about 0.8 squashes a front-facing chibi into a sliver; keep wind-up
  twists at 0.84 or more.
- A giant sword of light must be wide (blade about 44 px with a winged cross-guard) or it reads
  as one more pillar.
- Holy pillars (`strikes.js` `pillar`): a thin ray first, then a tapered wedge (narrow at the sky,
  wide at the foot) in four nested tones, a rounded bloom at the foot, and slices that vanish from
  the top down; flat straight-sided columns read as UI bars. Ground rings stay flat (height about
  0.12 of the width) and unfilled, or they wash over the fighters standing in them.

**Maps and UI**
- Far silhouettes: flat, no outline, a lit rim on the upper-left by filling the shape in the rim
  colour and then its body shifted 2 px down-right (`litFill` in scenery.js); behind them one still
  simpler ridge, almost the sky's colour. Water takes a per-map ramp (`WATERS` in landmarks.js).
- Nothing standing on the ground may run up into a ledge above it: it reads as poking through.
  Place landmarks clear of ledges; where a tall one can't fit, it's set back a plane automatically
  (drawn before the ground, washed toward the sky; `scenery.js` `setBack`), and town street houses
  skip slots under ledges (`hitsLedge`). Waterfalls and cloud pillars meet their ledge on purpose.
- Far layers fade toward the sky colour and get paler; vertical parallax stays tiny (about 0.05);
  a foreground layer in front of the characters adds depth; varied tiles, never one repeated tile.
- Bag icons of near-black gear take a monotone value lift (`icons.js` `liftTone`, icons only):
  tones under the floor rise toward it on one curve, so tone order and material planes survive
  and the darkest reads as a deep hue, not a black blob in a dark slot.
- HUD cards (the quest tracker) can be dragged by their header, folded and closed, and remember
  where they were left (`settings.trackerPos`); whatever closes them names where to turn them
  back on. Windows that list things pair a list with a detail pane, and say where to go next.
- Every item cell is `kit.js` `itemSlot` (bag, equipment, shops, quest rewards, player shops):
  a cream cell, the item on its ground shadow (lifted a pixel on hover), rarity as an inner ring
  in its color plus a corner glow for Epic and up and a shine for Legendary, count and upgrade
  level in the corners, and a greyed ghost of what goes in an empty slot. One badge per cell in
  the top-left corner, most important first: NEW, wanted by a quest, the throwing set in use,
  its hotkey. Throwing things away always asks first.
- Dropping items: drag one out of the bag over the world (or press the drop button) and it pops
  out in front of the hero as loot. A stack asks how many first. Your own drops only come back
  with X, never with auto-loot, and Cash items can't be dropped (`world.js` `dropItem`).
- Item windows show the hovered item in a detail strip (big icon, stats against what's worn,
  the action button) instead of a tooltip over the grid; hovering gear tries it on the hero and
  lights the slot it goes in, and items new since the bag last closed wear a NEW mark
  (`ui/bag.js`). Items drag: a press arms the drag and it starts after a few pixels, so clicks
  and double-clicks still work; the item rides the cursor, leaves a faded copy, and every place
  that takes it lights up (cells, the hero to wear it, hotkeys for potions). A live stat panel
  under the hero shows each total's change while trying something on.
- Every window that lists things is a list plus a detail pane (Bag, Quests, Skills): the list
  shows state at a glance (badges, breathing borders for what you can act on, grey for what's
  out of reach), the pane explains and holds the actions. Anything that decides something gets
  a preview before you commit: trying gear on, +1 stat previews in Stats, Now/Next in Skills.
- Skills and Use items drag onto the hotkey bar; while something is dragged every hotkey slot
  shows it can take it and the one under the mouse lights up.
- NPC dialog: choices are rows with a badge (a quest's state or an icon), a line saying where it
  stands, and a number key; Space finishes the typing, Enter takes a quest page's main action,
  Backspace goes back. NPCs move their mouth while their words type (`hero.js` `talking`).
  Quest pages show objectives with progress and where to go, and rewards as item cells.
- Shops (`ui/shop.js`) are list + detail: try gear on, compare stats, pick a color, set how many
  with a stepper, see the total before paying; gold changes float off the gold pill. Windows
  bigger than the talk box place themselves on screen when they open.
- Speech bubbles are queued and laid out once per frame (`chat.js` `flushBubbles`): they stack
  instead of overlapping, and a lifted bubble's tail stretches to its speaker.
- Damage numbers scale with the share of the monster's HP a hit took and fade for party hits;
  picked-up loot flies into the Bag button before it bumps. Screen shake is full / low / off.
- Text over the scene always has an outline or backing; the world dims behind windows; bars give
  feedback (lingering lost chunk, heal flash, low-HP pulse).
- Props (landmarks, buildings, scenery) use `src/render/propkit.js`: one world light from the upper
  left, `ramp()` for 4 hue-shifted tones, materials as clean clusters (`foliage`, `bark`, `stones`,
  `planks`, `crystal`), and non-crisp sprites so outlines are a thin own-hue line a tier below the
  characters. Motion rides the shared wind: root still, tips lean most (`lean`, `leanFrame` for
  cached poses, `swing`/`pivoted` for hanging things); ripple phase comes from `windTravel`, never
  from a speed times `time` (that jumps whenever the speed changes).

## Working method that got results
1. Look at the work zoomed in (6–8x) before judging it, and write down concretely what's wrong.
2. Research references first; compare against them, not against our own older art.
3. Build shared kits so every character gets the same quality from the same construction.
4. Iterate at least three critique rounds, then check at real game size (1x) in a real map.
5. Show before/after for every change.
7. **Hair always covers the head (the player's rule).** No skin, scalp or ear may peek through
   gaps in the hair: at the sides, between the bangs and the hair behind, or under the crown.
   Every hairstyle draws side hair in front that covers the ears and the sides of the head
   (`hair.js`, the bangs). Only elf ears are long enough to poke out past it, on purpose. The
   forehead under the bangs is face, not head, and may show.
6. Clean beats busy. A hairstyle remake made of many small spikes, plait stripes and dark
   patches read as messy and overdone to the player; what worked was one smooth outline per
   mass cut into a few pointed clumps, a short crease at each notch, one shine band and one
   signature shape per style (`src/render/hair.js`). Add detail only where it changes the
   silhouette.

## Tools
Preview tools live in `tools/`: `mob-gallery.html` (every frame and mood of a monster group),
`icon-gallery.html`, `skill-icon-gallery.html`. The Playwright scripts in `tools/art/` capture them
with the game served at http://localhost:8000 (`npm start`; set `PORT=` to use another port). Run them from a scratch folder outside
the repo, since they write their images to the current directory:
- `gallery.cjs <group> <out.png> [keys]`: screenshot a monster group's gallery.
- `faces.cjs <out.png> key1,key2 [moods]`: big render of each design per mood.
- `headcrop.cjs <out.png> key1,key2 [moods] [topFraction]`: the head area very large.
- `maidshot.cjs <map> <x> key1,key2 <out.png>` (`GAP=` env for spacing): spawn designs in a map.
- `mapsmobs.cjs <outdir> <tag> map1,map2`: in-game shots of maps with their monsters.
- `gaitgif.cjs <map> <x> x [clip]`: frames for a walking GIF into `gf/`.
- `ledgeclip.cjs [map1,map2]`: lists scenery that runs up into a ledge from below (houses,
  landmarks, props in the play layer). Run it after placing scenery or ledges; it should print
  "no clipping".

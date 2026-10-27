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
  between moves),
  [dancing-green](research/dancing-green.md) (the FFXIV boss the player wants as a disco boss: his
  look, how he moves, and every attack with its tell).
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
  push (`summons.js` `beat`). Summons and companions that shoot on a timer wind up while the next
  shot is due, strike on the shot, hold about 0.2 s, then settle.
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
- Moves cut into each other ease out of the previous pose over about 70 ms (`hero.js`
  `blendMove`, `scene.js` BLEND): angles take the short way round, rig tweaks switch halfway.
- Each path's effects keep one shape language (fx.md C14), so a hit says whose it is: the
  Ranger's wind is rounded curls, ribbons and leaves (`archery.js`); the Sniper's is straight hard
  streaks, four-point glints on the corner, and a rose sight. Shot trails are tapered ribbons that
  step white, main, deep from head to tail (fx.md D), not faded copies.
- **Effects are Tengu's own art, matched to the sprites** (the player's pick out of 18 sample
  styles, after rejecting gradient glows, pixel packs, HD packs and black-outlined anime cel):
  - Drawn in `tools/fx-art.js` as soft pastel shapes: 4-tone ramps (white, light, base, shade)
    that lean violet in the shadows, an outline colour that is a darker shade of the effect's own
    hue, rounded crescents and petal bursts, beads and the game's curvy four-point sparkle.
  - Then matched to the sprites (`match`): shrunk to art pixels, colours snapped to a ramp of
    their own hue and kept saturated, outlined like the sprites (lighter on top edges, darkest
    underneath), and doubled so one art pixel is two screen pixels, the characters' own size.
  - Every effect is a few key drawings: pop in, hold a beat, break into beads and sparkles.
  - Pixel art must stay near scale 1: effects that play large (rings across a group, the magic
    circle, a whirlwind, a finisher's rupture) have big versions drawn large (`*big`).
  - Warriors: swipes laid along the blade's own swing (steel blue, the Paladin's gold, the
    Berserker's rose red); hits leave the Warrior's cross of blades, the Paladin's star of light,
    the Berserker's claws; buffs rise as a pillar of light with the path's emblem; Grand Verdict
    drives a sword of light down over the magic circle; Crimson Eclipse raises a crimson eclipse.
  - Archers: the Ranger's emerald wind (curls of wind, gusts of leaves, a wind-orb spirit, a
    tornado, rings of wind); the Sniper's ice-blue lens of light tearing through each monster a
    bolt pierces (every Sniper bolt pierces the line), snowflakes and a frost burst, a puffy blast,
    a rose sight for the Deadeye.
  - Mages, thieves, monsters, and buffs' lasting looks are still code-drawn and need the same
    pass.
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

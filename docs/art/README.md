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
  [env](research/env.md) (maps, UI, icons), [anim](research/anim.md) (animation craft),
  [fanart](research/fanart.md) (how pros put anime characters into small sprites).
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

**Animation**
- Attacks: wind-up held, a short strike, a held impact, then settle (MapleStory: 300/150/350 ms).
  The impact frame shows the moment damage lands. Monster wind-ups are exaggerated; the player's are
  short.
- Hurt: a held, most-squashed first frame, a jelly wobble back, a lean away from the blow.
  Death: knocked up on an arc, bounce, hold, flash, poof.
- Walk bob dips as each foot lands; idle breathes in slowly and out quickly with a sideways sway
  and a held beat; landing squash scales with fall speed (Celeste numbers).
- Cycles keep a fixed length however many frames they have; walkers step with the ground they
  cover (`stride`), so feet never slide.
- Springs are solved exactly so hair and capes move the same at any frame rate.
- Chibi legs are too short to cover a run's ground at a calm cadence: give the run a short stance
  (30%) with a float between steps and the walk a long one (60%), and a stride per gait so the
  planted foot travels exactly the ground covered (`animator.js` `strideAt`, legs narrowed by KX).
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

**Maps and UI**
- Far layers fade toward the sky colour and get paler; vertical parallax stays tiny (about 0.05);
  a foreground layer in front of the characters adds depth; varied tiles, never one repeated tile.
- Text over the scene always has an outline or backing; the world dims behind windows; bars give
  feedback (lingering lost chunk, heal flash, low-HP pulse).

## Working method that got results
1. Look at the work zoomed in (6–8x) before judging it, and write down concretely what's wrong.
2. Research references first; compare against them, not against our own older art.
3. Build shared kits so every character gets the same quality from the same construction.
4. Iterate at least three critique rounds, then check at real game size (1x) in a real map.
5. Show before/after for every change.

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

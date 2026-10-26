# Face pass brief (shared by every face agent)

Read docs/art/briefs/sprites.md first
(conventions, gallery tool, rules, commit format). This pass is ONLY about eyes and faces.

## What the user said
"looking good so far but the eyes and faces need so much more work". Everything else is approved —
do not change bodies, poses, sizes, INFO, frame counts or strides.

## What's wrong now (from 6x close-ups — see scratchpad faces-a.png … faces-d.png)
- Eyes are tiny smudges of 1–3 logical px: no readable construction (no lash line, no iris
  gradient, no pupil, no highlights). The fox's idle eyes are hairline slits, the tortoise's face is
  a blur, the goblin's eyes are flat yellow dashes, the jackalope's eye is one dark blob, the bear's
  eyes nearly vanish, the wraith's lights are dots.
- Expressions are stock glyphs reused everywhere: hurt is the same `> <` on every monster, happy is
  the same `^ ^`. No brows that move, little mouth acting, no per-species personality.
- Mouths and noses are crude (single dark dabs), muzzles have no structure, fangs are blobs.
- Faces are too small relative to the head for a chibi game — the face is where players look.

## What good looks like
MapleStory / Ragnarok / modern chibi monster art: big, glossy, readable eyes that carry the
character even at game size. Use WebSearch/WebFetch for references (e.g. MapleStory mob sprites,
"chibi monster eyes", "anime eye construction", "pixel art eye highlights") before designing.
Every eye, at minimum:
1. A bold upper lid / lash line (darkest value, thicker than the rest; for animals a dark rim),
   with a shape that defines the species (almond, round, slit, droopy, sharp, heavy-lidded).
2. An iris with at least 3 values: dark top under the lid (lid shadow), mid colour, a lighter
   bottom crescent / glow. Species colour (amber fox, gold reptile, teal cat, ember treant …).
3. A pupil fitting the species (round, vertical slit, horizontal goat bar, star, glowing pinpoint).
4. Two catchlights: a big white one upper-left, a small one lower-right. They make it alive.
5. A thin lower lid / lower lash hint, and where fitting a brow that ACTS.
Size: make eyes noticeably larger than now (roughly 1.5–2x area) while staying in proportion with
the species; set the face so it reads at 1x in the game.
Expressions — every mood is acted by the whole face, per species, not by a shared glyph:
- idle: personality (smug fox, sleepy tortoise, shifty goblin, curious jackalope…), with brows.
- angry: brows slam down, lids narrow over the iris, pupils shrink / glow, mouth snarls with
  readable teeth/fangs, maybe a vein mark.
- hurt: a species-specific wince — squeezed eyes drawn with real lid shapes (not `><`), a pained
  open mouth, tears/sweat where fitting; vary it per creature.
- happy: closed-eye smile arcs with lashes, open smiling mouth, blush.
- blink: real closed lids with lashes (half-closed in-between is a bonus).
- dead: x eyes or swirl eyes drawn cleanly, tongue out or slack mouth.
Mouths: shaped lips/muzzle lines, inner mouth darker with a tongue, teeth as clean white shapes
with outline. Noses: a clear shaped nose pad / snout with a highlight.
Non-face creatures (wisp, wraith, golem, mimic, dullahan helm): still give the "eyes" construction
— glow core + bright rim + inner hot center + a catchlight or flicker; make the glow read.

## How
- Work at res 3: each logical px is 3 screen px in game, so draw eye parts at 1/3 px precision
  (shape coordinates like x + 0.33). That is where the detail comes from.
- Faces must look good at 1x in the real game, not only zoomed. Check both: the gallery
  (`gallery.cjs`) and a big face sheet:
  `node (working folder, not kept) faces.cjs <out.png> key1,key2 [moods]`
  (default moods idle,angry,hurt,happy; pass e.g. `blink,dead` too).
- Faces must stay correct in every pose/frame (walk, idle, attack) since heads move.
- Critique your own sheet honestly against the list above; at least 3 rounds.

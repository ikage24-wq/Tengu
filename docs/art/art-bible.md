# Tengu Art Bible: Faces, Bosses, Monsters

Audience: the agents writing shape code in `src/render/mobs/*.js`. Units are **logical px (lpx)**. Sprites rasterise at res 3, so 1 lpx = 3 real px and 0.33 lpx = 1 real (screen) pixel. "Real px" means a screen pixel at 1080p.

---

## 1. Diagnosis: why the current images look amateur

These points come from qfaces2, mfaces, q1, faces-a, faces-c and queens-sky, and from reading `queens.js`, `kit.js` and `pixel.js`.

1. **The face has no value contrast, so it isn't the focal point.** Tamamo's skin is `#fff2ea`, her hair `#fff0d4` and her kimono near-white, so in queens-sky her head merges into one cream blob. Her darkest and most saturated accents are the red hem, the fan and the blue flames, so the eye goes there and not to her face. Sylvana's face sits in an equally light green field. Pros keep the strongest dark-against-light contrast in the sprite at the eyes (PixelJoint fundamentals; Saint11 "Portraits": "add a black border for contrast").
2. **The eyes have too many tiny parts.** `ladyEye` stacks about 12 shapes into a 7×6 lpx area: iris rim, base, light crescent, pupil, 2 shines, sclera, eyeshadow, lid skin, lash strip, wing, liner, 2–3 flicks and a lower lash. At res 3 many of these are 1–2 real px wide. The rasteriser turns them into stair-step fragments, which show up in the zoom as a broken lash line, loose single-pixel lash specks and a speckled iris. Good pixel eyes use 4–6 clean clusters (Slynyrd #29: a female eye about 8 px wide is lash, iris, pupil, one highlight and a light lower lid). Loose pixels read as noise (PixelJoint "orphan pixels").
3. **The lash line is thin and ragged.** The strip starts at 0.5 lpx (1–2 real px), so it breaks into dashes, and the wing is a jagged sliver. In anime, the upper lid is the heaviest line in the face (AnimeOutline eyes, eyelashes).
4. **The 3/4 placement is wrong.** The near eye sits at `hx+8.2`, the mouth at `hx+8.8` (directly under the near eye) and the nose at `hx+12.8` (on the contour). In 3/4 view the mouth and chin belong on the **face centre line**, which runs between the eyes and nearer the far one (AnimeOutline 3/4 female). As placed, Lilith's mouth sits on the edge of her cheek and the lower face is a long empty slab. The chin doesn't read either: there is no under-chin shadow, and the neck is nearly the same colour as the face.
5. **The faces are flat stickers.** The face uses `L()` (lit-only) and the `cel` mode skips side shading, so the only forms are the jaw wedge and the blush. The blush is a hard, saturated ellipse that reads as a pink brick. Pros put shadows under the bangs, in the eye socket (a lash shadow on the sclera), on the far cheek plane and under the chin onto the neck (AnimeOutline face shading; Clip Studio skin).
6. **The hair is rigid slabs.** Tamamo's hime bangs are a rectangle with vertical stripes that look like window blinds, and her side locks are straight bars. Lilith's hair is flat panels with no clump tips. No queen has the band of highlight across the crown that anime hair has. Anime hair is grouped into clumps with pointed tips and shadows where clumps meet (AnimeOutline hair; Slynyrd #29 flow lines).
7. **The pixel size is mixed and the line weight never varies.** The automatic silhouette outline is 2 real px everywhere, with the same darkness on top and bottom. Interior features are 1-px lines, and the bodies use 3-px logical blocks. The mix of resolutions ("mixels") reads as unprofessional (flowlab mixels thread). Also, there is no interior line between parts of similar value, such as face and bangs or Tamamo's sleeve and body.
8. **The motion is stiff.** In q1, Tamamo's walk frames are almost identical: she slides, and her tails and hair don't lag behind. Lilith keeps one upright stance.
9. **Every monster has the same face.** All creatures share `face()` from kit.js: two dot eyes, a white shine, a blush and a small mouth, plus the same `><` hurt face. The outline is a heavy, uniform near-black ring. Each monster reads as a template rather than a species.

---

## 2. Rules (numbered, checkable)

### A. Pixel discipline
1. **Minimum widths.** Any line meant to read must be at least **0.67 lpx (2 real px)**. Width 0.33 lpx is allowed only for AA edges, the lower lid and creases. Width 1 lpx and up is for the lash line, outlines that carry form, and the pupil.
2. **No stray single real pixels**, except catchlights and deliberate sparkles. After a change, zoom the PNG and delete any 1–2 px fleck that isn't attached to a cluster.
3. **One shape per cluster.** Draw the lash line, wing and outer clump as **one polygon** instead of a strip plus separate flicks. This applies to every part: fewer, bolder shapes.
4. **Snap feature anchors** (eye corners, pupil, mouth ends) to multiples of **1/3 lpx**, so the same expression rasterises the same way in every frame. Otherwise eyes "boil" while the head bobs.
5. **Smooth curves need even steps.** The run lengths along a curve's outline should shrink steadily (5-2-2-1-1, not 5-2-1-2-1; Lospec outlines). Give polygons enough points (at least 8 per quarter) and avoid coordinates that land on half-pixels.

### B. Value and focal contrast
6. **Value check.** Render the sprite in greyscale. The face (eyes and lash) must hold the **darkest dark next to the lightest light** in the upper third of the sprite. Nothing else may out-contrast it: hems, fans and weapons get at most 70% of that contrast.
7. **Hair and skin must differ by at least 12 points of L (HSL), measured at the hairline.** If the design calls for pale hair (Tamamo, Selene), add (a) a 0.67-lpx interior line of the hair-shadow colour where the bangs meet the skin, and (b) a cast shadow on the forehead from the bangs (`C()` or an explicit F shape, 1–1.5 lpx deep, in skin shadow 1).
8. **Limited ramps.** Per material, use at most 4 tones: highlight, base, shadow 1, and shadow 2 or occlusion. The skin gets 4 and its line colour (Pixnote: 64 px and larger needs 4–5 stages). Don't introduce new tints ad hoc; reuse ramp colours.
9. **Hue-shift the shadows** (Slynyrd #1, Saint11 "Shading"). As tones get darker, rotate the hue 8–20° toward red or magenta for warm materials and toward blue or violet for cool ones, and raise saturation slightly. Never darken toward grey. Highlights shift toward yellow and white. The engine's `shadowTone` (mix with `#9b8ad0`) is fine for cloth, but faces use the explicit skin ramps below.

### C. Lines and outlines
10. **Monster and effect outlines are a darkened shade of the part's own hue, never a neutral near-black.** (Player characters keep their deep near-navy ink: the player tried own-colour lines on them and chose the original.) For monster skin, use rose-brown `#a8606e` on light-facing edges and `#6e3550` on shadow edges and under the chin. Hair outlines use hair shadow 2, darkened.
11. **Selective outline ("sel-out").** Edges facing the light (top and front) get a lighter outline, about the fill's shadow-2 tone. The bottom, back and contact edges get the darkest line (Lospec part 2; imonk; Pixnote). Pipeline ask: make `outlineFor` take the outline cell's offset `dy` and use `shade(c,-28)` when `dy<0` (top) and `mix(shade(c,-55),INK,0.5)` when `dy>0` (bottom). Until that lands, add a 0.67-lpx light rim polygon just inside the top edge of the head and shoulders.
12. **Interior lines** go only where two parts touch and differ in value by less than about 15%, or where one part overlaps another (bang over face, sleeve over body, tail over tail). Use the darker part's shadow-2 colour at 0.67 lpx and **fade it out** toward the end (Lospec part 2: "fade toward a lighter colour where a line ends at a join").
13. **Vary the line weight with weight and depth.** Lash line: 1–1.33 lpx. Jaw contour on the near side: 0.67. Nose and mouth: 0.33–0.67 in lip or skin-shadow colour, **never INK**. Brows: 0.67.

### D. Shading and form (skin)
14. **One light, one style:** every sprite, prop, map and effect shares one pixel size and outline weight (CLAUDE.md, the art standard). **The light comes from the upper front** (facing direction, top-right when facing right). Every sprite in a scene uses the same light (Pixnote; BuskHusker: lit 1/2–2/3 of the face).
15. Each face carries exactly these shadow shapes, all flat F shapes in skin shadow 1, with shadow 2 only where two shadows overlap:
    - a band under the bangs, following the bang tips, 1–1.5 lpx deep, notched where the clumps are;
    - a far-cheek plane from the far temple to the jaw (already present, but keep it at shadow 1 and not mixed);
    - a 0.67-lpx lash shadow on the top of the sclera;
    - the neck in full shadow 1, with shadow 2 for the first 1.5 lpx under the jaw (this separates the chin);
    - optionally, a 0.33-lpx skin-shadow tick at the nose underside.
16. **No pillow shading.** Shadows sit on one side, opposite the light. Never draw a ring that follows the outline (PixelJoint, Pixnote, Saint11 "Faces are mostly one solid colour").
17. **Blush.** Use either (a) 3 diagonal 0.67-lpx hatch strokes in the blush colour (Slynyrd's female face uses exactly this), or (b) a 2-tone soft ellipse: outer ring at 40% alpha and a 60% core, at most 3.5×1.2 lpx at queen scale. It never touches the cheek contour or the eye. Queens use (a) or a small (b). A hard solid pink ellipse is banned.

### E. Hair
18. **Build hair as clumps, 4–7 across the bangs.** Each clump is a polygon with a soft, rounded tip (never spiky: the player's rule, 2026-10-31), with lengths that differ by 1–3 lpx. Straight, parallel stripes are banned.
19. **Every head of hair gets one highlight band** (the "angel ring") across the crown. It is a strip 1–1.5 lpx tall in hairLt that follows the curve of the skull, broken by the gaps between clumps, with a zigzag lower edge. Draw shadow 1 where clumps overlap and shadow 2 under the crown and behind the neck.
20. Locks taper to tips and **curve with an S-flow** that starts at a part or cowlick (Slynyrd). Long hair splits into 2–3 locks at the ends, never one slab.

### F. Animation polish
21. **Overlap.** Hair tips, tails, sleeves, capes and wings lag the body by **1 frame** on the walk and idle sine (`ph - 0.6`), and the lag grows toward the tip (tertiary parts drag most). A 2-px bob of the body becomes a 1–1.5-lpx swing at the tips.
22. **The idle is never purely vertical.** Pair every vertical bob with a 0.33–0.67-lpx sideways sway or a shoulder rotation (Saint11 "Character Idle"). Move the face contents 1 frame after the silhouette.
23. **Blink** every 2.5–5 s (each one's timing set from its own id, so they differ but never flicker: nothing drawn uses a random number). Hold closed for 1 frame (about 80 ms), with a half-closed frame on either side.
24. **Smears.** On attack frames with fast arcs, add one frame with a smear shape: a crescent in a lighter version of the weapon colour with a hard leading edge that fades out at the trailing edge (Saint11 "Motion Blur"; lighter colours "bleed" over darker ones). Hold the impact frame 120–200 ms, keep wind-ups short at 60–80 ms (sprite-ai timing table), and squash or stretch by 1–3 real px on launches.
25. **Readable expressions.** Each expression must read from the eye shape alone at 1x in-game. Brows and mouth only support it.

---

## 3. Face construction recipe

### 3.1 Queen head (3/4 view, facing right). Head box about 27 w × 29 h lpx
Coordinates are relative to `(hx, hy)` = skull centre, as in `ladyHead`. The crown is at `hy-13.6` and the chin at about `hy+15`.

| Feature | Spec |
|---|---|
| Skull | Circle r 13.5 (keep it) |
| Jaw / cheek | Near cheek bulge at `(hx+13.2, hy+5)` → `(hx+12, hy+9.5)` → chin point at `(hx+6.5, hy+15)`. Back jaw from `(hx-9.5, hy+7)` → `(hx-1, hy+13.5)` → chin. The chin is a small 1.5-lpx-wide rounded point. Mature or regal: chin at `hy+15.5–16`. Cute: `hy+14`. |
| Face centre line | At the eye line it runs at `hx+4.3`, and it leans to `hx+6.5` at the chin |
| Eye line (iris centre) | `ey = hy+4.0` (about 60% from the crown, the chibi norm). Regal or mature faces get a longer lower face rather than higher eyes. |
| Near eye | Centre `hx+8.3`. Width **8 lpx** (cute 8.5, alluring 8). Visible height between lids **5.0** (cute 6, alluring or regal 4–4.5). |
| Far eye | Centre `hx+0.3`. Width **5.6** (70%, compressed horizontally), height ×0.95. Its inner corner is tucked 0.5 lpx behind the nose-bridge line. Same tilt. |
| Gap between eyes | 2.0–2.5 lpx (it compresses in 3/4) |
| Brows | 0.67 thick, hair shadow 2 (not INK), tapered at both ends, lowest point **2.3 lpx above the lash line**. Near brow length is about 7.5. The far brow is 5 and is clipped by the skull edge. |
| Nose | A 1.33-lpx hook at `(hx+11.6, hy+8.6)` in skin shadow 2, or only a 0.67 shadow tick under the tip. Never INK. |
| Mouth | Centre `(hx+6.6, hy+11.4)`, width 2.6–3.2 lpx, on the centre line. The far half is drawn 30% shorter. |
| Blush | Under the near eye at `(hx+10, hy+7.6)` and under the far eye at `(hx+1.5, hy+7.6)` (the far one smaller) |
| Ear (if visible) | Between the eye line and the nose line, at `hx-6` |

**Eye construction, in drawing order. Use 6 clusters at most.**
1. **Sclera**: an almond polygon in `#fffaf7`. Do not use pure white, so the catchlight still pops.
2. **Iris**: an ellipse **4.6 w × 5.4 h** in the near eye, centred 0.3 lpx toward the facing side. The top 25–30% sits under the lash, so the iris always touches the upper lid and only shows sclera at the corners. Use **3 bands plus the pupil**:
   - the top 45% is the iris dark (base hue −35 L, hue shifted toward the pupil colour); it merges with the lash shadow;
   - the middle is the iris base;
   - the bottom 30% is a crescent of the iris light (base mixed 45% toward a lighter, hue-shifted colour: gold→pale yellow, green→lime, pink→pale pink, lavender→ice blue);
   - the pupil is **1.33 w × 2.0 h**, darkest, slightly above centre. A slit is 0.67 w.
   - No dark rim ellipse; the top band does that job.
3. **Lash shadow**: a 0.67-lpx strip of skin shadow 1 (or a lavender like `#d9c6e6`) across the top of the sclera and iris.
4. **Upper lash line**: one polygon. It is **1.33 lpx** thick over the outer 60%, tapers to **0.67** at the inner corner, and ends in a **wing**. The wing extends 1.2–2 lpx past the outer corner, angled 20–35° upward, and finishes in 1 or 2 pointed clumps (each at least 0.67 at the base, about 1.3 long, all inside the same polygon). Inner-corner lashes: none, or one 0.67 nub. Colour: the per-queen lash colour (a very dark version of the hair hue), not INK.
5. **Catchlights**: always on the light side (upper-front) and **in the same position in both eyes, not mirrored**. The main one is a **1.33×1.33 lpx** square-ish shape in `#ffffff` overlapping the iris and lash edge. The secondary is **0.67×0.67** at the lower-back of the iris in iris light or white. Never more than 2, except in a "sparkle" expression.
6. **Lower lid**: a 0.33–0.67 line over the outer 50% only, in lip or skin-shadow colour (`#d58f9c`-ish), never dark (a dark one looks like a bruise; AnimeOutline). Alluring queens add one 0.67 outer lower lash.
7. *(Regal and alluring only)* **Crease**: a 0.33-lpx line in skin shadow 2, about 1 lpx above the lash line, over the outer 60%. **Eyeshadow**: one soft band 1–1.5 lpx tall above the crease, as a single F shape.

### 3.2 Maiden head (about 14 lpx)
Head box about 14 w × 15 h. The eye line is at 58% from the crown.
- Near eye **4.4 w × 3.6 h** visible. Far eye 3.1 w. Gap 1.2.
- Iris 2.6 w × 3.2 h, with **2 bands** (dark top half, base bottom, plus an optional 0.33 light crescent) and a pupil 0.67×1.33.
- Lash: **one polygon 1.0 lpx thick** tapering to 0.67, with a wing of 0.8 lpx and a single clump. No crease, no eyeshadow, no lower lash; the lower lid is 0.33 in skin shadow.
- Catchlights: one 0.67–1.0 square on the upper-front. That's all.
- Brow 0.67, 1.3 above the lash. Mouth 1.3–1.7 wide in lip-dark at 0.67. Nose: a single 0.33 tick or none.
- Blush: 2 hatch strokes.
- Current maiden `rx 1.8–2.0` gives 3.6–4 wide eyes, about 26% of the head width. Raise it to **2.2** (31–32%, matching Slynyrd's female face).

### 3.3 Expressions (both scales; queen numbers given)
| Mood | Eyes | Brows | Mouth / extras |
|---|---|---|---|
| **idle** | As built. Iris looks 0.3 lpx toward the target. | Relaxed arch | Small closed mouth, lip-dark line plus a 0.67 lower-lip tint |
| **angry** | Upper lid flattened and **tilted down toward the nose**: the inner end drops 1.3 lpx and the outer end stays put. Iris shrinks 15%, pupil contracts (slit or 0.67 dot), and the iris turns to the hot colour. The lower lid rises 0.5 lpx. | Inner ends drop 1.5–2 lpx, angled 25–35°, thickened to 1.0. Add a 0.33 crease mark between the brows. | Open snarl: a trapezoid 3.5×2 in mouth-dark, a 0.67 top-teeth band in white, and a fang if the design has one. The mouth moves 0.5 lpx lower. |
| **hurt** | Squeezed eyes. Draw the **closed-squint ">" as a 1.0-lpx lash-coloured polygon** whose outer arm still ends in the lash clump, so the face stays feminine. Add a 0.33 tear or sweat drop. Don't reuse the monster `><`. | Inner ends **up** 1.5 lpx (worried) | Gritted mouth: a 3×1.3 dark slot with a white teeth band, or a small "o". The head tilts 5° back. |
| **happy / smug** | The lower lid pushes up as a skin crescent covering the bottom 35% of the iris, and the upper lid drops 15%. Queens default to a half-lidded smirk. Optional extra 0.67 sparkle. | Outer ends lift 0.5 | Near mouth corner up 0.7 lpx; or a "cat mouth" for Tamamo and Lilith. Blush +20% alpha. |
| **blink** | A **downward-sagging curve** (∪-ish lid line) at 60% of eye height, 1.0 thick, tapering to the inner end, plus 1–2 lash clumps at the outer end pointing down and out. (A happy closed eye is the ∩ arch; never use it for a blink.) | Unchanged | Unchanged |
| **dead** | Closed ∪ line at 0.67 with no lashes, or comedic swirls at maiden scale. Desaturate 30% (the existing FADE). | Neutral, slightly raised inner ends | Small open mouth, 1.3 wide |

**Live faces (heroes, party, bots, NPCs).** From diives.md, fanart.md finding 8, ko.md 12 and 15, and
en.md 16:
- Expressions hold, then snap to the next beat; each loops with one acting moment (a sigh, a yawn,
  a sob, a laugh). Excited beats change every 0.125–0.25 s, calm ones hold 0.5 s or longer.
- Symbol eyes and marks do half the acting: heart pupils, spirals, > <, welling tears, "!" that
  pops in with an overshoot, "?", z's, steam, gloom lines, circling stars, a big sweat drop.
- At rest the eyes wander (a look aside, a look up), blinks take three beats (half, shut, half),
  and some characters blink twice.
- The moment overrides the chosen expression: wind-up (narrowed eyes, gritted teeth), a shout on
  the blow, a grin after; a whoop going up a jump, a gasp coming down; set and focused after a
  fight; fretting with sweat at low health; spiral eyes and stars when knocked out. Talking cycles
  syllable mouth shapes.
- The body acts the mood too (anim.md, Sakuemon loops and Saint11 idle). Idle, each expression
  has a stance and one beat timed with its face loop: hands on hips (elbows out), arms crossed,
  hands clasped at the heart, paws by the chin, a hand under the chin for a laugh, a stretch with
  the yawn, a startled jump with arms flung up, hops for joy, a dizzy wobble, a worn-out pant at
  low health. Walking, each mood has a gait: bouncy, skipping, strutting, a sassy catwalk, hands
  in pockets, stomping, drooping, small timid steps, a dizzy weave, a panicked flail. Holding a
  weapon keeps the weapon arm on its own idle.
- Monsters: "!" and "?" bubbles pop in with an overshoot; they gloat with a happy face after
  landing a hit, and sweat and blink nervously when nearly beaten.

Personality levers (AnimeOutline personality and mature-woman guides; Clip Studio generations):
- **Cute** means a bigger iris relative to the eye, rounder lids, a shorter lower face, more catchlights and a lower eye line.
- **Mature / regal / alluring** means eyes vertically narrower with an almond shape, a smaller iris, a heavier upper lid, a wing, a crease, a longer lower face, a pointed chin, a slender neck, defined lips that are pink-outlined with no dark line, and a glossy lower lip.
- **Villain** means lowered lids, a smaller iris and pupil, sharper corners, and fewer catchlights.

---

## 4. Palettes (hex)

**Default pastel skin:** hi `#fff8f3` · base `#ffeae0` · sh1 `#f6c8c3` · sh2 `#e0a1ab` · line `#a8606e` · deep line `#6e3550` · blush `#ff9fb2` · lip `#e2627c` · lip-dark `#a8344f` · gloss `#ffd3dc`

| Queen | Skin (base / sh1 / sh2) | Hair (hi / base / sh1 / sh2) | Iris (dark / base / light) · pupil · lash |
|---|---|---|---|
| Tamamo | `#fff3ec` / `#f8d0ca` / `#e6a6ab` | `#fffbea` / `#ffe2a6` / `#efb767` / `#c4823f` | `#a8420e` / `#ffa21f` / `#ffe27a` · `#4a1608` slit · lash `#3a1a1c`, liner `#e0283f` |
| Sylvana | `#f7f4ea` / `#d7e2cf` / `#a9c1ae` (cool green) | `#d2f7c8` / `#7fd39a` / `#4fae7c` / `#2f7d5e` | `#0f6b4a` / `#2fd08e` / `#cfff9a` · `#0b3d2c` · lash `#1f3d32` |
| Lilith | `#ffe7ec` / `#f2c0d1` / `#d593b5` | `#b9a0ff` / `#6c47ab` / `#4a3080` / `#2c1d55` | `#7a0f4a` / `#ff3f9e` / `#ffc2e4` · `#4a0a2c` heart · lash `#24112e`, shadow `#b46fb0`→`#e7b2d6` |
| Selene | `#fff3ee` / `#ecd1d6` / `#c7b0c9` | `#ffffff` / `#eceaff` / `#c6c1ee` / `#8f8ad0` | `#3d3f8f` / `#8e9be6` / `#d8e6ff` · `#23245a` · lash `#2c2d5a` |

Tamamo's hair moves from `#fff0d4` to `#ffe2a6`. This is the single biggest fix for her readability; the skin and hair now differ by about 14 L.

---

## 5. Per-queen guidance

**Tamamo, the Nine-Tailed Empress (kitsune, Heian court).** Shape language: flowing curves with controlled spikes (fan ribs, ear tips, flame tips).
- Fox eyes: tilt the outer corner **1.6–2 lpx above the inner corner**, visible height 4.2, and keep `heavy 0.2` as the default smug half-lid.
- Red **kumadori liner**: a 0.67 crimson stroke below the black wing that sweeps up past it. It is one polygon, not a taper of 0.3.
- Gold iris with a slit pupil.
- Replace the "short" brows with **hikimayu**: two soft 1.6×1.0 oval brow smudges in hair sh2 at 50%, placed high (5 lpx above the lash). This is instantly regal and Japanese.
- Small red lips, gloss dot.
- Hime cut: keep the straight-cut silhouette but split it into 5 clumps with 0.67 V-notches, add the angel-ring band, and add the forehead cast shadow. Side locks taper and swing.
- Tails: each tail lags its neighbour by 0.15 phase, so the fan of tails ripples.
- Hurt or angry flames go violet, as now. In the angry face, the iris turns crimson and the slit thins.

**Sylvana, the Dryad Queen.** Serene and ancient: round leaves plus thorns.
- Rounder eyes, but cut the current `er [3.6, 4.6]` height. Make them almond with 5.2 visible height and tilt 0.05.
- Iris green→lime gradient, with the star-shaped catchlight.
- **Leaf lashes are OK only as one leaf-shaped clump at the wing**, at least 0.67 wide. Never use several thin leaves.
- Birch skin with a **cool green shadow** (`#d7e2cf`), and keep the bark marks as 0.33 lines in sh2.
- Willow hair needs 6–8 long tapered clumps with S-curves and a separate leaf colour from her dress. The dress is currently the same green, so shift the dress toward teal `#3fb59a`.
- Angry: veins brighten to lime and the brows drop sharply.

**Lilith, the Succubus Queen.** Triangles: wings, horns, pointed chin.
- Signature **bedroom eyes**: upper lid lowered so the lid covers the top 35% of the iris, a 3-clump wing at 1.33 thick, one outer lower lash, a crease, and a purple eyeshadow band.
- The heart pupil must be at least 1.6×1.4 lpx. If it fails to read, use a round pupil plus a heart-shaped main catchlight.
- Fuller lips in berry `#c8306a`, a 0.67 gloss on the lower lip, and a smirk lift on the near corner. **Move the mouth onto the centre line** (`hx+6.6`).
- Beauty mark below the near eye's outer corner.
- Pointed chin (`hy+16`), slender neck with a sh2 under-chin shadow.
- Her hair is darker than her skin by a lot, which is good. Add a lavender angel ring and clump tips on the fringe.
- In idle, the tail tip and wing membranes lag by 1 frame.

**Selene, the Moon Valkyrie.** Noble and calm: circles and crescents, straight verticals.
- Level eyes (tilt 0) and **straight brows**, low and steady.
- The iris is currently pale lavender and disappears against the sclera. **Make the dark top band `#3d3f8f` mandatory.**
- Star catchlight optional. Minimal blush (hatch, 30%). Small pale-rose lips.
- Silver hair needs cool shadows (`#c6c1ee`/`#8f8ad0`) and an interior line where it meets the helm and face.
- Determined angry face: brows straighten and drop 1 lpx, the iris flips to ice blue, and the mouth is a set line rather than a snarl. She is the "honourable" queen.

**Creature monsters (meadow, wilds, sky, etc.).**
- Retire the shared dot-eye `face()` as the default. Give each species its own eye shape:
  - fox: almond with a lash wing;
  - snail: droopy half-lid;
  - mandrake: big round pupils with no white;
  - mushroom goblin: squint-lids;
  - rabbit: large dark glossy eye with 2 catchlights. Saint11 "Cuteness": "shiny and dark eyes have a very strong puppy effect".
- Keep 2 colours plus a catchlight at monster scale.
- Thin the outline on top and light edges (sel-out) and keep the heavy line only at the bottom and back.
- Add one hue-shifted form shadow on the shadow side (not a ring).
- Vary the hurt face per species: swirl eyes, tears, or one eye shut.
- Shape language by threat: friendly mobs are round, elite mobs get one triangle accent (horn, crest, tooth), and bosses are mostly triangles (rocketbrush).

---

## 6. Pre-merge checklist (per sprite)
- [ ] Greyscale shot: the strongest contrast is at the eyes.
- [ ] Skin and hair differ by at least 12 L, with an interior line and cast shadow at the bangs.
- [ ] The eye is 6 clusters or fewer, the lash is one polygon at least 1.0 lpx thick, and there are no stray real pixels.
- [ ] Catchlights are on the same side in both eyes.
- [ ] The mouth and chin are on the centre line (3/4 view).
- [ ] Neck shadow under the jaw.
- [ ] No INK on the nose or mouth. Brows and lashes are hue-tinted darks.
- [ ] Hair is in clumps, with an angel ring.
- [ ] Six expressions each read at 1x in-game.
- [ ] Walk and idle have lagging hair, tails and capes, plus a sideways sway.

---

## 7. Best references
1. **Saint11 (Pedro Medeiros), tutorials index**: https://saint11.art/blog/pixel-art-tutorials/. *Portrait*: colored lines at low res, eyes at 1/2 height, hairline 1/4, nose 3/4, mouth corners under the pupils, black border for contrast. *Cuteness*: big forehead and eye sockets, tiny maxilla, shiny dark eyes. *Outlines*: lighter internal borders, sel-out. *Shading*: hue shift and band compression, faces mostly one solid colour. *Motion Blur* and *Character Idle*: smears, lag, sideways sway.
2. **Slynyrd Pixelblog 29, Anime Faces & Hair**: https://slynyrd.com/blog/2020/7/28/pixelblog-29-anime-faces-and-hair. A 25-px female head with an 8-px eye: 2-px lash with an extended wing, dark iris, light lower lid, hatched blush, 2-dot nose. This is the closest analogue to our queen scale.
3. **Slynyrd Pixelblog 1, Color Palettes**: https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes. Ramps with a hue step of up to 20° per swatch, warming toward the light, and saturation peaking mid-ramp.
4. **Lospec, Pixel Art Outlines**: https://lospec.com/articles/pixel-art-outlines. Even segment runs on curves; no lumpy 5-2-1-2 sequences.
5. **Lospec, Outlines Part 2: Using Color**: https://lospec.com/articles/pixel-art-outlines-part-2-using-color. Outlines in the object's own dark hue; internal lines use the near part's colour and fade at joins.
6. **imonk, Selective Outlines**: https://itch.io/t/2422252/pixel-tutorial-selective-outlines. Each outline pixel is one shade below the fill next to it, lit by its own light direction.
7. **Pixnote, Shading & Lighting**: https://pixnote.net/en/learn/shading. Stages per size (64 px and up needs 4–5), shadow L −16 with saturation held, and a pillow-shading test.
8. **Pixel Parmesan, AA Fundamentals**: https://pixelparmesan.com/anti-aliasing-fundamentals-for-pixel-artists. AA inside the silhouette only; sel-out is AA on lines; avoid parallel same-length runs.
9. **BuskHusker GBA portraiting (Fire Emblem)**: https://feuniverse.us/t/buskhuskers-gba-portraiting-tutorials/10927. 5 skin shades shifting through red to purple, light on 1/2–2/3 of the face, 1–2 AA pixels per corner, keep the main shade unbroken.
10. **PixelJoint fundamentals**: https://pixeljoint.com/forum/forum_posts.asp?TID=11299. Clusters, banding, orphan pixels and value range defined.
11. **AnimeOutline, Female 3/4 face**: https://www.animeoutline.com/?p=4399. Centre-line construction; far eye, brow and lip half are compressed.
12. **AnimeOutline, Mature woman face**: https://www.animeoutline.com/anime-woman-face-drawing-tutorial/. Longer lower face, narrower eyes, smaller iris, pink-outlined lips, slender neck.
13. **AnimeOutline, Eyes & personality / Eyelashes / Closed eyes**: https://www.animeoutline.com/drawing-anime-and-manga-eyes-to-show-personality/ and https://www.animeoutline.com/how-to-draw-anime-eyelashes-step-by-step. Villain lids and small irises; heavy upper and light lower lashes; curved, pointed clumps; closed-eye curves.
14. **Clip Studio, Anime skin**: https://tips.clip-studio.com/en-us/articles/4358. Warm shadows with a cool second shadow, never grey; where shadows sit; blush, lip gloss and liner colours.
15. **Clip Studio, Chibi guide**: https://tips.clip-studio.com/en-us/articles/4863. Eyes low and close together, a dot or no nose, and mouth size and position by mood.

Other sources consulted:
- AnimeOutline face lighting: https://www.animeoutline.com/how-to-shade-an-anime-face-in-different-lighting/
- AnimeOutline female eyes: https://www.animeoutline.com/?p=4672 (highlights same side, not mirrored)
- AnimeOutline hair highlights: https://www.animeoutline.com/different-ways-to-draw-anime-hair-highlights/
- Clip Studio Eyes 101: https://tips.clip-studio.com/en-us/articles/2554 (menacing eye: bigger pupil, sliver highlight)
- Clip Studio generations: https://tips.clip-studio.com/es-es/articles/7027
- clipstudio.net chibi: https://clipstudio.net/how-to-draw/archives/155423
- Rocketbrush shape language: https://rocketbrush.com/blog/shape-language-in-game-character-design-how-to-make-characters-readable-and-consistent
- sprite-ai animation principles and timing table: https://www.sprite-ai.art/guides/animation-principles
- Flowlab "stop using mixels": https://community.flowlab.io/t/mini-rant-stop-using-mixels/38287
- Octopath HD-2D dev interview (raising sprite colour density when sprites looked "lonely" on big screens): https://www.siliconera.com/project-octopath-traveler-developers-answer-project-started-troubles-developing-hd-2d/

Note: searches for written breakdowns of MapleStory, Granblue, Arknights, Azur Lane and Cookie Run chibi sprites returned no usable text. The game-specific conventions above (such as the half-lid smirk on gacha villainesses and hikimayu for a Heian empress) come from familiarity with those games, not from cited pages. Check them against the in-game art before treating them as fixed.

## Exterior and interior design (the player's rule, 2026-11-03)

Every town, field and dungeon room is designed like a real place, not filled. The player called the
old towns "clutter and slop" and asked for everything to look perfect.

**Exteriors (towns and fields)**
- Three depths only: the play street in full detail, one far backdrop (hills, a distant town or
  skyline) washed toward the sky, and the sky. No half-hidden middle row of the same buildings
  behind the street.
- A street is a sequence of districts. Each district has one hero building or landmark, and the
  buildings either side vary in type and silhouette (tall and narrow, wide and low, a shop front),
  never one template recoloured.
- Platforms in a town are architecture: balconies, porch roofs, roof terraces, bridges between
  buildings, stairs. Never scaffolding or floating planks in the middle of a street.
- Props come in small, deliberate groups (a bench, a lamp and a planter at a doorstep), with open
  ground between groups. Nothing outsized or random (no giant flower in a village street).
- Contrast by depth: the street is the most saturated and outlined; the backdrop is paler and
  softer, so the player's layer always reads first.

**Interiors (any room that is inside something)**
- Walls and a ceiling frame the room; nothing outdoors shows unless through a window or door.
- Floors are the room's material: tile, parquet, carpet, planks, stone. No grass, flowers or soil.
- Platforms are part of the building: balconies, mezzanines, shelves, catwalks, stairs, scaffolds
  fixed to a wall or hung from the ceiling on chains. No floating islands with rounded rock
  undersides.
- Light comes from lamps, chandeliers, windows and glowing fixtures, never a sun.
- **Indoors is indoors (the player's rule, 2026-11-04: "learn the difference between interior
  design and exterior").** Nothing of the outdoors lives in a room: no birds hopping on the floor,
  butterflies, gulls, fireflies or squirrels; no petals, leaves, snow or rain drifting through; no
  sea glints, pollen or outdoor motes; no street life passing; no sun, moon, clouds or open sky; no
  birdsong, gulls or crickets in the sound (a room is hushed: a floorboard, a chime, its own
  fire or kettle). The outside shows only through a window, a porthole or an open door. A room's
  life is its own and drawn with it: an oven's fire, steam off a tray, lanterns swaying, a hammock,
  a mobile turning, a pet that lives there. (In code: a map with `indoor: true` drops its town's
  outdoor look in `roomLook`, render/scenery.js, its town's outdoor particles, and plays the
  `room` ambience.) Check every new room for this before showing it.
- **The floor you walk on is the room's floor (the player's rule, 2026-11-04).** A room painted as
  one picture paints its floor all the way down past the bottom of the view, and the map draws no
  ground strip of its own over or under it (`look.floor: 'painted'`), so the boards, tiles or
  tatami under your feet are the ones in the room, never a default strip of another material.

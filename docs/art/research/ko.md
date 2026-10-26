# Korean-language research: pixel art, animation, effects, hit feel, maps, UI (for Tengu)

Researcher: KO. All sources were opened and read; techniques were extracted from the text or measured from the data.
The strongest result is **primary MapleStory data**. I pulled real frame delays, sprite sizes, outline colours,
alpha use, tile kits and parallax values from the game's WZ files, using the maplestory.io WZ browser
(GMS v83 = classic Maple), and checked them by rendering contact sheets. Those sheets are in
`scratchpad/ko/maple_*.png`. The rest is Korean tutorials, NDC talk write-ups, game-feel essays, and course notes
from Korean pixel artists.

## 1. Engines and queries that worked

- **Naver blog tab** (`search.naver.com/search.naver?ssc=tab.blog.all&query=…`) via curl: works, but results are very noisy (AI-prompt and
  ad posts). The best hits came from precise terms: `[도트 강좌 / 도트 강의]`, `역경직 히트스톱 타격감`, `NDC 타격감`.
- **Naver blog index API** (`blog.naver.com/PostTitleListAsync.naver?blogId=…&categoryNo=…`) listed a whole tutorial series once
  one post had been found. That is how I recovered the full 21-lesson 검은얼음 course and the 37 Coloso course-note posts.
- **Daum** (`search.daum.net/search?w=fusion`): partial results. **DuckDuckGo html**: works with 4 s pauses, otherwise it returns empty pages.
  **Bing**: returned unrelated results (COVID pages) for every Korean query, so it was unusable. **Google**: needs JS, no results.
- **WebSearch with `allowed_domains` = inven / ruliweb / thisisgame / zdnet**: best for NDC, BIC and IGC talk recaps.
- Blocked: namu.wiki (403); blog.maplestory.nexon.com (Nexon security check, 403, and not in the Wayback Machine). Note for the
  team: the Nexon "메이플로그 Tech" articles about Maple 도트 (e.g. "테크 아트 도트 장인이 모여 한땀한땀 빚어내는 메이플 코디 세계") exist but
  can only be read in a real browser.
- **maplestory.io WZ API** (`/api/wz/GMS/83/<path>`): primary game data, scripted with `kotools/mz.py`, `medge.py`, `mimg.py`, `mback.py`.

## 2. Top findings (technique, numbers, source, how it applies to Tengu, effort)

### A. MapleStory primary data (measured from the WZ files)

1. **MapleStory: player action timings (ms per frame).** stand1 3×500 (1.5 s breathing loop). walk1 4×180 (720 ms cycle).
   alert 3×500. jump 1 frame. ladder/rope 2×250. fly 2×300. One-handed swings swingO1/O2/O3, plus swingT1, swingP1, shoot1
   and heal, **all share 300 / 150 / 350**: a long wind-up, a very short strike frame, and the longest hold on the
   follow-through. stabO1 is 350 / 450 (2 frames). Finishers ("F" variants) are 4 frames 200/100/100/300 (swingOF) or
   250/150/300 (stabOF). shoot2 has 5 frames 160/160/250/100/150. Every basic attack lasts **700–820 ms**.
   *Tengu:* use this as the timing template for `data/skills.js` combo steps and the `figure.js`/`animator.js` poses.
   The strike pose should be the shortest key (about 20% of the move) and the follow-through hold the longest (about 40%).
   Our `at` values (0.4–0.68 of dur) match Maple's "impact at ~37–55% of the move". The finding to act on is that the
   *recovery pose is held* rather than eased out. Idle at 3 keys × 500 ms is a very calm, readable breath; ours may be too busy. **S**
2. **MapleStory: monster timings.** Snail: move 5×180, hit1 **1 frame × 600 ms**, die1 9×120 then a 300 ms last frame.
   Orange Mushroom: stand 2×180, move 3 frames 180/120/180 (the short middle frame is the hop's airborne snap), hit1 1×600,
   die1 180/180/300. Zombie Mushroom move 180/200/120/180. Jr. Balrog (boss-like): stand 2×150, attack1 12 frames, 8×100 wind-up
   then **500, 700** holds on the two impact frames, then 150/100. attack2 400/100/400/100 (pose-snap-pose-snap).
   *Tengu (`src/render/mobs/*`, `world/mobs.js`):* (a) the hurt pose is **one** dedicated drawing held about 0.6 s, not a shake loop;
   (b) every death ends on a ~300 ms final frame before the fade; (c) big monsters telegraph with a long held pose (500–700 ms)
   right at impact. This is the "enemy anticipation is long, player anticipation is short" asymmetry (see 13). **S–M**
3. **MapleStory: skill effect timings.** Power Strike cast effect 5×90 ms, hit spark 2×70. Slash Blast effect 6×50, hit 2×90.
   Energy Bolt ball 4×80, hit 3×80. Magic Claw cast 4×80, hit 120/90/120/90/150. Fire Arrow ball 3×**30** ms (fast flicker),
   hit 5×90. Cold Beam cast 4×70, hit 100/100/70/100/100/100. Meteor: 25×90 cast, 23-frame tile layer, final frame 540 ms.
   Lucky Seven / Triple Throw cast 360/150/120/150/120/100 (a long first frame, then fast).
   **Rule:** cast and impact effects run at 50–120 ms per frame. Hit sparks are 2–5 frames (140–570 ms total).
   Projectiles loop 3–4 frames at 30–80 ms. *Tengu (`strikes.js`, `spells.js`, `particles.js`):* step procedural effects at
   ~12 fps (80 ms) instead of smooth per-frame tweening, so they read as pixel animation. Keep hit sparks at ≤3 steps for
   light hits and 5 for heavy ones. Spin projectiles faster (30–50 ms per step). **S**
4. **MapleStory: sprites have hard 1-px pure-black outlines and no alpha AA. Effects have no outline and are fully translucent.**
   Measured: Orange Mushroom stand 63×58 px, 148 colours, **0 semi-transparent pixels**, all 177 edge pixels `#000000`.
   Snail: edges `#000000` with a few `#111111`/`#222222`. Jr. Balrog 160×156, 18 colours, edges `#000000`. Character body 21×31,
   head 39×35, edges `#000000`. By contrast the Power Strike effect frame is 52×37 with **959/959 pixels semi-transparent** and edge
   colours `#ff1100`/`#ff0000`. Visually (maple_fx1/2.png): a **white-hot core, a saturated-hue middle and a soft alpha halo
   4–8 px wide**, no line at all. Ice (Cold Beam) shards are the exception: crystals with a dark-blue self-coloured outline
   and white highlights.
   *Tengu:* this rule is directly usable. Sprites (`pixel.js` outline pass) stay crisp and outlined. All `fxkit.js` energy effects
   should be drawn as "white core → hue → transparent halo" with **no dark outline**, so they separate from bodies.
   Physical effects (ice, rocks, arrows) get a dark *self-hue* outline, never black. **S**
5. **MapleStory: chibi proportions.** The head sprite (39×35) is larger than the body (21×31), so the head is about half the
   standing height (~60 px). Mob hurt frames swap the *face* (shocked round eyes, open mouth) and add a white spiky starburst
   behind the body. They do not use a white flash. *Tengu (`hero.js`, `kit.js face()`):* give each mob a dedicated hurt face
   instead of only the shared `><`, and add a 1-frame white starburst sprite behind the target on hit. **S–M**
6. **MapleStory: icons.** Every skill icon is **32×32** with a 1-px black frame, cut corners (rounded) and a light inner
   background. There are **three states**: `icon` (muted pastel), `iconDisabled` (greyscale) and `iconMouseOver` (more saturated
   and brighter). Meteor icon: 62 colours, all edges black, no alpha. Potions: 27×30, black outline, plus a semi-transparent soft
   drop-shadow at the bottom-right (108 of 528 pixels translucent). *Tengu (`render/icons*`, UI):* generate disabled and hover
   variants procedurally (desaturate, or +sat/+value). Add a translucent offset shadow to item icons only. **S**
7. **MapleStory: terrain tile kit + parallax.** Each tileset (e.g. grassySoil) is 11 piece types: `bsc` (fill 90×60),
   `enH0`/`enH1` (top grass caps 90×38 / 90×25, which overlap the fill), `enV0/enV1` (side edges 32×60), `edU/edD`
   (corner caps), and `slLU/slRU/slLD/slRD` (slopes 90×94). The terrain has **no black outline**. The grass cap is a bright
   yellow-green rim of overlapping blades over darker soil, which gives a strong value step at the walkable edge.
   The Henesys backdrop uses these layers: solid sky colour (type 3 = tiled, rx 0); a cloud layer (type 4 = horizontally tiled and
   **auto-drifting**, rx −5); a far hill (rx −20); near grass bands (rx −40). Backgrounds are softly *painted*, not pixel-clustered,
   and are 1024–2493 px wide. *Tengu (`terrain.js`, `scenery.js`):* (a) give platforms a separate, lighter overlapping "cap"
   strip; (b) keep terrain outline-free so outlined actors pop; (c) let clouds drift on their own; (d) use a parallax ladder of
   about 0 / 0.05 / 0.2 / 0.4, and lower contrast on distant layers. **M**

### B. Hit feel (타격감): Korean game-feel essays and NDC

8. **"타격감 = 충돌의 증거", the eight-element timeline** (잼, Naver, 2026; covers Dungeon Fighter, MapleStory, Smash, Sekiro).
   Input frame: wind-up start and swing whoosh. Hit frame: high-frequency attack sound, **hit flash**, hit FX, vibration. Next few
   frames: **hit-stop with the victim trembling**, plus the low-frequency body thud. After the stop: stagger/knockback, screen shake,
   follow-through. Later: damage numbers. Specific rules:
   hit-stop ∝ damage **with a cap** (Smash: 15% → 15 f, ×1.5 for electric, max 30 f). During the stop the **victim shakes
   (horizontal on the ground, vertical in the air) with decaying amplitude, and the attacker keeps creeping forward slightly**.
   A total freeze reads as lag. Multi-hit skills get the flash, the low-end sound and the stop only on the **first and last** hit.
   The middle hits get a light tick (also needed for the ~3 flashes/s photosensitivity guideline). Screen shake uses
   **trauma** (0–1, decays; offset ∝ trauma² or trauma³, noise-based, capped; Eiserloh GDC16) and is **directional** for slashes
   ("one push in the swing direction and back"). Short zoom-in only for kills, finishers and parries. Dungeon Fighter: blunt
   ("타격") hits apply 역경직 (*attacker* hit-stop that stacks per target) while cuts ("베기") have none. The trade-off is weight
   against an opening for counters. MapleStory takes the opposite route: weight comes from volume (stacked damage numbers, many
   hits), with per-hit stop removed, and the game offers effect-transparency and shake toggles plus a player-silhouette option so
   the hero stays visible in effect clutter.
   https://blog.naver.com/byjun_04/224412686555 (KO). *Tengu (`world/world.js` hitstop/juice, `melee.js` strikes):*
   add victim tremble during `hitstop`; give heavy finishers a tiny attacker creep; switch `shake` to a trauma accumulator
   with directional kicks; cap hitstop stacking per frame. Multi-hit skills should apply `stop`/`big` only to the first and
   last strike. Hit-stop and shake options already exist; add an "effect opacity" option and a hero silhouette shown when the
   hero is overlapped. **M**
9. **NDC 2016, HIT (NetGames) "타격감은 어디서 오는가"** (유현석). Four stages: input, action, hit, reaction. Multi-hit
   rhythm should be **"따당 땅" (da-dang… dang) rather than "땅땅땅"**: uneven spacing with the last hit delayed. The animation can
   show 5 swings while dealing 9 hits. The reaction is about *exaggeration*: hit pose + stagger + **white hit shader**. Six
   intensifiers: camera, slow-mo, crit staging, hit-stop, afterimages, destruction. Too much shake causes fatigue and shorter
   sessions. https://blog.naver.com/hakte/220696060740 and the expanded notes at
   https://blog.naver.com/catllage/220762356578, which add that **timing off by 0.005 s already lowers hit feel**, a death needs a
   readable beat (coin drop or dissolve), and hit effects should come in lighter variants for the same reason.
   *Tengu:* make multi-strike `at` arrays uneven (e.g. 0.30, 0.38, 0.62 instead of evenly spaced). **S**
10. **Jiesang Song (Phantagram, Kingdom Under Fire), "액션게임에서 타격감을 향상시키는 방법"** (the Korean original of the
    Gamasutra 2005 article, reposted at https://blog.naver.com/asesin/130142318152 and s1s1w1). At 30 fps, follow-up hits
    **less than ~5 frames apart read as one hit**, so space strikes ≥ 160 ms. Ninja Gaiden's heavy sword is slow on the first 2
    strikes and faster on the last 3. To keep heavy weapons fast, **nudge the camera a few px in the swing direction for a few
    frames** at the swing apex. Use a white full-screen flash on special kicks (Ninja Gaiden) and darken everything except the
    hero and particles before a super (Dynasty Warriors). After a frame pause, **play the remaining animation faster to recover
    the lost time**. *Tengu (`post.js`, `combat.js`):* add a camera nudge for `big` strikes, a pre-ultimate screen dim, and
    "catch-up" playback after hit-stop so the total move length stays MP/animation-bound per CLAUDE.md. **S–M**
11. **Hit-stop length guidance** (무꼬's Art Life devlog): 100–200 ms feels right and still reads as impact, not lag. Freeze only
    the attacker's and victim's animations, not global time, so UI and other actors keep moving.
    https://art-life.tistory.com/178. *Tengu:* current values (0.045 normal, 0.06–0.1 finishers, 0.3 boss kill) are on the
    short side for finishers. Try 0.10–0.14 on the heaviest blows only. **S**

### C. Pixel animation fundamentals (Korean courses)

12. **검은얼음's 21-lesson 도트 강좌** (Naver, 2013; https://blog.naver.com/icedark4u, category 18).
    Walk (5-3/5-4): build in this order, **legs → pelvis → head first, then arms, props and secondary motion**. In a 1-2-3-2 walk
    the body is **1 px higher on the passing frame** (legs together) and lower on the contact frame (legs apart). The head
    bobs 1 px in sync. A hat or ears lag one frame (secondary action). Add a blink.
    Idle (5-2): an idle is **never a still pose**. Overlap: legs → hips → shoulders → head move with small time offsets, and
    hair/cloth trail. About 10–13 actions cover a whole character.
    Attack (5-5): pixel animation runs at "about 5 drawings per second", so add a **잔상 (smear/afterimage) and a 충격효과 (impact
    burst)** on the strike frame. Impact-burst construction: find the force vector F. The struck surface dents *inward*, rays
    radiate from the burst centre, and **the rays on the extension of F are drawn longer than the others**.
    Hurt/guard/dodge (5-6): guard is a small shake. Dodge is a small diagonal hop. Hurt is a **quick push back and return plus a
    red tint**.
    Emotes (5-7): emote bubbles point at the face. Colour by arousal (anger/love red, sadness blue, joy yellow, calm green).
    **Low-arousal emotes change frames every 0.5 s, excited ones every 0.2 s.**
    Skills (5-8): effect size scales with skill tier (basic < low < mid < high < awakening). Classify by target, element, cast
    type and effect.
    Depth (4-3): far limbs and objects get **darker values** (not only desaturated). Lighter means nearer.
    Identity (4-1): at small sizes, recognisability depends on **colour proportions > signature item > hair > outfit > silhouette**.
    *Tengu:* the walk bob and the leg-first build go straight into `figure.js`/`animator.js`. The directional impact burst
    becomes a `fxkit.js` primitive (an anisotropic star with longer rays along the knockback vector). The far-limb darkening
    applies to `hero.js`/mobs. **S–M**
13. **Coloso "도트 캐릭터에 숨을 불어넣는 픽셀 애니메이팅"**, 37 lesson notes (https://blog.naver.com/gt0617).
    The principles used most are **squash/stretch, anticipation, follow-through/overlap, arcs, timing**. Walk: the upper and
    lower torso counter-rotate, and the legs hang from a *moving* pelvis. Shortcut: animate one leg, then copy it with a
    half-cycle offset. Melee power comes from **rotation (회전력) around a body axis**. Weapon attacks are the best value
    because the smear of the weapon carries the weight. Ranged attacks keep the body still and push the energy into
    **cloth, hair and the muzzle/bow fx**. FX: **shockwaves must be short** (long ones read as smoke). Fire needs flying embers
    or it reads as waving cloth. Explosions need smoke rising *and* debris falling. Lightning gives the most impact for the
    least work. Materials, in steps: line → light/mid/dark flats → split the darkest band at the edge → detail →
    **recolour the outline last**. *Tengu:* archer and mage `combo` steps should add strong cape and hair whips on the release
    frame. Cut `fxkit` shockwave lifetimes to about 120–180 ms. Add falling debris to explosions. **S–M**
14. **Smear taxonomy and afterimage recipe.** Smear kinds (sunny5732.tistory.com/3): stretchy, break (an "impossible" bend
    that adds snap), duplicate/multiple, shape, speed-line, jagged anime smear, disappearing, blurred.
    Afterimage recipe (note.com/good_oxalis3723, Korean edition): place earlier poses *behind* the motion, **tint them with
    1–2 cool same-hue colours in screen blend**, fade them toward the tail, and space them unevenly (wider in the middle of
    the motion). *Tengu (`weapon-fx.js`, dash moves):* add tinted afterimage copies of the hero sprite on dash and finisher moves.
    Use the break smear (one stretched frame) on the fastest swing frame. **S**
15. **Mini-character acting** (창조도시 translation of a Japanese RPG Maker course, https://blog.naver.com/hotjh90/50105964059).
    For 3-pattern actions the *middle* frame faces front, which makes the spin readable. Raising the right arm drops the left
    shoulder (counter-spin). At small sizes, **exaggerate**, keep the pattern count low, and use 漫符 (emote marks).
    Prepare light and dark variants of emote marks for light and dark backgrounds. Outward motions read masculine and
    energetic, inward motions read gentle. *Tengu:* NPC idle "acting" loops and emote bubbles. **S**

### D. Sprite art, colour and general pixel art

16. **Coloured shade instead of grey multiply; 2–3 tones; a forced local shadow under the bangs.** NDC26, Neople TA (Dungeon
    Fighter cut-scenes toon shader; https://www.inven.co.kr/webzine/news/?news=317573). Textured gradients plus
    "achromatic shadow multiply" are what make a render look muddy and 3D. The fixes: 2–3 tone ramps; a **separate artist-picked shade colour per
    material (face, hair, cloth)**; detail carried by lines on hair and collars instead of texture. Signature rule: *"if this
    pixel is face and the pixel above is hair, draw shadow"* gives a light-independent bang shadow.
    *Tengu (`pixel.js` cel pass, art-bible rule 7):* implement exactly this as a raster pass. Tag the hair and skin masks, and
    paint 1–1.5 lpx of skin shadow wherever skin lies under hair. Swap any `darken()` shade for per-material hue-shifted shade
    colours. **M**
17. **Low-colour shading by borrowing neighbouring hues** (검은얼음 4-2). With a few colours, darken by moving to the next hue
    toward violet and lighten toward yellow: red → brown-red dark, pink light; yellow → **olive-green dark**; green → blue-green
    dark; violet → dark red. This is the Korean phrasing of hue-shifting. *Tengu:* the ramp builder in `pixel.js`/`kit.js`
    should rotate hue as value changes (−10…−20° toward blue/violet in shadow, toward yellow in light). **S**
18. **Light setup** (검은얼음 3-1): one key light at about 45° from front and 45° from above. Shade the dark side first, add one
    deeper occlusion step, then a **faint bounce/back-light on the far edge**, then a small specular highlight.
    Dithering (3-2, and the 창조도시 tile-pattern lesson): use it only on large, flat areas (useless under ~16×24 px), build
    the checkerboard midpoint first and grow patterns outward from it, use dither as *texture* (stone, cloth) more than as a
    gradient, and judge it only at 1× zoom. Dithered halftone (족오아트): **colours × dot sizes + 1** tones, e.g. 4 colours
    × 3 sizes = 13 tones. *Tengu:* `post.js` lighting overlays and map props can use ordered-dither texture at 1 lpx steps.
    Never dither characters. **S**
19. **Outlines** (검은얼음 2-2; Recallove curriculum 2-1-1 "다양한 외곽선"): outline only the silhouette, depth breaks and needed
    grain. Build curves with the **line tool in straight runs, not freehand**, so the steps stay even. *Tengu:* already covered by
    art-bible A5. This confirms it. **—**
20. **Professional curriculum benchmarks: Recallove** (ex-Gravity/Ragnarok and Supercat pixel designer; https://blog.naver.com/514105/224334728825).
    Order: palette from current trends → outlines and views → line and light → **64-px, 2-head-tall chibi** from circles and
    boxes → AA used selectively for *faces* → **pastel palette construction** as its own lesson → **32-px item and face icons** →
    ball bounce → idle → walk → run → **sub-pixel animation** → attack → cape/flag → jump. *Tengu:* a 64-px 2-head chibi is
    our exact target class. Add sub-pixel animation (shifting AA or colour pixels instead of moving whole pixels) to idle
    breathing so res-3 sprites move by 0.33 lpx without wobble. **M**
21. **Pixel illustration at a large canvas** (김펠리, postype): Clip Studio with AA fully off on pens and the bucket, and bucket
    expansion set to 0. Canvas >256 px. Draw the way you normally illustrate and keep the stair-steps. *Tengu:* our res-3
    rasteriser should likewise fill with AA off. AA comes only from explicit cluster rules. **—**
22. **Effects by element** (Korean translation of a Japanese illustration guide, https://ichinisann.tistory.com/47).
    Fire = stacked vertical ellipses, big at the root and smaller at the tips, asymmetric, with **detached flame bits**, a
    yellow core and a red rim. Lightning = random-length zigzag, **thicker at the corners**, small branch bolts, ring bursts at
    the joints. Wind = long ribbons that taper like hair clumps, inside lighter than outside, darker where the ribbon shows
    its back. Water = ellipses along a flow line (long and thin where fast, round where slow) with one "mass" and droplets.
    Smoke = ellipses of varied size along a wind curve (round where air pools). Glows have **light-coloured outlines**.
    Layouts: along the motion line, radial/converging (focus), or circular around the body (depth).
    *Tengu (`spells.js`, `elements.js`):* each recipe maps to a canvas path builder. The lightning thick-corner rule and fire
    detached-bits rule are cheap wins. **S–M**

### E. Other games (Korean write-ups)

23. **SANABI (Wonder Potion), IGC/BIC talks** (inven 265140, ruliweb 155749; zdnet). Cool pixel action needs a taller
    figure than very low head-to-body ratios allow. The giant boss needed **shader colour-grading so a huge pixel sprite sits
    with the small ones**. Animation, music and *timing of staging* were reworked repeatedly. Commenters note heavy screen
    shake in 도트 games as a cheap hit-feel crutch. *Tengu:* keep chibi heroes, but give bosses more head-to-body ratio and a
    per-layer grade. **—/S**
24. **Skul (SouthPAW), Inven talk 2019** (https://www.inven.co.kr/webzine/news/?news=230007). An 8-month top-down prototype
    was scrapped for poor hit feel. Moving to a side view fixed it. **Transformation (skull swap) gets a flashy effect** so even
    a state change reads as action. *Tengu:* job, buff and summon toggles deserve a burst effect. **S**
25. **Workload benchmark** (NDC2019, Spirit Wish; https://www.inven.co.kr/webzine/news/?news=219201). Ragnarok used about
    230 motions per character over 40 jobs ≈ 11,200 drawings. MapleStory about 9,200, Dungeon Fighter about 2,500 (before skins;
    about 500k with variants). Spirit Wish rendered bodies from 3D and swapped hand-drawn heads, and gave **only one hair strand
    a pendulum motion, copied to the rest**. *Tengu:* this supports our code-built parts approach. Hair sway in `figure.js` can
    be one pendulum with per-clump phase offsets. **S**
26. **MapleStory M interview** (Inven 165383): skill effects were deliberately *not* simplified for mobile, because the effects are
    the "Maple feel". **—**

## 3. Reference list

- byjun_04, "타격감은 무엇으로 만들어지는가" (8 elements, DNF vs MapleStory): https://blog.naver.com/byjun_04/224412686555
- NDC16 HIT 타격감: https://blog.naver.com/hakte/220696060740 · notes: https://blog.naver.com/catllage/220762356578
- Jiesang Song, 타격감 (KO original of the Gamasutra 2005 article): https://blog.naver.com/asesin/130142318152 · https://blog.naver.com/s1s1w1/220088737682
- Hit-stop devlog: https://art-life.tistory.com/178
- 검은얼음 21-lesson 도트 강좌 (walk 30169808351/30169890166, attack 30169952640, hurt 30170013991, emotes 30170072740, fx
  30170142266, light 30168839733, dither 30168906802, colour 30169102849, depth 30169233576): https://blog.naver.com/icedark4u
- Coloso pixel animating course notes (37 posts): https://blog.naver.com/gt0617
- Recallove (pixel artist, ex-Gravity/Supercat), 12-week curriculum: https://blog.naver.com/514105/224334728825 · student review https://blog.naver.com/d_turtle/224395374227
- 창조도시 tile pattern / mini-char acting: https://blog.naver.com/hotjh90/50105960152 · https://blog.naver.com/hotjh90/50105964059
- Effects by element: https://ichinisann.tistory.com/47
- Smear types: https://sunny5732.tistory.com/3 · afterimage recipe: https://note.com/good_oxalis3723/n/n05feeb4ba2b2
- Dithered halftone: https://blog.naver.com/skatejogo/224444414271
- UPC "ピクセルアートではじめる背景の描き方" Korean edition (TOC: tile patterns, 점근화, aerial and overlap perspective, composition,
  day/night light): https://blog.naver.com/xxoser/223417394528
- Pixel illustration in Clip Studio: https://www.postype.com/@pellyk03/post/18893574
- NDC26 Neople toon shading: https://www.inven.co.kr/webzine/news/?news=317573 · NDC19 Spirit Wish 2D: https://www.inven.co.kr/webzine/news/?news=219201
- SANABI dev talk: https://bbs.ruliweb.com/news/read/155749 · Skul talk: https://www.inven.co.kr/webzine/news/?news=230007 · Skul interview 225767
- MapleStory WZ data: https://maplestory.io/api/wz/GMS/83/Character/00002000.img (actions), `/Mob/<id>.img`, `/Skill/<job>.img/skill/<id>`,
  `/Map/Tile/grassySoil.img`, `/Map/Back/grassySoil.img`, `/Map/Map/Map1/100000000.img/back` (parallax rx/ry/type).
  Rendered sheets: `scratchpad/ko/maple_mobs.png`, `maple_fx1.png`, `maple_fx2.png`, `maple_icons.png`, `maple_tiles.png`, `maple_back.png`.
  Scripts: `scratchpad/kotools/` (ns.py, ms.py, get.py, bl.sh, mz.py, medge.py, mimg.py, mback.py).

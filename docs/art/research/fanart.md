# Research: pixel fan art of anime, manga and game characters (static and animated)

Area: how skilled artists turn anime, manga and game designs into small pixel sprites (faces, eyes,
hair, costumes, accessories, poses, idle loops, attacks and specials) while keeping likeness and
appeal. Sources are in Japanese, Korean, Chinese, Russian and English. I measured most of the numbers
myself from the artists' own files: tutorial images from X (fetched through the fxtwitter API) and
Pixiv ugoira frames and per-frame delays (fetched through Pixiv's ajax `ugoira_meta`). Downloads are in
`(working folder, not kept) fanart-dl/`.
The art bible already covers eye construction, sel-out, hair clumps and the angel ring. This file only
adds to it or makes it more precise.

## 1. Engines and queries: what worked

- **Pixiv ajax search and ugoira_meta (worked best).** Searched tags ドット絵講座, ドット絵 メイキング,
  ドット絵 待機モーション, ドット絵 ミニキャラ and "pixelart anime fanart". For each ugoira this gave the exact
  frame count and per-frame delay plus the frames themselves.
- **X/Twitter.** WebSearch restricted to x.com found the thread IDs; api.fxtwitter.com returned the
  text and full-size media. Queries: ドット絵 講座 目の打ち方, ドット絵 アニメーション 講座 待機 髪 揺れ, ドット絵 攻撃モーション 講座,
  "pixel art attack animation smear".
- **WebSearch (in each language)** found Ruliweb, Postype, dcinside, Habr, DTF, 163.com and Zhihu
  results. The Bilibili article API returned one article.
- **Blocked or useless:** DuckDuckGo (captcha), Yandex (captcha), Naver (fetch blocked), Yahoo! JAPAN
  and Bing (0 results or off-topic results), web.archive.org (blocked, so the st0ven "Fighter Sprite
  Faces" pages could not be read), Zhihu (403), the Bilibili search API (refused, so not pursued), VK
  (blocked), and dic.pixiv (403).

## 2. Top findings

### A. Proportions and pixel budgets measured from real fan sprites

1. **Measured head, eye and height ratios of anime fan sprites** (native pixels, measured by me):

   | Sprite (artist) | Height | Head height | Heads tall | Eye (w×h) | Eye line (from crown) |
   |---|---|---|---|---|---|
   | Hatsune Miku (APO+, X) | 46 | 21 | 2.2 | 4–5 × 5–6 | ≈70% |
   | Yuuka, Blue Archive (Ruliweb, KR) | 80 | 26 | 3.0 | 4 × 4, under a 5-px lash bar | 62% |
   | Madoka idle (puzu, Pixiv) | ≈83 | ≈30 incl. twin-tail bows | 2.8 | 3 × 4 | ≈60% |
   | SF3-style Chun-Li (Tsugumi, EN) | 95 | ≈14 | ≈6.5 | 2–3 px | — |
   | Yagen / Mononofu fighting idles (Pixiv, MUGEN) | 180–220 | — | ≈6–7 | — | — |

   - In every small chibi sprite the eye is **15–20% of the face width**, and the gap between the eyes
     is about one eye width (4–5 px).
   - The **upper lash is the widest dark mass on the head**: a 1-px bar that runs 1 px past the iris
     on the outer side.
   - The iris touches the lash. Sclera shows only at the corners.
   - The eye line drops lower the cuter the character: about 60% from the crown at 3 heads, about 70%
     at 2 heads.
   - **Tengu:** this confirms the bible's maiden eye (4.4 lpx wide on a 14-lpx head = 31%). The
     queens are about 5 heads tall at about 125 lpx, which matches fighting-game norms for "glamorous"
     characters. Keep them that tall and give them face-first contrast (finding 6) instead of
     shrinking them. Effort: none, reference only.

2. **Detail budget by size** (pixnote.net, EN/JP):

   | Sprite size | Heads tall | Eyes | What it can carry |
   |---|---|---|---|
   | 16×16 | 2–3 | 1×2 | hairstyle |
   | 24×24 | 2.5–3.5 | — | clothing, expressions, accessories |
   | 32×32 | 3–4 | 2×2, with a 1-px highlight | — |
   | 48 and up | 4–6 | 3×3 and up, with pupil, iris and lid | — |

   - Use 2–3 colours per part and 6–12 per character.
   - At 16 px, arms are 1 px wide (2 px merges into the torso).
   - Avoid pure #000 outlines; pixnote uses #2d3436.
   - **Tengu:** the player avatar head (about 24 lpx, see `src/render/hero.js` NECK=24) is in the
     "3×3 and up" band, so a pupil and lid are fine. Monster `face()` eyes in `kit.js` are 2-dot eyes
     at 32-px scale, which is correct for that size. Effort: none, reference only.

3. **Clean MapleStory-style faces: keep "LD eye size on SD proportions"** (dcinside 메이플 미니갤 face-dot
   lecture, KR).
   - Maple-style faces are SD (super-deformed), but if you also make the eyes SD-sized they get too
     big. Keep the eye size of a normal-proportion (LD) face.
   - Placing the eye first tends to push the whole face upward, because the eye lands where the eye
     socket starts. Place it relative to the hairline instead.
   - Beginners get the near and far eyes out of proportion. Copy a proven eye and adjust it 1 px at a
     time.
   - The carat.im Maple avatar spec gives head plus hair at **60–65% of total height**, with eyes wide,
     flat and low in the face.
   - **Tengu:** a sanity check for `heroine.js` maiden eyes. Don't grow them past about 32% of head
     width. Effort: S.

### B. Building the face and eyes (what the artists keep, drop, and do in what order)

4. **The order artists actually use** (APO+ 「キャラドットの作り方」 Miku, X, JP; 春疾風 「16色でドット絵メイキング」 SaGa
   Frontier 2 Philip, Pixiv 2.8k bookmarks; Ruliweb Yuuka, KR; Sergio Flores via Habr, RU).
   - Step order:
     1. Draw a 1-colour silhouette or stick figure.
     2. Block in flat colours to settle the overall impression.
     3. **Abstract the design**: keep its defining features and drop the rest.
     4. Add the outline, light and shadow, then tune the colours.
   - 春疾風 draws the **eyes first, right after the line art**: "how well the eyes come out roughly
     decides the whole dot character."
     - His sclera is **not pure white** but slightly yellow.
     - He changes the black line art to dark grey, then recolours each line to match its neighbour.
     - He reuses one colour across several parts (the hair shadow is also the trouser shadow, and
       the sclera white is the metal highlight) to stay within **16 colours**. He had 11 colours
       after flats, and shaded in 2–3 steps.
   - Ruliweb's order: side hair, bangs, gap-fill side hair, tails, face and hair flats, skin and hair
     shadow, eyes and mouth, clothes, **back hair last** (it depends on the collar), accessories
     (halo, clips), then **recolour the black outlines last**.
   - **Tengu:** this matches our rig order. What's new: the near-white sclera should be tinted (see
     finding 6), and colours should be shared across parts so a queen reads as one palette.
     Effort: S.

5. **Eyes carry the intermediate colours** (APO+: 「目は中間色などを使って情報量を多く」; honöca* 自己流ドット絵目イキング,
   Pixiv 1.2k bookmarks; Rappenem eye sprite, X).
   - AA and mid-tones are spent almost only on the eyes. The rest of the sprite stays flat.
   - honöca's eye in 5 steps, using 6–7 colours in total:
     1. A 2-colour base: a dark lash band about 2 px thick plus a tall oval iris. There is no sclera
        except at the corners.
     2. A cream lid-skin highlight above the lash (the double lid).
     3. The iris darkens toward the top under the lash, and a brown pupil is added.
     4. The lower lid in brown, with the outer end of the lash lightened.
     5. One white catchlight and one navy accent in the pupil.
   - Rappenem (portrait scale):
     - The lash is **navy or indigo, not black, with a lavender highlight running along it**.
     - **The top of the sclera is tinted blue**, because the lid casts a shadow on it.
     - **The iris is lightest at the bottom** (yellow to pink reflected light), with a purple pupil
       and a pale-yellow lower lid.
   - **Tengu (`heroine.js` eye, iris bands):**
     - Make the sclera's top 1/3 a cool shadow tone (`mix(sclera, lashColour, 0.25)`).
     - Make sure the iris's light crescent is at the bottom (already planned).
     - Give the lash a 1-lpx lighter streak in the lash hue along the outer half.
     - Effort: S.

6. **Make the iris hue contrast with the hair** (observed in 妖北狐鷹's fox-girl retry, Pixiv: a blonde,
   white and red kitsune miko almost identical to Tamamo's design, but with **teal eyes on orange-gold
   hair**; also Madoka's pink-red eyes in pink hair, which only work because of a dark lash).
   - The fan artist's gold hair is saturated orange with strong orange shadows. It never goes near
     cream.
   - **Tengu (biggest likeness and appeal win for the queens):**
     - Tamamo has amber eyes in gold hair. Give her a jade or teal iris (about 170° hue), or keep amber
       but add a vermilion lower liner. The goal is an iris at least 90° of hue from the hair.
     - Sylvana has green eyes in green hair. Give her rose-gold or violet eyes.
     - Lilith (red in violet) and Selene (blue in lavender) are fine.
     - Also push Tamamo's hair to saturated gold with orange shadows (the bible already proposes
       moving to `#ffe2a6`; go further, to about `#ffd27a` base and `#e89a3c` shadow).
   - Effort: S (palette edits in `queens.js`).

7. **Small-sprite eye glyph** (Nippon Ichi official 「ドット絵講座中級編」, Classic Dungeon X3, X, JP).
   - On a head about 13 px wide, each eye is an **L or Γ glyph**: a 2-px lash bar plus a 1-px
     vertical iris, 2×3 overall.
   - Then, in order:
     1. A **skin shadow cast by the bangs** across the forehead and the top of the cheeks.
     2. Strand lines in the hair-shadow colour.
     3. **One highlight band** across the crown.
   - That is four steps, and the head reads as anime.
   - **Tengu:** the recipe for tiny NPC or ally heads and for monster "maiden" variants at 32-px
     scale in `kit.js` `face()`. Effort: S.

8. **Chibi expressions are carried by a big mouth and symbol eyes** (Suima23715 2-head ugoira, Pixiv:
   「うがー！」「涙」「うわぁ…」「じとー」, 10–15 frames at **200 ms**).
   - At 2 heads, the mouth becomes a 3–4 px **bright red-pink block** (open shout, wobbly line).
   - The eyes switch to glyphs: white "> <", white ovals with tear streaks, or flat "じとー" half-lids.
   - The body bobs 1 px on alternate frames to make it "shake".
   - **Tengu:** at the in-game 1x size, `heroine.js` moods should let the mouth carry
     angry, hurt and happy: open-mouth shapes 2–3 lpx tall and a brighter mouth fill. Maidens are near
     this scale. The bible says "brows and mouth only support"; at maiden scale, let the mouth lead.
     Effort: S.

### C. Hair: silhouette and simplification

9. **Rules from a Girls' Frontline fan sprite tutorial** (王子和玉, 「無圖版像素畫教程1：正面二頭身人物頭髮」, Bilibili
   cv10673889, ZH; RPG Maker MV 2-head chibis).
   - Pick the hair base from the reference **slightly light, but not the highlight colour**.
   - Draw the outline of the hair mass first. Treat a complex fringe as one shape (an "inverted onion
     dome") before splitting it.
   - **Don't cover the eyes. Don't cover the brows if the character relies on expression.**
   - The contour stays smooth except where locks split.
   - Temple and cheek locks are **lower-half crescents or sharp triangles**.
   - The classic beginner error is **hair that tucks inward under the skull**, which reads as "a ball
     on a smaller cylinder". Hair must flare out to shoulder width.
   - **Back hair uses a darker colour** so it separates from the front.
   - Ponytails are just "a semicircle in its own colour and shadow".
   - **Accessories get about 8×8 px and are reduced to a glyph:**
     - A hat ribbon becomes one red-brown stripe.
     - A diamond hairclip becomes a "fishbone" or a "wm" shape.
     - A complex clip becomes 2–3 colour spots.
     - He re-placed one hat 3 times and another 5 times.
   - **Tengu:**
     - Check every `HAIR_STYLES` silhouette in `hero.js` and the queens for the inward tuck. Long
       hair should widen below the jaw.
     - Back hair should be one step darker. The bible's sh1 is OK; make sure it is applied to the
       whole back mass.
     - Reduce Tamamo's kanzashi crown (crown, hairpin, flower, beads), which reads as noise at 1x,
       to 2 glyphs.
     - Effort: M.

10. **Hair by deliberate jaggies** (Livresquare, Clip Studio Tips "Creating Pixel Character Art: from
    Sketch to Sprite", EN).
    - Deliberately placed jaggies split the hair into locks and sharpen the silhouette.
    - Shadows get 1–3 colours, and hair highlights are brighter than cloth highlights (hair is more
      reflective).
    - A 2-tone rim along shadow edges suggests subsurface scattering on skin.
    - Line colours are hue-shifted and run along the shadow and highlight borders.
    - **Tengu:** in `queens.js` `lock()`/`clump()`, allow a 1-lpx notch at each clump tip rather than
      smooth tapering everywhere. Effort: S.

11. **Coloured, light-aware outlines are what makes fan sprites look rich** (APO+:
    「光の当たっているトコのアウトラインを明るくすると情報量が増えて豪華になりやすい」, which means "brightening the outline where light
    hits adds information and looks luxurious"; also 「光部分と影部分で色調をずらすとのっぺりしにくい」, which means "shift hue
    between lit and shadow so it isn't flat").
    - Madoka (puzu): maroon outlines on pink, near-black only under the feet.
    - The 163 Lo-Fi tutorial: recolour all pure-black lines to dark brown or dark green with a
      transparency lock.
    - **Tengu:** the maidens in `maidens-faces.png` have a uniform near-black outline about 2 px thick,
      including where hair meets face. That is the main reason they look heavy next to the queens.
      Apply the bible's sel-out task #11 to maidens first. Use 1-lpx outlines (2 only on the bottom
      and back edges), and use the part's own darkened hue. Effort: M.

### D. Idle loops (measured from Pixiv ugoira and artists' breakdowns)

12. **Measured idle timings:**

    | Idle | Frames and timing | Loop | What moves |
    |---|---|---|---|
    | Madoka chibi (puzu) | 4 unique frames at 200 ms | 800 ms, repeated 4× in a 3.2-s file | bob 0/1/2/1 px; one blink frame in the 16; 5×5 sparkles twinkle at new spots every frame |
    | Rumia "neutral motion" (ナタデココ。, Hisoutensoku-style) | 11 frames at 110 ms, one held 130 ms at the arm extreme | 1.23 s | arms sweep; the skirt and the darkness cloud trail |
    | Yagen fighting idle (さわらび) | 9 unique frames at 100 ms, played twice | — | the peak frame is duplicated (a hold); a blink is inserted on the second pass; the ahoge and a red tassel swing most |
    | MUGEN Mononofu stand (木。) | 11 frames alternating 60/70 ms | ≈730 ms | 2-px body bob; the tail and hair ends lag; the weapon tip dips |
    | MUGEN cat-girl OC | 15 frames at 100 ms | — | — |

    - Rule of thumb: **chibi idles use 3–4 frames at 160–200 ms. Heroic or fighter idles use 8–11
      frames at 60–110 ms**, with one held extreme.
    - **Tengu:** queens and maidens use `idle: 6` sampled from a sine (`bosses.js` 1969–1972).
      Use 8 frames for queens, with a per-frame delay table instead of uniform steps (finding 13).
      Maidens can drop to 4 frames at about 180 ms. Effort: M.

13. **Asymmetric timing: settle slowly, drop fast** (Slynyrd Pixelblog 52 "Idle Fighting Stance", EN).
    - 48×92 sprite, 8 frames: frames 1–4 at 100 ms, frames 5–8 at 50 ms (600-ms loop).
    - Joints move by different amounts per frame. Head and torso move 1 px, shoulders and elbows 2 px,
      fists 2–4 px.
    - The head **stays put on the frame where the heels drop**, which is the delayed-face trick.
    - The skirt and hair add their own sub-motion on top of a form-fitting base.
    - Female stance: high heels add 4 px of height; a loose skirt over a tight top.
    - **Tengu:** replace `Math.sin(ph)` bobs in `queens.js` with an eased curve that spends about 65%
      of the time rising and settling and about 35% dropping. Scale the amplitude per part: head 1,
      shoulders 1.5–2, hands 2–3, hem 2. Effort: S.

14. **Hair sway as a wave, offset by layer** (tetotti, note 「ドット絵で髪の毛を揺らそう」, JP; retold on 163.com,
    ZH; アニメ私塾, X; KevinFarias via 163, ZH).
    1. Split the hair into layers: bangs, sideburn A, sideburn B, ponytail.
    2. A 1→5→1 ping-pong looks fake because "forward and return reuse identical frames". Avoid it unless
       the frame budget forces it.
    3. Move the **root first and let the tip follow**, so the bend travels down the lock. Check it as a
       1-colour silhouette.
    4. Then **shift each hair layer ±1 frame** relative to the others. Clothing and tails use the same
       trick.
    - アニメ私塾: **bangs move in small, fast motions and settle quickly; long back hair swings slowly
      and returns slowly.** The period scales with length.
    - Hand-drawn anime research (cited in search): the hair tip traces a **figure-8**.
    - Light-breeze hair: a 4-frame loop with matched ends. A blink is 3 frames (open, half, closed),
      inserted at random.
    - **Tengu:** `hairMotion` in `queens.js` uses one phase lag (`ph - step*(0.5+t)`) for every lock.
      Changes:
      - Add a per-lock phase offset (bangs 0, side locks -1 frame, back or tails -2 frames).
      - Make the frequency depend on length (bangs about 2× the body rate at 30% amplitude).
      - Make the tip path elliptical: x = sin(p), y = 0.35·sin(2p), which gives the figure-8.
      - Effort: M.

15. **The quickest believable idle** (鮫妻丈二, 「世界一雑な講座」, X).
    - Select the hands and feet, and make:
      - frame A: body up 1 px, hands closed in;
      - frame C: body down 1 px, hands spread.
    - Play 1⇄2⇄3 and imagine **squashing a ball**, then fix the details.
    - saint11 (X):
      - 2 frames: down 1 px, arms open, knees bend.
      - 3 frames: the middle frame slows the fall and delays the face.
      - 6 frames: hair lags the head, with many sub-1-px moves.
      - Move the face contents after the silhouette has moved.
      - Pair vertical motion with horizontal motion.
    - Sergio Flores (Habr, RU): upper parts (hair, hat, nose) lag the head. For moves under 1 px,
      shift the shading colours instead of the part.
    - **Tengu:** maidens can use the 3-frame squash idle (Effort S). Shading-shift for sub-pixel
      motion fits our res-3 raster: animate the angel-ring band ±1 real px while the head stays put.

### E. Attacks, specials and smears (game feel)

16. **Player attacks have no anticipation; the strike frame is held longest; recovery overshoots**
    (saint11 "Attack anim tutorial", X).
    - 3 frames for the attack and 4 frames to return to idle.
    - "It's important that there's no anticipation frame or players will feel input lag."
    - Frame 2 (the strike, with a big smear) has the longest hold.
    - Frame 6 is a **bounce that travels further back than frame 1**: an overshoot on recovery.
    - **Tengu:** this matches CLAUDE.md's "hits land on the animation". Set the first `at` of player
      combo strikes in `data/skills.js` at or below about 60 ms, and hold the smear frame for 2–3
      ticks. In the `world/melee.js` recovery, add a 1-frame overshoot pose before idle. Effort: S.

17. **Enemy and boss attacks are the opposite: long anticipation, a 1-frame hit, then follow-through
    and return** (夏森轄, 「攻撃モーションの作り方」, X, 30 fps).

    | Phase | Punch (frames) | Kick (frames) |
    |---|---|---|
    | Idle | 0 | 0 |
    | Anticipation | 1–14 | 1–27 |
    | **Hit** | **15** | **28** |
    | Follow-through | 16–27 | 29–39 |
    | Return | 28–50 | 40–60 |

    - Anticipation coils along the **line of action in the opposite direction** (ためて… さらにためて… 前へ… 突き出す!,
      which means "wind up… wind up more… forward… thrust!").
    - Use action and reaction: push the ground to jump.
    - "Small energy needs little anticipation; big energy needs big anticipation."
    - Design the pose silhouette first; arms inside the body read worse.
    - **Tengu:** queen and boss attacks (`attack: 5` frames) should hold the wind-up pose for 450–900 ms,
      scaled to the damage, as the telegraph. Show the hit pose for 1 frame (about 33 ms) plus hit-stop,
      then follow through over about 400 ms. Effort: M.

18. **The anatomy of a fan-made "limit break"** (■ヒサシ■, Cloud special-move pixel animation, X; I decoded
    about 70 unique frames from the mp4, alternating **120 ms and 80 ms**).
    1. Charge: vertical light streaks rise around the sprite, and a gauge appears above the head.
    2. **One frame where the whole sprite is palette-swapped** to pink or red, then one frame with a
       white and orange glow outline.
    3. **The background dims to a reddish dark for 2 frames.**
    4. A spark burst, a leap, then a spin slash drawn as a **2-tone cyan crescent smear** larger than
       the character.
    5. Impact: **the whole background flips to flat teal-grey for 2 frames**, with a vertical light
       pillar and a yellow spike starburst.
    6. Dust. A sword-twirl recovery back to idle.
    - **Tengu:** this is a ready-made recipe for ultimate skills in `fxkit.js`, `effects.js` and
      `post.js`:
      - a 1-frame sprite palette flash;
      - a 2-frame screen dim on charge;
      - a crescent smear at 2× the sprite height;
      - a 2-frame flat background tint on impact.
      - Effort: M.

19. **Three kinds of smear** (Muscat 「アニメーションの基礎まとめ」, X).
    - The principles: squash and stretch; ease everything; trailing parts lag; big motions overshoot
      and return; and "fast motions need a special trick".
    - That trick, the smear (オバケ), comes in three forms:
      1. **one stretched frame** (the limb or object elongated along the path);
      2. **multiples** (2–3 ghost copies along the path);
      3. an **arc smear** (a filled crescent).
    - Pick one per move.
    - **Tengu:** use multiples for fast jabs and dashes, an arc for swings, and stretch for thrusts and
      lunges. Map this onto the `combo` move types. Effort: S.

20. **What makes hand-drawn fighter sprites feel alive** (Blake Reynolds on SF3 via Siliconera, EN;
    KOF XII producer Kukino via GameSpot, EN; Weilard, 「Галоп пикселя」 3, 5 and 6 on Habr, RU;
    DTF/Different Sense Games, RU).
    - SF3 cloth and muscles **deform every frame** ("works like a whip cracking"). SF3 has 23,039
      frames in total; KOF XII has 400–600 per character.
    - Weilard:
      - Animate secondary parts (sleeves, backpack, hair, headphones) first, then the body.
      - A shape moves at most 1–2 px per frame.
      - Strap and hem edges move **in counter-phase**.
      - Highlights keep their shape but change saturation, which avoids flicker.
      - Shadows shift at most 1 px between frames.
    - DTF:
      - A 10-frame run (smoother than 8, cheaper than 16).
      - The backpack lags the body by 1 frame.
      - The sword keeps travelling several frames after impact.
      - The character "slips" a few px on landing to soften the stop.
    - **Tengu:** for queen walk cycles (q1 frames look near-identical): every frame should change the
      hem and sleeve silhouette, not only the position. Add counter-phase to the hem and the sleeve.
      Effort: M.

## 3. Compared with our sprites: specific upgrades, in priority order

1. **Eye–hair hue contrast** (finding 6). Tamamo's eyes become jade or vermilion-lined, Sylvana's rose
   or violet, and Tamamo's hair becomes saturated gold. This is the fastest readability gain in
   `queens-hair-ingame.png`, where Tamamo is still a cream blob. Effort: S.
2. **Maiden outlines**: 1-lpx coloured sel-out instead of the near-black ring of about 2 px (finding 11).
   Effort: M.
3. **Eye shading details**: blue-shadowed sclera top, an iris lightest at the bottom, a lash streak in
   the lash hue (finding 5). Effort: S.
4. **Hair motion**: per-layer frame offsets, length-dependent frequency, a figure-8 tip path, and no
   symmetric ping-pong (finding 14). Use an asymmetric bob (finding 13) and 8 idle frames with one hold
   for queens, 4 frames at about 180 ms for maidens (finding 12). Effort: M.
5. **Accessory glyphs**: reduce Tamamo's crown and pins and Lilith's tiara to 2–3 glyph shapes of about
   8 lpx; check the inward hair tuck (finding 9). Effort: M.
6. **Chibi expression mouths** at maiden scale: bigger, brighter open mouths (finding 8). Effort: S.
7. **Attack timing split**: the player gets no anticipation and a held smear frame; bosses get a long
   wind-up, a 1-frame hit and follow-through (findings 16–17). Add the ultimate-skill recipe
   (finding 18) and choose smear types (finding 19). Effort: M.

## 4. Reference list

**Japanese**
- APO+, 「キャラドットの作り方講座」, Miku 46-px sprite, 4 steps plus outline and eye tips: https://x.com/APO_PLUS_/status/1985345063887757616
- 春疾風, 「16色でドット絵メイキング」, 16-colour character and weapon, eyes first, colour reuse: https://www.pixiv.net/artworks/3348001
- honöca*, 「自己流ドット絵目イキング」, 5-step eye with 6–7 colours: https://www.pixiv.net/artworks/97303776
- 妖北狐鷹, fox-girl retry process (rough, line, flats, AA), the complementary-iris example: https://www.pixiv.net/artworks/150767659
- Nippon Ichi, Classic Dungeon X3 ドット絵講座 (beginner and intermediate), tiny-head eye glyph, bang shadow, ring: https://x.com/nis_prinny/status/1894583415233487164 and https://nippon1.jp/consumer/classicdungeon_x3/topics/pixel_art_lessons/?c=intermediate
- 鮫妻丈二, 3-frame squash idle, Golden Kamuy fan sprite: https://x.com/sameduma/status/995381539318915072
- tetotti, 「ドット絵で髪の毛を揺らそう」, layered, root-first, ±1-frame hair: https://note.com/tetotti/n/n2ed27b7af8e3
- アニメ私塾, bangs fast and short, back hair slow: https://x.com/animesijyuku/status/981400632182657025
- Muscat, animation basics plus 3 smear types: https://x.com/muscat_dot/status/1387378045934137354
- 夏森轄, punch and kick frame tables at 30 fps, line of action, action and reaction: https://x.com/natsumori_katsu/status/1496061323553415168
- ■ヒサシ■, Cloud special move, charge, flash, impact tint: https://x.com/sikakui_hisashi/status/2084280942210973813
- Pixiv ugoira, measured idles: Madoka https://www.pixiv.net/artworks/108488935 · Rumia https://www.pixiv.net/artworks/76117565 · Yagen https://www.pixiv.net/artworks/93365684 · MUGEN Mononofu https://www.pixiv.net/artworks/83754988 · MUGEN OC https://www.pixiv.net/artworks/92596003 · Suima 2-head expressions https://www.pixiv.net/artworks/150324191, https://www.pixiv.net/artworks/150525919
- Pixivision ドット絵 講座 roundup (list of 14 Pixiv tutorials, including itchy's eye-blink making-of): https://www.pixivision.net/ja/a/1629
- J-CAST, 山下諒 (Pop Team Epic game part): 16×16, about 3 colours, 2-frame walk: https://www.j-cast.com/trend/2019/12/20375600.html
- 1cc Scrapbox (JP/ZH), simplification and silhouette first, grayscale-first, line step rules: https://scrapbox.io/1cc/%E6%96%B0%E6%89%8B%E5%85%A5%E9%96%80(%E5%83%8F%E7%B4%A0%E7%95%AB)

**Korean**
- Ruliweb, Blue Archive Yuuka 50×80 with a 50×50 2-head template, full part order: https://bbs.ruliweb.com/community/board/300781/read/57546590
- dcinside 메이플 미니갤, Maple face-dot lecture (LD eye size on SD proportions): https://gall.dcinside.com/mini/board/view/?id=maple&no=23410
- Postype 김펠리, CSP dot illustration, half-line nudging to soften or sharpen eyes: https://www.postype.com/en/@pellyk03/post/18893574
- Postype sodacommission, commission norms: idle, walk and blink at 5–10 frames; 11–25 for smoother: https://www.postype.com/@sodacommission/post/19289051

**Chinese**
- 王子和玉, Girls' Frontline 2-head hair and accessory rules: https://www.bilibili.com/read/cv10673889
- 教你画像素画 (163), tetotti hair sway, and KevinFarias Lo-Fi (4-frame hair, 3-frame blink): https://c.m.163.com/news/a/L5RIK12A0526K8VB.html and https://c.m.163.com/news/a/KN0HTEUT0526K8VB.html
- GameRes, Mario animation breakdown (2-frame loops, 1-frame squash): https://www.gameres.com/862023.html

**Russian**
- Weilard, 「Галоп пикселя」 parts 3, 5 and 6 (idle, walk, run; secondary first; 1–2 px rule): https://habr.com/ru/articles/275703/ · https://habr.com/ru/articles/441562/ · https://habr.com/ru/articles/772588/
- Sergio Flores, translated on Habr, draft to game asset (3 tones, lag, sub-pixel shading shift): https://habr.com/ru/articles/444738/
- Different Sense Games (DTF), 10-frame run, lagging backpack, attack slip: https://dtf.ru/294631-sozdanie-piksel-art-animacii

**English**
- Slynyrd Pixelblog 52, idle fighting stance with per-joint px and 100/50 ms: https://slynyrd.com/blog/2024/9/26/pixelblog-52-idle-fighting-stance
- Slynyrd Pixelblog 29, anime faces and hair (flow lines from the cowlick): https://slynyrd.com/blog/2020/7/28/pixelblog-29-anime-faces-and-hair
- saint11, idle and attack tutorials: https://x.com/saint11/status/882228769230073858 · https://x.com/saint11/status/779430773858369536 · https://x.com/saint11/status/1015692437405265922
- Rappenem, anime eye sprite and palette: https://x.com/Rappenem/status/1857481769479491853
- pixnote, size-to-detail table, outlines, walk timing of 100–150 ms: https://pixnote.net/en/learn/character/
- Livresquare (Clip Studio Tips), sketch to sprite, deliberate jaggies on hair: https://tips.clip-studio.com/en-us/articles/11408
- Tsugumi, "So You Want To Be A Pixel Artist?" ch. 9, fighter sprites (about 100-px standard, mouth and nose in darker skin, not black): https://web.cs.wpi.edu/~claypool/courses/frontiers-06/samples/pixel-artist/chapter9.htm
- Mugen Free For All, how to make sprites (localcoord 320/640/1280, body-part vs frame-by-frame): https://mugenfreeforall.com/topic/12095-how-to-make-sprites/
- Siliconera, Blake Reynolds on SF3 vs SF4 animation: https://www.siliconera.com/artist-explains-why-street-fighter-iiis-animations-are-better-than-street-fighter-ivs/
- GameSpot, KOF XII hand-drawn, 400–600 frames per character: https://www.gamespot.com/articles/king-of-fighters-xii-knuckles-up-next-year/1100-6197909/
- Lospec "face" tutorial tag (st0ven fighter faces, male and female; archived, unreachable from here): https://lospec.com/pixel-art-tutorials/tags/face

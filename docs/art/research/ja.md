# Japanese-language research: pixel art, animation, effects, game feel, backgrounds, UI

Researcher: JA sources. All findings are translated into English. Each one names the source, its language (JA), the game or artist where there is one, where it applies in Tengu, and an effort estimate (S/M/L).

## 1. Engines and queries that worked

- **WebSearch (US index), restricted to JA domains**, was by far the most productive route. The domains were note.com, hatenablog.com/.jp, qiita.com, zenn.dev, pixelartlab.net, dotartplay.com, tips.clip-studio.com, clipstudio.net, 4gamer.net, automaton-media.com, gamebiz.jp, news.denfaminicogamer.jp and famitsu.com. Native queries that worked: ドット絵 歩行アニメーション 何フレーム, ドット絵 エフェクト 描き方 コツ, ヒットストップ 何フレーム 実装, ドット絵 アンチエイリアス ジャギー, ドット絵 背景 描き方 木 草 岩, ドット絵 配色 色相 ずらし, 画面揺れ 減衰, ダメージ数字 ポップアップ, ちびキャラ 2頭身, ドッター 対談, and game names plus インタビュー.
- **Bing (WebFetch on bing.com/search)** returned one good page of JA results (ドット絵 歩行アニメーション). Every later query came back as unrelated junk (weather, jobs, COVID), whether encoded or not, so Bing is unreliable through the proxy.
- **Yahoo! JAPAN** returned "0 件" for every query; its results are probably blocked or rendered by JS. **DuckDuckGo** showed a bot captcha. **Google** showed an error page. None of the three is usable.
- Gaps: CEDEC/CEDiL slide PDFs and Sakurai's YouTube episodes can't be fetched, so I used written summaries of them on note.com. JA sources specific to Metal Slug, SF3, SOTN and Pokémon are almost all interviews with little technique; the best game-specific material is listed below.
- Quality note: pixelartlab.net is dense with numbers but looks partly machine-written. Its numbers are presented below as rules of thumb, and where possible I checked them against artist-written note.com and hatena posts.

## 2. Top findings

### A. Character, monster and boss sprite art

**1. Hue-shifted ramps, no pure greys, raised saturation at small sizes.**
Hair example: highlight yellow-green → base blue-green → shadow light-blue. Browns run from yellow-orange to red. Never use pure white, black or grey; shadow a white garment with beige, lavender or pink. A low-saturation, low-contrast sprite "disappears" at small display sizes, so raise both.
Aseprite's gradient tool steps colours linearly and greys them out, so retune ramps by hand.
Source: 有織はべり "ドット絵と色について" https://note.com/ari_ori/n/nba020af67bab (JA, working pixel artist).
Tengu: the cel ramps in `src/render/pixel.js` and `kit.js`. Audit every ramp for a neutral grey step (stone, silver, white kimono) and give it a hue. Pairs with the art-bible complaint about Tamamo's cream-on-cream. **S**

**2. Keep palettes economical: per material, 1 base plus 1–2 shadows, and about 16–24 colours per sprite.**
Shrink the rough to 64×64 at about 3 heads tall, with a bigger head and stronger deformation so features survive. The outline is retraced in a darker tone of the local colour, not black. AA goes only on the most visible stair-steps, never between every shadow band, because that makes the gradient "fussy".
Source: 九城真 64×64 making-of https://note.com/nine_castle/n/n235f9d83ccc8 (JA).
FF veteran Kazuko Shibuya (FF1–6, Pixel Remaster) adds three more points. She capped 48×48 sprites at about 32 colours. She builds volume by progressively darkening shadow masses rather than adding highlights or gradients. Her core rule is that limb lengths and proportions stay identical across every pose and frame; when a pose fails she erases the whole region and redraws it, and removes armour to check joints. https://www.4gamer.net/games/064/G006480/20130227073/index_3.html (JA, Final Fantasy).
Tengu: hero, heroine and mob shape code. Add a test or lint that counts unique colours per rasterised sprite (cap about 24). Check the proportions of shoulder, hip and limb lengths across animation frames. **S–M**

**3. Small-sprite face economy.**
At 32 px: eyes about 2 px wide, mouth 1–2 px, nose omitted or 1 px, brow 1 px. Express character by the spacing and height of eyes, brows and mouth rather than by eye detail. Nudge each 1 px and compare. Hair is summarised as 2–3 clumps (fringe, side, back). Highlights go only on the apex of a form, at 1–2 px (hair crown, cheek, top of the shoulder). The shadow is 1 px on the lower-right edge.
Outline: don't wrap the whole sprite in a dark line. Put the dark 1 px only where parts meet, and keep diagonal steps at a 2-1-2 rhythm with one mid-tone px at harsh corners.
Sources: https://pixelartlab.net/tutorials/dot-e-character-kakikata (JA). 九城真 (above) notes that eyes read with just 1–2 px at higher proportions.
Tengu: confirms the art bible's "4–6 clusters per eye" rule. For mobs, `face()` in `kit.js` should vary eye spacing and height per species; spacing, not extra detail, gives each species its look. **S**

**4. Chibi (2–2.5 頭身) construction.**
- Put the facial features below the head's centre to get a big forehead and a baby look.
- Enlarge the eyes even if the source design has narrow eyes.
- Head to body is about 1:1 at 2 頭身. The body is an "A" or trapezoid silhouette; hands and feet are short and plump (round or trapezoid).
- Drop small details (laces, prints) and *enlarge* accent props (hats, ribbons) to balance the big head.
- Give a slight twist or bent limbs even when idle, so the silhouette reads.
- 2.5 頭身 adds limb length for posing; it is the "goods" standard.
Source: CLIP STUDIO 公式 https://www.clipstudio.net/oekaki/archives/153412 (JA).
Tengu: hero and NPC figure proportions in `figure.js` and `hero.js`. Check the eye line sits below head-centre and accessories are oversized. **S**

**5. Designing chibi monsters (デフォルメ系モンスター).**
1. Fix the deformation level by two numbers: 頭身, and the size of limbs and face parts.
2. Build on a real-animal skeleton. Bipeds are human-type; quadrupeds are reptile- or dog-type, with joints bending the right way.
3. Exaggerate the one or two parts that define the species and shrink or simplify the rest.
4. Check that the face still reads at thumbnail size (zoom out).
5. Decide the "見せ所" (selling point) before adding ornaments, because ornaments blur it.
Source: https://www.clipstudio.net/oekaki/archives/151178 (JA).
Tengu: `mobs/meadow.js`, `wilds.js`, `ruins.js`. This answers the art bible's "every monster has the same face": give each species one exaggerated signature part (tusk, ear, shell, horn) and its own eye placement. **M**

**6. Bosses: big readable gestures over pixel detail; part-based construction; let the background carry the bulk.**
- Pro dotters (Nippon Ichi / Disgaea, FFBE) say that on large sprites, animator-style overall motion matters more than per-dot polish. Some artists draw on paper, trace and then pixel.
- One artist owns a character's sprite *and* its effects, so the style stays consistent.
- Every frame is cleaned up, because any frame can be screenshotted.
- In Exdeath's FFBE motion, "forcefulness comes from pacing and frame-skipping, not smoothness".
- The Warrior of Light glows whole-body on repetitive motions to keep them interesting.
Source: 電ファミ ドッター対談 p2–3 https://news.denfaminicogamer.jp/kikakuthetower/dotter-taidan/3 (JA; Disgaea, FFBE, KOF).
- R-TYPE / Metal Slug dotter AKIO (Irem → Nasca) blacked out the background so VRAM could hold the stage-1 boss Dobkeradops. The giant boss is effectively a background layer with only its hit parts acting as a character. https://www.famitsu.com/news/202008/03202933.html (JA).
Tengu: `mobs/bosses.js`, `queens.js`. When a boss enters, dim the parallax layers in `post.js` and treat the boss's huge non-interactive body as a scenery layer, with only the arm or head sprites animated. Give boss attacks big pose changes with held keys rather than many small frames. **M**

**7. Anti-aliasing and clean lines.**
- Bright dots look expanded and dark dots look contracted. Use this to adjust apparent thickness without changing the shape: shave protruding corners with a darker dot, and round with a brighter dot.
- Do NOT anti-alias elbows, knees and other points you want sharp.
- AA everywhere makes the sprite "モコモコ" (fuzzy/puffy).
Source: picopico256 "ドット絵の作画について(アンチエイリアス①)" https://note.com/picopico68000/n/na929e6dff9a8 (JA, ex-pro dotter).
- Pixel-perfect lines have no L-shaped doubles; keep only diagonal-adjacent pixels. Straight slopes use a constant run length (shift one row every n px). Curves use decreasing runs, e.g. 3-2-2-1.
- Outline colour = a darker version of the local hue. Never use an outline brighter than the fill. Drop the outline where you want the eye to rest: eyes and brows.
Sources: モケモ #5 https://note.com/mokemo/n/n974d4e4edfca (JA). らぎメモ (1) https://asragi.hatenablog.com/entry/2019/12/07/035646 (JA).
Tengu: the outline pass in `pixel.js`. Make the outline darkening skip "sharp" anchor points (joints, horn tips), or apply a lighter AA only on convex curves. Inner lines should take a darker local hue. **M**

**8. Sub-pixel motion with mid-tones (半ドットずらし).**
Old pixel art fakes motion smaller than 1 px by shifting the mid-tone on the edge instead of the shape. The pro dotters note this works for slow motion (breathing, bobbing) but is weak for fast action, where posing and timing matter more.
Sources: 電ファミ ドッター対談 (above, JA); picopico256 (half-dot animated example).
Tengu: at res 3 we already have sub-pixels (1 lpx = 3 real px). Snap idle bob to 1/3 lpx steps so breathing reads as a 1-real-px change, not a 3-px jump. **S**

### B. Animation

**9. Walk cycle numbers.**
- 4-frame side walk: L-forward → passing → R-forward → passing. The head is 1 px higher on the passing frames.
- 8-frame walk: contact → down (head −1 px) → passing → up (head +1 px), then the mirror.
- The total vertical range is at most 2 px; above that it "暴れる" (thrashes).
- Played at about 12 fps with keys held 2 frames, i.e. about 83 ms/frame. An all-frames delay of 33 ms looks like a run; about 100 ms reads as a walk.
- Shift a few hair-highlight pixels per frame to suggest wind. The arm on the near side is drawn darker to show depth.
Sources: DOT ART PLAY https://dotartplay.com/dot-animation-walk/ (JA). pixelartlab https://pixelartlab.net/game-dev/article-7b57 (JA).
Tengu: `animator.js` and `hero.js`. Check that walk bob is 1 lpx with 2 lpx max, and that the frame hold is about 83–100 ms. This also answers the art bible's "Tamamo slides" issue: make sure the contact and down frames differ visibly. **S**

**10. Idle "breathing" by offsetting parts out of phase (らぎメモ (3)).**
Split the sprite into head, upper body, arms and waist. Grounded feet never move. Example 6-frame schedule:

| Frame | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Head | low | low | mid | high | high | mid |
| Torso | high | mid | low | low | mid | high |

Apply a similar offset to every part except planted legs. Long hair and skirts lag further. Check every frame for detached arms.
Source: https://asragi.hatenablog.com/entry/2019/12/07/071504 (JA).
Supporting sources:
- pixelartlab: 4-frame idle base → +1 px → base → −1 px. Hair tips and hems lag by 1 px; 2 px "thrashes". Hold the pose you want seen longer, with uneven holds such as 1:1:2:1. https://pixelartlab.net/tutorials/dot-anime-tsukurikata (JA).
- Nippon Ichi's Ikeda animates breathing by changing about 3 shadow tones between frames (muscle tension) instead of shifting pixels (ドッター対談 p2).
- 3DCG idle workflow: delay the waist, then the chest, then the head. https://note.com/bbds_blog/n/neef5d7374b96 (JA).
Tengu: `animator.js` idle. Drive the head and torso offsets with a phase difference of about 1/3 cycle and hair or tails with a further lag. Add uneven hold ratios. **S–M**

**11. Spacing for attacks: frames bunch near the anticipation, not at the midpoint (らぎメモ (4), ちもん).**
- Equal spacing between start and end kills speed. Example allocation: 3 frames to start moving, 1 frame for the travel, 2 frames after.
- Draw afterimages (オバケ) on the travel frame.
- Overshoot: the frame before the stop goes slightly *past* the target, then settles back (もどし).
- Recovery takes about as many frames as the wind-up.
- Fighting-game structure is idle → かまえ (wind-up) → attack → follow-through → idle. Add one extra frame between wind-up and attack that is *almost identical to the wind-up* (knee shifted about 2 px). A frame near the wind-up gives acceleration; a midpoint frame gives constant speed.
- dotartplay: GIF attack = stand → ready (hold slightly longer) → draw → swing with slash (shorter) → swing without slash, with hair trailing on the draw and swing frames. Canvas 64 px for a 32 px body to fit the weapon and fx.
Sources: https://asragi.hatenablog.com/entry/2019/12/07/082733, https://note.com/stibium/n/n69992413d002, https://dotartplay.com/dot-animation-action-attack (all JA).
Tengu: `data/skills.js` combo steps and `world/melee.js`. Strike `at` times should sit late in the step, after a long wind-up, with one near-duplicate anticipation pose and a 1-frame overshoot pose. Draw the smear on the single travel frame (`strikes.js`). Recovery length ≈ wind-up length, consistent with `skillReadyAt`. **M**

**12. Part-based 2D animation rules from a CEDEC 2016 talk (追憶の青, 2D action RPG). Relevant to Vanillaware-style cutout.**
- Animation authored at 30 fps for a 60 fps game.
- About 40 parts per character: 17 body parts and 19 sway parts (hair, cloth).
- Pivots must survive horizontal flipping.
- Ankles are unlinked from the leg chain, so feet stay planted while the body re-poses.
- Cape flutter = swap the upper and lower cape images at offset timings.
- Pin feet to an imagined floor line ("mime wall"); sliding feet kill grounding.
- Strong actions get holds at the top and bottom of the swing, with uneven speed.
- After a downswing the foot leaves the ground *later*, which reads as weight. Raised shoulders = tension, lowered = relaxed.
- The forward lean uses a rhombus deformation of the chest so the torso doesn't look twisted. The head angle follows the gaze, not the torso.
- Impact poses use a wide stance to exaggerate the horizontal silhouette.
Source: https://gamebiz.jp/news/168358 (JA).
Tengu: `figure.js`, `animator.js` and `moves.js` are already part-based. Adopt the foot-lock, the "late foot lift after heavy swing", wide-stance impact frames and offset-timed cape or tail segments. **M**

**13. Octopath Traveler (HD-2D), from the Unreal Fest East 2018 talk.**
- About 350 sprite images per character, plus 12 job sets. Animation breakage was fixed by hand, frame by frame.
- Characters are dynamic light sources and the pixel sprites respond to lights.
- Lens flare and ambient fill keep building shadows from going pure black.
- Big attacks light the character *from directly below*.
- Breaking an enemy's guard triggers slow motion.
- The camera sways gently while waiting for commands and locks during key moments.
- Moving indoors doubles prop scale, hidden by a door sound and a cross-fade of the light.
Source: https://automaton-media.com/devlog/report/20181023-78326 (JA).
Tengu: `post.js` and `spells.js`. Add an under-lighting flash (a warm gradient from the feet up) on big skills, and slow motion on boss break or stagger. Never let shadow overlays reach pure black: lift them with ambient colour. **S–M**

**14. Guilty Gear Xrd (Arc System Works), from the Bantan / Famitsu talk report.**
- Limited animation with fewer drawings, simplification and exaggeration.
- Each frame was hand-tweaked (limb thickness, length, hair sway) to imitate hand-drawn jitter.
- Rigs stretch a punching arm or bend a kicking leg. Near-camera parts are enlarged, far parts made thinner and longer, for impact.
- Backgrounds are lit from one side, with shadow colours tuned separately and lit areas shifted toward the lamp colour.
Source: https://www.famitsu.com/news/201508/27087024.html (JA).
Tengu: in strikes, scale the striking limb or weapon up 10–20% on the active frame (a fake perspective "smear"). Use held frames (2s and 3s) rather than tweening every frame. **S**

### C. Effects

**15. KOF-style effects: every pixel of a flame is a flame fragment (pro dotters).**
- No extra colours.
- Each spark or ember is placed so every frame reads as a clean, stylish pose on its own; silhouette drives the animation.
- Smoke puff under the feet: about 2 drawn frames, faded by lowering opacity while sliding sideways.
- Studios keep effect libraries; crescent slash and shooter explosions are reused across games.
Source: 電ファミ ドッター対談 p3 (JA; KOF, Neo Geo).
Tengu: `particles.js` and `fxkit.js`. Replace round soft particles with hard-edged shard and teardrop "flame fragment" polygons from a 3–4 colour ramp. Build a shared slash-crescent and dust-puff library and reuse it across jobs. **M**

**16. Effect shape grammar: expand → diffuse → fade, in 3–6 frames, starting small then jumping big.**
- Pixel effects follow expand → diffuse → fade. The first frame is small, the next is big (a pop). 3–6 frames is enough; attack fx run at 15–24 fps versus 8–12 fps for characters.
- Fire: only the tips flicker fast and the root stays.
- Smoke: shift blob positions and bites rather than redrawing the outline.
- Water: horizontal flow and rebound.
- Cloth: lag between anchor and tip.
- A detached flame shrinks and dies over a few frames.
Sources: pixelartlab https://pixelartlab.net/tutorials/dot-anime-tsukurikata. CLIP STUDIO fire guide https://tips.clip-studio.com/ja-jp/articles/8114 (JA).
Tengu: the impact sprite generators in `effects.js` and `strikes.js`. Use a 1-frame tiny core, then a 2.5× jump, then ring diffusion, then dither-fade. Run fx timers at about 20 fps stepped (quantised), not smooth, so they read as hand-animated. **S–M**

**17. Effect colour semantics and core structure.**
- Energy glows brightest at the centre and weakens outward, so the core is white-hot and the hue lives on the rim.
- Red/orange = heat, explosion. Blue/white = calm, ice. Yellow = lightning and speed; purple = lightning and tension. Green or purple = poison, curse. Gold and white = holy.
- Brighten the dangerous part, e.g. the leading edge of a slash.
- Additive-only effects white out on bright backgrounds. Mix additive with a multiply or dark rim so effects read on bright maps too; Paper Dash World and Black Beard both hit this problem.
Sources: taka https://note.com/natty_violet4982/n/nae03c88093aa. Black Beard Design Studio https://note.com/bbds_blog/n/n54d89f19b12e. Summary at https://zenn.dev/nakaigames/articles/884f0e622aaa67 (JA).
Tengu: `spells.js` and `fxkit.js` on pastel, bright maps (meadow, sky). Give every additive effect a dark or saturated outer rim drawn in normal blend so it doesn't vanish on light backgrounds. Make element colours consistent across all jobs. **S**

**18. Nintendo's three jobs of an effect.**
1. Improve impact and feel (手応え).
2. Make what is happening easy to understand.
3. Liven the screen.
Nintendo says (1) and (2) are as important as (3). Example: BotW's ring effect while an enemy beam charges is the telegraph.
Source: https://www.nintendo.co.jp/jobs/introduction/design/work04.html (JA; Zelda BotW, Mario Kart World, DK Bananza).
Tengu: boss attack telegraphs in `bosses.js` and `effects.js`. Every boss wind-up needs a readable charge ring or glow during its anticipation, not only a hit flash. **S**

**19. Procedural pixel explosion and fireball (rn.log Shader Graph notes).**
- d = distance from centre; ripple = d − t·4 (time ×4).
- step() gives a hard ring, multiplied by a colour gradient and by (1 − d) to fade outward.
- The UV is posterised to a 24×24 grid, so the explosion is natively "pixel" at any scale.
- Leave a gap before the next playback.
Source: https://r-ngtm.hatenablog.com/entry/2018/12/22/141101 (fireball: /141101 → /154344) (JA).
Tengu: `fxkit.js`. Write a `pixelRing(ctx, t)` that quantises radius and angle to the lpx grid (grid = sprite res), giving crisp stepped rings instead of anti-aliased canvas arcs. Use it for explosions, shockwaves and level-up. **M**

**20. Damage presentation layering (森田, pixel hit-reaction study).**
The study builds up in this order:
1. Knockback alone does not read as damage; a pose change is needed.
2. Add a hurt pose per hit.
3. Add a red tint.
4. Time the reaction to each blow.
5. Add a hit spark.
6. Hit-stop: hold the hurt pose longer.
7. Blur the head on a kick.
8. Onomatopoeia text, sized by volume.
9. Negative/positive inversion on the 3rd hit, to read as the fatal blow.
10. Darken the background so effects pop.
11. White-out on the KO.
Source: https://note.com/ixill_morita/n/n9d897a204446 (JA).
Tengu: in `effects.js`, `post.js` and the damage numbers, add a 1–2 frame colour inversion or white flash on finishers and boss kills, and a background dim during boss ultimates. Mob death could use a white-out flash. An optional "onomatopoeia" pop (pastel kana or katakana-style glyphs) fits the chibi tone. **S–M**

### D. Game feel (手触り / 打撃感)

**21. Hit-stop magnitudes from JA sources.**

| Source | Value | Notes |
|---|---|---|
| IEICE study (3DCG action) | 0.1–0.2 s hit-stop; 0.2–0.4 s slow-motion | For attacks that launch an enemy off screen |
| SF5 analysis | Medium attacks ≈ 12F (0.2 s) | |
| Tetris analysis | 1 line ≈ 2F, 4 lines = 4F | Too much stop "snags" expert play |

Rule from the same sources: stronger = longer.
Sources: https://ken.ieice.org/ken/paper/20230315OCSt/eng/. https://note.com/takahata88/n/n409203c5976a. https://note.com/ohs40074/n/n9b8389e17ee4. https://note.com/plus00/n/n8415e6e80142 (JA).
Tengu: today `melee.js` uses 0.035 (light), 0.07 (finisher) and 0.3 (boss kill) in `world.js`. Light hits are fine for a fast MMO-like game, but finishers could go to about 0.10–0.12 s. A launch or KO could add a 0.2–0.3 s slow-motion tail after the stop instead of a longer freeze. **S**

**22. Sakurai (Kirby, Smash): ボスストップ and layered presets.**
- Hit-stop belongs in every genre, not only on hits; e.g. Fantasy Zone freezes when you're shot, so the player sees *what* hit them.
- "Boss stop" (Kirby's Adventure on), coined by Sakurai: on a boss kill, flash the screen *and* stop.
- Four presets stack up: none → stop → stop + vibration → stop + vibration + slow motion.
- Ending a short slow-motion right away makes it even better.
Sources: Sakurai's video summarised at https://note.com/rr_r612/n/nbc165f80899e and https://note.com/matchima2/n/n435a2b0f151f (JA).
Tengu: add a short freeze plus flash when the *player* takes a big hit (also readability). Use the 4-tier escalation for skill tiers: light = stop, finisher = stop + shake, boss kill = stop + shake + slow-mo plus white flash. **S**

**23. Shake the victim, not just the camera, during hit-stop (Smash-style).**
- Qiita Smash recreation: the victim jitters randomly within ±0.5 units every frame for the full freeze (15 frames). The attacker or projectile jitters ±0.05 for only the first third. Then the victim launches with ease-out-circ.
- A second Qiita post freezes the attacker's animator at 0.23 s. The enemy shakes (strength 0.15, vibrato 25) instead of knockback, then moves back 1 unit over 0.2 s. The damage clip starts at 20% so the freeze lands on the strongest recoil pose. The hit fx is fast-forwarded 0.2 s so it is already "open" on frame 1.
Sources: https://qiita.com/atto_seconds/items/6d3daefab3671a940681. https://qiita.com/flankids/items/75dd457463918f48b70f (JA).
Tengu: in `world.js` and `melee.js`, during `world.hitstop` jitter the struck mob's draw offset by ±1 lpx (±2 on finishers) every frame. Jitter the attacker for the first third only. Freeze mobs on their hurt pose (the most recoiled frame), not the pre-hit pose. Spawn hit sparks at their 2nd frame. **S**

**24. Damage reaction palette (Qiita flankids).**

| Reaction | Parameters |
|---|---|
| Blink | 0.07 s × 2 loops |
| Red multiply | white→red 0.1 s, back 0.1 s |
| White additive flash | 0.1 s in, 0.1 s out |
| Scale pulse | 1.05× over 0.07 s and back |
| Waist bone tilt | Up to 10° toward the hit, 0.1 s in, 0.2 s return |

Source: https://qiita.com/flankids/items/7fee77ed6f5e1b71d2be (JA).
Tengu: mob hurt rendering. Use a white additive flash (we draw sprites, so white-fill the silhouette for 1–2 frames) plus a 10° lean away from the hit and a 1.05 scale pop for crits. **S**

**25. Screen shake shape.**
- "Trauma" model: impacts add trauma, which decays every frame, and offset ∝ trauma², so small shakes stay quiet and big ones dominate.
- Sine shake with an exponential envelope (a high exponent ends abruptly).
- Rotation shake is preferred over position shake in 3D.
- Too much causes 3D sickness, so scale shake to the impact: small for mobs, big for bosses.
Sources: https://qiita.com/itsakeyfut/items/96718d988bd0966f4507. https://zenn.dev/landho_roblox/articles/1b909eb46eb794. https://note.com/ohs40074/n/n9b8389e17ee4 (JA).
Tengu: the shake in `main.js` and `world.js`. Switch to trauma² with decay, so stacked light hits don't add up to nausea. **S**

### E. Backgrounds, tiles, parallax

**26. Background numbers (pixelartlab).**
- Design at 320×180, 426×240 or 640×360. That matches our 640×360.
- 8–16 colour palette.
- Sky in 3 bands with 1 px diagonal dither at the boundaries, 2 columns wide. At 426 wide use 4–5 sky steps, with uneven horizontal streaks every 3–6 px near the horizon.
- Clouds 14–20 × 6–10 px: 2–3 px of light on top, 1 px of shadow underneath.
- Trees by depth:

| Depth | Trunk | Foliage |
|---|---|---|
| Near | 3–4 px wide | 3–4 clumps of 8–12 px |
| Mid | | 5–7 px ovals, 2 tones |
| Far | 1 px dark line | Single-colour silhouette |

- Windows 3×3 with a 1 px frame and 2 px spacing.
- Distance lowers saturation, contrast and outline strength (far outlines take the background colour).
- When characters are the subject, drop the background highlight one step.
- Parallax speeds: sky 10–20%, far 20–40%, mid 60–80%, foreground 100–120%. Start with 2–3 layers.
- Loop seams: 8–16 px bridge bands with one variation point per loop.
Source: https://pixelartlab.net/tutorials/dot-e-haikei-kakikata (JA).
Tengu: `scenery.js` and `terrain.js`. Audit layer speeds and make far outlines take the background colour. Drop background highlights one step (a direct fix for "characters don't pop"). **S–M**

**27. Tree and foliage method (siba.).**
- 64×64, upper-left light, 5 browns + 5 greens, no pure primaries: add green to the browns and red to the greens.
- Block the canopy as a dark cone, then add light per clump in a single direction.
- Overlap shadows in a "scale" pattern so they read as leaves, with a bumpy bottom edge.
- Leaf tips are sharp wedges with a 2-step colour jump (no gradient).
- Trunk grain is vertical lines; roots use diagonal hard edges.
- Final pass: increase contrast, push the leaves slightly redder and the trunk toward yellow.
- Check at 1:1 and on white.
Source: https://note.com/siba_dot/n/nea7deb9677bd (JA).
Supporting: grass is drawn as clumps with gaps, not single blades. Rocks are faceted into planes with 3 tones, not rounded. Cracks are dark with a light lip. Tiles should place clumps unevenly. https://pixelartlab.net/tutorials/pixel-art-nature-trees-grass and https://pixelartlab.net/tutorials/how-to-draw-grass-field (JA).
Tengu: tree and rock prop generators in `scenery.js` (new-woods). Use scale-pattern shadow clusters, sharp 2-step leaf tips and faceted rocks. **M**

**28. Lighting: no pure-black shadows, single-side light, tinted lit areas.**
- Octopath adds ambient fill and lens flare so shadows don't crush.
- Guilty Gear Xrd lights backgrounds from one side; lit areas shift toward the lamp colour and shadow colour is tuned separately.
- 夏天's background making-of: back-to-front order (sky gradient → clouds, grass, road → mid objects → characters). Each object is done flat → shadow → light → recolour the line art to local colour. A yellow-green screen layer goes behind the characters as a backlight and a multiply layer over the foreground plants.
Sources: (13), (14), https://note.com/chic_oxalis3897/n/n67acea47219c (JA).
Tengu: `post.js`. Add a foreground-plant multiply darkening and a screen "rim backlight" layer between the background and characters. That layer separates characters from busy pastel backgrounds. **S**

### F. UI, icons, fonts

**29. Japanese pixel fonts that fit the 640×360 grid.**
- DotGothic16 (Fontworks) is on Google Fonts, which our page contract allows. It is based on a 16×16 bitmap gothic and covers JP, Latin and Cyrillic.
- PixelMplus10/12 are M+-licensed, free to modify and redistribute: 10 px for kana and Latin, 12 px when kanji are present.
- 美咲 (Misaki) is 8×8, for the tiniest labels.
- Shibuya also designed FF's original bitmap fonts. Pixel UI text should be designed on the same grid as the sprites.
Sources: https://www.choge-blog.com/?p=97790. https://forest.watch.impress.co.jp/docs/review/613180.html. UT Magazine interview with Shibuya https://www.uniqlo.com/jp/ja/contents/feature/ut-magazine/s134/ (JA).
Tengu: UI text and damage numbers. Use DotGothic16 at integer multiples (16 lpx), or render damage digits as our own glyph sprites. Never use fractional sizes. **S**

**30. Damage numbers and UI motion.**
- FF5-style: each digit hops in sequence, highest digit first, with a short delay. Zero delay gives FF6 style.
- Per-glyph hop + fade + scale.
- The moment a digit count rolls over (99→100) is the most dramatic, so emphasise crit or big numbers with size.
- Button press: an instant press-in (sink) response. Keep the press animation short, because delay reads as negative. Use a sharp ease rather than a plain easeOut.
- Animate only what helps a decision.
Sources: https://shikaku-sh.hatenablog.com/entry/unity-ff5-damage-animation-effect. https://note.com/shira_game/n/n9b33369a66cd. https://zenn.dev/izumuzui/articles/27a4f78f75e030. https://limesode.hatenablog.com/entry/2022/09/19/232514. https://note.com/elengine/n/n54b7267cb95b (JA).
Tengu: damage numbers in `effects.js` or `world`. Add a per-digit staggered hop (about 30 ms per digit, 4–6 lpx hop, slight overshoot). In `src/ui`, give buttons and hotkeys a 1-frame press-in. **S**

**31. Icons: shadows as 1 px edge lines, not scattered dots.**
At 32×32, an icon's shadow drawn as a 1 px line along the edge reads better than dithered or scattered dots. Use 8–16 colours, then outline → base → shadow → highlight → polish. Export PNG only; JPEG fringes the edges.
Source: https://pixelartlab.net/tutorials/dot-e-kakikata-beginners (JA).
Tengu: `render/icons.js` skill and item icons. Use edge-line shadows plus one highlight cluster. **S**

### G. General pixel-art practice (non-game)

**32. 豊井 (Toyoi Yuta), Japan's best-known pixel *illustration* artist (everyday-scene GIFs).**
He treats ドット絵 as a tool that separates observation from expression. He deliberately draws more people than are really in a scene to get the sense of scale. His palette borrows the softness of paper painting: muted, warm, low-contrast pastel. That fits Tengu's pastel direction for town and harbour backgrounds. Book: 『水と手と目』, which includes making-of and technique notes.
Sources: https://www.tokyoartbeat.com/articles/-/toyoi-tsukada-review-202311, https://kai-you.net/article/86544 (JA).
Tengu: town and harbour maps. Populate with more small ambient NPCs and loops (laundry, gulls, steam) for life. **M**

**33. Flat colour first, minimal palette, check at 100%.**
- Workflow: fill flats → AA only where fills meet line art.
- 8 colours can carry a full illustration.
- Manga screentone or dither patterns substitute for extra shades.
- No blur or airbrush.
- Check at 100% often.
- Regular-pattern dither for gradients; skip gradients when the light is near (モケモ #6).
Sources: https://asragi.hatenablog.com/entry/2019/12/07/055958, https://note.com/mokemo/n/nf42f3451840a (JA).
Tengu: sky and large flat areas in `terrain.js`. Use ordered-dither bands instead of smooth canvas gradients, to keep the pixel look consistent with sprites. **S**

## 3. Reference list

**Animation**
- らぎメモ ドット絵アニメーションの描き方 (1)–(4): lines, colour, small motion (offset parts), large motion (spacing, overshoot, afterimages). https://asragi.hatenablog.com/entry/2019/12/07/035646 (and /055958, /071504, /082733)
- DOT ART PLAY: walk (32 and 64 px), attack, katana attack GIF tutorials, with frame lists and delays. https://dotartplay.com/dot-animation-walk/ · /dot-animation-walk-64 · /dot-animation-action-attack · /dot-animation-attack-kanata
- pixelartlab walk guide: 8-frame contact/down/passing/up, 12 fps, RPG Maker sheet specs. https://pixelartlab.net/game-dev/article-7b57
- pixelartlab animation basics: idle 4f, 1 px rules, effect behaviours. https://pixelartlab.net/tutorials/dot-anime-tsukurikata
- ちもん: fighting-game attack motion and the extra acceleration frame. https://note.com/stibium/n/n69992413d002
- nekonikomi: game pixel animation log (idle by parts, dodge blur plus dust, about 20-frame attacks). https://note.com/lucid_mango410/n/n8a42f31c9a7b
- CEDEC 2016 2D part animation (追憶の青): 30 fps authoring, 40 parts, foot lock. https://gamebiz.jp/news/168358

**Character art, colour, AA**
- 電ファミ ドッター対談 p1–3 (Nippon Ichi, FFBE, KOF fire, CRT colour, half-dot). https://news.denfaminicogamer.jp/kikakuthetower/dotter-taidan
- 4Gamer: Kazuko Shibuya interview (FF): proportions constancy, 32 colours, shadow-first volume. https://www.4gamer.net/games/064/G006480/20130227073/index_3.html
- Famitsu: R-TYPE / Metal Slug dotter AKIO (paper-first colour, CRT half-tones, boss-as-background). https://www.famitsu.com/news/202008/03202933.html
- 社長が訊く (Punch-Out!!): part-based sprites, chunky dots for big characters. https://www.nintendo.co.jp/wii/interview/r7pj/vol1/index3.html
- picopico256: AA ① (brightness illusion, don't AA joints). https://note.com/picopico68000/n/na929e6dff9a8
- モケモ ドット絵技術メモ #5 (clean lines, curve runs, outline hue) and #6 (gradients). https://note.com/mokemo/n/n974d4e4edfca · https://note.com/mokemo/n/nf42f3451840a
- 有織はべり: colour and hue shift, no greys. https://note.com/ari_ori/n/nba020af67bab · 64 px making https://note.com/ari_ori/n/nde7cc2053831
- 九城真: 64×64 making (16–24 colours, AA restraint). https://note.com/nine_castle/n/n235f9d83ccc8
- pixelartlab palette, hue shift and AA articles. https://pixelartlab.net/techniques/article-f2b2 · https://pixelartlab.net/techniques/anti-alias-kotu
- CLIP STUDIO chibi (2 頭身) and deformed monsters. https://www.clipstudio.net/oekaki/archives/153412 · /151178
- pixnote outline and sel-out guide (EN page of a JA site). https://pixnote.net/en/learn/outlines/

**Effects**
- 電ファミ対談 p3 (KOF flame fragments, 2-frame smoke, effect libraries).
- taka: effect colour meaning. https://note.com/natty_violet4982/n/nae03c88093aa · mindset https://note.com/natty_violet4982/n/nc4302c9e8d80
- Black Beard: additive vs multiply whiteout. https://note.com/bbds_blog/n/n54d89f19b12e
- CGWORLD Academy: effect texture design (silhouette × detail × structure). https://academy.cgworld.jp/contents/2051
- rn.log: pixel explosion and fireball shader. https://r-ngtm.hatenablog.com/entry/2018/12/22/141101 · /154344
- 森田: damage presentation layering. https://note.com/ixill_morita/n/n9d897a204446
- nadia: hand-drawn fx (splash, rising flame from stacked circles, dark aura with centre vs edge motion). https://note.com/nadia10_100/n/ne6bd137585b5
- Nintendo effects designer page (the three roles). https://www.nintendo.co.jp/jobs/introduction/design/work04.html
- CGWORLD on 吉田徹 (吉田流! アニメエフェクト作画; 4-koma timing for missiles). https://cgworld.jp/feature/201805-yoshida.html

**Game feel**
- Sakurai "大事なところはストップ!" summaries. https://note.com/rr_r612/n/nbc165f80899e · https://note.com/matchima2/n/n435a2b0f151f
- Qiita: Smash-style vibrating hit-stop. https://qiita.com/atto_seconds/items/6d3daefab3671a940681 · impact hit-stop https://qiita.com/flankids/items/75dd457463918f48b70f · damage reaction variants https://qiita.com/flankids/items/7fee77ed6f5e1b71d2be
- IEICE: hit-stop 0.1–0.2 s optimum study. https://ken.ieice.org/ken/paper/20230315OCSt/eng/
- LevelDesignWorks 手応えの中毒性 (Tetris 2F/4F). https://note.com/ohs40074/n/n9b8389e17ee4
- zero: hit-stop how-to. https://note.com/plus00/n/n8415e6e80142
- Shake: trauma² https://qiita.com/itsakeyfut/items/96718d988bd0966f4507 · sine + exp decay https://zenn.dev/landho_roblox/articles/1b909eb46eb794
- Octopath talk report (Unreal Fest East 2018). https://automaton-media.com/devlog/report/20181023-78326
- Guilty Gear Xrd talk (Famitsu). https://www.famitsu.com/news/201508/27087024.html

**Backgrounds**
- pixelartlab background design (resolutions, parallax %, tree LOD). https://pixelartlab.net/tutorials/dot-e-haikei-kakikata
- siba.: tree. https://note.com/siba_dot/n/nea7deb9677bd
- 夏天: background making. https://note.com/chic_oxalis3897/n/n67acea47219c
- 猫アイコン: map drawing (part 2). https://note.com/hpnm/n/n3a9db437a769
- ワシミミズク: map chips. https://note.com/washi_mimizuku/n/n632702a1c65a
- CLIP STUDIO pixel forest tileset. https://tips.clip-studio.com/ja-jp/articles/7567

**UI, fonts**
- DotGothic16 (Google Fonts), PixelMplus, 美咲. https://www.choge-blog.com/?p=97790 · https://forest.watch.impress.co.jp/docs/review/613180.html
- FF5-style damage digits. https://shikaku-sh.hatenablog.com/entry/unity-ff5-damage-animation-effect
- UI motion vocabulary. https://zenn.dev/izumuzui/articles/27a4f78f75e030 · UI-anime pitfalls https://note.com/elengine/n/n54b7267cb95b
- Game app UI animation case studies. https://appgameui.hatenablog.com/
- CEDEC 2016 UI animation for guidance (4Gamer). https://business.4gamer.net/article/1608/16082704/

**General / artists**
- 豊井 review and book 『水と手と目』. https://www.tokyoartbeat.com/articles/-/toyoi-tsukada-review-202311
- Shibuya UT interview (CRT vs LCD, fonts). https://www.uniqlo.com/jp/ja/contents/feature/ut-magazine/s134/

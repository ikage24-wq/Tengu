# Research: environment, UI and icon art (EN / JA / KO / RU)

Scope: backgrounds and parallax, tiles and terrain edges, props, lighting and grading, weather, towns,
MapleStory map conventions, game UI (windows, bars, fonts, damage numbers, minimap, tooltips), and
item and skill icons. I also covered other pixel games (Celeste, Dead Cells, Octopath, Eastward,
Owlboy, Terraria, Stardew, WoW, GW2, Yoshi's Island) and pixel illustration outside games (APO+,
nanamiyuki, かなしの, 佐東おやすみ, Slynyrd).

## What I saw in Tengu (ig/new-woods, town-harbor, boss-bossroom, icons-inventory, skill-icons-ingame)
- **Mossy Woods.** The near hill band is as saturated and dark as the play-space grass, so it fights
  the foreground. The far layer is nearly the same hue as the mid layer. The dirt cross-section is one
  flat brown with a low-contrast stone pattern across about 40% of the screen. Nothing ever passes in
  front of the player: `drawSceneBack` draws every layer behind the characters.
- **Pastel Harbor and Crystal Throne.** The brick wall fills the lower third with one tile repeated in
  a perfectly regular grid. There's no variant, no grime gradient and no value fall-off with depth.
  The boss room has no mid-ground at all (crystals stand straight on the floor against a flat purple
  sky), so the King floats on emptiness.
- **Drift particles.** `drawDrift` draws one band of 9 particles at a single parallax (0.6). There's
  no depth.
- **Lighting.** `post.js` grades with fixed per-theme looks only: no time-of-day blend and no grading
  of the parallax layers themselves.
- **Skill window.** All five Bishop icons are gold-on-gold and differ only by a small white glyph, so
  their silhouettes and hues don't separate. The item icons in the bag read well.
- **Minimap.** It's mostly empty pale space: only footholds and dots, and no portal or NPC icons are
  legible.
- **Font.** The UI uses Trebuchet MS / system font at sizes 7–10 logical px. It's legible at 1080p
  but has no outline or backing on the floating map names.

## 1. Engines and queries that worked
- **WebSearch (US):** worked for every language, but its summaries are thin, so I opened the primary
  pages myself.
- **Yahoo! JAPAN** (`search.yahoo.co.jp/search?p=`): worked well and gave the best Japanese hits
  (ドット絵 背景 描き方, ゲームUI HPゲージ, マップチップ 描き方).
- **Blocked:** DuckDuckGo HTML (captcha), Yandex (SmartCaptcha), Naver (fetch refused), Google
  (sorry page).
- **Empty or junk:** Daum returned empty result frames. Bing returned junk.
- **Russian:** Habr pages fetched fine (Mikhail Kravchenko's UI series, the Dead Cells translation).
- **Korean:** came via WebSearch (Inven, MapleStory Nexon notices, namu, StrategyWiki).
- **MapleStory internals:** GitHub code search for WZ dumps (Harepacker-resurrected, omega
  `Map.wz` XML on raw.githubusercontent) was the best source for hard numbers.

## 2. Top findings

### A. Parallax and depth

**1. MapleStory Henesys back-layer recipe** (read from `Map.wz/Map/Map1/100000000.img.xml` in the
omega WZ dump; formula from Harepacker `BackgroundItem.cs`). KO game, primary data.
- The screen position is `rx * (camShift) / 100 + base`, so `|rx|/100` is the scroll factor.
- Henesys has 8 back entries:

  | Layer | rx | type | Behaviour |
  |---|---|---|---|
  | Sky | 0 | 3 (tiled H+V) | static |
  | Clouds | -5 | 4 (h-moving) | ~0.05 scroll and also auto-drift; for moving types rx doubles as speed (`shift += rx*dt/200`, wrapped by cx) |
  | Far hills | -20 | 0 | 0.20 |
  | Mid hills, ×4 copies at x = -66 / 958 / 1982 / 3006 | -40 | 0 | 0.40 |

- **ry is tiny (-3..+3, -5).** Maple backgrounds barely move vertically.
- Other fields: `a` (alpha 0–255), `front=1` (the layer draws over characters), `cx/cy` (tile
  spacing).
- **Tengu now:** clouds 0.07, far 0.2, mid 0.45. That's almost the same horizontally, but vertical
  factors of 0.2 and 0.45 are 5–10× Maple's.
- **Apply:** cap the vertical layer factors at about 0.03–0.08 (far) and 0.1 (mid), so the skyline
  stays planted on tall maps. Add `front` layers (see #4).
- File: `scenery.js drawSceneBack/layerY`. Effort S.

**2. Depth colour rules: saturation down, lightness up, hue toward the sky per plane.** Slynyrd
Pixelblog 62 "Landscape Backgrounds" (2026), EN, pixel illustration.
- Each receding plane loses saturation, gains lightness in daylight or haze, and shifts hue toward the
  sky colour.
- The distant mountain reuses a sky-band colour, and distant shadows reuse a sky colour.
- The forest is the exception: it reverses, with dark blue greens near and warm yellow at the sunlit
  far edge.
- **Apply:** derive `t.far` and the mid-layer tint procedurally instead of hand-picking. Use
  `far = mix(baseHill, t.sky[1], 0.55)` and `mid = mix(baseHill, t.sky[1], 0.25)`, and pull
  saturation down ~25% per plane.
- **Woods fix:** the near hill band should be lighter and less saturated than the play grass. It's
  currently darker.
- File: `scenery.js drawFar/drawMid` (THEMES). Effort S.

**3. Layer speed table and colour budget per layer.** pixelartlab.net "ドット絵 背景の作り方" (JA) and
sprite-ai "Backgrounds make or break the feel" (EN).
- **Speeds:** sky 10–20%, far 20–40%, mid 60–80%, foreground 100–120%.
- **Count:** start with 2 layers, then 3. Five is the practical maximum.
- **Colours:** backgrounds use 8–16 desaturated colours, fewer than sprites. Spend 2–3 colours on the
  sky and 2–3 on the ground.
- **Line colour:** far lines move toward the background colour, and near lines are darker and
  thicker. Keep a dark outline on characters, so the difference from background lines separates
  subject from scene.
- **Highlights:** lower background highlights one step when a character is the subject.
- **Loops:** join them with an 8–16 px margin, and put one irregular "break" per loop so the period
  isn't visible.
- **Apply:** our mid-layer outlines are full INK. Lerp outline colour to `mix(INK, sky, 0.5)` for mid
  and drop outlines entirely for far. `repeat()` uses fixed spacing, so add a per-period jitter or
  one landmark per N repeats.
- Effort S–M.

**4. Foreground layer over the player.** MapleStory `front` backs, Celeste stylegrounds
"Foreground" flag (Everest wiki), Hollow Knight (PC Gamer analysis: "objects blocking the screen in
the foreground"), sprite-ai: foreground at 100–120% "used sparingly".
- Celeste parameters: ScrollX/Y (0 = locked, 1 = gameplay), SpeedX/Y px/s auto-scroll, LoopX/Y,
  Alpha, Colour tint, Blend additive|alphablend, FadeIn, Foreground.
- **Apply:** add `drawSceneFront(ctx, map, cam)` after the characters. Draw out-of-focus dark
  silhouettes (leaf clumps, hanging vines, harbor posts, crystal spires) at scroll 1.15–1.3, alpha
  0.85, a value about 35% darker than the play space, a cool tint, and no outline. Place them only at
  screen bottom corners and top edge, every 300–600 px, never over the platform line.
- Also add a foreground drift band (see #11).
- Files: `scenery.js`, plus the call site in the main draw. Effort M.

**5. Gradient-map recolour of grayscale layers per biome.** Dead Cells art blog, Russian Habr
translation (habr.com/ru/post/470784), RU source plus game.
- Parallax textures are painted in grayscale and coloured through a gradient map. Swapping the map
  recolours the whole biome (that's how they fixed Promenade and Ramparts looking alike).
- Per-level variables: light colour, fog, smoke, vegetation density.
- **Readability rule:** collision geometry contrasts strongly with the background, and background
  colours blend into each other. Interactive pieces (ladders, platforms) sit at a contrast level
  between background and obstacles. Enemies, projectiles and spells get the highest saturation,
  contrast and brightness.
- **Warm light and cool shadow** in every scene. Open outdoor levels use analogous palettes, and
  enclosed ones use complementary palettes.
- **Apply:** render far and mid silhouettes to an offscreen canvas as luminance, then tint via a
  3–4 stop ramp from `map.look`. A new map then needs only a ramp, not new art.
- Also lower the mid-layer contrast so ladders and planks (interactive) sit between it and the mobs.
- Effort M.

**6. Octopath HD-2D lesson: density, not resolution.** Siliconera / Famitsu interview, JP game.
- The first try "lacked depth and was uninteresting".
- The second "went too far on resolution and saturation, losing the appeal of pixel art".
- The fix was to increase the density of tile variations and colours, because sprites looked
  "lonely" on big screens.
- Depth comes from depth of field plus tilt-shift.
- **Apply:** don't add more glow or saturation. Add more tile variants and small props per screen.
  An optional cheap "tilt-shift" is to draw the far layer through the 1/4-size glow layer we already
  have (`post.js layer()`) at about 30% opacity, so far hills get soft. Only far layers, never
  gameplay.
- Effort S.

### B. Terrain, tiles and edges

**7. MapleStory tile anatomy, read from `Map.wz/Tile/woodMarble.img.xml`.** KO game, primary data.

| Piece | Count | Size (px) | Notes |
|---|---|---|---|
| `bsc` fill | 5 variants | 90×60 | |
| `enH0` top edge (grass lip) | 4 variants | 90×32–33 | origin at bottom, so it sits above the foothold line |
| `enH1` bottom edge | 4 | 90×19–22 | |
| `enV0` / `enV1` side edges | 2 each | 26–30 wide | |
| `edU` top corners | 2 | 54–61×32–33 | |
| `edD` bottom corners | 2 | 45×13 | |
| Slopes `slLU/slRU/slLD/slRD` | 1–2 | 90 wide × 72–91 | |

- **Takeaways:**
  - The grass lip is about half the height of a fill tile and is drawn as its own strip with 4
    variants.
  - The fill has 5 variants.
  - The underside has its own 20 px edge.
  - Corners are separate art, not clipped fills.
- **Apply to `terrain.js`:**
  - `lip()` uses depth 7. Raise it to about 10–12 logical px for main ground, with a scalloped
    overhang that varies per segment from 3–4 seeded shapes.
  - Add a dark "underside lip" band (about 6 px, value −20%) where ground meets a cliff or overhang.
  - Make `paintTile` produce 3–5 variants and pick per 64-px cell by hash, so the grid stops showing.
- Effort M.

**8. NESdev "Drawing terrain" recipe.** EN, retro-game practice.
- **Top tile:** grass built bottom to top with smaller brushes and lighter, warmer colours (dark cyan
  → green → warm light green), plus a shadow line between grass and dirt.
- **Bottom and side tiles:** random cracks shaded inside.
- **Corners:** move side cracks to the corners, curve-link them to the grass, and lighten the
  edges.
- **Inside turns:** a 3×3 block.
- **Slopes:** 1:2 slopes are made by shifting each 2-px row down 1 px. 1:1 slopes come from a 3×2
  block.
- **Apply:**
  - Grade the dirt fill vertically: lightest about 8 px under the lip, then darker and cooler with
    depth (`fillLand` gradient overlay, value −15% over 80 px).
  - Add the "shadow line" under the lip (1–2 px INK at 30%).
  - Add sparse crack and pebble decals rather than a uniform stone pattern.
- This directly fixes the flat brown slab in Mossy Woods. Effort S.

**9. Slynyrd Pixelblog 28 "Side View Tiles"** (EN) and pixnote "ゲーム用ドット絵素材の作り方" (JA).
- **Tile faces:** give the top face a tilt toward the background (a 3/4 face), and tilt corners on
  both outer sides ("critical for depth").
- **Grass on characters:** extra grass and plant tiles overlap the character so it feels embedded.
- **Supports:** platforms need logical support structures drawn in the immediate background.
- **Texture:** don't let key texture clusters touch each other. Use only a few colours per texture,
  and don't put two busy textures side by side; use negative space.
- **Variants:** provide at least one variant for any tile placed in repetition.
- **pixnote:**
  - Use 3–5 variants per ground tile.
  - Never darken one edge column (it makes a grid).
  - Animated tiles use 2–4 frames.
  - Choose UI hues that don't overlap the world palette.
- **Apply:**
  - Draw 3–6 px grass blades along the lip in front of feet (draw after the characters, see #4).
  - Our planks already have truss supports, which is good. Do the same for floating stone islands
    (vines or roots hanging to a lower anchor).
  - On the Harbor and Throne bricks, add 2 brick variants (chipped, mossy), a vertical value
    gradient, and a ~20% chance of a missing or recessed brick.
- Effort S–M.

**10. Terraria and Stardew tile framing.** tModLoader framing guide (EN) and sprite-ai.
- **Terraria:** terrain tiles are "framed": each tile chooses a 16×16 frame from its neighbour mask,
  with several random variants per case.
- **Stardew:** uses 3–4 terrain variants placed semi-randomly.
- **Apply:** we draw terrain procedurally from polylines, so the equivalent is seeded per-segment
  variation:
  - lip scallop shape
  - flower density
  - stone colour
  - occasional mossy rock or root poking out of the cliff face (`cliffFace`)
- Effort S.

### C. Atmosphere, weather, light

**11. Particles in 3 depth bands.** Celeste effects (SnowBG darker and bluer vs SnowFG white and
blue, Petals, Windsnow, Stardust "following wind") and the Unreal 2D Rain&Snow listing (3 independent
layers FG/MG/BG).
- **Apply:** split `drawDrift` into three bands:
  - **BG:** 10 particles, size 0.6×, alpha 0.4, parallax 0.3, tinted toward the sky, drawn before
    the terrain.
  - **MG:** the current band.
  - **FG:** 3–4 particles, size 1.8×, alpha 0.7, parallax 1.25, slightly faster, drawn after the
    characters.
- Add a shared wind value (sin-based gusts every 6–10 s) that tilts petals and leaves and sways
  grass tufts together. That's what sells "weather".
- Effort S.

**12. Time-of-day grading as a gradient.** Allegro and Godot threads (EN), APO+ (GENSEKI, JA),
かなしの landscape making-of (note, JA).
- Draw one full-screen layer after the world, driven by a time-to-colour table with interpolation.
  Use a gradient (top-warm / bottom-cool) rather than a flat tint.
- **APO+:** light that hits surfaces takes the light colour, and shadow takes the sky's blue. Distant
  mountains go blue. Keep 64 colours or fewer.
- **かなしの:** the three-colour core is yellow light, blue shadow and blue-green sky. Lit areas are
  actually near-neutral grey but read warm against the blues. Distant things use only 2 local
  colours (white and grey).
- **Apply:** `post.js LOOKS` already has `morning/noon/dusk`. Add `lerpLook(a, b, k)` and allow an
  optional `map.look.cycle` that blends noon → dusk → night over N minutes.
- Pass `look.shade` into the far and mid layer tint too, so backgrounds shift with the light (right
  now only the overlay changes).
- Effort M.

**13. Haze band at the base of each layer.** Slynyrd 62 (haze band along the bottom of mountains,
blended into grass) and Yoshi's Island analysis (cone3d, EN/RU summary): bright foreground with
black outline, muted pastel hills and clouds, and pure black or white reserved for the foreground.
- **Apply:** we already have `drawHaze` once, above the ground. Add a thin haze gradient (sky[1] at
  0.35 → 0) at the foot of the far layer and the mid layer. Each silhouette then "stands in air".
  This is the cheapest single depth win.
- Effort S.

**14. MapleStory map tech (Nexon MapleLog via KO search).** Pixel shaders and a GPU particle system
for map scenes, a light system using light and darkness, and waterfalls replaced by particles. The
blog itself returns 403; this comes from the search summary. KO.
- **Apply:** our `woods` waterfall can get a particle mist foot (white circles, rising, alpha 0.3)
  plus 2-px foam streaks scrolling at 2 speeds.
- Effort S.

### D. Composition and town art (pixel illustration)

**15. Spending detail and colour.** nanamiyuki interview (GENSEKI, JA).
- Pick the background palette first, then the subject.
- Near objects get outlines and contrast. Far objects fade and lose outlines but keep just enough
  shape.
- Merge near-identical colours (for example sky and a small object) into one colour.
- Push shadows darker than feels comfortable.
- Dither only in shadows and rough materials, never on smooth surfaces.
- **Apply:** reuse sky colours in far props (see #2). In the town backdrop houses, drop the windows
  to "dark rectangles" in mid and "1-px dots" in far (also pixelartlab's rule: near = full frame,
  mid = dark rect, far = dot cluster).
- Effort S.

**16. Building construction.** pixelartlab (JA): start buildings as boxes. Use a 3×3 window with a
1-px frame repeated on a fixed pitch (3 px window + 2 px gap). Make the right face one step darker.
Light comes from the upper left for every motif.
- **Apply:** `houseArt` faces are flat. Add a side face 1 step darker on alternate houses and a
  roof-eave shadow band.
- Effort S.

**17. Eastward environment intent** (Game Developer IGF interview, CN studio).
- "Strong colors, various buildings and objects, rich and subtle details."
- Every environment has "one special part".
- Towns look lived-in through clutter (laundry, signs, pipes).
- **Apply:** give each town one signature landmark per screen (`landmarks.js` already exists) plus
  "lived-in" small props: bunting between lamps (Harbor already has string lights, good), crates,
  laundry lines, potted flowers on sills, notice boards.
- Effort M.

**18. Owlboy sky** (Waltorious analysis).
- Cyan sky lightens toward the bottom, and clouds are white plus greys only.
- It uses a limited colour set per component, a few dither spots, and tiling disguised by bespoke
  overlays.
- **Apply:** our cloud art is good. Add a second, farther cloud layer that is nearly sky-coloured
  (Slynyrd: the farthest clouds are baked into the sky gradient) at scroll 0.03.
- Effort S.

### E. UI

**19. Text rules.** Habr, Kravchenko "Как оформлять текст в игровых интерфейсах" (RU).
- Line height is about 1.4× the size, and line length about 70 characters.
- Use one family with several weights plus at most one decorative font.
- Caps only for short labels.
- Over varied backgrounds, text needs a translucent backing plate, shadow or outline.
- There are 12 label roles (heading, subheading, body, emphasis, secondary, minor, positive,
  negative, primary button, secondary button, tab, contextual action), each with one fixed style.
- **Apply:** define these 12 as `TEXT_STYLES` in `ui/kit.js` (size, weight, colour) and route all
  `text()` calls through them.
- Put a backing pill or 1.5 px outline on world-space labels (map title ribbon is fine; NPC and shop
  tags already have pills).
- Effort M.

**20. Visual noise.** Habr, Kravchenko "Визуальный шум в игровых интерфейсах" (RU).
- Text outranks decoration.
- Tone decoration down instead of removing it.
- Use an opaque backing behind text, and blur or darken the world behind modal windows.
- Hide what isn't needed in the current context (for example the hotkey bar for skills outside
  combat).
- **Apply:** when the Bag or Skills window is open, darken the world 15% (one fillRect).
- Our window bodies are cream on pastel scenes, and edges blend in the pink Sprout map. Use a
  stronger 2-px theme-ink rim plus the existing soft shadow.
- Effort S.

**21. Pixel-UI construction.** Slynyrd 26 (EN), pixnote (JA), Stardew-style kits, Kravchenko's
"Как нарезать графику…".
- Panels are 9-slice: decorated corners stay intact and only the flat middles stretch.
- Don't mix gauge orientations.
- Health must be readable at a glance without stealing attention.
- Strong feedback goes on the sprite, not the HUD.
- Pixel fonts are 5×5 to 8×8 px.
- **Apply:**
  - Our kit draws vector round-rects, which is fine.
  - Keep the bars horizontal.
  - Low-HP feedback: a red vignette pulse on the world plus a portrait expression change (the Doom
    face idea from Slynyrd 26), not just the bar.
- Effort S.

**22. HP gauge craft.** limesode.hatenablog "体力ゲージ的なあれこれ" (JA) and wikidocs (KO via
search).
- **Damage:**
  - Use a double gauge: the trail bar lags and animates down.
  - Show the lost amount near the bar.
  - Shake the bar on physical damage, and put an element effect on it for magic damage.
- **Semantics:** heal = white flash, negative = red flash, used consistently.
- **Low HP:** blink the bar or its backing at low HP. If the bar is small, blink the frame instead.
  The Korean source sets the threshold at 20% of max HP.
- **Values:** use fraction notation (`50 / 50`) for small max values and a percentage for large ones.
- **Buffs:** a UV-scrolling stripe overlay on the bar while a buff is active.
- **Apply:** `kit.bar()` already has `trail`. Add:
  - a white flash on heal (0.15 s)
  - 2-px horizontal shake for 0.2 s on a hit of 10% or more
  - a pulse under 20%
  - a diagonal-stripe scroll on the MP bar while MP regen is buffed
- File: `hud.js`. Effort S.

**23. Damage numbers.** KidsCanCode floating text (EN), Factorio DamageIndicator changelog (via
search), WoW (indieklem substack), MapleStory crit = pink (Inven KO), gameanimation.info "インゲーム文字演出"
(JA).
- **Pop:** a crit pops from 2.0× to 1.0× with a back-ease in 0.4 s. Factorio's "poppy" curve
  overshoots 1.85× and uses ease-out-quad drift with a fast start.
- **Rise and spread:** rise about 80 px over the lifetime and spread ±45°.
- **Colour code (WoW):** yellow for your skills, red for damage you take, green for heals, larger
  for crits.
- **MapleStory:** crit numbers are a distinct pink-red skin, and multi-hit lines stack vertically.
- **Stacking options:** scatter, overlap, or sum into a total. Heals rise slowly.
- **Apply:**
  - Normal hit: scale 1.4 → 1.0 in 80 ms (ease-out-back), hold, then ease-out-quad rise of 18–24
    logical px over 0.7 s, fading only in the last 30%.
  - Crit: 1.9 → 1.1 with a 2-frame white flash and pink-red fill.
  - Multi-hit skills: stack lines 9 px apart, staggered 60 ms per strike, in time with the `combo`
    strike timing per CLAUDE.md.
  - Damage you take: red, smaller, falls instead of rising.
- Effort S.

**24. Tooltips and slot states (WoW).**
- Tooltip order is priority: name (brightest, rarity-coloured), key stat, description, minor info.
  Brightness equals importance.
- Skill-slot states are overlays on the same icon (disabled, not enough MP, ready), so the base icon
  never changes.
- **Apply:** in the hotbar, grey and desaturate a skill icon with a blue tint when MP is too low. We
  have no cooldowns, so MP is the only state. Add a 1-frame white outline flash when it becomes
  usable again.
- Effort S.

**25. Minimap.** WoW and OSRS wiki minimap conventions plus the 100-game minimap study (ICA abstract).
- Player = distinct directional marker.
- Entity types are separated by colour and shape: NPC, portal, party, quest.
- Off-map destinations are edge arrows.
- **Apply:**
  - Draw footholds as 2-px lines in a darker theme colour.
  - Use the existing `look.far` colour for the ground silhouette fill so the box isn't empty white.
  - Portals as small swirl or arch glyphs (not dots).
  - NPCs with "!" as yellow pips.
  - The player as a pink triangle pointing the facing direction.
  - Party members as mint dots.
- Effort S.

### F. Icons

**26. Icon set method.** Habr, Kravchenko "рисуем пак иконок" (RU); Wayline and Made Good Designs
(EN).
- Build one palette per material family (base halfway between light and dark, plus light, dark,
  highlight, very dark, and environment reflection).
- Rarer items borrow parts from stronger enemies.
- For gems, draw once and recolour the core per tier.
- Check that no two icons are confused (ring vs brooch: make the gold heavier).
- Judge at the smallest size, silhouette first.
- One light source and one scale across the set.
- **Apply:** our `ITEM_ART` icons already follow the light and outline rules. For loot, reuse monster
  parts (mushroom cap, snail shell) as the "etc" drop silhouettes, which we partly do already.
- Effort S.

**27. Skill icon colour coding.** Guild Wars 2 skill-icon convention (EN via search): fire =
red/orange, water = blue/white, earth = yellow/brown, heals = blue across all professions. WoW:
state overlays.
- **Diagnosis:** our skill-window icons are all gold frames. Hue doesn't separate skills.
- **Apply:**
  - Make the icon background hue = element or school, and the frame shape = type: rounded square for
    actives, circle for passives, diamond-cornered square for buffs.
  - Keep the white glyph silhouette.
  - Add a 1-px dark rim and a top-left inner highlight for "candy" consistency.
- `icons.js skillShapes` already has `SKILL_COLORS`/`SCHOOL_COLORS` for the 16-px hotbar glyphs.
  Make sure the skill window's large icons use the same per-skill hue rather than one gold theme.
- Effort S.

**28. Rarity borders.** MapleStory potential tiers (StrategyWiki): rare = blue, epic = purple,
unique = yellow, legendary = green; red border = unrevealed potential; the border follows the
higher rank. Diablo/WoW name colours: grey, white, green, blue, purple, orange. pixnote (JA):
copper → silver → gold → rainbow.
- **Apply:** we already have `RARITIES`. Make the bag cell show a 1.5-px rarity-coloured inner border
  plus a soft corner glow for epic and above, and a slow shimmer sweep for the top tier.
- Our pastel palette needs the rarity hues at higher saturation than the UI chrome to stay
  distinguishable (pixnote: UI hues shouldn't overlap the world).
- Effort S.

**29. MapleStory icon data model.** Skill.wz has `icon`, `iconMouseOver` and `iconDisabled`, each a
32×32 canvas (cosmic-data notes, maple-survivors repo). Items have `icon` (with drop shadow) and
`iconRaw`. KO game.
- **Apply:** generate three cached variants per skill icon (normal; hover = +10% brightness with a
  white 1-px rim; disabled = desaturated and darkened). Generate two per item icon (with and without
  the soft ground shadow ellipse: shadow in the bag, no shadow in tooltips and hotbar).
- Effort S.

**30. Item readability at 16 px.** Slynyrd 24 "Items" and 47 "Tiny Pixels".
- 16×16, 6 colours or fewer per item.
- Familiar icons (heart, gem, coin) beat novel ones.
- Idle cues on ground drops: currency shines, power-ups bob, items bounce.
- **Apply:**
  - Ground drops: a 1.2 s bob of ±1 px plus a 2-frame glint every 2.5 s on coins and rare-tier
    items.
  - Loot beam colour by rarity (the existing `juice 'loot'`).
- Effort S.

## 3. Reference list
- https://www.slynyrd.com/blog/2026/5/27/pixelblog-62-landscape-backgrounds : depth colour rules per plane; haze; cloud layering.
- https://www.slynyrd.com/blog/2020/5/21/pixelblog-28-side-view-tiles : side-view tiles; tilted faces; support tiles; texture distribution.
- https://www.slynyrd.com/blog/2019/11/12/pixelblog-23-parallax-scrolling : whole-number parallax rates.
- https://www.slynyrd.com/blog/2020/2/23/pixelblog-26-uxui-design-basics : gauge styles; UI readability.
- https://www.slynyrd.com/blog/2019/12/21/pixelblog-24-items : 16×16 items, 6 colours or fewer, idle cues.
- https://slynyrd.com/blog/2019/3/7/pixelblog-15-plant-life : tree clusters and repetition.
- https://pixelartlab.net/tutorials/dot-e-haikei-kakikata (JA) : layer speeds, sky bands, tree and building recipes with px sizes, loop seams.
- https://magazine.genseki.me/entry/itv_apoplus_20241008 (JA) : APO+ on landscape light, blue shadows, 480 px / 64 colours.
- https://magazine.genseki.me/entry/itv_nanamiyuki_20240718 (JA) : outlines near vs far, colour merging, dithering only in shadow.
- https://note.com/jagaimo1020/n/n7658ecd93fcf (JA) : 3-colour landscape (yellow light, blue shadow, blue-green sky).
- https://note.com/satowgoodnight/n/n865ed41a88a3 (JA) : landscape process (photo, then 3D, then hand perspective).
- https://pixnote.net/learn/game-assets/ (JA) : tile variants, 9-slice, bitmap font sizes, rarity colours.
- https://limesode.hatenablog.com/entry/2019/12/09/002228 (JA) : HP gauge damage trail, pinch blink, colour semantics.
- https://gameanimation.info/archives/2148 (JA) : in-game text effect types and stacking.
- https://raw.githubusercontent.com/lastbattle/Harepacker-resurrected/master/HaCreator/MapSimulator/Entities/BackgroundItem.cs : Maple parallax formula, moving types.
- https://raw.githubusercontent.com/jonnylin13/omega/master/wz/Map.wz/Map/Map1/100000000.img.xml : Henesys back layers (rx/ry/type).
- https://raw.githubusercontent.com/jonnylin13/omega/master/wz/Map.wz/Tile/woodMarble.img.xml : Maple tile pieces and sizes.
- https://strategywiki.org/wiki/MapleStory/Potential_System : rarity border colours.
- https://www.inven.co.kr/board/maple/2304/5739 (KO) : Maple crit = pink numbers, 120–150%.
- https://maplestory.nexon.com/News/Update/678 (KO) : 2025 UI rework notes (darker tooltip backgrounds, 1024×768).
- https://habr.com/en/articles/796099/ (RU) : text in game UI.
- https://habr.com/en/articles/977464/ (RU) : visual noise.
- https://habr.com/en/articles/477562/ (RU) : icon pack process.
- https://habr.com/en/articles/983472/ (RU) : slicing UI graphics (9-slice) without blur or seams.
- https://habr.com/ru/post/470784 (RU) : Dead Cells art direction (gradient maps, readability tiers).
- https://github-wiki-see.page/m/EverestAPI/Resources/wiki/Adding-Stylegrounds : Celeste styleground parameters and effects.
- https://www.sprite-ai.art/blog/pixel-art-backgrounds : 5-layer speed and colour table; Celeste, Dead Cells, Stardew notes.
- https://www.siliconera.com/project-octopath-traveler-developers-answer-project-started-troubles-developing-hd-2d/ : HD-2D density lesson.
- https://www.gamedeveloper.com/disciplines/road-to-the-igf-pixpil-s-i-eastward-i- : Eastward environment intent.
- http://www.nesdev.org/wiki/Drawing_terrain : step-by-step terrain tiles, corners, slopes.
- https://hackmd.io/@tModLoader/HJUiVKXzu : Terraria tile framing.
- https://kidscancode.org/godot_recipes/4.x/ui/floating_text/index.html : floating text parameters.
- https://indieklem.substack.com/p/12-what-you-can-learn-from-the-ui : WoW combat text colours, icon state overlays, tooltip hierarchy.
- https://gonintendo.com/archives/280488-dead-cells-dev-blog-art-design-deep-dive-giving-back-colors-to-cryptic-worlds : Dead Cells saturation pillar.
- https://80.lv/articles/interview-with-the-developers-of-dead-cells : hand-painted normal maps, relighting levels.
- https://waltoriouswritesaboutgames.com/2024/09/02/rainbow-in-the-dark-owlboy/ : Owlboy sky and clouds palette.
- https://www.pcgamer.com/uk/hollow-knights-charming-art-sets-the-bar-for-hand-drawn-games : foreground occluders, layered parallax.
- https://gamefromscratch.com/the-game-ui-database/ (and gameuidatabase.com) : 55k screens; filter by HUD element.
- https://cone3d.gamedev.net/tutorials/visual-arts/easy-atmospheric-perspective-in-photoshop-r2521 : Yoshi's Island pastel depth example.

## Quick-win shortlist (S effort, biggest visual payoff)
1. Haze gradient at the foot of the far and mid layers, plus a far tint that is mixed toward the
   sky (#2, #13).
2. Dirt cross-section: vertical value gradient, shadow line under the lip, sparse crack and pebble
   decals (#8).
3. Brick and tile variants plus a value gradient in Harbor and Throne (#9).
4. Drift particles in BG/MG/FG bands with shared wind (#11).
5. Skill-window icons hued per element, with frame shape by type (#27).
6. Damage-number pop curve and crit skin (#23).
7. Minimap filled with ground colour and portal and NPC glyphs (#25).
8. Foreground occluder silhouettes (#4, M effort, but it's the single biggest "MapleStory/Hollow
   Knight depth" upgrade).

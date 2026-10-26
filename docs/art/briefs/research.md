# Research brief (shared by every research agent)

The user asked: "search for tutorials for pixel art and animations and effects for pixel art and more
things that will help the game, in multiple languages (English, Japanese, Korean, Russian), deep
search, pick the best ones and use them all to improve the game; use multiple search engines as many
as you can and collect as many guides, references, sheets, etc."

You are one researcher in a team. You do NOT edit the repo. You write one findings file.

## The game (so you know what helps)
"Tengu": a pastel chibi 2D side-scroller MMO-like RPG (MapleStory-like) in vanilla JS canvas at
640x360 logical, rendered crisp at screen density. Sprites (heroes, monsters, bosses, NPCs, items,
skill icons, map props) are built in code from vector shapes rasterised at res 3 (each logical px =
3 screen px at 1080p) with automatic outlines (selective outlines already done), cel shading, no
blur. Skills/effects are drawn procedurally with canvas (arcs, particles, slashes, flashes) in
src/render/fxkit.js, effects.js, spells.js, strikes.js, particles.js. Maps are parallax layers with
terrain, props and lighting overlays (src/render/terrain.js, scenery.js, post.js). Combat: hit-stop,
screen shake, knockback, damage numbers. Our existing art bible (read it to avoid repeating it):
docs/art/art-bible.md
Look at a few current images too (Read shows images), e.g. in the scratchpad: queens-hair.png,
faces-meadow-zoom.png, ig/new-woods.png, ig/town-harbor.png, skill-icons-ingame.png, selout-c.png.

## How to search
- Use the WebSearch tool AND query other engines directly with WebFetch on their result pages, e.g.
  https://html.duckduckgo.com/html/?q=..., https://www.bing.com/search?q=...,
  https://search.yahoo.co.jp/search?p=..., https://search.naver.com/search.naver?query=...,
  https://yandex.ru/search/?text=..., https://www.google.com/search?q=... (some may block; note
  which worked). Search in your assigned language(s) with native terms, not translated English.
- Open the actual pages (WebFetch) and extract concrete techniques, numbers, timings, palettes,
  frame counts, step-by-step methods. A link without an extracted technique is worth nothing.
- Prefer primary sources: artist blogs, tutorial series, GDC/CEDEC talks, dev postmortems, official
  game dev blogs, well-known artists' threads, sprite-sheet references.
- Aim for 25+ distinct useful sources for your area.

## Output
Write your findings to the file path your task gives you, in English, structured as:
1. Engines/queries that worked (brief).
2. Top findings: numbered, each = technique + concrete details (numbers/timings/steps) + source URL
   + language + how exactly it applies to Tengu (which file/system: sprites, animation, fx, maps,
   UI, game feel) and an effort estimate (S/M/L).
3. Reference list: best links with one-line notes (tutorials, sheets, palettes, timing charts).
Keep it dense; 1,500–3,500 words. Report the path and a 10-line summary when done.

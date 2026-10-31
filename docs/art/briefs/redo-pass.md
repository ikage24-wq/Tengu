# Redo pass brief: redraw art and animation with everything we learned

The user asked to "redo all art and animations after learning". Every team redoes its area to the
standard of `docs/art/README.md` and `docs/art/art-bible.md`, using the findings in
`docs/art/research/`. Read the README and art bible fully first, then the research files relevant
to your area. Also read `CLAUDE.md` (combat rules, standing rules).

## What "redo" means
Keep each design's identity (what it is, its name, its role, its sizes/hitboxes, frame counts or
more, keys, `stride`, `atkMs`, data fields) unless a change is clearly better and harmless. Rebuild
how it is drawn and how it moves so it meets the rules:
- Silhouette with one signature shape that reads in solid black; shape language fits the character.
- Outlines in a darkened shade of each part's own hue (selective outlines are automatic for monster
  sprites via the renderer; other sprites: follow the art bible manually where the renderer doesn't).
- Hue-shifted ramps (max 4 tones per material), one light direction (upper front), no pillow
  shading, no grey shadows, accent colour about 10–20% of the sprite, materials rendered per the
  research (metal 3-step shine, gems, fur, cloth, wood, stone, leaves, water, glass).
- Faces use the kits: `src/render/mobs/faces.js` for creatures, `src/render/mobs/heroine.js` for
  humanoids; the face holds the strongest contrast; eye colour contrasts hair/fur; every mood acted.
- Pixel discipline: min line 2/3 art px, no stray pixels, anchors on the 1/3 px grid, clean clusters.
- Animation: per the README (wind-up/strike/held impact, overlap and follow-through, root-to-tip
  secondary motion, idles with a held beat and sideways sway, no ping-pong loops, no popping).
- Performance: keep shape budgets reasonable (about 350 per frame for bosses, 240 for regular
  monsters/characters); sprites are cached, keep it that way.

## Process (mandatory)
1. Before you change anything, capture the current state (gallery/zoomed crops/in-game shots).
2. Write down, concretely, what's wrong per piece (zoom 6–8x).
3. Redo, then at least three critique rounds against the references and the rules (not against
   our older art), checking zoomed AND at 1x in a real map.
4. Before/after images for every piece.

## Preview server
The shared server is gone. Start your own short-lived one on YOUR port only while capturing, and
stop it after, e.g. in one command:
`(cd /home/user/Twzt && python3 -m http.server $PORT >/dev/null 2>&1 & echo $! > /tmp/srv.$PORT); sleep 1; PORT=$PORT node tools/art/gallery.cjs …; kill $(cat /tmp/srv.$PORT)`
All capture scripts in `tools/art/` and the galleries in `tools/` honour `PORT`. Run capture
scripts from a folder outside the repo (they write images to the current directory) — use the
scratchpad: /tmp/claude-0/-home-user-Twzt/b83c50f6-dbf8-5bef-8415-22f5394e79c8/scratchpad/
(make your own subfolder). Never write images into the repo.

## Rules
- Only edit your assigned files. Others are editing other files right now.
- Match surrounding code style; no model names anywhere.
- `npm test` passes; commit in coherent steps with explicit `git add <files>` (don't push; retry if
  git is busy). Commit messages end with exactly:
  Co-Authored-By: Claude <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01LAADQTFD8976KUnMUbXVRk
- If you learn a new technique or rule that works, add it to `docs/art/README.md` under the right
  heading (short, concrete) in the same commit — the user wants everything we learn saved. Keep
  edits to that file small and additive (other teams may add lines too; re-read before editing).
- Report: what changed per piece, commit hashes, before/after paths, anything left undone.

## Animation and rigging are part of the redo (user: "remember animations and rerigging and stuff")
Redrawing isn't enough: re-rig and re-animate every design in your area.
- Rig: build each character/monster from proper parts with pivots at real joints (hips, knees,
  shoulders, elbows, neck, tail/hair roots, wing roots) and a clear hierarchy, so poses are made by
  rotating/translating parts rather than redrawing loose shapes per frame. Limbs keep their length
  across frames; feet plant on the ground; heads and faces follow the neck pivot.
- Chains: hair, tails, ears, capes, ribbons, tentacles, vines, wings use chained segments driven by
  the body with a per-segment delay (root leads, tip follows), not a single rigid shape.
- Cycles: rebuild walk/fly, idle, attack, hurt and death on that rig with the README's timing
  (contact/passing/up/down poses, held beats, anticipation, smears on fast arcs, overshoot and
  settle, sideways sway in idles); quadrupeds, serpents and flyers get their own proper gaits.
- Gear and attachments ride the rig: weapons, hats, capes and props follow their parent part's
  transform so nothing floats or detaches in any frame.
- Check every pose at 1x and zoomed, and make walk/idle/attack/hurt/death GIFs for every design.

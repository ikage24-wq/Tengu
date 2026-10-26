# Humanoid face brief (queens and maidens)

Read art-brief.md (same folder) for conventions, tools, rules and commit format. This pass is ONLY
about the faces (and the head shape around them) of the humanoid characters. Everything else —
bodies, poses, costumes, frames, sizes, INFO, strides — is approved and must not change.

## User feedback
"the eyes and faces need so much more work … I am mainly talking about the humanoid bosses."
They asked for these characters to be majestic, beautiful, alluring ("sexy to look at"; keep it
tasteful). The face is what sells that, and right now it doesn't.

## What's wrong now (see scratchpad qfaces.png, qfaces2.png, mfaces.png — 6–8x head crops)
- The face is a flat, pale block: square jaw (Lilith's face is a rectangle), no cheek curve, no
  pointed chin, no neck transition, no shading (no shadow cast by bangs onto the forehead/eyes, no
  shadow under the chin/jaw, no soft cheek/skin tone variation).
- Eyes are small and under-built: thin lash line, almost no iris gradient, weak or missing
  catchlights, no lower lashes, no eyelid crease worth reading. Both eyes are drawn the same size
  although the head is in 3/4 view facing right — the far eye must be narrower / foreshortened and
  partly behind the nose bridge line.
- No nose at all; mouths are 1–2 px dark marks; lips have no shape.
- Expressions: hurt is the stock `> <` glyph on everyone; happy/blink are flat arcs; angry only
  recolours the eyes.

## Target
Polished modern anime / gacha chibi-boss faces (think Granblue, Genshin chibi, MapleStory 2,
Azur Lane chibi) rendered crisp at our res. Use WebSearch/WebFetch for references before drawing:
"anime face 3/4 view construction", "anime eye construction iris gradient highlights",
"chibi face proportions", and look at gacha chibi sprites.
- Head shape: soft rounded cranium, cheek curve sweeping to a small pointed chin on the facing
  (right) side; a jaw line on the far side mostly hidden by hair; a slim neck.
- Skin: base + a soft shadow tone under the bangs and along the far cheek/jaw/neck + blush; a
  tiny highlight on the cheekbone.
- Eyes (the main event, each about 1/4–1/5 of face height, larger than now): thick tapered upper
  lash line with a flick at the outer corner (character-specific: Tamamo's red eyeliner wing,
  Lilith's smoky heavy lids and beauty mark, Sylvana's leaf-like lashes, Selene's clean strong
  lashes), a lid crease, an iris with 3–4 values (dark top under lash shadow → mid → light bottom
  glow) plus a pupil (slit for Tamamo, heart for Lilith, round for Sylvana/Selene), a big
  catchlight upper-left and a small one lower-right, short lower lashes. Near eye full width,
  far eye ~70% width, sitting closer to the nose line.
- Brows: thin, elegant, expressive; they carry mood.
- Nose: a tiny shaped hint — a light highlight on the bridge + a small shadow under the tip on the
  facing side.
- Mouth: shaped lips (a darker line + a lighter lower lip with a gloss dot); a confident smile /
  smirk in idle; fangs only where in character (Lilith, angry Tamamo).
- Expressions, per character, acted by the whole face:
  - idle: her personality — Tamamo serene/regal with a sly half-smile, Sylvana gentle/wise,
    Lilith smouldering smirk with half-lidded eyes, Selene calm and resolute.
  - angry: brows sharply down, lids narrowed, irises glow / pupils shrink, mouth open in a fierce
    shout or snarl with shaped teeth, maybe a glow under the eyes.
  - hurt: a real wince — eyes squeezed shut drawn as curved closed lids with lashes (not `><`),
    brows up in pain, mouth open, maybe a tear or sweat drop; different per character.
  - happy: closed-eye smile with lashes and an open smile, blush.
  - blink: proper closed lids with lashes (sleepy curve).
  - dead: closed or swirl/x eyes drawn cleanly with a slack mouth, consistent with the collapse.
- The face must follow the head in every walk / idle / attack frame and pose (heads tilt and move).

## Check
- `node (working folder, not kept) headcrop.cjs <out.png> key1,key2 [moods] [topFraction]`
  renders the head area very large for each mood (default moods idle,angry,hurt,happy,blink,dead;
  topFraction ≈ 0.45 for queens, 0.5 for maidens). Use it every round.
- Also check the full gallery and the game at 1x (maidshot.cjs in the scratchpad spawns designs in
  a map: `GAP=230 node maidshot.cjs sky 1300 tamamo,lilith out.png`). The faces must read at 1x.
- At least 3 critique rounds. Be honest: compare against the references, not against the old art.

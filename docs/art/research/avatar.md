# Research: dress-up avatar games (SELFY, TinierMe, CocoPPa Play)

Area: how long-running anime dress-up games design and ship avatar items (hair, outfits, faces,
hats, held props, stages), as a reference for the hero creator, salon, shop and gear looks. The
player named these two references; study them before any avatar, hair, outfit or cosmetic work.

## Reference sites (named by the player)

- **attrade (selfy-is.fun):** https://attrade.selfy-is.fun/index.php. A fan-run site that keeps
  the SELFY dress-up avatars alive after the official @games / PocketLand services closed. It
  hosts gacha listings with high-resolution item pictures and a dress-up tab (the dress-up part
  needs an old game account). Sources: https://x.com/h_hsel,
  https://forums.lostmediawiki.com/thread/14506/tinierme-dreamselfy-files-partially-lost.
- **CocoPPa Play Wiki (Fandom):** https://cocoppa-play.fandom.com/wiki/CocoPPa_Play_Wiki. The fan
  wiki for CocoPPa Play, a dress-up "fashion show" game on the same SELFY avatar base. Useful pages:
  item themes under https://cocoppa-play.fandom.com/wiki/Category:Appearance, and gacha sets such as
  https://cocoppa-play.fandom.com/wiki/Cute_Style, https://cocoppa-play.fandom.com/wiki/Street_Style
  and https://cocoppa-play.fandom.com/wiki/Precious_Stone_and_Elf_Forest.
- **Access note:** from our tools both sites sit behind a bot check (Cloudflare challenge on
  attrade; Fandom returns 402/403 to fetches), as do the DeviantArt SELFY guides and
  web.archive.org. Don't try to get around those checks. To study the art itself, ask the player
  for screenshots, or use the fan gacha archive at https://www.tumblr.com/cocoppa-items, which
  could be read.

## What we learned (from what could be read)

1. **One avatar base for many years and games.** SELFY is a single base model that GCREST released
   on 1 August 2006. It went through TinierMe (a browser game, 2009), DreamSelfy, CocoPPa Play
   (2014, more than 11 million downloads) and a 2020 Switch game, and the old clothing art was
   reused each time. One well-built base plus an item library outlives any single game. **Tengu:**
   keep one hero rig, and make every new look an item on it (as `hair.js` and `jobgear/` do).
2. **About 15 item slots.** CocoPPa Play has about 15 slots: hairstyle, face (an expression plus a
   makeup set), skin, top, bottom, dress, shoes, hat, face accessory, held or ridden prop, decor,
   stage, wallpaper and frame. Faces are items too (for example "Sweet Smile Face" and "Pompous Face").
   **Tengu:** faces, brows, ears, outfit hats and glasses are already separate pickable parts.
   Held props and a stage or backdrop for the creator preview are slots we don't have yet.
3. **Items ship as themed sets, not one by one.** Each gacha is one theme told in every slot at
   once. For example, *Splash! Summer Soda* has sailor, swim, soda, citrus and penguin motifs:
   - two hairstyles (Two Side Up, Medium Twin);
   - swimwear, a sailor top and dress, and shoes;
   - a boater hat, and props: riding a penguin, a soda with a penguin, citrus;
   - three faces;
   - a stage, a wallpaper and a frame.

   *Le Cocon ver à Soie* is a silk-cocoon royalty set: a queen's long hair, a fluffy bob, queen and
   girly dresses, a prince suit, a crown, a veil, faces, and a cocoon bed and stage.

   **Tengu:** design cosmetics, shop stock and event rewards as small themed sets (hair, outfit,
   hat or prop, colours) that clearly belong together.
4. **Every item comes in 2–5 colourways.** Examples: Medium Twin comes in pink, purple, green,
   yellow and brown; the Frill Swim Wear in red, green and blue. The colours are picked per item to
   suit the theme, not taken from one global palette. **Tengu:** offer curated colourways per
   item, alongside the free colour picker.
5. **Hair is named by its shape and its set.** Examples: Two Side Up, Medium Twin, Fluffy Bob,
   Queen Long Hair and Breezy Pigtails. Each name tells you the silhouette, as our hair rule asks:
   every style has one signature shape.
6. **The look changes when the art owner changes.** In 2021 the SELFY rights went to cocone, which
   said the art style would be updated. Fans noticed, and they archive the old art. **Tengu:** keep
   the look consistent and change it on purpose, across the whole cast at once.

## How CocoPPa draws hair (studied from the official art)

Sources: the official CocoPPa Play account's posts "Cat Hair"
(https://x.com/CocoPPaPlay_cp/status/828484612334587905) and "Candy Hair & Eyes"
(https://x.com/CocoPPaPlay_cp/status/829239875580866562); the images were fetched through
api.fxtwitter.com, which worked. Another reference avatar is at
https://www.kindpng.com/imgv/xwwmbh_cocoppa-play-hair-png-transparent-png/. Reddit's search (403)
and Pinterest's search (rendered by script) could not be read; don't go round them. The player
says many more examples are on X, Pinterest and Reddit, so ask them for screenshots.

1. **Wispy bangs.** Many thin, pointed strands of uneven length (7 or more across the brow), with
   small gaps where the forehead shows. They are often swept from a part on one side, with one
   long lock crossing toward an eye. They are never one solid fringe.
2. **A bell-shaped silhouette.** Medium hair widens below the jaw, and the ends curl outward in
   soft C-curls. Each curl has a darker turn inside it, so the hem reads as a row of curls rather
   than a flat cut.
3. **Thin locks in front of the ears**, hanging to about the chin and curling at the tip.
4. **The shine runs in long streaks** along the flow of the hair, from the crown down each lock:
   several thin, tapered slivers in the light colour. There is no single band across the crown.
   **Tengu:** good for big, close-up art. At sprite size, keep the ring and add 2–4 short
   streaks, as in the cat-ear test.
5. **Shapes made of hair, not accessories.** A big bow tied out of the hair, or cat ears made of
   small coiled buns, each with a spiral crease and its own shine. This fits our
   no-hair-accessory rule.
6. **The inner layer is darker.** Hair seen behind the face and neck is a step darker, the same
   as our rule that back hair uses shadow 1.

## What the reference library teaches (about 430 images; links in [avatar-refs.md](avatar-refs.md))

**Hair (128 items).**
- Each hairstyle is a strong shape: twin drills, giant curls, huge wavy manes, twintails with loops,
  hime cuts, short shaggy cuts, side tails, braids and buns made of hair.
- Very long hair is common, often reaching the knees in big S-waves, and the ends are almost
  always curled or split into points.
- Gradient and two-tone hair is common: tips fading to another colour, streaks, a panel of a
  second colour under the top layer. **Tengu:** a tip colour or underlayer colour option would add
  a lot for little cost.
- Bangs come in many forms: blunt, wispy, side-swept, or long over one eye.

**Outfits (139 items plus 16 design sheets).**
- *Silhouette first.* Skirts are big, in 2–4 tiers of ruffles over a petticoat. Hems are often
  uneven (high-low, fishtail, trains), sleeves are puffed or bell-shaped, and long sashes and
  ribbons stream out as if in wind.
- *Every edge gets a finish.* Lace, frills, scallops, piping or a contrasting band at the collar,
  cuffs and hem. Bows go at the collar, waist and shoes.
- *One theme motif, repeated small.* Strawberry, cherry, penguin, citrus, roses, stars, candy or
  moon. The motif appears in the print, the trims, the props and the hat, so the whole set reads
  as one idea.
- *Colour.* Two or three main colours plus white or cream for the trims, mostly pastel. Dark
  outfits (gothic, punk) use black with one vivid accent (red, purple, neon green). Every outfit
  comes in several colourways.
- *Types that come up again and again:* lolita dresses, sailor and school uniforms, idol and
  magical-girl outfits, gothic and punk sets, maid outfits, Chinese hanfu and qipao, kimono,
  fairy and angel dresses, cosy oversized sweaters and hoodies, streetwear, and suits.
- *Legs.* Striped or lace stockings, garters, and platform shoes or boots with bows or straps.

**Faces and eyes (36).**
- Very large eyes with a gradient iris (darker at the top), two or three white highlights and
  sometimes a star or heart in the pupil.
- Thin, light brows, a pink wash of blush, sometimes freckles, and a tiny mouth.
- Faces are sold as items, with different eyes, makeup and expressions.

**Hats, props and accessories (27).**
- Small tilted hats (boaters, mini top hats) with long ribbon tails; hair flowers and crowns.
- Big props held, ridden or worn: a soda glass you sit in, a swim ring, a penguin, citrus slices,
  wings and halo-like back pieces.

**Stages and backdrops (15).**
- Each set comes with a matching wallpaper, floor and frame, shown behind three silhouettes, so
  the avatar always stands in a themed scene.

**Full coordinates (57 player looks).**
- Players finish a look with a themed backdrop, matching effects (petals, sparkles, bubbles)
  and a pose. The whole picture shares one colour key, either light and pastel or dark and rich.

**Tried and dropped: CocoPPa eyes at sprite size.** A close-up painted test face (brown feathered
lashes, glowing pale iris bottom, freckles) drew well, but scaled down to our sprite eyes it turned
into muddy blobs: the soft gradients and fine lashes need far more pixels than a chibi sprite has.
The player chose to keep our own face style. Borrow only single ideas from these faces, never the
whole look.

## The body the player wants (Sakuemon-style curvy chibi)

The player's "dream body" reference is Sakuemon's pixel sprites (same source as in
[anim.md](anim.md)). Its proportions:
- **Height:** about 3 heads tall: a big head with big hair, a short torso, and legs about one head
  long.
- **Curves:** a defined bust, a narrow waist, and hips wider than the shoulders.
- **Legs:** soft full thighs that touch and stay full most of the way down, then taper fast to
  slim calves, thin ankles and small shoes.
- **Stance:** knees turned in a little, weight on one leg.
- **Rendering:** crisp 1 px dark outlines and chunky 3–4 tone shading, with lots of costume
  detail (folds, frills, coats).

A still test body in these proportions was drawn on a scratch copy (not in the game). Bringing it
in would mean redoing the rig, the walk, run and attack poses, and every outfit.

## To do with this reference

- [x] Gather a reference library: 128 hair, 139 outfits, faces, props, stages and full looks
  (see [avatar-refs.md](avatar-refs.md)).
- [ ] Try a two-tone hair option (tips or underlayer in a second colour).
- [ ] Try a first themed set (for example a summer-soda set: hair, outfit, hat, a prop and
  colourways) as a shop or event set.

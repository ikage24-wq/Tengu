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

## To do with this reference

- [ ] Get screenshots from the player of SELFY / CocoPPa hair and outfits, and measure them:
  hair volume against head size, clump count, how the shine is drawn, and line colour.
- [ ] Try a first themed set (for example a summer-soda set: hair, outfit, hat, a prop and
  colourways) as a shop or event set.

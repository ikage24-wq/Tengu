# Redo pass: status (resume from here)

The redo pass (see `redo-pass.md`) was stopped early because of a usage limit. Done and committed:

- Gear and weapons: material shading under one light, hue-shifted ramps, capes/skirts as chains,
  weapons growing every tier, weapon icons per rank. Weapons in hand now render at body resolution.
- Map props, landmarks, scenery: auto-lit props, foliage, wind poses, swirling portals.
- Summons: Guardian Angel, Frost Sprite, Venom Salamander, Thunder Hawk re-rigged; Seraphim staff.
- Hero rig: kit eyes, skin and hair ramps, clumped bangs, selective outlines, walk vs run gaits with
  planted feet, hair chain, held idle beat, hurt wobble, knocked-out pose; townsfolk eye/hair contrast.
- Meadow monsters (all five) and the Basilisk Hatchling: rigs, chains, ramps, form shadows.
- Ruins: Will-o'-Wisp, Imp, Dullahan, Gem Mimic, Crystal Golem.
- Hollow: Root Imp, Myconid Shaman, Bramble Bear, Spore Mite.

## Still to do
- Monsters not yet redone (old faces/rig): Manticore Cub (scorpip), Dryad (leafling — skin blends
  into her green hair), Warg (boarlet), Treant (mossgolem — use glowEye) in `mobs/wilds.js`; Wraith
  (shade) in `mobs/ruins.js` (the old helpers `xf`, `mv`, `rot` and `INK`/`MOUTH` imports stay only
  for it); Pegasus Foal, Sky Harpy, Star Seraph in `mobs/sky.js`; Corrupted Sapling in
  `mobs/hollow.js` (old helpers kept only for it).
- Bosses in `mobs/bosses.js`, untouched: Myconid Queen (use heroine.js for her face), Tuskar,
  Gnarlroot, Prismaris.
- Icon pass (`icons/items.js`, `icons/skills.js`): Basilisk Scale vs Dryad Leaf look alike; Fox
  Fluff and Star Pebble low contrast; Shining Ray and Holy Bolt gold on gold; Frost Sprite skill icon
  no longer matches the fairy summon; the Seraphim bag icon's halo reads as a hat.
- Gear: archer t15–19 leaf frill engulfs the head; mage t17–18 muddy grey wings; check job-gear bag
  icons at 1x; accent-colour audit per piece.
- Hero: critique rounds on attack/jump/climb/death motion; a player death pose (drawn in scene.js);
  head tilt; capes on two springs; sparkle extras on excited/sassy faces get grey outlines; lighter
  bangs band on dark skin.
- Rough spots on finished designs: Root Imp's wind-up arm hides behind the body; Spore Mite legs
  heavy at 1x; Bramble Bear joints angular; Dullahan armour shapes round and merged; Dullahan smear
  and Imp spark clipped at the sprite edge; Kitsune chest shading stripy; Jackalope dead pose upright;
  Tortoise tail a stub.
- Not done for any team: a full three critique rounds, after-GIFs, and 1x checks in real maps.
- Thunder Hawk has no skill that summons it.
- Props: town buildings in `town.js` (stalls, halls, kiosk, office, fountain, adobe, hanging sign —
  the sign should swing with the wind) and dungeon props in `dungeon.js` (glowcap, cage, seal,
  chest, key) only got automatic shading; backdrop far/mid silhouettes not redone; waterfall and
  pond water colours still old; check rectangle-heavy props for hard shadow strips from the
  automatic shading (clouds needed hand shading). Shared prop kit: `src/render/propkit.js`.

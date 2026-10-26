# Redo pass: status (resume from here)

The redo pass (see `redo-pass.md`) was stopped early because of a usage limit. Done and committed:

- Gear and weapons: material shading under one light, hue-shifted ramps, capes/skirts as chains,
  weapons growing every tier, weapon icons per rank. Weapons in hand now render at body resolution.
- Map props, landmarks, scenery: auto-lit props, foliage, wind poses, swirling portals.
- Summons: Guardian Angel, Frost Sprite, Venom Salamander, Thunder Hawk re-rigged; Seraphim staff.
- Hero rig: kit eyes, skin and hair ramps, clumped bangs, selective outlines, walk vs run gaits with
  planted feet, hair chain, held idle beat, hurt wobble, knocked-out pose; townsfolk eye/hair contrast.
- Meadow monsters (all five) and all of the wilds: Basilisk Hatchling, Manticore Cub, Dryad (warm
  skin now apart from her green hair), Warg, Treant (glowEye embers): rigs, chains, ramps, form shadows.
- Ruins (all six): Will-o'-Wisp, Imp, Dullahan, Gem Mimic, Crystal Golem, Wraith (rig, chained hem,
  peak and chains, glowEye in a lopsided hood opening, bone claws; old helpers removed). Ruins.js
  now exports its rig and motion helpers (put, pivot, chain, beat, ik, gait, ...) for other modules.
- Sky (all three): Pegasus Foal (IK prancing trot, kit eye/mouth), Sky Harpy (fast-down wingbeat,
  kit eyes/mouth, crown highlight band), Star Seraph (kit eyes with star pupils, three-tone halo,
  wing ripple). Shape counts run ~270 per frame (feathers), a little over the 240 budget.
- Treant: the slam now reaches the ground (trunk lean plus the shoulder rolling down).
- Hollow (all five): Root Imp, Myconid Shaman, Bramble Bear, Spore Mite, Corrupted Sapling (trunk
  chain, planted roots, branch and leaf chains, glowEye knot holes; old helpers removed). Hollow.js
  now exports its rig, ramp and shape helpers.
- Bosses: Myconid Queen (heroine.js face, veil/robe/hair chains, staff rides the hand, held
  wind-up with a floor ring telegraph) and Tuskar (IK gallop with planted hooves, flame mane and
  tail chains, glowEye, rear-and-stomp), both on the hollow rig.

## Still to do
- Sky designs still place feathers in absolute coordinates (wings are not yet
  chains); trim their shape counts.
- Bosses in `mobs/bosses.js` still old: Gnarlroot, Prismaris (they keep the transform stack).
  Queen/Tuskar rough spots: Tuskar's body is blocky and its flames read a bit like spikes; the
  queen's face is small under the cap.
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

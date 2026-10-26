# Redo pass: status (resume from here)

The redo pass (see `redo-pass.md`) was stopped early because of a usage limit. Done and committed:

- Gear and weapons: material shading under one light, hue-shifted ramps, capes/skirts as chains,
  weapons growing every tier, weapon icons per rank. Weapons in hand now render at body resolution.
- Town buildings and dungeon props, hand-shaded on the prop kit (no automatic shade, so no hard
  strips down walls): stalls (lit awning stripes, valance scallops as a wind chain), guild halls
  (stone or plank walls, shingled gables, eave shadows, banners as chains), kiosk (a notice lifts
  in gusts), office (clapboard), adobe (beam-end shadows, deep-set door), fountain (stone basin,
  spreading rings, flowing sheets), hanging sign (swings from its pivot with the wind); glowcap
  (pulsing spots), cage (bark roots, stone plinth, iron padlock), seal (bark roots, carved stone
  ring with runes lighting in turn), chest (plank grain, 3-step gold, iron caps), key (bark, glint).
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
  tail chains, glowEye, rear-and-stomp), both on the hollow rig. Tuskar's tail now swings down to
  stay inside the sprite when rearing.
- Bosses: Gnarlroot (three-joint trunk over planted stepping roots, root-tentacle arm chains with
  claws, branch and twig chains, beating heart in a glowing bark split, glowEye amber hollows,
  coiled held wind-up with floor glow telegraphs, arms driven to the floor with held root-spike
  impact) and Prismaris (IK digitigrade stomp, wing spars as chains with transparent-gem crystal
  panes, tail chain with crystal spines, faces.js slit eye, crown and scepter ride the rig, held
  overhead charge with a floor telegraph, one-arc slam into a held crystal burst). The old
  transform-stack helpers in bosses.js are gone; all four bosses use the hollow rig.

- Icons: Basilisk Scale is now a jade-teal hexagonal scute (keel, growth ridges, gloss) and Dryad
  Leaf a warm spring green with a brown stem; Fox Fluff apricot with a deeper pink tip; Star Pebble's
  stone is dark periwinkle under a gold star; Holy Bolt (storm tile) and Shining Ray (steel tile,
  gold star) no longer gold on gold; Frost Sprite skill icon redrawn as the ice-winged fairy; the
  Seraphim bag icon is a winged staff (no halo). One critique round.
- Gear: archer t15–19 back wings root lower and sweep out sideways (shorter), temple wings on
  t16–19 shorter and upright, so face and hair read; mage t17–19 wings use a clean hue-shifted
  ramp built from the set's own hue (`wingRamp` in mage.js) instead of grey. One critique round.

## Still to do
- Sky designs still place feathers in absolute coordinates (wings are not yet
  chains); trim their shape counts.
- Boss rough spots: Gnarlroot and Prismaris had one critique round only (no GIFs); Prismaris'
  dead pose and wing panes could use another look; the queen's floor ring dips ~1.5 px below the
  sprite in attack 1. Queen/Tuskar: Tuskar's body is blocky and its flames read a bit like spikes; the
  queen's face is small under the cap.
- Gear: check job-gear bag icons at 1x; accent-colour audit per piece.
- Hero: critique rounds on attack/jump/climb/death motion; a player death pose (drawn in scene.js);
  head tilt; capes on two springs; sparkle extras on excited/sassy faces get grey outlines; lighter
  bangs band on dark skin.
- Rough spots on finished designs: Root Imp's wind-up arm hides behind the body; Spore Mite legs
  heavy at 1x; Bramble Bear joints angular; Dullahan armour shapes round and merged; Dullahan smear
  and Imp spark clipped at the sprite edge; Kitsune chest shading stripy; Jackalope dead pose upright;
  Tortoise tail a stub.
- Not done for any team: a full three critique rounds, after-GIFs, and 1x checks in real maps.
- Thunder Hawk has no skill that summons it.
- Props: backdrop far/mid silhouettes not redone; waterfall and pond water colours still old.
  Shared prop kit: `src/render/propkit.js`.

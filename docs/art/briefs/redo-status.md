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
  wing ripple).
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

- Backdrops, water, scenery buildings: far silhouettes flat with a lit upper-left rim and a
  simpler ridge behind (hills, treetops, mesas with strata, broad-crowned grove trees, columns,
  crystals, houses); waterfall and pond water on per-map hue-shifted ramps (meadow sky blue, woods
  teal, ruins periwinkle, cave cyan) with sliding light bands, a lit lip, reflections, drifting
  light and lily-pad ripples; scenery houses, mushroom house, tents, treehouse and the forge (with
  an anvil) hand-shaded on the prop kit (clapboard, shingled gables, stone chimneys, eave shadows,
  lit trim, bark trunk). `wallShade`/`beam`/`gable` moved to propkit. One critique round.

- Polish sweep: monster sprites take a per-design `pad` (margin left, right and above the w x h box,
  feet and centre unchanged; `pad` in the ART entry, default 4) so swords, staffs, wings, tails and
  smears are no longer clipped (Gnarlroot arms, Dullahan sword, Imp trident, Wraith, Myconid
  staff, Selene, Yuki-onna, ...); a probe found no clipped side or top edge left. Queen's floor
  ring raised inside the sprite. Jackalope dead pose lies flat, chin down; Tortoise tail a tapering
  three-link chain; Kitsune ruff and chest one cream bib; Root Imp's wind-up arm cocked back across
  the body with claws past the head; Spore Mite legs thinner. Far hollow roots and cave stalactites
  get the lit upper-left rim; veiled backdrop sprites (mid and far layers) have their outline ring
  pulled toward the fill (`softenRim` in scenery.js). Thief hoods with tattered edges (Wraith Mask,
  Specter/Nightmare Visage) drew nothing (NaN points); fixed for the bag icons and the hero.

- Monster/boss rough spots: sky wings are chains (shoulder > forearm > hand, each link trailing
  the stroke by `lag`; Seraph wings a two-link spar whose leading feathers trail most), frames
  back to ~205-250 shapes; Tuskar a round humped barrel with lit shoulder and hip planes, crease
  lines, rounded thighs and knees, flames as bulb-rooted tapering tongues with an S-flicker, a
  side lick and a breaking ember (`tongue`, `blob` in bosses.js); Queen face at full heroine
  scale (QK 1) under a raised cap; Prismaris panes are two clean facets plus an edge glow and one
  straight glint, and dead it slumps onto its belly with wings folded down over its back, panes
  dulled; Bramble Bear knees and elbows bend through a curve with a joint pad; Dullahan pauldrons
  are stacked flat lames with gap lines, knees and elbows pointed two-facet cops, a breastplate
  ridge and plackart line. One critique round.

- Rough spots and hero items: Kitsune tails are one smooth plume each (Chaikin-rounded chain,
  one shadow crescent down the underside, edge tufts, a V-notched cream tip), no more blotches;
  Jackalope's dead hind legs stretch out behind past the tail with a sole pad. The player now
  falls when knocked out (`town.js` `drawFallen`, shared with downed party members: knocked up
  and back, a bounce with dust, lying still, a ghost rising out). Hero head rolls about the neck
  (idle weight shift, hurt snap-back, knocked-out loll). Capes hang on two springs (root plus a
  softer hem chasing it). Face sparkles and monster impact stars take a gold outline (`line` on a
  shape, `sparkLine`) instead of grey. Deep skin gets darker (not just redder) shadows, so the
  bangs band no longer reads lighter; dark hair's angel ring is a hue-shifted sheen, not grey.
- Bag icons: near-black gear (demonic, cyber, dark thief bottoms and shoes, dark endgame weapons)
  takes a monotone value lift in icons only (`icons.js` `liftTone`) and reads at 1x.
- Thunder Hawk is now the archer's summon skill (`thunderhawk`: physical lightning feathers),
  with a hand-drawn icon and a test.

## Still to do
- Boss rough spots: Gnarlroot and Prismaris had one critique round only (no GIFs).
- Gear: accent-colour audit per piece.
- Hero: critique rounds on attack/jump/climb motion.
- Not done for any team: a full three critique rounds, after-GIFs, and 1x checks in real maps.
- Props: shared prop kit is `src/render/propkit.js`.

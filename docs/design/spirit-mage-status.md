# Spirit Mage: build status

The new magic class (first job at 10, taught by Elowen). It branches at 30 into the Shrine Maiden
(full support, one humanoid companion) and the Onmyoji (damage, a band of humanoid shikigami,
each with its own body and rig; never reuse Snow Wolf). Everything is new art and parts.

## The player's choices so far

- Casting is a kagura shrine dance: big, flowing, a bell staff (wand) and a folding fan.
- The Spirit Doll is an imp (mischievous), always with the Spirit Mage, with her own little moves.
- Wands and staves were redrawn as shrine tools (kagura suzu, gohei/shakujo); the old ones retired.
- Finisher: Heaven's Lantern (a giant paper lantern; its rays strike monsters and heal the party;
  the doll rides on top cheering).
- Her skills: Spirit Wave (a ring of light both ways), Blessing (party heal: a column of light,
  then regen), Spirit Ward (a barrier on her and the party), Mana Mastery (passive).
- The doll's tricks are all her own: the Spirit Mage never orders her (Doll's Mischief was made
  and then removed at the player's ask; its ride became the doll's Rodeo). She should be fluid,
  smooth and expressive, and funny.

## Done

- The job, the Spirit gauge (Kami's Favour when full), HUD bar, aura, icons for the first skills.
- The shrine-dance basic combo with a pool of strings and command casts; Spirit Bolt; Spirit Step.
- The Spirit Doll: floating, idle pranks, fan slap / streamer twirl / bell bonk, moods.
- Effect art: bolt, hit, wave, blessing, ward, step, pillar, emblem, aura, lantern, doll tricks.
- New shrine wands and staves (every tier and endgame design).
- The dance, as the player chose it: about 1 s a figure (each cast hits harder so her damage per
  second holds), no spins (a turn is a mirror flip, which jars in a slow dance; the fan circles
  instead), soft sine easing and gliding legs, longer blends between figures. Its style is grounded
  kagura (`DANCE_STYLES.grounded` in render/moves.js): feet slide flat in long gliding steps, a tall
  stance with soft knees, big bold staff and fan sweeps, bells that ring all through, a fan that
  folds and snaps open with each cast, and a rise onto her toes on the finishers and the up cast.
  The float and ribbon samples stay on the dev page (tools/spiritmage.html ?style=).
- Stage 2: Spirit Wave, Blessing, Spirit Ward, Mana Mastery and Heaven's Lantern, each a dance
  figure of her own (kaguraslam, kagurabless, kaguraward, kaguralantern), with icons, effects and
  tests. Blessing and Ward land as `grant` strikes (world/melee.js); the lantern lives in
  world/spiritdoll.js with the doll perched on top; the ward shows as a sphere on her (buffs.js).
- The doll: eight tricks of her own (Fan Slap, Streamer Twirl, Bell Bonk, Dropkick, Paper Charm,
  Akanbe, Rodeo, Spitball Volley), chosen by range. Reanimated: every part of her pose rides a
  slightly under-damped spring (`follow` in render/spiritdoll.js), she steers in curves, banks
  into her flight, and her head and hair trail her body. She cheers at a Blessing or a Ward.
- The dev page plays any skill: tools/spiritmage.html ?skill=<id> (and ?behind for a dummy behind).

- Polish and wiring: ward spheres on party members and a burst when a ward breaks; Heaven's
  Lantern hangs lower and smaller; sounds for her dance, skills and every doll trick (suzu bells,
  celesta chimes, a choir for the lantern, a pff and a splat for spitballs; audio/recipes.js);
  bots can be Spirit Mages and fight with her dance; she takes the healer's seat in dungeons
  (roleOf: the mage family heals), and the finder recruits her there, healing with Blessing and
  warding the tank with Spirit Ward; README and docs/art/README.md.

## Next

1. Demo videos of every skill for the player (GIFs so far), and a look in a real dungeon run.
2. The 30 trial and the two paths: planned in docs/design/spirit-mage-paths.md (the player chose
   a kitsune shrine guardian for the Shrine Maiden, a yokai troupe that's always out for the
   Onmyoji, and the doll growing up on each path).
3. Bot Spirit Mages have no doll of their own (the doll is the player's world.doll); give them one
   if the player wants.

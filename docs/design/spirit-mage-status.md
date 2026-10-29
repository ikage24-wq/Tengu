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
- Skills to build: Spirit Wave, Blessing (party heal), Spirit Ward (barrier), Doll's Mischief
  (order a big doll trick), Mana Mastery (passive).

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

## Next

1. Stage 2: the skills above and Heaven's Lantern, as timed dance steps; the doll reacts to them.
2. Wiring: sounds, bots and party play (healer seat), dungeon roles, tests, README and art docs,
   demo videos of every skill.
3. Then the 30 trial and the two paths (Shrine Maiden, Onmyoji): ask the player about the
   companions first.

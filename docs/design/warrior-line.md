# The Warrior line: Warrior, Paladin, Berserker

The first job and its two paths. Their moves, combos and skills live in `src/render/moves.js`,
`src/world/melee.js` (`PATH_COMBOS`, `PATH_VARIANTS`, `SWINGS`, the command moves) and
`src/data/skills.js`; their effects in `src/render/warrior-fx.js`.

## Footwork and effects pass (2026-11-04)

The Starlight Idol treatment, done in each path's own idiom (`FOOTWORK` and `STEP_STYLES` in
`src/render/moves.js`):

- **Warrior: the skip.** A cocky skip into each swing, front knee up and back heel kicked, landing
  in a wide stamped plant on the blow, then a bounce on the toes. The leaping finishers leap
  higher.
- **Paladin: the march.** A knight's measured advance: the front knee raised high and stamped down
  as the blow lands, the shield side driven in behind it, one firm settle. Shield Rush (the skill)
  is a march of four stamps behind the wall of light. No hops for their own sake.
- **Berserker: the bound.** Wild bounding leaps with both legs flung back, crashing down into a
  deep crouch that rocks him forward, then a heavy shoulder heave. Rampage hops into each of its
  three cleaves.
- Every step carries further (combo `step` about 1.6 times what it was for short steps) and the
  basic strings, pools and command moves are about a tenth quicker. The long skills were trimmed
  too: Titan Breaker 1.5 to 1.38 s, Grand Verdict and Crimson Eclipse 1.6 to 1.46 s, Rampage 1.45 to
  1.32 s, Hallowed Ground, Shield Rush and Reckless Charge by about 7%. The pace test still holds.
- Every move ends in two settle bounces after its held end pose instead of freezing.

Effects, measured against the hits' reach:

- Titan Breaker: the ground split drew 84 px each way against a 170 px reach; cracks now race on
  from both ends of it to about 152 px. The falling steel sword is a fifth bigger.
- Grand Verdict's sword of light (94 to about 130 px tall) and Crimson Eclipse's axe of fire (97 to
  about 130 px) and claw marks (47 to 62 px half-width) match the size of the blow.
- Crimson Eclipse's thrown axe circling at 95 px was a 19 px speck; now about 31 px.
- The Paladin's shield flare on a bash is a fifth bigger.
- The big rings (Titan Breaker, Grand Verdict, Crimson Eclipse, Hallowed Ground, Rampage) already
  ran out to their reach and were left as they were.

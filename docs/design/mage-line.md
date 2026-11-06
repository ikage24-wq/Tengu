# The mage line: the Mage, the Sorcerer and the Cleric (replaces the Star Witch, Starlight Idol and Astronomer)

The player's picks (2026-11-06): "right now we need an actual mage and healer" (the Kitchen Witch
is shelved for later, docs/design/kitchen-witch.md). A classic elemental Mage as the first job,
who casts and heals a little; at 30 she becomes the **Sorcerer** (damage) or the **Cleric of light**
(the healer). Ids kept so saves, Elowen's trial, the dungeon healer and the paths carry over:
`spiritmage` (the Mage), `onmyoji` (the Sorcerer), `shrinemaiden` (the Cleric). Held to the Wind
Dancer standard (CLAUDE.md) and built by the job recipe (docs/design/making-a-job.md).

## The Mage

- **Fantasy:** the classic elemental sorcerer: fire, ice and lightning from a wand or a staff.
- **Personality (the player's pick): a dramatic edgelord.** She names every spell like a chosen
  one ("Behold... INFERNO OF THE ABYSS" for a small fireball), strikes villain poses, and keeps one
  dramatic glove on. A parody of the anime cliché of the dark-power show-off; underneath she is
  sincere and kind (the sincere beat in her stories).
- **Look (the player's pick): the classic wizard.** A big pointed hat, flowing robes and a cape,
  a staff with a glowing orb. (The mage gear ladder already draws this.)
- **Gauge (the player's pick): Element Weave.** Casting a different element from the last one
  builds it, so mixing spells is rewarded; it fades once the fighting stops. Full (**Overload**):
  every spell carries all three elements at once. Her finisher, a meteor, needs it full and spends
  all of it.
- **Weapons:** a wand (quick: bolts of fire, shards of ice, sparks) and a staff (heavy: fireballs,
  ice spikes from the ground, lightning strikes).

- **Colour (the player's pick): crimson** and gold robes. Her fire leans orange-gold with white-hot
  cores and dark outlines so it never melts into the robes; ice is pale blue, lightning yellow.
- **Her edgy touch (the player's pick): one dramatic glove**, black and fingerless with a little
  rune on the back, on her casting hand; she flexes it before big spells.
- **Kit (the player's pick: "more dramatic"):** every spell gets a villain pose and a shouted name,
  and the big ones a short wind-up speech, never slower to cast.
  - Wand: an ember flick (fire bolt), a backhand frost lash (a fan of ice shards), a dramatic
    gloved point (a lightning bolt through the line). Pool: a villain-laugh cast, a twirling cast,
    a cape-swirl cast.
  - Staff: a fireball thrust, a planted strike (ice spikes burst from the ground under them), the
    staff raised for a lightning strike from the sky. Pool: an overhead fire slam, a spinning cast,
    a two-handed thunder slam.
  - Commands: sparks up at fliers, ice rained down from the air, a cape-swirl slide with a fire trail.
  - Skills (ids kept): Fireball, Chain Lightning, Frost Nova, Teleport, Heal (she grumbles it's "too
    bright"), Magic Guard, Mana Mastery, and **Meteor**, the finisher (full Overload): she flexes the
    glove, announces "CATACLYSM OF THE CRIMSON STAR", and a meteor crashes down on everything ahead.

## Status

- 2026-11-06: picks recorded; look samples (`tools/mage-looks.html`, docs/design/samples/mage-looks.png).
- Her wand and staff (render/weapon-designs.js `arcaneWand`, `arcaneStaff`, the 'arcane' finish,
  given to her plain wands and staves in render/hero.js): a short dark rod with a violet crystal
  shard, and a gnarled staff whose wooden claws hold an orb swirling with fire, ice and lightning.
  (Tiers above 10 still use the old top-tier forms; to redo with the ladder.)
- Her glove (render/gear.js `glove.edge`, `edgeGlove` in render/hero.js): black, fingerless, a
  crimson rune, on her free hand.
- Her moves (render/moves.js `mg*` wand, `ms*` staff, faces `MG_FACE`): mgember, mgfrost,
  mgthunder and the pool mglaugh, mgtwirl, mgcape; msfire, msspike, msbolt and the pool msslam,
  msspin, msthunder; commands mgup, mgair, mgdash, msup, msair, msdash. Every pose checked clear of
  her face in strips.
- Her strings (world/melee.js, keys `starwand`, `starstaff`): every shot carries its element (`el`)
  for the Element Weave; the staff's lightning falls straight down from the sky (`mgsky`).
- Her effects (tools/fx-art.js, the Mage section; palettes MFIRE, MICE, MBOLT, MRUNE): `mgfire`,
  `mgfireball`, `mgice`, `mgspike` (spikes bursting out of the ground along the line), `mgbolt`,
  `mgsky`, and a hit mark per element (`mghitfire`, `mghitice`, `mghitbolt`), each opened by her
  crimson rune ring.
- Element Weave (world/melee.js `addSpirit` for the Mage, `WEAVE_NEW`, `WEAVE_SAME`): a hit of a new
  element (fire, ice, lightning, or a heal as light) builds it fast, the same one barely; full,
  Overload sends the other two elements along with every spell (`OVERLOAD_PCT`). On the HUD as
  Element Weave; her aura is three element orbs circling her (`celmgorb`), over her crimson rune
  ring at Overload (`celmgrune`).
- She shouts the name of her finishers and skills (`MAGE_SHOUTS`, never the same line twice running).
- Skills (ids kept, data/skills.js): Fireball (`spiritbolt`), Teleport (`spiritstep`), Chain
  Lightning (`spiritwave`), Frost Nova (new, `frostnova`: freezes all round her), Heal (`blessing`),
  Magic Guard (`spiritward`), Mana Mastery, Meteor (`heavenslantern`, the finisher). Their moves
  (`mgfireball`, `mgteleport`, `mgchain`, `mgnova`, `mgheal`, `mgguard`, `mgmeteor`), effects
  (`mgswirl`, `mgheal`, `mgguard`, `mgnova`, `mgcircle`, `mgrock`, `mgimpact`, her own reach ring
  `shockcrimson`) and icons (render/icons/skills.js, crimson tiles). Recorded in the game:
  docs/design/samples/mage-skills.gif.
- Her glove sits on her casting hand (the free hand can't reach in front of her body to show it).
- Still to do: sounds of her own, bots and party lines, the gear ladder's top tiers for her wand and
  staff, the README; then the Sorcerer and the Cleric.

# The mage line: the Mage, the Sorcerer and the Cleric (replaces the Star Witch, Starlight Idol and Astronomer)

The player's picks (2026-11-06): "right now we need an actual mage and healer" (the Kitchen Witch
is shelved for later, docs/design/kitchen-witch.md). A classic elemental Mage as the first job,
who casts and heals a little; at 30 she becomes the **Sorcerer** (damage) or the **Cleric of light**
(the healer). Ids kept so saves, Elowen's trial, the dungeon healer and the paths carry over:
`spiritmage` (the Mage), `onmyoji` (the Sorcerer), `shrinemaiden` (the Cleric). Held to the Wind
Dancer standard (CLAUDE.md) and built by the job recipe (docs/design/making-a-job.md).

## The Mage: the Spell Juggler (remade again, 2026-11-07)

The player rejected the whole line as reskins ("reskinned with 0 effort") and judged jobs only on
moves, effects and play ("I DO NOT CARE ABOUT THE OUTFITS AND WEAPONS"). Their pick for the Mage:
the **Spell Juggler**.

- **Orbs** (world/juggle.js): in a fight fire, ice and spark orbs pop into being one after another
  and circle her waist (render/juggler.js), up to five (seven with Sleight of Hand). Every attack
  flings the oldest one as that element (world/melee.js `orbStrike`, `orbThrow`); a miss flies out
  and curves back into her hands; with empty hands she snaps a weak palm spark. The orbs' elements
  set off her reactions, drawn as her orbs colliding (`jgrx*`: a mist spout, a crystal star, a
  firework).
- **Attacks** (render/moves.js `jg*`): wand toss, sidearm whip, hop-and-spin release (pool:
  behind-the-back flick, heel kick, flurry; commands: juggler's pop, volleyball spike, knee slide);
  staff bat, keepy-uppy volley, overhead smash (pool: cue shot, tennis serve, baton twirl;
  commands: pole vault, dunk, staff scooter).
- **Skills** (ids kept): Fountain (`spiritbolt`: every orb thrown up, raining down ahead), Ricochet
  (`spiritwave`), Cartwheel Toss (`spiritstep`: orbs flung ahead and behind), Hot Potato
  (`frostnova`: a huge orb bowled bouncing along the floor), Encore (`blessing`: the heal; catches
  her orbs home and refills her orbit), Spinning Plates (`spiritward`: the barrier), Sleight of Hand
  (`manamastery`: faster orbs, more of them), and the finisher Grand Finale (`heavenslantern`: the
  orbs juggled into a ring overhead and hurled, great orbs raining, one firework setting off every
  reaction).
- Effects: tools/fx-art.js, the Spell Juggler section (`jg*`). Her paths (the Sorcerer, the
  Cleric) are to be rebuilt the same way, each with its own moves and effect language.

## The Sorcerer: the Meteor Caller (remade again, 2026-11-07)

Rebuilt on the same rejection of reskins (id `onmyoji` kept). Her basic spell is charged
(world/melee.js `callerBasic`, `tickCaller`, CALL_* numbers): a tap flicks a star-spark; held, she
gathers (render/moves.js `mcgather`, walking at CALL_WALK) and letting go calls a comet down from
high above (CALL_TIERS[1]) or a burning meteor that leaves a crater and a ring of shock
(CALL_TIERS[2]); held to CALL_MAX it goes off by itself. Charged hits fill Starfall (internally
Binding); full (STARSTORM), every tap calls a meteor at once. Her reactions are her own small star
and ember bursts (`mcrx*`) and her chains are violet starlight.

- Her Mage skills her way (`paths.onmyoji`): Meteor Shower, Shooting Star (her blink), Comet Lance,
  Gravity Well (stuns), Starlight (the heal), Orbit Shield (the barrier), Meteor Storm.
- Her own: Stargazer's Lore (passive), Starfall Barrage, Black Hole (the gravity well engine,
  world/astro.js, drawn as `mchole`), Stargazer (magic up, charges gather faster: `quickCall`,
  Starfall fills faster), and the finisher Extinction (the sky opening, `mcsky`, then a colossal
  impact, `mcextinctfx`).
- Moves `mc*` (render/moves.js), effects `mc*` (tools/fx-art.js, the Meteor Caller section).

## The Mage (remade from scratch, 2026-11-06)

The player found the first build (the edgelord, Element Weave) not as fun as the other jobs and
asked for the Mage to be remade from scratch: new look, moves, effects, everything (ids kept). Picks:

- **Elements:** still fire, ice and lightning.
- **Personality: a pyro gremlin.** A gleeful, slightly unhinged magic-school dropout who loves
  blowing things up: she cackles, overcharges spells, and her hat keeps getting singed.
- **Look: a battle mage, in crimson** (render/jobgear/battlemage.js over the mage ladder): a short
  open coat over her robe, a belt of three spell vials (fire, ice, lightning), a scroll satchel on a
  strap across her chest, a flame-orange scarf with a burnt end, buckled boots, the mage hat with
  brass goggles strapped round it and its tip scorched black with an ember, and a rune gauntlet on
  her casting hand (render/gear.js `glove.edge`). Samples: tools/mage-looks.html.
- **Core hook: element reactions** (world/reactions.js). Every spell that lands leaves its element
  on the monster for MARK_TIME (a sigil over its head, `rmfire`/`rmice`/`rmbolt`). A different
  element reacts and uses the mark up: fire + ice **Steam Blast** (a scalding cloud hits all round,
  `rxsteam`), ice + lightning **Shatter** (a big stunning crit, `rxshatter`), lightning + fire
  **Kaboom** (a blast that jumps to the monsters near, `rxkaboom`, `rxjump`). Her gauge, **Mayhem**
  (internally Spirit), barely builds from plain hits and fills from reactions; full (**MELTDOWN**),
  every spell she lands reacts, and her finisher is ready.
- **Basic attacks: a ranged caster** (bolts, shards and strikes from range, wand or staff).
- Built so far: the look, the reactions, marks and Mayhem (tests in tests/melee.test.js), and her
  attacks (render/moves.js `pm*` wand and `ps*` staff, faces `PM_FACE`; a raised staff or wand goes
  behind her head, `raisedBehind`). Wand string pmflick (hip flick, `pmspark`), pmpitch (snowball
  pitch, `pmshard`), pmjab (cattle prod, two little `pmzap`s and a big one); pool pmnolook, pmtwirl
  (gunslinger twirl), pmjam (jammed wand); commands pmup, pmair, pmdash (fire-rocket skid). Staff
  string psgolf (golf swing, the grinning bouncing fireball `pmbomb`), pspogo (pogo slam, `pmspike`),
  psrod (lightning rod, `pmstrike` from the sky); pool psbat (home run), psskate, psconduct; commands
  psup (vault), psair, psdash (broomstick ride). Hit marks `pmhitfire`/`pmhitice`/`pmhitbolt`. Her old
  edgelord shouts are gone, and reactions show no words.
- Her skills (ids kept; data/skills.js, moves `pm*`): Overcooked Fireball (`spiritbolt`, pmbig: a
  fireball that keeps growing, heaved and shoved, `pmhuge`), Blink Bang (`spiritstep`, pmblink: a
  firecracker pop, `pmpop`), Live Wire (`spiritwave`, pmwire: she grabs the wand like a live cable,
  `pmwire`), Frost Flop (`frostnova`, pmflop: a belly flop, ice bursting up both ways, `pmnovafx`),
  Campfire Break (`blessing`, pmcamp: the heal, a campfire with a marshmallow, `pmcamp`), Scroll
  Shield (`spiritward`, pmscroll: scrolls whirling round the party, `pmscrolls`), and the finisher
  Big Bad Kaboom (`heavenslantern`, pmkaboom: she drinks her three vials, rains grinning fireballs,
  snowballs and zap balls, then one blast, `pmboom`, sets off every reaction at once: `rxAll`).
  Finisher hits (gauge 0) never refill Mayhem.
- Still to do: her skill icons (the old crimson tiles), sounds of her own, bot and party lines,
  the README. The old build's notes
  follow for reference until each piece is replaced.

## The Mage (first build, being replaced)

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

## The Sorcerer, remade (2026-11-07)

The chaos queen: the gremlin crowned herself (render/jobgear/chaosqueen.js: a crooked crown of
lightning points with her three element gems and a royal ermine mantle, royal violet). Her
reactions chain to the monsters beside them like dominoes (world/reactions.js `spread`), filling
Chaos (internally Binding); Pandemonium makes the chains longer and wider. Big, slow royal attacks
(render/moves.js `qn*`, shots and hits `qn*` in tools/fx-art.js) and skills: Royal Inferno, Grand
Entrance, Domino Decree, Cold Shoulder, Royal Pardon, Royal Guard, Fireworks Gala, Red Carpet,
Chaos Vortex (all three elements in turn), Royal Decree and the Grand Finale of Chaos. The notes
below are her first build, kept for reference.

## The Sorcerer (the damage path; `onmyoji`, replacing the Astronomer)

- **Personality (the player's pick, 2026-11-06): the edgelord gone real.** Her dark-power act
  finally came true: she is a genuinely terrifying dark sorceress, and secretly panics about it
  (villain lines, then a muttered "...wait, was that me?").
- **Look (the player's pick): the dark hooded sorceress.** A deep hood and long dark robes, a
  spellbook floating open beside her with runes drifting off the pages.
- **Colour (the player's pick): violet and ember.** Deep violet robes; her spells have ember-orange
  cores.
- **Gauge (the player's pick): Spellstorm.** Builds from casting fast without getting hit (a hit
  knocks it back); full, her spells cast twice. Her finisher needs it full and spends it all.
- Look so far: the mage robes repainted violet with ember trim (render/hero.js) and the hood
  (render/jobgear/sorcerer.js: ember-stitched rim, temple runes, a brow rune and longer tail from
  the Archon, embers off the tip from Sunspire). Samples: `tools/sorcerer-looks.html`. Her staff and
  wand (render/weapon-designs.js `sorceryStaff`, `sorceryWand`, the 'sorcery' finish): black wood
  and iron, a crooked claw (a hook on the wand) round a violet flame with an ember core; her own at
  every tier, though the top tiers still pick up silver frills to clean up with the gear ladder.
  Her spellbook (render/hero.js `drawSpellbook`): open behind her back shoulder, bobbing, a page
  turning now and then, ember runes drifting off it; it eases across when she turns.
- **Spell style (the player's pick): shadow hands and flame.** Violet shadow hands with ember-tipped
  claws, and violet flame round ember cores.
- **Built (2026-11-06): her basic attacks and Spellstorm.** Strings (world/melee.js, keys `astro`
  for the staff and `astrowand` for the wand, kept from the Astronomer): staff sosscoop (a dark
  fireball, `sofire`), sosplant (hands clawing up out of the ground, `sograsp`), sosclose (a giant
  hand down out of the sky, `soslam`), pool sosswing, sosknock, sosrage; wand sowbeckon (a flung
  hand, `sohand`), sowcurl (two flame wisps, `soflame`), sowgrip (ground hands), pool sowsneer,
  sowtrace, sowdoom; commands sosup/sosair/sosdash and sowup/sowair/sowdash (render/moves.js `so*`,
  faces `SO_FACE`, every big cast ending on her panic beat). Effects (tools/fx-art.js, the Sorcerer
  section; palettes SVIO, SEMB): `sohand`, `soflame`, `sofire`, `sograsp`, `soslam`, and her mark
  `sohit`. Spellstorm (world/melee.js `addBinding`, `stormHurt`, `spellstorm`; STORM_* numbers) on
  the HUD in the old Orbit slot, with its aura (render/aura.js `bindingAura`): a violet pool and
  rising embers, an ember ring at full. The Astronomer's moons are gone (world/astro.js `moonsOf`).
- **Built (2026-11-06): her skills.** Her own Mage skills (data/skills.js `paths.onmyoji`, names in
  `pathNames`): Hellfire (`sohell`), Shadow Step (`sostep`, burst `sosink`), Clutching Horde
  (`sohorde`), Dread Circle (`sonova`, `sonovafx`), Ember Mend (`somend`, `soglow`), Shadow Ward
  (`soward`, `soguard`), Abyssal Rain (`sorain`: the rift `sosummon`, falling hands `soslam`, impact
  `soimpact`). Her own skills (ids kept): Forbidden Lore (passive), Grasping Dark (`sograspd`),
  Abyssal Maw (`somawcast`; the old Gravity Well engine in world/astro.js drawn as `somaw`), Dark
  Pact (`sopact`: magic attack up and Spellstorm builds faster, `stormGain`), and her finisher Hand of
  the Abyss (`soabyss`: a colossal hand crushes everything ahead). Icons (render/icons/skills.js,
  the `sorcery` tile), shouted lines with a wobble (`MAGE_SHOUTS`, in ember), the job name and blurb,
  Elowen's line, and the bots (world/party.js).
- Still to do: sounds of her own, the README, her look's top-tier weapons.

## The Cleric rebuilt: the Bubble Healer (2026-11-07)

The player called the medic Cleric a reskin of the Mage. She is rebuilt around her wand and staff as
bubble wands (world/melee.js `blowBubbles`/`tickBubbles`, drawn by hand in render/bubbles.js).

- **Attacks** blow bubbles (`bubble` strikes: small, big, or a skill's giant one) that drift and bob.
  On a monster they pop for damage (a big one traps it for a moment, bosses excepted); on a party
  member they pop into a heal; every pop splashes a little healing round it and mends her a little.
  Wand: flick, twirl, big blow (pool: skip, figure-eight, spin). Staff: wave, low sweep, overhead
  swing (pool: loop, hula hoop, pogo). Her own up, air and run moves with each.
- **Gauge** (Devotion, the old Grace) fills from pops; full, every bubble splits in three.
- **Skills**: Giant Bubble (rolls through the line, pops into a big heal), Bubble Ride (she rides a
  bubble forward), Bubble Stream, Foam Burst (traps everything round her), Bubble Bath (party heal),
  Bubble Wrap (barrier), Bubble Storm (finisher: bubbles drift down over everything, then all pop);
  her own: Guardian Bubble (follows the hurt ally, mending), Bubble Wave (foam rolls both ways, buffs
  allies, tumbles monsters), Lather Cloud (drifts after monsters, sticks and stings), Rebirth Bubble
  (revives), Bubble Party (finisher: a dome over everyone, three bounces). Espresso Round is kept.
- Her helper bots in parties and dungeons use the same moves and a bubble shot.

## The Cleric, remade (2026-11-07)

The combat medic (render/jobgear/medic.js: the battle coat in field white with a cross in medic
red, a nurse's cap with goggles, a stethoscope, a bandaged hand). She works rather than casts: her
elements are medical gear (fire a hot pack, ice a cold pack, lightning a heart-monitor pulse; hits
slap a band-aid on) and every spell mends the party where it lands, carrying its element onto them:
healing reactions (Soothing Steam, Frost Shield, Spark Rush; world/reactions.js `allyElement`).
Her own reactions on monsters are Fever Break, Cold Shock and Shock Therapy. Wand string `idol` and
a staff string `medstaff` (render/moves.js `md*`, smoothed by `smoothMove`); skills: Mega Heal Bomb,
Ambulance Run, Defib Chain, Cold Compress, First Aid, Bubble Wrap, Emergency Airdrop, Triage, Pep
Talk, Antiseptic Cloud, Revive Paddles, Espresso Round (a 2-minute party buff of attack, magic and
attack speed, on a 3-minute cooldown: world/combat.js cooldowns) and the Field Hospital finisher.
Her heal engine's effects (the old `si*` names) are redrawn as hers. The notes below are her first
build, kept for reference.

## The Cleric of light (the healer path; `shrinemaiden`, replacing the Starlight Idol)

- **Personality (the player's pick): the reformed edgelord.** The Mage's dramatic flair turned holy:
  she names her heals like epic spells ("RADIANT SALVATION!" for a bandage), poses like a saint in a
  stained-glass window, and is secretly delighted to be the party's hero.
- **Healing (the player's pick): light that follows them.** Her heals land on whoever needs it most
  and keep mending them for a while; blessings, a shield, raising the fallen. Her gauge, Devotion
  (Faith is the Paladin's), builds as she heals and smites; full, her heals splash to the whole
  party, and her finisher heals everyone in full. (Built on the Idol's engine, world/idol.js.)
- **Look (the player's picks): white and gold, a halo and a veil.** She wears the mage robes as
  white and gold vestments (render/hero.js repaints her plain mage pieces), and a veil, gold circlet
  with a sun gem and a floating halo in place of the hat (render/jobgear/cleric.js). Her wand is a
  gold sun scepter (the 'cleric' finish). Samples: docs/design/samples/cleric-looks.png.

- **Built (2026-11-06).** On the Idol's engine (world/idol.js: the spotlight that follows who it
  mends, the wave, the drifting cloud, raising the fallen, the full-party finisher), with all-new
  moves, art and names:
  - Moves (render/moves.js `cl*`, faces `CL_FACE`): the string clsmite, clbless, cljudge (a pillar
    of light from the sky, `clpillar`) and its pool clpray, cltwirl, clglass; commands clup, clair,
    clglide; her skills clguide (Guiding Light), clvalor (Blessing of Valor), clsanct (Penance: an
    orb of judging light that drifts after the monsters, dazzles and slows them; the engine's
    drifting cloud, so not the floor circle first drafted), clraise (Resurrection), clmiracle
    (Miracle); and her Mage skills her way: clholy (Holy Bolt), clascend (Ascension), cljudgment
    (Judgment Ray), clnova (Holy Nova: stuns instead of freezing), clheal, clshield (Divine
    Shield), clgate (Heaven's Gate).
  - Effects (tools/fx-art.js, the Cleric section; palettes HOLY, HGEM, FEATHER, GLASS): her shots
    `clbolt`, `clorb`, `clpillar`; bursts `clfeathers`, `clnovafx`, `clglow`, `clshieldfx`,
    `clgatefx`, `clgateimpact`, `clrays`, the rain `clspear`; and the Idol's show effects redrawn in
    her light under their old names (`sihit`, `siwave`, `sispot`, `sihype`, `silull`, `sistage` as a
    stained-glass window, `sipyro`, `sibig`, `siaura`, `embidol`).
  - Devotion on the HUD (the old Applause slot), her shouted heal names (`MAGE_SHOUTS`), icons
    (crimson-free white and gold tiles), job name and blurb. Recorded in the game:
    docs/design/samples/cleric-skills.gif.

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

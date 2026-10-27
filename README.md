# Tengu — a cozy pastel side-scroller RPG

A browser game in the spirit of classic 2D MMO side-scrollers: start as a Novice, grind cute
monsters across connected maps, pick a job at level 10 (mages pick a specialty at 30), spend AP and SP,
loot and upgrade gear, and take on quests and a boss. Everything is drawn in code in a soft
pastel style: characters are short pixel chibis in the classic MMO style (a big round head with
ears and big soft eyes, rounded bangs with a shine band, and one sturdy little jointed body for
everyone, turned three-quarters toward where they're facing, with nine eye styles and twenty animated hairstyles: locks that bend and ripple in a breeze, bangs you can
swap between sixteen kinds, and optional two-tone tips), drawn crisp at 2x detail with a dark pixel outline whose corners are softened;
they and the monsters get three-tone shading: a soft lavender shadow at the back of each part, the
base color, and a warm highlight on the front edge;
the world and items are pixel art. No build step and no dependencies.

## Play online

**https://ikage24-wq.github.io/Twzt/** (served by GitHub Pages from this branch; keyboard needed).

## Run it

ES modules need an HTTP server (not `file://`):

```sh
npm start            # or: python3 -m http.server 8000
# open http://localhost:8000
```

Progress saves to your browser automatically (every 20 seconds, on map changes, and when you
leave the tab). Pick a world, then pick a hero on the character select tree and press **Start**
(or Enter). The tree holds up to 8 characters; click an empty slot to create one.

## Controls

| Key | Action |
| --- | --- |
| Left / Right | Walk |
| Space (or Alt) | Jump |
| Down + Space | Drop through a ledge |
| Up / Down at a rope | Climb (jump off with Space + Left/Right) |
| Up | Talk to an NPC, or enter a portal |
| Z (or Ctrl) | Basic attack (hold, or keep tapping, to chain a melee combo) |
| X | Pick up loot (hold to vacuum) |
| Q W E R A S D F 1 2 3 4 | Hotkeys for skills and potions |
| I / C / K / L / M / O | Bag / Stats / Skills / Quests / World map / Cash Shop |
| Enter | Chat (Enter sends, Esc cancels, /help for commands) |
| Esc | Close windows; with nothing open, Options |

Mouse: click buttons, double-click (or right-click) items to use or equip them, drag windows by
their title bars, and click a window to bring it to the front. Click an NPC anywhere on screen to
talk to them, or click another player (or yourself) to see their profile. Right-click a player to
invite them to your party. To bind a hotkey, select
a skill in the Skills window or a potion in the Bag, then press the key. Right-click a hotkey slot
to clear it.

## Systems

- **Jobs** — Novice → Warrior, Mage, Archer, or Thief at level 10 (each instructor lives in their
  job's home town). Every first job has a movement skill (Charge, Blink, Backflip, Shadow Step).
  The Mage advances further: three branches at level 30, and one third job per
  branch at level 50 with a signature skill, a summon, and a screen-wide ultimate that hits up to
  15 monsters twice. The Mage has the least HP in the game, but heals and shields the party. The
  Warrior picks one of two paths at level 30 (below), after passing Brann's trial. Archer and Thief
  stop at their first job for now.

  | Class | Branch (30) | Third job (50) | Plays like | Ultimate |
  |---|---|---|---|---|
  | Mage | Stormfrost Wizard | Stormfrost Archmage | Ice freezes monsters solid, lightning chains through crowds | Glacial Tempest |
  | Mage | Venomflame Wizard | Venomflame Archmage | Fire bursts, and poison keeps damaging monsters after | Meteor Shower |
  | Mage | Cleric | Bishop | Heals, buffs, holy light; the sturdiest mage | Radiant Judgment |

  Monsters can be **frozen** (in a block of ice) or **stunned** (seeing stars) so they can't move or
  hurt you, and **poisoned** (green) or **bleeding** (red) so they take damage every second. Spells
  cast over a magic circle in their school's color; big weapon skills flare with a burst of
  power. Old Pyromancer, Inferno Sage, and Seraph saves move to the new mage jobs, saves in a
  retired warrior, archer, or thief job return to that first job, and skills that were removed
  give their SP back.
- **Stats** — STR, DEX, INT, LUK with 5 AP per level (an Auto button spends them for your job).
  Damage uses a primary and secondary stat per weapon type, mastery raises your minimum damage,
  magic scales with INT, and accuracy vs. monster avoid decides hits and misses. Crits deal +20%.
- **Skills** — 3 Novice skills, 5 per first job, 4 per mage second job, 4-5 per mage third job: attacks, area hits, multi-hit
  combos, projectiles, buffs (attack, defense, speed, booster, mana shield), heals, and passives.
  3 SP per level after advancing. Big skills root you in place for a short wind-up (about a
  second for ultimates like Meteor Shower and Judgment), so they can't be spammed.
- **Combos** — with a sword, axe, spear, dagger, or bare hands, basic attacks chain into a
  combo: sword slash → backhand → lunging thrust → a spinning cleave finisher; axe slash →
  backhand → a ground-cracking overhead smash; spear jab → jab → rising sweep → a charging
  thrust through the line; dagger jab → slash → cross-cut; fists jab → jab → uppercut. Hold the
  key or keep tapping (a tap mid-swing is remembered); pause and it starts over. Each blow lands
  as the blade cuts, you step into every swing, and the smear follows the blade's real path (blue
  cuts, gold heavy blows). Light hits barely push; finishers knock monsters away or launch them
  into the air, and hits keep them up there for a juggle. Heavy blows hit-stop, shake the screen,
  and crack the ground. Party members swing through the same combos. Bows, crossbows, and the
  thief's star-throwing gauntlets chain too: two snap shots and then a heavy piercing arrow (or bolt) that tears through the
  whole line, or two throws and a three-star barrage. Arrows leave on the string's snap, fly to
  their target pointed along their path, and hit when they arrive; you hop back a little with each
  shot.
- **Throwing stars** — a gauntlet throws real stars from your bag, one per star thrown. Stars
  come in sets of 500 and add their own attack: Pebble (Lv 10, +15), Steel (Lv 10, +17), Mint
  (Lv 20, +19), and Moon (Lv 30, +21) are sold in shops; Crimson (Lv 40), Thunder (Lv 50),
  Flame (Lv 60), Crystal (Lv 70), and Starlight (Lv 80, +30) only drop from monsters (bosses
  often), and the last four hit with their element. New thieves get a set of Pebble Stars. The
  first set in your bag is the one thrown (double-click a set to throw it), the HUD shows how
  many are left, and any shop recharges a part-thrown set for what its missing stars are worth.
  Out of stars, a gauntlet can't attack.
- **Warrior skills** — **Blade Rush** is a three-press combo: a quick cross-cut, a rising
  launcher that throws them into the air, and a leaping dive that cracks the ground around you.
  **Whirlwind** spins you forward hitting everything around you five times, sucking monsters in,
  then flinging them away. **Titan Breaker** is a heavy three-blow combo in one press: a crushing
  smash, a rising drag that hurls them up, and a leaping dive that splits the ground. **Charge**
  dashes through everything in your path (untouchable on the way), bowling monsters over and
  tossing them aside.
- **Archer skills** — **Rapid Fire** is a three-press combo: three quick arrows, three more as you
  hop back, then a heavy arrow that tears through the line. **Arrow Fan** looses a fan of arrows at
  once, one per monster. **Arrow Rain** shoots a volley into the sky that pours down on everything
  ahead. **Backflip Shot** flips you back out of danger (untouchable mid-flip) while firing a spread
  of arrows at whatever was on you.
- **Command combos** — with a sword, axe, spear, dagger or bare hands: **Up + attack** is a
  launcher that throws monsters up and hops you after them; **attacking in the air** plays an air
  combo (two cuts that keep you hanging, then a dive that slams into the ground on landing); and
  **attacking out of a run** is a lunging dash attack. Each move eases out of the one before it
  instead of snapping.
- **Hit counter, Links and finishers** — every hit you land keeps a counter going on the right
  (it drops after 3 seconds without a hit, but never mid-move), with tiers at 10 (Nice), 25
  (Great), 50 (Awesome) and 100 (Legendary). Start a skill right after a combo's last blow lands
  and it's a **LINK** for +25% damage. At 25 hits a finisher is ready: the Paladin's **Grand
  Verdict** (rise on a column of light and drive a giant sword of light into the ground) and the
  Berserker's **Crimson Eclipse** (spin up in a whirlwind under a blood moon and crash down; fills
  Rage). A finisher spends the counter.
- **Smooth controls** — once a move's blows have landed (or its arrows are away), walking or
  jumping cuts its follow-through short, and a basic attack can flow straight into a skill (so you
  can weave Blade Rush into a sword combo). Each skill plays out its own motion before another
  skill can start, though, and moving doesn't skip that, so skills can't be spammed back to back.
  Skills pressed mid-swing go off the moment they can.
- **Gear** — 8 slots (weapon, hat, top, bottom, shoes, gloves, cape, earrings). Everything you
  wear shows on your character. Every job has its own set **every 5 levels, from 5 to 100**, in
  every armor slot, and each set looks a step grander than the one before:
  - **Warriors** go from a squire's leather kettle cap and jerkin through knight plate with plumed
    great helms, crusader tabards, horned warlord helms and spiked pauldrons, dragonscale,
    bloodforged, obsidian, and infernal plate, up to the winged, haloed Ascendant set.
  - **Archers** wear elven leaf hoods, then circlets with leaf and feather wings, tunics with
    layered leaf hems and sashes, bracers, and mantles, up to diadems of antlers, moons, and lotus
    flowers with leaf-and-light wings (Worldtree at Lv 100).
  - **Mages** grow from a floppy apprentice cap into towering wizard hats with bent tips, moons,
    feathers, and floating orbs, then crowns, halos, rings, and black suns; robes become layered
    vestments with fan collars and trains, and capes turn into arcane feathered wings.
  - **Thieves** start in bandanas and grow into ninja wraps, hoods with mouth masks (fox, cobra,
    raven, cat, wolf), and horned visages up to the Shadow King's crown; their cape is a long
    scarf that streams behind them, splitting into tattered, glowing tails.
  Plumes, scarves, capes, sashes, and hems sway as you move, hat tips and feathers follow your
  head, and wings beat. Fine gear glints, high sets shed motes in their glow color, and a full set
  of Lv 80+ gear wears its job's signature: embers for warriors, drifting leaves for archers, runes
  circling a mage's hat, shadow wisps behind a thief (toggle in Options: Gear effects). Starter
  sets (Lv 5) fit a Novice too. **Earrings** suit every job and climb their own ladder, from
  copper studs to Genesis Stars. 11 **unique** outfit pieces (Bunny Hood, Kitty Ears, Flower Crown,
  Star Beret, Crystal Crown, Blossom Kimono, Sailor Blouse, Comfy Hoodie, Fairy Wings, Angel Wings,
  Galaxy Cape) and Lulu's everyday clothes work for anyone.
- **Colors** — job gear and weapons come in **Dark** (+main stat), **White** (+second stat),
  **Crimson** (+attack), **Azure** (+defense and HP), and the rarer **Gilded** (a bit of every
  stat); earrings come in **Ruby** (STR), **Emerald** (DEX), **Sapphire** (INT), **Topaz** (LUK),
  and **Diamond** (all). The color repaints the piece and its icon, and bonuses grow with the
  item's level. Most drops come in a color; in shops, pick one from the swatches under an item.
- **Cash outfits** — the Cash Shop (O, or the gift button) sells outfit pieces that cover the
  look of your gear without touching its stats, sorted by style (All, Casual, Swim, Funny,
  Fantasy): everyday modern clothes, cute swimwear (frilly one-pieces, ruffle bikinis, board
  shorts, swim rings), silly April Fools stuff (joke hats, full-body costumes, and weapon covers
  like a fish or a baguette), and fantasy pieces: costumes of every job's sets (a warrior can wear a
  towering wizard hat), the unique outfits and clothes, jewel earrings, and weapon covers that
  reskin whatever weapon you hold as an endgame design (Seraph, Hellfire, Ossuary, Photon, Ripper,
  Neon) or a top material (Crystal up to Genesis). Most come in the gear colors. Click a piece to
  try it on in the fitting room (turn around, walk, reset), then Buy & Wear. You start with 5,000
  Cash and earn 250 per level and 300 per quest. Bought pieces live in the bag's **Cash** tab;
  the equipment panel switches between **Gear** and **Outfit** (double-click to take a piece off).
  Other players dress up too, top players most of all.
- **Shops** — Pip, Tora, Marlo, and Nim sell gear for *your* job at their town's levels (with
  All / Gear / Arms / Other filters), and weapons you can use. Half of all gear drops are for
  your job, and quest gear rewards come as your job's piece. Other players wear their own job's
  sets, often in a matching color, and the job instructors show off their Lv 50 sets.
- **Weapons** — every type (sword, axe, spear, wand, staff, bow, crossbow, dagger, gauntlet) has a
  weapon every 5 levels: a wood or stone trainer, then Copper, Bronze, Iron, Steel, Silver,
  Mithril, Cobalt, Crystal, Runic, Starsteel, Moonsilver, Sunforged, Dragonbone, Obsidian,
  Adamant, Phoenix, Abyssal, Astral, Celestial, and Genesis (Lv 100). They grow every four
  tiers, gain gems, fins, and runes, and the top ones carry their material's crest (stars,
  moons, suns, dragon horns, phoenix wings, an abyssal eye, an orbiting ring, angel wings, a
  rainbow halo). From Silver up they shine and animate, and higher ones have live effects
  (frost motes, embers, rune pulses, void wisps, radiant rays). At Lv 50 every type also has six
  endgame designs, each a rare drop with its own live effects, hit impact, and footsteps:
  - **Holy** — white and gold with beating angel wings, a halo, rays of light, and shed feathers
    (the staff is Seraphim's Halo).
  - **Demonic** — black, barbed, and horned, with lava cracks, a blinking demon eye, hellfire, and
    embers; hits erupt in spikes of dark flame.
  - **Bone** — carved bone and vertebrae with a skull whose eyes burn with green soul fire, and
    ghosts winding around the weapon; hits flash a spectral skull.
  - **Laser** — a chrome hilt and a humming energy blade (each type its own color) with a white
    core, flicker, and emitter sparks; hits sear a slice of light through the target.
  - **Chainsaw** — hazard-striped motors with running chains or spinning saw blades, exhaust smoke,
    and sparks; hits grind and spray sparks.
  - **Cyber** — black chrome and neon that pulses cyan and magenta, hologram rings, rising data,
    and glitches; hits shear into neon slices.
  Weapon art lives in `src/render/weapon-forms.js` (one form per type), `weapon-kit.js` (tier and
  theme looks, shared parts), and `weapon-fx.js` (live effects); job gear in
  `src/render/jobgear/` (one module per job, plus palettes and live effects).
- **Rarity** — dropped gear can roll **Rare** (16%), **Epic** (5%), or **Legendary** (1.2%) for
  higher stats and bonus STR/DEX/INT/LUK. Rare weapons shimmer with a sweeping glint, Epic ones
  glow and have motes circling the tip, and Legendary ones pulse with an aura and shed sparkles.
  Rare loot glows with a colored beam on the ground, and bosses always
  drop Rare or better. Drops also roll small stat differences. Every item has 7 upgrade slots for
  charms (100% / 60% / 10%) that spend a slot whether they work or not.
- **Animation and feel** — the hero is a layered rig drawn at 2x detail with jointed limbs (hips,
  knees, ankles, elbows) and shaded automatically (the back third of each part and the back limbs
  in a lavender shadow, bangs casting onto the face): a 24-frame walk cycle driven by distance,
  with heel strike, a planted foot that rolls onto its toe, a high heel kick behind, hips that sink
  when the feet are spread, and counter-swinging arms pumping hard, a forward lean and a bounce at each step while running, a breathing idle with blinks and a slow weight shift, a bouncy fighting stance (weapon on guard, hair whipping) for a few seconds after a fight, stretch on the
  way up and knees that give on landing, hair and capes that trail behind on springs, attack wind-up held for a beat before a strike that's over in a flash and a slow follow-through, a
  bow that swings up into place before the draw, lunges with a weapon trail, a climbing cycle, and a hurt recoil. Monsters hop, breathe, pop in when they spawn, and
  squash when hit. Effects are drawn like hand-animated 2D anime effects (`src/render/fxkit.js`):
  hard-edged cel shapes with a white-hot core in a colored rim that snap open, hold, and then thin
  out, shrink, and break apart instead of just fading. Swings leave a tapered crescent smear whose
  tail chases its head, with speed lines and sparks off the tip; hits flash a star with teardrop
  sparks and a quick shockwave (crits burst a ring of shards); defeated monsters pop into a
  two-tone smoke cloud that breaks into shrinking puffs; landings skid dust out to both sides; a
  boss stomp bursts rock spikes up from the ground. Plus screen shake, short hitstop on crits and
  kills, and ambient petals, fireflies, and glints in every map.
- **Boss Rush: Dancing Green** — Roxy, the Boss Rush Host, runs a neon booth at the east end of
  Sprout Village (from level 40). Challenge Dancing Green, the Party Animal, on the Funky Fever
  Stage: a disco arena with a giant neon sign, mirror balls, dancing neon figures and a glowing
  tile floor, all pulsing to a 120 bpm beat. A cutscene opens the fight (skip it with Space or
  Enter): letterboxed shots pan the stage, he struts in and dances, says his line, and red energy
  swallows him; quick close-ups reveal his toad form, then his name card slams in. Then
  every attack lands on the beat and is shown first: rainbow walls and cube walls that hit half
  the stage, a slashing kick, flashing floor tiles, spotlights to stand in, waves to jump, frog
  backup dancers who call his cleaves, moonwalking frogs whose tracks burst, and a Hi-NRG Fever
  enrage if the party runs too long.
- **Monsters and maps** — 19 chibi monsters and the Crystal King boss across 12 maps (four towns, two
  meadows, a canyon, woods, ruins, a crystal cave, a sky garden, and the throne room). Field maps
  are built like classic side-scroller maps: the ground rolls in hills and slopes, rises into
  plateaus, and drops away at cliff walls you jump up or climb by ladder; above it, floating
  islands of the same land stack four or five levels high, linked by jumps, ropes, and ladders.
  Each region's land has its own look (cobbled meadow earth, mossy forest loam, stacked sandstone
  slabs, temple bricks, crystal rock, cloud), with grassy or mossy lips, hanging vines and roots,
  and big landmarks: giant trees and mushrooms, wishing wells and flower arches, totems and mesas,
  broken archways and statues, crystal spires, cloud pillars and gazebos. Portals name where they
  lead. Every region has its own
  monsters, drawn after myths, folklore, and other games (Kitsune Kits, Moss Tortoises, Mandrakes,
  and Jackalopes in the meadow; Basilisk Hatchlings and Manticore Cubs in the canyon; Dryads, Wargs,
  and Treants in the woods; Will-o'-Wisps, Imps, and Dullahans in the ruins; Gem Mimics and Crystal
  Golems in the cave; Pegasus Foals, Sky Harpies, and Star Seraphs in the sky), each with its own
  walk cycle and idle motion, and they show how they feel: blinking and humming when calm, fierce brows and an anger mark
  when they chase you (hit monsters do), >< eyes when hit, and x eyes when they poof. The boss
  telegraphs a ground slam.
- **Idle animations** — standing still with a weapon plays a routine for its type (sword
  flourish, axe on the shoulder, spear twirl, wand sparkles, staff tap, bow check, crossbow aim,
  dagger toss, gauntlet flick). Advanced jobs get a quiet aura that fades in while idle: a soft glow at
  the feet in the job's color with a few drifting snowflakes, embers, or sparkles, plus a slowly
  turning rune ring for the Archmages (crackling with lightning for Stormfrost, ringed with
  dancing flames for Venomflame) and a halo and angel wings for the Bishop. Elowen shows off the Bishop
  aura in Moonleaf Grove.
- **Interface** — a candy-pastel UI. Each window has its own color and icon badge (peach Bag,
  pink Stats, lavender Skills, mint Quests, sky-blue World Map) on a scalloped title ribbon, and
  pops open with a little bounce. The HUD has a portrait medallion with your hero's face and
  level, glossy HP and MP capsules (a pale trail shows what you just lost, and the heart pulses
  when HP runs low), an EXP strip along the bar's top edge, round icon buttons for each window, and
  keycap hotkeys. The minimap, the quest tracker card, ringed buff timers, and a ribbon banner
  when you enter a map round it out. NPCs talk in a visual-novel box: they stand large at the left
  with a name ribbon in their role's color, and their words type out (click to skip).
- **Parties** — right-click another player for a menu (view profile, invite to party, browse
  their shop). Players around your level (up to 5 above) or below usually say yes; anyone higher
  turns you down, as do shopkeepers busy selling. A party holds you and up to five others. Members
  come along from map to map. In town they hang around near you; out in the field each one goes
  off hunting **on their own**, anywhere on the map: they pick a monster no partymate is on, find a
  way to it over the ledges (jumping up, dropping through, walking off edges, climbing ropes), fight
  it, and wander off to look for more when the area is clear. They only jump when the path needs
  it, and give up on a monster they can't reach. They show on the minimap as dots in their
  playstyle's color, and chat in party chat. Their kills give you 60% of the EXP, count for your
  quests, and drop loot for you; your own kills get +10% EXP per member. They level up with you.
  Each member has their own playstyle, picked from their job and level, plus small quirks (how
  fast they react and walk, their attack rhythm and idle habits):
  - **Rusher**: dives into packs, fast swings and big spin moves.
  - **Guardian**: steady and tough, picks off monsters closer to you.
  - **Sniper**: fights from range, shooting up and down ledges.
  - **Healer**: heals you from anywhere on the map when your HP drops.
  - **Rookie**: gets distracted and wanders off to look at things.
  - **Show-off**: flashy specials, flips, and taunts.

  Members pick a side of a monster and keep it and hold a good spot instead of chasing every step,
  so their movement stays calm. A party panel under the minimap
  shows everyone with their playstyle (click for a profile,
  right-click to remove someone); Leave, or right-clicking yourself, leaves the party, and members
  head off on their own (or log off after a long session).
- **Dungeons** — **Rootwood Hollow** (Lv 10+), the first dungeon, lies under the old tree off
  Windy Canyon. Talk to Bramble, the Hollow Warden, at the Hollow Gate (or walk into the door) to
  form a group of four: **1 Tank, 1 Healer, 2 DPS**. Your job sets your role: **warriors tank (Berserkers deal damage),
  mages (and every mage job after them) heal, archers and thieves deal damage**. Your party comes
  with you if it fits the roles, and the group finder brings in players for any open spot. Inside:
  - Everyone in the group has HP (shown under their names and in the group panel), and monsters
    don't hurt on touch: they wind up and swing at whoever they're angriest at. Damage builds
    **threat**, a tank's five times over, and healing builds a little. Monsters in a pack fight
    together. Tanks hold them with the warrior's tank skills (below).
  - The group plays its roles: the tank leads and, once everyone is ready, Chain Hooks the next
    pack back to the group, hooks or Provokes loose monsters back, and holds the boss; the healer hangs back and heals whoever is hurt (a group
    heal when several are), keeps a barrier on the tank, and Renews the group when it's taking
    damage; the damage dealers focus what the tank is fighting, go for adds first,
    and help with the room's task between fights. Everyone steps out of telegraphed attacks.
  - Six rooms, each sealed until it's cleared: **Hollow Entrance** (trash packs, and light the
    three glowcaps), **Capper's Garden** (mini-boss the Myconid Queen: Spore Rain patches to step out
    of, and Spore Mites that rush the healer), **Bramble Tunnels** (trash, and free four trapped
    Sprouts from root cages), **Boar Den** (mini-boss Tuskar: a tank-busting Gore, and a charge down
    a telegraphed lane at someone; he crashes into the wall and is dazed, taking extra damage),
    **The Root Gate** (Bramble Bears carry the three Root Keys that open the gate), and **Heart of the
    Hollow** (Gnarlroot: a Root Slam to jump or get on a ledge for, alternating Thorn strips,
    Corrupted Saplings at half HP that heal him and halve his damage taken until killed, and a faster
    enrage at 20%).
  - Fall in a fight and your group gets you back up once it's over (no EXP lost; you can also
    leave). If everyone falls, the room resets and the group regroups at its entrance. The run
    tracker shows the room, what's left, the clock, and wipes; boss moves are called out on
    screen.
  - The chest at the end holds EXP, gold, Cash, a piece of your job's Lv 15 gear in a rolled color,
    Hollow Acorns, and Elixirs. Bramble's quest, Heart of the Hollow, pays out for calming Old
    Gnarlroot. Run it as often as you like.
- **Warrior tanking** — warriors are the tanks, with five tank skills in the Warrior book:
  **Provoke** roars at every monster around you so they all come after you (in a dungeon they
  stick to you for a few seconds); **Chain Hook** hurls a chain ahead and drags the monsters it
  catches (up to 8) right to you along their ledge, gathered up for the party to hit together
  (bosses are too heavy to move, but still turn on you); **Shield Wall** takes a share off every
  hit for a while; **Rally Cry** does the same for you and the party around you; and **Stalwart**
  adds max HP and defense. They all work outside dungeons too.
- **Warrior paths (level 30)** — at 30, Brann in Ember Crag sets **The Warrior's Trial** (break 20
  Crystal Golems in the Crystal Cave); pass it and pick a path:
  - **Paladin**, the tank: **Aegis Smite** is a three-press combo (a shove behind a shield of light
    that stuns, a rising cut that throws them up, an overhead smite that calls pillars of light down
    on them); **Hallowed Ground** drives the blade into the floor so a ring of holy light bursts out,
    turns every monster it hits on you, and lifts them on pillars of light; **Divine Aegis** guards
    you and the party around you (less damage taken, slow healing); **Paladin Mastery** adds
    mastery, defense, and max HP. Idle, a ring of light diamonds turns at their feet. **Faith** (a
    star gauge over the hotkeys) builds from her blows and from the hits she takes, drains once the
    fight stops, and cuts the damage she takes (up to 15% at full). Golden light builds around her
    as it fills: a glow, a turning ring of light, then a halo and rays; full (**Sanctified**) adds
    wings of light.
  - **Berserker**, a damage dealer: every blow builds **Rage** (a flame gauge over the hotkeys) that
    drains once the fighting stops. **Ravage** is a three-press combo (two bleeding chops, a
    bleeding spin, a ground-cracking skull-splitter); **Blood Frenzy** raises attack, attack speed,
    and crits and gives a quarter of your Rage; **Rampage** needs 30 Rage and spends it all on three
    wild chops and a leaping smash, up to double damage at full Rage; **Berserker Mastery** adds
    mastery, attack, and critical damage. Idle, small red flames lick at their feet. Rage shows on
    him as it builds (a red heat, then flames climbing his body, embers streaming off), makes every
    blow up to 25% harder, and at full (**Berserk**) a red ring pulses from his feet and the screen
    edges burn red.
  - Each path fights in its own style, with its own basic combo and moves. The Paladin is upright
    and disciplined, always leading with the shield arm: a measured cut, a shield shove that
    dazes, a lunging thrust, and a two-handed smite from a held overhead raise; Aegis Smite
    rises in a long arc, Hallowed Ground kneels and plants the blade point-down, and Divine Aegis
    is a knight's salute. The Berserker is wild and twisting: a huge wound-up horizontal cleave,
    the return cleave, a low crouching whirl, and a leaping skull-splitter; Blood Frenzy is a
    hunched war roar, and Rampage chains the cleaves into the skull-splitter.
  - Both paths hit heavy: longer hit-stops and harder knockback (the Berserker most), a stomp of
    dust and a dip of the view as a big move starts, power gathering at the weapon (embers or
    diamonds of light pulled in) until the blow lands, and a spark of their own on every hit.
- **Mage support** — mages are the healers, with four support skills in the Mage book (it scrolls):
  **Mend** heals you and every party member around you; **Renew** puts a glow on you and the party
  around you that restores HP every second; **Arcane Barrier** wraps you and the party around you in
  a bubble that soaks up damage until it pops; and **Revive** gets a fallen party member nearby back
  up, even mid-fight. Outside a dungeon they work on you.
- **HD graphics** — on by default (Options: Display). Everything in the world is placed on the
  screen's own pixels, so the camera and everyone in it glide instead of stepping, while the art
  itself stays crisp pixel art. Each map gets its own lighting: warm light and slanting sun rays
  from above, cool shade below, and a soft vignette. Spells, sparks, and particles glow (bloom),
  the far backdrop is softly out of focus behind the play area, shadows are soft, crits glow, and
  new maps fade in. On a slow device it drops the glow, then the lighting, by itself.
- **Filters** — Options: Display: Filter. **Vivid** (the default) makes colors richer, **Dreamy**
  adds a soft-focus glow, **Retro** adds scanlines and darker screen corners like an old TV, and
  **Natural** leaves the colors as drawn.
- **Sound** — "real plus modern": recorded instruments (flute, strings, harp, guitar, horns,
  piano, choir, marimba, celesta and more, from the FluidR3 soundfont) and recorded effects (from
  Kenney's packs), mixed with synths, drums and effects made in code (credits in
  `assets/audio/CREDITS.md`). Every song and effect is rendered once in a background worker and
  played from buffers; the rules come from the research in `docs/audio/`. **Music**: a written
  song for every area: a swung village tune on flute, guitar and plucked strings; a running meadow
  song with marimba and pop drums; an accordion sea song in 6/8 at the harbor; sitar and oboe over
  toms in the crags; pan flute and harp in the forest; a waltz for oboe and celesta in the mage
  grove; choir, harp and horn in the ruins; echoing celesta in the cave; flute and bells in the sky;
  a grumbling horn march in the Hollow; a galloping boss theme with brass, strings, choir and
  timpani that cuts in on its sting; and a piano title theme. Songs crossfade between areas and
  pick up where they left off when you come back. **Funky Fever**, Dancing Green's disco song (F
  minor, 120 bpm, matched to the feel of his FFXIV theme with our own melody), is locked to the
  stage lights: a muffled groove that opens up as he struts in, a riser and snare roll, a boom and a
  heartbeat while he transforms, the drop on a bar line with the chorus on the stage's drop, a phase
  sting into Hi-NRG Fever (a whole step up) on the next bar, and the victory fanfare on the beat when
  he falls. **Jingles** on real instruments follow the Japanese RPG formula (quick notes rushing
  into a long, rising landing note): level up, quest accepted and complete, rare drops, job
  advancement, boss defeated, healing, and a gentle faint; the music dips under them and they never
  overlap. **Effects**: blows are recorded punches with a body that climbs in pitch through a combo
  (finishers thump, crits ring), each path's and element's colour (holy bells, rage crunch, fire,
  glassy ice, zaps). Combat is recorded from free combat sound packs (JC Sounds, The Soundrack,
  artisticdude, Ogrebane, rubberduck, Still North Media): every weapon type swings with its own
  recordings (sword, axe, spear, dagger, bare hands), timed so the whoosh peaks as the blow lands,
  and lands its own way (an axe chops, a dagger cuts, fists thump); blade clangs and cuts, longbow
  and recurve shots, crossbows clacking bolts away, arrows thudding in, throwing stars, and every school of magic casting and
  landing with its own sound (fire, ice, lightning, holy, poison, dark, wind, earth, water);
  monsters squish and cry when they pop. Buffs, shields, teleports, every Paladin and Berserker
  effect, recorded footsteps by ground, jumps, landings, coins that chime up the scale,
  pickups, real menu clicks, and NPCs who talk in soft voice blips at their own pitch, rising at
  the end of a question. Sounds pan to where they happen; a limiter keeps busy fights clean. Sound
  starts on your first key press or click. Options: Sound has volume for everything, music, and
  effects.
- **Options** — Esc (or the gear button) opens Options. Sound: volume, music, effects. Display: filter, HD graphics, particles
  (full, reduced, or off), job auras, weapon effects, and gear effects. Interface: minimap, quest
  tracker, message log, map banner, monster HP bars, and an FPS counter. Gameplay: screen shake,
  hit-stop, damage numbers, auto-loot, click-to-talk NPCs, townsfolk and players, and chat bubbles. A Controls page lists every key, and
  the Character page changes character or returns to the title (saving first). Settings are saved in
  the browser.
- **Chat** — press Enter to talk. Messages show in the log and as a speech bubble over your head,
  emoticons like :) :D ;) >:( :3 <3 B) make your face act them out, `/e <face>` shows any
  expression, NPCs chat now and then, and NPCs nearby say hi back when you greet them.
- **Towns and the world map** — each job has a home town in its own style: Sprout Village
  (archers, a pastel village with archery targets), Pastel Harbor (thieves, moonlit docks with
  string lights and alley cats), Ember Crag (warriors, sandstone mesas with forges, banners, and
  training dummies), and Moonleaf Grove (mages, a starry forest with glowing treehouses and
  floating lanterns). Towns are built in tiers like classic side-scroller towns: the streets rise
  and fall over gentle hills, and floating decks above them, reached by ladders, hold more of
  the town (houses, a windmill and a mushroom house in Sprout Village, harbor houses under a
  lighthouse in Pastel Harbor, war tents and a totem on Ember Crag's rocks, treehouses and
  moonstones up in Moonleaf Grove), always clear of the NPCs' own buildings. The world map (M) shows Tengu Island with every road between maps and a
  "you are here" pin; click a town to fly there from any town for a little gold.
- **Living towns** — every NPC works from their own place: striped market stalls for Pip's Goods,
  Tora's Forge, Nim's Spells, Marlo's Wares, and Lulu's Salon; guild halls for the Archer Lodge,
  Warrior Hall, Mage Tower, and Thieves' Den; an info kiosk for Mira and a harbor office for Captain
  Rook, each with a swinging wooden sign. Houses line the streets in each town's style (cottages,
  adobe homes and tents, treehouses and mushroom houses), with a fountain on every plaza. NPCs
  have their own idle routines: Pip juggles potions, Tora hammers sparks off an anvil, Brann runs
  sword drills, Kestrel shoots arrows, Elowen floats in meditation, Nim reads a floating spellbook,
  Vex flips a dagger, Rook scans the sea through a spyglass, Marlo flips a coin, Lulu snips and
  twirls, and Mira waves (they turn to face you when you come over). Villagers stroll the streets.
- **Other players** — the towns have a small, changing population of generated players, each a
  real character: a level (pros at a low rate, Lv 56+ with endgame gear and a gold name tag), a job
  that fits it, a stat build (pure, standard, or hybrid), rolled gear, and sometimes a guild. They
  log in, wander, chat in their own typing style from a procedural grammar (trades, LFG, questions,
  small talk, bragging, newbie questions; a line is never said twice), travel between towns
  through the portals, and log out for good; a name never comes back. Some set up a shop on a rug
  with a sign and sell their loot and gear, which you can buy. Now and then one walks over to wave
  and say hi to you by name (rarely, and each only once). Click any player, or yourself, to see a
  profile with their look, gear, full stats, build, guild, and shop. About 22 are online (never
  fewer than 20; someone logging out is soon replaced), spread over the towns by level: beginners
  in Sprout Village, mid levels in Ember Crag and Pastel Harbor, veterans and pros in Moonleaf Grove,
  with a few wandering anywhere. The busier a town, the less each person chats.
- **Quests and NPCs** — 9 quests (defeat or collect), shops that buy and sell (including a
  blacksmith in Ember Crag, a spell shop in Moonleaf Grove, and Lulu's clothing boutique), a salon
  to restyle your hero, and job instructors.
- **Death** — you wake up in town and lose a little EXP (less with more LUK), never a level.

Mechanics follow the classic genre formulas (EXP curve, damage, accuracy, HP/MP growth), using the
community-written reference at meowdb.com as a guide. All names, art, and text are original.

## Layout

```
index.html              page shell
src/main.js             canvas scaling, screens, fixed-step loop, autosave
src/input.js            keyboard and mouse (mapped into the 640x360 game space)
src/core/               pure rules: exp curve, formulas, stats, character, inventory, items, quests, save
src/data/               content: jobs, skills, items, monsters, maps, NPCs, quests
src/world/              simulation: physics, monsters, loot, combat, the world update
src/render/             drawing: pixel toolkit, hero rig, gear designs, weapon forms, looks, and live effects, towns
                        and elements, animator,
                        particles,
                        monsters, scenery, terrain, landmarks, effects, icons, scene
src/ui/                 HUD, windows, NPC dialogs, title and creator screens
src/audio/              the studio and its songs, sound recipes, the sample bank, the render
                        worker, the mixer, and the listener that turns the world into sound
assets/audio/           the recorded instruments and effects (built by tools/build-audio.mjs)
tests/                  node:test suites for rules, content integrity, and world behavior
```

## Tests

```sh
npm test
```

The suites cover the formulas and progression rules, gear designs and rarity, content integrity (every portal, drop,
reward, and portal resolves; every surface of every map can be reached and left again), terrain
(slopes, cliff walls, and party members finding their way between any two spots on every field
map), world behavior (movement, ropes, portals, NPC
talk, combat and loot, respawns, death, the boss slam), and dungeons (roles, the group finder,
threat, and a whole Rootwood Hollow run played by an autopilot).

## Credits

All art is drawn in code. The `assets/` folder holds CC0 packs from Kenney and OpenGameArt that
earlier versions used; the current game doesn't load them, and they can be deleted.

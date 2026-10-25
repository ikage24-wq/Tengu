# Tengu — a cozy pastel side-scroller RPG

A browser game in the spirit of classic 2D MMO side-scrollers: start as a Novice, grind cute
monsters across connected maps, pick a job at level 10 (mages pick a specialty at 30), spend AP and SP,
loot and upgrade gear, and take on quests and a boss. Everything is drawn in code in a soft
pastel style: characters are short pixel chibis in the classic MMO style (a big round head with
ears and big soft eyes, rounded bangs with a shine band, and one sturdy little jointed body for
everyone, turned three-quarters toward where they're facing, with nine eye styles and eight
hairstyles built from curved locks), drawn crisp at 2x detail with a dark pixel outline whose corners are softened;
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
| Z (or Ctrl) | Basic attack (hold to keep attacking) |
| X | Pick up loot (hold to vacuum) |
| Q W E R A S D F 1 2 3 4 | Hotkeys for skills and potions |
| I / C / K / L / M | Bag / Stats / Skills / Quests / World map |
| Enter | Chat (Enter sends, Esc cancels, /help for commands) |
| Esc | Close windows; with nothing open, Options |

Mouse: click buttons, double-click (or right-click) items to use or equip them, drag windows by
their title bars, and click a window to bring it to the front. Click an NPC anywhere on screen to
talk to them, or click another player (or yourself) to see their profile. To bind a hotkey, select
a skill in the Skills window or a potion in the Bag, then press the key. Right-click a hotkey slot
to clear it.

## Systems

- **Jobs** — Novice → Warrior, Mage, Archer, or Thief at level 10 (each instructor lives in their
  job's home town). Every first job has a movement skill (Charge, Blink, Backflip, Shadow Step).
  For now only the Mage advances further: three branches at level 30, and one third job per
  branch at level 50 with a signature skill, a summon, and a screen-wide ultimate that hits up to
  15 monsters twice. The Mage starts as a glass cannon with the least HP in the game. Warrior,
  Archer, and Thief stop at their first job for now.

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
- **Gear** — 8 slots (weapon, hat, top, bottom, shoes, gloves, cape, earrings), with armor in 6
  tiers. Everything you wear shows on your character, and each armor tier
  has its own look (beanie → sun hat → cap → helm → witch hat → circlet, tee → robe, sneakers →
  wing boots, and so on). 11 **unique** outfit pieces have one-of-a-kind looks: Bunny Hood, Kitty
  Ears, Flower Crown, Star Beret, Crystal Crown, Blossom Kimono, Sailor Blouse, Comfy Hoodie, Fairy
  Wings, Angel Wings, and Galaxy Cape (a few are sold by Marlo; the rest drop).
- **Weapons** — 99 weapons across the 9 types (sword, axe, spear, wand, staff, bow, crossbow,
  dagger, claw). Each type climbs five tiers that look and animate better as you go: common wood
  or stone (Lv 0, Pip) → iron (Lv 10) → steel and gold with a glint (Lv 20) → twinkling mithril
  (Lv 30) → rune-carved with runes that light in turn and glyphs floating off (Lv 40, drop only).
  Tiers 1–3 are sold by Tora (swords, axes, spears), Nim (wands, staves), and Marlo (bows,
  crossbows, daggers, claws). At Lv 50 every type has six endgame designs, each a rare drop with
  its own live effects, hit impact, and footsteps:
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
  theme looks, shared parts), and `weapon-fx.js` (live effects).
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
  when the feet are spread, and counter-swinging arms, a breathing idle with blinks, stretch on the
  way up and knees that give on landing, hair and capes that trail behind on springs, attack wind-up and lunge with a weapon
  trail, a climbing cycle, and a hurt recoil. Monsters hop, breathe, pop in when they spawn, and
  squash when hit. Footstep dust, hit sparks, defeat poofs, screen shake, short hitstop on crits
  and kills, and ambient petals, fireflies, and glints in every map.
- **Monsters and maps** — 19 chibi monsters and the Crystal King boss across 12 maps (four towns, two
  meadows, a canyon, woods, ruins, a crystal cave, a sky garden, and the throne room) with
  one-way ledges, ropes, and portals that name where they lead. Every region has its own
  monsters (dandelion Fuzzlets and Bloomsnails in the meadow, Pebblets and Scorpips in the canyon,
  Leafoxes in the woods, Skelly Knights in the ruins, Gemjellies in the cave, Flufframs in the sky),
  and they show how they feel: blinking and humming when calm, fierce brows and an anger mark
  when they chase you (hit monsters do), >< eyes when hit, and x eyes when they poof. The boss
  telegraphs a ground slam.
- **Idle animations** — standing still with a weapon plays a routine for its type (sword
  flourish, axe on the shoulder, spear twirl, wand sparkles, staff tap, bow check, crossbow aim,
  dagger toss, claw jab). Advanced jobs get a quiet aura that fades in while idle: a soft glow at
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
- **Options** — Esc (or the gear button) opens Options. Display: screen shake, hit-stop, damage
  numbers, particles (full, reduced, or off), job auras, and weapon effects. Interface: minimap,
  quest tracker, message log, map banner, monster HP bars, and an FPS counter. Gameplay: auto-loot,
  click-to-talk NPCs, townsfolk and players, and chat bubbles. A Controls page lists every key, and
  the Character page changes character or returns to the title (saving first). Settings are saved in
  the browser.
- **Chat** — press Enter to talk. Messages show in the log and as a speech bubble over your head,
  emoticons like :) :D ;) >:( :3 <3 B) make your face act them out, `/e <face>` shows any
  expression, NPCs chat now and then, and NPCs nearby say hi back when you greet them.
- **Towns and the world map** — each job has a home town in its own style: Sprout Village
  (archers, a pastel village with archery targets), Pastel Harbor (thieves, moonlit docks with
  string lights and alley cats), Ember Crag (warriors, sandstone mesas with forges, banners, and
  training dummies), and Moonleaf Grove (mages, a starry forest with glowing treehouses and
  floating lanterns). The world map (M) shows Tengu Island with every road between maps and a
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
  profile with their look, gear, full stats, build, guild, and shop. At most three share a town.
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
                        monsters, scenery, effects, icons, scene
src/ui/                 HUD, windows, NPC dialogs, title and creator screens
tests/                  node:test suites for rules, content integrity, and world behavior
```

## Tests

```sh
npm test
```

The suites cover the formulas and progression rules, gear designs and rarity, content integrity (every portal, drop,
reward, and ledge resolves and is reachable), and world behavior (movement, ropes, portals, NPC
talk, combat and loot, respawns, death, the boss slam).

## Credits

All art is drawn in code. The `assets/` folder holds CC0 packs from Kenney and OpenGameArt that
earlier versions used; the current game doesn't load them, and they can be deleted.

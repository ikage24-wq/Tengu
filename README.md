# Tengu — a cozy pastel side-scroller RPG

A browser game in the spirit of classic 2D MMO side-scrollers: start as a Novice, grind cute
monsters across connected maps, pick a job at level 10 and a specialty at 30, spend AP and SP,
loot and upgrade gear, and take on quests and a boss. Everything is drawn in code in a soft
pastel style: characters are short pixel chibis in the classic MMO style (a big round head with
ears and big soft eyes, rounded bangs with a shine band, and one sturdy little jointed body for
everyone, turned three-quarters toward where they're facing, with nine eye styles and eight
hairstyles built from curved locks), drawn crisp at 2x detail with a dark pixel outline whose corners are softened;
they and the monsters get three-tone shading: a soft lavender shadow at the back of each part, the
base color, and a warm highlight on the front edge;
the world, items, and weapons are pixel art. No build step and no dependencies.

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
| Esc | Close windows |

Mouse: click buttons, double-click (or right-click) items to use or equip them, drag windows by
their title bars. To bind a hotkey, select a skill in the Skills window or a potion in the Bag,
then press the key. Right-click a hotkey slot to clear it.

## Systems

- **Jobs** — Novice → Warrior, Mage, Archer, or Thief at level 10 (each instructor lives in their
  job's home town) → a second job at 30: Blademaster or Lancer, Pyromancer or Cleric, Ranger or
  Marksman, Duelist or Shadow. Each job has its own HP/MP growth and weapons. Mages get a
  third job at level 50: **Seraph** (from Cleric) and **Inferno Sage** (from Pyromancer), each
  with a huge-area ultimate that strikes up to 15 monsters twice (Radiant Judgment, Meteor
  Shower), a summon that fights beside you (Guardian Angel, Shadow Cross), a power buff, and a
  mastery passive.
- **Stats** — STR, DEX, INT, LUK with 5 AP per level (an Auto button spends them for your job).
  Damage uses a primary and secondary stat per weapon type, mastery raises your minimum damage,
  magic scales with INT, and accuracy vs. monster avoid decides hits and misses. Crits deal +20%.
- **Skills** — 3 Novice skills, 4 per first job, 4 per second job: attacks, area hits, multi-hit
  combos, projectiles, buffs (attack, defense, speed, booster, mana shield), heals, and passives.
  3 SP per level after advancing. Big skills root you in place for a short wind-up (about a
  second for ultimates like Meteor Shower and Judgment), so they can't be spammed.
- **Gear** — 8 slots (weapon, hat, top, bottom, shoes, gloves, cape, earrings), 9 weapon types in
  9 tiers and armor in 6 tiers. Everything you wear shows on your character, and each armor tier
  has its own look (beanie → sun hat → cap → helm → witch hat → circlet, tee → robe, sneakers →
  wing boots, and so on). 11 **unique** outfit pieces have one-of-a-kind looks: Bunny Hood, Kitty
  Ears, Flower Crown, Star Beret, Crystal Crown, Blossom Kimono, Sailor Blouse, Comfy Hoodie, Fairy
  Wings, Angel Wings, and Galaxy Cape (a few are sold by Marlo; the rest drop).
- **Weapons** — every class follows the same **weapon path**: Wooden → Iron → Steel → Mithril
  (sold in shops), then at level 45 each weapon type splits into five endgame elements that only
  drop: **Holy** (feathered wings and halos), **Cosmic** (star fields, crescent moons, an orbiting
  planet), **Lightning** (crackling edges and arcs), **Fire** (molten cracks, flames, embers), and
  **Water** (flowing waves, bubbles, seashells). That's 9 weapon types × 9 steps, all comically
  oversized and growing as you climb; endgame weapons are the biggest, animate, glow, leave
  elemental footsteps (feathers, stardust, sparks, flames, splashes), wrap you in a sparkling
  aura, and turn your attacks elemental: glowing slashes and projectile trails in the element's
  colors, and an impact on every hit (a pillar of holy light, a cosmic starburst, a lightning
  strike from above, a fiery explosion, or a splash with a ripple). Each element leans a different way: Holy adds
  HP and magic defense, Cosmic your main stat and accuracy, Lightning speed, Fire the most attack,
  Water HP and MP.
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
  dagger toss, claw jab). Advanced jobs add an aura that fades in while idle: Blademaster blade
  wind, Lancer dragon spiral, Pyromancer orbiting fireballs, Cleric halo and feathers, Ranger leaf
  storm, Marksman lock-on reticle, Duelist afterimages and petals, Shadow smoke and shuriken, and
  for third jobs an Inferno Sage fire circle with phoenix wings and a Seraph's wings of light.
  The instructors show off a job aura in their towns.
- **Chat** — press Enter to talk. Messages show in the log and as a speech bubble over your head,
  emoticons like :) :D ;) >:( :3 <3 B) make your face act them out, `/e <face>` shows any
  expression, NPCs chat now and then, and NPCs nearby say hi back when you greet them.
- **Towns and the world map** — each job has a home town in its own style: Sprout Village
  (archers, a pastel village with archery targets), Pastel Harbor (thieves, moonlit docks with
  string lights and alley cats), Ember Crag (warriors, sandstone mesas with forges, banners, and
  training dummies), and Moonleaf Grove (mages, a starry forest with glowing treehouses and
  floating lanterns). The world map (M) shows Tengu Island with every road between maps and a
  "you are here" pin; click a town to fly there from any town for a little gold.
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
src/render/             drawing: pixel toolkit, hero rig, gear designs, weapon paths
                        (weapons, swords, elements), animator,
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

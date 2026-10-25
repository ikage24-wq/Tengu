# Twzt — a cozy pastel side-scroller RPG

A browser game in the spirit of classic 2D MMO side-scrollers: start as a Novice, grind cute
monsters across connected maps, pick a job at level 10 and a specialty at 30, spend AP and SP,
loot and upgrade gear, and take on quests and a boss. Everything is drawn in code in a soft
pastel pixel style. No build step and no dependencies.

## Run it

ES modules need an HTTP server (not `file://`):

```sh
npm start            # or: python3 -m http.server 8000
# open http://localhost:8000
```

Progress saves to your browser automatically (every 20 seconds, on map changes, and when you
leave the tab). Pick **Continue** on the title screen to pick up where you left off.

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
| I / C / K / L | Bag / Stats / Skills / Quests |
| Esc | Close windows |

Mouse: click buttons, double-click (or right-click) items to use or equip them, drag windows by
their title bars. To bind a hotkey, select a skill in the Skills window or a potion in the Bag,
then press the key. Right-click a hotkey slot to clear it.

## Systems

- **Jobs** — Novice → Warrior, Mage, Archer, or Thief at level 10 (talk to the instructors in
  Pastel Harbor) → a second job at 30: Blademaster or Lancer, Pyromancer or Cleric, Ranger or
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
  3 SP per level after advancing.
- **Gear** — 8 slots (weapon, hat, top, bottom, shoes, gloves, cape, earrings), 9 weapon types in
  9 tiers and armor in 6 tiers. Everything you wear shows on your character, and each armor tier
  has its own look (beanie → sun hat → cap → helm → witch hat → circlet, tee → robe, sneakers →
  wing boots, and so on). 17 **unique** pieces have one-of-a-kind looks: Bunny Hood, Kitty Ears,
  Flower Crown, Star Beret, Crystal Crown, Blossom Kimono, Sailor Blouse, Comfy Hoodie, Fairy
  Wings, Angel Wings, Galaxy Cape, Lollipop Wand, Candy Cane Sword, Kitty Paw Claw, Sweetheart
  Dagger, Crystal Harp Bow, and Crescent Moon Staff (a few are sold by Marlo; the rest drop).
- **Weapons** — comically oversized and growing with every tier. Swords follow a **path**:
  Wooden → Iron → Steel → Mithril, then split into five endgame elements at level 45, each with
  its own animated art, aura, and colored hit sparks: **Seraph's Grace** (holy: feathered wings and
  a halo), **Astral Edge** (cosmic: a blade full of stars and an orbiting planet), **Stormcaller**
  (lightning: crackling edges and arcs), **Inferno Fang** (fire: molten cracks and flames), and
  **Tidebreaker** (water: a flowing wave blade with bubbles). Elemental swords only drop. The
  other weapon types (axes, spears, wands, staves, bows, crossbows, daggers, claws) still use the
  earlier per-tier designs.
- **Rarity** — dropped gear can roll **Rare** (16%), **Epic** (5%), or **Legendary** (1.2%) for
  higher stats and bonus STR/DEX/INT/LUK. Rare weapons shimmer with a sweeping glint, Epic ones
  glow and have motes circling the tip, and Legendary ones pulse with an aura and shed sparkles.
  Rare loot glows with a colored beam on the ground, and bosses always
  drop Rare or better. Drops also roll small stat differences. Every item has 7 upgrade slots for
  charms (100% / 60% / 10%) that spend a slot whether they work or not.
- **Animation and feel** — the hero is a layered rig: an 8-frame walk cycle driven by distance
  (so feet never slide), a breathing idle with blinks, stretch on the way up and squash on
  landing, hair and capes that trail behind on springs, attack wind-up and lunge with a weapon
  trail, a climbing cycle, and a hurt recoil. Monsters hop, breathe, pop in when they spawn, and
  squash when hit. Footstep dust, hit sparks, defeat poofs, screen shake, short hitstop on crits
  and kills, and ambient petals, fireflies, and glints in every map.
- **Monsters and maps** — 17 monsters and the Crystal King boss across 9 maps (two towns, two
  meadows, woods, ruins, a crystal cave, a sky garden, and the throne room) with one-way ledges,
  ropes, and portals. Hit monsters chase you; the boss telegraphs a ground slam.
- **Quests and NPCs** — 9 quests (defeat or collect), shops that buy and sell, a salon to restyle
  your hero, and job instructors.
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
src/render/             drawing: pixel toolkit, hero rig, gear designs, weapons, sword path,
                        animator,
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

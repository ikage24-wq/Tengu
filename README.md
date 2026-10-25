# Twzt — 2D Side-Scroller RPG

A browser-based side-scrolling action RPG inspired by MapleStory and Latale.
Pick a class, hunt mobs across connected maps, level up, learn and upgrade skills,
and gear up from drops. No build step: open the page through any static server.

## Run it

ES modules need to be served over HTTP (not `file://`):

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Controls

Character creator: Up/Down choose an option, Left/Right change it, Enter continues.
Class select: 1, 2, or 3.

In game:

| Key | Action |
| --- | --- |
| Arrow keys / A, D | Move |
| Space / W / Up | Jump (land on ledges from above) |
| Down / S (on a ledge) | Drop through the ledge |
| Q, E, R | Cast class skill 1, 2, 3 (AoE) |
| I | Open or close the inventory (equipped gear and bag) |
| F | Ultimate (level 30): Earth Breaker and Sky Volley hit every mob on the map; Starfall hits up to 15 enemies twice, with bonus crit chance |
| H | Drink potion (heals 50% HP) |
| 1, 2, 3 (near Skill Trainer) | Spend a skill point to raise that skill |
| U (near Blacksmith) | Try to upgrade your equipped weapon |
| B (near Shopkeeper) | Buy a potion (25G) |
| Walk into a portal | Travel to the connected map |

## Systems

- **Classes** — Warrior, Mage, Archer. Each has base stats, per-level growth,
  and three AoE skills unlocked at levels 1, 10, and 25 (`src/classes.js`).
- **Progression** — EXP curve that steepens as you level (max level 200).
  Each level gives stat points, skill points, and full HP/MP restore
  (`src/progression.js`).
- **Skills** — Cooldowns, MP cost, and AoE hitboxes in front of the caster.
  Skill levels from the trainer add damage (`src/combat.js`).
- **Mobs** — Snail, Pig, Mushroom, Wolf, Skeleton, and Golem across three maps. They patrol, respawn
  after 10 seconds, and give less EXP when you are far above their level
  (`src/mobs.js`).
- **Character** — Customize hair style and color, skin, eye style and color,
  and outfit color in the creator. Characters are drawn in code, so there are
  no image files to download.
- **Gear** — Five slots (weapon, hat, top, gloves, shoes) in five rarities.
  Better gear auto-equips. Upgrades go from 0 to 15, with success odds that
  fall as the level rises. Failure costs gold but keeps the item (`src/gear.js`).
- **World** — Layered scenery with parallax skylines, cranes, power poles, and brick ground. Ledges are one-way platforms, and some mobs patrol them. Henesys Square (town with NPCs), Green Meadow, and Dark Forest,
  linked by portals. Dangerous mobs only spawn once you reach their level
  (`src/world.js`).

## Layout

```
index.html        page shell
src/main.js       entry point: input, class select, fixed-timestep loop
src/game.js       game state and update step (wires the systems together)
src/render.js     all canvas drawing (world, actors, HUD, class select)
src/progression.js  EXP, levels, stat growth
src/classes.js    class definitions and skill trees
src/combat.js     skill casting, cooldowns, AoE hit detection
src/mobs.js       mob definitions, patrol AI, death rewards
src/gear.js       gear rolls, rarities, upgrades
src/world.js      maps, NPCs, portals, spawn tables
src/appearance.js character customization options and defaults
src/sprites.js    pixel-art sprites built from shapes (no image files)
```

The game draws on a fixed 640×360 canvas that is scaled up with crisp pixels.

The logic modules (`progression`, `combat`, `mobs`, `gear`, `classes`, `world`)
have no DOM access, so they can be tested in Node.

## Not built yet

- Inventory and equipment screens (gear equips automatically; there is no list UI)
- Save and load (progress is lost on reload)
- Selling items and a full shop
- Quests and boss fights
- Sound, and hand-drawn sprite sheets (the pixel art is generated in code from shapes)

## Credits

All art from Kenney (www.kenney.nl), released under CC0 (public domain). License files are in `assets/kenney/`.

- Ground tile: "Pixel Platformer" (`assets/kenney/tilemap_packed.png`, `LICENSE.txt`).
- Monsters and items: "Tiny Dungeon" (`assets/kenney/tiny-dungeon.png`, `LICENSE-tiny-dungeon.txt`).
- Hit sparks and slashes: "Particle Pack" (`assets/kenney/effects/`, `LICENSE-particle-pack.txt`).

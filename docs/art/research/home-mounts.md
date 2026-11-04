# Research: a home island and mounts (EN, with KO/JP games)

Scope: personal housing (growth in stages, free placement of furniture, wall and table items,
trophies, visiting friends, comfort bonuses), the UI of a decorating mode, and mounts (how they are
earned, how each one moves, how a rider is drawn on top). 2D side-view games come first: MapleStory,
MapleStory M, Terraria, Stardew Valley, Spiritfarer, Owlboy, Yoshi's Island. Then the big housing
and mount games: MapleStory 2, Animal Crossing, FFXIV, Palia, Valheim, The Sims, Unpacking, WoW,
Ragnarok Online, Tree of Savior, Elsword. Then player-motivation research and design op-eds.

Searched 2026-11-04 for the home island and mounts features.

## What Tengu already has (so we don't re-suggest it)
- A pet that follows you round (the Mochi, `world/mochi.js`), life skills (fishing, mining,
  gathering, cooking, crafting), boss crowns, town currencies, a 24-minute day clock, and dungeons
  with their own moving parts (fountains that throw you, bubble lifts, currents).
- No housing and no mounts yet.

## 1. Engines and queries that worked
- **WebSearch (standard)** was enough for wikis (terraria.wiki.gg, stardewvalleywiki.com,
  maplestorywiki.net, Nookipedia, consolegameswiki) and guide sites. Its summaries are thin, so the
  key pages were opened with WebFetch.
- **Blocked (403/503):** StrategyWiki, the Nexon support site, elwiki.net, a Reddit mirror of the
  MapleStory M home guide. Their search snippets were still usable and are cited as snippets.
- **Not found:** no public write-up of how MapleStory stores a rider's position on a mount
  (the WZ `TamingMob` data); no housing-specific GDC talk; no Spiritfarer interview about the boat's
  side-view layout. Animation advice for riders came from general follow-through sources instead.

## 2. Top findings

### A. Housing in 2D side view (the closest models for us)

**1. MapleStory's Home (GMS/KMS).** maplestorywiki.net, Home.
- A personal house unlocked at level 200 by a quest ("A Place of Your Own"); the questline goes on
  after you buy it, unlocking more features.
- Several building styles (Small Mushroom House, Cozy Mushroom House, Beach Townhouse, Halloween
  Manor, Maplemas Cabin, Eastern-Style...), most in a Standard and an Expanded version; Expanded ones
  are bigger, often three storeys, with different stair and ladder layouts. Expansion comes from
  blueprints.
- Furniture is placed and moved freely. Sets come from quests, events, Gachapon and packs, grouped
  in themed series (Mushroom House, Old World, Townhouse, Trophy...). A "Collection Rewards"
  section pays out for collecting them.
- **Functional furniture**: music players (CD player, DJ booth, phonograph), a town-portal list, a
  vending machine, a punching game, a password chest. Storage and Professions work across all
  characters.
- Visiting: invite friends, visit friends, or visit random houses to see others' decorating.
- Source: https://maplestorywiki.net/w/Home ; promo write-up (1-, 2- and 3-level homes, 500,000
  mesos): https://www.theouterhaven.net/2022/08/buy-your-next-house-in-maplestory

**2. MapleStory M home: floor vs wall.** Community guide (search snippet; page blocked).
- Furniture comes in two kinds: **floor** pieces stand on the floor, **wall** pieces go in the
  "background" behind them. The guide ranks furniture by **score per space taken**.
- Source: https://lr.us.psf.lt/r/MapleStoryM/comments/13roz5y/guide_maplestorym_home_feature

**3. Terraria: housing in side view.** terraria.wiki.gg, Valid house / House / Room.
- A valid house needs a closed frame, player-placed background walls, a light, a table, a chair and
  a door, and 60-750 tiles. Holes of 5+ tiles in the wall are not allowed. A generic "not valid"
  message often means "no closed frame" or "nowhere for the NPC to stand", which players find
  confusing.
- Source: https://terraria.wiki.gg/wiki/Valid_house ; https://terraria.wiki.gg/wiki/House ;
  https://terraria.wiki.gg/wiki/Housing_menu

**4. Terraria: what goes where in 2D.** terraria.wiki.gg, Platforms / Item Frame / Paintings / Rack.
- Furniture can stand **on platforms** (only in the platform's default "top" position); nothing
  goes on stairs. A bottle placed on a table/platform counts as a crafting station, so placement
  has meaning.
- Hanging furniture (banners, lanterns) hangs **under** platforms.
- **Paintings** go on background walls in fixed sizes (3x3, 6x4...); 173 of them exist.
- **Item Frame** (2x2 on a wall): press it while holding any item to display that item.
  **Weapon Rack** shows a weapon. Plain Racks are decorative only.
- Source: https://terraria.wiki.gg/wiki/Platforms ; https://terraria.wiki.gg/wiki/Item_Frame ;
  https://terraria.wiki.gg/wiki/Paintings ; https://terraria.wiki.gg/wiki/Rack

**5. Stardew Valley: a home that grows in stages.** stardewvalleywiki.com, House; 1.5 changelog.
- Upgrade 1 (10,000g + 450 wood): kitchen and a fridge, bigger bed. Upgrade 2 (65,000g + 100
  hardwood): two rooms, unlocks renovations and repainting. Upgrade 3 (100,000g): a cellar with
  casks for ageing goods. Each stage **adds a function, not only floor space**.
- Renovations (after the 2nd upgrade) are instant and **fully refundable** if the area is empty.
- Since 1.5, beds are ordinary furniture you can pick up and move.
- Source: https://stardewvalleywiki.com/House ; https://www.stardewvalley.net/?p=1763

**6. Stardew Valley: Ginger Island, the second island farm.** Destructoid, Gamesradar, forum.
- A ruined island farmhouse restored for 20 Golden Walnuts paid to a parrot; then a mailbox and an
  obelisk (fast travel) for more walnuts; the island grows piece by piece as you explore it
  (resort, trader, Parrot Express). Crops grow in every season there, but no buildings can be
  built.
- Walnuts are found by fishing, puzzles and exploring, so **growing the island is a reward for
  playing elsewhere**.
- Once bought, the Parrot Express is free to use: **travel home is never taxed**.
- Source: https://destructoid.com/?p=487361 ; https://gamesradar.com/stardew-valley-golden-walnuts ;
  https://forums.stardewvalley.net/threads/spoilers-cant-figure-out-unlocking-areas-on-ginger-island.4379/latest

**7. Spiritfarer: a side-view home that grows.** Thunder Lotus; GameSkinny interview.
- The player's boat is built up in side view by adding buildings (houses for each spirit, a
  kitchen, a garden, a foundry), and how it is built shapes how sea events play out. New buildings
  were added after launch (the Archive Room).
- Source: https://www.gameskinny.com/?p=65297 ;
  https://www.gamereactor.eu/thunder-lotus-games-details-2021-roadmap-for-spiritfarer/ ;
  https://en.wikipedia.org/wiki/Spiritfarer

**8. Owlboy: pastel-warm floating islands.** Interviews with Simon Stafsnes Andersen.
- The islands came out of a movement idea: Mario's raccoon float made him think of flying so high
  you reach islands cut off from the world. Rich warm colours, a limited palette per element,
  parallax for depth, and dense tiny details make each island feel alive.
- Source: https://80.lv/articles/owlboy-10-years-of-indie-dev ;
  https://alternativemagazineonline.co.uk/2017/12/05/interview-in-conversation-with-d-pad-studio-creators-of-owlboy/ ;
  https://en.wikipedia.org/wiki/Owlboy

### B. Housing in the big games: growth, placement and scoring

**9. MapleStory 2.** Engadget (2014), progametalk guide, mmobomb.
- An open-world plot shared across all your characters, reached with one key (N) from anywhere.
- Build with blocks and furniture; expand area and height (up to 25x25 base, 15 high).
- **Interior Design is a life skill**: reach a decor score (from a checklist: bed, table, sofa...)
  to claim a **daily reward**, which levels the skill and unlocks more blocks and furniture.
- **Souvenirs and trophies** from quests and bosses are placed as decor and give a ~1-hour buff when
  used; only one active at a time.
- Functional furniture: storage, a mannequin that swaps gear sets. Farm blocks (chicken pen, rice
  paddy) give resources with a **daily cap that's the same however many blocks you own**.
- Houses get a monthly ranking from daily "recommendations" (one per player per day).
- Source: https://www.engadget.com/2014-09-23-maplestory-2-shows-off-its-housing-system.html ;
  https://progametalk.com/maplestory-2/house-design/ ;
  https://www.mmobomb.com/news/maplestory-2-housing-pricey-proposition ;
  https://www.magicgameworld.com/?p=25788

**10. Animal Crossing New Horizons: Happy Home Academy scoring.** chibisnorlax ACNH FAQ.
- Rated weekly; each room gets points and a letter rank (B/A/S), and the bar rises with house size.
- Points come from **many small, readable rules** rather than one number: base points per item;
  +1,000 at 6/10/15/20 pieces in a room; +400 per wall item (up to 3); a full set +800 per piece; a
  series of 4+ items +1,000 each; a chair, table, bed and wardrobe anywhere +2,500 once; colour
  matching (70% / 90% of 8+ items); feng shui (colour by wall); 3+ items of a category +500; 5+ items
  sharing a concept +400 each; lucky or in-season items +777.
- Penalties: items left on the floor, furniture facing a wall, trash, cockroaches.
- Rewards are **things to display** (pennant, plaques, trophies) at 10k-150k points, sent by mail.
- Source: https://chibisnorlax.github.io/acnhfaq/island-dev/hha ; older-game rules (series/set
  bonuses): https://www.thonky.com/animal-crossing-new-leaf/happy-home-academy ;
  https://nookipedia.com/wiki/Fêng_shui

**11. Animal Crossing: grid, growth, models, terraforming.** Nintendo interviews, guides.
- Rooms are an unseen grid; big furniture covers three cells, small ones one.
- Start in a tent; each upgrade adds space, storage or a room (main room to 8x8, side rooms,
  basement, upstairs); the first move is cheap and quick (5,000 Nook Miles, done on day one).
- Lead furniture designer Ami Takai drew hundreds of pieces, each with its own personality but
  coherent with the world.
- Terraforming came because players reset their games to get the island they wanted: give layout
  control rather than make them reroll.
- **Fish models**: trade in three of a fish to get a model of it to display; some models have a
  surface that holds small items. A trophy of a catch is a piece of furniture.
- Source: https://nintendoeverything.com/animal-crossing-new-horizons-dev-on-how-the-furniture-was-made/ ;
  https://www.imore.com/animal-crossing-new-horizons-how-upgrade-your-tent-house ;
  https://gamedeveloper.com/design/why-nintendo-s-new-i-animal-crossing-i-features-allow-instant-change-in-the-real-time-game ;
  https://nookipedia.com/wiki/Item:Ocean_Sunfish_Model_(New_Horizons) ;
  https://nookipedia.com/wiki/Item:Clown_Fish_Model_(New_Horizons)

**12. FFXIV housing: categories and placement controls.** HGXIV Basics Guide, SE forums.
- Item kinds: **furnishings** (floor), **tabletop** (sit on surfaces when "Counter Surface
  Placement" is on), **wall-mounted** (onto partitions/walls), **fixtures** (walls, floor,
  chandelier: swapped, not placed).
- Tools: Move, Rotate (while holding), Remove (back to the bag). **Grid Snap** on/off toggle for
  clean alignment vs fine placement.
- Players complain the settings reset when the menu is closed, and that floating/odd placements
  need glitch tricks: the system fights creative intent.
- Source: https://hgxiv.com/basics-guide/ ;
  https://forum.square-enix.com/ffxiv/threads/443461-Housing-decoration-system-needs-adjustments

**13. Palia: three placement modes, modular rooms.** Guides and wiki.
- Overhead mode for big items (tents, ponds), a standard grid for most furniture, and **freeform**
  for fine work (a chair tucked right against a table). Rooms snap on like puzzle pieces (one
  connector per side). Start small (11x11) and feel the squeeze early. Caps: 3,500 items, 30 add-ons.
- Housing is a standout in player sentiment, credited to the intuitive grid and placement options.
- Source: https://www.highgroundgaming.com/palia-housing-guide/ ;
  https://palia.wiki.gg/wiki/Housing_Plot ;
  https://www.playnews.gg/en/guides/palia-building-your-dream-house-blueprints-decor-and-garden-2026

**14. Valheim: comfort as a small, honest bonus.** Mobalytics, Shockbyte, wiki.
- Furniture near where you rest adds Comfort; the Rested buff lasts 7 min + 1 min per Comfort.
  **Only one of each type counts** (a bed, a chair, a rug, a banner...), so variety is rewarded and
  stacking duplicates isn't. The buff never gets stronger, only longer. Max around 22-24.
- Source: https://mobalytics.gg/gamebase/guides/valheim-comfort-rested-guide ;
  https://shockbyte.com/blog/simple-valheim-comfort-guide ;
  https://www.corrosionhour.com/valheim-how-does-comfort-work/

**15. MapleStory chairs: comfort you carry.** MeowDB (MapleStory Classic item DB).
- Chairs are collectibles sat on anywhere; each recovers a little HP/MP every 10 s (30-50), many
  come from bosses, events or Gachapon, and event chairs are untradeable keepsakes. The comfort is
  tiny; the appeal is showing it off.
- Source: https://meowdb.com/msclassic/item-db/525 ; https://meowdb.com/msclassic/item-db/2957

### C. Decorating UI

**16. The Sims: the footprint.** The Sims Wiki, wikiHow, EA forums.
- While carrying an object, its footprint tiles show **green where it can go and red where it
  can't**, and a refused placement says why. The footprint also marks the object's front.
- **Hold Alt** for off-grid placement and off-angle rotation; the footprint rules still apply.
- Source: https://www.thesimswiki.com/wiki/Build ;
  https://kiwix.lema.org/wikihow_en_maxi_2023-03/Place-Objects-Anywhere-You-Want-in-The-Sims ;
  https://forums.ea.com/discussions/the-sims-4-general-discussion-en/move-objects-off-grid-/2080966

**17. Builder UX patterns.** builder-ux skill write-up (a practitioner's checklist; weight lightly).
- A translucent **ghost preview** with validity colour (green ok, red blocked by collision or no
  support, a third colour for "not allowed here"), grid and rotation snapping, a soft pulse.
- Say *why* it's invalid and highlight the blocking object; a harsh red can feel discouraging in a
  creative game.
- Make every placement a command with undo/redo; group batch moves into one undo.
- Source: https://playbooks.com/skills/bbeierle12/skill-mcp-claude/builder-ux

**18. Unpacking: placing things as a pleasure.** GDC 2022 talk write-up, GamesRadar.
- Each item has its own pick-up and set-down sounds, recorded on every surface it can land on
  (benchtop, carpet, shelf): placement *feels* physical. Where an item is allowed to go tells a
  story.
- Source: https://www.gamedeveloper.com/gdc2022/gdc-2022-unpacking-a-narrative-through-1-000-household-items ;
  https://www.gamesradar.com/the-making-of-unpacking-developer-witch-beam-on-bringing-the-moving-indie-hit-to-life

### D. Mounts

**19. MapleStory: classic mounts as speed and jump %.** royals.ms, dreamms forum, MapleSecrets,
StrategyWiki snippet.
- The first mount came from a quest (the Hog, level 70: 150% speed, 120% jump); better ones went to
  170-180% speed (Silver Mane, Red Draco), job mounts in tiers (Aran: 150/170/180/200% across
  levels 50-200). **Jump barely changes; speed is the ladder.**
- Old mounts had a tiredness meter that threw you off at 100 (about 5 minutes of riding) and you waited for it to
  drop to 95 to get back on (the old wiki's "Mount Care" section). A meter that throws you off
  is the kind of chore to avoid.
- Source: https://royals.ms/forum/threads/new-source-mount-guide.91620/ ;
  https://forum.dreamms.gg/threads/general-mount-quest.1918/ ;
  http://maplesecrets.blogspot.com/2011/06/maplesea-tamable-mobs-mounts.html ;
  https://strategywiki.org/wiki/MapleStory/Pets ;
  https://global.hidden-street.net/quest/el-nath-mt-aquaroad/monster-riding

**20. MapleStory: flying mounts (Soaring).** Nexon forums.
- A separate **Soaring** skill lets certain mounts (Dragon, Magic Broom, Pegasus, Cloud, Owl,
  Balrog) fly in most towns and hunting maps: Up + Jump to rise. Which mounts can soar is written in
  their description. Bug reports and confusion over which mounts qualify were common: the rule
  "this one flies" must be obvious.
- Source: https://forums.maplestory.nexon.net/discussion/22456/mir-soaring-skill-not-working ;
  https://forums.maplestory.nexon.net/discussion/35659/soaring-mount-skill-not-working

**21. Terraria: every mount moves its own way.** terraria.wiki.gg, Mounts / Slime Mount.
- The best reference for a 2D side-view mount roster with distinct movement:
  - **Slime** (from King Slime): jumps and falls twice as fast, low run speed, hurts enemies you
    land on, floats on water so you can fish from it.
  - **Bunny**: slow to speed up, cancels fall damage. **Pogo stick**: very high jumps.
  - **Unicorn / Goat / Basilisk**: an extra mid-air jump and fast running.
  - **Winged Slime**: limited flight, hover sideways with Down + Jump.
  - **Bee**: fast limited flight with auto-hover, slow on land. **Witch's Broom / UFO**: free flight
    but can't drop through platforms or dismounts in water.
  - **Turtle / Lava Shark**: slow on land, fast in liquid. **Rat**: tiny, fits 1-tile gaps, climbs.
  - **Roller skates**: keep momentum forever. **Horses**: slow to accelerate, charge damage.
- Every mount trades something (slow on land, limited flight, can't use items), so **no mount is
  strictly best**; the right one depends on the map.
- Most mounts come from bosses, crafting or merchants; most raise the player's height to 4 tiles.
- Source: https://terraria.wiki.gg/wiki/Mounts ; https://terraria.wiki.gg/wiki/Slime_Mount ;
  https://terraria.wiki.gg/wiki/Gelatinous_Pillion

**22. Ragnarok Online: riding as a job trait.** iRO Wiki.
- Knights/Crusaders ride a Peco Peco: +25% speed and +1000 weight, but attack speed -50% (a mastery
  skill reduces the penalty). Riding is a real trade-off, and the rider sprite is drawn as a whole
  new sprite set, not a character pasted on top.
- Source: https://irowiki.org/wiki/Peco_Peco_Ride ; https://irowiki.org/wiki/Cavalry_Mastery

**23. Tree of Savior and Elsword: companions you ride.** Official ToS guide; Elwiki snippet.
- In ToS a companion pet becomes a mount; mounted, some classes get mount-only skills and a speed
  bonus. In Elsword, mounts from summon stones fight through dungeons with their own attacks.
- Source: https://treeofsavior.com/page/guide/view.php?n=23 ; https://elwiki.net/w/Mount_System

**24. FFXIV: mount collecting and the flying unlock.** consolegameswiki, mmobomb.
- 300+ mounts; many are tied to achievements in every kind of play (gathering, crafting, PvP,
  mentoring), and trackers (FFXIV Collect) show how rare each is (some ~16% of players), which feeds
  prestige.
- Flying is unlocked per zone by collecting Aether Currents. A critic: it's painless but became a
  checklist that lost its sense of discovery; suggests a little flight from the start that grows,
  or unlocks tied to the zone's own events and monsters.
- Source: https://ffxiv.consolegameswiki.com/wiki/Mounts_list ; https://ffxivcollect.com/ ;
  https://ffxiv.consolegameswiki.com/wiki/Aether_Currents ;
  https://www.mmobomb.com/game-design-spotlight-7-collecting-aether-currents-ffxiv-scavenger-hunt-without-excitement-of-discovery

**25. Yoshi: the friendly floaty mount.** Wikipedia; Yoshi speedrun wiki; Nintendojo.
- The flutter jump makes Yoshi easier to control in the air than Mario and fits the game's relaxed
  pace; the kicking legs show the effort, so the animation is the feedback. Holding jump starts the
  flutter as you start to fall.
- Source: https://en.wikipedia.org/wiki/Yoshi%27s_Island ; https://yoshi.science/index.php/Fluttering ;
  https://www.nintendojo.com/features/columns/top-ten/top-ten-platforming-game-mechanics/9

### E. Drawing a rider on a mount

**26. Separate layers, a rider offset per frame.** Admurin's rider pack; LPC horse threads; RPG
Maker mount plugin.
- Rider sprite packs keep **rider, mount and tack as separate layers**; LPC artists note riders
  need a per-direction vertical offset (e.g. 14 px higher facing up). Tools expose a rider X/Y
  offset per mount.
- Source: https://admurin.itch.io/pixel-character-horse-rider ;
  https://opengameart.org/content/lpc-horse-riding-updated-091 ;
  https://opengameart.org/content/lpc-horse-extended

**27. The rider's bob is the mount's bob, delayed.** Animation-school trot assignment; follow-through
guides.
- Copy the mount's vertical motion onto the rider, shifted later in time and smaller; then add
  follow-through (hair, scarf, tail, ears) on top. The hips lead, loose parts drag and settle. Push
  the secondary motion further than feels right, then dial back.
- Source: https://dglatour.blogspot.com/p/aca.html ;
  https://blog.cg-wire.com/follow-through-overlapping-action ;
  https://garagefarm.net/blog/follow-through-and-overlapping-action-in-animation ;
  https://sites.google.com/view/art379/lessons/walk-cycles

### F. What makes housing and collecting fun (and not a chore)

**28. Housing as attachment, and how it fails.** onemanmmo op-ed.
- It works when decor is showable, the home is a gathering spot, and decor comes from
  **exploring and social play** rather than a shop. It fails with furniture grinds, decor that is
  only stat bonuses (players optimise rather than live in it), empty spaces, private silos nobody
  visits, and **decay or upkeep that forces logins** ("a hostage situation").
- Source: https://onemanmmo.com/player-housing-is-retention-disguised-as-furniture/

**29. WoW Garrisons: the home that pulled players out of the world.** Ion Hazzikostas interviews.
- Garrisons were built almost purely as function (missions, gold, crafting at home), and
  Blizzard admitted missteps; the lesson Hazzikostas gave for the next expansion: "we don't want something that pulls you out of the world". The home should send players
  back out, not replace the world.
- Source: https://sportskeeda.com/esports/news-it-s-legion-s-fault-asmongold-realizes-like-battle-azeroth-shadowlands-expansions-world-warcraft ;
  https://massivelyop.com/2016/03/25/wow-factor-the-problem-with-garrisons-isnt-garrisons/ ;
  https://pcgamesn.com/wow/why-world-warcraft-warlords-draenors-garrisons-arent-guilds

**30. Why players collect.** Toups et al., CHI PLAY 2016, "The Collecting Itself Feels Good".
- 180+ players: they collect gear, critters, characters, skins, **vehicles** and information; they
  value them for use and enjoyment first, then investment, **memory** and self-expression, and they
  share collections. Collection screens should let players curate, keep the context of where a
  thing came from, and share; static catalogues fall short.
- Source: https://uwspace.uwaterloo.ca/handle/10012/12789 ; https://core.ac.uk/download/144150067.pdf ;
  https://hcigames.com/collection-interfaces-for-digital-game-objects/

**31. Completion and Design motivations.** Quantic Foundry write-ups.
- "Completion" (fill every collection) is in the top three for every player group; "Design"
  (express yourself through a project) is the creativity drive housing feeds. Build-and-invest
  games retain for months, but quests that dictate *what* to build work against self-expression.
- Source: https://massivelyop.com/2016/01/07/massively-overthinking-lets-play-with-the-gamer-motivation-model/ ;
  https://quanticfoundry.com/ ; https://www.goodreads.com/author_blog_posts/5979070-gdc-building-game-retention-tips ;
  https://gdcvault.com/play/1024153/From-Rational-to-Emotional-Designs

## 3. Apply to Tengu

**The island's growth stages**
- Each stage adds a *thing to do*, not just room (Stardew #5, MS2 #9): 1) a small island with a
  hut, a bench and one garden plot; 2) a fishing pond (its own island fish); 3) an ore rock and a
  herb patch; 4) a second floor or a neighbouring islet joined by a bridge (more wall and floor
  space); 5) a display hall/terrace for trophies. Stage one is reached within the first hour (AC's
  day-one move, #11).
- Pay for growth with things found in play (life-skill materials, boss crowns, a few island-only
  finds from fishing and exploring, like Ginger Island's walnuts #6), never a grind of one item.
- Travel there and back free once unlocked (#6), and the island sends you back out: its plots and
  pond add to life skills but cap daily (MS2's same-cap rule, #9), so it never replaces hunting
  maps (Garrisons #29). No decay, no upkeep, no withering plants that punish time away (#28).
- Side-view island art after Owlboy (#8): warm pastels, parallax sea and sky, and dense tiny idle
  life (birds, bobbing buoys, washing on a line). Follow the map rules: a landmark, a moving part
  (a bouncy cap or a cloud lift), day and night.

**Free placement in side view**
- Four layers, as MapleStory M, Terraria and FFXIV do (#2, #4, #12): **floor** items stand on a
  floor or platform; **wall** items hang on the back wall behind them; **surface** items sit on
  the top of a table or shelf (each piece declares a surface line); **hanging** items hang under a
  ceiling or ledge. Plus fixtures (wallpaper, floor, roof style) that are swapped, not placed.
- Snap to a fine grid (e.g. 4 px) by default with a toggle for free placement (Palia, FFXIV, Sims
  Alt, #12-13, #16); feet snap to the nearest floor line under the cursor.
- Flip left/right instead of rotating (side view). Items can overlap front to back by layer, never
  float. Keep the settings when the mode is closed (FFXIV complaint, #12).
- Trophies: boss crowns and record fish become displayable pieces (AC fish models #11, Terraria
  item frame #4): a fish plaque reads the catch's size and date (memory value, #30).

**The decorating UI**
- The carried item is a ghost following the cursor, soft green where it fits and soft red (pastel,
  not harsh) where it doesn't, with a one-line reason ("needs a floor", "overlaps the bench") and a
  highlight on the blocker (#16-17).
- Every move is undoable (undo/redo stack, a whole group move is one undo); "put away" returns to a
  storage bag instantly and for free (Stardew's refundable renovations #5).
- Each item has its own pick-up and set-down sound and a little settle (a squash-free bounce/jiggle
  on landing, dust puff): placing should feel good on its own (Unpacking #18).
- A filtered catalogue (floor/wall/surface/hanging, by set and colour), and a "show comfort"
  overlay that lists which rules a room meets.

**Comfort and reward loops**
- Comfort is a small, longer-lasting rest buff, not power (Valheim #14, chairs #15): only one of
  each type counts, so variety beats stacking (Valheim), and stacking stat furniture is pointless
  (#28).
- Score like HHA (#10) with several readable rules: variety of kinds, a full set, a colour theme,
  a lit room, a trophy on show. Pay out in **displayable** rewards (plaques, a pennant, a
  ribbon on the gate) and new recipes, plus a daily small claim like MS2's (#9).
- Visiting matters: a friend's visit leaves a "like" (one a day, MS2 #9), visitors can sit on your
  chairs and fish your pond once, and a host can show the island in the party list. Collections
  (furniture sets, mounts, trophies) get a curated shelf view that keeps where each came from
  (#30).

**Mount movement and animation**
- Each mount has one movement idea and one trade-off (Terraria #21): Mochi bounces high and lands
  softly but runs slower; Paper Crane glides down from ledges (hold Jump, like Yoshi's flutter
  #25) but can't double jump; Cloud floats over gaps for a moment (limited hover, shown by the
  cloud thinning) but is slow uphill; a later one swims or climbs. Speed sits at ~130-160% of
  walking (MapleStory used 150-200%, #19); jump changes least. No tiredness meter (#19).
- The first mount from a short quest (Hog, #19); others from crafting, boss crowns, rare fish and
  town currencies, each tied to where it is earned (FFXIV's critic, #24). The "this one floats/glides"
  ability is written on the mount and shown in its icon (MapleStory Soaring confusion, #20).
- Draw rider and mount as separate rigs with a per-frame rider seat offset (#26); the rider's bob
  copies the mount's, delayed a frame or two and smaller; ears, tails, hair and the crane's paper
  wings trail and settle (#27). Bounces show in pose and height only (no squash, per the standing
  rule): the Mochi tucks and lifts, the rider leans back on take-off and forward on landing.
- Mounted, the hero sits in a riding pose drawn for each mount (RO drew whole riding sets, #22),
  and the hero's face stays clear of the mount's head and wings in every frame.

## 4. Reference list
1. https://maplestorywiki.net/w/Home
2. https://www.theouterhaven.net/2022/08/buy-your-next-house-in-maplestory
3. https://lr.us.psf.lt/r/MapleStoryM/comments/13roz5y/guide_maplestorym_home_feature
4. https://terraria.wiki.gg/wiki/Valid_house
5. https://terraria.wiki.gg/wiki/Platforms
6. https://terraria.wiki.gg/wiki/Item_Frame
7. https://terraria.wiki.gg/wiki/Paintings
8. https://terraria.wiki.gg/wiki/Mounts
9. https://terraria.wiki.gg/wiki/Slime_Mount
10. https://stardewvalleywiki.com/House
11. https://www.stardewvalley.net/?p=1763
12. https://destructoid.com/?p=487361
13. https://gamesradar.com/stardew-valley-golden-walnuts
14. https://www.gameskinny.com/?p=65297
15. https://80.lv/articles/owlboy-10-years-of-indie-dev
16. https://alternativemagazineonline.co.uk/2017/12/05/interview-in-conversation-with-d-pad-studio-creators-of-owlboy/
17. https://www.engadget.com/2014-09-23-maplestory-2-shows-off-its-housing-system.html
18. https://progametalk.com/maplestory-2/house-design/
19. https://chibisnorlax.github.io/acnhfaq/island-dev/hha
20. https://www.thonky.com/animal-crossing-new-leaf/happy-home-academy
21. https://nintendoeverything.com/animal-crossing-new-horizons-dev-on-how-the-furniture-was-made/
22. https://www.imore.com/animal-crossing-new-horizons-how-upgrade-your-tent-house
23. https://nookipedia.com/wiki/Item:Clown_Fish_Model_(New_Horizons)
24. https://hgxiv.com/basics-guide/
25. https://forum.square-enix.com/ffxiv/threads/443461-Housing-decoration-system-needs-adjustments
26. https://www.highgroundgaming.com/palia-housing-guide/
27. https://mobalytics.gg/gamebase/guides/valheim-comfort-rested-guide
28. https://meowdb.com/msclassic/item-db/525
29. https://www.thesimswiki.com/wiki/Build
30. https://playbooks.com/skills/bbeierle12/skill-mcp-claude/builder-ux
31. https://www.gamedeveloper.com/gdc2022/gdc-2022-unpacking-a-narrative-through-1-000-household-items
32. https://royals.ms/forum/threads/new-source-mount-guide.91620/
33. http://maplesecrets.blogspot.com/2011/06/maplesea-tamable-mobs-mounts.html
34. https://forums.maplestory.nexon.net/discussion/22456/mir-soaring-skill-not-working
35. https://irowiki.org/wiki/Peco_Peco_Ride
36. https://treeofsavior.com/page/guide/view.php?n=23
37. https://ffxiv.consolegameswiki.com/wiki/Mounts_list
38. https://www.mmobomb.com/game-design-spotlight-7-collecting-aether-currents-ffxiv-scavenger-hunt-without-excitement-of-discovery
39. https://yoshi.science/index.php/Fluttering
40. https://admurin.itch.io/pixel-character-horse-rider
41. https://opengameart.org/content/lpc-horse-riding-updated-091
42. https://blog.cg-wire.com/follow-through-overlapping-action
43. https://onemanmmo.com/player-housing-is-retention-disguised-as-furniture/
44. https://massivelyop.com/2016/03/25/wow-factor-the-problem-with-garrisons-isnt-garrisons/
45. https://uwspace.uwaterloo.ca/handle/10012/12789
46. https://massivelyop.com/2016/01/07/massively-overthinking-lets-play-with-the-gamer-motivation-model/

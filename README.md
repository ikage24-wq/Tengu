# Tengu — a cozy pastel side-scroller RPG

A browser game in the spirit of classic 2D MMO side-scrollers: start as a Novice, grind cute
monsters across connected maps, pick a job at level 10 and a path at 30, spend AP and SP,
loot and upgrade gear, and take on quests and a boss. Everything is drawn in code in a soft
pastel style: characters are short pixel chibis in the classic MMO style (a big round head with
ears and big soft eyes, rounded bangs with a shine band, and one sturdy little jointed body for
everyone, turned three-quarters toward where they're facing, with nine eye styles and twenty animated hairstyles: locks that bend and ripple in a breeze, bangs you can
swap between sixteen kinds, and optional two-tone tips), drawn crisp at 2x detail with a dark pixel outline whose corners are softened;
they and the monsters get three-tone shading: a soft lavender shadow at the back of each part, the
base color, and a warm highlight on the front edge;
the world and items are pixel art. No build step and no dependencies.

## Play online

**https://ikage24-wq.github.io/Twzt/** (served by GitHub Pages from this branch). Plays with a
keyboard, or on a phone or tablet with the on-screen controls (they appear on the first touch; hold
the phone sideways).

### With friends

**Play with Friends** (the two-people button on the menu bar, or N) has two tabs: **Friends**
(the players you've added: who's on and where, Invite, a friend asking you to hunt) and **Room**.
On Room, press
**Host a room**:
you get a six-digit code. Friends (up to 3) open the same window, type the code on the pad, and
press **Join**. Everyone in the room sees each other on the same map, fights the same monsters,
and chats; a monster's fall gives full EXP to everyone who hit it and a party share to the others
on the map, and each player gets their own loot. Players connect
straight to each other (WebRTC through the free PeerJS broker), so there's no server to run.
Adding `?net=local` to the address plays between tabs of one browser instead, for testing.

Things to do together:

- **Parties.** Invite a friend from their row in Play with Friends, or tap them (right-click for
  options). The leader invites; party friends show on the party panel with their HP and where
  they are, warping to them costs half, and the warden takes only your party into dungeons.
- **Inspect.** Tap a friend (in the world, the party panel or the friends list) to see their
  profile: their look, gear, stats and collection.
- **Friends on the maps.** Friends show as dots on the minimap (rose for your party) and as badges
  with their initial on the world map.
- **Party dungeons.** Friends standing at a dungeon's gate with a job join the group the warden
  forms (bots fill the seats left). The one who formed it leads: their game runs the rooms,
  monsters, bosses and bots, and everyone's blows, taunts, heals, buffs and room tasks reach it.
- **Trading.** Each friend's row has a Trade button: both sides put in up to six items and some
  gold, press Ready, and the swap happens when both are ready (any change takes the marks off).
- **Warp to a friend** for free, unless they're in a dungeon or trial.
- **Fishing together.** Friends see each other's lines and hear about each other's catches.
- **Queen rematches.** A returning queen's moves (and their warnings) reach everyone on her map.
- **Quests** count every kill on the map you share, so friends hunting together all progress.
- **Emotes.** T (or the phone's EMOTE button) opens a wheel of eight: cheer, dance, flip, love, thanks and more.

### Phone controls

A thumb stick on the left walks and climbs (push up to talk to NPCs and take portals). On the
right: Attack, Jump, Loot, and your first four hotkeys as skill buttons; the hotkey bar's bubbles
can be tapped too. The speech button opens chat with the phone's keyboard. Everything else (menus,
windows, NPCs) works by tapping. Options > Phone sets a left-handed layout (stick on the right).

## Run it

ES modules need an HTTP server (not `file://`):

```sh
npm start            # or: python3 -m http.server 8000
# open http://localhost:8000
```

Progress saves to your browser automatically (every 20 seconds, on map changes, and when you
leave the tab). Pick a world, then pick a hero on the character select tree and press **Start**
(or Enter). The tree holds up to 8 characters; click an empty slot to create one.

### Windows app (auto-updating)

Tengu also ships as a Windows app: an installer (`Tengu-Setup-<version>.exe`) that puts it in
the Start menu and on the desktop, and updates itself from this repository's GitHub Releases. On
every launch (and every few hours) it checks for a newer release, downloads it in the
background, and asks the player to restart; if they choose Later it installs when they quit.
Saves carry over: the app always serves the game from the same address (`app://tengu/`), whose
local storage is kept in the player's app data folder.

```sh
npm install          # once: Electron, the installer builder and the updater
npm run desktop      # play the app from the source, no installer (F11 full screen, F12 dev tools)
npm run dist         # build dist/Tengu-Setup-<version>.exe without publishing
npm run icon         # redraw electron/icon.png from tools/app-icon.html
```

To ship an update:

1. Bump the version: `npm version patch` (or `minor` / `major`). This updates `package.json` and
   the version on the title screen (`src/version.js`), then commits and tags it.
2. Make a GitHub token with **repo** access (GitHub > Settings > Developer settings > Personal
   access tokens) and put it in the `GH_TOKEN` environment variable, for example in PowerShell:
   `$env:GH_TOKEN = "ghp_..."`.
3. `npm run release`: builds the installer and uploads it, with the `latest.yml` file the
   updater reads, to a new GitHub Release for that version. Push the commit and tag too
   (`git push --follow-tags`).

Every installed copy picks the new version up the next time it starts. Players install the first
version themselves from the Releases page. The app isn't code-signed, so on first install Windows
SmartScreen says "Windows protected your PC": click **More info**, then **Run anyway** (updates
don't ask again). A code-signing certificate removes that warning.

`TENGU_SMOKE=1` makes the app (from the source or a build) load the game, check it started with
no errors and that saves stick, print the result and quit, so a build can be checked from the
command line: `$env:TENGU_SMOKE=1; ./dist/win-unpacked/Tengu.exe`.

### Job balance

`npm run balance` plays every job in the real game against practice dummies and checks the role
rule at levels 20 to 60: damage jobs come out level overall (each with its own lean toward one
target or crowds, up to 8%), tanks deal 75% of that and healers 65%, on one target and on a
crowd, so a tank or healer never outdoes a damage job. `node tools/balance.mjs 50` prints the
full table (damage, MP, toughness, healing); `tools/tune.mjs` finds each job's damage tuning
(`power` and `spread` in `src/data/jobs.js`) and `tools/tune-skills.mjs` makes every finisher
worth its full gauge (`dmg` in `src/data/skills.js`).

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

- **Jobs** — Novice → Warrior, Archer, Thief, or Spirit Mage at level 10 (each instructor lives
  in their job's home town). Every first job has a movement skill (Shoulder Charge, Backflip Shot,
  Shadow Step, Spirit Step). Taking a first job gives back every stat point spent as a Novice, to
  put into the new job's stat. The Warrior, Archer and Thief each pick one of two paths at level 30
  (below), after their instructor's trial; the Spirit Mage picks the Shrine Maiden or the Onmyoji.

  Monsters can be **frozen** (in a block of ice) or **stunned** (seeing stars) so they can't move or
  hurt you, and **poisoned** (green) or **bleeding** (red) so they take damage every second. Spells
  cast over a magic circle in their school's color; big weapon skills flare with a burst of
  power.
- **Stats** — STR, DEX, INT, LUK with 5 AP per level (an Auto button spends them for your job).
  Damage uses a primary and secondary stat per weapon type, mastery raises your minimum damage,
  magic scales with INT, and accuracy vs. monster avoid decides hits and misses (nothing within 5
  levels of you is ever missed). Crits deal +50%. Levels go to 50, the cap for now.
- **Skills** — 3 Novice skills, 5 or more per first job and 5-6 per path: attacks, area hits, multi-hit
  combos, projectiles, buffs (attack, defense, speed, booster, mana shield), heals, and passives.
  3 SP per level after advancing. Stat-only skills (the masteries, Toughness, Nimble...) aren't
  bought with SP: they grow with your level, full 20 levels after the job. Big skills root you in place for a short wind-up (about a
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
  their target pointed along their path, and hit when they arrive.
- **Throwing stars** — a gauntlet throws its own stars, better ones the higher its level, and
  they add their attack: Pebble (+15), Steel (Lv 10, +17), Mint (Lv 20, +19), Moon (Lv 30, +21),
  Crimson (Lv 40), Thunder (Lv 50), Flame (Lv 60), Crystal (Lv 70) and Starlight (Lv 80, +30); the
  last four hit with their element. There are no stars to buy, carry or run out of (a gauntlet's
  tooltip says which it throws).
- **Warrior** (steel blue and white: the blue cross, swords, a shield) — he fights with his basic
  attacks, and his skills go off on their own from them. His own basic combo is four swings, each
  drawn from a few so the string keeps changing (the first combo is the classic one, and never
  the same string twice in a row after that), all played big and heavy: an opener (a cut, a
  hip-height sweep, three lightning jabs, or a flash cut that blurs through the line); a second
  blow (the return cut, a spinning backhand, a shoulder check, or a driving stab); a third (a
  stepping cross-cut, a rising diagonal that pops them up, or a wound-up home-run swing that
  sends them flying); then a finisher (a two-handed cleave, a leaping chop, or a sky-splitter that
  leaps high and splits the ground in slow motion). Quick swings hit light and fast; heavy ones
  hold a longer impact, shake the screen and throw monsters far. Plus the sword's command moves
  below, and down + attack for a leaping slam that cracks the ground all around.
  **Valor** is his gauge (a shield on the HUD): every blow that lands builds it, faster the more
  monsters one blow catches at once, and it drains once the fighting stops. Full, he is
  **Unbroken**: his blows land heavier and knock harder, and nothing knocks him back. Skills that
  go off on their own (spend points to make them go off more and hit harder): **Blade Rush**
  (a swing, hit or miss, sometimes rushes on into an extra cross-cut of steel), **Whirlwind** (the combo's
  cleave sometimes spins on into a whirlwind that sucks monsters in and flings them away; always
  when it catches three or more), **War Cry** (as Valor fills he shouts: every monster around
  turns on him, and he and the party around him take less damage), **Iron Guard** (a hard hit
  sometimes makes him brace, calling out IRON GUARD: much less damage and harder armor for a few
  seconds); **Weapon Mastery** and **Toughness** grow by themselves with his level. Only two buttons besides attack: **Shoulder Charge**
  barrels through everything in your path (untouchable on the way), and his finisher, **Titan
  Breaker**, needs full Valor and spends it: he leaps high as a giant sword of steel forms over
  him, then crashes down and drives it into the ground, splitting it open with blades of steel
  light and throwing everything around into the air.
- **Archer** (warm gold and sky blue: gold arrows, a huntress with tricks) — like the Warrior, she
  fights with her basic shots and her skills go off on their own. Her basic combo with a bow or
  crossbow mixes its shots so it never repeats (the first combo is her own: a snap shot, two gold
  arrows a beat apart, a full draw that tears through the line; after that each shot is drawn from
  a pool: a stomping kick then a shot point-blank, a twirl that looses two, three arrows in a
  burst, a hop back loosing two down at them, a backflip fan of three, an overdraw through the
  line, a volley that rains down on them); her back flips come mid-string and the next shot darts
  her back in, so the combo flows on. **Air leap**: jump again in mid-air and she springs up and
  back in a backflip, loosing two shots down at them from the top of it (gold, or green wind for
  the Beastmaster, violet storm for the Stormcaller), once per jump. She has her own command shots (up + attack shoots fliers higher, down + attack leans
  out and looses two arrows down at whatever is below, two shots from a hang in the air, a sliding
  shot out of a run). **Momentum** is her gauge (a feather): every shot
  that lands builds it, more for each one landed in a row, and taking a hit knocks half of it
  away. Full, she has **Hawkeye**: her arrows fly faster and reach further, and curve to find
  monsters above and below. A simple first job (the paths add the flair): two tricks go off on
  their own, hit or miss: **Blast Arrow** (a shot sometimes bursts on impact, hitting everything
  close round its target; a burst of fire, or on the paths a gale of wind and leaves for the
  Beastmaster and a thunderclap for the Stormcaller), **Snare Arrow** (a shot sometimes tangles its target in a rope net that
  holds it in place for a few seconds, and her shots hit a netted monster harder). **Steady Hands**
  (faster, truer shots) and **Light Feet** (faster running, more dodging) grow by themselves with
  her level. Her buttons are **Spring Trap** (a steel trap set on the ground just ahead; the first
  monster to step on it is snapped and flung into the air; up to three at once), **Vault** (she springs up and over the monster in front
  in a front flip, untouchable, lands behind it and turns to shoot it) and her finisher,
  **Comet Arrow**, which needs full Momentum and spends it: she leaps high into the air, hangs
  there aiming straight down while the arrow catches fire, and fires a giant flaming arrow that
  crashes into the ground ahead like a meteor: the ground cracks open in gold, a shockwave races
  out both ways, and everything nearby is thrown into the air. A Beastmaster who learned Vault
  looses its shot as her own green arrow.
- **Thief** (violet and midnight with moonlight silver: crescent moons and smoke) — the first job
  builds the base for both of the Thief's later paths, so its book is a choice: put points into
  the dagger skills, the gauntlet skills, or both. She fights light and acrobatic, low and loose
  on the balls of her feet. Her combos never stop: back flips come in the middle of a string, and
  the next blow darts her straight back in, so every finisher ends planted in reach and holding
  attack flows on and on. With a dagger she has her own basic combo (a stab, a slash that rides up
  into a backflip, a planted X-cut) and a pool of others it mixes in (a blur of stabs, a flash cut
  that darts through, a plain slash, a spinning roundhouse kick, a spinning backhand, a vaulting
  front-flip cut, a whirl); her own dagger command moves are a flipping launcher, fast air stabs
  and a diving stab, and a dash that slips through the line. With a gauntlet her own star combo (a
  star, a backflip whipping two stars down from the top of it, a heaving throw of the moon star
  through the line) mixes in a twirling throw, two stars, a fan of three, and a twirl that flings
  the moon star out of the turn; her command throws go up at fliers, from the air, and out of a
  run. **Flash jump**: jump again in mid-air and she kicks off the air and shoots far forward in a
  burst of her colour (violet moonlight; ink and a red seal for the Shinobi, blue fox fire for the
  Kitsune), once per jump. **Shadow dash**: double-tap left or right and she drops low and slips
  forward as a shadow, untouchable, straight through the monsters, with a short beat before the
  next. Darting (Shadow Step, her
  dashes and flash cuts, Backstab, the finisher's blinks) leaves violet afterimages of her behind. **Shadow** is her gauge (a crescent moon): every hit builds it, faster while
  hits land in a quick chain, and it fades fast once the fighting stops. Full, she has
  **Phantom**: a smoky, see-through violet copy of her repeats every attack a beat later (its
  stars don't come out of your bag). Shared skills: **Shadow Step** (dart through the monsters in smoke, untouchable),
  **Haste** (you and the party run and jump faster), **Nimble** (avoid and accuracy). Dagger:
  **Twin Fang** (a three-press combo: stab, stab, cross-slash and a backflip out), **Backstab**
  (melt into smoke, slip through a monster, step out of the smoke behind it and stab it in the
  back; much harder on one facing away), **Dagger Mastery**, and
  the finisher **Moonlit Assassination** (needs full Shadow and spends it: night falls, she
  vanishes and blinks from monster to monster cutting each one, then a giant crescent moon cuts the
  line). Gauntlet: **Lucky Seven** (a three-press combo: two stars, two more, one big spinning moon
  star and a backflip out), **Star Fan** (one star per monster), **Gauntlet Mastery**, and the finisher **Full Moon
  Volley** (needs full Shadow: a storm of stars gathers into a full moon over the monsters, bursts
  into a rain of stars, and a giant crescent moon cuts the line). The masteries only count with
  their own weapon.
- **Spirit Mage** (white spirit light, paper streamers, scarlet cords and gold bells) — the magic
  class, taught by Elowen at the Mage Tower. Damage and support at once, with a wand or staff
  redrawn as shrine tools (a kagura bell staff, a gohei). She casts the way a shrine maiden dances
  kagura: slow, elegant and smooth, about a second a figure, her feet sliding flat along the floor
  in long gliding steps, the bell staff and an open folding fan sweeping wide, the bells ringing,
  the fan folding shut and snapping open with each spell; on her big casts she rises onto her
  toes. She never spins: her turns are sways from the hips with the fan circling round her. Her
  basic dance mixes a pool of figures (a sweep, a swaying step, ringing the bells, a fan sweep, a
  rise onto one foot, the dance's last figure, a bow and rise), each sending bolts of white spirit
  light, and she has her own command casts. **Spirit** is her gauge: her spells that land build
  it, and so do her heals, half again when she turns from one to the other; full, she has
  **Kami's Favour**: every damage spell also mends allies near where it lands. Her skills:
  **Spirit Bolt** (a three-figure dance of bolts), **Spirit Step** (she comes apart into
  streamers and light and gathers again ahead), **Spirit Wave** (the bell staff struck to the
  floor: a ring of light races out both ways), **Blessing** (bells rung overhead, arms opened: a
  column of warm light heals her and the party, then a little more every second), **Spirit Ward**
  (the fan swept all the way round her: a sphere of light bound with a sacred rope soaks up damage
  on her and the party, and bursts when it breaks), **Mana Mastery** (passive), and the finisher
  **Heaven's Lantern** (needs full Spirit: she bows, lifts her arms, and a giant paper lantern
  rises over the monsters with the doll riding on top cheering; its rays strike the monsters on
  screen again and again, each one healing the party, then it blazes and bursts over everything).
  **The Spirit Doll** floats at her shoulder: a tiny paper shrine doll and an imp, who fights on
  her own with eight tricks of her own (a paper-fan slap, a streamer twirl, a bell dropped on a
  head, a dropkick, a paper charm that sticks and pops, an akanbe that leaves a monster too cross
  to move, a rodeo on a monster's head bonking it with her bell, and a spitball volley through a
  paper straw), cheers when what she picked on goes down, fumes when the Spirit Mage is hurt, and
  can't keep still between fights (laps round her head, peekaboo upside down, cheek pokes, loops).
  In a dungeon group the Spirit Mage takes the healer's seat.
- **Command combos** — with a sword, axe, spear, dagger or bare hands: **Up + attack** is a
  launcher that throws monsters up and hops you after them; **attacking in the air** plays an air
  combo (two cuts that keep you hanging, then a dive that slams into the ground on landing); and
  **attacking out of a run** is a lunging dash attack. Each move eases out of the one before it
  instead of snapping.
- **Hit counter, Links and finishers** — every hit you land keeps a counter going on the right
  (it drops after 3 seconds without a hit, but never mid-move), warming in colour at 10, 25, 50
  and 100. Start a skill right after a combo's last blow lands
  and it's a **LINK** for +25% damage. When a path's own gauge is full, its finisher is ready
  ("FINISHER READY" over the gauge): the Paladin's **Grand Verdict** at full Faith (rise on a
  column of light and drive a giant sword of light into the ground) and the Berserker's **Crimson
  Eclipse** at full Rage (spin up in a whirlwind under a blood moon and crash down). A finisher
  spends the whole gauge.
- **Smooth controls** — once a move's blows have landed (or its arrows are away), walking or
  jumping cuts its follow-through short, and a basic attack can flow straight into a skill (so you
  can weave Shoulder Charge into a sword combo). Each skill plays out its own motion before another
  skill can start, though, and moving doesn't skip that, so skills can't be spammed back to back.
  Skills pressed mid-swing go off the moment they can.
- **Gear** — 8 slots (weapon, hat, top, bottom, shoes, gloves, cape, earrings). Everything you
  wear shows on your character. Every job has its own set **every 5 levels, from 5 to 50**, in
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
  circling a mage's hat, shadow wisps behind a thief. Starter
  sets (Lv 5) fit a Novice too. **Earrings** suit every job and climb their own ladder, from
  copper studs to Genesis Stars. 11 **unique** outfit pieces (Bunny Hood, Kitty Ears, Flower Crown,
  Star Beret, Crystal Crown, Blossom Kimono, Sailor Blouse, Comfy Hoodie, Fairy Wings, Angel Wings,
  Galaxy Cape) and Lulu's everyday clothes work for anyone.
- **Colors** — dropped job gear and weapons often come in **Dark**, **White**, **Crimson**,
  **Azure**, or the rarer **Gilded**; earrings in **Ruby**, **Emerald**, **Sapphire**, **Topaz**,
  or **Diamond**. A color is a look only: it repaints the piece and its icon, never its stats.
- **Cash outfits** — the Cash Shop (O, or the gift button) sells outfit pieces that cover the
  look of your gear without touching its stats, sorted by style (All, Casual, Swim, Funny):
  everyday modern clothes, cute swimwear (frilly one-pieces, ruffle bikinis, board shorts, swim
  rings), and silly April Fools stuff (joke hats, full-body costumes, and weapon covers like a fish
  or a baguette). It only sells looks you can't find: nothing that drops (job sets, unique outfits,
  jewel earrings, endgame weapons) is sold as a costume (ones bought before still work). Most come
  in the gear colors. Click a piece to try it on in the fitting room (turn around, walk, reset),
  then Buy & Wear. You start with 5,000 Cash and earn 250 per level and 300 per quest. Bought
  pieces live in the bag's **Cash** tab; the equipment panel switches between **Gear** and
  **Outfit** (double-click to take a piece off). Other players dress up too, top players most of all.
- **Sell junk** — on any shop's Sell tab, one button sells every monster drop your quests and the
  recipes you know don't need (the tooltip lists what goes and for how much).
- **Shops** — Pip, Tora, Marlo, and Nim sell gear for *your* job at their town's levels (with
  All / Gear / Arms / Other filters), and weapons you can use. Half of all gear drops are for
  your job, and quest gear rewards come as your job's piece. Other players wear their own job's
  sets, often in a matching color, and the job instructors show off their Lv 50 sets.
- **Weapons** — every type (sword, axe, spear, wand, staff, bow, crossbow, dagger, gauntlet) has a
  weapon every 5 levels: a wood or stone trainer, then Copper, Bronze, Iron, Steel, Silver,
  Mithril, Cobalt, Crystal, Runic, Starsteel, Moonsilver, Sunforged, Dragonbone, Obsidian,
  Adamant, Phoenix, Abyssal, Astral, Celestial, and Genesis (Lv 100; only up to Starsteel, Lv 50,
  can be found while the level cap is 50). They grow every four
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
  drop Rare or better. A piece is otherwise the same wherever it comes from; polishing (below) is
  how you make a favourite stronger.
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
- **Dawnlight Isle (tutorial)** — new characters wake up on a small island off the coast (it can
  be switched off in the creator). Kuro, a young tengu, walks them through 16 short lessons
  across three maps: walking, jumping and climbing on the beach, the bag, gear and stats, fighting
  and looting Kitsune Kits on the practice field, potions, skills and hotkeys, then a boat from
  the dock to Sprout Village. A hint card at the top of the screen shows the current lesson (in
  words for the stick and buttons when you play on a phone), with a Skip button. Kuro's first
  quest gives a practice sword; your job's own weapon comes with your first job at level 10.
- **Mochi pets** — adopt a Mochi egg for 3,000 Cash in the Mochi window (P, or from the Cash
  Shop). It follows you, fetches loot in range, drinks your best tonic when HP or MP drops below
  the marks you set. It never needs feeding, and it cheers when you level up.
- **Monsters and maps** — 25 chibi monsters and the Crystal King boss across 18 maps (four towns, two
  meadows, a canyon, woods, ruins, a crystal cave, a sky garden, and the throne room, plus the far
  regions for levels 19-50: the Whispering Glade of wind chimes past the woods, the Fox Shrine Path
  of vermilion gates and cherry trees at sunset past the ruins, Moonlit Ridge under a huge moon
  above Ember Crag, steaming Serpent Springs and snowy Frozen Peak on the climb from the cave to
  the Sky Garden, and Starfall Heights over it, under shooting stars). Field maps
  are built like classic side-scroller maps: the ground rolls in hills and slopes, rises into
  plateaus, and drops away at cliff walls you jump up or climb by ladder; above it, floating
  islands of the same land stack four or five levels high, linked by jumps, ropes, and ladders.
  Each region's land has its own look (cobbled meadow earth, mossy forest loam, stacked sandstone
  slabs, temple bricks, crystal rock, cloud), with grassy or mossy lips, hanging vines and roots,
  and big landmarks: giant trees and mushrooms, wishing wells and flower arches, totems and mesas,
  broken archways and statues, crystal spires, cloud pillars and gazebos. Portals are little gateways in
  each region's style (a flowery trellis in the meadows, a lantern gate in town, a root arch in the
  woods, stone in the ruins, crystal in the cave, clouds in the sky, a torii on the shrine path,
  ice on the peak...) with a swirl of the region's colour turning inside, and name where they
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
  dagger toss, gauntlet flick). The level 30 paths get a quiet aura that fades in while idle in the
  path's own art (diamonds of light for the Paladin, a few embers drifting up for the Berserker, a curl of wind
  and leaves for the Beastmaster).
- **Interface** — a candy-pastel UI. Each window has its own color and icon badge (peach Bag,
  pink Stats, lavender Skills, mint Quests, sky-blue World Map) on a scalloped title ribbon, and
  pops open with a little bounce. The HUD has a portrait medallion with your hero's face and
  level, glossy HP and MP capsules (a pale trail shows what you just lost, and the heart pulses
  when HP runs low), an EXP strip along the bar's top edge, round icon buttons for each window, and
  keycap hotkeys. The minimap, the quest tracker card (each quest's map pin starts the guide trail to it), ringed buff timers, and a ribbon banner
  when you enter a map round it out. NPCs talk in a visual-novel box: they stand large at the left
  with a name ribbon in their role's color, and their words type out (click to skip).
- **Parties** — right-click another player for a menu (view profile, invite to party, browse
  their shop). Anyone you invite joins. A party holds you and up to five others. Members
  come along from map to map. In town they hang around near you; out in the field each one goes
  off hunting **on their own**, anywhere on the map: they pick a monster no partymate is on, find a
  way to it over the ledges (jumping up, dropping through, walking off edges, climbing ropes), fight
  it, and wander off to look for more when the area is clear. They only jump when the path needs
  it, and give up on a monster they can't reach. They show on the minimap as dots in their
  playstyle's color, and chat in party chat. Their kills give you 60% of the EXP, count for your
  quests, and drop loot for you; your own kills get +10% EXP per member. They level up with you.
  Each member has their own playstyle, picked from their job, plus small quirks (how
  fast they react and walk, their attack rhythm and idle habits):
  - **Rusher**: dives into packs, fast swings and big spin moves.
  - **Guardian**: steady and tough, picks off monsters closer to you.
  - **Sniper**: fights from range, shooting up and down ledges.
  - **Healer**: heals you from anywhere on the map when your HP drops.

  Members fight with their job's own combos, skills and finisher (see Other players), monsters
  fight them back, and one who falls under a tombstone walks back in to you through a portal a
  little later. While your HP is low they go for the monsters around you. Members pick a side of a
  monster and keep it and hold a good spot instead of chasing every step,
  so their movement stays calm. A party panel under the minimap
  shows everyone with their playstyle (click for a profile,
  right-click to remove someone); members stay as long as you keep them. Leave, or right-clicking
  yourself, leaves the party, and members head off on their own.
- **Dungeons** — **Rootwood Hollow** (Lv 10+), the first dungeon, lies under the old tree off
  Windy Canyon. Talk to Bramble, the Hollow Warden, at the Hollow Gate (or walk into the door) to
  form a group of four: **1 Tank, 1 Healer, 2 DPS**. Your job sets your role: **warriors tank (Berserkers deal damage),
  archers and thieves deal damage, and the Spirit Mage heals**; the group finder brings in a
  Spirit Mage for the healer's seat (her Blessings and Spirit Wards, danced). Your party comes
  with you if it fits the roles, and the group finder brings in players for any open spot. Inside:
  - Everyone in the group has HP (shown under their names and in the group panel), and monsters
    don't hurt on touch: they wind up and swing at whoever they're angriest at. Damage builds
    **threat**, a tank's five times over, and healing builds a little. Monsters in a pack fight
    together. Tanks hold them with the warrior's tank skills (below).
  - The group plays its roles: the tank leads and, once everyone is ready, hooks the next pack
    back to the group, taunts loose monsters back, and holds the boss; the healer hangs back and heals whoever is hurt (a group
    heal when several are), keeps a barrier on the tank, and Renews the group when it's taking
    damage; the damage dealers focus what the tank is fighting, go for adds first,
    and help with the room's task between fights. Everyone steps out of telegraphed attacks.
  - Six rooms, each sealed until it's cleared, each with an idea of its own: **Hollow Entrance**
    is pitch dark, lit only around the group and by the three glowcaps you light; **Capper's
    Garden** (the Myconid Queen: Spore Rain patches, then Lights Out while she hides in her spore
    fog and mushrooms sprout where her spores land, then the Spore Tide floods the floor, so jump
    on a bounce mushroom to reach the high ledges); **Bramble Tunnels** (roots drop from the low
    ceiling in fights; each of the four Sprouts you free from root cages follows and cheers the
    group on, +4% damage each, for the rest of the run); **Boar Den** (Tuskar: Gore, and charges
    down a lane; bait him into one of the stone pillars and he's dazed and the pillar comes down;
    at 60% he calls his Wargs, at 30% he stampedes there and back); **The Root Gate** (Bramble Bears
    carry the three Root Keys, and sap floods the floor every half minute: get up on a ledge); and
    **Heart of the Hollow** (Gnarlroot in three phases: Root Slam, Thorn strips and Corrupted
    Saplings that feed him; at 60% root walls close in from both sides; at 30% his heart opens above
    him, and only blows from the high ledges reach it). He falls asleep at last in a scene of his
    own. Party members climb for the sap and the heart too. Bramble talks to the group over the
    root radio as it goes (a line on entering each room, on clearing it, and at the big moments),
    each boss meets the group with a short scene, and at the end the freed Sprouts dance round the
    chest.
  - The end: a rank (S, A, B or C, from the time, wipes and falls) that grows the chest's EXP and
    gold, and a result card. The chest can hold a piece of the **Rootwood** set for your job (always
    on Hard or the day's first clear). The first clear of each day adds Cash and Acorns; clearing it
    once opens **Hard mode** at Bramble (monsters with more than twice the health that hit half
    again as hard, and double rewards). Bramble shows your best rank and time.
  - Fall in a fight and your group gets you back up once it's over (no EXP lost; you can also
    leave). If everyone falls, the room resets and the group regroups at its entrance. The run
    tracker shows the room, what's left, the clock, and wipes; boss moves are called out on
    screen.
  - The chest at the end holds EXP, gold, Cash, a piece of your job's Lv 15 gear in a rolled color,
    Hollow Acorns, and Elixirs. Bramble's quest, Heart of the Hollow, pays out for calming Old
    Gnarlroot. Run it as often as you like.
- **Warrior tanking** — warriors are the tanks: **War Cry** (as the gauge fills) turns every monster around you on you
  (in a dungeon they stick to you for a few seconds) and guards you and the party around you,
  **Iron Guard** (on a hard hit) takes a big share off every hit for a while, **Toughness** adds max HP and
  defense, and Unbroken (full Valor) keeps you from being knocked back. They all work outside
  dungeons too.
- **Warrior paths (level 30)** — at 30, Brann in Ember Crag sets **The Warrior's Trial** (break 20
  Crystal Golems in the Crystal Cave); pass it and pick a path:
  - **Paladin**, the tank. Like the Warrior, she fights with her basic attacks and her skills go
    off on their own: **Aegis Smite** (a swing, hit or miss, sometimes calls a pillar of light down
    just ahead that stuns), **Divine Aegis** (a hit that leaves her under half HP makes her raise
    her blade, guarding and mending her and the party around her; and a shield of light sometimes
    flashes up and blocks a hit outright, answering with a holy shockwave that stuns all around
    her, twice as often while the blade is raised). **Hallowed Ground** is pressed: she drives the
    blade into the floor, a ring of holy light bursts out, every monster it catches turns on her,
    and its warmth mends her and the party around her; a beat later it flares again and throws
    them off their feet. And **Judgment** (when her Faith fills she ascends for a while, the Paladin's
    answer to Demon Form: every swing strikes again with holy light, her swings reach a third farther, her aura grows, a gold glow breathes round her
    and flashes with each heartbeat, swings burst with holy light, her Faith stays full, and every
    combo finisher calls a rain of holy swords down ahead of her, mending her and the party). Her buttons are Shoulder Charge
    and Grand Verdict. Inherited Warrior effects (Blade Rush, Whirlwind, War Cry, Iron Guard, the
    charge) turn holy gold on her. **Paladin Mastery** adds
    mastery, defense, and max HP. Idle, a ring of light diamonds turns at their feet. **Faith** (a
    star gauge over the hotkeys) builds from her blows and from the hits she takes, drains once the
    fight stops, and cuts the damage she takes (up to 15% at full). Golden light builds around her
    as it fills: a glow, a turning ring of light, then a halo and rays; full (**Sanctified**) adds
    wings of light.
  - **Berserker**, a damage dealer: every blow builds **Rage** (a flame gauge over the hotkeys) that
    drains once the fighting stops. He fights with his basic attacks and his skills go off on their
    own: **Ravage** (a swing, hit or miss, sometimes rips on into two savage cleaves that make them
    bleed), **Blood
    Frenzy** (a critical hit sometimes sends him into a frenzy: more attack, attack speed and crits,
    and a quarter of his Rage). **Rampage** is pressed: with 30 Rage or more he spends 30 on three
    wild chops and a leaping smash that feeds on the rest, up to double damage at full Rage. Two
    more skills: **Bloodlust** (his blows
    heal him for a share of their damage, up to three times as much the lower his HP) and **Demon
    Form** (when his Rage fills, the demon takes him over for a while; a blood-red shadow of
    himself stands behind him and strikes again after every swing, with no knockback; his swings
    reach a third farther, his aura grows, a blood-red glow breathes round him and flashes with each
    heartbeat, and his Rage stays full until it ends). His buttons
    are Shoulder Charge and Crimson Eclipse. Inherited Warrior effects turn blood red and black on
    him. **Berserker Mastery** adds
    mastery, attack, and critical damage. Idle, small red flames lick at their feet. Rage shows on
    him as it builds (a red heat, then flames climbing his body, embers streaming off), makes every
    blow up to 25% harder: black smoke round his feet, then fire, and at full (**Berserk**) the
    ground cracks with ember light, a jagged shockwave rips out from
    his feet to a heartbeat and the screen edges throb blood red.
  - Each path fights in its own style, with its own basic combo, each swing drawn from a pool so
    the string keeps changing (the first combo is the path's own). The Paladin is upright and
    disciplined, always leading with the shield arm: a measured cut, sweep or flash cut; a shield
    shove that dazes, a shoulder check behind a flare of light, or a spinning backhand; a lunging
    thrust, a rising cut that lifts them on light, or a driving stab; then a two-handed smite, a
    shield slam that brings a great shield of light crashing down on them, or a leaping chop or
    sky-splitter that calls pillars of light down. Hallowed Ground kneels and
    plants the blade point-down. The Berserker is wild and twisting, and everything he catches
    bleeds, and none of his swings are the Warrior's or the Paladin's: a huge wound-up horizontal
    cleave, or a blur of savage stabs; the return cleave, a low crouching whirl, or the axe flung
    out at arm's length dragging him round twice; then a leaping skull-splitter, a body slam that
    crashes down shoulder first, or the axe dragged sparking along the ground in a charge and
    ripped up in a huge uppercut, every one tearing the ground open. Rampage chains the cleaves
    into the skull-splitter.
  - Each charges its own way with Shoulder Charge: the Paladin's **Shield Rush** raises a wall of
    golden light and marches in behind it, shoving and gathering monsters up, then plants her
    blade and the wall bursts in pillars of light that stun them; the Berserker's **Reckless
    Charge** sprints hunched low with the axe dragging sparks, tramples through, then leaps and
    crashes down in a cleave that tears the ground. Running into an attack, she drives in a
    shield shove and he leaps into a chop.
  - Like the Warrior's own steel (motion-blurred cuts, sparks of struck metal, rushing air, cold
    light), both are drawn as real light and real fire, no outlines: her shafts of sunlight, waves of
    light and lens flares; his flickering flames, molten gashes, red-hot claws, embers and black
    smoke.
  - Their shapes never cross: the Paladin's power is pillars of light, smooth golden rings and
    stars; the Berserker's is torn, never lit: claw gashes ripped into the ground, fire and
    embers climbing, and jagged shockwaves of teeth (his buffs, Rampage and Demon Form flare up
    in fire and embers with his emblem, not a pillar).
  - Both paths hit heavy: longer hit-stops and harder knockback (the Berserker most), a stomp of
    dust and a dip of the view as a big move starts, power gathering at the weapon (embers or
    diamonds of light pulled in) until the blow lands, and a spark of their own on every hit.
- **Archer paths (level 30)** — at 30, Kestrel in Sprout Village sets **The Archer's Trial**
  (shoot down 15 Wraiths in the Crystal Cave); pass it and pick a path. Both deal damage in a group.
  (The old Ranger and Sniper were remade as these two: their characters move over, with their skill
  points back.)
  - **Beastmaster** (bow), hunting with **Snow wolf**: a small wolf girl (a short white wolf cut
    with ice-blue tips, wolf ears and tail, half-shut eyes, a bored mouth, an oversized white
    kimono, barefoot) who very much doesn't want to be here. She drags the **Fang of the Wolf
    Queen** behind her, a greatsword far too big for her to lift (a silver wolf's head for a guard
    with the blade in its jaws, a gold crown, a crescent moon cut through the blade) that casts
    moonlight. She has a body of her own and finds her own way round (walking, jumping up to
    ledges, dropping through them, climbing ropes) and picks her own fights, but never far from the
    Beastmaster: only monsters close to her (whatever's closing in on the Beastmaster first, then
    the nearest by the way there, finishing off what's hurt). She cuts them close in, lobs junk
    out of her sleeve up and down ledges without looking (a rock, an old sandal, a fish, a rubber
    duck, a teacup that shatters, a sleepy cat that naps on its head and holds it still, or a cookie
    she eats instead: BONK!), or, when one is out of her reach, leaps on it, the
    sword dragging her through the air, and lands with a blow all round; with nothing left she waits
    beside the Beastmaster. She waddles slowly, the tip scraping the ground, on a skeleton of her
    own that's played for laughs: sighs with a huff of steam, dozing off on her feet, the sword
    snagging as she walks, end lag on every heavy swing (stuck in the ground, a pratfall when it
    comes free), ears, tail, hair and kimono all bouncing. The Beastmaster's shots that land, and Snow wolf's hits, wear down Snow
    wolf's **Patience** (the Bond gauge, a moon over the hotkeys), which recovers once the fighting
    stops; gone (**Fed Up**), the crescent on her sword burns and she hits harder and quicker
    (spinning the sword round, heaving it overhead and dropping it, flicking crescents). The
    Beastmaster's skills are orders she drops what she's doing for. Like
    the Archer the Beastmaster fights with her basic shots (green wild arrows, from her own pool: a
    snap shot, a backflip fan mid-string, a twirl, a point-blank kick, a slide shot, a burst of
    three, a hop back, a gale shot through the line, an overdraw, a volley that rains back down) and her skills go off on their own: **Fine,
    I'll Go** (a shot sometimes makes Snow wolf drag herself over to the nearest monster and spin
    the sword round in a full circle of moonlight), **Moonfall** (a shot sometimes makes her plant
    the sword with a sigh and call a beam of moonlight down on the farthest). **Lunar Howl** is
    pressed: Snow wolf howls under a pale moon whatever she's doing (even mid-hunt), knocking away
    and stunning everything close round her. **Beast Mastery** grows with her level: mastery,
    attack and accuracy. **Wild Hunt** (a passive) makes her basic attack an endless hunt
    with Snow wolf: hold attack and the arrows fly faster and faster as she shoots on the move
    (snap shots, skipping and spinning shots, a slide on one knee), and she can walk slowly through
    it; soon Snow wolf joins in, cutting beside her whenever she's free, and flat out a gale of
    leaves wheels round her, the arrows peeling off it through the line; let go and she looses a
    great gale arrow as Snow wolf brings the moon down on them, stronger the longer she held. Her last skills: **Moon Ward** (a hit sometimes never
    reaches the Beastmaster: Snow wolf plants the sword in front of it behind a crescent shield of
    moonlight and flicks a crescent back) and **Queen's Awakening** (while Snow wolf is
    Fed Up, the wolf head on her sword wakes and her eyes open; she attacks faster and harder, and
    every swing also throws a crescent at the farthest monster). **Snack Time** is a buff: the
    Beastmaster tosses her a moon cookie, she catches it and munches it, and for a while she's
    happy (ears up, tail wagging, smiling): she keeps up instead of waddling, attacks harder, more
    often and quicker, and her Patience holds; when it wears off she slumps right back. The
    finisher, **Last Straw**, needs full Bond and spends it: Snow wolf snaps. Beside the
    Beastmaster in a flash, fuming and shaking, eyes blazing, she lifts the greatsword in one hand
    as if it weighed nothing, twirls it, leaps, and brings it down under a great full moon on
    everything across the whole screen around her, then keels over asleep. Her buttons are the
    Archer's Vault, Snack Time and Last Straw.
  - **Stormcaller** (crossbow): violet lightning, drawn the way real lightning looks: thin, jagged
    strands of glowing plasma twisting round each other and flickering, with arcs crawling over the
    ground where it strikes. Everything of hers matches it: soft, smoky storm clouds lit from
    inside, a column of crackling lightning when she powers up, glowing bolts. Her bolts mix their own pool: a hip shot,
    crank and fire, or a roll onto one knee; a double tap, the point-blank kick, or a hop back
    loosing two down; then a kneeling thunderbolt through the line or a braced spray of three.
    Bolts that land build **Charge**, and every monster her lightning jumps to builds it too; it
    fades once the fighting stops. Full (**Supercharged**), every bolt jumps on to one more
    monster. Her skills set themselves off: **Arc Bolt** (a bolt's lightning jumps on to the
    nearest monsters), **Static Field** (the ground where a bolt lands crackles and zaps whatever
    stands on it), and **Thunderclap** from her combo's last bolt (lightning from the sky on the
    farthest monster, throwing it up and stunning it; always with three or more in front). Storm
    Mastery is her passive. **Lightning Rod** softens every hit she takes and
    arcs its shock back into the attacker, and **Eye of the Storm** gathers a storm
    cloud over her while she's Supercharged that keeps dropping lightning on the monsters near
    her. Her buttons are the Archer's Vault, **Overcharge** (her next few bolts go out as massive
    bolts of lightning through the whole line) and her finisher, **Thunderhead**: a bolt fired
    into the sky, the storm breaking over the whole screen, lightning crashing down again and
    again, then one giant bolt that hits everything on the screen.
  - Both have command shots: **Up + attack** shoots up at whatever flies and knocks it higher,
    **Down + attack** leans out and shoots down at whatever is below, **attacking in the air**
    shoots down at them and holds you up, and **attacking out of a run** is a slide shot. A
    finisher shot that connects opens a Link, for every archer.
- **Thief paths (level 30)** — at 30, Vex in Pastel Harbor sets **The Thief's Trial** (put 20
  Dullahans down in the Twilight Ruins); pass it and pick a path, a pair from the same mountain
  shrine. Each keeps to one of the Thief's two weapons, and keeps her first-job skills for it.
  (The old Assassin and Night Lord were removed: those characters became the Shinobi and the
  Kitsune, with their old skills' points given back.)
  - **Shinobi** (dagger; ink black, red seals, white smoke): her own combo (a kunai stab, a slash
    up into a backflip that throws two kunai down, then darting back in for a planted X-cut that
    splashes ink) and a pool it mixes in (a blur of stabs, a dash cut, a palm strike that slaps on
    a seal that bursts a beat later, a spinning throw of three kunai, a quick slash, a vaulting
    cut, a whirl); her command moves are a launcher that throws a
    kunai up after them, air cuts then a fan of kunai thrown down, and a dash in a burst of smoke.
    **Ki** builds from every hit and every blow she dodges. Full, **Shadow Clones**: two ink clones
    of her repeat every attack. Skills: **Kunai Barrage** (three presses: two kunai, two more, a
    spinning throw of five), **Exploding Seal** (a seal slapped on, bursting a moment later on
    everything close), **Smoke Bomb** (untouchable a moment in white smoke, the monsters lose
    her, she dodges far more, and Ki rises; a log waits in the smoke too, so the next blow hits it
    and she reappears behind whoever struck), **Shinobi Mastery** (grows with her level), **Endless Blade Dance** (a passive: hold
    attack and the cuts never stop, faster and faster, and she can walk slowly through it: quick
    cuts, then spinning cuts, then she blinks through ink from one side of them to the other,
    cutting as she turns, and flat out her ink clones join the storm; let go and she drops low and
    is through the line in one drawn cut, a giant brush stroke of ink behind her, stronger the
    longer she held), and the finisher **Thousand Cuts**
    (needs full Ki: ink spills over the world, she flickers from monster to monster cutting each,
    then a giant fox of ink sweeps the line).
  - **Kitsune** (gauntlet; gold and blue fox fire): her own combo (a fox-fire star, a
    backflip whipping two down from the top of it, then a heaving throw of a great fox-fire star
    through the line) and a pool (a twirling throw, two stars, a fan of three, a pounce that throws
    down as she lands, a twirl that flings the great star); her command throws go up at fliers,
    down from a hang in the air, and out of a pounce on the run. Her stars set monsters burning.
    **Tails** grows from one fox-fire tail to nine (drawn behind her) as her stars land, faster on
    burning monsters; every three tails a fox-fire illusion throws a star beside each of hers, and
    with all nine, **Nine Tails**, three of them. Skills: **Fox-Fire Fan** (three presses: two fans
    of stars, then a great star through the line), **Fox Decoy** (a fox-fire illusion of her set down
    just ahead: for a few seconds the monsters near it go after it instead of her, then it bursts
    in fox fire on everything close), **Fox-Fire Trap** (a ring of fox fire on the ground that
    burns them, then bursts), **Fox Hop** (springs back out of reach, leaving a decoy of fox fire
    that bursts), **Kitsune Mastery** (grows with her level), **Endless Fox-Fire** (a passive: hold attack and fox-fire
    stars fly hand over hand without stopping, faster and faster, and her tails wake one stage at
    a time: one tail lit as she deals stars like cards, three for a trickster's spin throws,
    behind-the-back throws, hop-backs and lazy lobs, six as she spins inside a wheel of fox fire,
    and all nine as she floats over a circle of fox fire, until a giant fox spirit looms over her
    and stars pour from its mouth too; it never ends in a finisher, so she can hold it on mobs
    and bosses as long as she likes), and the
    finisher **Nine-Tail Blaze** (needs all nine
    tails: nine stars rain down burning, then a giant fox of blue fire pounces through the line).
- **HD graphics** — on by default (Options: Display). Everything in the world is placed on the
  screen's own pixels, so the camera and everyone in it glide instead of stepping, while the art
  itself stays crisp pixel art. Each map gets its own lighting: warm light and slanting sun rays
  from above, cool shade below, and a soft vignette. Spells, sparks, and particles glow (bloom),
  the far backdrop is softly out of focus behind the play area, shadows are soft, crits glow, and
  new maps fade in. On a slow device it drops the glow, then the lighting, by itself.
- **Sound** — "real plus modern": recorded instruments (flute, strings, harp, guitar, horns,
  piano, choir, marimba, celesta and more, from the FluidR3 soundfont) and recorded effects (from
  Kenney's packs), mixed with synths, drums and effects made in code (credits in
  `assets/audio/CREDITS.md`). Every skill effect is Tengu's own art, drawn to match the sprites
  (`tools/fx-art.js`, `assets/fx/CREDITS.md`). Every song and effect is rendered once in a background worker and
  played from buffers; the rules come from the research in `docs/audio/`. **Music**: a written
  song for every area: a swung village tune on flute, guitar and plucked strings; a running meadow
  song with marimba and pop drums; an accordion sea song in 6/8 at the harbor; sitar and oboe over
  toms in the crags; pan flute and harp in the forest; a waltz for oboe and celesta in the mage
  grove; choir, harp and horn in the ruins; echoing celesta in the cave; flute and bells in the sky;
  shakuhachi and koto in the old Japanese scale on the Fox Shrine Path; a piano nocturne on Moonlit
  Ridge; a sitar groove at Serpent Springs; a flute waltz over glockenspiel snow on Frozen Peak;
  the choir and celesta at Starfall Heights; a grand violin and brass waltz for the queens' trials
  and rematches;
  a grumbling horn march in the Hollow; a galloping boss theme with brass, strings, choir and
  timpani that cuts in on its sting; and a piano title theme. Songs crossfade between areas and
  pick up where they left off when you come back. **Jingles** on real instruments follow the Japanese RPG formula (quick notes rushing
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
- **Options** — Esc (or the gear button) opens Options. Sound: volume, music, effects. Display: HD graphics, particles
  (full, reduced, or off), job auras, and weapon effects. Interface: minimap, quest
  tracker, message log, map banner, monster HP bars, and an FPS counter. Gameplay: screen shake,
  hit-stop, damage numbers, auto-loot, click-to-talk NPCs, townsfolk and players, and chat bubbles. A Controls page lists every key, and
  the Character page changes character or returns to the title (saving first). Settings are saved in
  the browser.
- **Chat** — press Enter to talk. Messages show in the log and as a speech bubble over your head,
  emoticons like :) :D ;) >:( :3 <3 B) make your face act them out, `/e <face>` shows any
  expression, and NPCs nearby say hi back when you greet them. Townsfolk say a line now and then
  while you're within earshot (their own, and their trade's: archers, trainees, kids, gossips), in a
  shuffled order so one only comes back after all the others.
- **Towns and the world map** — each job has a home town in its own style, laid out in quarters
  around one signature landmark, with big homes of its own along the street and places to climb:
  Sprout Village (archers: two-storey cottages with a deck walk on posts, the shop street, a plaza
  under a giant cherry tree whose bough you can climb to, and the archers' quarter with the
  watchtower and range), Pastel Harbor (thieves, at dusk: tall pastel canal houses with lit
  windows, the market, the harbor plaza, the back alley with a rooftop hideout on stilts, and a
  walkable pier over the water with rowboats tied up), Ember Crag (warriors: flat-roofed sandstone
  houses whose roofs you reach by ladder, the training yard, and a sparring arena at its heart), and
  Moonleaf Grove (mages: homes grown into giant tree trunks, a great moon-lantern tree over the
  plaza, the Mage Tower, and the study circle). Props are kept few, NPCs stand apart, and other
  players' name tags fade unless they're near you. The world map (M) shows Tengu Island with every road between maps, each
  place's name and level range, and a "you are here" pin; the far regions sit just off the places
  they lead from. Tap any place to see its monsters and how many maps away it is, then **Show the
  way**: the route lights up on the map, and in the game a pink arrow points to the next portal
  (over it when it's on screen, at the screen's edge when not) with a "maps to go" pill (tap it to
  stop). Each quest has a **Go** button that does the same for wherever it wants you next.
  Portal signs name where they lead with its level range (or "Town") and an arrow pointing the
  way out; the one on your route glows pink. Fly from any town to any other for a little gold.
- **Living towns** — every NPC works from their own place: striped market stalls for Pip's Goods,
  Tora's Forge, Nim's Spells, Marlo's Wares, and Lulu's Salon; guild halls for the Archer Lodge,
  Warrior Hall, Mage Tower, and Thieves' Den; an info kiosk for Mira and a harbor office for Captain
  Rook, each with a swinging wooden sign. Houses line the streets in each town's style (cottages,
  adobe homes and tents, treehouses and mushroom houses), with a fountain on every plaza. NPCs
  have their own idle routines: Pip juggles potions, Tora hammers sparks off an anvil, Brann runs
  sword drills, Kestrel shoots arrows, Elowen floats in meditation, Nim reads a floating spellbook,
  Vex flips a dagger, Rook scans the sea through a spyglass, Marlo flips a coin, Lulu snips and
  twirls, and Mira waves (they turn to face you when you come over). Villagers stroll the streets.
- **Other players** — the server is full of generated players, each a real character: a level
  (pros at a low rate, Lv 56+ with endgame gear and a gold name tag), a job that fits it, a stat
  build (pure, standard, or hybrid), rolled gear, and sometimes a guild. About 26 are on
  at any hour (never more than two under; someone logging out is soon replaced), spread over the
  towns by level
  (beginners in Sprout Village, veterans and pros in Moonleaf Grove, at most 8 in one
  town besides special visitors). They log in, wander, travel between towns through the portals,
  and log out. Click any player, or yourself, for a profile with their look, gear, full stats,
  build and guild. The systems behind them live in `src/world/` (see Layout).
  - **In town** they stop to chat with each other in little conversations and emote. Now and then
    one walks over to say hi to you by name.
  - **Out hunting** a few of them share the field you're on, 2 to 5 by the map's size. They fight
    like you do: their job's own combo pool (a fresh string each time, steps carrying them forward
    or back), their job's skills between strings, and their path's finisher once their gauge fills.
    The Shrine Maiden and Onmyoji use their own spells (Thousand Torii's gates, Ofuda Barrage's
    talismans, the blessings); bots have no troupe, so an Onmyoji's finisher is a talisman storm.
    They leave the monsters by you alone and their kills give you nothing. Monsters they hit fight
    back: they drink potions when low, and with none left they fall, a tombstone drops on them, and
    they head back to town (to log in again later).
  - **Help.** Out in the field with your HP under 30%, a player nearby rushes over, takes on the
    monsters around you, and heals you or tosses you a potion; say "ty" (or right-click: Say
    thanks) and they may offer to be friends. Now and then a player in town asks for help with a
    quest: right-click them (**Help them**) and they join you, and hunting their monsters together
    earns a gift.
  - **Friends.** Right-click a player (**Add friend**): friends are saved with your character as they
    looked, log in now and then (waving if they're by you), ask you along to hunt, and come to you
    when invited from the Friends tab (N). Their name tags are sky blue.
  - **Raids.** A boss on your map (a queen back for a rematch, the Crystal King on his throne) draws
    3 or 4 players, a friend among them when one's online. They call out her moves as she shows
    them, mostly dodge, and take the hit when they don't. Once she's down everyone cheers.
  - **Party combos.** Let your gauge finisher loose and the party members fighting by you join in
    with theirs, a beat apart and harder for it.
  - **Dungeon groups.** Players shout for the role their group is missing ("LF healer for Rootwood
    Hollow"); when it's yours and you're on your own, right-click them (**Join their group**) and
    they take you in.
  - **Town life.** Duels in town with a crowd cheering; rain and snow come and go on each map.
  - **Server events.** GM Momo runs Double EXP for five minutes. Festivals follow the real
    calendar (Spooky Night in October, the Snow Festival in December, and more) with festival
    colours, dancing and fireworks. A wandering merchant sets up shop for a few minutes with odd
    wares.
  - **Chat.** They talk about what's real for them: their own weapon, job and guild, the map
    they're on and its monsters and drops, where they're headed next, the weather, and the raid
    or GM event that just happened; a line that doesn't fit the speaker isn't used. They
    talk back too: hi when you say hi, answers from the game's own data ("where is Clover Hills?",
    "where do Jackalopes spawn?", "what level is Mossy Woods?"), cheers when you level up or land a
    good fish, and your emotes returned. All of it goes through one gate (`src/world/chatlog.js`): no line (or one differing only by names and
    numbers) comes back for ten minutes, nobody speaks of their own accord more than once every 30
    seconds, and the log takes a line at most every 4 seconds and 7 a minute (the rest show only
    over their heads); answers to you and party chat skip the waits.
- **The story** — seven chapters from level 1 to 50 (cozy, with heart). Hayate, the island's
  great Tengu, has fallen asleep and her wind has stopped; Mira takes you in, and chapter by
  chapter you calm each region's lonely spirit: Gnarlroot in the Hollow, then four queens in trials
  of their own (Sylvana in her bower, Tamamo in her sanctum, Lilith in the Rose Grotto, Selene on
  the Moon Terrace), each with moves you read and dodge, until the Crystal King gives the light
  back and Hayate stirs. Story quests wear a ★ and have their own tab; each chapter opens with a
  title card and plays out in cutscenes (so do the big side quests, the instructors' trials, the
  end of the tutorial, and every job advancement); new regions open as the story reaches them; and after
  her trial each queen comes back to her region every ten minutes or so for a rematch anyone there
  can join.
- **Gear sets and polishing** — Sylvana, Tamamo, Lilith, Selene and the Crystal King each drop
  pieces of their own set for your job (hat, top, gloves and cape), always from her trial and
  sometimes from a rematch; Rootwood Hollow's chest gives the Rootwood set. Each set has its own
  look over your job's cut: Rootwood's acorn cap and mossy bark cloak, Dryad Bloom's flower crown
  and petal cape, Foxfire's fox ears, side mask, shrine bell and three tails, Night Rose's lace,
  roses and thorny cape, Prism's floating crystal crown and faceted mantle, Moonlight's crescent
  tiara and starry cape. All four pieces on wear the set's aura (leaves, petals, foxfire, rose
  petals, sparkles, moon dust). Wearing two, three or four pieces adds the set's bonuses (shown
  on every piece). Tora
  in Ember Crag polishes any worn piece up to +10 for gold: each step adds attack, magic, or
  defense and HP, gets less likely to take as it climbs, and a miss only costs the gold.
- **Collection (B)** — the Monster Book fills a card for every monster you defeat (or help defeat):
  a card is mastered at 100 defeats (5 for a boss). Cards are for collecting, with no hidden stat
  bonus. The Fish page keeps how many of each fish you've caught.
- **Fishing** — buy a Fishing Rod from Pip or Marlo, then find a fish sign by the water: the tide
  pool on Dawnlight Beach, the pond in Clover Hills, the end of Pastel Harbor's pier, the pond in the
  Whispering Glade, the warm pools of Serpent Springs, an ice hole on Frozen Peak, and a pool of
  stars at Starfall Heights. Press Up to cast, wait, and tap Attack the moment the bobber dips (too
  early and it swims off; rarer fish give you less time). 13 fish from common to legendary.
- **Cooking** — every town has a stove (press Up by it). Recipes take fish and monster drops; you
  know three from the start and learn each fish's own recipe on your first catch. Press Cook and
  the pot serves two dishes. A dish heals and gives a bonus for 10-20 minutes (attack, defense,
  speed, HP back, crit, even extra EXP); different dishes add up.
- **Quests and NPCs** — 39 quests from every town's people, covering every field from level 1 to
  48: hunts and fetches, errands (talk to someone, deliver a letter or a parcel, climb to the top
  of a map), short chains (Captain Rook's Windy Canyon trouble leads to Bramble), a task from each
  instructor between the first job and the trial, and daily quests (Mira, Rook, Brann) that come
  back every day. Rewards include job gear, outfit pieces and Cash. People you're sent to talk to
  wear a "?" until you do. Shops that buy and sell (including a
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
src/world/              simulation: physics, monsters, loot, combat, the world update; and the
                        other players: bots.js (population, towns, hunters), party.js (parties and
                        how bots fight), chatter.js (what they say), chatlog.js (the chat gate),
                        buddies.js (friends, help), raids.js (raids, party combos),
                        drama.js (duels, the clock), events.js (Double EXP, festivals, the
                        merchant), lives.js (help requests, weather), social.js (lucky drops,
                        dungeon groups)
src/render/             drawing: pixel toolkit, hero rig, gear designs, weapon forms, looks, and live effects, towns
                        and elements, animator,
                        particles,
                        monsters, scenery, terrain, landmarks, effects, icons, scene
src/ui/                 HUD, windows, NPC dialogs, title and creator screens, phone touch controls
src/net/                online rooms: the peer-to-peer link and keeping friends' games in step
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
threat, and a whole Rootwood Hollow run played by an autopilot). `tests/bots.test.js` covers the
other players: how they fight, help, raid and talk, every town and server event, and the chat gate;
it pins the clock (`createBots(world, rng, { clock })`) so runs don't change with the time of day.

## Credits

All art is drawn in code. The `assets/` folder holds CC0 packs from Kenney and OpenGameArt that
earlier versions used; the current game doesn't load them, and they can be deleted.

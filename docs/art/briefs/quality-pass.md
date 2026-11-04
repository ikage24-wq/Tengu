# Whole-game quality pass (2026-11-04)

The player's ask: "do a whole pass on the game, find low quality art, bad animations, errors, bugs
and more, then collect them all to fix. Also look for anomalies and bad design: an interior where
it should be an exterior, water in a desert; make each theme fit."

Five audits (maps, monsters, UI, bugs, heroes) looked at the real game. Everything they found is
collected here, worst first within each part. Tick items off as they're fixed. Items marked
**(choice)** need the player's pick before building.

## A. Bugs and broken play
- [x] Fishing spots in Whispering Glade, Serpent Springs and Starfall Heights get you killed (Sylvana, Lamias, Selene and Star Spirits reach them). Give them ledges of their own. (fixed: each pool is sunk behind stone lips monsters never cross, the queens walk floors of their own away from them, and a queen only notices you near her own floor)
- [x] Monsters wait at three arrivals: Serpent Springs from Frozen Peak and from Rose Grotto, Fox Shrine Path from the Carnival. Move those spawns 250 px+ away. (fixed: every map's spawns now slide 300 px clear of every way in, 440 px on the floor you arrive on; Tamamo and Lilith moved off the arrival floors)
- [x] Crystal Cave's night-only Foxfire Lily never opens (caves count as indoors, so night never comes). (fixed: night-only spots go by the clock under a roof too; the cave's night bloom is now a glowing duskcap)
- [x] Monsters spawn on homestones (meadow1 exactly on it; cave, glade, shrine, springs close). (fixed, with the arrivals: homestones count as ways in)
- [x] Overlapping portals: Mossy Woods Glade/Manor; Sky Garden Starfall portal on the homestone. (fixed: the manor way moved to the other end of the high bough, the Sky Garden homestone to the island below)
- [x] Sky Dancer climbs up through the floors just by holding attack. (fixed)
- [x] Queen Bee's slam warning floats 50 px above the floor it hits. (fixed)
- [x] Five meadow monsters crash on a sad or surprised face; bosses can't look sad in scenes. (fixed)
- [ ] Overhead chat skips the chat gate: repeats ("hp hp hp" 5 s apart), "that snail hits hard" after any death, generic recruit lines. Route every say() through the gate; death lines name the killer.
- [ ] Lantern Lagoon is a town no bot ever visits; server news only ever names Rootwood Hollow; "1 more levels"; group invites too often.
- [ ] Flaky test "players on a field work its ready life spots" (reads the real clock).
- [ ] Salon breaks on a save missing look keys.
- [ ] Mira's first quest says "take this sword", gives shorts.
- [ ] Drops named after other monsters (Lamia "Basilisk Scale", Yuki-onna "Mimic Gem", Sylph "Harpy Feather", Nekomata "Fox Fluff", Selene "King Crystal", Prismaris "Heaven's Gohei").
- [ ] Two weapons per type share a name (Mithril Sword lv 30 and lv 40).

## B. Classes and heroes
- [ ] **(choice)** Second jobs still play their first job's skills with the first job's moves (Blade/Sky Dancer cast the Wind Dancer's Pirouette and Grand Finale; Idol/Astronomer cast the Star Witch's spells and Starfall; Trickster/Arbalist cast the Acrobat's Vault and Grand Somersault; Paladin/Berserker the Warrior's Whirlwind and Titan Breaker). Breaks "never reuse another job's moves".
- [ ] The Wind Dancer's Ribbon Lash and Gust Line proc for the Blade and Sky Dancer too (coral swirls on a rose-gold dancer).
- [ ] The Wind Dancer's basic cuts draw the Warrior's steel-blue swipe and spin ring.
- [x] Arbalist's steam puff on her face on every shot. (fixed)
- [ ] The bow's top limb covers the archer's face at release (Acrobat, Trickster), and touches the mouth idle/walking.
- [ ] Own effects drawn over the hero: Star Witch comet spawns over her, Idol notes start on her face, Paladin's hit burst swallows her, Trickster smoke becomes a screen-high wall.
- [ ] Weapons sink through the floor in low poses (Warrior, Berserker, Astronomer, Novice; chakram below the feet standing).
- [ ] Phantom Trickster's and Arbalist's basic moves read as the same pose; no kneel-and-crank.
- [ ] Star Witch's star leaves her chest while the wand points down and back.
- [ ] Climbing is stiff: a back view with a stepped 2 px leg shift, no arm motion, weapon vanishes.
- [ ] Bow and crossbow cover the outfit in idle and walk.
- [ ] Costume fit: bunny pajama hood band and hair through it, tiny sailor cap, Sky Pilot scarf hooks.
- [ ] Damage numbers pile into unreadable stacks.

## C. Monsters and bosses
- [ ] **(choice)** The four queens (Sylvana, Tamamo, Lilith, Selene) are unrigged (they squash and stretch) and drawn as tall adults, clashing with the chibi cast. Redraw chibi and rig.
- [ ] **(choice)** The field monster girls (Sylph, Nekomata, Kitsune Miko, Lupina, Lamia, Yuki-onna) have thin adult proportions and faces too small to read.
- [ ] Puff Bun mount's ear covers the rider's face.
- [ ] 15 older field monsters have hit boxes half their drawn height.
- [ ] Rootwood Hollow bosses (Tuskar, Gnarlroot, Myconid Queen) look flat and generic; the Corrupted Sapling looks like a placeholder.
- [ ] Lady Marigold sinks 14 px into the floor (Marionette puppets, Tuskar, Myconid Queen a few px).
- [ ] Boss props cross their faces in attacks (Coralie, Toffee, Bonbon, Captain Gale, Folio, Dame Minuet).
- [ ] Turret head clicks through 4 poses without blending.
- [x] Reused monsters out of theme: Wraith in Serpent Springs, Pegasus Foal on Frozen Peak, Crystal Golem on Moonlit Ridge. (partly: Moonlit Ridge now has Meteor Golems, fallen stars from the observatory's road; no existing monster fits the hot springs or the snowfield at their level, so the Wraiths and Pegasus Foals stay until new ones are drawn for them)
- [ ] Leftover unused monster art tables (hollow.js, manor.js, old Hollow frames in bosses.js).

## D. Maps and themes
- [ ] Candy Volcano's Gingerbread Ramparts and The Crater are plain cobble meadows: no wall and towers, no crater or caramel lake.
- [ ] Dungeon rooms share one backdrop (Manor Gallery/Ballroom/Library/Hallway; the Library has no books; Carnival Midway/Coaster Yard/Ferris Wheel/gate).
- [x] Underground zones under open sky with sun, clouds, rainbow and bunnies (Clover Hills Root Cellar, Mossy Woods Root Tunnels, Twilight Ruins Sunken Crypt). (fixed: earth or stone all round, roots and glowing beads overhead, cave light, no sun, moon, clouds, rainbow, critters or weather)
- [x] December/January snow on every outdoor map, deserts and the tropics included; rain above the clouds (Sky Garden, Starfall). Weather by region. (fixed: snowy peaks, temperate lands with winter snow, a rare shower in the desert, rain only in the tropics, nothing above the clouds or underground)
- [x] Sprout's stone water fountain stamped into desert Ember Crag and Moonleaf Grove. (fixed: Ember Crag's hearth, a great living fire-bowl on a sandstone plinth; Moonleaf Grove's moon dial, a rune stone under a floating moon crystal)
- [x] Sea gulls over the desert (crag theme critters). (fixed: desert hawks wheel on the thermals instead)
- [x] Dawnlight Beach isn't a beach: sea fishing from a freshwater lily pond on stone bricks, no sand or sea. (fixed: soft sand running down into the sea at the west end, a jetty out over it to fish from)
- [x] Gathering finds that don't belong: lotus and shrine lily in the cave, cloud skywood and Starfall's starbloom on the Peak, cotton/oak/moonpetal in the desert canyon, meadow honey in the Sky Garden. (fixed: the cave has ore and a glowing duskcap, the Peak and the canyon ore seams that glint by moonlight, the Sky Garden cloudberries)
- [x] Moray Grotto (a cave) uses the palace backdrop and pink palace brick. (fixed: a dark sea cave of its own, sea rock, crystals and weed)
- [x] A Twilight Ruins column inside the Boar Den. (fixed: the den's pillars are columns of earth bound in roots, moss and glowcaps; they fall in a heap of clods)
- [ ] The theatre's confetti stage floor reused outdoors on the Sky Whale; its back reads as an ice wall.
- [x] Crystal Cave's "Underground Lake" is a small glow puddle; Windy Canyon and Crystal Cave have very few monsters. (fixed: a real lake fills the cavern floor with a crystal islet and the raft; the canyon has twice the monsters and the cave half again, on new ledges)
- [ ] **(choice)** Missing per-map secrets (only Mossy Woods has one) and area boss nests (only Petal Meadow and Clover Hills).
- [ ] **(choice)** Neighbouring hunting maps share a shape (three tall-climb pairs); Shrine and Springs are stacked full-width shelves. The dungeon gates are one stamped map.
- [x] Open-air dungeon rooms and the queen arenas ignore day and night. (fixed: they follow the clock; the moonlit manor rooms, the sea palace and Lilith's grotto keep their own light)
- [x] Fishing ponds look out of place and just put there, and water sits on top of the floor (the player). (fixed: every spot's water is sunk into its map between real banks, each region's own: a lily pond under a footbridge in Petal Meadow and Sprout, a waterfall pool in the glade, an underground spring in the cellar, a hot spring with steam, a cave lake lit from below with crystals, a star pool, a gap in the cloud sea, a frozen lake with an ice hole, the sea up the sand at the beach and the cove, a tide pool between rocks; ripples, reeds, lily pads, fireflies at night, steam, motes; docks and bridges stand on pilings in the water)
- [x] Ships drawn on the floor or floating over a blue strip (the player's harbor screenshot). (fixed: the harbor's walkway is the quay, the sea lies past its kerb at sea level; the galleon, the rowboat, the Sea Biscuit at both ends, Sunny Dock's boat and your island's skiff ride in it at their waterlines, bobbing, with reflections and foam; pier legs stand in the sea)

## E. UI and icons
- [ ] Wind Dancer skill icons are still the old ninja Thief's (masked face, shuriken, crossed daggers), violet not coral.
- [ ] 77 items show the generic placeholder icon (newer drops, every herb and fruit, all furniture and trophies, mount keys, Royal Jelly, Home Shell).
- [ ] 30 clothes and basic gear share one stock shape per slot (Lulu's jacket, sweater, overalls, dress...).
- [ ] Options: Gameplay's last row under the Resume button; Sound descriptions under the volume pills.
- [ ] Crafting tabs stick out past the window.
- [ ] Lantern Lagoon, Dawnlight Beach and Sunny Dock missing from the World Map.
- [ ] Phone players get keyboard-only hints and can't buy ×10 or add 5 AP.
- [ ] Stale job names: Elowen offers "the Shrine Maiden and the Onmyoji"; "The Thief's Trial"; "Archer" not "Acrobat Archer".
- [ ] Controls page missing G, O, P, Y.
- [ ] Profile gear names cut short; labels measured in one font and drawn in another; Cash Shop menu bubble loses its icon; gacha Dew Sparkle icon unreadable; no menu button for Collection; Life Skills repeats "next level".

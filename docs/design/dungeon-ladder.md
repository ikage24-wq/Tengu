# The dungeon ladder: levels 15 to 50 (design, 2026-11-02)

The player's plan: a group dungeon every five levels, each one unique (its own setting, room
shapes, floor gimmicks, monsters, bosses and music), monsters at the maidens' quality and bosses at
the queens' or better. Rootwood Hollow (10-15), Moonlit Manor (15-20) the Sunken Aquarium Palace (20-25, see aquarium-palace.md) the Clockwork Carnival (25-30, see clockwork-carnival.md) the Star Observatory (30-35, see star-observatory.md) the Candy Volcano (35-40, see candy-volcano.md) the Dream Theatre (40-45, see dream-theatre.md) and the Sky Whale's Back (45-50, see sky-whale.md) are built: the whole ladder. This file holds
the plans for the rest so each can be built the same way as the manor (docs/design/moonlit-manor.md):
a design doc, a rig and art file, a world file for its rooms and bosses, its own songs, and a full
run in tests/dungeon.test.js.

What must differ between any two dungeons: the setting and palette, the shape of the run (not
always six rooms left to right), the floor gimmicks (none reused), the kind of task in each room,
the monsters' rig and motion, how the bosses' fights work, and the music's genre and lead.

| Levels | Dungeon | Setting | Shape of the run | Music |
|---|---|---|---|---|
| 10-15 | Rootwood Hollow (built) | under a great tree | six rooms, down into the roots | funky house, pizzicato and horns |
| 15-20 | Moonlit Manor (built) | a haunted manor | six rooms, garden to rooftop, a chase and a puzzle | a music-box waltz |
| 20-25 | Sunken Aquarium Palace (built) | a mermaid palace under the sea | a dive: each room deeper | tropical city pop, vibraphone and kalimba |
| 25-30 | Clockwork Carnival (built) | a wind-up fairground | a loop: the rides join back to the gate | marching-band swing, calliope |
| 30-35 | Star Observatory (built) | a tower of stars above the clouds | a climb, the floors rotate | chiptune-orchestral, harpsichord |
| 35-40 | Candy Volcano (built) | a sugar volcano | a valley: down to the lava sea, up the cone | Latin house, marimba and brass |
| 40-45 | Dream Theatre (built) | a theatre where plays come true | acts on a stage that changes set | swing jazz, clarinet and upright bass |
| 45-50 | Sky Whale's Back (built) | a city on a giant flying whale | a journey along its back, head to tail | epic folk, fiddle and taiko |

## 20-25: Sunken Aquarium Palace

The mermaid queen's palace sank in a storm; its bubble wards are failing and the sea is getting in.

- **Rooms:** the Coral Gate (bubble lifts: ride rising bubbles between floors), the Kelp Maze
  (currents push sideways, a side-by-side journey), the Pearl Vault (puzzle: open giant clams in
  the order the tide bell rings), the Drowned Ballroom (mid-boss), the Pressure Lock (rooms fill
  with water: swim mode, slower and floaty, air bubbles to breathe), the Throne of Tides (final boss).
- **Monsters (new "fin" rig, tails instead of legs, swimming curls):** Jellyfish Maiden (bell
  skirt, trailing ribbons, stinging drift), Seahorse Knight (curled tail, lance), Anglerfish Lamp
  Girl (lure light, lunges from the dark), Pearl Diver Ghost, Starfish Dancer, Octopus Scholar
  (eight-armed spellbook juggling).
- **Bosses:** the Twin Moray Sisters (one hides in the walls while the other fights, they swap);
  Lady Abyssia (the sea witch: ink clouds hide the floor, tentacles from the edges); Queen Coralie
  (phases with the water level: dry, half-flooded, fully underwater).

## 25-30: Clockwork Carnival

A wind-up fairground where the toys never stopped playing.

- **Rooms:** Ticket Gate (the carousel: a spinning platform that carries you round), the Funhouse
  (mirror puzzle: copies of the group, hit the real ones), the Roller Coaster (a chase where the
  floor itself moves), the Big Top (mid-boss), the Wind-up Workshop (gears you ride and stop with
  keys), the Ferris Wheel (final boss on the turning wheel's cars).
- **Monsters ("tin" rig: jointed, wind-up keys, ratcheting motion):** Ballerina Music Box, Tin
  Drummer Girl, Jack-in-the-Box Jester, Marionette (strings visible, jerky dance), Teddy Strongman,
  Balloon Seller.
- **Bosses:** the Ringmaster's Lion (whip-cracks, hoop jumps the group must make); Madame Marionette
  (cuts and re-ties party members' "strings", controls swapped briefly); the Grand Automaton
  (assembled from the carnival's rides, a part per phase).

## 30-35: Celestial Library-Observatory

A tower above the clouds where the stars are catalogued.

- **Rooms:** rotating floors (the whole room turns a quarter on a timer), constellation puzzles
  (connect star-lamps to draw the shape shown), zero-gravity reading rooms (low gravity, long
  jumps), the Orrery (planet platforms orbit a sun), and the Telescope Crown.
- **Monsters ("astral" rig, floating with orbiting parts):** Comet Courier, Nebula Witch, Star-chart
  Cartographer, Moth Librarian, Meteor Golem Girl, Twin Gemini Ghosts.
- **Bosses:** the Archivist (books as weapons, silence zones where skills can't be used); the
  Eclipse Twins (sun and moon: light and dark halves of the room); Astraea the Star Keeper.

## 35-40: Candy Volcano

A sugar volcano about to erupt caramel.

- **Rooms:** Gumdrop Slopes (bouncy, sticky patches slow you), the Licorice Mines (minecarts),
  Chocolate River (rafts), the Caramel Forge (mid-boss), the Rock-Candy Caves (crystals reflect
  beams), the Crater (final boss over a lava-caramel lake with rising islands).
- **Monsters ("gummy" rig, wobbly springy bodies, never squashed: they bounce):** Gummy Bear
  Brawler, Cotton Candy Fairy, Lollipop Witch, Peppermint Spinner, Chocolate Golem Girl, Jelly
  Bean Ninjas.
- **Bosses:** the Gingerbread Twins; the Caramel Smith; Queen Bonbon, the Volcano's Heart.

## 40-45: Dream Theatre

A theatre where whatever is staged becomes real.

- **Rooms:** each room is a play: a fairy-tale forest set, a pirate ship set, a haunted castle set;
  set changes mid-fight (backdrops fly in, the floor plan changes); a spotlight mechanic (only lit
  monsters can be hit); the audience throws flowers (buffs) for stylish play.
- **Monsters ("stage" rig, theatrical exaggerated poses, cardboard props):** Understudy Ghosts,
  Chorus Line Dancers, Stagehand Imps, Prima Donna, Puppet Dragon (two dancers inside), Prompter.
- **Bosses:** the Director (calls "Cut!": everything freezes and resets positions); the Twin Masks
  (Comedy and Tragedy); the Phantom Playwright.

## 45-50: Sky Whale's Back

A whole town on a giant whale flying above the island.

- **Rooms:** the Tail Docks (the whale flips its tail: the floor tilts), the Spine Market, the Blowhole
  (an updraft geyser on a beat), the Lung Gardens (breathing rooms that expand and shrink), the
  Barnacle Fortress, the Whale's Brow (final boss in the wind at the top of the sky).
- **Monsters ("sky" rig, wind-blown cloth and hair, gliders):** Kite Rider, Cloud Shepherdess, Sky
  Pirate Gunner, Barnacle Knight, Storm Harpist, Feather Monk.
- **Bosses:** Captain Gale of the sky pirates; the Barnacle Matriarch; the Whale's Dream (the whale's
  own spirit, a gentle giant to be woken, not killed).

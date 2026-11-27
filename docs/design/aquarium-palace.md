# Sunken Aquarium Palace: the levels 20-25 group dungeon (design, 2026-11-02)

The third group dungeon, after Moonlit Manor (15-20). Built while the player was away, following
the ladder plan (docs/design/dungeon-ladder.md): unique setting, room shapes, gimmicks, monsters,
bosses and music.

## The story

Off the end of Pastel Harbor's pier the sea is glowing. A storm a hundred years ago sank Queen
Coralie's palace, and the bubble wards that kept the water out are failing one by one. The palace
folk have turned strange in the dark and the cold. Marina, a harbor diver, has a bubble charm that
lets a group of four go down.

## Where

The **Tidepool Pier**, a new map off the east end of Pastel Harbor, with Marina the diver as the
warden (the group finder). Entry from level 20; the finder brings players of 20-24.

## The run: a descent

Unlike the Hollow (down into roots) and the Manor (garden to roof), the palace is a dive: you start
at the surface and every room is deeper and darker, ending at the throne on the sea floor.

| # | Room | Shape | Task / gimmick | Set-piece |
|---|---|---|---|---|
| 1 | The Coral Gate | A tall climb down the palace's outer wall | Light the lantern corals (3); **bubble lifts** rise between the floors | |
| 2 | The Kelp Gardens | Side by side, a journey through kelp | **Currents** sweep a floor at a time; ride them or brace | |
| 3 | The Pearl Vault | Floors of giant clams | **Puzzle:** the tide bell rings an order; open the clams in that order (a wrong one snaps shut and spits jellyfish) | Puzzle room |
| 4 | The Moray Grotto | A cave with burrows in both walls | **Mid-boss: the Twin Moray Sisters** | |
| 5 | The Ink Abyss | A deep shaft with ledges | **The tide surges** over the floor: climb; **mid-boss: Lady Abyssia**, the sea witch | |
| 6 | The Throne of Tides | The great throne room on the sea floor | **Final boss: Queen Coralie** | |

## Monsters (levels 20-24)

Remade from scratch on 2026-11-26 as Queen Coralie's palace household: each a different real sea
creature with a palace job, each on its own copy of a blank base (its own folder in render/), each
wearing one small piece of the queen's livery, coral pink with a pearl. Abyssia's lamplighters are
hers instead and carry her violet. (The 2026-11-03 rigs in render/mobs/searigs.js were retired.)

- **Sea Bunny Bellhop** (jellymaid, render/seabunny/): a fluffy sea bunny slug in a coral pillbox cap
  who runs the bubble lifts at the Coral Gate; blows "Going up!" bubbles from its pom-pom tail, hopes
  for tips. Ear Whap, Bellhop Bump, Cap Flip.
- **Sea Angel** (stardancer, render/seaangel/): a soprano of the palace choir, a little sea angel
  with wing-flaps, a glowing heart and a bubble halo. Wing Slap, Heart Swoop, High C.
- **Beluga Lifeguard** (pearldiver, render/beluga/): the palace lifeguard, on duty at the bottom of
  the sea, with a whistle, a visor and a rescue float; throws bubble rings from afar. Rescue Ring,
  Buoy Bonk, Whistle Blast.
- **Sailfish Fencer** (seahorseknight, render/sailfish/): the guard's fencing master, his rounded bill
  his épée with a pearl button, his sail raised "en garde". Lunge, Flèche, Parry-Riposte.
- **Dumbo Lamplighter** (anglerlamp, render/dumbo/): one of Lady Abyssia's darlings, a tiny dumbo
  octopus with a violet sea-glass lantern, scared of the dark; she calls them into her fight. Glare,
  Lantern Bonk, Ear Slap.
- **Axolotl Librarian** (octoscholar, render/axolotl/): the palace librarian in a coral cardigan and
  half-moon glasses, a soggy book always in hand; shushes, stamps OVERDUE, throws paper boats from
  afar. Paper Boat, Book Slam, Shush.

## Bosses

- **The Twin Morays, Murri and Ena** (Grotto; remade 2026-11-26, render/moray/ and world/aquarium.js):
  two chibi moray eel sisters, Murri jade with a little coral crown (bossy, smug), Ena honey gold with
  frilly cheek fins and a pearl on a ribbon (giggly). Their entrance: a game of peekaboo from their
  burrows, then out of both at once, a loop-the-loop round each other and a boop of noses. The fight,
  by their health together: Peekaboo (one out, one hiding in a burrow and bursting out of it: Chomp
  Chomp! on the tank, Sister Gossip to spread, Peekaboo! at a burrow's mouth, then they swap), Tangle
  Time (both out: Sister's Pick marks one of you each, then they lunge from opposite walls; stand the
  two marked together and they crash and tie themselves in a knot, stunned and taking half again from
  every blow; Twin Twirl), Not Fair! (Double Peekaboo with a shared bubble in the middle, Grotto
  Squabble on everyone). Alone, the last one sulks and everything comes quicker. 56k each.
- **Lady Abyssia, the Sea Witch** (Ink Abyss; remade 2026-11-26, render/abyssia/ and world/aquarium.js):
  a little octopus sea witch, half lady and half octopus, who has been draining the light out of the
  wards into her lanterns so the deep can be dark, and hers. Ink-indigo hime hair, a violet witch's hat
  whose point curls into a nautilus shell (the teal band and starfish buckle her darlings wear), a pearl
  scallop collar, a violet gown with an orchid peplum over six orchid octopus arms, a lamplighter's
  crook with a big violet sea-glass lantern. Her entrance: she rises out of a pool of ink, nautilus
  first, arms unfurling, lanterns winking alight; at "Ink, my darlings!" she pinches her lantern dark.
  The fight: Good Evening, Darlings (Kiss Goodnight on the tank, Ink Blots to spread, Lights Out! (the
  dark falls over the room but for the beams under three hung lanterns), Eight-Arm Embrace (in close)
  then Ink Flounce (out)); Light the Way! at 65% (two Dumbo Lamplighters called: now Lights Out!'s
  beams are the darlings' own lanterns and hers; Ohohoho! on everyone); The Deep Is Mine below 30%
  (Lights Out: Adrift, the lanterns drifting across the room as the dark falls; everything quicker).
  The tide still surges in the shaft (get up on a ledge). 110k.
- **Queen Coralie, the Drowned Queen** (Throne; remade 2026-11-26, render/coralie/ and
  world/aquarium.js): a young mermaid queen in her own livery, worn in full: long seafoam hair, a crown
  of branching coral with pearls, a coral bodice with a strand of pearls, a sea-silk mantle, a coral
  tail fading to pearly peach with a big sheer fluke, and her scepter topped by a keepsake globe with
  one little orange fish in it. Her entrance: she stands perfectly still in a glass display case of her
  own ("Exhibit No. 1: Me!") till she winks, the case lifts away in bubbles and she presents her
  collection. The fight: Welcome to My Collection (Royal Decree on the tank; Display Cases, numbered,
  coming down in that order; Strand of Pearls in front of her; Royal Wave on everyone), Say Pearls! at
  60% (the Royal Portrait: everyone into the gilded frame with her, or be left out of the picture),
  Nobody Ever Leaves! below 25% (Glass Walls slide in from both sides; six cases; Royal Encore). 200k.
  Freed at the end: she opens Elder Warabi's tank with a tap of her scepter, and last of all lets her
  own little fish go and swims up after it to see the sun.

## Rewards

The rewards for clearing it: EXP, gold, Cash, your job's Lv 25 gear, **Tide Pearls** (the tokens), and the
**Tidecaller** set (a shell crown, a pearl collar, a fin cape).

## Music

"Bubble Pop" (tropical city pop, E-flat major, vibraphone over kalimba) and, for the boss rooms,
"Undertow" (F minor, brass and marimba). A hushed underwater ambience.

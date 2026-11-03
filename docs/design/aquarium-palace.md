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

Redrawn creature-first on 2026-11-03 (render/mobs/sea.js, helpers in render/mobs/critter.js): chibi
sea creatures in the field monsters' style, each its own silhouette, about the hero's size. The
first look (costumed girls on a tall mermaid rig) read as clunky and was retired.

- **Jelly Belle**: a round jelly bell with a face, a scalloped rim and ribbon tentacles; drifts with
  a pulse and lashes two stinging ribbons.
- **Seahorse Squire**: a chubby seahorse in a plumed helmet, a lance under its fin; bounces on its
  curled tail and springs into a thrust.
- **Lantern Angler**: a round anglerfish with a toothy grin; the lure flashes, then it lunges and
  chomps.
- **Pearl Otter**: an otter in a glass bubble helmet hugging a pearl; winds up and throws it.
- **Star Twirler**: a starfish standing on two arms with a bow; skips on tiptoe and cartwheels into
  a spinning slap.
- **Octo Scholar**: a round octopus in glasses and a mortarboard; walks on curling arms and flings
  its book in a puff of ink.

## Bosses

- **The Twin Moray Sisters** (Grotto): two great round-headed eels rearing out of a coil on the floor (render/mobs/seaboss.js), Murri green with a coral crown, Ena gold with fin frills. One fights while
  the other hides in a burrow in the wall, out of reach, spitting bubbles; they swap now and then,
  and the one coming out lunges across the floor.
- **Lady Abyssia, the Sea Witch** (Ink Abyss): a big round octopus in a witch's hat curled into a
  nautilus shell, with a pearl staff. Ink clouds on the floor, tentacles that sweep in from the walls, and the tide surging in the
  shaft (get up on a ledge).
- **Queen Coralie, the Drowned Queen** (Throne): a grand mermaid queen with a coral crown and a
  trident. Phase 1 Tidal Strikes (trident lines), phase 2 the Whirlpool (it pulls everyone toward
  her), phase 3 the Great Wave (a wave rolls across the room: jump it). Freed at the end: the wards
  come back on and the palace lights up.

## Rewards

The chest: EXP, gold, Cash, your job's Lv 25 gear, **Tide Pearls** (the tokens), and the
**Tidecaller** set (a shell crown, a pearl collar, a fin cape).

## Music

"Bubble Pop" (tropical city pop, E-flat major, vibraphone over kalimba) and, for the boss rooms,
"Undertow" (F minor, brass and marimba). A hushed underwater ambience.

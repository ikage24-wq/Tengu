# Sound sources

Every recording here is free to use in the game with no credit needed: public domain (CC0), except
the finished effects in `rec/`, which are royalty free under the Sonniss GDC bundle licence (fine
inside the game; not to be handed out as sound effects on their own). Only add recordings under
terms like these. Rebuild with `node tools/build-audio.mjs`.

- **Instruments** (`inst/`): Versilian Studios' [VS Chamber Orchestra 2 Community
  Edition](https://github.com/sgossner/VSCO-2-CE) and [Versilian Community Sample
  Library](https://github.com/sgossner/VCSL): orchestra, pianos, harpsichord, organ, harps, the Dan
  Tranh (played as the koto), mallets, bells and drums.
- **Effects** (`sfx.mp3`): Kenney's RPG Audio, Impact Sounds, Interface Sounds and Sci-Fi Sounds
  packs; CC0 packs from OpenGameArt (artisticdude, Ogrebane, rubberduck, Still North Media,
  qubodup); and percussion from the two Versilian libraries for the spells (gongs, bells, wind
  chimes, wine glasses, cymbals, drums, zaps).

- **Finished effects** (`rec/`, listed in `src/audio/recorded.js`): cut and layered from the
  Sonniss GDC [2024](https://sonniss.com/gameaudiogdc/) and [2026](https://gdc.sonniss.com/) Game
  Audio Bundles ([licence](https://sonniss.com/gdc-bundle-license/)): weapons, impacts and
  explosions (David Dumais Audio, Justsoundeffects, Bluezone, Federico Soler, Jake Fielding, Orbital Emitter,
  Cinematic Sound Design), magic and elements (Epic Stock Media, Alexander Kopeikin, Rescopic
  Sound, InMotionAudio), cartoon, anime and interface sounds (Cinematic Sound Design, Rogue Waves,
  Doex Studio, CB Sounddesign), creatures (344 Audio, Chupapsound) and the world (Justsoundeffects,
  Jake Fielding, Nick McMahan, Pole Position, Systematic Sound, Ivo Vicic, Mechanical Wave). Rebuild
  with `python tools/build-rec.py` (the bundles have to be downloaded by hand first).
- **Ambience loops** (`amb/`, played by `src/audio/ambience.js`): cut from the same Sonniss GDC
  bundles (royalty free under their licence, inside the game only): Nick McMahan's Cascadia Shore
  Waves (the beach), Rogue Waves' Yacht & Marina (the dock) and Systematic Sound's Rural
  Countryside 01 (the meadows), Justsoundeffects' Forest Ambiences (the woods); and since 2026-11-08
  every other kind of place: Jake Fielding's Industrial Harbor (harbours), Neutral Interior Walla
  (the theatre) and Interior Wind Rain and Storms (the manor), Sonik Sound Library's Spatial
  Countryside (towns, sky), InMotionAudio's Cave Design (caves), Submerge (the aquarium) and Chimney
  Wind (the sky whale), Just Sound Effects' Highlands of Norway (the crags), Systematic Sound's
  Nightscapes 01 (ruins) and Quiet Rooms 01 (indoors), Epic Stock Media's Strange Game Ambient Loops
  3 (the hollow, the observatory) and Public Spaces crowds (the carnival), and 344 Audio's Haunting
  Ambiences Vol. 5 (the candy volcano). Rebuild with `python tools/build-amb.py`.
- **Monster voices** (`rec/mv*.mp3`, listed in `src/audio/voices.js`): cut and pitched from the same
  Sonniss GDC bundles by `python tools/build-voices.py`: 344 Audio (Dinosaurs, Dog Vocalisations,
  Anime Fight Voices), Mechanical Wave (Farm Animals, a cat, Lumberjack), Jake Fielding (Red Kite,
  Squeaky Gates), SoundBits (Vox Bestiae, Vox Hominis), Epic Stock Media (Humanoid Creatures,
  Anime Game, Synthesized Nature), Cinematic Sound Design (Cartoon Bloopers and Animation), Rogue
  Waves (Creaking Door), InMotionAudio (Wood) and DavidDumais (Robotic Creatures).
- **Music** (`music/`, listed in `src/audio/tracks.js`): Juhani Junkala's JRPG Music Packs 1, 2, 3, 4
  and 5 and Epic Boss Battle; Tarush Singhal's Happy Ukulele Island Surfing Theme; cynicmusic's Crystal Cave, Dark Forest and Battle Theme A; Kistol's
  Snowfall; Cleyton RX's Underwater; RandomMind's The Old Tower Inn. All from
  [OpenGameArt](https://opengameart.org), all CC0.

The written songs (`src/audio/songs.js`), with their synths, drums and choir made in code, are kept
for any area without a recorded track.

## Fight sounds (tools/build-fight.py, 2026-11-08)

Weapon swings and thrusts, throwing stars, heavy arrow hits, poison, fire, mist, hook, bladestorm, power gathering, nightfall and stormburst, layered from the Sonniss GDC 2024/2026 bundles (royalty free, no credit required): David Dumais Audio Melee Weapons 2, Justsoundeffects Melee Weapons, Rescopic Sound Distinct Whooshes, InMotionAudio Arc, Doex Studio 90s Anime SFX, Cinematic Sound Design (Ultra Transitions & Impacts, Cartoon Bloopers), Epic Stock Media (Elemental Mutation Whooshes, HD Game Materials, Fantasy Game 2), BluezoneCorp Steampunk Weapon, 344 Audio (Cinematic Fight Vol. 1, Elemental Palette Designed Vol. 1), Federico Soler Effective Trailer Booms Vol. 2, Alexander Kopeikin Emotion and Magic.

## Movement sounds (tools/build-fight.py, 2026-11-08)

Jumping, landing, climbing, mounting, furniture, the kettle mount's whistle and rattle, the cloud's puff, the turtle's splash and the bunny's hop, from the same bundles: InMotionAudio (Foley T-Shirt, Wood), Pole Position Steam Engine Model, Justsoundeffects (Steampunk Gadgets, Water in Motion), Cinematic Sound Design Cartoon & Animation Vol 2.

## Buff sounds (tools/build-fight.py, 2026-11-08)

The buff and party buff: Epic Stock Media Fantasy Game 2 (a bright light spell) and 344 Audio Christmas Vol. 1 (magic bells).

## Tide Mage sounds (tools/build-fight.py, 2026-11-09)

Her whip of water, waves, bubbles, splashes, geyser, whirlpool, waterfall, hits and staff swish, from the same bundles: BluezoneCorp Designed Water, InMotionAudio Submerge, Epic Stock Media Elemental Mutation Whooshes and Impacts, Nick McMahan Cascadia Shore Waves, Rescopic Sound Distinct Whooshes, David Dumais Audio Melee Weapons 2, 344 Audio Elemental Palette Designed Vol. 1, Cinematic Sound Design Cartoon & Animation Vol 2.

## Stormwall sounds (tools/build-fight.py, 2026-11-09)

His heavy blows, rain curtains, static plates, field lines, lightning cages, walls of storm, the thunderhead's bolts, rolling thunder, Overcast and Fortress: the Thunderguard's storm bundles pitched down and heavy, with the Bolt Backyard Rain recording, the line's axe hit and booms.

## Tempest sounds (tools/build-fight.py, 2026-11-09)

His streaks, flash-steps, red bolts, Thousand Cuts, crescents, rush and clap: the Thunderguard's storm bundles (BluezoneCorp High Voltage, InMotionAudio Arc, Epic Stock Media, Jake Fielding) pitched up and cut short, with the line's fast blade and sci-fi whooshes.

## Thunderguard sounds (tools/build-fight.py, 2026-11-09)

His crackling blows, jumping bolts, static bursts and rings, bolt beams and columns, the bolts he calls down, the thunderclaps, Thunder Rush, Cyclone Edge, Lightning Rod, Static Guard, Thunderfall's storm and bolt, and Overcharge: BluezoneCorp High Voltage (arc discharge, sizzling crackle), InMotionAudio Arc (arc design, buzz), Epic Stock Media Elemental Mutation Whooshes and Impacts (electric impact), Epic Stock Media Public Spaces Storms (a real thunderclap) and Jake Fielding Interior Wind Rain and Storms (thunder rumble), layered with the line's booms and whooshes.

## Tidecaller sounds (tools/build-fight.py, 2026-11-09)

Her pearls, shells, crescents, ribbons, pillars of moonlight, drops, springs, heals, rain, blessing, revive, Moonfall and Moon Tide: the Tide Mage's water bundles, pitched up and lighter, layered with Epic Stock Media Strange Game Ambient Loops 3 (bell shimmer), Cinematic Sound Design User Interface (Button Arp Twinkle), Epic Stock Media Anime Game (bright power-up shimmer), Bolt Backyard Rain & Thunder (calm night rain) and Alexander Kopeikin Emotion and Magic (astral energy flow).

## Maelstrom sounds (tools/build-fight.py, 2026-11-09)

Her spears, vortex bolts, vortices, beams, slams, glowing charges, slash, shell, pool, black wave and the Maelstrom whirlpool, from the same bundles as the Tide Mage's, pitched down and layered with Federico Soler Effective Trailer Booms Vol. 2 and Cinematic Sound Design Ultra Transitions & Impacts.

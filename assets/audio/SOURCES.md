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
- **Mochi voices** (`rec/mochi*.mp3`, listed in `src/audio/recorded.js`): cut and pitched from the
  same Sonniss GDC bundles by `python tools/build-mochi-voices.py`: Mechanical Wave (Farm Animals'
  chicks and gosling, a cat), Epic Stock Media (HD Game Materials' dry-ice squeak, Synthesized
  Nature's frog), CB Sounddesign (Applicable Sounds' bird flutes), 344 Audio (Dinosaurs' hatchling)
  and SoundBits (Vox Hominis' whistle).
- **Race music** (`music/pure-raceway*.mp3`, `music/win-jingle.mp3`, listed in `src/audio/tracks.js`),
  all CC0 from OpenGameArt: mintodog's Pure Raceway and its Climax mix
  (opengameart.org/content/pure-raceway), and fupi's Win Jingle, vibraphone version
  (opengameart.org/node/114596), padded with quiet so it plays once. Cut to 96 kbps and levelled to
  the rest of the soundtrack.
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

## Sakura Sprint festival sounds (tools/build-fight.py, 2026-11-13)

The taiko on the countdown and the double beat at Go (BluezoneCorp - Modern Cinematic Impact, a deep percussion hit, pitched up a little), the crowd swelling at the final stretch (Sonik Sound Library - Spanish Crowds, a small club cheering and clapping, faded in), and the wind chimes (Mechanical Wave - Sound Effects Collection, a metallic handbell, pitched up into notes by the game). Sonniss GDC bundles, royalty free inside the game.

## Lily Lake gala sounds (tools/build-fight.py, 2026-11-13)

The lifeguard starter's whistle, a short toot on each count and a long blast at Go (SoundBits - Vox Hominis - Human Effort Voices, a held whistle, its steady middle pitched up a little); racers diving in (InMotionAudio - Submerge water impact with BluezoneCorp - Designed Water spray and a few Cinematic Sound Design cartoon bubbles); climbing out and the buoy fountains (Justsoundeffects - Water in Motion soft movement, InMotionAudio - Submerge water flow); bubbles over the podium (Cinematic Sound Design - Cartoon & Animation Vol 2); and the lake lapping at the shore, three takes (Epic Stock Media - Public Spaces, a summer lake dock). Sonniss GDC bundles, royalty free inside the game.

## Mortar Cliff festival sounds (tools/build-fight.py, 2026-11-13)

The mallet pounding mochi on the count and at Go (Epic Stock Media - Tower Defense Game, a light wooden hit with a squelch, pitched down, a little of the BluezoneCorp taiko under it), the breeze through the maples (Rescopic Sound - Distinct Whooshes, an airy wind gust, with InMotionAudio - Sound of the Corn leaf movements), and the bell at each wall's top (the Mechanical Wave handbell, pitched down). Sonniss GDC bundles, royalty free inside the game.

## Cloud Glide winter sounds (tools/build-fight.py, 2026-11-13)

Soft bells on the count and at Go (344 Audio - Christmas Vol. 1, magic Christmas bells), the gust as yours takes off and the wind over the peak (Rescopic Sound - Distinct Whooshes, an airy wind gust), landing in the snow (InMotionAudio - Foley T-Shirt, a soft pat), and a cheer as yours lands (Sonik Sound Library - Spanish Crowds). Sonniss GDC bundles, royalty free inside the game.

## Long Hill Run sweets sounds (tools/build-fight.py, 2026-11-13)

A kawaii pop on each count (Rogue Waves - Kawaii UI, a syringe pop); at Go a bright pop (Cinematic Sound Design - Interface & Infographics), a kalimba running up (CB_Sounddesign - Applicable Sounds) and a music box note an octave up (Sonic Bat - Music Boxes); single music box notes now and then, which the game pitches into a little tune; a soft gust as yours runs down from a hilltop (Rescopic Sound - Distinct Whooshes, an airy wind gust) after the cheer there (Sonik Sound Library - Spanish Crowds); and a patter of cartoon pops (Cinematic Sound Design - Cartoon Impacts) with a twinkle (Cinematic Sound Design - User Interface) over the podium as the sprinkles fall. Sonniss GDC bundles, royalty free inside the game.

## Grand Mochi Course festival sounds (tools/build-fight.py, 2026-11-13)

The taiko a little deeper on each count and two strokes at Go (BluezoneCorp - Modern Cinematic Impact, as at Sakura Sprint) with a firework popping off; the drummer on the yagura drumming yours over its top (the same taiko, three strokes) and the crowd's cheer (Sonik Sound Library - Spanish Crowds); a firework launched and bursting as yours takes off (Ivo Vicic - Fireworks FX, powerful explosions near: the launch thump, the boom and its crackle); fireworks booming far off now and then, three takes (Sonic Bat - Fireworks Ambience, distant fireworks); and over the podium a twinkle (Cinematic Sound Design - User Interface) and a far boom. The pond's dives and swishes are Lily Lake's. Sonniss GDC bundles, royalty free inside the game.

## Mochi Grand Tour kingdom sounds (tools/build-fight.py, 2026-11-13)

A guard's spear butt grounded on stone for each count (344 Audio - Historical Weapons Vol. 2, a wooden spear and stick impact, with a little of the BluezoneCorp taiko under it); at Go a horn fanfare over two spears (Jake Fielding - Cinematic Horn Braams) and the town gate creaking open (Jake Fielding - Squeaky Gates, wooden and metal hinge creaks); a flag running up a wall's pole (InMotionAudio - Foley T-Shirt cloth with a Rescopic Sound wind gust); the drawbridge chain overhead at the moat (Jake Fielding - Squeaky Gates, a gate latch mechanism); a far horn call across the kingdom now and then (Mechanical Wave - Cinematic Feel, a cinematic horn, pitched up and faded in); and the full fanfare with a crowd under it as yours comes home and on the podium (both horns with Sonik Sound Library - Spanish Crowds). The moat's dives and swishes are Lily Lake's. Sonniss GDC bundles, royalty free inside the game.

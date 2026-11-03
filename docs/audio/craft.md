# Music and sound design: the craft

How Tengu's music and sound should be made (2026-11-03). This replaces the pile of song rules
that built up from round after round of feedback, which had flattened the soundtrack into one
gentle formula. These are principles, not recipes: decide every song and sound from what the
moment needs, and use the earlier research (`research-music.md`, `research-sfx.md`,
`research-japanese.md`) for depth on specific techniques.

## Part 1: Music

### Start from the moment, not a genre

Before a note, write down what the place or fight should feel like and how the player moves
through it: a town you idle in for minutes, a field you grind in for an hour, a dungeon room you
rush, a boss you fight for three minutes. That decides tempo, density, loop length and how much
the song may change. Genre is a costume chosen afterwards to fit.

- Places you stay long need longer loops (90 s and up), more sections and more variation, or
  they fatigue: short loops are the fastest way to make a game's music annoying.
- Places you pass through fast can be shorter and punchier.
- Fights need drive (a steady pulse, rising energy), towns need warmth and space, dungeons need
  character and a sense of place.

### Melody: one strong idea, developed

A song lives or dies by its main motif.

- Build it from a short idea, two to five notes, mostly chord tones, with a rhythm you could tap.
- Give it a shape: an arch (rise to a peak, settle back) is the classic; put the peak, the
  highest note, on a strong beat where it lands.
- Repeat it, then vary it: transpose it, keep the shape but change the rhythm, change one note,
  answer it with a contrasting phrase (call and response). Too much repetition is lazy, too little
  is hard to follow; a phrase pattern like A A' B A'' sits well between the two.
- Start some phrases off the downbeat (just before or after beat 1); syncopation makes a line
  catchy.
- Rising lines and leaps build tension; falling, stepwise lines release it.
- Give every area a motif of its own, and reuse an area's motif (a leitmotif) in its jingles,
  boss fight or ending so the place has an identity you can recognise.

### Harmony and key

- The chord progression sets the mood more than the instruments do: major and bright for
  towns and wins, minor or modal (Dorian, Mixolydian, Lydian) for adventure and mystery, darker
  minor and chromatic moves for bosses.
- Change key for a lift (a step up for the last chorus), or to make a familiar melody feel new
  without repeating it.

### Arrangement: manage the energy

Arranging is controlling tension and release over time by adding, taking away and changing parts.

- Contrast makes impact: a section hits harder after a thinner one. Don't play everything all the
  time; drop parts out, then bring them back.
- Build tension with rising filters, risers, snare rolls, a rising bass or melody, holding back
  the kick; release it with the full groove coming back in. A short pull-back (silence, reverb
  cut off) just before the release makes it land.
- Give each part a job and a register: one lead melody on top, one bass line underneath, one
  harmonic bed in the middle, rhythm around them. When two parts fight for the same range and
  role, the song turns to mush; cut one or move it.
- Make the loop seamless, and make the end lead back into the start musically (an upbeat, a fill),
  so it never shows a seam.

### Game music has to react

- Vertical layering: write a song as stems that can fade in and out with the game: a calm layer,
  then drums and bass for a fight, extra intensity at low HP or a boss's last phase.
- Horizontal changes: swap sections on a beat or bar line (never mid-beat), use a short transition
  or stinger to cover a cut.
- Jingles (level up, quest done, rare drop): short, distinctive, usually a quick run up into a long
  landing note; the music dips under them so they read.

### Mixing

- Low end: the kick and bass share the bottom, so give each its own space (cut the bass where the
  kick's punch sits, or duck the bass's low band when the kick hits); high-pass everything that
  isn't meant to carry bass.
- Give each part its frequency range and space: cut overlapping ranges rather than boosting, use
  panning to spread parts left and right, and reverb or delay sends at two or three depths
  (close, middle, far) to place parts front to back. Keep the lead and the kick dry and centred.
- Balance by role (roughly): lead loudest, then drums and bass, accompaniment under them,
  ornaments quietest. Level-match before judging any change; louder always sounds "better".
- Leave headroom: the game adds sound effects on top of the music, so the music must leave room
  for them (especially in the mids, where hits and voices live).

## Part 2: Sound effects

### Every sound tells the player something

A sound effect is feedback first: it confirms an action, reports a result (hit, crit, block,
miss), warns of danger, or rewards. Decide what it has to say before how it should sound, and make
important things (a boss's tell, a crit, low HP) instantly recognisable even with everything else
going on.

### Build impacts in layers

Big sounds are layers, each with a job:

- **Transient**: the sharp attack, the click or crack at the moment of contact. It sells the timing.
- **Body**: the weight and character, what it's made of (wood, metal, flesh, magic).
- **Sub**: a low thump for big moments only (crits, finishers, boss slams).
- **Tail**: the ring-out or space after.

Line the transient and body up on the same instant so they fuse into one hit; small shifts
between them change how big and punchy it feels. Start the transient right at the file's first
sample: any dead air makes the game feel laggy.

### Sounds that repeat must not tire the ear

- Keep often-repeated sounds (basic attacks, footsteps, menu clicks) short, a few hundred
  milliseconds, crisp, with little tail and little sub.
- Vary them every time: random pitch (a few semitones), a pool of takes, slight timing and volume
  differences. Identical repeats are what makes game audio sound cheap.
- Cap how many copies of one sound can play at once, and leave silence: not everything needs a
  sound.

### Scale with importance

Small actions get small, quiet, short sounds; big ones get more layers, more low end and longer
tails. A finisher should feel bigger than a jab; a boss's slam bigger than a slime's bump; a rare
drop's chime bigger than a coin. If everything is loud and big, nothing is.

### Synthesising sounds in code (Web Audio)

Tengu makes many sounds in code, so these are the tools:

- Shape everything with an envelope (attack, decay, sustain, release): a fast attack and quick
  decay reads as a hit, a slow attack as a swell.
- Pitch sweeps: rising for jumps, power-ups and positive feedback, falling for hits taken, misses,
  losses.
- Filtered noise for air, wind, whooshes, explosions, rain and texture (band-pass sweep for a
  whoosh, low-pass for rumble).
- FM synthesis for bells, metal, chimes and bright, rich tones (sensitive to small parameter
  changes: tune by ear).
- Mix synthesis with recordings: a recorded transient or texture plus a synthesised body usually
  beats either alone; pure synthesis on its own tends to sound thin and "beepy".

### Mixing sound effects with the music

- Keep effects, music, ambience and UI on their own buses with their own levels.
- Duck the music a little under big moments (jingles, finishers, boss tells), never under every
  blow.
- Keep ambience quiet and continuous; it fills silence, it shouldn't compete.

## Working method

1. Decide what the moment needs (feeling, tempo, what must be heard).
2. Make one song or one sound family as a demo, with its layers, and check it in the game, not on
   its own: in context, under fights and effects.
3. Get the player's reaction, then change it. Fresh feedback is about that piece; don't freeze it
   into a blanket rule for every future song.
4. Only then roll out to the rest.

## Sources

- Looping, layering and adaptive game music: [Game Developer, "Rethinking the audio loop"](https://www.gamedeveloper.com/audio/rethinking-the-audio-loop-in-games), [Berklee Online](https://online.berklee.edu/takenote/?p=14985), [Oak National Academy](https://www.thenational.academy/pupils/lessons/arranging-and-analysing-video-game-music/video).
- Melody: [Splice, developing a melody](https://splice.com/blog/?p=4704), [Loopcloud, 12 tips](https://www.loopcloud.com/cloud/blog/5354-12-Simple-Tips-for-Writing-Masterful-Melodies), [LANDR, melody](https://blog.landr.com/melody), [Orphiq](https://orphiq.com/resources/how-to-write-a-melody).
- Arrangement and energy: [Beat Kitchen, arrangement and energy](https://beatkitchen.io/guides/electronic-music/06-arrangement-and-energy/), [EDMProd, tension](https://www.edmprod.com/tension/), [Point Blank, tension and release](https://www.pointblankmusicschool.com/blog/creating-tension-and-release-in-electronic-dance-music/).
- Mixing: [Waves, kick and bass](https://www.waves.com/how-to-mix-kick-bass-together-5-tips), [iZotope, kick and bass](https://www.izotope.com/community/blog/how-to-mix-kick-and-bass), [MusicRadar, kick drums](https://www.musicradar.com/how-to/10-things-you-need-to-know-about-mixing-kick-drums), [Mastering The Mix, space with EQ](https://www.masteringthemix.com/blogs/learn/creating-space-in-your-mix-using-eq), [Produce Like A Pro, space](https://producelikeapro.com/blog/creating-space-in-your-mixes/).
- Sound effects: [Violet Recording, impact sounds](https://violetrecording.com/how-to-make-impact-sounds/), [Violet Recording, game sound effects](https://violetrecording.com/how-to-design-sound-effects-for-games/), [Morphic, layering](https://morphic.com/resources/how-to/how-to-layer-sound-effects), [Wayline, game audio](https://www.wayline.io/learn/game-audio/1).
- Synthesis in code: [O'Reilly, Web Audio API ch. 6](https://www.oreilly.com/library/view/web-audio-api/9781449332679/ch06.html), [DEV, procedural audio textures](https://dev.to/hexshift/how-to-generate-procedural-audio-textures-in-the-browser-no-samples-needed-332l), [Casey Primozic, FM synthesis](https://cprimozic.net/blog/fm-synth-rust-wasm-simd/); for depth, Andy Farnell's *Designing Sound*.

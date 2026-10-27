# Audio research: what Japanese games do (FFXIV, Pokemon, Dragon Quest, Kirby, MOTHER, Animal Crossing)

Scope: what these specific games do with music and sound, and why it works. This is a guide for remaking Tengu's audio, all synthesized with the Web Audio API, leaning 8-bit ("bit tones"). Generic sfxr/ZzFX recipes and generic chiptune instrument and melody theory are covered in the sibling research files. This file does not repeat them.

How to read the numbers:

- **Game Boy units.** The Game Boy runs at about 59.7 frames per second, so 1 frame is about 16.7 ms. Note lengths taken from the Pokemon disassemblies (pret/pokered, pret/pokecrystal) were converted with that engine's timing: a note lasts `length x speed x tempo / 256` frames. So a 16th note at `note_type 12` lasts `12 x tempo / 256` frames, and BPM = 3582 / (frames per quarter). Treat these as close readings, not official figures.
- **Duty cycle.** Duty 0/1/2/3 = 12.5% / 25% / 50% / 75% pulse width (75% sounds the same as 25%).
- **Pitches** use scientific names (A4 = 440 Hz).
- **Confidence.** Items marked *(observed)* are our own listening or reading of game data. Items marked *(fan claim)* come from fan posts and are weaker evidence. Everything else cites a source directly.

---

## Part 1: Final Fantasy XIV (Masayoshi Soken and the sound team)

### F1. Battle music is cut only at musical seams ("Dynamix End")
- **Technique.** FFXIV embeds cue markers in battle tracks. When the battle ends, the system waits for the next marker, plays a prepared ending section, and only then starts the next track. A cut at a bad point (the team's example was "the off-beat of beat 3") sounds broken.
- **Numbers.** 4-channel stream = 2 stereo pairs (main loop + ending). Field music is layered by content priority. Transitions line up the beats of the two tracks and overlap them (拍を揃え、重ね合わせる).
- **Sources.** CEDEC 2012 report, https://www.gamebusiness.jp/article/2012/08/21/6655.html ; CEDEC 2013 report, https://www.famitsu.com/news/201308/24038800.html
- **Apply.** Our music scheduler should queue every change (battle start, boss phase, victory) to the next bar line (or at least the next beat), never "now". Every loop needs a written 1-bar ending tag (a cadence plus a hit) that plays when a fight ends mid-loop.

### F2. One song whose sections advance with the fight, with "glue" room between them
- **Technique.** For FFXVI, Soken moved away from stacking arrangement layers. He found that piling on more and more intensity stages wasn't clearly better. Instead, *one* piece moves to its next section as the battle progresses: 「1曲の中でバトルの進行に合わせて曲の展開が変わっていく」 ("within one song, the development changes with the battle's progress"). Each section leaves a margin (のりしろ, "glue tab") so the next section can join without breaking the music. The track is built to end together with the battle, either by fading out or with a hard stop.
- **Also.** The game ducks the music *ahead of* attack inputs so hits stay audible. At key moments the music deliberately does *not* follow the player and changes abruptly: 「おら、バトルが来たぞ！！」 ("Hey, the battle's here!!").
- **Source.** Denfaminico interview, https://news.denfaminicogamer.jp/interview/230522w/2
- **Apply.** Write the boss track as sections A, B, C, D, plus an outro. Each section ends in a 1-2 bar "glue" phrase (a drum fill or turnaround) that can lead into the same section again or into the next one. A phase change waits for the glue phrase. An abrupt cut is kept for one dramatic beat only, such as the enrage.

### F3. Arcadion and Dancing Green: the fight was choreographed on a 1-frame timeline with the music
- **Technique.** For the Cruiserweight floor 1 boss (Dancing Green), the designer wanted 「BGMとSE、バトルが密接に連動したバトル」 ("a battle where BGM, SE and combat are tightly linked"). Several teams built one timeline of boss actions, network calls and sounds at 1-frame precision, then tested it with placeholder assets. The theme is 1970s-80s American disco, done as *soul* rather than high-tempo dance so the boss can actually dance. Skill timing follows the BGM. In the "n-point & pose" move, the sound effect changes with the value of n. "Let's Dance!" was first harder (a faster tempo and four-direction patterns) and was toned down to be milder and clearer. The sound staff noted that battle designers ask for a 「音ゲーのようなバトル」 ("a rhythm-game battle") every few years.
- **Numbers.** 1-frame timeline. Soul or disco tempo (our reading: about 110-120 BPM, not 130+).
- **Sources.** Famitsu developer interview (2025-07-16), https://www.famitsu.com/article/202507/47282 ; mechanic names and disco references (Arcady Night Fever, Hi-NRG Fever, "Get Down"), https://ffxiv.consolegameswiki.com/wiki/M5 ; main theme "Ride the Rhythm", https://finalweapon.net/2025/07/16/final-fantasy-xiv-official-ride-the-rhythm-lyrics/
- **Apply (our Dancing Green).** Drive boss attacks from the music clock, not from timers. Telegraphs appear on a downbeat and resolve exactly N beats later. A "count" move plays one rising blip per count (n blips = n hits), so the sound itself tells the player the number. Keep the tempo at about 112-118 BPM so dodges stay readable. Speed up only for the enrage (named after Hi-NRG, a faster disco style).

### F4. Genre mixing and leitmotif quoting are the norm
- **Technique.** Soken changes genre per content, and by 2025 it was "hard to find a genre we haven't touched". Arcadion added hip-hop and rap. Primal fights got vocal songs so they would be remembered. Dungeon tracks are built by *quoting melodies from earlier tracks* (for example "A Long Fall"), which ties a place to the story: 「そのダンジョン固有の曲になる」 ("it becomes that dungeon's own song"). A finale was briefed as 「オケではないアプローチ」 ("a non-orchestral approach"). Mockups take about 1 day and are 70-80% of the final track.
- **Sources.** https://www.gamebusiness.jp/article/2021/10/04/19129.html ; https://www.techradar.com/gaming/final-fantasy-14-composer-masayoshi-soken-interview-april-2025 ; https://vgmonline.net/masayoshisoken2/
- **Apply.** Write one 4-6 note "Tengu motif". Quote it in the title theme, the town theme (slow, major), the boss theme (as the bass riff, or in the minor), and the victory sting. Dancing Green gets a genre break (disco or funk) on top of the chip palette. That contrast is exactly the FFXIV move.

### F5. Music follows the fight's real state (Titan, the Moogle "stringendo", Shiva's second half)
- **Technique.** The ARR Titan theme has "dynamic changes based on your progress". Soken asked the battle team how the fight would unfold before it was playable. The Moogle boss used a tempo that steps up through 5 levels as more moogles appear (done with granular time-stretching). Some primals, such as Shiva, have a separate second-half track for the later phase.
- **Sources.** https://classic.rpgfan.com/features/Music_of_the_Year_2013/Masayoshi_Soken_Interview.html ; https://www.gamebusiness.jp/article/2012/08/21/6655.html ; https://www.4gamer.net/games/199/G019924/20150827047/
- **Apply.** We synthesize, so tempo changes are free: there's no stretching, we just change the scheduler BPM at a bar line. Use stepped intensity (for example 3-5 levels) tied to boss HP, and never a continuous ramp.

### F6. Mixing rules: battle sounds must never fight the music
- **Technique.** BGM is designed to avoid 「ケンカ」 (clashing) with clearly placed effects. Jingles automatically duck everything else; this was added after one patch shipped many jingles. A per-group compressor caps how loud any one group can get. UI sounds stay resident in memory so they always play instantly. The final check is always on speakers, not just headphones.
- **Sources.** 2012 and 2013 CEDEC reports above; https://www.gamebusiness.jp/article/2021/10/04/19129.html
- **Apply.** Use buses: music, sfx, ui and jingle. When a jingle plays, duck music by about 8-10 dB with a 30 ms attack, and restore it over 400 ms after the jingle ends. Put a limiter on the sfx bus. Never drop or delay UI sounds.

### F7. FFXIV ability and UI sound character *(observed, with documented roles)*
- **What we hear.** Every action has a short, bright transient at the moment of contact. Weapon skills get a body layer (whoosh plus impact), and magic adds a tonal "sparkle" tail. Combo steps get progressively brighter and heavier. Menus use soft, short, pitched clicks that stay out of the battle's frequency range. The Limit Break is a long build plus one big, low, wide impact.
- **Documented.** Lead sound designer Go Kinuya works on every SE category. Sounds are tuned so they "convey game status or player actions". Early versions worked within 64 KB of audio RAM. https://www.icy-veins.com/ffxiv/news/hear-feel-think-what-eorzea-immersion-sounds-like/ ; https://www.well-played.com.au/final-fantasy-xiv-sound-design-dev-diary/
- **Apply.** Give each combo step its own pitch: step 1, then step 2 a 4th higher, then the finisher an octave higher plus a low thump. That way the player *hears* their combo progress.

---

## Part 2: Pokemon (Game Boy to DS; Junichi Masuda and Go Ichinose)

### F8. The hardware and the tool
- **Technique.** The Game Boy has 2 pulse channels (12.5/25/50/75% duty), 1 4-bit wave channel and 1 noise channel. Masuda wrote his own "Sound Driver" to play music and SFX, and the cries were made with the same driver. He said the cries 「普通のPSG(音源)の使い方をしていない」 ("don't use the PSG in the normal way"). High pitches were used more because low notes didn't come through the handheld's speaker.
- **Sources.** https://www.theringer.com/2018/08/27/video-games/pokemon-junichi-masuda-20-year-anniversary ; https://bulbapedia.bulbagarden.net/wiki/Junichi_Masuda ; https://www.2083.jp/contents/201410gamefreak/page_01.html ; https://bulbapedia.bulbagarden.net/wiki/GB_Sounds
- **Apply.** Keep melodies in roughly 500-2500 Hz (B4-D7) so they cut through laptop and phone speakers. Bass belongs to the "wave" voice (a soft triangle) and should never carry the hook.

### F9. Tempos and duty choices in the actual data (pret disassemblies)
| Track | Tempo value | ~BPM | Lead duty |
|---|---|---|---|
| Pallet Town (RBY) | 160 | 119 | 50% |
| Pokemon Center (RBY) | 144 | 133 | 75% (= 25%) |
| Wild battle (RBY) and Johto wild battle (GSC) | 104 | 184 | 75% (= 25%) |
| Route 29 (GSC) | 146 | 131 | n/a |
| New Bark Town (GSC) | 187 | ~102 | n/a |
| Heal jingle (RBY and GSC, same data) | 144 | 133 | 50% |

- **Pattern.** Towns sit at about 100-135 BPM, and battles at about 180+. Calm music uses 50% duty (round and mellow). Battle uses 25% (thinner and nasal, so it reads as "tense"). Jingles use 50% plus vibrato on the harmony voice. The heal jingle's lead runs a pitch offset of 1 against the second pulse, a tiny detune that sounds like chorus.
- **Sources.** https://github.com/pret/pokered (audio/music/*.asm) ; https://github.com/pret/pokecrystal (audio/music/*.asm)
- **Apply.** Town at 112-128 BPM with a 50% lead. Field at 132-144 BPM. Battle at 168-184 BPM with a 25% lead. In two-pulse jingles, detune the second pulse by +4 to +8 cents.

### F10. The battle intro riff formula
- **Technique.** The RBY and GSC wild battle intros open with a fast run of 16th notes at 184 BPM (about 82 ms each). They zigzag chromatically, falling 3 semitones and stepping back up 1 in groups of 4, before the main loop hits. This is an alarm ("something jumped out!") that resolves into a driving loop.
- **Numbers.** About 1.5-3 s of intro. 16ths. Chromatic or semitone motion. Loud and thin (25%).
- **Source.** https://github.com/pret/pokered/blob/master/audio/music/wildbattle.asm
- **Apply.** Every battle or boss intro gets a 1-2 bar "alarm" made of fast 16ths in a *different* shape from Pokemon's. Ideas: a *rising* whole-tone zigzag, or octave-jumping repeated notes. It should end on a hit on beat 1 of the loop.

### F11. The heal jingle: a fanfare that leaps up to the high tonic
- **Technique.** At 133 BPM, about 2.3 s long. The melody is three repeated notes on scale degree 5 (two quarters, then an eighth), a short step down to degree 3, and then a *leap up a minor 6th* to the high tonic, held for a half note. The bass (wave channel) taps the tonic with rests between taps (staccato), then the 3rd, and back to the tonic. A third voice plays slow pitch slides (portamento) between 5 and 1 under the melody.
- **Why it works.** The repeated notes are "knock knock knock". The leap *up* to the tonic says "restored, complete". The slides add a soft "magic" shimmer.
- **Source.** https://github.com/pret/pokered/blob/master/audio/music/pkmnhealed.asm
- **Apply.** Rules: build up to an upward leap of a 6th or an octave landing on the tonic, and make the last note at least 3x longer than the others. Don't reuse the 5-5-5-3-8 shape itself.

### F12. The level-up jingle: the "flat-seven to one" cadence
- **Technique.** About 2.2 s long; 16th = 100 ms. The structure:
  1. The tonic (400 ms).
  2. A quick triplet bouncing 5-1-5 in the low register (133 ms each).
  3. Three notes on the flat-7 chord, with a chromatic step from b7 up to the leading tone 7 (200 ms each).
  4. The tonic held for 800 ms.

  Harmony: the 2nd pulse holds the 3rd, then moves up a half step to the 4th (part of the bVII chord), then falls back to the 3rd. The wave voice plays chord tones as staccato (note + rest) blips.
- **Why it works.** The bVII-I move ("Mixolydian cadence") is triumphant but folky, and less stiff than V-I. The triplet then straight-eighth rhythm feels like a fanfare speeding up and then landing.
- **Source.** https://github.com/pret/pokered/blob/master/audio/sfx/level_up.asm
- **Apply.** Use bVII-I (or bVI-bVII-I) for level up and job advance. Make the rhythm go triplets → eighths → one long held note. 1.5-2.5 s total.

### F13. Item get: repeated triplet, then an upward leap
- **Technique.** About 1.2 s long. Three repeated triplet notes (133 ms each) on the 3rd, then a leap up a minor 6th to the tonic (800 ms, with vibrato). The harmony voice does the same on the tonic, leaping a 5th. The wave voice taps the 5th three times.
- **Source.** https://github.com/pret/pokered/blob/master/audio/sfx/get_item1_1.asm
- **Apply.** "Small reward" = under 1.2 s, 3-4 notes, ending with an upward leap of a 5th or 6th. "Big reward" = 2-3 s with a cadence (F12).

### F14. Menu "press A" blip: a perfect fourth, about 1 frame per note
- **Technique.** One 50% pulse alternates between about 2048 Hz and about 2731 Hz (exactly a perfect 4th, a 4:3 ratio). That's about 1 frame per note for 3 frames, then a 13-frame tail on the upper note with a fast decay, at volume 9-10 of 15. So the blip is about 270 ms total, but the loud part is only about 50 ms.
- **Start menu.** Pure noise: a 1-frame click followed by an 8-frame tail.
- **Sources.** https://github.com/pret/pokered/blob/master/audio/sfx/press_ab_1.asm ; https://github.com/pret/pokered/blob/master/audio/sfx/start_menu_1.asm
- **Apply.** UI blips should be *high* (1.3-3 kHz), *tiny* (20-60 ms of body), and built on consonant intervals (4ths and 5ths). A frame-rate trill (alternating every 16 ms) makes a sparkly "chirp" with no extra layers.

### F15. Hit sounds: "super effective" vs "not very effective"
- **Technique.** Both are noise only.
  - Normal damage: 3 noise notes over about 19 frames (about 320 ms).
  - Super effective: 2 notes at *full volume* with a fast decay (4 + 15 frames). Short, hard and bright.
  - Not very effective: 4 notes over about 30 frames. The first one *starts soft and swells* (volume 8, rising), then dull, fading crunches. Longer, softer and muffled.
- **Why it works.** Strength = loudness and a sharp attack. Weakness = a soft attack and a longer, duller tail. You can tell them apart with your eyes closed.
- **Sources.** https://github.com/pret/pokered/blob/master/audio/sfx/super_effective.asm ; https://github.com/pret/pokered/blob/master/audio/sfx/not_very_effective.asm ; https://github.com/pret/pokered/blob/master/audio/sfx/damage.asm
- **Apply.** Crit or weakness hit: the attack peak in 0-2 ms, plus a bright noise burst with a highpass around 2 kHz. Resisted hit: a 15-25 ms soft attack, lowpass around 800 Hz, and a 1.5x longer tail.

### F16. Cries: a few base sounds, reused through pitch and length
- **Technique.** Pokemon Red's 151+ cries come from **38 base cries**. Each Pokemon stores just three bytes: the base cry, a pitch offset, and a length scale. A base cry is 3 short segments played on both pulse channels (about 1 semitone apart, so they beat) plus noise. The contour is low → leap up about an octave → slight fall. The duty cycle *rotates every frame* (pattern 3, 3, 1, 1), which gives the buzzy, throaty growl.
- **Sources.** https://github.com/pret/pokered/blob/master/data/pokemon/cries.asm ; https://github.com/pret/pokered/blob/master/audio/sfx/cry00_1.asm
- **Apply.** Build about 8 base "monster voices" (3 segments each). Give each monster a pitch offset (±12 semitones) and a length (0.6-1.6x). Cycle the duty every 16 ms for creatures and keep a fixed duty for cute ones.

### F17. Pokemon's composers and motifs
- **Technique.** Masuda was the sole composer for Red and Green, and did programming, music and SFX. Go Ichinose joined for Gold and Silver and co-composed with Masuda (New Bark Town, arrangements of the Gym Leader and "Tense" battles). Later games keep quoting the Gen 1 motifs.
- **Sources.** https://bulbapedia.bulbagarden.net/wiki/Go_Ichinose ; https://gameinformer.com/b/features/archive/2014/05/13/pokemon%27s-music-master-the-man-behind-the-catchiest-songs ; an academic analysis of the Pokemon Center theme's "nostalgic potential": https://pure.royalholloway.ac.uk/en/publications/on-the-trail-of-a-nostalgic-adventure-identifying-and-analyzing-t
- **Apply.** Same as F4: one motif, many quotes.

---

## Part 3: Other Japanese games

### F18. Dragon Quest (Koichi Sugiyama): real counterpoint, few voices, jingles as punctuation
- **Technique.** Sugiyama refused to write "子供騙し" (dumbed-down music for children) and used real classical counterpoint. The DQ3 field theme is 4/4 at 123 BPM: a 9-bar intro, an 8-bar A and a 10-bar B. It opens on a single unaccompanied E4 like a 「号砲」 ("starting gun"). *(fan claim)* On the Famicom he wrote mostly in 2 voices, so a sound effect could take a channel without breaking the music. *(fan claim)* In DQ1's cave, each deeper floor plays the theme lower and changes the tempo. DQ jingles are tiny: "Level Up" is listed at about 5 s on the DQ VIII OST.
- **Sources.** https://note.com/fancy_seal8241/n/n0007fff1b918 ; https://togetter.com/li/1785799 ; https://dragonquest.fandom.com/wiki/Dragon_Quest_VIII_Original_Soundtrack ; https://en.wikipedia.org/wiki/Koichi_Sugiyama
- **Apply.** (a) Write each loop in **2 real voices** (melody plus a moving bass line) and keep voice 3 free, so SFX never mask the tune. (b) In dungeons or deeper map tiers, drop the key a step per tier. Boss phases go the other way: *up* a step. (c) Start a jingle with one bare note before the chord, like the "starting gun".

### F19. Kirby (Jun Ishikawa, Hirokazu Ando): surprise that still fits the character
- **Technique.** Ando: "we needed to come up with surprising sounds that would surpass players' expectations", but "It's our job to find just the right surprise": novelty that clearly belongs to Kirby. Ishikawa made SFX by trial and error, even recording drink bottles and cans.
- **Sources.** https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-Kirby-s-Epic-Yarn/Iwata-Asks-Kirby-s-Epic-Yarn/4-Surprise-Fun-and-Warmth/4-Surprise-Fun-and-Warmth-207100.html ; https://en.wikipedia.org/wiki/Jun_Ishikawa_(composer)
- *(observed)* Kirby SFX are very short, bright, and use upward pitch sweeps (inhale, star spit, 1-up). Pickups play quick ascending major arpeggios, and damage plays a falling "boing".
- **Apply.** Cute = upward sweeps, major arpeggios, high registers and a tiny length. Give pickups rising pitch, and make "ouch" sounds fall but stay bouncy (a pitch drop of about 5-7 semitones over 120 ms, not a harsh crunch).

### F20. MOTHER / EarthBound (Keiichi Suzuki, Hip Tanaka): match the game, dare to be odd
- **Technique.** Tanaka started out building arcade SFX circuits (Donkey Kong's "boom-boom", Mario's walk and jump). His core rule is music that "matches the game". He avoided singable melodies where they didn't fit, and he tried to sound unlike Dragon Quest and Final Fantasy. Suzuki wrote the melodies and Tanaka put them on the chip.
- **Sources.** https://nintendoeverything.com/hirokazu-tanaka-talks-earthbound-creatures-company-starting-with-nintendo-more/ ; https://mother4ever.net/mother2-interviews/
- **Apply.** Weird, characterful SFX (a detuned wobble, a pitch-bent blip) are allowed for silly NPCs and items, as long as they are short and their meaning is clear.

### F21. Animal Crossing (Kazumi Totaka; CEDEC 2020 talk): space, sharpness and calm
- **Technique.** The New Horizons sound team's three SE keywords were **スキマ** (gaps/space), **キレ** (crisp attack) and **実存感** (physical presence). They "organize sound" in advance so BGM and SE never saturate or cancel each other. The confirm sound was reworked: the old delay was removed, the pitch was raised to feel lighter, and everything except the peak was trimmed: 「ピークを見極め、それ以外を削ぎ落とし、よりシャープにする」 ("find the peak, cut the rest, make it sharper"). UI sounds are deliberately placed *in front*, as "outside the game world". Synth tones are used for functional sounds, and unreal "whooshes" (falling fruit) add play satisfaction. In rain, the BGM loses its highs so raindrops show through. In snow, there are no footsteps and less reverb. BGM arrangements were thinned (fewer piano and bass notes, simpler drums, ornaments erased) so they don't dictate emotion. Distance blur: a dip of about 2 kHz plus a low-shelf cut around 300 Hz on distant sounds.
- **Hourly music.** A different BGM for each of the 24 hours. This has been in every game, and NH adds weather variants.
- **Sources.** https://www.famitsu.com/news/202009/08205356.html ; https://news.denfaminicogamer.jp/kikakuthetower/200906b ; https://animalcrossingworld.com/2025/11/animal-crossing-new-leaf-music-arrives-on-nintendo-music-with-perfect-hourly-sync-feature/
- **Apply.** (a) UI sounds: one transient with no tail, a little higher than you think. (b) Town music should leave "holes" (rests in the melody every 2 bars) where NPC blips and footsteps live. (c) Town BGM can change by time of day: a morning, day, evening and night variant of the same tune (instrument, tempo -8%, a softer duty at night).

### F22. Animalese: per-letter syllables, pitch by personality and mood
- **Technique.** Each letter (or each kana in Japanese) is matched to a basic syllable sound and played very fast. Scrolling faster also raises the pitch. Pitch depends on role, *mood* (happy is higher, sad or angry is lower), personality (peppy and jock are high, snooty lower, smug below lazy, cranky deepest) and in later games body size (mouse > goat > elephant). Numbers and catchphrases come out more clearly. Wild World instead mapped letters to random syllables, which shows the "real" mapping isn't essential to the charm.
- **Sources.** https://nookipedia.com/wiki/Animalese ; https://cdn.jsdelivr.net/npm/animalese-tts@1.1.3/readme.md
- **Apply.** See the voice-blip design in Part 4, G5.

### F23. Undertale-style text blips (Japanese-RPG influenced)
- **Technique.** One short sound per printed character, with a different timbre per speaker. Spaces and punctuation are skipped. Common engines also enforce a minimum gap between blips and let a new blip cut off the old one.
- **Sources.** https://www.construct.net/en/forum/construct-3/how-do-i-8/talking-sound-effect-149909 ; https://docs.febucci.com/text-animator-unity/typewriter/play-sounds-when-a-letter-is-shown
- **Apply.** Merged into G5.

### F24. MapleStory (Wizet and Nexon; Korean): the cozy town-loop style our game evokes
- **Technique.** The soundtrack was mostly written in-house at Wizet, with soundTeMP doing some areas (New Leaf City, Masteria). Henesys is described as cheerful, capturing "the anticipation of adventure". *(observed)* Every map has its own long loop (about 1-3 min) with an acoustic or orchestral MIDI feel, friendly major keys, and a clear melody over light rhythm. Towns are calm and fields more driving. Each region has its own instrument color.
- **Sources.** https://mmos.com/music/maplestory-soundtrack ; https://meowdb.com/msclassic/music ; https://dynamedion.com/news/maplestory-with-orchestra-recordings-by-dynamedion/
- **Apply.** Give each region a fixed "instrument color": a lead duty, a wave shape, and a drum kit. A player should know the map with their eyes closed.

---

## Part 4: Guidance for Tengu

### G1. Rules for jingles (level up, quest complete, item get, job advance, heal)
1. **Length.** Tiny reward: 0.4-1.2 s. Normal reward: 1.5-2.5 s. Ceremony (job advance, boss cleared): 3-5 s. Nothing over 5 s.
2. **Key.** Major. Write it in the key of the current BGM (or its dominant), then resume the BGM (FFXIV ducks; Pokemon pauses and resumes).
3. **Shape.** Build-up (repeated notes or a quick arpeggio) → landing. The landing note is the tonic (or the 5th on top of a tonic chord), is at least 3x the length of any other note, and has vibrato (5-6 Hz, ±15-25 cents) starting 120 ms in.
4. **Rhythm.** Speed into the landing: triplets → 8ths → a long note (F12), or 16th pickups → a long note (F13).
5. **Intervals.** End with an *upward* leap of a 4th, 5th, 6th or octave into the last note (F11, F13). Cadences: bVII-I (level up), IV-V-I (quest), I-IV-I "amen" (heal or rest). Sparkle with an added 6th or 9th on the final chord.
6. **Voices.** Lead pulse (50% for warm, 25% for bright) + a second pulse a 3rd or 6th below (detuned 4-8 cents) + a wave/triangle bass tapping staccato chord tones.
7. **Mix.** Duck BGM by 8-10 dB while the jingle plays (F6). Never stack two jingles: queue them.
8. **Originality.** Never reuse a known contour (5-5-5-3-8, 1-5-1-5-b7-b7-7-1, 3-3-3-8, or the FF victory triplets). Use the rules, not the notes.

### G2. Rules for UI sounds
| Event | Pitch | Interval | Body length | Duty / wave |
|---|---|---|---|---|
| Cursor move | about 1.3-1.8 kHz | single note | 15-30 ms | 12.5% |
| Confirm | about 1.5-2.7 kHz | rising 4th or 5th, 2 notes | 20 + 50 ms | 50% |
| Cancel / back | about 0.9-1.3 kHz | falling 4th, 2 notes | 30 + 50 ms | 50%, -3 dB |
| Error / can't | about 220-300 Hz | same note twice, detuned | 2 x 60 ms, 40 ms gap | 50% + square |
| Open window | about 1-2 kHz | rising major triad, 3 notes | 3 x 25 ms | 25% |
| Close window | same | falling triad | 3 x 20 ms | 25% |
| Tab or page | noise above 4 kHz + blip | blip | 10 + 20 ms | noise + 12.5% |

- Peak at 0-2 ms, then an exponential decay with no reverb tail, or reverb under 5% (F21 キレ).
- UI sounds sit "in front": dry, centered, and on their own bus that is never ducked (F6, F21).
- Repeated cursor moves: alternate ±1 semitone, or randomize ±10 cents, so scrolling doesn't sound like a machine gun. Cap them at one per 40 ms.

### G3. Making hits and skills feel satisfying (Japanese style)
1. **Sound on contact, not on press** (matches our combat rules). The press only makes a tiny "wind-up" tick if anything.
2. **Three layers per hit, each with its own job.** A transient click (noise, 5-10 ms, highpass 3 kHz), a tonal "body" (pulse or sine pitch drop, 40-120 ms) and, for heavy hits only, a low thump (a sine dropping from 120 to 50 Hz over 150 ms).
3. **Combo steps rise.** Step 1 at the base pitch, step 2 +5 semitones, step 3 +7. The finisher is +12, plus the thump and a longer noise tail (F7). The player hears their progress.
4. **Strong vs weak (F15).** Crit or weakness = louder, sharper and brighter. Resisted = a soft attack, lowpassed and longer.
5. **Magic adds a pitched sparkle tail** (an arpeggio of 3-4 notes at 30 ms each, in the BGM's key) after the impact. Fire leans on noise, ice on a high 12.5% pulse, holy on a major-7th chord bell.
6. **Proc or "ready" ding.** One bell-like note (two sines a 5th apart, 2 ms attack, 350 ms decay) at about 1.5-2 kHz, always at the same pitch, so it becomes a learned cue.
7. **Ultimate or "limit" skill.** A riser of 0.6-1.2 s (noise plus a pulse sweeping up 1-2 octaves), 50-80 ms of silence (the "gap"), then the biggest hit in the game with a sub thump. Duck the music 12 dB for 300 ms.
8. **Hit-stop sync.** During hit-stop, hold the body layer's pitch, then release the decay when time resumes, so the freeze sounds intentional.

### G4. Phase-changing boss music (Dancing Green plan)
- **Clock.** One master beat clock drives music *and* boss attacks (F3). Telegraphs start on beat 1 and hit on the beat (for example 4 or 8 beats later).
- **Tempo.** About 116 BPM, four-on-the-floor disco. Kick on every beat, open hi-hat on the off-beats, and an octave-jumping 8th-note bass (a 25% pulse or triangle). Clap on 2 and 4.
- **Sections (F2).**
  - P1 "Intro and groove" (100-75% HP): drums + bass + a 2-bar chord stab.
  - P2 (75-50%): add the lead hook (2 pulses a 3rd apart) and a counter-melody.
  - P3 "Let's Dance" (50-25%): call-and-response. The boss "calls" a 1-bar pattern of blips (each blip = a direction, left low and right high), and the player answers by dodging on the next bar. Keep it at 4 counts per bar, and keep it easier than you think (F3: FFXIV toned theirs down).
  - Enrage (under 25%): **key up 2 semitones** and **tempo +8 to 12 BPM** ("Hi-NRG"), with 16th-note hats.
- **Transitions.** A phase change is requested on HP, but *executed* at the end of the current section's 1-bar glue fill (F1, F2). One exception: the enrage cuts in on the next downbeat with a cymbal hit plus a riser, the "here's the battle!" moment.
- **Motif.** The bass riff in P1 is the Tengu motif (F4) in disco rhythm. The victory sting quotes it in major.
- **End.** On defeat, finish with the outro tag on the next beat, then the victory jingle (spec 13).

### G5. Voice blips for NPC dialogue ("animalese-like", synthesized)
1. **Trigger.** One blip per printed letter. Skip spaces. Punctuation adds a pause: `,` 120 ms, `.` `!` `?` 250 ms. Cap at one blip per 45 ms, and play one blip per 2 letters at fast text speed (F23).
2. **Syllable.** A blip is a 35-60 ms tone with a 2 ms attack and a 25 ms decay, run through one bandpass "formant" chosen by vowel group. Vowels a/o: center about 800 Hz, Q 4. e/i: about 2000 Hz, Q 5. u: about 500 Hz, Q 4. Consonants: add a 5 ms noise click (s/t/k/p) or nothing (m/n/l). Same letter = same sound, so names and catchphrases become recognizable (F22).
3. **Pitch.** Each NPC has a base note: small or cute C6-E6, normal G5, big or gruff C5-E5, the boss lower and with a 25% duty growl. Each blip picks from a 3-note pentatonic set around the base (for example base, +2 and +4 semitones), plus ±15 cents of random jitter. A `?` bends the last 3 blips up 4 semitones, and a `!` raises volume 3 dB and pitch 2 semitones.
4. **Mood (F22).** Happy +2 semitones and 10% faster. Sad -3 semitones and 15% slower. Angry -2 semitones, a 12.5% duty rasp and a louder volume.
5. **Timbre per personality.** Sweet = triangle. Peppy = 50% pulse. Grumpy = 25% pulse with the duty flipping every blip (the cry trick, F16). Robot = square with no jitter.
6. **Mix.** On the UI bus, -12 dB below confirm sounds, with no reverb. Duck the BGM melody by 2-3 dB while text is printing, and leave the town music's "holes" (F21).

---

## Part 5: Original sound specifications

These are written for this game and follow the formulas above, not anyone's melody. Lengths are in ms. "P1"/"P2" = pulse voices, "W" = wave/triangle bass, "N" = noise. "vib" = vibrato 5.5 Hz ±20 cents starting 120 ms in. Default: P1 50%, P2 50% detuned +6 cents and 4 dB under P1.

1. **Level Up** (G major, bVII-I, about 1.45 s). P1 (25%): G4 70, B4 70, D5 70, G5 210, F5 105, A5 105, C6 105, D6 700 vib. P2: D4 210, B4 210, C5 315 (on the F-A-C), B5 700. W: G2 70 r70 G2 70 r70 G2 70 r70, F2 105 r105 F2 105, G2 700.
2. **Quest Complete** (C major, I-vi-IV-V-I, about 1.9 s). P1: E5 120, G5 120, C6 120, B5 120, A5 120, F5 120, D5 120, G5 120, C6 960 vib. P2: C5 240, A4 240, F4 240, D5 240 (over G), E5 960. W: C3 240, A2 240, F2 240, G2 240, C3 480 r480.
3. **Item Get** (A major, about 0.6 s). P1 (12.5%): A5 50, C#6 50, E6 50, A6 350 vib. P2: E5 150, C#6 350. N: one 10 ms highpassed tick at the start of A6.
4. **Rare Item** (C major, about 1.4 s). P1: C5 60, E5 60, G5 60, C6 60, r60, D6 90, E6 90, G6 600 vib. P1 echo: the same line delayed 120 ms at -10 dB. W: C3 240, G2 240, C3 600.
5. **Job Advancement** (F major, I | IV V | I add9, about 3.4 s, ceremonial). P1: C5 250, F5 250, A5 375, G5 125 | Bb5 250, D6 250, C6 500 | r100 | F6 1300 vib. P2: A4 500, C5 500 | D5 500 (over Bb), E5 500 (over C) | r100 | A5 and G5 alternating every 33 ms (a frame trill) for 1300. W: F2 1000 | Bb2 500, C3 500 | r100 | F2 1300. N: a crash (noise, 400 ms decay) on F6.
6. **Heal** (C major, added-6th, about 0.75 s, soft). P1 (50%, -3 dB): G4 90, C5 90, E5 90, A5 480 vib, with a gentle +10 cent rise. P2 (triangle): E5 270, C6 480. No bass.
7. **Rest / Full Recovery** (F major, I-IV-I "amen", about 2.2 s, lullaby). Triangle lead: A5 300, Bb5 600, A5 1300. P2 (50%, soft): F5 300, D5 600 (over Bb), C5 1300. W: F2 300, Bb2 600, F2 1300.
8. **Quest Accepted** (about 0.4 s). P1 (25%): D6 70, G6 260 (rising 4th). W: G3 260.
9. **Meso / Coin Pickup** (about 0.15 s). P1 (12.5%): A6 35, F#7 100 (rising major 6th, fast decay). Pickups less than 300 ms apart step the pair up a semitone each time, resetting after 6.
10. **Cursor / Confirm / Cancel set.** Cursor: P1 12.5% A6 22 ms. Confirm: P1 50% E6 20, B6 55 (rising 5th). Cancel: P1 50% A5 30, E5 50 (falling 4th), -3 dB. Error: square C#4 60, r40, C#4 60, plus a second square at +30 cents (it beats against the first).
11. **Window Open / Close.** Open: P1 25% D6 25, F#6 25, A6 40. Close: A6 20, F#6 20, D6 30.
12. **Skill Ready "ding".** Sine D7 plus sine A7 at -6 dB, 2 ms attack, 350 ms decay. Always the same pitch.
13. **Boss Defeated** (D major, bVI-bVII-I, about 3 s). P1: A5 125, D6 125, F#6 250, r125, Bb5 250, C6 250, D6 1500 vib. P2: F#5 500, r125, F5 250, G5 250, A5 1500. W: D3 500, r125, Bb2 250, C3 250, D3 750 r750. N: a crash on the final D6.
14. **Fainted / Defeat** (D minor, about 1.9 s, never harsh). Triangle: A5 220, F5 220, D5 220, C#5 400, D5 800 (a falling triad, a sad leading tone, then a gentle rest on the tonic). P2 (50%, -8 dB): F4 660, E4 400, F4 800.
15. **Boss Phase Shift sting** (about 1.3 s, ends on a downbeat). N: a 900 ms riser (lowpass sweeping 400 Hz to 8 kHz). P1 25%, in the last 520 ms of the riser: a zigzag rising by whole tones, C5 D5 C5 E5 D5 F#5 E5 G#5 (8 x 65 ms, i.e. 32nd notes at 116 BPM). Then r60 (the gap), then a hit: P1 and P2 in octaves C6/C5 for 200, plus kick and crash.
16. **NPC "Hm?" Emote blip** (about 0.2 s). P1 at the NPC's base note: base 60, then base +4 semitones for 140, bending up a further 2 semitones (a question shape).
17. **Save Point Chime** (about 0.9 s). Sine bell: E6 150, B6 150, G#6 600 (up a 5th, down a 3rd; a "bell tower" figure). Each note has a 2 ms attack and a 500 ms decay, and they overlap.

(Seventeen specs. Before shipping, check each against known jingles by ear. If any phrase recalls a famous tune, change its contour.)

---

## References

FFXIV and Soken
- CEDEC 2012, FFXIV sound tech (Dynamix End, ducking, compressor, stringendo): https://www.gamebusiness.jp/article/2012/08/21/6655.html
- CEDEC 2013, ARR sound design (beat-aligned overlaps, priority layering): https://www.famitsu.com/news/201308/24038800.html
- CEDEC 2014, ARR ambience: https://www.gamebusiness.jp/article/2014/09/09/10082.html
- Soken on FFXVI battle music sections and ducking (Denfaminico): https://news.denfaminicogamer.jp/interview/230522w/2
- Arcadion Cruiserweight developer interview (Famitsu, 2025-07-16): https://www.famitsu.com/article/202507/47282
- M5 / Dancing Green mechanics and disco references: https://ffxiv.consolegameswiki.com/wiki/M5
- "Ride the Rhythm" lyrics: https://finalweapon.net/2025/07/16/final-fantasy-xiv-official-ride-the-rhythm-lyrics/
- FFXIV sound team on mixing and quoting melodies (GameBusiness 2021): https://www.gamebusiness.jp/article/2021/10/04/19129.html
- Soken, RPGFan 2013 (Titan dynamic music): https://classic.rpgfan.com/features/Music_of_the_Year_2013/Masayoshi_Soken_Interview.html
- Soken, VGMonline Heavensward: https://vgmonline.net/masayoshisoken2/
- Soken, TechRadar 2025: https://www.techradar.com/gaming/final-fantasy-14-composer-masayoshi-soken-interview-april-2025
- 4Gamer live report (Shiva second half track): https://www.4gamer.net/games/199/G019924/20150827047/
- Icy Veins on the FFXIV sound team: https://www.icy-veins.com/ffxiv/news/hear-feel-think-what-eorzea-immersion-sounds-like/
- Well Played dev diary: https://www.well-played.com.au/final-fantasy-xiv-sound-design-dev-diary/

Pokemon
- pret/pokered disassembly (music, sfx, cries): https://github.com/pret/pokered
- pret/pokecrystal disassembly: https://github.com/pret/pokecrystal
- The Ringer, Masuda 20th anniversary: https://www.theringer.com/2018/08/27/video-games/pokemon-junichi-masuda-20-year-anniversary
- Game Freak interview (2083.jp, Japanese): https://www.2083.jp/contents/201410gamefreak/page_01.html
- Bulbapedia, Junichi Masuda: https://bulbapedia.bulbagarden.net/wiki/Junichi_Masuda
- Bulbapedia, Go Ichinose: https://bulbapedia.bulbagarden.net/wiki/Go_Ichinose
- Bulbapedia, GB Sounds: https://bulbapedia.bulbagarden.net/wiki/GB_Sounds
- Game Informer on Masuda: https://gameinformer.com/b/features/archive/2014/05/13/pokemon%27s-music-master-the-man-behind-the-catchiest-songs
- Pokemon Center theme analysis (JSMG): https://pure.royalholloway.ac.uk/en/publications/on-the-trail-of-a-nostalgic-adventure-identifying-and-analyzing-t

Dragon Quest, Kirby, MOTHER
- DQ3 field theme analysis (note.com, Japanese): https://note.com/fancy_seal8241/n/n0007fff1b918
- Sugiyama two-voice writing and DQ1 cave (Togetter, fan posts): https://togetter.com/li/1785799
- DQ VIII OST track list: https://dragonquest.fandom.com/wiki/Dragon_Quest_VIII_Original_Soundtrack
- Koichi Sugiyama: https://en.wikipedia.org/wiki/Koichi_Sugiyama
- Iwata Asks, Kirby's Epic Yarn (Ando): https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-Kirby-s-Epic-Yarn/Iwata-Asks-Kirby-s-Epic-Yarn/4-Surprise-Fun-and-Warmth/4-Surprise-Fun-and-Warmth-207100.html
- Jun Ishikawa: https://en.wikipedia.org/wiki/Jun_Ishikawa_(composer)
- Hip Tanaka interview: https://nintendoeverything.com/hirokazu-tanaka-talks-earthbound-creatures-company-starting-with-nintendo-more/
- MOTHER 2 interviews archive: https://mother4ever.net/mother2-interviews/

Animal Crossing, Undertale, MapleStory
- CEDEC 2020 NH sound talk (Famitsu): https://www.famitsu.com/news/202009/08205356.html
- CEDEC 2020 NH sound talk (Denfaminico): https://news.denfaminicogamer.jp/kikakuthetower/200906b
- Nookipedia, Animalese: https://nookipedia.com/wiki/Animalese
- animalese-tts readme: https://cdn.jsdelivr.net/npm/animalese-tts@1.1.3/readme.md
- Hourly music on Nintendo Music: https://animalcrossingworld.com/2025/11/animal-crossing-new-leaf-music-arrives-on-nintendo-music-with-perfect-hourly-sync-feature/
- Per-letter text sound (Construct forum): https://www.construct.net/en/forum/construct-3/how-do-i-8/talking-sound-effect-149909
- Per-letter sound throttling (Febucci docs): https://docs.febucci.com/text-animator-unity/typewriter/play-sounds-when-a-letter-is-shown
- MapleStory soundtrack overview: https://mmos.com/music/maplestory-soundtrack
- MapleStory Classic music DB: https://meowdb.com/msclassic/music
- Dynamedion MapleStory orchestra: https://dynamedion.com/news/maplestory-with-orchestra-recordings-by-dynamedion/

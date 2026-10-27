# Sound effects research: retro synthesis, recipes, and combat feel

Research for remaking every Tengu sound effect. All sound stays synthesized in code (Web Audio, no
files, no build step). The player called the current sounds "so bad" and asked us to study chiptune
("bit tone") sound effects first.

**How this was gathered (October 2026).** I downloaded and read the real source of jsfxr
(`sfxr.js`), ZzFX (`ZzFX.js` plus its designer's preset code), and bfxr2 (`Bfxr_DSP.js`,
`Whooshr`, `Pluckr`). All numbers in sections A and B come from that code. Where I turned slider
values into Hz or seconds, I did the math myself from the code, and those values are marked
"(derived)". Sections C and D use web articles, docs, and specs. Some topics had no solid public
source (for example, how MapleStory's own sound effects were made). Advice on those is marked
**[our call]** so nobody mistakes it for a quoted fact.

**Diagnosis of the current engine** (from reading `src/audio/engine.js` and `sfx.js`):
- Every sound goes through a **1.8 s convolver reverb** with 0.32 wet, plus a master compressor at
  −16 dB threshold and 4:1 ratio. That smears every hit into mush and squashes the transients that
  make hits feel snappy. Sources below say to keep game tails short (finding 13).
- Oscillators are built live with plain exponential fades. There is no punch, no fast pitch drop on
  the body, and no oversampled pulse waves with duty control, so sounds come out "beepy" instead of
  "chippy".
- The "bells" use partials at 1, 2.76 and 5.4 times the base pitch. At a high base pitch that puts a
  lot of energy at 3 to 6 kHz, where the ear is most sensitive (finding 15), so they sound shrill.

---

## A. How the classic generators work

### 1. sfxr / jsfxr: the reference synthesis model
- **Technique.** One oscillator → volume envelope → resonant low-pass → high-pass → flanger. It
  runs at **8× oversampling** (each output sample is the box-average of 8 sub-samples), which is a
  cheap anti-aliasing filter for square and saw waves. Output is mono at 44.1 kHz.
- **Waves.** 0 = square (amplitude ±0.5, with duty), 1 = saw, 2 = sine, 3 = noise. Noise is
  **pitched**: 32 random values are spread across one period and redrawn every period. So the
  "frequency" of noise sets how coarse or smooth it sounds, which is why sfxr explosions crunch.
- **Envelope.** Three linear stages: attack (rises 0→1), sustain, decay (falls 1→0). Each stage
  lasts `v² × 100000` samples, which is **2.268·v² seconds** (derived): 0.1 → 23 ms,
  0.2 → 91 ms, 0.3 → 204 ms, 0.4 → 363 ms, 0.5 → 567 ms.
  **Punch**: during sustain, volume = `1 + (1 − progress) × 2 × punch`. It starts at (1 + 2·punch)
  and falls linearly to 1. That gives a loud front edge without a click, and it is a big part of
  why sfxr sounds "pop".
- **Pitch.** Base frequency in Hz = **3528 × (v² + 0.001)** (derived from
  `8·44100·(v²+0.001)/100`): 0.2 → 145 Hz, 0.3 → 321, 0.4 → 568, 0.5 → 885, 0.6 → 1274,
  0.7 → 1732, 0.9 → 2861. **Slide** multiplies the *period* every sample by
  `1 − slide³·0.01`, so the pitch glides exponentially at about **636·slide³ octaves per second**
  (derived): 0.1 → 0.6 oct/s, 0.2 → 5 oct/s, 0.3 → 17 oct/s, −0.5 → −80 oct/s. **Delta slide**
  adds `−dslide³·1e-6` to that multiplier every sample, which bends the glide. **Min-frequency
  cutoff** ends the sound when a falling pitch reaches it (that is how lasers stop).
- **Vibrato.** Phase step `speed²·0.01` per sample (about **70·speed² Hz**, derived). Depth is
  ±(strength × 50 %) of the period.
- **Arpeggio (one pitch jump).** After `(1 − speed)²·20000 + 32` samples, the period is multiplied
  once: positive mod → pitch × 1/(1 − 0.9·mod²) (mod 0.4 → ×1.17, 0.5 → ×1.29, 0.6 → ×1.48);
  negative mod → pitch drops. This one jump is the classic "coin ding-ding".
- **Duty.** Square duty = **50 % − 50 % × duty** (0 → 50 %, 0.5 → 25 %, 0.75 → 12.5 %).
  Duty sweep adds `−sweep·0.00005` per sample and is clamped to 0–50 %.
- **Repeat.** Every `(1 − v)²·20000 + 32` samples, pitch, slide, duty and arpeggio reset (the
  envelope keeps going). That makes "bwip-bwip-bwip" power-ups. Repeat 0.5 → 114 ms (derived).
- **Filters.** The low-pass is a resonant 2-pole: `w = cutoff³·0.1`, damping
  `5/(1 + 20·res²)·(0.01 + w)` capped at 0.8, and the cutoff sweep multiplies w by
  `1 + ramp·1e-4` per sub-sample. The approximate corner is `352800·w/(1 − w)` Hz: cutoff 0.4 →
  2.3 kHz, 0.5 → 4.5 kHz, 0.7 → 12.5 kHz (derived). The high-pass is 1-pole with
  `w = cutoff²·0.1`: 0.1 → ~350 Hz, 0.2 → 1.4 kHz, 0.3 → 3.2 kHz. Its sweep multiplier is
  `1 + ramp·3e-4`.
- **Flanger ("phaser").** Adds a copy delayed by `offset²·1020` sub-samples (up to ~2.9 ms) from a
  1024-sample ring buffer. The offset sweeps by `ramp²` per sample.
- **Volume.** gain = e^vol − 1 (0.5 → 0.65). Optional 8-bit output quantization.
- **Source.** https://github.com/chr15m/jsfxr (`sfxr.js`). Original sfxr by DrPetter:
  https://www.drpetter.se/project_sfxr.html.
- **License.** jsfxr is under the **Unlicense** (public domain). The original sfxr is **MIT**
  ("I've put it under the MIT free software license"). We may port the algorithm freely.
- **Apply.** Use this model as the core of our renderer, but expose **physical units** (Hz,
  seconds, octaves per second) instead of 0–1 sliders. Keep punch, the one-shot arpeggio, repeat,
  duty sweep, pitched noise, and oversampling. Those are what make sounds read as "chip".

### 2. ZzFX: a tiny modern variant built for caching
- **Parameters (in order):** volume, randomness (.05), frequency Hz (220), attack, sustain,
  release (.1), shape (0 sine, 1 triangle, 2 saw, 3 tan, 4 noise, 5 square), shapeCurve (1),
  slide, deltaSlide, pitchJump Hz, pitchJumpTime, repeatTime, noise, modulation Hz, bitCrush,
  delay, sustainVolume (1), decay, tremolo, filter Hz. All times are in seconds.
- **Algorithm (from `buildSamples`).**
  - The envelope is linear attack → decay to sustainVolume → hold → linear release. Attack is
    **at least 9 samples** "to prevent pop". The designer also forces release > 0 "to prevent pop".
  - Phase accumulates `t += f + f·noise·rand` (noise = phase jitter, which roughens tones).
  - `shapeCurve` raises the wave to a power (`sign(s)·|s|^curve`). Below 1 it is squarer, above
    1 it is pointier. For shape 5 the duty is curve/2.
  - Slide adds a constant to frequency each sample, which works out to about **500 Hz per second
    per unit** (derived from `slide·500·2π/sr²`). Delta slide is likewise ~500 Hz/s² per unit.
    Unlike sfxr, the glide is *linear in Hz*.
  - pitchJump adds Hz once at pitchJumpTime. repeatTime resets frequency, slide and the jump, so
    arpeggios loop.
  - **bitCrush is a sample-and-hold**: each value is held for `bitCrush·100` samples (0.1 → 10
    samples → ~4.4 kHz effective rate). It is sample-rate reduction, not bit-depth reduction.
  - delay mixes in an echo (s/2 + delayed/2). tremolo = `1 − tr + tr·sin(2π·i/repeatTime)`.
    modulation multiplies frequency by `cos(2π·mod·t)`.
  - The filter is one RBJ biquad, Q = 2, with positive values high-pass and negative low-pass.
    Note that the code doubles the value (`w = 2π·|filter|·2/sr`), so the real corner is
    ~2× the number.
- **Caching pattern.** `ZZFXSound` renders samples once **with randomness forced to 0**. Then
  every `play()` sets `playbackRate = pitch ± pitch·randomness·rand`. This is exactly the
  "pre-render, then vary pitch on playback" design we want. The default randomness is **5 %**.
- **Sample sounds from the README** (verbatim, useful to audition in the designer):
  Drum `[,,129,.01,,.15,,,,,,,,5]`, Piano `[1.5,.8,270,,.1,,1,1.5,,,,,,,,.1,.01]`,
  Heart `[,,537,.02,.02,.22,1,1.59,-6.98,4.97]`.
- **Preset ranges** in the designer (`AddPresetSound`): Pickup freq 200–700 Hz, release
  0.05–0.3 s, pitchJump +99 to 500 Hz at 0.04–0.1 s. Jump freq 50–500 Hz, release 0.05–0.1 s.
  Hit freq 30–500 Hz, noise 0–2, bitCrush 0–0.5, release ≤ 0.2 s. Explosion freq 30–99 Hz,
  sustainVolume 0.3–0.5, release 0.2–0.6 s, bitCrush 0.1–1. Blip: attack/decay/sustain/release
  each ≤ 0.03–0.04 s.
- **Source and license.** https://github.com/KilledByAPixel/ZzFX, **MIT** (Frank Force, 2019).
  The designer app is https://killedbyapixel.github.io/ZzFX.
- **Apply.** Borrow the caching pattern, the sample-and-hold crush, and the minimum attack and
  release. We *could* vendor ZzFXMicro (about 1 KB, MIT, keep the header). But it has no punch,
  no duty sweep, only one filter, and linear-Hz slides, and our layered recipes need more.
  **[our call]**: write our own small renderer (~250 lines) and use the ZzFX designer only to
  audition ideas.

### 3. bfxr / bfxr2: the extra tools that matter
- **Additions on top of sfxr** (from `Bfxr_DSP.js`):
  - **Triangle**, **Breaker** (`|1 − 2·p²| − 1`, "a smoother, slicker triangle"), **Whistle**
    (sine plus a 20× sine at 0.25 amplitude), Tan, pink noise.
  - **Bitnoise**: a 15-bit LFSR with taps on bits 0 and 1, matching the SN76489 sound chip.
  - **Overtones**: up to 10 copies at whole-number multiples of the pitch, each copy's level
    multiplied by (1 − falloff).
  - **Compression**: `sample^(1/(1 + 4·amount))`, a power curve that "pushes amplitudes together
    … very good for sound effects where you want them to stick out against background music".
  - A **bit crush with sweep**, and **two pitch jumps** (each at an onset percentage of the sound).
- **bfxr2's Whooshr** (MIT) is a ready model for sword swings:
  - The envelope is `sin(π·u)^(0.6 + 5·focus)`, a bell that peaks mid-sound.
  - Noise is band-passed as the *difference of two one-pole low-passes*, with a cutoff of
    `(350 + 5500·(1 − size))·approach` Hz, where "approach" falls over time like a Doppler pass.
  - A sine "whistle" sits at `190·2^((1 − size)·3.1)` Hz.
  - Its **Sword Swing** recipe: duration 0.18–0.42 s, size 0.25–0.5, air 0.6–0.9, whistle
    0.25–0.55, movement 0.65–1, focus 0.5–0.85. **Heavy Swing**: 0.4–0.9 s, size 0.8–1.
- **Pluckr** is a Karplus-Strong string. Its **Kalimba** recipe (bright tine, 0.7–1.6 s) suits
  cute "plinks".
- **Sources.** https://github.com/increpare/bfxr (original, **Apache-2.0**) and
  https://github.com/increpare/bfxr2 (**MIT**, Stephen Lavelle 2021).
- **Apply.**
  - Add triangle, 1-bit LFSR noise, a 2–3 overtone option, and the power-curve "compression" per
    sound.
  - Build swings from the Whooshr model, not from a static band-pass on noise (our current swing
    sounds like a hiss because nothing moves).

### 4. ChipTone and the NES as ground truth
- **ChipTone** (SFB Games, Tom Vian) is a free sfxr-family tool (Vian also made as3sfxr, which
  bfxr built on). Its sounds are CC0, but **its code is not open**, so use it only as an ear
  reference. Source: https://sfbgames.itch.io/chiptone.
- **NES pulse channels** offer only four duty cycles: **12.5 %, 25 %, 50 %, 75 %** (75 % sounds
  the same as 25 %, just inverted). Volume has 16 steps. A hardware "sweep" moves the period by
  `period >> shift` on each half-frame clock, which is the original pitch slide. Source:
  https://www.nesdev.org/wiki/APU_Pulse.
- **NES noise** is a 15-bit LFSR. Normal mode (taps bits 0 and 1) gives 32767 steps. "Periodic"
  mode (taps bits 0 and 6) gives **93 steps**, a metallic buzz pitched near A440 (+50 cents). The
  period table runs 4 to 4068 CPU cycles. Source: https://www.nesdev.org/wiki/APU_Noise.
- **Apply.** For an authentic "bit tone", use **12.5 % and 25 % pulses** (thin, cute, plinky) for
  leads, blips and coins, and 50 % only for low or soft "boop" sounds. Use **periodic LFSR noise**
  for metallic clinks such as sword-on-armor, coins landing and the crunch inside crits.

---

## B. Preset recipes from the sources

### 5. The seven sfxr presets, exact ranges (from `sfxr.js`, converted)
`frnd(x)` means a random value from 0 to x. The converted ranges are derived.

| Preset | Wave | Pitch | Pitch motion | Envelope | Other |
|---|---|---|---|---|---|
| pickupCoin | saw | 0.4–0.9 → 568–2861 Hz | 50 %: arpeggio speed 0.5–0.7 (jump at 41–113 ms), mod 0.2–0.6 (×1.04–1.48) | A 0, S 0–23 ms, **punch 0.3–0.6**, D 23–567 ms | — |
| laserShoot | square/saw/sine | ⅓ of the time: 0.3–0.9 (321–2861 Hz) with slide −0.35 to −0.65; else 0.5–1.0 with slide −0.15 to −0.35 and a min-freq cutoff | fast fall, 2 to 175 oct/s | A 0, S 23–204 ms, D 0–363 ms, punch 0–0.3 (50 %) | duty sweep; flanger ⅓; HPF 0–3.2 kHz |
| explosion | noise | sqr(0.1–0.5) or sqr(0.2–0.9) → about 4–224 Hz or 25–2300 Hz noise pitch | slide −0.1 to +0.3 or −0.2 to −0.4 | A 0, S 23–363 ms, **punch 0.2–0.8**, D 0–567 ms | repeat ⅓ (0.3–0.8); vibrato 50 %; arpeggio ⅓; flanger 50 % |
| powerUp | square (duty 0–0.6) or saw | 0.2–0.5 → 145–885 Hz | rising slide 0.1–0.5 **with repeat** 0.4–0.8 (18–164 ms), or slide 0.05–0.25 with vibrato | A 0, S 0–363 ms, D 23–567 ms | — |
| hitHurt | square/saw/noise | 0.2–0.8 → 145–2262 Hz | slide −0.3 to −0.7 (17–218 oct/s, a "zap" drop) | A 0, S 0–23 ms, D 23–204 ms | HPF 0–3.2 kHz (50 %) |
| jump | square, duty 0–0.6 (50–20 %) | 0.3–0.6 → 321–1274 Hz | slide +0.1 to +0.3 (0.6–17 oct/s up) | A 0, S 23–363 ms, D 23–204 ms | HPF (50 %), LPF 1 − frnd(0.6) (50 %) |
| blipSelect | square (duty 0–0.6) or saw | 0.2–0.6 → 145–1274 Hz | none | A 0, S 23–91 ms, D 0–91 ms | **HPF fixed 0.1 (~350 Hz)** |

- **Apply.** These are the shapes that read instantly to players. Our recipes (table in section F)
  keep the shape: zero attack, punch, short sustain, a fast pitch drop for hits, a rising slide for
  jumps and power-ups, and a one-shot jump for coins. Then they **soften** it, as findings 14–16
  explain: triangle or thin pulse in place of saw, a low-pass on everything, and higher pitches
  with lower levels.

### 6. Text blips (Undertale / Animal Crossing / Celeste style)
- **Technique.**
  - A short blip plays as letters appear, matched to the speaker.
  - A common plugin pattern: **skip if less than 30 ms since the last blip**, skip spaces and
    invisible characters, pick a random blip from a small set, and add a small random pitch shift
    so the blips don't sound identical
    (https://winterbitestudios.itch.io/plugin-rpg-maker-mz-dialogue-bleep).
  - Animal Crossing's Animalese gives each letter a basic sound, at a pitch set by the
    character's role and personality, and it speeds up and rises in pitch when text is skipped
    (https://nookipedia.com/wiki/Animalese).
  - Celeste's dialogue: each character gets a base synth tone, with **formants** (vowel-like
    spectral peaks) to suggest speech. Emotions are sorted by pitch height, pitch movement and
    pace (Kevin Regamey, Power Up Audio;
    https://www.thegamer.com/celeste-sound-designer-reveals-how-the-games-dialogue-audio-was-created/).
- **Numbers to use.**
  - Blip of **25–45 ms** (A 1 ms, S 10 ms, D 25 ms), one per **2 visible characters**, at least
    **40 ms** apart.
  - Pitch from a speaker base, picked at random from the 5 pentatonic notes within ±3
    semitones. Questions end on a +2 semitone blip, shouts use +3 and 1.2× speed.
  - Optional "vowel" colour: a band-pass at a formant (roughly a ≈ 800 Hz, o ≈ 500 Hz,
    i ≈ 300/2300 Hz; https://en.wikipedia.org/wiki/Formant), keyed to the vowel being typed.
- **Apply.** Give every NPC a `voice` with base pitch, wave and formant, for example:
  - hero 520 Hz on a 25 % pulse
  - small animal NPCs 880–1050 Hz on triangle
  - shopkeeper 400 Hz on 50 % pulse with LPF 1.8 kHz
  - bosses 150–220 Hz on 12.5 % pulse with slight vibrato

---

## C. Game sound design principles

### 7. Layer impacts: transient + body + tail
- **Technique.** Build an impact from three parts: a sharp transient (the "hit"), a body or tonal
  layer (weight), and a low sub (punch you feel). Small timing offsets between layers change how
  big and punchy the hit seems. A whoosh is cut off just before the impact, and a pitched-down sub
  is added when the hit lacks weight (https://violetrecording.com/how-to-make-impact-sounds/;
  https://vi-control.net/community/threads/how-to-create-body-hit-sounds.144994/).
- **Numbers [our call, built from the sfxr shapes above].**
  - Transient: 3–8 ms of noise or a 1-bit click, HPF 1.5–2 kHz, LPF 7 kHz.
  - Body: 40–120 ms, a 25 % pulse or triangle at 250–600 Hz, falling 4–10 oct/s, punch 0.4–0.6.
  - Tail or sub: only on heavy blows, a sine at 80→45 Hz over 150–220 ms. For magic, a sparkle
    tail of 150–400 ms instead.
  - Start every layer within **0–5 ms** of each other (the body may come 2 ms after the
    transient).
- **Apply.**
  - Basic hits use transient + body.
  - Finishers and crits add the sub and a "ting".
  - The swing whoosh **ends** on the strike frame and the hit starts there. This matches our
    "hits land on the animation" rule in `CLAUDE.md`.

### 8. Sub-frame attack and click-free edges
- **Technique.** Hits need an attack well under one 60 fps frame (16.7 ms). sfxr uses attack 0
  plus punch; ZzFX enforces a minimum 9-sample (0.2 ms) attack to avoid a pop.
- **Numbers.** Attack **0.3–1 ms** for hits and clicks, 2–5 ms for soft UI, 10–40 ms for heals and
  pads. Always end with at least **5 ms** of fade. Remove DC offset (see finding 18).
- **Apply.** The renderer applies a 0.3 ms fade-in and a 5 ms fade-out to every buffer,
  whatever the recipe says.

### 9. Pitch randomization: small, and only where it helps
- **Technique.** Shifting each playback a little up or down "adds a very natural kind of variation
  that reduces repetitiveness", and sounds that play several times a second become "painfully
  repetitive very quickly". Rising pitch in semitone steps rewards chains and combos
  (George Prosser, https://gamedeveloper.com/audio/the-power-of-pitch-shifting). One semitone is a
  factor of 2^(1/12) ≈ 1.0595. Repetition breeds fatigue and monotony breeds boredom, but some
  sounds *need* to stay the same for "the safety of recognition"
  (https://www.asoundeffect.com/game-audio-immersion/). ZzFX's default randomness is 5 %.
- **Numbers.**
  - Footsteps ±6–8 % (about ±1 semitone) and ±2 dB.
  - Hits ±4–5 %, monster hurts ±8 %.
  - Coins ±2 % plus combo rise.
  - **UI 0 %** (menu sounds must be identical).
  - Level-up and job-up 0 %.
  - Blips: random choice among scale notes, never a continuous random pitch.
  - Combo: +1 semitone per step up to +7, reset when the combo drops.
- **Apply.** Each recipe carries a `vary` value. Use playbackRate on cached buffers, plus 2–4
  rendered variants with different noise seeds, played round-robin and never the same one twice in
  a row (https://sounddesign.irpr.agency/solutions/game-audio-repetitive/).

### 10. Voice limiting and priority
- **Technique.** Engines cap simultaneous voices per sound, per bus and globally. The
  **lowest-priority voices are dropped first**, and the global limit is a last-resort catch-all
  (Audiokinetic:
  https://blog.audiokinetic.com/how-to-get-a-hold-on-your-voices-optimizing-for-cpu-part-1/,
  https://www.audiokinetic.com/qa/1507/getting-the-voice-limit-count). Unity uses priority 0
  (high) to 255 (low) and breaks ties by volume
  (https://docs.unity3d.com/ScriptReference/AudioSource-priority.html).
- **Numbers [our call].**
  - Global cap 24 voices.
  - Per sound: hit 4, footstep 2, coin 3, blip 1 (new cuts old with a 5 ms fade), swing 3,
    explosion 2.
  - The same sound may not restart within **35 ms**. Merge the extras: a multi-target hit plays
    *once*, +2 dB per doubling of targets, up to +6 dB.
  - Priority order: player hurt / level-up > player skill hits > crits > enemy attacks > pickups >
    footsteps > ambient.
- **Apply.** A small voice manager steals the oldest voice of the lowest priority. Mobbing many
  monsters at once (a MapleStory staple) then can't stack 20 identical hits into distortion.

### 11. Ducking music under big moments
- **Technique.** Duck music under important sounds by about **6–10 dB**, with an attack of
  roughly 10–60 ms and a release of 250–500 ms. A release that is too fast makes the music audibly
  "breathe" (pump). Route through buses (Master ← Music, SFX, UI, Voice) rather than single sounds
  (https://claudeskills.info/skills/gamedev-skills/awesome-gamedev-agent-skills/audio-design/;
  https://www.capcut.com/create/audio-ducking-for-clear-dialogue-in-video). Hit-stop tools often
  duck audio during the freeze too
  (https://docs.unrealengine.com/marketplace/ja/product/cronus-hitstop).
- **Numbers [our call].** Ducking is triggered by code, not by a sidechain:
  - Heavy finisher: −4 dB, 15 ms attack, 350 ms release.
  - Boss kill and level-up: −8 dB held for the jingle, then a 600 ms release.
  - Use `setTargetAtTime` (the time constant reaches 63.2 % of the target per constant; W3C spec).
- **Apply.** Put `duck(db, holdMs)` on the music bus. Never duck for ordinary hits.

### 12. Loudness targets and relative levels
- **Technique.**
  - Sony's ASWG targets **−18 LUFS integrated (±2 LU)** for mobile and portable games and −23 for
    console, with a **−1 dBTP** peak ceiling, measured on the whole mix (Audiokinetic summary,
    https://audiokinetic.com/en/mastering-a-game-with-wwise-part1; Garry Taylor interview,
    https://designingsound.org/2012/07/30/video-games-and-loudness-standards-interview-with-sonys-garry-taylor/).
  - The IESD community document suggests −16 LUFS for mobile
    (https://www.audiogang.org/wp-content/uploads/2015/04/IESD-Mix-Ref-Levels-v03.02.pdf).
- **Numbers [our call; per-category values are not standardized].** A browser game is closer to
  "portable", so aim for **−18 LUFS** overall at the default volume, with peaks ≤ −1 dBFS.
  Relative peak levels for each voice, before the master:

  | Category | Peak dBFS | Notes |
  |---|---|---|
  | Level-up, job-up, boss kill | −8 | music ducked |
  | Crit, finisher, explosion | −9 to −10 | |
  | Player skill and basic hits | −12 | |
  | Player hurt | −12 | must cut through |
  | UI click, open, close | −14 | |
  | Coin and item pickup | −15 | |
  | Enemy attacks, enemy hurt | −16 | |
  | Swing whoosh, jump | −18 | |
  | Text blips | −20 | |
  | Footsteps | −24 to −26 | barely there |
  | Music bus | about −20 average | |
- **Apply.** Normalize every rendered buffer to a peak of 1.0, then apply the category gain from
  the table. Then the recipes can't drift apart in level as they get edited.

### 13. Short tails only; reverb as a rare garnish
- **Technique.** A game impact often fires dozens of times, so a long reverb tail becomes
  fatiguing (summary of
  https://violetrecording.com/how-to-design-weapon-sounds/ and related guides in finding 7).
  ZzFX's only "space" effect is a short self-echo (`delay`).
- **Numbers [our call].**
  - Drop the global 1.8 s reverb.
  - Optionally keep one **0.25–0.4 s** "small room" impulse at **−18 dB wet**, sent only by
    magic, holy, level-up and portal sounds.
  - Hits, steps, UI and blips stay dry.
  - For a chip-style "space", use a single 60–90 ms echo at −12 dB (one ZzFX-style delay tap),
    baked into the buffer.
- **Apply.** This is likely the single biggest audible fix: dry, short sounds read as "crisp and
  cute"; wet, long ones read as "cheap and muddy".

### 14. Cute = high, soft, round (the MapleStory direction)
- **Technique.** "Higher, softer sounds with no sharp edges read as small and harmless … a cute
  sound wants the edges taken off it." The Japanese version of the same guide sums it up as high,
  soft and round (https://morphic.com/resources/sounds/cute-sound-effects). Cute packs split into
  clicks, buttons, menus, bonus, prizes and coins (https://cartoonsmart.com/cute-game-sounds/).
  Failure sounds should feel curious, not shaming.
- **Gap.** I found no developer interview on how MapleStory's effects were made (Korean and
  English searches turned up nothing usable). What follows is **[our call]**, from the sources
  above plus familiarity with MapleStory's sound palette: short, mid-high, cartoony hits;
  bubbly "pop" monster deaths; a bright, major-key level-up fanfare; plinky, glockenspiel-like UI.
- **Numbers [our call].**
  - Waves: triangle, sine and **12.5 % / 25 % pulse**. Saw and white noise only as short layers.
  - Put a **low-pass at 3.5–6 kHz** on tonal layers.
  - Hit bodies at 300–700 Hz (not 100–200 Hz), with a sub only on finishers.
  - Pitch up: UI and pickups in the C6–C7 range (1047–2093 Hz), but quiet.
  - Intervals: major third (×1.26), fourth (×1.335), fifth (×1.5), octave (×2). Pentatonic for
    sparkles, minor second or tritone only for errors and debuffs.
  - Monster death = a pitched "pop" (sine 500→1200 Hz in 40 ms) + a soft noise puff, not a crunch.
- **Apply.** Apply this palette to every sound family (heroes, monsters, bosses, UI, magic schools)
  so the whole game sounds like one world, per the "improve the whole game" rule.

### 15. Stay out of the 2–5 kHz glare
- **Technique.** The ear is most sensitive at about **2–5 kHz**, peaking near 3.5–3.7 kHz,
  largely because of ear-canal resonance (ISO 226:2023 equal-loudness contours;
  https://en.wikipedia.org/wiki/Equal-loudness_contour). Energy there sounds louder than it
  measures. The sources do not directly say it sounds "harsh"; that is standard mixing lore,
  treated here as **[our call]**.
- **Numbers [our call].**
  - Keep sustained tonal energy out of 2.5–5 kHz. Instead, choose fundamentals below 1.3 kHz
    with filtered harmonics, or above 5 kHz but very quiet (sparkles).
  - Noise transients there may last at most 10 ms.
  - Optionally add one gentle peaking cut on the SFX bus: **−3 dB at 3.5 kHz, Q 1**.
  - Bell partials above 4 kHz should sit at least −18 dB below the base tone.
- **Apply.** This fixes the current shrill bells. Lower the bell base pitch to about C6
  (1047 Hz), use near-harmonic partials (1, 2, 3, plus a little 4.2), and decay the upper
  partials 2–3× faster.

### 16. Weight matches the blow (audio side of our combat rules)
- **Technique.** A hit's sound should follow its force: weak hits duller, criticals sharper
  (https://www.wayline.io/blog/making-combat-feel-impactful). Hit-stop is mainly a visual freeze
  that emphasizes impact (Sakurai's column via
  https://sourcegaming.info/2015/11/11/thoughts-on-hitstop-sakurais-famitsu-column-vol-490-1/).
  Sound, animation and effects should land on the same frames
  (https://gamineai.com/blog/pixel-art-combat-fx-hitstop-smear-frames-impact-timing-2026).
- **Numbers [our call].** Three weight tiers:
  - Light: body only, −14 dB.
  - Medium: + transient, −12 dB.
  - Heavy: + sub + 1-bit noise crunch + 4 dB music duck, −9 dB.
  - Play the impact on the **first hit-stop frame**. Do not slow or pitch the sound during the
    freeze; let its tail ring through.
  - Crit = medium + a "ting" (triangle 1760 Hz + 2637 Hz, D 180 ms) 15 ms later.
- **Apply.** `sfx.hit` gets a `tier` and `crit` from the combo step data. Then knockback,
  launches and hit-stop all line up with audio weight.

---

## D. Web Audio specifics

### 17. Render offline into AudioBuffers; play with fire-and-forget sources
- **Technique.** Web Audio takes "a fire-and-forget approach to audio source scheduling", while
  contexts "should be considered expensive objects" (W3C spec, https://www.w3.org/TR/webaudio/).
  Buffers give "more precision, and more precise manipulation" for short, sample-like sounds
  (https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices). ZzFX renders
  a Float32Array and copies it into an AudioBuffer.
- **Numbers.** A 0.3 s sound at 44.1 kHz with 8× oversampling is about 106k inner loop steps per
  layer, roughly 1 ms of JavaScript (estimate). Forty recipes × 3 variants × ~0.4 s is about
  48 s of mono float audio, roughly **8.5 MB** of memory, and on the order of 100–200 ms to render
  in total, spread over idle time (estimate).
- **Apply.**
  - Render in pure JS at the context's `sampleRate` (so the browser doesn't resample). Spread the
    rendering across idle slices after unlock, and render lazily on first use as a fallback.
  - Each play creates one `AudioBufferSourceNode` → `GainNode` → `StereoPannerNode` → bus.
  - Keep the live oscillator path only for the music sequencer, if at all.
  - The renderer is a **pure function**, so `node:test` can check it without Web Audio (finding 21).

### 18. Pulse waves with duty: three ways
- **Sample rendering (recommended).** Draw `phase < duty ? 1 : −1` with **4–8× oversampling**
  (sfxr's way) or with **PolyBLEP** correction at both edges. That supports duty *sweep* for free.
  Remove DC with a one-pole blocker, `y = x − x₁ + 0.995·y₁`. A 12.5 % pulse has a DC offset of
  2·0.125 − 1 = −0.75 and would otherwise thump and click.
- **PeriodicWave (for live notes).** Fourier terms for a 0/1 pulse of duty d:
  `real[n] = sin(2πnd)/(πn)`, `imag[n] = (1 − cos(2πnd))/(πn)`, with `real[0] = imag[0] = 0`
  to drop DC. Use 64–128 terms and make one wave per duty (12.5, 25, 50 %). The spec requires
  oscillators to produce "the same result as if a PeriodicWave, with the appropriate Fourier
  series … were used", warns that aliasing above Nyquist "will cause audibly objectionable
  artifacts", and lets implementations band-limit
  (https://www.w3.org/TR/webaudio/; MDN createPeriodicWave:
  https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createPeriodicWave).
  The catch: duty can't sweep smoothly.
- **Apply.** Use sample rendering for all effects. If the music engine wants chip leads, give it
  the three PeriodicWaves.

### 19. Avoiding clicks with live nodes
- **Technique.** Starting or stopping at a non-zero point in the waveform clicks. Anchor the ramp
  first (`cancelScheduledValues(t)`, `setValueAtTime(current, t)`), then ramp to 0 and call
  `stop()` slightly later. One example ramps over 80 ms and stops 10 ms after
  (https://dev.to/zack_e36e64fd6fcd12ebbc13/building-a-small-local-first-web-audio-tool-and-the-edge-cases-i-didnt-expect-o1f;
  W3C list: https://lists.w3.org/Archives/Public/public-audio/2012JanMar/0168.html).
- **Numbers.** For voice-steal or blip cut-off: a 5–8 ms linear ramp to 0, then `stop(t + 0.01)`.
  For volume changes: `setTargetAtTime(v, t, 0.02–0.05)`.
- **Apply.** Pre-rendered buffers already fade at their own ends. Fade the voice gain only when a
  sound is cut early.

### 20. Unlocking audio on desktop and mobile
- **Technique.**
  - Since Chrome 71, a context created before a user gesture starts "suspended", and you must
    call `resume()` after a gesture. Click is the safest gesture
    (https://developer.chrome.com/blog/autoplay).
  - Attach one-time listeners for `touchstart`, `touchend`, `mousedown` and `keydown`, resume,
    then remove them, and reuse **one** context
    (https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos).
  - On iOS, `touchend` unlocks reliably. Web Audio follows the **ringer switch** unless, on
    iOS 17+, you set `navigator.audioSession.type = "playback"` (feature-detect it). Older iOS
    needs a looping silent media element
    (https://bugnet.io/blog/how-to-fix-ios-web-game-audio-muted-by-the-silent-switch;
    https://github.com/swevans/unmute; https://bugs.webkit.org/show_bug.cgi?id=252746).
- **Apply.**
  - Keep our `unlock()`, and add `touchend`/`pointerup` plus the `audioSession` line.
  - Play a one-sample silent buffer on unlock.
  - Re-`resume()` on `visibilitychange` and whenever the state reads `"interrupted"` or
    `"suspended"`.
  - Pre-render the cache right after unlock.

### 21. Testing synthesized sound without ears
- **Technique [our call].** Because the renderer is pure, `node:test` can check every recipe for:
  - no NaN
  - peak ≤ 1
  - first and last samples |x| < 1e-3 (no clicks)
  - |mean| < 0.01 (no DC)
  - duration within the recipe's bounds
  - for UI and hits, under 25 % of energy in 2.5–5 kHz (a cheap filter-bank estimate)
- **Apply.** Add `tests/audio.test.js` next to the existing suites when the engine is rebuilt.

---

## E. Recommended architecture for our SFX engine

1. **`audio/synth.js`: pure renderer.**
   - Call: `render(recipe, sampleRate, seed) → Float32Array`. No Web Audio, so it is testable in
     node.
   - A recipe is `{ layers: [...], gainDb, vary, maxVoices, priority, bus, duck? }`.
   - A layer is `{ wave: 'sine'|'tri'|'pulse'|'saw'|'noise'|'pnoise'|'lfsr'|'lfsr93', duty, dutySweep,
     f0 (Hz), slide (oct/s), dslide (oct/s²), jumps: [[ratio, atSec]...], repeat (s), vib: [Hz, %],
     trem: [Hz, %], env: { a, s, punch, d, curve }, lpf: [Hz, toHz, Q], hpf: [Hz, toHz],
     crush (hold samples), overtones: [n, falloff], comp (0–1 power curve), echo: [s, dB],
     at (s offset), db }`.
   - Oscillators use 8× oversampling (or PolyBLEP). Noise is sfxr-style pitched noise plus NES
     LFSR (32767 and 93 steps).
   - Filters: biquad LP/HP/BP with a per-sample cutoff sweep. Envelope as in sfxr, with
     `curve` > 1 giving an exponential-feeling decay.
   - Post-processing per buffer: sum layers → DC blocker → 0.3 ms in / 5 ms out fade → normalize
     to peak 1.
2. **`audio/recipes.js`: data only.** About 40 named recipes (section F), with the same names the
   game already calls (`hit`, `swing`, `coin`, `levelup`, …) so callers barely change. School and
   element variants (holy, rage, fire, ice, arcane) are parameter overrides on a base recipe, not
   copies.
3. **`audio/bank.js`: cache.**
   - After unlock, render 3 variants per recipe (different noise seeds; tonal recipes may use 1)
     in idle slices into AudioBuffers.
   - `get(name)` returns the next variant in rotation, never the same one twice in a row. A
     missing variant renders on demand.
4. **`audio/voices.js`: playback and limits.**
   - `play(name, {pan, pitchSemis, gainDb, tier})`.
   - playbackRate = 2^((pitchSemis + rand(±vary))/12), gain jitter ±1 dB, pan clamped to ±0.6
     from screen x.
   - Enforces per-name maxVoices, a 35 ms same-name retrigger gap (extras merge into +dB),
     priority stealing with a 5 ms fade, and a global cap of 24.
5. **`audio/engine.js`: graph.**
   - Buses sfx, ui, voice and music → master → a **limiter-style** DynamicsCompressor (threshold
     −3 dB, knee 0, ratio 20, attack 1 ms, release 80 ms). It catches peaks only, unlike the
     current −16 dB/4:1 squash.
   - Remove the global 1.8 s reverb. Add an optional 0.3 s room send at −18 dB for magic, holy
     and jingle sounds only.
   - Optional −3 dB / 3.5 kHz / Q 1 peaking cut on the sfx bus.
   - `duck(db, holdMs)` on music.
   - The unlock improvements from finding 20.
6. **Music stays live-sequenced** (it needs tempo), but it should use the same pulse PeriodicWaves
   and envelopes so music and sound effects share one chip timbre.
7. **Licensing.** Ported algorithms: sfxr (MIT, DrPetter), jsfxr (Unlicense), ZzFX (MIT,
   Frank Force), bfxr2 (MIT, Stephen Lavelle). Credit them in a comment header in `synth.js`. No
   code is copied verbatim unless we vendor ZzFXMicro, which needs its MIT notice kept.

---

## F. Sound recipes ready to implement

**Notation.**
- Times are in ms. Env = A/S/D with punch p (sfxr-style). Slide is in octaves per second
  (negative = falls).
- `jump ×r@t` = pitch × r at t ms. `arp a-b-c @n` = notes stepping every n ms.
- LPF/HPF are in Hz (→ = swept to). `pnoise f` = sfxr pitched noise at f Hz. `lfsr93` = periodic
  NES noise.
- dB = peak after normalizing (finding 12). Vary = random pitch range in ± %. Max = voice limit.
- All values are **[our call]**, derived from the sfxr/ZzFX/bfxr2 presets and findings 7–16.
  They are meant as a starting point, to be tuned by ear.

| # | Name | Layers (wave, pitch, motion) | Env A/S/D, punch | Filter / extras | dB | Vary | Max |
|---|---|---|---|---|---|---|---|
| 1 | coin | pulse 25 % 988 Hz (B5), jump ×1.335@55 (→E6) | 0/40/220, p .45 | LPF 6k, HPF 300 | −15 | 2 + combo semis | 3 |
| 2 | pickup (item) | tri 660 Hz, arp ×1.26@35, ×1.5@70 | 0/30/150, p .3 | LPF 5k | −15 | 2 | 3 |
| 3 | rareDrop | #2 + sine arp C6-E6-G6-C7 @50, overtone 2 @ −14 dB | 1/40/450, p .2 | LPF 7k, echo 80 ms −12 dB, room send | −12 | 0 | 1 |
| 4 | jump | pulse 25 % 330 Hz, slide +5 oct/s | 0/40/90, p .2 | LPF 4k, HPF 150 | −18 | 4 | 1 |
| 5 | land | pnoise 90 Hz D 60 + sine 150→70 Hz slide −8 | 0/10/70, p .4 | LPF 900 | −18 | 6 | 1 |
| 6 | landHard | #5 + sine sub 70→40 Hz 160 ms + lfsr 8 ms click | 0/15/120, p .6 | LPF 1.2k | −13 | 5 | 1 |
| 7 | stepGrass | noise D 30 | 2/0/30 | BP: HPF 500, LPF 2.4k | −26 | 8 | 2 |
| 8 | stepStone | noise D 20 + tri 900 Hz 6 ms tick | 1/0/25 | HPF 700, LPF 3k | −25 | 8 | 2 |
| 9 | swing | noise, Whooshr bell env 170 ms (focus .65); BP 2.2k→900 Q 1.4; + sine whistle 800→600 Hz at −12 dB | bell, peak at 40 % | ends on strike frame | −18 | 5 | 3 |
| 10 | swingHeavy | as #9, 320 ms, BP 1.3k→400, whistle 400→260 + tri 180→110 Hz at −10 dB | bell, focus .5 | | −15 | 4 | 2 |
| 11 | thrust | noise 110 ms BP 1.8k→3k (rising) + pulse 12.5 % 700 Hz slide −6, 30 ms | 0/10/90 | LPF 6k | −18 | 5 | 2 |
| 12 | hit (light) | transient noise 5 ms HPF 2k; body pulse 25 % 480 Hz slide −8 | 0/10/60, p .5 | body LPF 3.5k | −12 | 5 | 4 |
| 13 | hitMedium | #12 + lfsr93 3 ms clink at −8 dB; body 420 Hz D 90 | 0/12/90, p .55 | LPF 4k | −11 | 5 | 4 |
| 14 | hitHeavy (finisher) | #13 + sine sub 90→45 Hz 180 ms + crush 6 noise 90 ms at −6 dB | 0/20/140, p .6 | LPF 3k; duck music −4 dB | −9 | 4 | 2 |
| 15 | crit | #13 + 15 ms later tri 1760 Hz + 2637 Hz (fifth) at −6 dB | ting 1/20/180 | LPF 7k | −9 | 2 | 2 |
| 16 | hurt (player) | tri 560→280 Hz slide −6, vib 18 Hz 6 % + noise 8 ms | 0/20/120, p .3 | LPF 2.5k | −12 | 4 | 1 |
| 17 | enemyHurt | pulse 50 % 700 Hz slide −10 (squeak) | 0/10/70, p .3 | LPF 3k, HPF 200 | −16 | 8 | 3 |
| 18 | poof (enemy death) | sine 500→1200 Hz in 40 ms (pop) + pnoise 400 Hz puff 200 ms | pop 0/10/40; puff 2/30/180 | puff LPF 3k→400 | −14 | 6 | 3 |
| 19 | boom | pnoise 60 Hz slide −0.5 + sine sub 70→35 Hz 300 ms | 0/80/450, p .6 | LPF 2.5k→600, comp .3; duck −6 dB | −9 | 4 | 2 |
| 20 | zap (magic bolt) | pulse 25 %→50 % (duty sweep) 1200 Hz slide −5 | 0/40/120, p .2 | LPF 5k, HPF 300 | −16 | 4 | 3 |
| 21 | arrow | tri 720 Hz slide −2 (twang) 80 ms + noise 90 ms BP 3k→1.5k | 0/5/80 | LPF 5k | −16 | 5 | 3 |
| 22 | cast (arcane) | tri 330 Hz slide +2.5, vib 7 Hz 3 %, trem 12 Hz 30 % + sine sparkle C7 @180 | 15/150/200 | LPF 4.5k, room send | −14 | 2 | 2 |
| 23 | fire | pnoise 180 Hz, trem 18 Hz 50 % + tri 110→80 Hz | 20/200/250 | LPF 1.5k→700 | −14 | 5 | 2 |
| 24 | ice / freeze | 4 sine grains at random pentatonic notes in 1.6–2.6 kHz every 30 ms + lfsr crackle 60 ms | grains 0/10/110 | grains LPF 8k; crackle HPF 4k at −14 dB | −15 | 3 | 2 |
| 25 | holy chime | sine E6 1319 Hz partials 1/2/3/4.2 at 0/−10/−18/−24 dB, uppers decay 3× faster; 2nd note B6 at +60 ms | 1/0/700 | LPF 7k, room send | −13 | 0 | 2 |
| 26 | heal | tri arp C6-D6-E6-G6 @45 (each D 250) + noise swell HPF 3k LPF 8k at −20 dB | 10/0/250 | room send | −14 | 0 | 1 |
| 27 | buff / powerUp | pulse 25 % 392 Hz slide +4, repeat 70 ms ×4 with base +2 semis each loop | 0/260/200 | LPF 5k | −13 | 0 | 1 |
| 28 | rage (Berserker) | pulse 12.5 % 80 Hz vib 25 Hz 6 % + pnoise 120 Hz + sine sub 50 Hz | 20/250/300, p .4 | LPF 900, comp .4; duck −3 dB | −11 | 3 | 1 |
| 29 | levelup | pulse 25 % arp G5-C6-E6-G6 @80, last held 500 + tri a third below at −8 dB, vib 6 Hz 1.5 % on the held note | 1/–/500 per note | LPF 6k, room send; duck −8 dB 1.2 s | −8 | 0 | 1 |
| 30 | jobUp | #29 twice (second a fourth higher) + final C-E-G chord, held 800 | | duck −8 dB 2 s | −8 | 0 | 1 |
| 31 | click / select | tri 1047 Hz (C6) + 1 ms noise tick at −20 dB | 0.5/15/40 | LPF 6k | −14 | 0 | 2 |
| 32 | open | tri G5 784 → D6 1175 @40 | 1/20/80 each | LPF 6k | −15 | 0 | 1 |
| 33 | close | tri D6 1175 → G5 784 @40 | 1/20/70 each | LPF 5k | −16 | 0 | 1 |
| 34 | denied | pulse 50 % 220 Hz then 208 Hz (semitone down), 70 ms each, 30 ms gap | 1/40/30 | LPF 1.5k | −16 | 0 | 1 |
| 35 | blip (text) | pulse 25 % at speaker pitch, picked from pentatonic ±3 semis | 1/10/25 | LPF 3k | −20 | scale pick | 1 |
| 36 | questAccept | tri G5-B5-D6 @60 | 1/20/150 | LPF 6k | −13 | 0 | 1 |
| 37 | questDone | pulse 25 % C6-E6-G6-C7 @70 + tri chord, held 400 | 1/–/400 | room send; duck −6 dB | −10 | 0 | 1 |
| 38 | portal | sine 300→1200 Hz slide +2, vib 7 Hz 4 % + noise BP 800→2k 600 ms at −10 dB | 40/400/200 | room send | −15 | 0 | 1 |
| 39 | dash | noise 120 ms BP 1.5k→3k (rising), bell env | bell | | −18 | 5 | 1 |
| 40 | stun | sine alternating 1568/1760 Hz every 60 ms (birdie), 400 ms | 5/350/50 | LPF 5k | −18 | 0 | 2 |
| 41 | death (player) | tri arp E5-C5-A4-F4 @120, last held 400, slide −0.3 on the last | 2/–/400 | LPF 3k | −11 | 0 | 1 |

**Element and school overrides [our call]:**
- **holy** adds a #25-style chime layer at −10 dB to casts and hits.
- **rage/blood** moves hit bodies down 3 semitones and adds the crush layer.
- **fire** swaps the hit body for pnoise.
- **ice** adds one grain from #24.
- **poison/bleed dot** = enemyHurt an octave lower at −22 dB.

---

## G. References

Generators and their code
- jsfxr source and Unlicense: https://github.com/chr15m/jsfxr (sfxr.js, UNLICENSE)
- sfxr by DrPetter (MIT): https://www.drpetter.se/project_sfxr.html
- ZzFX source, README, designer (MIT): https://github.com/KilledByAPixel/ZzFX ,
  https://killedbyapixel.github.io/ZzFX
- bfxr (Apache-2.0): https://github.com/increpare/bfxr ; bfxr2 (MIT): https://github.com/increpare/bfxr2
  (js/audio/Bfxr_DSP.js, js/synths/Whooshr.js, js/synths/Pluckr.js)
- ChipTone (closed tool, CC0 output): https://sfbgames.itch.io/chiptone
- NES APU pulse and noise: https://www.nesdev.org/wiki/APU_Pulse , https://www.nesdev.org/wiki/APU_Noise

Design and mixing
- George Prosser, "The power of pitch shifting": https://gamedeveloper.com/audio/the-power-of-pitch-shifting
- Game audio immersion / repetition fatigue: https://www.asoundeffect.com/game-audio-immersion/
- Repetition fixes (variations, round-robin): https://sounddesign.irpr.agency/solutions/game-audio-repetitive/
- Impact layering: https://violetrecording.com/how-to-make-impact-sounds/ ,
  https://vi-control.net/community/threads/how-to-create-body-hit-sounds.144994/
- Weapon sound design: https://violetrecording.com/how-to-design-weapon-sounds/
- Combat feedback: https://www.wayline.io/blog/making-combat-feel-impactful
- Hit-stop (Sakurai, via Source Gaming): https://sourcegaming.info/2015/11/11/thoughts-on-hitstop-sakurais-famitsu-column-vol-490-1/
- Frame-aligned impact timing: https://gamineai.com/blog/pixel-art-combat-fx-hitstop-smear-frames-impact-timing-2026
- Hit-stop audio ducking example: https://docs.unrealengine.com/marketplace/ja/product/cronus-hitstop
- Cute sound guidance: https://morphic.com/resources/sounds/cute-sound-effects ,
  https://cartoonsmart.com/cute-game-sounds/
- Voice limits and priority: https://blog.audiokinetic.com/how-to-get-a-hold-on-your-voices-optimizing-for-cpu-part-1/ ,
  https://www.audiokinetic.com/qa/1507/getting-the-voice-limit-count ,
  https://docs.unity3d.com/ScriptReference/AudioSource-priority.html
- Ducking numbers: https://claudeskills.info/skills/gamedev-skills/awesome-gamedev-agent-skills/audio-design/ ,
  https://www.capcut.com/create/audio-ducking-for-clear-dialogue-in-video
- Loudness: https://audiokinetic.com/en/mastering-a-game-with-wwise-part1 ,
  https://designingsound.org/2012/07/30/video-games-and-loudness-standards-interview-with-sonys-garry-taylor/ ,
  https://www.audiogang.org/wp-content/uploads/2015/04/IESD-Mix-Ref-Levels-v03.02.pdf
- Ear sensitivity: https://en.wikipedia.org/wiki/Equal-loudness_contour ; formants: https://en.wikipedia.org/wiki/Formant

Dialogue blips
- RPG Maker MZ dialogue bleep (30 ms gate, random pick, pitch jitter): https://winterbitestudios.itch.io/plugin-rpg-maker-mz-dialogue-bleep
- Animalese: https://nookipedia.com/wiki/Animalese
- Celeste dialogue audio (Kevin Regamey): https://www.thegamer.com/celeste-sound-designer-reveals-how-the-games-dialogue-audio-was-created/

Web Audio
- W3C Web Audio spec (fire-and-forget, oscillator ≡ PeriodicWave, aliasing, setTargetAtTime 63.2 %): https://www.w3.org/TR/webaudio/
- MDN best practices: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
- MDN createPeriodicWave: https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createPeriodicWave
- Chrome autoplay policy: https://developer.chrome.com/blog/autoplay
- Safari/iOS unlock: https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos
- iOS silent switch: https://bugnet.io/blog/how-to-fix-ios-web-game-audio-muted-by-the-silent-switch ,
  https://github.com/swevans/unmute , https://bugs.webkit.org/show_bug.cgi?id=252746
- Click-free ramps: https://dev.to/zack_e36e64fd6fcd12ebbc13/building-a-small-local-first-web-audio-tool-and-the-edge-cases-i-didnt-expect-o1f ,
  https://lists.w3.org/Archives/Public/public-audio/2012JanMar/0168.html

# Chiptune music research: making "bit tone" music in Web Audio

Research for remaking every area theme as real 8-bit (NES / Game Boy style) music, synthesized at
runtime with the Web Audio API (no audio files, no build step, no dependencies).

## Why the current music sounds wrong

| Current approach | Why it fails | What chiptune does instead |
|---|---|---|
| Random-walk melody over a mode | No motif, no repetition, no cadence, so nothing sticks | Hand-written 1-2 bar motifs, repeated and varied in 4/8-bar phrases (F14-F17) |
| Triangle/sine pads | NES/GB have no pads. Sustained sines read as "ambient", not "8-bit" | Two pulse leads plus arpeggio macros that imply chords (F5) |
| Sawtooth bass | Saw is a synth-pop sound, not 2A03 | 4-bit stepped triangle bass, staccato and octave-hopping (F3, F8) |
| Noise drums with smooth exponential decays | Smooth and filtered sounds like modern sampled drums | Stepped 60 Hz volume tables on LFSR noise, plus pitch-dropped triangle kicks (F7, F8) |
| Reverb on everything | Smears the hard edges that make chip music read as chip music | Dry channels plus a "note echo" on the second pulse channel (F9, F25) |

Notation used below: rows are 16th notes. `vol` values are 0-15 and `duty` indexes are
0=12.5%, 1=25%, 2=50%, 3=75%. One macro step = one 60 Hz frame (16.7 ms), as in
FamiTracker/Famistudio drivers.

---

## Part 1: Instrument design (NES 2A03, Game Boy, tracker practice)

**F1. Pulse duty cycles: there are three distinct timbres, not four.**
The 2A03 pulse sequences are `01000000` (12.5%), `01100000` (25%), `01111000` (50%) and
`10011111` (25% negated, i.e. 75%). The 75% duty is the 25% wave inverted, so it sounds the same.
Practice: 12.5% is thin and nasal (echo, sparkle, counter-lines), 25% is the classic bright lead
("trebly but not too nasal", DDRKirby picked it for leads), and 50% is a hollow, flute-like square
(warm leads, harmony, chord stabs).
Apply: use one shared table of three PeriodicWaves (or three generator functions). Default lead
duty is 25%. Use 50% for cozy/warm areas and 12.5% for echo and twinkle parts.
Sources: https://www.nesdev.org/wiki/APU_Pulse ,
https://ddrkirby.com/articles/nes-chiptunes-unlock-everything/nes-chiptunes-unlock-everything.html ,
https://battleofthebits.com/lyceum/View/I%20Am%20New%20To%20NSF (it notes duty 1 and 3 sound identical)

**F2. Pitch comes from integer timer periods, which gives the music its slight "chip" detune.**
Pulse: `f = fCPU / (16 * (t + 1))`. Triangle: `f = fCPU / (32 * (t + 1))`. NTSC fCPU = 1,789,773 Hz.
The timer is 11 bits, and a pulse period below 8 is silent. High notes are therefore slightly out
of tune.
Apply (optional authenticity): quantize each note frequency through
`t = round(fCPU/(16 f) - 1); f' = fCPU/(16 (t+1))`. The effect is subtle and charming above C6.
Vibrato and slides should step in period units too: very fine steps low down, coarse steps high up.
Source: https://www.nesdev.org/wiki/APU_Pulse , https://www.nesdev.org/wiki/APU_Triangle

**F3. The triangle is a 32-step, 4-bit staircase with no volume control.**
The sequencer steps 15→0→15 in 32 steps. That quantization is what gives NES bass its faint buzz,
which a smooth `OscillatorNode('triangle')` lacks. The channel is either running or stopped, so
there are no fades. Notes are shaped by length (staccato) and by pitch, which is why triangle bass
lines are bouncy and detached. Silencing it by zeroing the period makes a pop.
Apply: generate the triangle as `round(15*tri)/15`-style 16-level steps (or a PeriodicWave built
from that stepped table). Gate notes on and off and never ramp the triangle's volume within a note.
To avoid clicks, stop it only at a zero crossing, or use a 1-2 ms gain ramp at the voice output.
Source: https://www.nesdev.org/wiki/APU_Triangle

**F4. Noise is a 15-bit LFSR with 16 pitches and two modes.**
Long mode (taps bits 0^1) gives a 32,767-step hiss. Short mode (bits 0^6) gives a 93- or 31-step
loop, a pitched metallic buzz useful for cymbal/cowbell/"tsh" sounds. The NTSC period table, in
CPU cycles per LFSR clock, is
`4, 8, 16, 32, 64, 96, 128, 160, 202, 254, 380, 508, 762, 1016, 2034, 4068`
(index 0 = brightest).
Apply: implement the LFSR exactly, clocked at `1789773/period[i]` Hz with a fractional
accumulator. When it clocks faster than the sample rate, average the outputs within each sample
to tame aliasing. Hats use index 0-3, snares 4-7, kicks/thumps 10-13.
Source: https://www.nesdev.org/wiki/APU_Noise

**F5. Chords are faked with arpeggio macros.**
FamiTracker `0xy` cycles root, +x and +y semitones, one step per tick at 60 Hz. With y left blank
it alternates 2 notes. Instrument arpeggio sequences such as `| 0 3 7 12` (looped) give
minor-chord shimmer, and `0 4 7` gives major. A non-looped arpeggio whose first step is +12
(`12 0`) gives a percussive "blip" attack.
Apply: arpeggio macro = array of semitone offsets plus a loop index. Use 1 frame per step for a
buzzy NES chord (a 20 Hz cycle over 3 notes) and 2 frames for a softer, more readable chord. Use
arps for sustained harmony instead of pads.
Sources: https://battleofthebits.com/lyceum/View/FamiTracker+Effects+Commands ,
https://battleofthebits.com/lyceum/View/I%20Am%20New%20To%20NSF , https://www.nesdev.org/nt2/tips-tricks.htm

**F6. Macros are frame-stepped sequences with loop and release points.**
Tracker instruments are per-frame sequences for volume, arpeggio, pitch and duty. `|` marks the
loop start and `/` marks the release point: the macro loops (or holds) until note-off, then
plays on from the release. Furnace adds per-macro step length and start delay, and
ADSR/LFO generator modes.
A typical volume macro is `15 14 13 12 11 10 9 8 7 6 5 4 3 2 1 0` (a 16-frame fade). A duty
sweep is `| 0 1 2 3 2 1`.
Apply: the instrument definition *is* a set of macros (vol, duty, arp, pitch), each
`{seq:[...], loop:i, release:j}`. This one mechanism replaces all ad-hoc envelope code.
Sources: https://tildearrow.org/furnace/doc/latest/4-instrument/index.html ,
https://battleofthebits.com/lyceum/View/I%20Am%20New%20To%20NSF

**F7. Volume envelopes are stepped and short. Recommended stock tables (0-15, 60 Hz):**

| Instrument | Volume macro | Duty macro | Notes |
|---|---|---|---|
| Lead (sustain) | `13 12 11 10 10 9 \| 9 / 7 5 3 1 0` | `2 \| 1` (50% attack, then 25%) | the duty flip on attack adds a "pluck" |
| Pluck/staccato | `14 11 9 7 6 5 4 3 2 1 0` | `1` | 11 frames ≈ 180 ms |
| Soft pad-like harmony | `4 6 8 \| 8 / 6 4 2 0` | `2` | slow-ish attack, for B sections |
| Echo voice | lead table × 0.35-0.5 | `0` (12.5%) | see F9 |
| Chord arp | `10 9 8 \| 7 / 4 2 0` | `2` | arp `\| 0 4 7` or `\| 0 3 7` |
| Closed hat (noise 1-2) | `10 6 3 1 0` | long mode | ≈ 70 ms |
| Open hat (noise 1) | `9 8 7 6 5 4 4 3 3 2 2 1 1 0` | long mode | ≈ 230 ms |
| Snare (noise 5→7) | `15 13 10 8 6 5 4 3 2 1 0` | arp on noise index `5 6 7 7` | plus optional triangle body (F8) |
| Clap (disco) | `12 0 12 0 14 10 7 5 3 2 1 0` | noise 4 | the gaps fake the multi-hit clap |
| Crystal "ting" (short mode) | `8 5 3 2 1 0` | noise 2, short mode | metallic, for caves |

Basis: FamiTracker/Furnace practice (F6). The exact values are tuned starting points, not
quotations.

**F8. Drums are built from noise plus a pitch-dropped triangle or pulse.**
The classic NES kick is a triangle note that falls quickly in pitch (rapidly descending notes,
auto-portamento at a high rate), followed by a short gap and then the bass line resumes. Toms are
the same with a slower fall. Square-channel kicks use a fast pitch-down (`2xx`) "thud", with noise
hiss layered for the body. Bass and kick share the triangle on real hardware, so bass lines are
written around the kick.
Recipe (60 Hz frames): **kick** = triangle starting near E3 (165 Hz) and dropping about 2 octaves
over 3-4 frames (50-70 ms), plus a noise index 12 hit at vol `8 4 0`. **Tom** = triangle from
C4 down 1 octave over 6-8 frames. **Snare** = noise (F7) plus a triangle from about G3 down an
octave in 2-3 frames.
Apply: in hardware-faithful mode put the kick on the triangle and let it steal the bass note. Or
give the engine a fifth "drum-triangle" voice so the bass keeps playing.
Sources: https://www.nesdev.org/nt2/tips-tricks.htm , https://en.wikipedia.org/wiki/Ricoh_2A03 ,
https://ddrkirby.com/articles/nes-chiptunes-unlock-everything/nes-chiptunes-unlock-everything.html

**F9. Echo means repeating the notes later, softer, on the other pulse channel.**
DDRKirby's 2A03-style track uses three pulse-2 modes: a separate part, harmony, or *echo*, where
the second channel "repeats the melody later, softer, and slightly detuned". Trackers also delay
notes by ticks with `Gxx` for fine timing.
Numbers: delay 2-3 rows (a dotted 8th is the classic choice), echo volume 35-50% of the lead
(lead vol 11, echo vol 4-5), detune +5 to +10 cents, and 12.5% duty so it sits behind the lead.
Apply: an `echo` flag on a pattern auto-copies the lead's notes to pulse 2, shifted by N rows and
scaled in volume. This replaces the global reverb.
Sources: https://ddrkirby.com/articles/nes-chiptunes-unlock-everything/nes-chiptunes-unlock-everything.html ,
https://battleofthebits.com/lyceum/View/FamiTracker+Effects+Commands

**F10. Vibrato is delayed, gentle, and on long notes only.**
`4xy` sets vibrato speed x and depth y (400 = off). DDRKirby adds an automatic pitch LFO to
longer notes only, plus short grace slides at note starts and ends. In FamiTracker's 64-step
vibrato table the rate is about `60*x/64` Hz, so x=5 → 4.7 Hz and x=6 → 5.6 Hz (approximate).
Recommended: delay 12-20 frames (200-330 ms) so short notes stay straight. Rate 5-6 Hz. Depth
±10-20 cents for cozy music, ±25-40 cents for dramatic or boss leads. Ramp the depth in over
about 8 frames.
Apply: a vibrato macro `{delay:16, rateHz:5.5, cents:18}`, or a looped pitch macro such as
`| 0 -2 0 2` in fine-pitch units.
Sources: https://battleofthebits.com/lyceum/View/FamiTracker+Effects+Commands ,
https://ddrkirby.com/articles/nes-chiptunes-unlock-everything/nes-chiptunes-unlock-everything.html

**F11. Slides and the hardware sweep.**
`1xx`/`2xx` are linear slides up and down, `3xx` is portamento to the next note, `Qxy`/`Rxy`
slide up or down by y semitones at speed x, and `Hxy`/`Ixy` are the 2A03 sweep (logarithmic).
The hardware sweep shifts the period by `period >> shift` every half-frame (about 120 Hz).
Apply: use a quick upward `Qxy`-style slide of 1-2 semitones over 2-3 frames into accented notes,
for cute "bwip" pickups. Use sweep-down for kicks and for SFX such as jump and coin.
Sources: https://battleofthebits.com/lyceum/View/FamiTracker+Effects+Commands ,
https://www.nesdev.org/wiki/APU_Pulse

**F12. Game Boy flavour: a wave channel and hard stereo.**
The Game Boy has 2 pulses (12.5/25/50/75%, with a sweep on CH1 at 128 Hz), a wave channel playing
32 four-bit samples, and a noise LFSR with 15- or 7-bit mode. Envelopes tick at 64 Hz.
Panning (NR51) only routes each channel left, right or both, so GB music uses hard-panned
pulses. Apply: for softer areas (mage grove, sky garden) swap the NES triangle for a
"GB wave" bass/lead built from a 32×4-bit table, e.g. a rounded saw-sine
`[8,11,13,14,15,15,14,13,11,9,8,6,4,3,2,1,0,0,1,2,3,4,6,7, ...]`. The wave channel has volume
levels 100/50/25%. Allow pan values of only -1, 0 and +1, scaled by a "width" (F24).
Sources: https://gbdev.io/pandocs/Audio_details.html , https://gbdev.io/pandocs/Audio_Registers.html

**F13. Emulating this faithfully in Web Audio.**
(a) **PeriodicWave pulses.** For a ±1 pulse with duty D, the coefficients are
`real[n] = 2·sin(2πnD)/(πn)` and `imag[n] = 2·(1−cos(2πnD))/(πn)`; set real[0] = 0 to drop DC.
Build with `disableNormalization:true` so all three duties share a scale. Chromium/WebKit build
band-limited tables for a PeriodicWave and drop partials at high pitches, so this is alias-free
and cheap. The limitation is that duty and timbre can't be switched sample-accurately mid-note
(`setPeriodicWave` is immediate, not scheduled).
(b) **Sample-level rendering** (recommended; see Architecture): write the 4 channels in plain JS
into a Float32Array. Use PolyBLEP correction at each pulse edge, because aliasing comes only from
the jumps (Finke). Narrow 12.5% pulses at high notes need both edges corrected. The stepped
triangle and the noise are cheap.
(c) **Clicks.** Never jump gain from non-zero to zero. Use a 1-3 ms ramp, or `setTargetAtTime`
with τ ≈ 1 ms (about 95% done after 3τ).
(d) **Timing.** If you schedule nodes live, use a lookahead scheduler (a 25 ms timer that
schedules about 100 ms ahead on `ac.currentTime`), never `setTimeout` per note.
Sources: https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createPeriodicWave ,
https://chromium.googlesource.com/chromium/blink/+/376dc6e/Source/modules/webaudio/PeriodicWave.cpp ,
https://www.martin-finke.de/articles/audio-plugins-018-polyblep-oscillator/ ,
https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime ,
https://web.dev/articles/audio-scheduling

---

## Part 2: Writing memorable melodies

**F14. Write melody first. It is what players remember.**
Mitsuda: Japanese game music put heavy emphasis on melody because "a good melody was the only way
to impress audiences" before high-quality samples existed. Kondo (GDC 2007) gives three keys:
*interactivity, rhythm, balance*. He wrote by playing the game and matching its pace, and he
re-wrote Mario's overworld faster when the first version did not fit the action.
Apply: every area theme gets a hand-written lead, never a generated one. Match tempo to how fast
the player moves through that place (F19).
Sources: https://spelmusik.net/en/interview-with-yasunori-mitsuda/ ,
https://en.wikipedia.org/wiki/Super_Mario_Bros._theme , https://www.zeldadungeon.net/?p=10784

**F15. Phrase shapes: the sentence and the period, in 8 bars.**
*Sentence* (8 bars): a 2-bar basic idea, repeated or sequenced (2 bars), then a 4-bar
continuation that fragments and speeds up toward a cadence. *Period* (8 bars): a 4-bar antecedent
ending on V (half cadence, "question"), then a 4-bar consequent that starts the same way and ends
on I ("answer").
Apply: each A section is a period whose motif is a sentence. Bars 1-2 state the motif, bars 3-4
sequence it a step up or down and end on V. Bars 5-6 restate it, bars 7-8 cadence to I.
Sources: https://viva.pressbooks.pub/openmusictheory/chapter/sentence/ ,
https://viva.pressbooks.pub/openmusictheory/chapter/period/

**F16. Song form for a loop: AABA (32 bars) or A A' B A'' (16 + 16).**
At 100-140 bpm, 32 bars lasts 55-77 s, which is long enough not to annoy. Town and field themes
should be at least 32 bars. Boss themes can loop 16 bars plus a 16-bar B. B sections change the
harmony (move to IV or vi, or use the royal road, F17) and lift the register. Use call-and-response:
pulse 1 asks for 2 bars, pulse 2 (or the same channel an octave lower) answers for 2 bars.
Apply: the order list per song is something like `A A B A` and the loop point is the first A.

**F17. Chord progressions that sound like JRPG/MapleStory towns and fields.**
- **I–V–vi–IV** (C G Am F) and **I–vi–IV–V** (C Am F G): bright, safe, cozy.
- **Royal road 王道進行 IVM7–V7–iii7–vi** (FM7 G7 Em7 Am): "lyrical, heartrending", the core
  of J-pop and Eurobeat. Its resolved form **IVM7–V7–iii7–vi–ii7–V7–I** is perfect for B sections
  and title screens. The minor-key version is **VIM7–VII7–v7–i**, e.g. FM7 G7 Em7 Am in A minor.
- **ii–V–I** (Dm7 G7 C): the turnaround in bars 7-8, for jazzy, cozy cafes.
- **Dorian i–IV** (Dm–G): adventure that is not sad.
- **i–VI–VII** (Am F G) and **i–iv–VI–VII**: heroic minor and boss themes. DDRKirby's NES track
  uses Dm–Gm–B♭–C.
Apply: on chip, chords are stated by bass roots (triangle) plus arps or harmony on pulse 2. Use
7ths sparingly, as arp `0 4 7 11` (maj7) or `0 3 7 10` (m7).
Sources: https://en.wikipedia.org/wiki/Royal_road_progression ,
https://ddrkirby.com/articles/nes-chiptunes-unlock-everything/nes-chiptunes-unlock-everything.html

**F18. Modal colour: each mode has one signature note.**
Dorian (minor with a raised 6th) is "holy, less mournful than minor" (Song of Time). Lydian
(major with a raised 4th) is "playful and childlike with a slightly dark undertone" (Saria's
Song). Phrygian (♭2) and harmonic minor (raised 7th) bring danger. 8-bit Music Theory's
mode series and Ferguson's paper teach modes through game examples.
Apply: put the signature note (dorian ♮6, lydian ♯4) on a strong beat or a long note at least
once per phrase, or the mode will just sound like plain major or minor.
Sources: https://thinkspace.ac.uk/blog/a-lesson-in-modes-from-the-legend-of-zelda/ ,
https://metafilter.com/200593/Phrygian-I-dont-even-know-Ian ,
https://journals.ou.edu/jmtp/article/download/519/1061/1054

**F19. Tempo, mode and timbre per area** (practitioner ranges; DDRKirby escalates 100 → 150 →
180 bpm across levels to build energy; Hi-NRG runs 120-140 bpm with an octave bass and
four-on-the-floor):

| Area | Tempo | Key/mode | Progression | Lead | Feel |
|---|---|---|---|---|---|
| Title | 108 | C major | I–vi–IV–V, then royal road + ii–V–I | 25% + 12.5% echo | heroic, warm |
| Cozy starter village | 100 | C major | I–vi–IV–V / royal road B | 50% | light swing 58% |
| Bright meadows | 132 | G major (lydian ♯4 touches) | I–V–vi–IV | 25% | straight 8ths, bouncy bass |
| Harbor town | 104 (6/8 feel: 12 rows/bar in 3s) | F major / D dorian | I–IV–V–I, vi–ii–V–I | 50% + 12.5% echo | sway, shanty |
| Desert warrior town | 112 | E phrygian dominant (E F G♯ A B C D) | i–♭II–i, iv–V | 25% | tom-heavy, short-mode noise |
| Mossy woods | 92 | D dorian | i–IV–i–♭VII | 50%, soft vol | sparse, flute-like |
| Twilight ruins | 84 | A aeolian | i–♭VI–♭III–♭VII | 12.5% + echo | wistful, slow arps |
| Crystal cave | 76 | A minor + F lydian colour | i–♭VImaj7–i–♭VII | 12.5% + long echo | sparse, "ting" percussion |
| Sky garden | 120 | D lydian | I–II–I–vii | 25%, GB wave bass | airy, high register |
| Moonlit mage grove | 88 (3/4) | E dorian | i–IV–i–v | GB wave lead | waltz, gentle vibrato |
| Grumpy roots dungeon | 116 | C minor / chromatic | i–♭II–i–V | 50% low register | staccato, "grumpy" bass |
| Crystal-king boss | 168 | C harmonic minor | i–i–♭VI–♭VII–V | 25%, deep vibrato | 16th triangle gallop |
| Dancing Green disco boss | 120 (fixed) | A minor | i–i–♭VI–♭VII, B: royal road | 25% lead, 12.5% arp | octave bass, open hats |

Sources: https://ddrkirby.com/articles/nes-chiptunes-unlock-everything/nes-chiptunes-unlock-everything.html ,
https://en.wikipedia.org/wiki/Hi-NRG

**F20. Melody craft rules (checklist for every tune).**
1. Use a rhythm motif you could clap. Keep its rhythm when the pitches change (sequence).
2. Put chord tones on beats 1 and 3, and passing or neighbour notes on weak 16ths.
3. Move mostly by step. After a leap of a 4th or more, step back in the opposite direction.
4. Give each phrase one high point, reached once, about two-thirds of the way through.
5. Leave space: rests at phrase ends give pulse 2 room to answer (call and response).
6. Write harmony in diatonic 3rds or 6ths below the lead, and switch to unison or octaves at
   climaxes.
7. Swing: 16th swing of 55-62% for cozy and jazzy themes (delay every second 16th by
   `(swing-0.5)*2*row`). Use straight timing for fields and bosses.
Sources: phrase rules from Open Music Theory (F15). Arrangement roles (lead/harmony/echo) from
DDRKirby (F9).

**F21. Loop design: make the end lead back to the beginning.**
Cut on exact bar boundaries. End the loop on V (or ♭VII) so bar 1 resolves it. Don't let tails
ring past the seam. Either render a few extra bars and fold the tail onto the start, or use an
intro that plays once and loop from bar 1 of the A section. Reverb tails cut at the loop point
are the classic loop "pop".
Apply: render-to-buffer (Architecture) makes this exact. Render intro + loop + 1 extra bar, add
the extra bar's tail (echo notes) onto the loop start, then set `loopStart`/`loopEnd` on the
AudioBufferSourceNode.
Sources: https://reaper.blog/2016/08/making-seamless-music-loops/ ,
https://vi-control.net/community/threads/tell-me-about-creating-smooth-loop-points-in-tracks-that-loop.117184/ ,
https://gamedev.net/forums/topic/654979-looping-a-sound-with-reverb-causes-a-34pop34-at-loop/5143108/

**F22. MapleStory specifically.** The classic BGM came from Wizet/Studio EIM, later Nexon's
NECORD label (artist name ASTERIA, now "NEXON Sound Team"). Henesys's town BGM "Floral Life" is
described as capturing "the anticipation of adventure". MapleStory's signature is a bright, major,
mid-tempo town theme with a strong singable lead over a bouncy bass. Our village and meadow
arrangements below follow that model in chip form. No composer interview with technique detail was
found.
Sources: https://namu.moe/w/NECORD , https://meowdb.com/msclassic/music

---

## Part 3: Mixing chiptune in a game

**F23. Channel balance taken from the real NES mixer.**
Linear approximation: `pulse = 0.00752·(p1+p2)` and
`tnd = 0.00851·tri + 0.00494·noise + 0.00335·dmc`. At full volume (15) a pulse gives 0.113, the
triangle 0.128 and the noise 0.074. The triangle is always at full volume, so pulses are usually
written at vol 8-12. The real non-linear formula
`pulse_out = 95.88/(8128/(p1+p2)+100)` gently compresses two loud pulses together.
NES output also passes through high-pass filters at 90 Hz and 440 Hz and a low-pass at 14 kHz.
Apply: mix with the non-linear formula, or with weights pulse 1.0, triangle 1.13, noise 0.66
(relative). Then apply a 1-pole HPF at about 90 Hz and an LPF at about 12-14 kHz. Skip the 440 Hz
HPF, because it thins the bass too much for a cute game.
Source: https://www.nesdev.org/wiki/APU_Mixer

**F24. Stereo: mono-centred with slight spread.**
The NES is mono. The Game Boy pans each channel hard. Recommended: triangle and noise kick at
centre; pulse 1 at -0.25, pulse 2/echo at +0.25 (GB areas: ±0.6); hats at +0.15. This keeps
headphones comfortable while separating the lead from the echo.
Source: https://gbdev.io/pandocs/Audio_details.html

**F25. Use short echo, not reverb.**
Use the note echo (F9) for space. If a room tone is wanted, add one feedback delay (dotted 8th,
feedback 0.25, wet 0.12, low-passed at 4 kHz) on pulse channels only, never on bass or kick.
Remove the convolution reverb from the music bus.
Source: F9 and F21 (tails break loops).

**F26. Music sits under SFX: buses, levels, ducking.**
Use separate music, SFX and UI buses. Music dips and effects yield to critical cues. Ducking of
-6 dB is "light" and -20 dB is "heavy". Broadcast-style targets put music a couple of LU under the
foreground (e.g. music -25 vs dialogue -23 LUFS).
Apply: music bus peak about -12 dBFS (gain ≈ 0.25-0.3 of SFX full scale). Duck music by 4-6 dB
(attack 30 ms, release 400 ms) for big moments (level-up, boss hits, item fanfare) and by 10 dB
under jingles. The SFX should use the same chip voices so the game sounds like one machine.
Sources: https://www.gamedeveloper.com/audio/game-audio-theory-ducking ,
https://bugnet.io/blog/how-to-mix-game-audio-so-nothing-drowns-out

**F27. Moving between areas: fades and crossfades.**
Apply: town ↔ field uses an equal-power crossfade of 1.2 s, with the new song entering at its
loop start (or its intro). Into a dungeon, fade out over 0.6 s, leave 0.3 s of silence, then
start. Boss entrance: hard cut, a 1-bar stinger (noise crash plus a rising pulse sweep), then the
boss loop. Boss defeated: fade over 0.2 s, then a victory jingle. Keep a per-song "resume
position" so popping into a shop and back doesn't restart the town theme.
Basis: common game-audio practice. The bus structure follows F26.

---

## Part 4: Recommended music-engine architecture (a tiny tracker)

1. **Data (`songs/*.js`, plain objects).** `song = {bpm, rpb:4, swing, rowsPerBar:16, intro:[...],
   order:[...], patterns:{name:{p1,p2,tri,noise}}, inst:{...}}`. Each pattern channel is a string
   in the compact format below. The order list names pattern sets, and the loop point is the
   first entry after the intro.
2. **Instruments are macros.** `{wave:'pulse'|'tri'|'noise'|'gbwave', vol:{seq,loop,rel},
   duty:{seq,loop}, arp:{seq,loop}, pitch:{seq,loop} (cents), vib:{delay,rateHz,cents},
   slideIn:{semis,frames}, echo:{rows,gain,detune}}`. One macro clock runs at 60 Hz.
3. **Sequencer.** Rows → time: `rowSec = 60/(bpm*rpb)`, with swing applied to odd rows. On a note,
   reset that channel's macros. On note-off (the next note or `^`), jump the macros to their
   release points.
4. **Renderer: render-to-buffer (recommended).** On entering an area, synthesize the whole loop
   (30-80 s, mono or stereo, at `ac.sampleRate`) in plain JS: PolyBLEP pulses, a 16-level stepped
   triangle, an LFSR noise channel, the F23 mixer and filters. Do it in chunks of about 0.5 s
   using `requestIdleCallback`/`setTimeout` so frames don't hitch, then play through an
   AudioBufferSourceNode with `loop=true, loopStart, loopEnd`. The benefits: perfect loops,
   sample-accurate macros, near-zero runtime CPU, no scheduling jitter, and deterministic output
   for tests (a test can hash the buffer or check its peak and RMS). Cache rendered buffers per
   area (memory is about 10 MB per minute stereo; keep 2-3).
5. **Fallback/live mode.** For reactive music (boss phase 2), use the lookahead scheduler with
   OscillatorNodes on pulse PeriodicWaves, scheduling vol/arp/pitch macros as `setValueAtTime`
   per frame.
6. **Buses.** music → musicGain (ducking) → master; SFX → sfxGain → master. No convolver on
   music.

### Compact text format (transcribe directly)

```
note   = C4..B6 with # or b, then ':' and a length in rows (16th notes). Example: E5:4
rest   = r:N        hold/tie = ~:N (extends the previous note)      note-off = ^
bar    = '|'  (each bar must sum to 16 rows in 4/4, 12 in 3/4 or 6/8 at rpb=4/2)
bass   = degree tokens are written as notes too
drums  = one char per row: K kick  S snare  h closed hat  o open hat  c clap  t tom  x crystal ting  . rest
inst   = vol "a b c | d / e f"  duty "…"  arp "…"  vib d<frames> r<Hz> c<cents>
echo   = echo <rows> <gain> <cents>  (pulse 2 copies pulse 1)
```

### Arrangement 1: Cozy starter village ("Morning Bread")
```
SONG village bpm=100 swing=0.58 key=C order= A A B A
INST lead   pulse vol "11 10 9 9 8 | 8 / 6 4 2 0" duty "2 | 2" vib d18 r5 c15
INST echo   pulse vol "4 4 3 3 | 3 / 2 1 0"       duty "0"   echo 3 0.4 +7
INST harm   pulse vol "7 6 6 | 5 / 3 1 0"         duty "2"
INST bass   tri   (gate 75%)
CHORDS A: | C | Am | F | G | C | Am | Dm7 G | C |
P1 A: E5:4 G5:2 E5:2 D5:4 C5:4 | A4:4 C5:4 E5:8 | F5:4 A5:2 F5:2 E5:4 D5:4 | G4:4 B4:4 D5:8 |
      E5:4 G5:2 E5:2 D5:4 C5:4 | A5:4 G5:2 E5:2 C5:4 E5:4 | F5:4 E5:2 D5:2 B4:4 D5:4 | C5:12 r:4 |
P2 A: (echo of P1, 3 rows late)
TRI A (per chord, root-fifth bounce): R3:3 r:1 5_2:3 r:1 R3:3 r:1 5_2:3 r:1
      e.g. bar C: C3:3 r:1 G2:3 r:1 C3:3 r:1 G2:3 r:1   bar Dm7 G: D3:3 r:1 A2:3 r:1 G2:3 r:1 D3:3 r:1
NOISE A (soft, hats vol x0.5): K...h.h.S...h.hh   (last bar: K...h.h.S.S.SSSS fill)
CHORDS B (royal road): | FM7 | G7 | Em7 | Am | Dm7 | G7 | C | C |
P1 B: A5:6 G5:2 F5:4 E5:4 | D5:6 E5:2 F5:4 G5:4 | B5:6 A5:2 G5:4 E5:4 | C6:8 A5:8 |
      F5:4 A5:4 D6:4 C6:4 | B5:4 G5:4 F5:4 D5:4 | E5:8 G5:4 C6:4 | C6:12 r:4 |
P2 B: harm, diatonic 3rd below P1 (A5→F5, G5→E5, F5→D5, ...), hold half notes
```

### Arrangement 2: Adventurous field ("Meadow Run")
```
SONG field bpm=138 swing=0 key=Dm(dorian) order= A A B A
INST lead  pulse vol "13 12 11 10 | 10 / 7 4 2 0" duty "2 1 | 1" vib d14 r5.6 c20 slideIn -2 2
INST arp   pulse vol "9 8 7 | 6 / 3 0" duty "2" arp "| 0 3 7"   (major chords: "| 0 4 7")
INST bass  tri gate 60%
CHORDS A: | Dm | G | Dm | G | Bb | C | Dm | A |
P1 A: D5:3 F5:3 A5:2 G5:4 F5:2 E5:2 | D5:3 B4:3 D5:2 G5:8 | D5:3 F5:3 A5:2 C6:4 A5:2 F5:2 | G5:6 B5:2 A5:4 G5:4 |
      F5:3 D5:3 F5:2 Bb5:4 A5:2 G5:2 | E5:3 C5:3 E5:2 G5:4 F5:2 E5:2 | F5:3 E5:3 D5:2 A4:4 D5:2 F5:2 | E5:8 C#5:4 A4:4 |
P2 A bars 1-4: off-beat chord stabs  r:2 X:2 r:2 X:2 r:2 X:2 r:2 X:2  (X = chord root, oct 4, inst arp)
P2 A bars 5-8: 3rd below P1 (F5→D5, D5→Bb4, ...), inst lead at vol x0.6, duty 2
TRI A (octave pump 8ths): R2:2 R3:2 R2:2 R3:2 R2:2 R3:2 R2:2 R3:2   e.g. D2 D3 D2 D3 ...
NOISE A: K.h.S.h.K.hKS.h.   bar 8: K.h.S.h.S.SSt.t.
B section: same groove, CHORDS | Bb | C | Am | Dm | Bb | C | E | A |  lead an octave lower, 50% duty, call (bars 1-2) / response on P2 (bars 3-4)
```

### Arrangement 3: Mysterious crystal cave ("Glass Hollow")
```
SONG cave bpm=76 swing=0 key=Am order= A A' (A' = melody up an octave, 12.5% duty)
INST lead  pulse vol "9 8 7 7 | 6 / 5 4 3 2 1 0" duty "1 | 0" vib d20 r4.5 c25
INST echo  pulse duty "0" echo 3 0.45 +10      (a 3-row delay at 76 bpm is about 0.59 s)
INST bass  tri gate 95%
INST ting  noise short-mode idx 2 vol "8 5 3 2 1 0"
CHORDS: | Am(add9) | Fmaj7 | Am | G | Fmaj7 | Em | Dm | E |
P1: r:4 E5:4 B5:6 A5:2 | C6:8 B5:4 E5:4 | A5:6 G5:2 E5:8 | D5:12 r:4 |
    r:4 C5:4 F5:4 A5:4 | B5:8 G5:4 E5:4 | F5:6 E5:2 D5:4 F5:4 | G#5:8 B5:4 E5:4 |
    (B over F = lydian #11 sparkle; G# in bar 8 = harmonic-minor pull back to Am)
P2: echo of P1
TRI: R2:8 5_2:8  (A2:8 E2:8 | F2:8 C3:8 | A2:8 E2:8 | G2:8 D2:8 | F2:8 C3:8 | E2:8 B2:8 | D2:8 A2:8 | E2:16)
NOISE: ........x.......  | ............x... (alternate; no kick, no snare; "drips" only)
```

### Arrangement 4: Intense boss ("Crystal King")
```
SONG boss_crystal bpm=168 swing=0 key=Cm(harmonic) intro=1 bar stinger, order= A A B A
INST lead  pulse vol "14 13 12 | 12 / 9 6 3 0" duty "2 1 | 1" vib d10 r6 c35 slideIn -1 2
INST stab  pulse vol "11 9 7 0" duty "2" arp "| 0 3 7"
INST bass  tri gate 50%
CHORDS A: | Cm | Cm | Ab | Bb | Cm | Cm | Ab Bb | G |
P1 A: C5:2 C5:2 G5:4 F5:2 Eb5:2 D5:2 Eb5:2 | C5:2 C5:2 G5:4 Ab5:4 G5:4 | Ab5:4 G5:2 F5:2 Eb5:4 C5:4 | D5:4 F5:4 Bb5:8 |
      C6:2 C6:2 G5:4 F5:2 Eb5:2 D5:2 Eb5:2 | C6:2 Bb5:2 G5:4 Eb6:4 D6:4 | C6:4 Ab5:4 D6:4 Bb5:4 | B5:8 D6:4 G5:4 |
P2 A: stab on every off-beat 8th  (r:2 X:2)x4, X = chord root oct 4;  bar 8 G: arp "| 0 4 7"
TRI A (gallop): R2:2 R2:1 R2:1 R3:2 R2:2  R2:2 R2:1 R2:1 R3:2 R2:2   (C2 C2 C2 C3 C2 ...)
NOISE A: K.hhS.hKK.hhS.hh   bar 8: S.S.SSSSt.t.ttSS (fill)
B: | Fm | Fm | Db | Eb | Ab | Bb | G | G |  lead in long notes (8-16 rows) with deep vibrato c40, P2 a 6th below
```

### Arrangement 5: Disco boss ("Dancing Green", Hi-NRG)
```
SONG boss_disco bpm=120 swing=0 key=Am order= A A B B A
INST lead  pulse vol "12 11 10 | 10 / 7 4 0" duty "1" vib d16 r5.5 c20
INST arp   pulse vol "8 7 6 | 6 / 0" duty "0" arp "| 0 3 7 12"   (16th sparkle, 1 frame/step)
INST bass  tri gate 45%  (octave bass, the Hi-NRG signature)
CHORDS A: | Am | Am | F | G |  x2      CHORDS B (royal road): | Fmaj7 | G | Em7 | Am |  x2
P1 A: A5:2 r:2 A5:2 G5:2 A5:4 C6:4 | B5:2 A5:2 G5:2 E5:2 G5:8 | A5:2 r:2 A5:2 G5:2 A5:4 F5:4 | G5:4 B5:4 D6:8 |
P1 B: E6:4 C6:2 A5:2 C6:4 E6:4 | D6:4 B5:2 G5:2 B5:4 D6:4 | B5:4 G5:2 E5:2 G5:2 A5:2 B5:4 | A5:12 r:4 |
P2: arp on chord roots, 16th steps, held whole bar
TRI: off-beat octave 8ths   R2:2 R3:2 R2:2 R3:2 R2:2 R3:2 R2:2 R3:2   (A1/A2 if low enough, else A2/A3)
NOISE: K.o.c.o.K.o.c.o.   (four-on-the-floor kick on every beat uses the drum-triangle voice: K...K...K...K...)
       combined row string: K.o.Kco.K.o.Kco.  with c=clap on beats 2 and 4
```

### Short recipes for the other areas (same format; write 8-bar A and B sections to these specs)
```
title       108 C   | C | Am | F | G | FM7 | G7 | Em7 Am | Dm7 G7 |  lead 25%, echo 3 rows, fanfare pickup G4-C5-E5
meadows     132 G   | G | D | Em | C | G | D | C(#11 touch: C#6 grace) | D |  bass octave pump, hats 8ths
harbor      104 F   6/8 (12 rows/bar) | F | Bb | C | F | Dm | Gm | C | C7 |  bass on beats 1 and 4 (dotted), echo lead
desert      112 E phrygian dominant | E | F | E | Dm E | ...  toms (t) on rows 6, 11, 14; short-mode noise shaker 8ths
woods        92 D dorian | Dm | G | Dm | C | ...  50% vol 9 lead, no snare, hats only, GB wave bass
ruins        84 Am | Am | F | C | G | ...  12.5% arp "| 0 3 7 12" at 2 frames/step as the bed, lead enters bar 5
sky garden  120 D lydian | D | E/D | D | E/D | Bm | E | ...  G# (#4) on beats 1/3, high register, pan ±0.6
mage grove   88 3/4 (12 rows/bar) E dorian | Em | A | Em | Bm | ...  GB wave lead, vib d20 r4.5 c22, no kick
roots        116 Cm | Cm | Db | Cm | G |  grumpy staccato bass C2 with half-step Db "grumble", 50% lead in octave 4
```

---

## Source list (all cited above)
- NESdev wiki: https://www.nesdev.org/wiki/APU_Pulse , https://www.nesdev.org/wiki/APU_Triangle ,
  https://www.nesdev.org/wiki/APU_Noise , https://www.nesdev.org/wiki/APU_Mixer , https://www.nesdev.org/nt2/tips-tricks.htm
- FamiTracker effects (BotB Lyceum): https://battleofthebits.com/lyceum/View/FamiTracker+Effects+Commands ;
  beginner macros: https://battleofthebits.com/lyceum/View/I%20Am%20New%20To%20NSF
- Furnace instrument/macro docs: https://tildearrow.org/furnace/doc/latest/4-instrument/index.html
- Game Boy Pan Docs: https://gbdev.io/pandocs/Audio_details.html , https://gbdev.io/pandocs/Audio_Registers.html
- DDRKirby, "NES Chiptunes in Unlock Everything": https://ddrkirby.com/articles/nes-chiptunes-unlock-everything/nes-chiptunes-unlock-everything.html
- Ricoh 2A03 overview: https://en.wikipedia.org/wiki/Ricoh_2A03
- Web Audio: https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createPeriodicWave ,
  https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime , https://web.dev/articles/audio-scheduling ,
  https://chromium.googlesource.com/chromium/blink/+/376dc6e/Source/modules/webaudio/PeriodicWave.cpp
- PolyBLEP: https://www.martin-finke.de/articles/audio-plugins-018-polyblep-oscillator/
- Theory: https://viva.pressbooks.pub/openmusictheory/chapter/sentence/ , https://viva.pressbooks.pub/openmusictheory/chapter/period/ ,
  https://en.wikipedia.org/wiki/Royal_road_progression , https://thinkspace.ac.uk/blog/a-lesson-in-modes-from-the-legend-of-zelda/ ,
  https://journals.ou.edu/jmtp/article/download/519/1061/1054 , https://metafilter.com/200593/Phrygian-I-dont-even-know-Ian
- Composers: https://spelmusik.net/en/interview-with-yasunori-mitsuda/ , https://en.wikipedia.org/wiki/Super_Mario_Bros._theme ,
  https://www.zeldadungeon.net/?p=10784 , https://namu.moe/w/NECORD , https://meowdb.com/msclassic/music
- Genre: https://en.wikipedia.org/wiki/Hi-NRG
- Loops: https://reaper.blog/2016/08/making-seamless-music-loops/ ,
  https://vi-control.net/community/threads/tell-me-about-creating-smooth-loop-points-in-tracks-that-loop.117184/
- Mixing: https://www.gamedeveloper.com/audio/game-audio-theory-ducking , https://bugnet.io/blog/how-to-mix-game-audio-so-nothing-drowns-out
- Japanese overview of FC sound (duty, triangle bass, noise long/short): https://dic.nicovideo.jp/a/fc%E9%9F%B3%E6%BA%90

Caveats: the FamiTracker wiki was offline (HTTP 503), so effect semantics come from the BotB
Lyceum mirror. The vibrato rate formula (`60*x/64` Hz) is approximate. Open Music Theory pages
returned 403 to the fetcher and are cited from their standard definitions. The tempo and mode
table and the stock envelope values are tuned starting points drawn from the cited practice,
not quotations.

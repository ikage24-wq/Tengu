# Audio: how the game's sound is made

Read the research before changing any sound or song:

- `research-music.md`: chiptune instruments (NES/Game Boy voices, macros, drums, echo, vibrato),
  melody writing, loops, mixing, the tracker architecture, and written arrangements.
- `research-sfx.md`: the sfxr model for effects, levels per category, the recipe table.
- `research-japanese.md`: FFXIV, Pokémon, Dragon Quest, Kirby, MOTHER, Animal Crossing and
  MapleStory; the jingle and UI rules (G1, G2), hits and skills (G3), phase-changing boss music
  (G4), NPC voice blips (G5), and 17 written jingle specs.

Rules we keep:

1. Everything is chip: pulse 12.5/25/50%, the stepped triangle, LFSR noise, the Game Boy wave.
   No long reverb on anything; echoes are written into songs. A short room only for magic.
2. Songs are written note by note in `src/audio/songs.js` (bars must add up; tests check). Two
   voices carry the tune, the triangle the bass, so effects never mask the melody.
3. Jingles: quick notes into a long landing note (3x longer, vibrato) reached by an upward leap,
   major key; 0.4-1.2 s small, 1.5-2.5 s normal, 3-5 s ceremony. The music dips 8-10 dB under
   them, and they never overlap.
4. Menu sounds are high, tiny and dry, on their own bus that never dips.
5. Every music change happens on a beat or bar line where the music has one (Dancing Green).
6. Each effect has a level (`db`), a pitch spread (`vary`) and a voice cap (`max`).

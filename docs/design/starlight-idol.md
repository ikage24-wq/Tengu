# The Starlight Idol (the Star Witch's healer path; replaces the Shrine Maiden)

The player's picks (2026-11-02): a pop idol on stage, songs that linger, pink and gold, no
summons (the kitsune guardian goes), a gauge built from heals and hits that makes her songs reach
further, and Grand Concert as her finisher. Held to the Wind Dancer standard (CLAUDE.md). Her
gauge is called Applause (Encore is the Wind Dancer's).

## Who she is

A bright young idol whose wand is her microphone. She sings into it held up under her chin
(never across her face), throws her head back on the high notes, bounces on the beat, sways her hips, points the mic at the monsters as the
notes fly, works the crowd with her free hand (a blown kiss, a wave, a hand on her heart) and
ends every big moment on a pose with a wink.

- **Colour:** pink and gold; her lullaby alone is a soft lilac.
- **Shapes:** music notes (single and beamed), hearts, sound waves opening out like ))), staff
  lines in a ring, gold sparkles, and the stage of light with its spotlights.
- **Her mic:** her wand takes an 'idol' finish and is drawn as a microphone: a short gold handle, a
  round pink head with a gold band and a star, ribbons at the neck; a gem and little wings up the
  tiers.

## How she fights

- **Her string (render/moves.js `si*`):** a line sung with a dip on the beat and the mic swung out
  (a note flies), a step and touch (a note on each beat), and the high note: she leans back and
  belts, then throws the mic out as a burst of sound blasts through the line. Pool: a blown kiss,
  singing over her shoulder, an idol jump (heels kicked up), her idol pose (a mic twirl and a hip
  pop with a wink).
- **Commands:** up on her toes singing a note up (up + attack); notes sung down from a hang in the
  air; a rock-star knee slide out of a run.
- **Applause** (her gauge, internally Grace): the crowd cheers her heals most (more for every ally
  they reach), and her songs and notes that land; it fades once the fighting stops. Full (**Live
  Show**): her songs reach half again as far and mend half again as much.
- **Songs that linger** (world/idol.js): each song hangs in the air where she sang it for a while,
  a ring on the ground that works on whoever stands in it every beat; one of each at a time.
  - **Healing Song** (replaces Wishing Star): heals her and the party at once, then keeps mending
    everyone in its ring.
  - **Cheer:** three mic pumps, "hey, hey, HEY!"; everyone in its gold ring hits harder.
  - **Lullaby:** monsters in its lilac ring slow to a sleepy drift and her notes chip at them.
- **Curtain Call:** a deep bow, then she rises with her arms up: every fallen ally nearby gets up,
  and for a while a blow that would knock her out leaves her standing instead (her Encore), once.
- **Grand Concert** (her finisher, full Applause): a stage of light rises under her and the
  spotlights find her; everyone near is healed in full and warded, and three big beats of music
  blast the monsters back.
- **Stage Presence** (passive): magic attack, MP, and every heal she gives mends more.

## Animation rework (2026-11-03)

An audit found her singing never reached the mic: it stayed level at her waist and most moves
barely moved her. She is now re-rigged as a pop idol on stage (render/moves.js `si*`, rig helpers
`SI`, `siPose`, `siFree`, `siHead` at the end of the file):

- **The mic under her chin:** she sings into it held up from a low hand, its head below her mouth
  and in front (never over her eyes); her mouth shapes the words a syllable at a time, a note
  floats over her head, and her face is bright and blushing, never the fighters' scowl.
- **Head back on the high notes:** the high note, the up-cast, the knee slide, the long note of
  Healing Song, Curtain Call and Grand Concert's big note throw her head right back and lean her
  back, up on her toes, free arm flung high.
- **Each figure its own shape and end pose:** a dip and point with her hand on her hip (beat); a
  step and touch, low then high (step); belt then the mic thrown out at full stretch (high note);
  fingertips kissed with the mic dangling, then flung out with a wink (kiss); a pirouette into a
  hip pop that settles on the mic at her chin with a wink (pose); "hey, hey, HEY!" pumps into a
  heels-up jump, landing wide with a hand on her hip (Cheer); a sleepy cradle with her head resting
  on her shoulder (Lullaby); and Grand Concert's run: curled low, sprung up as the stage lifts,
  the intro swayed, a point on the first beat, a pirouette and a high thrust on the second, the
  big note belted, a heels-up leap with the mic high on the third, and a held finale (feet wide,
  mic out high, free arm up, a wink).
- **Idle:** the mic swung by its cord at her side and flicked back up, a point at the crowd with
  a nod and her hand on her hip, and a bar hummed into the mic, swaying (the Star Witch keeps her
  own wand fidgets).
- `tests/anim.test.js` checks the mic reaches her chin, the belts tip her head back, the mic never
  stands up over her face, and every figure ends on its own pose.

## Status (2026-11-02)

Built, replacing the Shrine Maiden in place (the path keeps the `cleric` id and its skill
ids, so saves, Elowen's trial and the dungeon healer seat carry over). She keeps to the wand.

- Moves (render/moves.js): sibeat, sistep, sihigh and the pool's sikiss, sishoulder, sijump,
  sipose; siup, siair, sidash; sisong, sicheer, silullaby, sibow, siconcert.
- Skills (ids kept): Stage Presence (shrinemastery), Healing Song (grandblessing), Cheer
  (idolcheer, new), Lullaby (purification), Curtain Call (resurrection), Grand Concert
  (thousandtorii).
- Effects (tools/fx-art.js): `sinote`, `sibig`, `sihit`, `siwave`, `sisong`, `sicheer`,
  `silullaby`, `sistage`, `siaura`, `embidol`. Icons, the Applause gauge (a note), her aura, sounds.
- Bots: an Idol in the party sings her notes and casts Grand Concert; the dungeon healer sings
  Healing Song and raises the fallen with Curtain Call.
- Removed: the kitsune guardian (her code, drawings, outfits, hair styles and sounds), the Shrine
  Maiden's dances, gohei, torii and purification circle.

## Size, reach and pace pass (2026-11-04)

The player called her clunky, small, slow and not matching her hit areas. Found and fixed:

- **Her effects were drawn a third of their real size.** Her art was authored as if one art unit
  were a game pixel (it is a third of one), so the song rings covered about a third of the ground
  they work on, and her notes, hit marks, sound waves and stage were tiny. They are now redrawn
  larger from the same art (`grown()` in tools/fx-art.js, rendered at the new size, not stretched):
  notes x2, big note and hit mark x1.8, waves x2.4, stage x1.6, song rings x3, and each song ring
  is drawn exactly at its reach (`S.r / 130`), Live Show's doubled reach included.
- **Song rings and the stage lie on the ground under everyone** (`drawGroundFx`), so they never
  wash over her face or the monsters'. The stage rises lower so it doesn't hide her legs.
- **Grand Concert's music visibly reaches the monsters:** each beat sends a blast of sound rolling
  out both ways along the ground to the edge of its reach (`sishock`), and each monster is hit the
  moment the blast reaches it, not on the beat. The bot Idol's concert does the same.
- **Snappier:** her notes fly faster (880, big notes 820), and her songs take less time to sing
  (Healing Song and Lullaby 0.95 s, Cheer 0.8 s, Curtain Call 1.15 s, Grand Concert 2.1 s with
  its beats brought forward).

## Footwork pass (2026-11-04, the player's pick: "more bounce and travel")

Her string and its pool keep their figures but now dance across the stage:

- **Travel:** each step carries her forward as she sings (beat 10, step-touch 14, high note 16,
  kiss 10, over the shoulder 8, idol jump 22, idol pose 12), so a held string moves her into the
  fight instead of planting her.
- **Bounce:** a hop with the back heel kicked up as the mic snaps out (beat), a hop on each step
  (step-touch), a leap forward into the high note's blast, a skip on the blown kiss, a springier
  pirouette and a higher idol jump; bigger hip sways.
- **No frozen holds:** the end poses settle sooner and then groove, two small bounces on the beat
  (`siBounce`), back to still by the end. The string is about a tenth quicker overall.

Her command moves got the same (2026-11-04): the up-cast springs off the ground into a little
jump with her heels kicked up; the air shot winds up before leaning down to sing, legs kicking out
on the snap; the knee slide drops lower, slides further, and pops up out of it into the rock-star
stance. Across every job, a fighting move that ended on a long dead-still hold now settles with two
soft bounces (`frozenTail` and `settle` in render/moves.js).

## Song rings redrawn (2026-11-04, the player: "Idol skills are waaaay too big and bland")

Sized to their reach, the old song drawings (a flat filled disc with notes and hearts drawn on it)
grew with the ring: on full Applause the ring covered most of the screen and its notes came out as
big as she is, soft and blurry, over a flat pink wash. Now:

- **Smaller reach:** Healing Song and Lullaby 110-140 (were 130-170), Cheer 115-150 (140-180),
  and Live Show makes them reach half again as far (was twice).
- **No disc:** a song is a thin glowing staff ring on the ground at its exact reach (`sistaff*`,
  three staff lines with a bright bead running round each) ridden by its little shapes
  (`sibead*`: Healing Song's pink and gold notes and hearts, Cheer's gold stars, notes and hearts,
  Lullaby's lilac moons, sleepy z's and notes), spaced round the edge, each bobbing on the beat and
  twinkling, popping in round the ring as it starts, a few floating up off it. The shapes stay the
  same small, crisp size at any reach (render/warrior-fx.js `songRing`). Her Applause aura uses
  the same ring, small, at her feet.
- Grand Concert's rolling blasts and the cast bursts are smaller too.

## Kit rework (2026-11-06, the player: "rework idol job" — skill kit, animations and effects, the full pass)

Her songs no longer sit still on the ground as rings; each one moves with the show
(world/idol.js). Skill ids are kept, so saves, trials and bots carry over.

- **Center Stage** (grandblessing; was Healing Song; renamed because the Wind Dancer already has a
  Spotlight): she shades her eyes, finds whoever is hurt worst (her or a party member within 380),
  snaps the mic out at them, and a spotlight drops on them: an instant heal, then a heal every
  second for 6-10 s while the light follows them wherever they go. One spotlight at a time. Move
  `sispot`, effect `sispot` (lamp, beam, pool, rising hearts).
- **Hype Wave** (idolcheer; was Cheer): a stadium wave in one body (sink low, arms up and over,
  spring, mic punched out). A crest rolls out both ways along the ground (560 px/s, reach
  260-360); every ally it passes gets the attack lift for 12-20 s, every monster it passes is hit
  and popped up. Move `sihype`, effect `sihype` (curling pink wave with glow sticks).
- **Lullaby** (purification): she hums, then blows softly across her palm; a little sleepy cloud
  drifts to the nearest monster (seeks 360, 70 px/s). Whatever it touches nods off (a short sleep,
  then 4 s before it can again), slows to a drift and is chipped every 0.6 s. Move
  `silullaby` (rewritten), effect `silull`.
- **Medley:** singing a different song from the last one gives +10 Applause.
- **Live Show** now: Center Stage mends half again as much, Hype Wave rolls half again as far, the
  Lullaby cloud is half again as wide.
- **Curtain Call:** same effect; new curtsy (back foot crossed behind, skirt held out, head bowed),
  arms flung wide as the curtains part, a blown kiss and a wink. Effect `sicurtain` (velvet
  curtains behind her, drawn under her).
- **Grand Concert:** same effect; new run: back to the crowd, a wink over the shoulder as the stage
  lifts, a spin into a ta-da, the intro swayed, the mic punched out (beat 1), a hair-whip with the mic
  driven down at the stage (beat 2), the big note belted, a star jump (beat 3), and the mic held out
  to the crowd with her hand cupped at her ear. Pyro (`sipyro`) shoots up at the stage's edges on
  each beat, with confetti.
- **Basic attack pool, three more:** a mic lassoed round at her side on its cord (`sitwirl`), a
  hair flip throwing a fan of three notes (`sihair`), and a heart traced in the air and pushed off
  her palm as a big piercing heart shot (`siheart`, effect `siheart`).
- The old song rings (`songRing`, the staff and bead strips) are kept only for her Star Witch skill
  paths (her ballad) and her Applause aura.
- Effects were rendered with Electron (Playwright isn't installed on this machine), only the six
  new strips, so every other strip stayed byte-for-byte as it was.

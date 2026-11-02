# The Starlight Idol (the Star Witch's healer path; replaces the Shrine Maiden)

The player's picks (2026-11-02): a pop idol on stage, songs that linger, pink and gold, no
summons (the kitsune guardian goes), a gauge built from heals and hits that makes her songs reach
further, and Grand Concert as her finisher. Held to the Wind Dancer standard (CLAUDE.md). Her
gauge is called Applause (Encore is the Wind Dancer's).

## Who she is

A bright young idol whose wand is her microphone. She sings into it held out beside her face
(never across it), bounces on the beat, sways her hips, points the mic at the monsters as the
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
  Show**): her songs reach twice as far and mend half again as much.
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

## Status (2026-11-02)

Built, replacing the Shrine Maiden in place (the path keeps the `shrinemaiden` id and its skill
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

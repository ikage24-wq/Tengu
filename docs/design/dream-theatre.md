# The Dream Theatre: the levels 40-45 group dungeon (design, 2026-11-02)

The seventh group dungeon, after the Candy Volcano (35-40), following the ladder plan
(docs/design/dungeon-ladder.md).

## The story

High in the Sky Garden a theatre floats on a cloud, where whatever is staged becomes real. Its
writer, the Phantom Playwright, has been writing the island into his play, and every night the
audience forgets a little more of who they are. Encore, a retired stage star, has a backstage pass.

## Where

**Theatre Row**, off the far end of the Sky Garden (38-48). **Encore** finds groups. Entry from
level 40; the finder brings players of 40-44.

## The run: a play in acts

Through the lobby, then act by act on a stage whose set changes, then backstage, then the final
curtain.

| # | Room | Shape | Task / gimmick | Set-piece |
|---|---|---|---|---|
| 1 | The Grand Lobby | A long lobby of stairs and balconies | Collect the three lost tickets; **chandeliers of spotlights** sweep the floor (in the light, monsters take more and so do you) | |
| 2 | Act I: The Pirate Ship | A ship set on a rocking stage | **The deck rocks**: everyone slides one way, then the other; cannon fire on marked spots | |
| 3 | Act II: The Fairy Forest | A forest set with four coloured stage lamps | **Puzzle:** the cue lamps flash a sequence; repeat it (a mistake and they play it again) | Puzzle room |
| 4 | Act III: The Masked Ball | A ballroom set, footlights | **Mid-boss: Persona, the Two-Faced Muse** | |
| 5 | Backstage | Ropes, sandbags and rigging | **Mid-boss: Madame Directrice** | |
| 6 | The Final Curtain | The great stage | **Final boss: the Phantom Playwright** | |

## Monsters (levels 40-44), on a new rig

The **stage rig** (render/mobs/stagerig.js): the manor rig played big for the back row. Every move
has a theatrical anticipation (a dip the other way first) and lands in a held pose with an eased
overshoot; a soft spotlight follows each performer on the floor.

- **Understudy Ghost**: a sheet-ghost actress in a blank mask, clutching her script; a dramatic lunge.
- **Chorus Girl**: feather boa and feather fan, sequins; a high kick.
- **Stagehand Imp**: a little horned stagehand in overalls with a wrench and a coil of rope; a wrench bonk.
- **Prima Donna**: an opera singer in a vast gown; her high note rings out in rings.
- **Paper Dragon Dancers**: two dancers under one paper dragon costume (their legs showing); a fire puff.
- **Prompter**: a hooded prompter with cue cards and a little lamp; flings cards.

## Bosses

- **Persona, the Two-Faced Muse** (Masked Ball): she wears Comedy and Tragedy by turns. In Comedy
  she's quick and showers confetti bombs; in Tragedy she's slow, heavy and rains tears, and takes
  more damage. The masks swap every so often, and at half health both at once.
- **Madame Directrice** (Backstage): a director with a megaphone and a beret. "Action!" spotlights
  chase players; "Cut!" stops the scene and everyone is pulled back to their marks; "Take two!"
  sends in Understudies.
- **The Phantom Playwright** (Final Curtain): phase 1 pages of the script rain down; phase 2 the
  curtain sweeps the stage (jump); phase 3 the Plot Twist (the stage spins: left is right, the
  floor's halves swap their danger). Freed at the end: he writes the island a happy ending.

## Rewards and music

Encore Roses (tokens), Lv 45 gear, the **Leading Role** set (a laurel circlet with a star, a
rose-and-ruff collar, a velvet stage cape). Music: "Opening Night" (swing jazz, B-flat, clarinet
over a walking bass) and, for the bosses, "Showstopper" (G minor, big band brass and timpani).

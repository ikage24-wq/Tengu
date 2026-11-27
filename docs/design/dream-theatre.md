# The Dream Theatre: the levels 40-45 group dungeon (design, 2026-11-02)

The seventh group dungeon, after the Candy Volcano (35-40), following the ladder plan
(docs/design/dungeon-ladder.md).

## The story

Since Chapter 9 of the story rework (2026-11-19, docs/design/main-story.md): the theatre floating
on a cloud off the Sky Garden is where the sleeping Queen's dreams drift every night, and the
Phantom Playwright stages them: always the same sad show, her old life in the human world (a packed
train, the office, overtime, noodles at 2 a.m., her flat and Monday), to an audience of one, Elder
Zunda. Every morning the whole island wakes up feeling like it's Monday. Encore, a retired stage
star, has a backstage pass. The Playwright isn't fought any more: he stands in a theatre box at the
side of her flat, and Monday is the last boss. At 12% the Queen sleepwalks in and says "five more
minutes", and Monday (the Weekend-Eating Baku, a girl who ate her weekends) yawns and falls asleep
(world/theatre.js; the fights are built on world/bossfight.js).

The table below is the original 2026-11-02 run. Rooms 2-6 are now: Act I: The Morning Train (the
carriage rocks, bags fall off the racks), Act II: The Office (answer the desk phones in order),
Act III: Overtime (the Coffee Mug Boss), The Convenience Store, 2 a.m. (the Cup-Noodle Dragon), The
Final Curtain: Her Flat (Monday). Since 2026-11-27 every regular is remade from scratch on its own
copy of a blank base (render/mobs/stage.js wires them; the mob ids stay for saves): the train's
monsters are the Commuter Pigeon (paperdragon, render/pigeon/) and the Snooze Snail (sleepysheep,
render/snoozesnail/), the office's the Sticky-Note Sprout (prompter, render/sprout/, paper planes) and
the Paperclip Fiddler (primadonna, render/fiddler/, red tape). The lobby keeps its theatre folk: the
Masquerade Diva (understudy, render/diva/, rebuilt with her idea kept), the Ticket Lop (chorusgirl,
render/ticketlop/) and the Curtain Octopus (stagehand, render/curtain/). (Those six replaced, later
the same day, a first remake that had given them all one upright body: the Toast-Dash Stoat,
Travel-Pillow Sloth, Intern Quokka, Red-Tape Raccoon, Usher Otter and Backdrop Beaver; before that
they were the Rush-Hour Penguin, Sleepy Commuter Sheep, Sticky Note Bird, Stapler Croc, Chorus
Flamingo and Stagehand Mole.)

The three bosses of her dream were remade from scratch on 2026-11-27, each on its own copy of a blank
base with a brand-new FFXIV-style fight (world/theatre.js; their looks in each folder's looks.js):
the Night Manager (render/manager/, grown-up base: a lanky manager in round glasses with a cardigan
over his shoulders, his travel mug and clipboard; Nine to Five, Overtime, One More Thing: Circle Back
in-then-out, Clock Watching TICK-then-TOCK; 700k), the Cup-Noodle Dragon (render/noodle/, serpent base:
a noodle dragon boy rising out of his own cup in a ramen-shop happi; Just Add Water, Three Minutes,
Extra Spicy: SLUUURP pulls you in then he burps, Chopstick Drop: stand where they fell; 680k) and
Monday (render/monday/, kid base: the Weekend-Eating Baku in a navy bolero with the cream baku saddle,
her giant red pen and Saturday's cookie; Good Morning, Rush Hour, Always Monday: the Calendar, stand on
the weekend; 740k, her ending kept at 12%).

(Original premise: its writer, the Phantom Playwright, was writing the island into his play, and
every night the audience forgot a little more of who they were.)

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

## The 2026-11-03 redraw

The players and bosses were redrawn creature-first (render/mobs/stage.js and stageboss.js),
retiring the costumed girls on the stage rig: a sheet ghost in a comedy mask, a flamingo showgirl,
a mole stagehand with a wrench, a diva frog whose high note rings out, a chibi paper-lantern dragon
and a hooded prompter bat. Persona is a cat split gold and blue holding Comedy and Tragedy, Madame
Directrice a parrot in a beret with a megaphone and clapperboard, and the Phantom Playwright an ink
phantom rising out of a giant inkwell with a great quill. Each stands in its own spotlight.

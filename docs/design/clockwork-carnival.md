# Clockwork Carnival: the levels 25-30 group dungeon (design, 2026-11-02)

The fourth group dungeon, after the Sunken Aquarium Palace (20-25), following the ladder plan
(docs/design/dungeon-ladder.md).

## The story

Past the last torii of the Fox Shrine Path, a fairground appears every night that nobody built: a
wind-up carnival whose toys never stopped playing. Its owner, the Grand Automaton Queen Gearheart,
was wound so tight a century ago that she can't stop, and every toy in her carnival dances to her
spring. Tock, a runaway tin soldier, has slipped out to find help.

## Where

The **Carnival Gates**, off the end of the Fox Shrine Path (23-27), lit with paper lanterns and
string lights. **Tock the tin soldier** keeps the gate and finds groups. Entry from level 25; the
finder brings players of 25-29.

## The run: a loop through the rides

Not a climb (the Hollow), a house tour (the Manor) or a dive (the Palace): a ring around the
fairground, ride to ride, ending back at the gates.

| # | Room | Shape | Task / gimmick | Set-piece |
|---|---|---|---|---|
| 1 | The Midway | Side by side, stalls and the carousel | **Carousel horses** ride up and down a lane (moving ledges); wind the three music boxes | |
| 2 | The Funhouse | A tall maze of springs | **Springboards** throw you between floors; pop the five prize balloons up high | Puzzle-ish |
| 3 | The Coaster Yard | A long low yard under the tracks | **The coaster** runs the ground track on a timer, both ways (get up on the platforms when the rail lights up); clear the yard | |
| 4 | The Big Top | A round ring, trapezes overhead | **Mid-boss: Leonie, the Lioness Acrobat** | |
| 5 | The Toy Workshop | Floors of conveyor belts | **Conveyors** carry you along; **mid-boss: Madame Marionette** pulls strings | |
| 6 | The Ferris Wheel | The plaza under the wheel | **Final boss: Queen Gearheart, the Grand Automaton** | |

## Monsters (levels 25-29): Queen Gearheart's wind-up troupe

Remade from scratch on 2026-11-26 (see the section at the end), each on its own copy of a blank
base, wired in render/mobs/toy.js. One carnival troupe, each its own act: every toy but the puppet
has a brass wind-up key turning in its back (faster in a fight, slower when hurt, still when beaten),
every one has a ~30 s idle act and, true to the story, a moment in it where it would really rather
rest, until someone is watching.

- **Giraffe Ballerina** (`musicballerina`, the Midway): Clara, the music box's prima, in a pink
  leotard and tutu on her pointe shoes. Grand Jeté, Fouetté (a full turn), Arabesque Headbutt (her
  long neck swung down).
- **Koala Balloonist** (`balloonseller`, the Midway and the Funhouse): Mabel, a sleepy koala in mint
  dungarees and a boater, five balloons bobbing over her. From afar a balloon let go at you
  (Balloon Pop); up close Bunch Bonk and Dozy Headbutt.
- **Cymbal Monkey** (`tindrummer`, the Midway and the Coaster Yard): Bingo, the band's wind-up cymbal
  man in a fez and a teal vest. From afar a CRASH that rolls a ring of sound; up close Cymbal Clap
  and Cymbal Spin.
- **Boxing Kangaroo** (`jackbox`, the Funhouse and the Coaster Yard): Jacky in satin shorts and red
  gloves, and her joey who pops out of her pouch like a jack-in-the-box. One-Two, Tail Kick, Pop
  Goes the Joey.
- **Harlequin Puppet** (`marionette`, the Funhouse; Madame Marionette's adds): Dot, a wooden
  harlequin danced on strings from a cross floating over her. String Kick, Pirouette Slap, Bell Bonk.
- **Hippo Strongman** (`teddystrong`, the Coaster Yard): Hugo in a striped strongman suit, a barbell
  in both paws. Barbell Slam (the troupe's longest wind-up), Belly Bump, Big Yawn.

## Bosses

- **Leonie, the Lioness Acrobat** (Big Top; remade 2026-11-27, render/leonie/): the troupe's star,
  a honey lioness in a scarlet spangled leotard, a gold-lined cape and a feathered tiara, with the
  troupe's brass key in her back. Her entrance: swinging high over the ring by her knees on a
  trapeze, a triple somersault down into the spotlight, ta-da. Her act in three parts, every cast
  named on the cast bar with its own look: the Warm-Up (Juggling Pins, a spread; Flying Leap, a
  tank buster; Human Pyramid!, a stack; Cartwheel Run, a band from her to the wall she's facing),
  the Trapeze at 66% (The Big Swing, a ring to stand inside; Spotlights, one on each of you), and
  the Grand Finale at 33% (Human Cannonball, three marks in turn; Standing Ovation, the whole room).
- **Madame Marionette** (Workshop; remade 2026-11-27, render/marionetta/): the first of the Workshop's
  harlequins, a tall porcelain puppeteer who worked her own strings loose: plum hair in a high
  ponytail, a tiny top hat, a harlequin tailcoat in the harlequins' mint, lilac and cream, striped
  stockings, a wooden cross in each hand, a brass key in her back. Her entrance: slumped like a
  lifeless puppet among the half-built ones, her old strings pull her up limb by limb, and she snips
  them away herself. Her fight: the Rehearsal (Strings Attached, a spread; Crossbar Rap, a tank buster;
  Snip Snip!, get out of her scissors; Tie a Bow, a stack), the Puppet Show at 66% (she cuts two
  Harlequin Puppets loose on the belts, again with Cut Loose! whenever they're down: bring them all
  down and their strings snap back on her, open to a hit; Jump Rope!, the whole floor twice: jump it),
  and Dance for Me! at 33% (Tug of War, one side of the floor then the other; Curtain Call, everyone;
  Double Dutch!, the rope three times).
- **Queen Gearheart, the Grand Automaton** (Ferris Wheel; remade 2026-11-27, render/gearheart/): a tin
  wind-up mouse queen in cream enamel, a gold cog crown, a teal bodice with a ticking clock face at her
  heart, a rose ruffled skirt, heel wheels, a pinwheel sceptre and the great brass key that winds the
  whole troupe. Her entrance: still performing for Elder Kuri, she spots more audience and cranks her
  own key. Her fight: Wind-Up (Cog Toss, a spread; Royal Tap, a tank buster; Twelve O'Clock, a clock
  face round her: get out; Wind Me Up!, three Brass Moles (render/gearmole/, little tin moles) pop up
  from the plaza's holes to wind her: bop them all and she runs down, open to a hit; miss one and she's
  overwound, everything harder for a while), the Music Box at 66% (Music Box Melody, the floor a strip
  at a time; Duet, a stack) and the Last Waltz at 33% (Springs Loose!, the whole room; a longer, faster
  melody). Wound down at the end, not destroyed: she sits down beside Elder Kuri and her key stops.

## Rewards and music

Golden Tickets (tokens), Lv 30 gear, the **Harlequin** set (a jester cap with bells, a ruffle
collar, a diamond-patterned cape). Music: "Calliope Swing" (a swinging fairground march, F major,
glockenspiel and brass) and, for the bosses, "Overwound" (D minor, a xylophone polka driven hard).

## The 2026-11-03 redraw

The monsters and bosses were redrawn toy-first (render/mobs/toy.js and toyboss.js), retiring the
costumed girls on the tall rig: a mouse ballerina on her music box, a tin drummer rabbit, a
jack-in-the-box clown, a wooden puppy marionette, Teddy Strongbear with his barbell, and a
balloon-animal poodle under her balloons. Leonie is a chubby lion on a circus ball with a flaming
hoop, Madame Marionette a velvet spider puppeteer with puppets on her strings, and Queen Gearheart a
grand clockwork owl with a crown of gears and a clock-face belly. Every toy has a turning wind-up key.

## The 2026-11-26 troupe

The six regular monsters were remade from scratch as new creatures and characters (the old toy
rigs, render/mobs/toyrigs.js, retired), each on its own copy of a blank base in its own folder
(render/musicballerina/, balloonseller/, tindrummer/, jackbox/, marionette/, teddystrong/): the
Giraffe Ballerina, the Koala Balloonist, the Cymbal Monkey, the Boxing Kangaroo, the Harlequin
Puppet and the Hippo Strongman. Their own faces and eyes, worn clothes cut from their own outlines,
an idle act each and two or three real moves. The bosses followed from 2026-11-27, one at a time, each
with a brand-new fight (Leonie, Madame Marionette, then Queen Gearheart and her Brass Moles).

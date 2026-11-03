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

## Monsters (levels 25-29), on a new rig

The **toy rig** (render/mobs/toy.js): the manor rig's skeleton driven by clockwork timing. Poses
tick from key to key with a quick move and a little overshoot that settles (never a snap: the
overshoot is eased), a wind-up key turns in every toy's back, and it slows when hurt.

- **Music Box Ballerina**: twirls on a pin atop a music box she rides like a cart; a spinning kick.
- **Tin Drummer Girl**: a marching drummer in a shako, knees high; a drumstick flurry.
- **Jack-in-the-Box Jester**: a jester on a spring coming out of her box; boings forward and bonks.
- **Marionette Dancer**: hangs from strings off a cross-bar above her, dangling, toes trailing;
  jerky kicks.
- **Teddy Strongwoman**: a girl in a teddy-bear suit with a barbell; a heavy overhead slam.
- **Balloon Seller**: floats on a bunch of balloons; pops one at you.

## Bosses

- **Leonie, the Lioness Acrobat** (Big Top): a lion-girl acrobat. She leaps up to the trapezes and
  pounces down on a marked spot, sets fire hoops in a line along the ring, and roars (everyone is
  pushed back).
- **Madame Marionette** (Workshop): a tall puppeteer with a cross-bar in each hand. She marks a
  player with her strings and yanks them across the floor to her; she cuts loose puppets (adds) on
  the conveyors; at half health she dances the strings across the floor (lines to jump).
- **Queen Gearheart, the Grand Automaton** (Ferris Wheel): a clockwork queen with a great key in her
  back. Phase 1 gear saws roll across the plaza; phase 2 the wheel's cars drop on marked spots; phase
  3 Overwound, she spins faster and faster (sweeps). Wound down at the end, not destroyed: she
  finally rests, and the carnival plays one last slow tune.

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

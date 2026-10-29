# Spirit Mage paths at level 30: the plan

The Spirit Mage branches at 30, after Elowen's trial, like every other first job. Built the way
`making-a-job.md` says (research, combat, animation, effects, everything else, show it), with
the player checking in at each choice with options and GIFs. Everything is new art and new rigs:
no companion reuses Snow wolf's or the player's skeleton, and nothing spins (a turn is a mirror
flip). The player's choices so far are marked **(chosen)**.

## The 30 trial (Elowen)

A shrine at night in Moonleaf Grove: the lanterns have gone out and restless spirits gather. She
dances to light the lanterns one by one while the doll keeps the spirits off her; the last lantern
lit, the spirits settle, and the two paths are offered at the shrine gate.

## Shrine Maiden: full support

- **Fantasy:** the shrine's own priestess. Heals, wards and blessings that carry a party; her
  damage is light, her dance even slower and grander (two fans, ribbons of light).
- **Colour and shapes:** warm white and vermilion with gold: torii gates of light, sakaki leaves,
  bell ropes. Her own, not the Paladin's gold star.
- **Companion (chosen): a kitsune shrine guardian.** A tall, serene fox-eared woman in shrine
  armour with a naginata and two (later more) tails of soft fox fire. She stands in front of the
  party, guards, taunts and sweeps the naginata, while the Maiden heals from behind; she bows to
  the Maiden after a fight. Her own skeleton (tall, long-limbed, tails as springs), her own AI.
  *Built:* "Silver Moon", on the player character scaled up, in a shrine queen's crimson robes
  (gold obi, gold hair ornaments), narrow-eyed and bored, a cold warlord's stance with a huge
  god's naginata (ivory and gold, a sun-disc halo, a glowing blade) held out at her side. She only ever walks, slowly; left far behind, she vanishes in
  vermilion fox fire and steps out of it at the Maiden's side (no leaps). Seven weapon moves
  (Thrust, Sweep, Rising Cut, Twin Strike, Cleave, Low Reap, Haft Strike) and three skills of her
  own on cooldowns: Moonfall (raises and charges the naginata, a vortex drags monsters in, then
  one crushing blow), Crescent Moon (a huge cut leaving a crescent of moonlight in front of her) and
  Hundred Thrusts; plus Fox-Fire Call and Guard. No range attacks: everything is the naginata.
- **The doll grows up (chosen):** the doll grows up into the kitsune guardian herself. A Shrine
  Maiden has no doll of her own any more (world/spiritdoll.js dollGrownUp): the guardian is her
  doll, grown. (The player corrected the first plan, a separate fox kit doll, on 2026-10-29.)
- **Gauge:** a shrine's **Grace**: builds from heals and wards landing, faster the more allies
  they reach; full, every heal also wards.
- **Skills (to pick from with the player):** a great Blessing over the whole party, Torii Gate (a
  gate of light the party walks through for a shield and a cleanse), Purification (clears
  debuffs, burns monsters standing in it), the Guardian's Oath (the kitsune takes hits for an ally),
  Resurrection Dance, a mastery; the finisher **Thousand Torii**: a corridor of torii gates of light
  across the screen, healing and shielding everyone, the kitsune dashing through it striking
  every monster.
- **Party role:** the healer's seat, and better at it than the first job.

## Onmyoji: damage

- **Fantasy:** the spirit-binder who fights with a rowdy troupe of yokai she keeps in line with
  talismans. She casts with ofuda and seal hand-signs; her dance turns sharp and commanding.
- **Colour and shapes:** indigo night and talisman red with paper white: ofuda, the five-pointed
  seiman star, ink brush strokes. (Not the Shinobi's ink seals: hers are star seals and paper.)
- **Companions (chosen): a yokai troupe, always out and fighting on their own (chosen).**
  - **Oni:** a big, cheerful red oni with an iron club; slow, huge swings, ground pounds, and he
    sulks when he misses.
  - **Yuki-onna:** a calm, aloof snow woman; ice breath and frozen needles from a distance, and
    she freezes the others when they bicker.
  - **Tengu (the last; the player swapped him in for the kappa and the karakasa, 2026-10-29):** a
    handsome, smug mountain tengu a little taller than the Onmyoji, dressed as a yamabushi, with
    crow wings, a feather fan and a sword.
  Each has their own skeleton, look, moves, idle bits and personality, and they bicker and
  cheer each other between fights.
  - **How they're built (the player's rule):** each on the player character, with a new rig, new
    animations, new clothes and new hair of their own (nothing reused from the creator, the
    guardian, the doll or Snow wolf).
  - **Sizes (chosen): each its own, by what it is:** the oni big and broad (bigger than the
    guardian), the yuki-onna about the Onmyoji's own size (a touch taller; the player didn't want her big), the tengu a little taller than the
    Onmyoji.
  - **Order:** the oni first (designs on her real body to pick from, then her rig and moves).
  - **The oni is built and approved** (world/oni.js, render/oni.js): a lazy slouch and stroll, ten
    bored idle moods, and six moves from how oni fight: Kesagiri (a chain of heavy swings that
    catch behind her, then an overhead finisher), Grab & Slam, Stomp, Charge, Whirl and Roar (her
    fury: faster, burning). Heavy timing, impact bursts, a rebound, a club trail; a sulk when she
    whiffs and a smirk when her target drops.
  - **The yuki-onna's look (chosen 2026-10-29, render/yuki.js YUKI_LOOK):** about the Onmyoji's size;
    white hair in an icicle bun with blunt bangs (no forehead shade or shine: they read badly on
    white), white-lashed veiled eyes, pale blue lips, and the spirit-flames kimono (white, pale blue
    hitodama rising from a hem that fades into mist, no feet).
  - **The yuki-onna is built and approved** (world/yuki.js, render/yuki.js): she floats, a frost
    aura round her and frost prints where she drifts; her moves come from the legends and the
    games: White Breath (Hearn's "bright white smoke", from her lips), Answer Me (a soul drawn out
    that heals the Onmyoji), Ice Spikes, Icicle Fall (shatters the frozen), Whiteout (leads them
    astray), a snowball, needles and Into the Mist. Her cold builds on a monster till it freezes.
  - **The tengu is built** (world/tengu.js, render/tengu.js): his look (TENGU_LOOK) is side-swept
    black hair with a crow's blue sheen, cut short and tapered at the back, sharp smug crimson eyes, a man's brow, a smirk, the black
    yamabushi kimono with white pompoms, a crimson obi, slate hakama, one-toothed geta, the tokin
    cap (the player had the tengu mask taken off); crow wings, a feather fan and a tachi
    drawn in hand. He strolls fanning himself and flies when the way is long or up a ledge. His
    moves, from the tengu of the stories: Iai, the Kurama Blade (Yoshitsune's teacher), Fan Gust,
    Tengu Wind, Feather Storm, Tengu Stones (tengu-tsubute) and Spirited Away (kamikakushi). Six
    smug idles; a grin when he wins, a 'tch' when he misses.
  - **The oni's look (chosen 2026-10-29):** a cute-and-badass oni girl on the player character, red
    skin, a jagged silver bob, droopy heavy-lidded gold eyes, a bored face (a flat mouth with one
    fang), a dark-and-gold diamond on her brow, crimson horns, a black battle kimono lined crimson
    (spiked pauldron, bandaged forearms, crimson obi and chain, a big bow, a gold bell, tall geta)
    and a huge spiked crimson club with glowing engravings (render/oni.js ONI_LOOK). Her other bored
    faces become idle moods (side-eye, gum bubble, toothpick, kiseru pipe, deadpan, sigh,
    unimpressed).
- **Her skills command them all at once (chosen):** e.g. Talisman Storm (her own big attack),
  Rally (they all charge one target together), Night Parade (they rampage across the screen in a
  line), Seal (she pins a monster with a star seal for them to pile on), a mastery; the finisher
  **Hyakki Yagyo**, the Night Parade of a Hundred Demons: a procession of yokai lanterns and
  spirits floods across the screen behind her troupe, trampling everything.
- **The doll grows up (chosen):** into a little imp of the troupe, the yokai's ringleader in a
  paper mask, who eggs them on and starts the fights.
- **Gauge:** **Binding**: builds as the troupe's hits land; full, the troupe goes wild (faster,
  bigger moves) until she spends it.
- **Party role:** DPS.

## Order of work

1. The trial quest and the path choice (both paths stubbed so they can be picked).
2. Shrine Maiden: the kitsune guardian first (rig, look, moves, AI; GIF check-ins on her design
   and moves; she is the doll grown up), then her dance, gauge, skills and finisher.
3. Onmyoji: one yokai at a time (rig, look, moves, personality; GIF check-ins), then the imp doll,
   then her dance, gauge, skills and finisher.
4. Wiring for both: sounds, bots, party roles, dungeon roles, tests, README and art notes, demo
   videos.

## Questions to ask the player along the way

- Designs for the kitsune guardian and each yokai (a sheet of options each, before building).
- Each path's skill list and finisher (options to pick from).
- Colours, if the ones above don't land.

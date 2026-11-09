# The Mochi: Wagashi Sprites

Started 2026-11-09. A pet-raising side game with the same kind of loop as Sonic Adventure 2's Chao
Garden (raise, evolve, race, breed), but every creature, name, place and course is our own. The
Mochi are little spirits born from fresh-pounded mochi, built on the hero's body like every
companion. Looks code: `src/data/mochi-genes.js` (the rolls), `src/render/wagashi.js` (looks, coats,
eggs), `src/render/hair.js` and `src/render/hero.js` (the Mochi's own hair, eyes, mouths, brows),
`src/render/jobgear/mochi.js` (the smock and the hood dress-up). Preview: `tools/wagashi-sheet.html`.

## Built: the looks (2026-11-09)

Every egg rolls its Mochi from a seed, so an egg's contents are fixed from the moment you get it.
Every part rolls on its own, and nothing is linked, so any hair goes with any face and any
personality.

| Part | Pool |
|---|---|
| Hairstyle | 64, each named for a sweet (daifuku bun, dango tail, kakigori heap, onigiri...) |
| Fringe | 32, on any hairstyle |
| Hair colour | 28 sweet colours; two-tone 18% |
| Eye shape / colour | 32 / 16; odd-coloured eyes, star and heart pupils are rare |
| Mouth | 32 |
| Brows | 16 |
| Cheek marks | freckles, swirl, dimples; a star or heart mark is rare |
| Dough (skin) | 11 common, 6 bold (6%), 4 pretty rares (1.5%: pearl, strawberry red, peach, snow) |
| Mood sprout | grows from the head and acts out the mood; leaves: round, point, ginkgo, clover, bud, heart, blossom, gold |
| Personality | 32; sets the standing pose and the sprout's resting mood |
| Talents | a starting grade E to S for Run, Fly, Power, Stamina and Swim |
| Sweets | a favourite and a hated one, out of 16 |
| Voice | one of 8 chirp styles, at its own pitch (sounds not cut yet) |

**Rarity tiers** (a Mochi's tier is its rarest gene):

| Tier | Coats and genes |
|---|---|
| Uncommon | two-tone hair, clover or bud sprout, a bold dough |
| Rare | Shiny (2%), Two-Flavour (1.5%), odd eyes, star or heart pupils, heart sprout, star or heart cheek mark, a rare dough |
| Epic (1 in 300 each) | Candied, Gold Leaf, Glass Jelly, Sakura Storm; or a blossom sprout |
| Legendary (1 in 2,000 each) | Moonlit, Hanabi, Radiant (Halo Dawn on the angel path, Ember Spice on the demon one) |
| Mythic (1 in 10,000) | Kohakutou: crystal candy hair turning through jewel colours, candy crystals circling |
| Mutation (1 in 30,000 each) | Black Sesame, Brown Sugar, Midnight, Red Plum, Deep Sea: a whole new colour, their own mark, an S in every stat |

**Eggs** are a mochi ball in a little wooden mortar. The ball takes a blush of the hair colour
inside, stronger the rarer it is. Rare eggs glint now and then, and epic ones often. Legendary,
mythic and Mutation eggs sit in a gold-banded mortar and glow.

No hats by default: the six hoods drawn first (baby, Dango Runner, Warabi, Sakura, Kagami, Monaka)
are dress-up.

## Stats, levels and grades (decided 2026-11-09)

Five stats: Run, Fly, Power, Stamina, Swim. Like a Chao Garden:

- **Every stat levels from 1 to 99**, by training, sweets and play. Nothing caps the level.
- **The grade (E to S) decides how much each level adds** to the stat's points: about 10 a level
  for E, 13 for D, 16 for C, 19 for B, 22 for A and 25 for S. At Lv 99 an E stat sits near 990 points
  and an S near 2,475, so the grade is how far that stat can ever grow (its top speed).
- **Grades can rise** on evolving and on rebirth, so a later generation can grow further. Mutations
  are born S in everything.
- **How it moves follows the points,** in six styles per stat, each funnier and more skilled:

  | Points | Run style | Reached at Lv 99 by |
  |---|---|---|
  | 0 | waddle: little hops, arms out for balance | |
  | 300 | trot: a bouncy, happy jog | |
  | 700 | run: a natural steady run, a light lean | E |
  | 1,100 | sprint: long bounds, dust kicked up | D, C |
  | 1,600 | power sprint: deep lean, knees driving, arms pumping hard | B |
  | 2,100 | ninja dash: bent right over, arms back, speed lines, after-images | A, S |

  Swim, Fly, Power and Stamina get six styles each the same way (swimming ends in a lazy backstroke).
- **Acting while running:** every few seconds a running Mochi plays a short act that fits its style
  (struggling: panting, scared looks back, tears, dizziness; happy: joy, singing, cheering back;
  focused: grit, grins, winks, checks over the shoulder; cool: smirks, taunts with a tongue out,
  smug calm, showing off, yawning), its personality's favourites three times as likely.
- **Speed note for the game:** a Mochi's run drawings (its 16 stride frames times its act faces)
  should be painted ahead in the background worker before a race, so the first laps never stutter.

## The life of a Mochi

- **Egg** → **Mochiko** (stage 1, the hatchling) → **stage 2** on one of two paths: **Amamochi**
  (angel: "ama" is both heaven and sweet) or **Karamochi** (demon: "kara" is spicy).
- **The path:** sweet treats and gentle care (petting, tucking in, cheering) lean angel; spicy treats
  and rough, mischievous play (tickling, wrestling, pranks) lean demon. While it's a Mochiko the
  sprout shows the lean: a halo grows over it, or its leaves turn dark plum and curl like horns. An
  even split goes by its personality.
- **Evolving:** a Mochiko that has grown enough wraps itself in a big leaf and pops out as stage 2.
  Its features come from its path and its best stat (10 kinds), and it keeps its own hair, eyes and
  face:

  | Stat | Amamochi (angel) | Karamochi (demon) |
  |---|---|---|
  | Fly | feathered wings | bat wings |
  | Run | feathered ankle wings | swept-back horns |
  | Swim | veil fin ears | a finned tail |
  | Power | a halo and sturdy cuffs | big curled horns |
  | Stamina | a fluffy cloud tail | a long devil tail |

- **Never dies.** A happy old Mochi goes back into its mortar and is reborn as an egg, keeping its
  grades.

## The plan, in order

Each step is pushed on its own. Status as of 2026-11-09.

1. **Looks.** Done (above).
2. **Rig and animations.** Walk, hop, an idle for each personality (shared bits plus one signature
   bit each), the sprout acting out moods, eat, nap, play, cheer, sulk; hatching (the mochi ball
   puffs up and a Mochiko pops out) and the leaf-wrap evolution. A Mochiko drawn smaller and rounder
   than stage 2; the 10 stage-2 features. No squash or stretch: poses only.
   **Done** (render/mochi-anim.js, mochi-life.js, mochi-features.js, mochi-sweets.js; preview
   tools/mochi-anim.html): six styles per stat for running, swimming, flying, climbing and stamina;
   acting while running; 16 shared idle moments and a signature one per personality; eat, hated,
   nap, play, cheer, sulk, pet, tickle (the garden sets `m.action`); hatching and evolving; a baby
   stance for the Mochiko; the 10 features kept small, and the sprout turning angel or demon.
   Features aren't drawn yet in the climbing (back) view.
3. **Raising.** Stat points and levels; grades rise on evolution and rebirth; sweets made from
   monster, fishing and garden ingredients, each training a stat; training spots; mood and bond; the
   sweet/spicy lean; evolution and rebirth.
   **Rules done** (data/mochi-raise.js, tests/mochi-raise.test.js; try it: tools/mochi-raise.html):
   exp per level 20 + 2 x level; each level adds its grade's points (one either way); mood scales
   learning (x0.5 glum to x1.5 happy); 16 wagashi (lean angel) and 5 spicy treats (lean demon) from
   Garden crops (mochi rice, red beans, kinako, fire pepper), monster drops, finds and fish;
   favourite x1.5, hated x0.5; five training spots; seven kinds of care, each liked or disliked by
   personality; evolving at 3,000 exp, 40 levels, 2 h old and happy (best grade +1, others 1 in 5);
   rebirth at 20 h old and very happy (grades +1 at Lv 50+, 3 in 5; always at 99; a tenth of its
   points kept). A tummy paces it: each sweet fills a quarter, it empties over 30 min, and a full
   Mochi pats its tummy and says no. Every level-up gets a happy hop, every new way of moving a
   ta-da and a quick show of it (`m.queue` lines actions up); mood shows on the sprout (droops
   under 30, perks up over 85) and in which idles it picks. Hooking it into the game (the kitchen,
   training spots, saving) is the Garden's job.
4. **The Garden.** A tall map in zones: an orchard, a pond, a glide cliff, a nursery (a real indoor
   room), the stadium gate; about 8 Mochi living there.
   **Decided 2026-11-09:** your own place like your island (world/home.js), visitable by friends:
   built from `char.garden` each arrival (shared by the world file's characters, saved like the
   island), no bots. **Map built (batch 1, world/garden.js, render/garden.js):** Moonmortar Garden,
   a valley: Mortar Gate (the gate from Sprout Village's Pond Garden, the egg stall, the sweet
   kitchen, the nursery dome), The Orchard (four different fruit trees, the running track, the big
   tree with its swing), Lily Pond (lily pads, reeds, the fishing dock), Moonmortar Cliff (climbing
   rocks, ropes, the waterfall into a rock basin and a bamboo spout to the pond, the glide board, the
   Moonmortar, the stadium gate); the nursery room inside. First visit: two eggs and a Mochi Bell
   (to the garden and back, like the Home Shell). **Mochi living there (batch 2,
   world/garden-life.js):** the eggs wait by the gate; Up beside one rocks it and it hatches in
   front of you. Each Mochi's place comes from the real clock (a game hour is a real minute): an
   anchor spot per hour, strolls near it with idles between, home to the next anchor, so a visitor
   sees the same thing; swimmers take to the pond, and one who can't swim yet stops at the edge. On
   arriving, the ones with bond 250+ come running and cheer. At night they walk in at the nursery
   door and sleep in its beds. Dev page: tools/garden-life.html. Still to come: raising hooked up
   (batch 3), visiting and the extras (batch 4).
5. **Racing.** Courses that mix running, flying, climbing (Power), long stretches (Stamina) and
   swimming; cups from beginner up; rivals rolled like the fishing derby's; prizes on the money scale
   plus garden decorations and toys. Personality shows in how each one races (see 12).
6. **Getting eggs.** *(New.)* Proposed: plain eggs from the Garden's egg stall for gold (a few
   thousand: "decent" on the money scale); an egg as the reward for some quests; a rare egg drop from
   monsters; and bred eggs (step 9). No Cash.
7. **Names.** *(New.)* You name your Mochi when it hatches; a cute random name is suggested from a
   list of sweet-themed names, and you can roll another.
8. **The Mochi window.** *(New.)* One page per Mochi: its stage and path, stats and grades,
   personality, favourite and hated sweets, voice, rarity and coat, its parents.
9. **Breeding.** *(New.)* Two grown Mochi that are happy together leave an egg in the Garden. Each
   part comes from one parent or the other, with a small chance of something new; talents average
   the parents' with a chance to step up; rare coats can be passed on at a reduced chance. The way
   to chase a particular rare.
10. **The Mochi album.** *(New.)* A book that fills in every hairstyle, fringe, eye, mouth, brow,
    coat, Mutation and stage-2 kind you've hatched, with counts and your rarest Mochi on the cover.
    Like the capsule album for the gacha.
11. **Your Mochi as your pet.** Any Mochi can follow you; its form and stats change how it helps
    (loot reach, potions, buffs). Replaces the old Cash egg pet.
12. **Personality in play.** *(New.)* Beyond idles: how each reacts to sweets, to other Mochi, to
    being petted or tickled, and how it races (a hyper one bolts and tires, a stoic one keeps a
    steady pace).
13. **Voices.** *(New.)* Each Mochi's chirp style and pitch, cut from the Sonniss library.
14. **Dress-up.** The hoods (and later more) worn in a dress-up slot.
15. **Polish.** HD props, effects, speed checks, a full play-through.

## Checked against the Chao Garden (chao-island.com Info Center, read in full 2026-11-09)

Already matched: five stats, grades E-S setting points per level, levels 1-99, a tenth of points kept
on rebirth, a hero/dark lean from how it's treated, stage-2 forms by path and stat, bites out of food,
a happy end leading to an egg again, eggs that hint their colour, rare coats (their jewel and shiny
Chao), personalities, names, breeding, races. Added to raising from it:

- **The form follows what it's been raised on lately** (Chao evolve by their recent animals, not
  their totals); raised evenly, the **plain form** (no stat feature, just its path's sprout).
- **A Mochiko buds toward its coming form** (a Chao child changes shape before its cocoon): tiny
  pastel dough nubs in three sizes.
- **Hunger** (an empty tummy for 20 min: it rubs its tummy, looks round for food, mood sinks).
- **A rebirth scene** (the pink cocoon): it waves goodbye, wraps in a pink-glowing leaf, petals rise,
  an egg in its mortar again.

Still to decide or build, by step:

- **Raising, built 2026-11-09:** *can't-yet* stages (under 50 Run it scoots on its bottom, under 100
  Swim it flails and splashes until you lift it out, which it's grateful for, under 100 Fly it leaps
  flapping and flops back down); **learned tricks** (each of the 21 sweets teaches one the first time:
  forward roll, sit-ups, tummy paddling, chest beat, shadow-boxing, flapping practice, meditating,
  brain freeze, sumo, a puff of fire, a backflip, and ten of the idle moments; a raised Mochi only
  idles with the six basics and what it's learned, and tricks start again each life); the
  **Tsukimochi** (the moon mochi, after the rabbit in the moon): third life or later, mood 85+, every
  trick learned, raised evenly when it evolves; of Dawn or of Dusk, its sprout cradling a tiny moon
  (full, or a crescent), pearly, three small moon motes circling (a big moon behind it pulled focus
  from the Mochi, so it went); it lives forever. Still open: petting a
  misbehaving one spoils it a little.
- **Garden:** shake trees for fruit; plant seeds that grow, bear and die (up to 7 trees); **time only
  passes while you're there** (so nothing is neglected while away); a themed angel / demon area that
  opens when you raise your first of each, with a bonus egg; digging up hats; 8 at most, and a gentle
  **goodbye** (sent to a faraway forest to live happily); greeting you and running to you at high
  bond, squirming when held at low bond; sleeping, and grumpy if woken.
- **Hatching:** rock the egg to hatch it sooner; the leftover can be worn as a hat.
- **The Mochi window:** a check-up page with grades, personality, favourite sweet, age, lives lived,
  and condition.
- **Classes (extra):** songs and drawing in five levels (it draws on the garden floor), instruments
  that Mochi play together as a band, dances, exercise.
- **Breeding:** flowers bloom round a Mochi that's ready; a heart sweet brings it on; a nuzzle and a
  little dance, and the egg appears; grades from the parents; two-tone colours bred for.
- **Racing:** race tiers (beginner, jewel, challenge, angel, demon, party with friends); cheering for a
  burst of speed that costs stamina; luck (tripping, trap lanes) and wits (puzzles) moments; toys and
  medals as prizes; a sparring contest (an extra) with a will-to-fight bar.
- **Shop:** coloured eggs (one-colour, two-tone, shiny), hats, special sweets (all-stats, path, heart).

**Extras, only if wanted later:** a class building where Mochi learn little skills (singing, drawing,
an instrument) that show in the Garden; a friendly sparring contest beside racing; Garden themes that
change with your Mochi's paths.

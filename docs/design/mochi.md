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
3. **Raising.** Stat points and levels; grades rise on evolution and rebirth; sweets made from
   monster, fishing and garden ingredients, each training a stat; training spots; mood and bond; the
   sweet/spicy lean; evolution and rebirth.
4. **The Garden.** A tall map in zones: an orchard, a pond, a glide cliff, a nursery (a real indoor
   room), the stadium gate; about 8 Mochi living there.
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

**Extras, only if wanted later:** a class building where Mochi learn little skills (singing, drawing,
an instrument) that show in the Garden; a friendly sparring contest beside racing; Garden themes that
change with your Mochi's paths.

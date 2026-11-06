# The Kitchen Witch (the mage line rework; replaces the Star Witch, Starlight Idol and Astronomer)

The player's picks (2026-11-06): a whole new fantasy for the mage line, because the star mages'
moves read generic and stiff, their effects didn't impress, the combat feel was off and the
concept itself didn't excite. The new line cooks its spells. Held to the Wind Dancer standard
(CLAUDE.md) and built by the job recipe (docs/design/making-a-job.md).

## Who she is

A bossy little head chef of a witch: she yells "YES, CHEF!" at herself, plates every kill like a
fine-dining dish, and is personally offended by underseasoned monsters. A parody of TV
cooking-show drama (the dramatic tasting, the plating flourish, the over-the-top salt sprinkle,
the "it's RAW" outrage), never a copy of a real show.

- **Colour:** tomato red and butter cream (white cores, a gold yolk accent).
- **Shapes (to be designed with the effects):** steam curls, splashes of broth, sizzles, spice
  sprinkles, flame licks from a flambé, plates and cloches.
- **Weapons:** a ladle (quick: flicks hot broth, sauce and spice) and a frying pan (heavy: flips,
  flambés, pan slams). Drawn as the wand's and staff's 'chef' finish for now
  (render/weapon-designs.js `ladle`, `fryingPan`).
- **Her gauge:** a pot floating beside her comes to the boil. Hits heat it: it simmers, bubbles,
  then BOILS; while boiling, every spell splashes onto extra targets. It cools once the fight
  stops. Her finisher (the Full-Course Meal, working name) needs it boiling and serves it all.

## How she fights (the player's pick, 2026-11-06: "build it as drafted")

- **Ladle (quick):** a stir and flick (a glob of hot broth), a backhand splash (three droplets),
  and the finisher: a big overhead pour, a wave of soup crashing forward. Pool: a tasting jab, the
  showy salt sprinkle off the elbow (a sparkly spice cloud), a twirling scoop.
- **Frying pan (heavy):** an overhead pan bonk, a flip that arcs a sizzling egg onto them, and the
  finisher: a flambé whoosh of fire. Pool: a wok toss (food flies up and lands on them), a pan
  spin, a backhand smash.
- **Commands:** up + attack tosses food up at fliers; in the air she pours down or dives pan
  first; out of a run she slides along on the pan like a sled.
- **Skills (ids kept):** Hot Soup (`spiritbolt`: three ladle flings), Steam Step (she vanishes in
  steam and pops out ahead), Flambé (`spiritwave`: a fire wave through the line), Chicken Soup
  (`blessing`: a steaming bowl heals the party), Pot Lid (`spiritward`: a shield on the party),
  Kitchen Mastery, and **Full-Course Meal** (`heavenslantern`, the finisher, pot boiling): a salad
  tossed over everyone, a roast slammed down from the pan, a giant cake dropped from above, and a
  chef's kiss.

## Her paths (to design)

- **Hot Pepper Pyromancer** (damage): spicy fire, flambé, and frost made of ice cream.
- **Pâtissière** (the healer): cakes and tea that mend the party, sugar-rush buffs. Takes over the
  Starlight Idol's seat as the dungeon healer.

## Status

- 2026-11-06: concept picked; look samples (`tools/kitchen-looks.html`): three hats (a witch-toque,
  a tomato witch hat with a spoon in its band, a polka-dot kerchief) on an apron dress with an oven
  mitt, holding the ladle and pan, in three dress colours. The player picked the witch-toque in tomato red.
- 2026-11-06: her moves (render/moves.js `kw*` ladle, `kp*` pan, faces in `KW_FACE`): the ladle
  string kwstir, kwsplash, kwpour and its pool kwtaste, kwsalt, kwscoop; the pan string kpbonk,
  kpflip, kpflambe and its pool kpwok, kpspin, kpsmash; commands kwup, kwair, kwdash, kpup, kpair,
  kpsled. Wired into her basic strings (world/melee.js keys `starwand` and `starstaff`, now three
  steps each). Her shots still use the star art until her own effects are drawn. Every pose checked
  clear of the face (strips) and recorded in her outfit (`tools/kitchen-moves.html`, GIFs in
  docs/design/samples/kitchen-witch-ladle.gif and -pan.gif). Her plain wands and staves are drawn
  as the ladle and pan (the 'chef' finish).
- Ids to keep (so saves, Elowen's trial, the dungeon healer and the paths carry over):
  `spiritmage` (first job), `shrinemaiden` (the healer path), `onmyoji` (the damage path).

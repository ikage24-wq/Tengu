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

## Her paths (to design)

- **Hot Pepper Pyromancer** (damage): spicy fire, flambé, and frost made of ice cream.
- **Pâtissière** (the healer): cakes and tea that mend the party, sugar-rush buffs. Takes over the
  Starlight Idol's seat as the dungeon healer.

## Status

- 2026-11-06: concept picked; look samples (`tools/kitchen-looks.html`): three hats (a witch-toque,
  a tomato witch hat with a spoon in its band, a polka-dot kerchief) on an apron dress with an oven
  mitt, holding the ladle and pan, in three dress colours. Waiting on the player's pick of look.
- Ids to keep (so saves, Elowen's trial, the dungeon healer and the paths carry over):
  `spiritmage` (first job), `shrinemaiden` (the healer path), `onmyoji` (the damage path).

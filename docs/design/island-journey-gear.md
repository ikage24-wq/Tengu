# Island Journey: the weapon and armour ladder

The player's plan (2026-11-16), after every old weapon and armour piece was retired: a tier at
Lv 5 (the starters), 10, 20, 30, 40 and 50, each with one theme that its weapons and its armour
share, so a whole outfit always matches its weapon. Themes follow the areas you reach at those
levels, so the gear feels earned there. The player wants them awesome, heavily detailed and game
ready, fluidly animated with effects from the middle tiers on, and above all perfect: show each
tier before starting the next.

The seven job weapons get the ladder: sword, axe, spear (Thunderguard line), staff (Tide Mage
line), dagger (Moon Moth line), bow and crossbow (Sunfeather line). The wand and the gloves keep
their plain starters for Novices.

| Lv | Theme | Weapons and armour | Effects |
| -- | ----- | ------------------ | ------- |
| 5 | Sprout | whittled pale wood with its grain and knots, cream twine wraps, little leaf sprouts, a pink bud | none |
| 10 | Rootwood | living roots and moss, amber sap, acorn caps; armour of bark and moss | none, or a faint sap glint |
| 20 | Tidepearl | coral, mother-of-pearl, shells, sea glass | a soft water shimmer |
| 30 | Starglass | observatory brass and star glass, etched constellations | twinkling stars |
| 40 | Dreamsilk | theatre velvet, gold filigree, crescent moons | drifting ribbons and sparkles |
| 50 | Regalia (the Mochi Queen's) | Hayate's own: cloud-white, periwinkle, crown crystal, her gold sprout, white wings | golden light, her sprout's heartbeat, her wind, drifting feathers; legendary |

## Built

- **Lv 5 Sprout** (render/weapon-sprout.js): the starters, `${type}_0`. The bow and crossbow keep
  the sample shapes exactly (the bow is short enough to stay hidden behind her head when drawn
  upright). Sword with a twig guard that sprouts a bud; a knapped stone hatchet lashed to a
  sprouting branch; a leaf-headed spear on a sapling; a branch staff curling into a fern
  fiddlehead round a pink bud; a whittled knife; a twine-strung bow; a wooden crossbow with a
  leaf-fletched, stone-tipped bolt.

- **Lv 10 Rootwood** (render/weapon-rootwood.js): `${type}_10`, sold at Tora's (sword, axe,
  spear), Nim's (staff) and Marlo's (bow, crossbow, knife). Dark heartwood, pale roots curling into
  guards and claws, moss, glowing amber sap (a vein down the sword with drops in it, the axe's bit,
  the spear's spike, the staff's orb cradled in roots, a knife blade of amber with an oak leaf
  trapped inside), acorn caps and pommels, oak leaves, a red mushroom on the staff. The axe and
  spear hafts are one twisted root (two braided strands read as a zigzag).

- **Lv 20 Tidepearl** (render/weapon-tidepearl.js): `${type}_20` (the spear is the Tidepearl
  Trident), in the same three shops. Mother-of-pearl with a rainbow sheen and sea-glass edges,
  pink coral, scallop shells (raised ribs and a bulging rim, or they read as paper fans), pearls,
  deep-blue sea-silk grips, driftwood hafts, a starfish on the staff, a sea-glass knife with a
  bubble caught in it. Its effect (render/weapon-fx.js `tideLive`, picked by the design's
  `a.fx`): soft glows rippling up it like sun through water, glints winking in pearl tints, the
  pearl catching a glint, tiny bubbles rising toward the top of the screen whichever way she
  holds it.

- **Lv 30 Starglass** (render/weapon-starglass.js): `${type}_30`, in the same three shops.
  Star glass (night blue with a violet haze of nebula) bound and edged in polished brass,
  constellations etched in the glass, astrolabe rings with degree ticks for guards, an armillary
  sphere on the staff, a four-pointed star of glass for the spear's head, a telescope sight on the
  crossbow, night-lacquered hafts with brass star charts inlaid, wine-red grips wound with brass
  wire, brass stars and star-cut gems for tips and pommels. Round glass orbs in brass rings read
  as eyes, so small jewels are star-cut instead, and round things are drawn narrower by the
  type's stretch so they come out round. Its effect (`starLive`): the etched stars light up one
  after another with the lines between them (`a.stars`, a null starting a new constellation),
  little stars wink round it, its gem breathes violet, and a shooting star crosses the sky just
  above its highest point.

- **Lv 40 Dreamsilk** (render/weapon-dreamsilk.js): `${type}_40`, in the same three shops.
  Moon-silver blades inlaid down the middle with plum enamel and gold filigree vines (pale silver
  with thin filigree alone read as plain), gold crescent moons for guards and cradles, the axe's
  bit a moon with a pleated silk fan in its hollow (an open moon read as a letter D), the staff's
  moon resting in a little cloud, plum theatre velvet latticed in gold cord, moonstones in gold
  claws, gold tassels, and a pink silk bow on each. The bow's tails are the effect (`dreamLive`,
  from `a.ribbon`): they hang toward the bottom of the screen, sway, ripple and twist satin side
  and back, with swallowtail ends; sparkles drift up round it and the moonstone glows.

- **Lv 50 Regalia** (render/weapon-regalia.js): `${type}_50` (the staff is the Regalia Scepter),
  in the same three shops. The player's call (2026-11-16): the game's lore is moving to the Mochi,
  so the top tier is the Mochi Queen's, what Hayate gives you when you wake her (Windborne was
  dropped). Her colours (cloud-white hair, periwinkle eyes, her crystal crown's icy blue, her
  gold sprout): white-gold blades edged in crown crystal with a gold ridge, white heraldic wings
  (a gold arm, broad round-tipped feathers hanging from it) on guards, sockets, the scepter's
  crown and the axe's back, crowns of crystal spires, her sprout on a periwinkle shield as each
  one's crest (gold on white read as a blob), periwinkle grips wound in gold, crystal drops.
  Its effect (`regalLive`): a golden light breathing along it, the sprout (`a.crest`) beating
  like a slow heart, two ribbons of gold wind spiralling up it with gold leaves, white feathers
  drifting down off it. Its wings are moving parts that beat (shapes tagged `part`, pivots in
  `a.parts`; render/weapons.js packs each as its own picture, render/hero.js drawWeaponParts turns
  it every frame), the scepter's great crystal floats over its crown. Each class has its own beat
  and light (`a.style`, the player's call: one colour and one motion for all looked the same):
  storm (the Warrior's sword, axe, spear: blue light, snapping beats, little lightning arcs),
  tide (the Tide Mage's scepter: aqua, slow rolling beats, water rings, bubbles, a water ribbon),
  moon (the Moon Moth's knife: violet, a moth's flutter, moonlight motes, crescent glints, dust),
  sun (the bow: gold, a bird's easy beat, rays from the crest, wisps), phoenix (the crossbow:
  orange, great beats, flames, embers, a ring of fire). Over all of them a soft Nexus aura (the
  player's video of FFXIV's Nexus relics: render/weapon-fx.js `drawWeaponAura`, `auraFor`), needles
  of light, twinkles, her sprout's heartbeat and drifting feathers. The job teachers keep their old Lv 50 weapons
  (`legacy: true` on their gear) until their halls are reworked into the Mochi lore.

## Armour

Each tier also gets an armour set for each of the four jobs (hat, top, bottoms, shoes, gloves,
cape), in the tier's palette but each job in its own cut. Ids are `${theme}_${family}_${slot}`
(`sprout_warrior_hat`; data/items.js `ARMOUR_TIERS`, `armourId`); a piece carries `ladder` and is
drawn by its tier's module (render/jobgear/ladder.js, one module per tier, one set of functions
per job, the same interface as render/jobgear/warrior.js). Its skirts and capes hang and swing.
No colour variants. Stats come from `jobGearStats` (thieves lean LUK and speed, archers DEX).

- **Lv 5 Sprout** (render/jobgear/ladder-sprout.js), sold by Pip, starters a Novice can wear:
  - Thunderguard: a whittled wooden helm wound with twine, a sprout growing from its top; a
    wooden breastplate with the Sprout inlaid in green, lashed over a quilted green gambeson;
    wooden pauldrons; leaf and wooden-slat tassets; a leaf cloak with leaf-pointed hem.
  - Tide Mage: a linen cap with a broad leaf for a brim and a dewdrop on it; a linen robe with a
    two-leaf collar, a bud brooch, a twine sash tied in a bow and a hem of little leaves; a
    leaf-pointed green underskirt; leaf slippers; a short leaf shawl.
  - Moon Moth: a green headband whose leaf-tipped tails stream behind; a green wrap top, linen
    sash and pouch; wrapped hands and shins; a long scarf with leaf-tipped tails.
  - Sunfeather: a pointed ranger's cap with a cream feather touched with dawn gold; a laced
    leather jerkin and baldric; wooden arm guards; tall laced boots; a capelet fringed with
    cream feathers.
- **Lv 10 Rootwood** (render/jobgear/ladder-rootwood.js, sharing ladder-sprout.js's helpers and the
  Rootwood weapons' roots, moss, amber, acorns and mushroom), sold beside the Lv 10 weapons (Tora
  the warrior's, Nim the mage's, Marlo the thief's and archer's):
  - Thunderguard: an acorn-cap helm (a diamond lattice of scales, its stalk and an oak leaf on
    top) with an amber at the brow; a heartwood breastplate bound with roots round a great amber
    over a forest-green tunic; bark pauldrons cushioned with moss, a mushroom on the near one;
    bark tassets with amber drops; a moss cloak hemmed with oak leaves.
  - Tide Mage: a toadstool hat, its gills under the brim; a cream robe with a heartwood panel a
    root climbs, a moss collar, an amber brooch, acorn charms on a root belt; an oak-leaf mantle;
    acorn slippers.
  - Moon Moth: a circlet of twisted roots, oak leaves at the temples like little wings, an amber
    drop on the brow; a bark vest over a moss shirt, a root strap, an acorn-cap pouch; a ragged
    moss cloak.
  - Sunfeather: a wide-brimmed bark ranger's hat with a moss band and a russet feather tipped in
    amber; a moss tunic with a heartwood chest guard and a root baldric; a hooded moss cloak
    fringed with oak leaves.
- **Lv 20 Tidepearl** (render/jobgear/ladder-tidepearl.js, with the Tidepearl weapons' pearls,
  scallops, coral, sea glass and starfish), sold beside the Lv 20 weapons:
  - Thunderguard: a mother-of-pearl helm with a scallop crest and coral branching from its sides,
    a sea-silk band of pearls; a pearl breastplate over a sea-blue tunic; scallop pauldrons;
    hanging scallop tassets; a sea-blue cape with a foam-crested wave hem and pearls.
  - Tide Mage: a great scallop shell behind her head like a halo, a pearl tiara with a sea-glass
    drop, a starfish and coral; a sea-blue robe with a pearl bodice, a coral sash, a foam hem; a
    sea-glass underskirt and cape.
  - Moon Moth: a little pirate tricorn with pearl braid and a scallop cockade; a navy jacket over
    a striped shirt, a coral sash; a coral scarf with pearl-weighted ends.
  - Sunfeather: a sea-blue beret with two white seabird feathers and a scallop badge; a
    mother-of-pearl scale vest, a sea-silk baldric; a capelet fringed with white feathers.
- **Lv 30 Starglass** (render/jobgear/ladder-starglass.js; its own star, star-cut gem, astrolabe
  ring and constellation helpers, drawn without the weapons' x-squeeze; no round gems in brass
  rings, which read as eyes), sold beside the Lv 30 weapons:
  - Thunderguard: a star-glass helm with a galaxy and a constellation in it, a brass meridian
    ring arching over it crowned with a brass star, a dial-ticked rim and a star-cut gem; a
    star-glass breastplate edged in brass over wine red; a night-sky cape with a brass star chart.
  - Tide Mage: an astronomer's pointed hat with a tilted brass ring round it and a brass star at
    its tip; a night robe hazed violet toward the hem with a constellation stitched in brass, an
    astrolabe buckle.
  - Moon Moth: a night-blue headscarf studded with brass stars, its tails behind; a wine vest
    with star buttons and a pocket spyglass on a brass chain; a ragged night-sky cape.
  - Sunfeather: a brass circlet with an astrolabe disc and two star-glass feathers; a wine coat
    with a star-glass chest guard; a capelet fringed with violet feathers.
- **Lv 40 Dreamsilk** (render/jobgear/ladder-dreamsilk.js, with the Dreamsilk weapons' moons,
  filigree, moonstones, tassels, bows and clouds, drawn unsqueezed through `DREAM_PIECES`), sold
  beside the Lv 40 weapons:
  - Thunderguard: a moon-silver helm with a full gold crescent standing as its crest, an enamel
    brow band with filigree and a moonstone; an enamelled moon-silver breastplate over plum
    velvet; latticed velvet tassets with gold tassels; a theatre-curtain cape with gold fringe.
  - Tide Mage: a plum velvet nightcap flopping over to hang beside her head with a gold tassel,
    gold stars on it, a moon-silver cuff; a lilac robe with a latticed velvet panel, gold
    crescents and a pink sash; a cape of clouds and moons.
  - Moon Moth: a great pink silk bow whose loops spread like moth wings, its tails behind; a
    latticed bolero over a ruffled blouse; a pleated skirt; ribbons crossing up her shins.
  - Sunfeather: a plum cavalier's hat pinned up with a gold crescent and a great pink plume; a
    lilac doublet with latticed velvet panels and moonstone buttons; wide-cuffed boots.
- **Lv 50 Regalia** (render/jobgear/ladder-regalia.js, the Mochi Queen's, with the Regalia
  weapons' wings, feathers, crest, sprout and crown drawn unsqueezed through `REGAL_PIECES`),
  sold beside the Lv 50 weapons. Each job's gems and lining are in its class light (storm blue,
  tide aqua, moon violet, dawn gold), as on the weapons:
  - Thunderguard: a white helm with white wings swept up at its sides, crystal spires on its gold
    brow band, her crest at the brow; a white breastplate with her crest over periwinkle;
    pauldrons fanned with feathers; heel wings; a white cape lined in periwinkle with her sprout,
    folded wings behind it and a mantle of white feathers over the shoulders.
  - Tide Mage: her crystal crown with her crest; a white gown with periwinkle panels, a standing
    collar of white feathers and a tide sash; a train with a cloud hem and folded wings.
  - Moon Moth: a gold tiara of crystal spires with small swept wings at the temples; a periwinkle
    jacket and a violet sash; a skirt of white feathers; a feather mantle lined in violet.
  - Sunfeather: a white cap with a crown band, a tall wing rising from its far side and a gold
    sunburst round her crest; a white tunic with a sunburst; a capelet fringed with white and gold
    feathers.

Prices climb with the tiers, a hat and a top each: Sprout 212 / 276, Rootwood 437 / 568, Tidepearl
1,259 / 1,636, Starglass 2,961 / 3,850, Dreamsilk 6,180 / 8,034, Regalia 11,748 / 15,272 gold.

Monsters drop the ladder armour too: their gear pool (world/drops.js `gearFor`) takes any gear
within 15 levels below to 5 above them, so each tier turns up where its level is hunted.

Check a tier's sets on the hero with tools/outfit-tiers.html?ladder=5 (k= zooms, weapon= hides
the weapons).

## Building the next tiers

Each tier gets its own module like weapon-sprout.js, drawn with render/weapon-ladder-kit.js (the
shared frame, leaves, knots, the bow's and crossbow's shapes), and takes its level's id back from
the retired ladder: add it to `LADDER_TIERS` in data/items.js and to `LADDER` in
render/weapon-designs.js (by tier, level / 5). Check no Cash cover or NPC still wears that tier's
old look first (a retired material weapon cover keeps its tier's old design through `legacy`,
as do the job teachers' weapons). Match the sizes the
moves were drawn for (the Sprout ones), keep the bow's shape for the head rule, and give the
armour the same palette and motifs.

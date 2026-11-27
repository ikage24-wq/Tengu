# The Sky Whale's Back: the levels 45-50 group dungeon (design, 2026-11-02)

The eighth and last group dungeon on the ladder, after the Dream Theatre (40-45), following the
plan in docs/design/dungeon-ladder.md.

## The story

A whale as big as a town swims through the sky above Starfall Heights. A whole little port lives
on its back: docks on its tail, a market along its spine, gardens in its lungs. Lately the whale
has fallen into a deep, troubled sleep and is sinking toward the island. Sky pirates are taking
what they can before it drops, and the barnacles that grow on it have started to build a fortress.
Skipper Nimbus, who has sailed the whale's back all her life, needs a crew to wake it gently.

## Where

**Cloudcatch Pier**, at the east end of Starfall Heights (43-48), where the whale's tail dips
close to the rim. **Skipper Nimbus** finds groups there. Entry is from level 45; the group finder
brings players of levels 45-48.

## The run: a journey from tail to head

| # | Room | Shape | Task / gimmick | Set-piece |
|---|---|---|---|---|
| 1 | The Tail Docks | Long docks on the whale's tail, crates and moorings | Tie the three moorings. **The tail flips:** with a warning, the floor tilts and everyone on it slides; ropes and ledges are safe | |
| 2 | The Spine Market | A market of tents along the spine, drifting cloud stalls | **Gusts:** the wind blows hard one way, pushing everyone; **the blowholes** erupt on a beat and launch you up to the stalls | |
| 3 | The Lung Gardens | A greenhouse that breathes | **Puzzle:** the room breathes in (pulling everyone to the middle) and out (pushing everyone outward). The air-blooms open only on the breath out; tend all three | Puzzle room |
| 4 | The Blowhole Deck | A pirate airship moored at the great blowhole | **Mid-boss: Captain Gale** | |
| 5 | The Barnacle Fortress | Walls of shell and coral grown over the whale's back | **Mid-boss: the Barnacle Matriarch** | |
| 6 | The Whale's Brow | The top of the whale's head, in the open wind above the clouds | **Final boss: the Whale's Dream** | |

## Monsters (levels 45-49)

Since 2026-11-27 the whale's folk are new creatures, each on its own copy of the creature base in its own
folder (registered in render/mobs/skyfolk.js), each with its own face, idle act of four pieces and three
moves of its own. They also live on Starfall Heights, next door.

- **Kite Pika** (`kiterider`, render/pika/): a pika in a honey flight jacket with a paper diamond kite
  strapped to its back; the first good gust lifts it off its toes, and it is still not very good at
  landing. Gust Rush, Kite Twirl, Eep! (a pika's alarm call).
- **Cloudherd Samoyed** (`shepherdess`, render/samoyed/): a sheepdog pup in a shepherd's smock who gave up
  on sheep and herds clouds instead. Its whole flock is one small cloud, which keeps wandering off.
  Woof!, Cloud Bonk (the cloud sent swooping), Shake-Off.
- **Blunderpuss** (`gunner`, render/blunderpuss/): Captain Gale's youngest crew, a ginger kitten in a
  striped sailor's shirt and a red bandana with a brass blunderbuss it loads with cloud (cannonballs are
  heavy). Blunderblast (a ranged cloudball), Stock Bonk, Paw Bat.
- **Turtle Squire** (`barnacleknight`, render/turtlesquire/): the Barnacle Matriarch's squire, a young
  sea turtle in a coral surcoat and a scallop helm, barnacles on its shell like medals, never quite
  awake. Shield Shove (its scallop shield), Shell Slam, Tide Stomp.
- **Stormsong Frog** (`harpist`, render/treefrog/): a tree frog busker in a rain slicker with a golden
  harp; frogs sing before a storm, and these sing the storms in. Thunder Strum (a ranged note of
  lightning), Thunder Croak, Puddle Leap.
- **Mantra Lemur** (`monk`, render/lemur/): a ring-tailed lemur monk in a saffron robe with a singing
  bowl; ring-tailed lemurs sit with their arms open to the sun, so these became monks, and they breathe
  with the whale. Bowl Chime, Tail Sweep, Big Breath.

## Bosses

- **Captain Gale** (Blowhole Deck, remade 2026-11-27, render/gale/): a young sky-pirate captain with no wind
  magic at all, who makes her own gales with the Gale-Maker, a ship's bellows the size of a cannon. Cranberry
  frock coat, navy tricorn, storm-periwinkle ponytail; her crew are the Blunderpuss kittens. Her fight
  (world/skywhale.js), every cast on the cast bar:
  - **Fair Winds** (to 66%): Point Blank Puff (tank buster), Cloudball Volley (spread), All Hands Haul!
    (stack), Downdraft (get out), Blow Me Down! (raid-wide).
  - **Squall** (to 33%): four sails pop up on the deck; **Full Gale** (her signature): wind out both ways
    from her, the only calm in the lee of a sail (its side away from her) or up in the rigging.
  - **Full Gale** (to 0, faster): Wind Shift from one end, then straight from the other; the volley with a
    downdraft on top.
  - Entrance: becalmed, pumping her bellows up at limp sails; she swaggers up and blows you across the deck.
- **The Barnacle Matriarch** (Fortress, remade 2026-11-27, render/matriarch/): a grand old walrus dowager the
  whale's barnacles took for their mother. Sea-teal gown, lace capelet where her five barnacle children live
  (their lids pop open to wave), coral circlet, a scallop fan; her squires are the Turtle Squires. Her fight:
  - **Low Tide** (to 66%): A Proper Scolding (tank buster), Barnacle Babies (spread), Cluster, Children!
    (stack), Coral Bloom (get in close), Undertow (raid-wide).
  - **Rising Tide** (to 33%): **Find the Pearl** (her signature): three clams, her pearl shown in one, the
    clams shuffle, and the tide floods everything (rigging too) but the pearl's clam.
  - **Spring Tide** (to 0, faster): more and quicker shuffles, the babies with a coral bloom on top.
  - Entrance: holding court with her fan; her children spot you first; a slow waddle up, a slap of the deck.
- **The Whale's Dream** (the Brow): the whale's own spirit, a gentle giant to be woken, not
  killed. She is a translucent sky-blue maiden with a whale-tail cape, fin sleeves and stars
  inside her, her eyes heavy with sleep.
  - **Lullaby**: slow circles of song.
  - **Deep Dive**: she sinks into the clouds and breaches under someone.
  - **Starlight Song** in her last third: the wind lanes swap sides, faster and faster.
  - At the end she wakes, and the whale rises again.

## Rewards and music

- **Rewards:** Sky Scales (tokens), Lv 50 gear, and the **Skyfarer** set (aviator goggles worn up
  on the head, a scarf that streams, a whale-tail cape).
- **Music:** "Skyfarers" (epic folk in D Dorian, a fiddle hook over taiko toms) and, for the
  bosses, "Leviathan" (E minor, horns and strings over driving taiko).

## The 2026-11-03 redraw

The folk and bosses were redrawn creature-first (render/mobs/skyfolk.js and skyboss.js), retiring
the costumed girls on the sky rig: a flying squirrel kite rider in goggles, a corgi shepherd with a
cloud lamb, a seagull pirate gunner with a blunderbuss, a walrus barnacle knight with a coral lance,
a storm-cloud harpist with lightning horns, and a puffin feather monk. Captain Gale is a red panda
sky-pirate captain, the Barnacle Matriarch a snail queen in a barnacle-crusted conch, and the
Whale's Dream a sleepy translucent baby sky whale full of stars.

## The 2026-11-27 rework

The six regulars were remade as new creatures (see Monsters above): the Kite Pika, the Cloudherd
Samoyed, Blunderpuss, the Turtle Squire, the Stormsong Frog and the Mantra Lemur. The bosses followed the same day: Captain Gale and the Barnacle Matriarch (above), with new fights.

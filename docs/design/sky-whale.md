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

## Monsters (levels 45-49), on a new rig

The **sky rig** (render/mobs/skyrig.js) is built for wind. Every figure stands in a steady wind
from ahead, with gusts on top of it. Hair, scarves, sashes, cloth and feathers stream back and
ripple. Poses glide from one to the next with no snap: a long ease in and out, and a float that
carries on between keys. Gliders hang and drift instead of stepping. Under each figure, little
wind lines and cloud wisps pass beneath the feet.

- **Kite Rider**: a girl hanging from a big diamond kite, her boots dangling. She dives in for a
  two-footed kick.
- **Cloud Shepherdess**: a fluffy wool dress and a crook, with a little cloud sheep bobbing at her
  side. She swings the crook to hook.
- **Sky Pirate Gunner**: a tricorn with goggles pushed up on it and a bell-mouthed blunderbuss.
  The shot leaves a puff of smoke.
- **Barnacle Knight**: armour encrusted with barnacles and shells, a coral lance, and a heavy
  thrust.
- **Storm Harpist**: a storm-cloud gown and a harp strung with lightning. A strum sends sparks
  arcing.
- **Feather Monk**: robes, a pair of folded feather wings, prayer beads, and a palm strike that
  rings out a gust.

## Bosses

- **Captain Gale** (Blowhole Deck): the sky pirates' captain, in a huge feathered tricorn and a
  long coat streaming in the wind, with a cutlass and a spyglass.
  - **"Broadside!"**: cannon fire rakes one half of the deck.
  - **"Hard to port!"**: the wind shoves everyone toward one end.
  - **The blowhole** erupts in the middle on a beat and launches anyone standing on it. Ride it
    up to dodge the broadside.
  - **"Boarding party!"**: Gunners swing in at 70% and 40% health.
- **The Barnacle Matriarch** (Fortress): a tall lady in a gown of shell, with a crown of conches,
  kelp hair and a coral staff.
  - **"Encrust!"**: she shells up and takes far less damage. Break the shell with enough damage in
    six seconds and she is stunned and open. Fail, and the shell bursts in a **Tide Crash** across
    the floor (jump it).
  - **Barnacle spikes** grow under players.
  - Barnacle Knights join at 60% health.
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

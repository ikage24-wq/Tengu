// Mounts (docs/design/mounts.md): creatures you ride to get about faster, each with one movement
// trick and one trade-off, so none is simply the best (research home-mounts.md: Terraria's roster).
// Press H to ride your chosen mount (or pick one in the Mounts tab of the Collection, B). Attacking
// or using a skill hops you off and the move comes out of the dismount; fishing, gathering and
// crafting put it away. No tiredness, no upkeep. They're drawn by render/mounts.js, each on its own
// rig.
//
//   speed   ground speed, % of walking (MapleStory's sit at 150-200%; ours 115-165%)
//   jump    jump, % of a normal jump (height grows with its square root, as for the hero)
//   climb   rope and ladder speed, % (only the gecko keeps riding on a rope; the others are put
//           away when you grab one)
//   trick   what it does that the others don't:
//     bounce  big jumps and a soft landing
//     glide   hold Jump while falling to glide down slowly, drifting far
//     hover   step off an edge (or hold Jump at the top of a jump) to float level for `hover` s;
//             the cloud thins as it runs out, and fills again on the ground
//     dash    double-tap a direction on the ground for a burst of steam: `dash` s at `dashSpeed`%,
//             ready again once the kettle has built its steam back up (`steam` s)
//     swim    skims over water (a map's `water`) at `swimSpeed`% instead of wading through it
//     climb   runs up ropes and ladders without getting off
//   earn    how you get it (world/mount.js gives it; the Mounts tab shows the hint)

export const MOUNTS = {
  bun: {
    id: 'bun', name: 'Puff Bun', speed: 130, jump: 150, climb: 100, trick: 'bounce',
    about: 'A marshmallow bunny that bounds about in springy hops.',
    trickText: 'Big bounce: jumps half again as high, and always lands softly.',
    earn: { quest: 'bun_buddy' }, hint: "Help Clover with her runaway Puff Buns in Sprout Village's Pond Garden (Lv 15).",
    color: '#ffb3cf', sound: 'mountBun',
  },
  crane: {
    id: 'crane', name: 'Paper Crane', speed: 145, jump: 100, climb: 100, trick: 'glide', glideFall: 70,
    about: 'Folded from washi paper, it skims along on beating wings.',
    trickText: 'Glide: hold Jump in the air to sail down slowly and drift far.',
    earn: { hard: true }, hint: 'Folds itself from a boss crown: clear any dungeon on Hard.',
    color: '#ffd1e1', sound: 'mountCrane',
  },
  nimbus: {
    id: 'nimbus', name: 'Nimbus', speed: 135, jump: 100, climb: 100, trick: 'hover', hover: 1.2,
    about: 'A sleepy little cloud. It wakes up when you go somewhere.',
    trickText: 'Hover: float level over a gap for a moment, thinning as it runs out.',
    earn: { tokens: 40 }, hint: 'Trade 40 Party Tokens for it at any Party Board.',
    color: '#dfe6fb', sound: 'mountNimbus',
  },
  kettle: {
    id: 'kettle', name: 'Kettle Racer', speed: 165, jump: 85, climb: 100, trick: 'dash', dash: 0.35, dashSpeed: 280, steam: 1.1,
    about: 'A copper teakettle on two wheels, with a tanuki along for the ride.',
    trickText: 'Steam dash: double-tap a direction for a burst of speed. The fastest, but it jumps low.',
    earn: { craft: 'mount_kettle' }, hint: 'Craft its key at a bench (Crafting Lv 12).',
    color: '#f4a98a', sound: 'mountKettle',
  },
  turtle: {
    id: 'turtle', name: 'Shell Skipper', speed: 115, jump: 90, climb: 100, trick: 'swim', swimSpeed: 175,
    about: 'A friendly sea turtle. Slow on land, a rocket in the water.',
    trickText: 'Swim: skims across water at speed instead of wading through it.',
    earn: { fish: true }, hint: 'Sometimes swims up to a line cast in the sea. Keep fishing by the shore.',
    color: '#7fd1b9', sound: 'mountTurtle',
  },
  gecko: {
    id: 'gecko', name: 'Ivy Gecko', speed: 140, jump: 100, climb: 210, trick: 'climb',
    about: 'A leafy gecko with a blossom on its head. It can run up anything.',
    trickText: 'Climb: runs up ropes and ladders at double speed without getting off.',
    earn: { find: 'woods' }, hint: 'Suns itself somewhere high in the Mossy Woods treetops.',
    color: '#9fe0a0', sound: 'mountGecko',
  },
};
export const MOUNT_IDS = Object.keys(MOUNTS);

// How long getting on and off takes (s): a little hop up into the seat, a hop down.
export const MOUNT_TIME = 0.28;
// Wading: walking through water (not on a swimming mount) slows you to this % of your speed.
export const WADE = 60;

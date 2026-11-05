// The main story: seven chapters from level 1 to 50 (see docs/design/progression-plan.md). Cozy,
// funny, and with heart (every queen has a sad backstory, and by the third you see it coming). Hayate, the great Tengu who guards the island, has fallen into a deep sleep and her
// wind has stopped blowing; without it the island's spirits are growing lonely and sour. Mira takes
// the newcomer under her wing, and chapter by chapter they calm each region's queen, find out why
// the light is fading, and in the end hear Hayate stir.
//
// Story quests are ordinary quests (data/quests.js merges these in) marked `story` with their
// `chapter`; they get a star marker and their own tab. `scenes` names the cutscenes (SCENES below)
// that play when the quest is accepted, when it's handed in, and (for a queen's trial) when she
// falls. A trial quest's `trial` names the arena where the queen waits.
//
// A scene is a list of steps: { card, sub } a chapter title card; { who, text, mood } a line, `who`
// being an NPC id, 'player', a monster id (the queens), or null for narration; `mood` a face for
// whoever speaks ('happy', 'sad', 'surprised', 'angry').

import { SIDE_SCENES, JOB_SCENES, HOLLOW_SCENES, HOLLOW_BOSS_SCENES, MANOR_SCENES, AQUA_SCENES, CARNIVAL_SCENES, OBS_SCENES, VOLCANO_SCENES, THEATRE_SCENES, WHALE_SCENES } from './scenes.js';

export const CHAPTERS = [
  { n: 1, title: 'A New Breeze', levels: '1-5' },
  { n: 2, title: 'Sour Hills', levels: '5-10' },
  { n: 3, title: 'Roots Run Deep', levels: '10-15' },
  { n: 4, title: 'The Party That Never Ends', levels: '15-20' },
  { n: 5, title: 'Whispers in the Glade', levels: '18-23' },
  { n: 6, title: 'Foxfire at Dusk', levels: '23-30' },
  { n: 7, title: 'The Night the Sky Stood Still', levels: '30-34' },
  { n: 8, title: 'Steam and Roses', levels: '33-39' },
  { n: 9, title: 'Above the Clouds', levels: '40-44' },
  { n: 10, title: 'The Crystal King', levels: '45-50' },
];

const s = (id, chapter, fields) => ({ id, story: true, chapter, ...fields });

export const STORY_QUESTS = {
  // ---------- Chapter 1: A New Breeze (1-5) and Chapter 2: Sour Hills (5-10) ----------
  story_1_1: s('story_1_1', 1, {
    name: 'Welcome to Sprout', giver: 'mira', minLevel: 1,
    text: "Every new face in Sprout Village gets a proper hello. It's the tutorial! I mean, it's tradition. Go say hi to Pip at the shop and Kestrel at the Archer Lodge, then come back to me!",
    objectives: [
      { type: 'talk', npc: 'pip', say: "A new adventurer! Welcome, welcome! Here's your loyalty card. It's blank. Everything starts blank. Isn't that exciting?" },
      { type: 'talk', npc: 'kestrel', say: "Hm. Good posture. You'll do. Don't touch the targets. Don't touch the bows. Don't ask about the Spring Fair." },
    ],
    rewards: { exp: 30, gold: 30, items: [{ id: 'red_potion', qty: 10 }] },
    scenes: { accept: 'ch1_open', done: 'ch1_hello' },
  }),
  story_1_2: s('story_1_2', 1, {
    name: 'The Wind Has Stopped', giver: 'mira', minLevel: 3, prereq: 'story_1_1',
    text: "The Moss Tortoises in Petal Meadow used to be the sleepiest things on the island. Now they snap at people. A TORTOISE. Snapping! Could you calm 10 of them? Tip: stand next to one and attack. Sorry. Habit.",
    objectives: [{ type: 'kill', mob: 'snailbun', count: 10 }],
    rewards: { exp: 300, gold: 38, items: [{ id: 'orange_potion', qty: 10 }] },
    scenes: { done: 'ch1_wind' },
  }),
  story_1_3: s('story_1_3', 2, {
    name: 'Grumbling Hills', giver: 'mira', minLevel: 6, prereq: 'story_1_2',
    text: "Clover Hills is worse. The Toadstool Goblins are stealing laundry right off the lines! Only socks. Only LEFT socks. Calm 12 of them and bring me 5 of their caps. I want to see if they're... sour.",
    objectives: [{ type: 'kill', mob: 'mushkin', count: 12 }, { type: 'collect', item: 'mushcap', count: 5 }],
    rewards: { exp: 2200, gold: 190, items: [] },
    scenes: { accept: 'ch2_sour_open', done: 'ch1_sour' },
  }),
  story_festival: s('story_festival', 2, {
    name: 'The Last Festival', giver: 'mira', minLevel: 8, prereq: 'story_1_3',
    text: "The Jackalopes in Clover Hills have been wearing the bunting from the Falling Star Festival on their antlers for weeks. Nobody's taken it down. It doesn't feel... finished. Calm 15 of them and bring me back 6 antlers with the bunting still on. Gently. They think they look lovely.",
    objectives: [{ type: 'kill', mob: 'piglet', count: 15 }, { type: 'collect', item: 'ribbon', count: 6 }],
    rewards: { exp: 1800, gold: 130, items: [{ id: 'orange_potion', qty: 10 }] },
    scenes: { done: 'ch2_festival' },
  }),
  story_1_4: s('story_1_4', 2, {
    name: 'A Path of Your Own', giver: 'mira', minLevel: 10, prereq: 'story_festival',
    text: "You're ready for a path of your own! Visit an instructor: Kestrel here, Brann in Ember Crag, Vex in Pastel Harbor, or Elowen in Moonleaf Grove. M opens the world map. You knew that. I know you knew that. Then come home and tell me everything!",
    objectives: [{ type: 'job', tier: 1 }],
    rewards: { exp: 2000, gold: 240, items: [{ id: 'ear_10', qty: 1, variant: 'roll' }] },
    scenes: { done: 'ch1_end' },
  }),

  // ---------- Chapter 3: Roots Run Deep (10-15) ----------
  story_2_1: s('story_2_1', 3, {
    name: 'Rumbles Underfoot', giver: 'rook', minLevel: 10, prereq: 'story_1_4',
    text: "Mira sent you? Good. The whole harbor shakes at night, and it's coming from under Windy Canyon. Go up there and find Bramble at the Hollow Gate. He knows the old roots. He also has a lot of rules. Nod along.",
    objectives: [{ type: 'visit', map: 'canyon' }, { type: 'talk', npc: 'bramble', say: "Rook's right. Gnarlroot, the old heart of the Hollow, is tossing in his sleep. Something's troubling him. And before you ask: no, you can't go in alone. Nobody goes in alone." }],
    rewards: { exp: 2500, gold: 200, items: [{ id: 'orange_potion', qty: 20 }] },
    scenes: { accept: 'ch2_open', done: 'ch2_found' },
  }),
  story_2_2: s('story_2_2', 3, {
    name: 'Heart of the Hollow', giver: 'bramble', minLevel: 12, prereq: 'story_2_1',
    text: "Gather a group and go down into Rootwood Hollow. One tank, one healer, two fighters. Gnarlroot isn't wicked, he's frightened. Calm him, and the canyon will rest again. And nobody. Charges. In.",
    objectives: [{ type: 'kill', mob: 'gnarlroot', count: 1 }],
    rewards: { exp: 12000, gold: 900, items: [{ id: 'warrior_gloves_10', qty: 1, forJob: true, variant: 'roll' }] },
    scenes: { done: 'ch2_end' },
  }),
  story_root: s('story_root', 3, {
    name: 'What the Root Remembers', giver: 'bramble', minLevel: 13, prereq: 'story_2_2',
    text: "Gnarlroot talks in his sleep now, and I wrote it all down. Rule 41: listen to roots. Take my scroll to Elowen in Moonleaf Grove, she reads spirits. And clear 15 Manticore Cubs off the canyon road first, they keep waking him. Quietly. Nobody charges.",
    gives: [{ id: 'parcel' }],
    objectives: [
      { type: 'kill', mob: 'scorpip', count: 15 },
      { type: 'deliver', npc: 'elowen', item: 'parcel', say: "'The night the stars stood still.' Hm. Rule 41, rule 42, rule 43... does he number his sandwiches too? Tell Bramble the stars standing still is not a dream. Something went very wrong in the sky that night. I shall look into it. Dramatically." },
    ],
    rewards: { exp: 6000, gold: 200, items: [{ id: 'orange_potion', qty: 15 }] },
    scenes: { accept: 'ch3_root_open', done: 'ch3_root_done' },
  }),

  // ---------- Chapter 4: The Party That Never Ends (15-20) ----------
  story_invite: s('story_invite', 4, {
    name: 'An Invitation', giver: 'elowen', minLevel: 15, prereq: 'story_root',
    text: "An invitation came for me. To Lady Marigold's party on Manor Hill. Written a hundred years ago, dated last month, addressed to 'the Most Dramatic Witch in the Grove'. Accurate. But I do not do parties, I do entrances. Take my reply to Mr. Pumpkins at the manor gate, and mind the Wargs in Mossy Woods: clear 15 of them, they keep crashing it.",
    gives: [{ id: 'letter' }],
    objectives: [
      { type: 'kill', mob: 'boarlet', count: 15 },
      { type: 'deliver', npc: 'pumpkins', item: 'letter', say: "An RSVP? Nobody's RSVP'd in a hundred years. The guests just arrive, and never go home. Tell the witch the party's every night, and the dress code is 'forever'." },
    ],
    rewards: { exp: 7200, gold: 210, items: [{ id: 'orange_potion', qty: 15 }] },
    scenes: { accept: 'party_open', done: 'party_invite' },
  }),
  story_waltz: s('story_waltz', 4, {
    name: 'The Last Waltz', giver: 'elowen', minLevel: 16, prereq: 'story_invite',
    text: "A party that never ends. The guests never go home. And somebody has to tell the hostess, gently. That somebody is you, with a group of four: Mr. Pumpkins will let you into Moonlit Manor. Dance with her, if you must. Bring me back anything strange.",
    objectives: [{ type: 'kill', mob: 'marigold', count: 1 }],
    rewards: { exp: 20000, gold: 600, items: [{ id: 'warrior_top_15', qty: 1, forJob: true, variant: 'roll' }, { id: 'elixir', qty: 3 }] },
    scenes: { done: 'party_clocks' },
  }),

  // ---------- Chapter 5: Whispers in the Glade (18-23) ----------
  story_3_1: s('story_3_1', 5, {
    name: 'A Song Out of Tune', giver: 'elowen', minLevel: 18, prereq: 'story_waltz',
    text: "Listen. Can you hear it? Someone is weeping in the Whispering Glade, past Mossy Woods, very loudly and very dramatically. Trust me, I know dramatic. The Sylphs have gone wild with it. Go gently: calm 15 of them, and find out who.",
    objectives: [{ type: 'visit', map: 'glade' }, { type: 'kill', mob: 'sylph', count: 15 }],
    rewards: { exp: 17000, gold: 450, items: [{ id: 'mana_elixir', qty: 5 }] },
    scenes: { accept: 'ch3_open', done: 'ch3_crying' },
  }),
  story_3_2: s('story_3_2', 5, {
    name: 'The Dryad Queen', giver: 'elowen', minLevel: 20, prereq: 'story_3_1',
    text: "It's Sylvana, the Dryad Queen. Her bower is at the far end of the glade, past the waterfall. She won't listen to words right now; she's at the throwing-the-whole-forest stage of feelings. Show her your heart, stand your ground, and duck.",
    objectives: [{ type: 'kill', mob: 'sylvana', count: 1 }],
    trial: 'bower',
    rewards: { exp: 39000, gold: 1200, items: [{ id: 'warrior_hat_20', qty: 1, forJob: true, variant: 'roll' }, { id: 'elixir', qty: 3 }] },
    scenes: { accept: 'ch3_trial', win: 'ch3_win', done: 'ch3_end' },
  }),

  // ---------- Chapter 6: Foxfire at Dusk (23-30) ----------
  story_4_1: s('story_4_1', 6, {
    name: 'Tricks on the Road', giver: 'vex', minLevel: 22, prereq: 'story_3_2',
    text: "Travellers on the Fox Shrine Path keep coming back with empty pockets and leaves in their purses. Somebody's robbing people on MY island, and it isn't me. Unacceptable. Calm 20 Nekomata and look around.",
    objectives: [{ type: 'visit', map: 'shrine' }, { type: 'kill', mob: 'nekomata', count: 20 }],
    rewards: { exp: 26000, gold: 680, items: [{ id: 'white_potion', qty: 15 }] },
    scenes: { accept: 'ch4_open', done: 'ch4_road' },
  }),
  story_4_2: s('story_4_2', 6, {
    name: 'A Forgotten Shrine', giver: 'vex', minLevel: 25, prereq: 'story_4_1',
    text: "There's a little shrine on the top terrace up there. Nobody's left an offering in years. Relight its lanterns with 10 Wisp Flames from the Kitsune Miko, and say a prayer while you're there. Make it dramatic. Foxes love a show.",
    objectives: [{ type: 'collect', item: 'wisp_flame', count: 10 }, { type: 'visit', map: 'shrine', above: 530, place: 'the shrine on the top terrace' }],
    rewards: { exp: 25000, gold: 660, items: [] },
    scenes: { done: 'ch4_shrine' },
  }),
  story_4_3: s('story_4_3', 6, {
    name: 'The Nine-Tailed Empress', giver: 'vex', minLevel: 28, prereq: 'story_4_2',
    text: "The prayer woke her. Tamamo, the Nine-Tailed Empress, waits in her sanctum at the end of the path. Nine tails, nine tricks, no manners. Don't trust what you see. On principle, don't trust me either.",
    objectives: [{ type: 'kill', mob: 'tamamo', count: 1 }],
    trial: 'sanctum',
    rewards: { exp: 78000, gold: 1700, items: [{ id: 'warrior_cape_25', qty: 1, forJob: true, variant: 'roll' }, { id: 'elixir', qty: 5 }] },
    scenes: { accept: 'ch4_trial', win: 'ch4_win', done: 'ch4_end' },
  }),

  // ---------- Chapter 8: Steam and Roses (33-39) ----------
  story_5_1: s('story_5_1', 8, {
    name: 'Cold Springs', giver: 'nim', minLevel: 31, prereq: 'story_4_3',
    text: "T-the hot springs past the Crystal Cave are going cold! Without them my moonberries won't grow. Could you go and see? I'd go, but the Lamia there are in a terrible mood, and also there are... people. Sorry.",
    objectives: [{ type: 'visit', map: 'springs' }, { type: 'kill', mob: 'lamia', count: 20 }],
    rewards: { exp: 50000, gold: 1100, items: [{ id: 'mana_elixir', qty: 10 }] },
    scenes: { accept: 'ch5_open', done: 'ch5_cold' },
  }),
  story_5_2: s('story_5_2', 8, {
    name: 'Frost on the Mountain', giver: 'nim', minLevel: 34, prereq: 'story_5_1',
    text: "The cold is coming down from Frozen Peak... or going up to it? I made a chart. The arrows go both ways. The Yuki-onna are carrying the warmth away in icy gems. Bring me 12? I want to know where they're taking it.",
    objectives: [{ type: 'visit', map: 'peak' }, { type: 'collect', item: 'snow_gem', count: 12 }],
    rewards: { exp: 79000, gold: 1600, items: [{ id: 'warrior_shoes_35', qty: 1, forJob: true, variant: 'roll' }] },
    scenes: { done: 'ch5_gems' },
  }),
  story_5_3: s('story_5_3', 8, {
    name: 'The Rose Grotto', giver: 'nim', minLevel: 37, prereq: 'story_5_2',
    text: "The gems glow with rose light... it's Lilith! She's taking the springs' warmth down to her grotto behind the waterfall in Serpent Springs. In my books, this is where the hero says something brave. I-I'll just say please. Please bring the warmth home.",
    objectives: [{ type: 'kill', mob: 'lilith', count: 1 }],
    trial: 'grotto',
    rewards: { exp: 120000, gold: 2200, items: [{ id: 'warrior_top_35', qty: 1, forJob: true, variant: 'roll' }, { id: 'elixir', qty: 8 }] },
    scenes: { accept: 'ch5_trial', win: 'ch5_win', done: 'ch5_end' },
  }),

  // ---------- Chapter 9: Above the Clouds (40-44) ----------
  story_6_1: s('story_6_1', 9, {
    name: 'The Sleeping Wind', giver: 'elowen', minLevel: 40, prereq: 'story_5_3',
    text: "Every queen has said the same thing: the wind stopped. Three queens, three tragic speeches, one pattern. The great Tengu, Hayate, sleeps somewhere above the clouds. Climb to the top of the Sky Garden and calm 20 Sky Harpies; they guard the way up, and they're rude about it.",
    objectives: [{ type: 'visit', map: 'sky', above: 570, place: 'the top of the Sky Garden' }, { type: 'kill', mob: 'windbird', count: 20 }],
    rewards: { exp: 91000, gold: 1500, items: [{ id: 'elixir', qty: 10 }] },
    scenes: { accept: 'ch6_open', done: 'ch6_sky' },
  }),
  story_6_2: s('story_6_2', 9, {
    name: 'Where Stars Fall', giver: 'elowen', minLevel: 44, prereq: 'story_6_1',
    text: "Above the garden lies Starfall Heights, where the moon comes close. Gather 10 Stardust there; Selene, the Moon Valkyrie, will only meet someone who carries the stars. She's very formal. Don't call her 'Moony'. I did, once.",
    objectives: [{ type: 'visit', map: 'starfall' }, { type: 'collect', item: 'stardust', count: 10 }],
    rewards: { exp: 130000, gold: 2000, items: [{ id: 'warrior_gloves_45', qty: 1, forJob: true, variant: 'roll' }] },
    scenes: { done: 'ch6_stars' },
  }),
  story_6_3: s('story_6_3', 10, {
    name: 'The Moon Valkyrie', giver: 'elowen', minLevel: 48, prereq: 'story_6_2',
    text: "Selene guards Hayate's sleep on the Moon Terrace at the far end of Starfall Heights. She will test you, she won't hold back, and she won't give a tragic speech either. She thinks those are tacky. Show her the island is worth waking for.",
    objectives: [{ type: 'kill', mob: 'selene', count: 1 }],
    trial: 'terrace',
    rewards: { exp: 300000, gold: 3000, items: [{ id: 'warrior_cape_45', qty: 1, forJob: true, variant: 'gilded' }, { id: 'elixir', qty: 10 }] },
    scenes: { accept: 'ch6_trial', win: 'ch6_win', done: 'ch6_end' },
  }),

  // ---------- Chapter 10: The Crystal King (45-50) ----------
  story_7_1: s('story_7_1', 10, {
    name: 'Home Again', giver: 'mira', minLevel: 45, prereq: 'story_6_3',
    text: "You're back! Oh, look at you. Sit. Tea. Tell me everything... and then, I'm afraid, there's one more thing. Captain Rook says the Crystal Cave has gone completely dark. Caves are usually dark, dear. This is extra.",
    objectives: [{ type: 'talk', npc: 'rook', say: "The throne room's dark as a pocket. Prismaris has been drinking every bit of light on the island. I lit a candle down there and it got nervous and left. Go easy on him, kid... but go." }],
    rewards: { exp: 100000, gold: 1700, items: [{ id: 'elixir', qty: 10 }] },
    scenes: { accept: 'ch7_open', done: 'ch7_rook' },
  }),
  story_7_2: s('story_7_2', 10, {
    name: 'Heart of Crystal', giver: 'mira', minLevel: 45, prereq: 'story_7_1',
    text: "Prismaris, the Crystal King, sits on his throne deep in the Crystal Cave. Bring the light home. I'll have a pot of tea waiting. And biscuits. Don't tell Elowen whose recipe.",
    objectives: [{ type: 'kill', mob: 'crystalking', count: 1 }],
    rewards: { exp: 400000, gold: 2700, items: [{ id: 'warrior_hat_50', qty: 1, forJob: true, variant: 'gilded' }, { id: 'elixir', qty: 20 }] },
    scenes: { done: 'ch7_end' },
  }),
};

// Story locks: a portal stays shut until its chapter's quest has been accepted (or finished);
// `note` is what you're told at the door.
// The main story is optional (the player's call, 2026-11-01): every region is open from the start.
// Only the story's own arenas, where its queens wait, stay closed until the story gets there.
export const STORY_LOCKS = {
  'glade.bower': { quest: 'story_3_2', note: 'Thorny vines close the way to the bower.' },
  'shrine.sanctum': { quest: 'story_4_3', note: 'The sanctum gate is sealed with a fox charm.' },
  'springs.grotto': { quest: 'story_5_3', note: 'Roses grow thick behind the waterfall.' },
  'starfall.terrace': { quest: 'story_6_3', note: 'Moonlight bars the terrace.' },
};

// Where the queens wait: each trial arena, its queen, and the quest that sends you there. After
// her trial, a queen comes back now and then on her region's map for a friendly rematch (a field
// boss anyone there can fight together).
export const TRIALS = {
  bower: { boss: 'sylvana', quest: 'story_3_2', field: 'glade', x: 1000 },
  sanctum: { boss: 'tamamo', quest: 'story_4_3', field: 'shrine', x: 1000 },
  grotto: { boss: 'lilith', quest: 'story_5_3', field: 'springs', x: 1000 },
  terrace: { boss: 'selene', quest: 'story_6_3', field: 'starfall', x: 1000 },
};

export const SCENES = {
  // ----- Chapter 1 -----
  // (Staged in the village itself, world/director.js: the camera opens on the great windmill, its
  // sails all but still, pans back to you, and Mira spots you and hurries over.)
  ch1_open: [
    { card: 'Chapter 1', sub: 'A New Breeze' },
    { fade: 'out', dur: 0.35 },
    { cam: { x: 1800, y: 330 }, dur: 0 },
    { fade: 'in', dur: 0.9, async: true },
    { fx: 'petals', at: { x: 1800, y: 260 }, n: 16 },
    { who: null, text: "Sprout Village. Warm bread, flower boxes, and a windmill whose sails haven't turned in weeks. Somewhere nearby, a tutorial is about to begin." },
    { cam: 'player', dur: 2.2 },
    { emote: 'mira', kind: '!' },
    { walk: 'mira', to: 'player', gap: 34, speed: 110 },
    { together: [{ face: 'player', to: 'mira' }, { face: 'mira', to: 'player' }] },
    { jump: 'mira' },
    { who: 'mira', text: "You made it! Welcome, welcome! I'm Mira. I look after newcomers. Press I for your bag, K for skills, C for stats... sorry. I get excited.", mood: 'happy' },
    { emote: 'mira', kind: 'sweat', dur: 1.8 },
    { who: 'mira', text: "It's a little quiet lately. The wind used to sing through the village every morning. Now it just... doesn't. Very rude of it.", mood: 'sad' },
    { emote: 'mira', kind: 'idea' },
    { who: 'mira', text: "Oh, but listen to me! First things first: everyone should meet their neighbours.", mood: 'happy' },
    { say: 'mira', text: 'Pip at the shop, then Kestrel at the Archer Lodge!' },
  ],
  ch1_hello: [
    { emote: 'mira', kind: 'heart' },
    { who: 'mira', text: "Pip gave you a loyalty card? She likes you. And Kestrel said 'you'll do'? From Kestrel, that's practically a hug.", mood: 'happy' },
    { emote: 'player', kind: '?' },
    { who: 'player', text: 'Mira... why did the wind stop?' },
    { emote: 'mira', kind: 'sweat', dur: 1.6 },
    { who: 'mira', text: "That's a story for tea. Long story. Lots of tea. For now, let's see how you do in the meadow. Everybody starts with tortoises." },
  ],
  ch1_wind: [
    { who: 'mira', text: "So you saw it. The sleepiest tortoises on the island, snapping like crabs. One bit my shoelace and wouldn't let go for an hour.", mood: 'sad' },
    { who: 'mira', text: 'This island has a guardian: Hayate, the great Tengu. Her wind carries songs, seeds, kites, and good moods. Mostly good moods.' },
    { who: 'mira', text: "A few weeks ago, her wind just... stopped. And the spirits have been getting lonely and sour ever since.", mood: 'sad' },
    { who: 'player', text: 'So... am I the chosen one?' },
    { together: [{ emote: 'mira', kind: 'note', dur: 1.4 }, { jump: 'mira', height: 8 }] },
    { who: 'mira', text: "You're the one who showed up, dear. Around here that counts for a lot.", mood: 'happy' },
  ],
  ch2_sour_open: [
    { card: 'Chapter 2', sub: 'Sour Hills' },
    { who: 'mira', text: "Petal Meadow was only the start. Clover Hills is grumpy too, and the goblins up there have started stealing laundry. Only socks. Only LEFT socks.", mood: 'sad' },
  ],
  ch1_sour: [
    { who: 'mira', text: 'Sour all right. These caps are grumpier than a rainy Monday. One of them hissed at me.', mood: 'sad' },
    { who: 'mira', text: "I think Hayate is asleep. Deeply. I can't climb mountains any more, but you..." },
    { who: 'mira', text: 'You could find her! But first you need a path of your own. And better trousers.', mood: 'happy' },
  ],
  ch2_festival: [
    { who: null, text: 'Mira untangles the bunting from the antlers, one star-shaped flag at a time, and lays it out on the grass.' },
    { together: [{ fx: 'confetti', at: 'mira', n: 14 }, { emote: 'mira', kind: 'note', dur: 1.4 }] },
    { who: 'mira', text: "The Falling Star Festival. The whole village came this year, for the first time in ages. I made three hundred commemorative mugs.", mood: 'happy' },
    { together: [{ emote: 'mira', kind: 'sweat', dur: 1.4 }, { wait: 0.4 }] },
    { who: 'mira', text: 'Nobody bought one. They are all still in my cupboard. They say BEST ONE YET.', mood: 'sad' },
    { who: 'player', text: 'What happened that night?' },
    { together: [{ emote: 'mira', kind: '?', dur: 1.6 }, { wait: 0.8 }] },
    { who: 'mira', text: "Well... the stars didn't fall. Not one. We waited up till midnight and they just... hung there. Everyone went home grumpy.", mood: 'sad' },
    { together: [{ emote: 'mira', kind: '!', dur: 1.4 }, { jump: 'mira', height: 10 }] },
    { who: 'mira', text: "Oh. Oh my. That was the night the wind stopped. The tortoises, the goblins, the windmill... it all went sour that very night!", mood: 'surprised' },
    { who: 'mira', text: "I'll write it down. In the margin of a mug. Now go and find a path of your own, dear; this is a job for someone with a job.", mood: 'happy' },
  ],
  // (Staged: Mira steps close to give you her earring; it catches a wind that isn't there.)
  ch1_end: [
    { emote: 'mira', kind: 'heart' },
    { jump: 'mira' },
    { who: 'mira', text: "Look at you! A real adventurer, with a job and everything. I'm so proud I could burst. Please don't let me burst.", mood: 'happy' },
    { walk: 'mira', to: 'player', gap: 24 },
    { together: [{ face: 'mira', to: 'player' }, { face: 'player', to: 'mira' }] },
    { who: 'mira', text: 'Here. This earring was mine when I was young. It always caught the wind. It also caught a lot of hair. Mind that.' },
    { fx: 'sparkle', at: 'player', n: 16 },
    { wait: 0.5 },
    { together: [{ fx: 'wind', at: 'player' }, { shake: 1.6, dur: 0.7 }, { emote: 'player', kind: '!' }] },
    { wait: 0.6 },
    { who: null, text: 'For a moment, the earring trembles, as if a breeze far away had remembered your name.' },
    { who: 'mira', text: "Captain Rook in Pastel Harbor has been asking for help. Go on, and write me! The map's on... no. You know. Go!", mood: 'happy' },
    { emote: 'mira', kind: 'note' },
  ],
  // ----- Chapter 2 -----
  ch2_open: [
    { card: 'Chapter 3', sub: 'Roots Run Deep' },
    { together: [{ emote: 'rook', kind: 'anger', dur: 1.4 }, { shake: 1.4, dur: 0.4 }] },
    { who: 'rook', text: 'Every night, BOOM. Every night! My tea jumps right out of the cup. Last night it did a backflip and landed in my hat.', mood: 'angry' },
    { who: 'rook', text: "It's coming from under Windy Canyon. Bramble at the Hollow Gate will know more. Nod at his rules. There are a lot of them." },
  ],
  ch2_found: [
    { who: 'player', text: 'Bramble says Gnarlroot, the old heart of the Hollow, is tossing in his sleep.' },
    { together: [{ emote: 'rook', kind: '?', dur: 1.4 }, { wait: 0.4 }] },
    { who: 'rook', text: "A giant tree root having nightmares under my harbor. Forty years at sea and that's a new one. Usually it's krakens.", mood: 'surprised' },
    { who: 'rook', text: "Go and calm him, kid. Take friends. And if you see my tea down there, tell it to come home.", mood: 'happy' },
  ],
  ch2_end: [
    { who: 'bramble', text: 'The canyon is quiet. Listen... is that... snoring?', mood: 'surprised' },
    { who: 'gnarlroot', text: '...lullaby... the wind used to sing me a lullaby... so quiet now...' },
    { who: 'bramble', text: "Poor old root. He wasn't angry. He just couldn't sleep without her song.", mood: 'sad' },
    { together: [{ emote: 'bramble', kind: 'sweat', dur: 1.4 }, { wait: 0.4 }] },
    { who: 'bramble', text: 'I sang him one myself, once. He woke up and asked me to stop. Tell nobody.', mood: 'sad' },
    { who: 'bramble', text: "And now he's started talking in his sleep. Catch your breath, then come and listen with me. Bring a healer. Out of habit." },
  ],
  ch3_root_open: [
    { who: 'bramble', text: 'He talks in his sleep now. Every night. Listen.', mood: 'sad' },
    { together: [{ shake: 1.2, dur: 1.2 }, { fx: 'dust', at: 'bramble', n: 10 }, { face: 'bramble', to: 1 }, { emote: 'player', kind: '?', dur: 1.2 }] },
    { who: null, text: 'From deep under the Hollow door, a voice like a creaking branch rumbles up through the roots.' },
    { who: 'gnarlroot', text: '...the stars... stood still... so still... and then the song... never came...' },
    { together: [{ emote: 'bramble', kind: 'idea', dur: 1.4 }, { fx: 'pages', at: 'bramble', n: 10 }] },
    { who: 'bramble', text: 'I wrote it down. Rule 41: listen to roots. Rule 42: write down what roots say. Rule 43: do not let roots catch you writing.', mood: 'happy' },
  ],
  ch3_root_done: [
    { who: 'player', text: "Elowen says the stars standing still wasn't a dream. Something went wrong in the sky that night. She'll look into it. Dramatically." },
    { together: [{ emote: 'bramble', kind: '!', dur: 1.4 }, { wait: 0.4 }] },
    { who: 'bramble', text: "The same night as Mira's festival. The same night the lullaby stopped. That's not bad luck, that's a pattern.", mood: 'surprised' },
    { who: 'bramble', text: 'Rule 44: when the sky does something strange, go and see Elowen. She will have made it about her by now, but she will be right.', mood: 'happy' },
  ],
  // ----- Chapter 4 -----
  party_open: [
    { card: 'Chapter 4', sub: 'The Party That Never Ends' },
    { together: [{ emote: 'elowen', kind: 'sparkle', dur: 1.6 }, { fx: 'sparkle', at: 'elowen', n: 10 }] },
    { who: 'elowen', text: "'To the Most Dramatic Witch in the Grove.' Well. At least somebody on this island has taste.", mood: 'happy' },
    { who: null, text: 'The invitation is yellow with age and smells of old roses. The date at the bottom is last month.' },
    { who: 'elowen', text: 'A hundred-year-old letter, sent last month. Rule 44 of Bramble, I suppose: when something strange happens, it comes to me.', mood: 'surprised' },
  ],
  party_invite: [
    { who: 'player', text: "Mr. Pumpkins says the party's every night, nobody goes home, and the dress code is 'forever'." },
    { together: [{ emote: 'elowen', kind: 'sweat', dur: 1.4 }, { wait: 0.4 }] },
    { who: 'elowen', text: "Forever. I own nothing that goes with forever. That settles it: you're going.", mood: 'surprised' },
    { who: 'elowen', text: "Lady Marigold has been throwing that party since before Mira was born. If her guests can't go home, something has gone wrong with her night. Find out what.", mood: 'sad' },
  ],
  party_clocks: [
    { who: 'player', text: "The guests have gone home. And every clock in the manor stopped at the same minute. Midnight." },
    { together: [{ fx: 'gears', at: 'player', n: 12 }, { emote: 'elowen', kind: '!', dur: 1.4 }] },
    { who: null, text: 'You hold up a little gold pocket watch from Lady Marigold\'s table. Its hands have not moved since midnight on festival night.' },
    { who: 'elowen', text: "Mira's festival. Gnarlroot's stars that stood still. And now a manor's clocks, stopped at midnight. The same night, three times.", mood: 'surprised' },
    { together: [{ emote: 'elowen', kind: 'idea', dur: 1.4 }, { fx: 'pages', at: 'elowen', n: 12 }] },
    { who: 'elowen', text: 'I shall make a chart. With string. And a great deal of pointing.', mood: 'happy' },
    { together: [{ face: 'elowen', to: 'player' }, { wait: 0.6 }] },
    { who: 'elowen', text: "A hundred years of parties and nobody to dance with... I know a little about shutting a door and waiting for someone to knock. I'm glad you knocked on hers.", mood: 'sad' },
    { who: 'elowen', text: "Rest a while. When you're ready, come back: the Glade has been crying lately, and I don't think it's a coincidence any more.", mood: 'happy' },
  ],
  // ----- Chapter 3 -----
  ch3_open: [
    { card: 'Chapter 5', sub: 'Whispers in the Glade' },
    { who: 'elowen', text: 'Gnarlroot missed his lullaby, and now someone in the woods is weeping. Can you hear it? Loud, isn\'t it. Very... theatrical.' },
    { who: 'elowen', text: 'The wind wall around the Whispering Glade has thinned. Go quickly, and go gently. Perhaps bring a hanky.' },
  ],
  ch3_crying: [
    { who: 'elowen', text: 'The Sylphs said a name: Sylvana. The Dryad Queen.', mood: 'sad' },
    { who: 'elowen', text: "Her trees can't talk to each other without the wind. She's been alone in her bower for weeks, writing long, sad poems. The Sylphs have had to listen to all of them.", mood: 'sad' },
  ],
  ch3_trial: [
    { who: null, text: 'The vines part, just a little. Beyond them, a bower of white flowers and green light.' },
    { who: 'sylvana', text: "Another one? Go away! The trees don't sing any more, and neither will I! I'm going to be sad forever, and it's going to be BEAUTIFUL!", mood: 'angry' },
  ],
  ch3_win: [
    { who: 'sylvana', text: '...you stayed. Even when I threw the whole forest at you, you stayed.', mood: 'sad' },
    { who: 'sylvana', text: "I was so lonely. Without Hayate's wind my trees can't whisper. I thought everyone had forgotten us." },
    { who: 'player', text: "We'll wake her. I promise." },
    { who: 'sylvana', text: "Then take my blessing. And visit! I'll be waiting for a rematch. I'm going to practise my throwing.", mood: 'happy' },
  ],
  ch3_end: [
    { who: 'elowen', text: 'Sylvana is smiling again, and the glade sings on its own. She also sent me forty pages of happy poems. Forty.', mood: 'happy' },
    { who: 'elowen', text: "But she's the first, not the last. Vex has been asking for you in Pastel Harbor. Count your pockets afterwards." },
  ],
  // ----- Chapter 4 -----
  ch4_open: [
    { card: 'Chapter 6', sub: 'Foxfire at Dusk' },
    { who: 'vex', text: "Somebody's picking pockets on my roads, and it isn't me. That's personal. That's PROFESSIONAL.", mood: 'angry' },
    { who: 'vex', text: 'Leaves in purses, footprints going in circles. Foxes. Amateur work. Check the Fox Shrine Path.' },
  ],
  ch4_road: [
    { who: 'player', text: "It's foxes. Every pocket on the path is full of leaves." },
    { together: [{ emote: 'vex', kind: 'anger', dur: 1.4 }, { jump: 'vex', height: 10 }] },
    { who: 'vex', text: 'Leaves? They take your gold and leave LEAVES? No style. No signature. I always leave a little card.', mood: 'angry' },
    { who: 'vex', text: "There's a shrine up top nobody visits any more. Light it up, and let's see who comes running.", mood: 'happy' },
  ],
  ch4_shrine: [
    { who: null, text: 'The little shrine glows. The lanterns flicker, then hold. Somewhere above, nine tails stir.' },
    { who: 'vex', text: "You lit it? Then she knows we're here. Whoever 'she' is. Nine tails. I counted. Showing off.", mood: 'surprised' },
  ],
  ch4_trial: [
    { who: null, text: 'Foxfire lanterns light the sanctum one by one. Something laughs, everywhere and nowhere.' },
    { who: 'tamamo', text: "A visitor! How rare. How DELIGHTFUL. Let's play a game, little one.", mood: 'happy' },
    { who: 'tamamo', text: 'Catch the real me, and I\'ll tell you a secret. Catch the wrong one, and you\'ll make a lovely garden statue. I have several. They all look very surprised.' },
    { who: 'player', text: "Let me guess. You're lonely, and this is all a cry for help." },
    { who: 'tamamo', text: '...How DARE you. I am a mysterious empress of illusions. Now hold still while I hit you.', mood: 'angry' },
  ],
  ch4_win: [
    { who: 'tamamo', text: 'Oh, you caught me. How embarrassing. How... wonderful.', mood: 'happy' },
    { who: 'tamamo', text: 'Do you know why I played tricks? No one has visited my shrine since the wind stopped carrying their prayers.', mood: 'sad' },
    { who: 'tamamo', text: 'A tricked traveller at least remembers you.', mood: 'sad' },
    { who: 'player', text: "I'll remember you without the tricks." },
    { who: 'tamamo', text: "...Then here's my secret: something is pulling the island's warmth downhill, toward the springs. And yes, FINE, I was lonely. Don't look so smug.", mood: 'surprised' },
  ],
  ch4_end: [
    { who: 'vex', text: 'Pockets are full again, and the foxes leave little gifts instead. One left a card. With a signature. I am so proud.', mood: 'happy' },
    { who: 'vex', text: "Nim in Moonleaf Grove sent a panicked note. Eleven apologies and the word 'cold'. Go." },
  ],
  // ----- Chapter 5 -----
  ch5_open: [
    { card: 'Chapter 8', sub: 'Steam and Roses' },
    { who: 'nim', text: 'The springs are going c-cold! My moonberries need the steam, and the Lamia are so grumpy, and I had to tell the postman about it. Out loud.', mood: 'sad' },
  ],
  ch5_cold: [
    { who: 'nim', text: "The Lamia said the warmth is being 'taken'. Taken! Where would warmth go? On holiday?", mood: 'surprised' },
    { who: 'nim', text: "Snow has been falling on Frozen Peak. In summer. In my books, that's always a clue. Or a dragon. I hope it's a clue." },
  ],
  ch5_gems: [
    { who: 'nim', text: 'These gems... they glow pink inside. Rose pink.', mood: 'surprised' },
    { who: 'nim', text: "Lilith, the Rose Queen. She keeps a night garden in a grotto behind the springs' waterfall. Sh-she's very glamorous. I'd hide behind you." },
  ],
  ch5_trial: [
    { who: null, text: 'Behind the waterfall, roses bloom in the dark, every one of them warm as a hearth.' },
    { who: 'lilith', text: "Darling, you're dripping on my roses. Do you know how hard it is to keep a garden alive?", mood: 'angry' },
    { who: 'lilith', text: "Without the wind there's no spring, no summer. So I borrowed a little warmth. Well. All of it. Is that so terrible?" },
    { who: 'player', text: "Let me guess. You're lonely, and this is a cry for help." },
    { who: 'lilith', text: 'Who TOLD you? Was it the fox? It was the fox.', mood: 'angry' },
  ],
  ch5_win: [
    { who: 'lilith', text: 'My roses... they were all I had left of the sunshine.', mood: 'sad' },
    { who: 'player', text: 'When Hayate wakes, the summer will come back. For everyone. Your roses too.' },
    { who: 'lilith', text: "...Fine. I'll give the warmth back. But you'll come and smell them in the summer. That's an order. Wear something nice.", mood: 'happy' },
    { who: 'lilith', text: "And darling? Ask Selene about Hayate. The Moon Valkyrie knows where she sleeps. She's no fun at all, but she knows." },
  ],
  ch5_end: [
    { who: 'nim', text: 'The springs are steaming again! My moonberries are fat as plums! And I said thank you to a Lamia. Out loud!', mood: 'happy' },
    { who: 'nim', text: 'Elowen wants to see you. She said the moon has been watching you. Which is lovely. And a bit scary.' },
  ],
  // ----- Chapter 6 -----
  ch6_open: [
    { card: 'Chapter 9', sub: 'Above the Clouds' },
    { who: 'elowen', text: 'Three queens, three hearts calmed, three very long sad speeches. And every one of them says the same thing: find Hayate.' },
    { who: 'elowen', text: 'She sleeps above the clouds, past the Sky Garden. Selene, the Moon Valkyrie, guards the way. Selene does not do speeches. Be ready.' },
  ],
  ch6_sky: [
    { who: 'player', text: 'The Harpies are calm. From the top of the garden there is a silver light above the clouds.' },
    { who: 'elowen', text: "The Moon Terrace. That's her: polishing her armour, disapproving of things.", mood: 'happy' },
    { who: 'elowen', text: "Selene won't meet anyone who doesn't carry the stars. Starfall Heights is just above the garden. Bring stardust, and stand up straight." },
  ],
  ch6_stars: [
    { who: 'elowen', text: 'Ten stardust. She will see you now. Before you go: she will not give a tragic speech, she is not lonely, and she will not throw a forest at you.' },
    { who: 'player', text: 'So what will she do?' },
    { together: [{ emote: 'elowen', kind: 'sweat', dur: 1.4 }, { wait: 0.4 }] },
    { who: 'elowen', text: 'Win, usually. Do not let her.', mood: 'sad' },
  ],
  ch6_trial: [
    { who: null, text: 'The Moon Terrace. Stars fall like slow snow. A knight in silver stands between you and the sky.' },
    { who: 'selene', text: 'Hayate sleeps. She is tired, traveller. Tired of a world that only takes.', mood: 'sad' },
    { who: 'player', text: "Let me guess. You're lonely, and this is a cry for—" },
    { who: 'selene', text: 'No. I am a knight, and this is a duel. Hold nothing back. I will not.', mood: 'angry' },
  ],
  ch6_win: [
    { who: 'selene', text: 'You fight like someone with friends behind you. A glade, a shrine, a garden... I see them all.', mood: 'happy' },
    { who: 'selene', text: '...And yes. It is lonely up here. Do not make the face. The fox warned me about the face.' },
    { who: 'selene', text: 'Hayate did not choose to sleep. Her light was stolen. Prismaris, the Crystal King, has been drinking it.' },
    { who: 'selene', text: 'Go home first. Then go down into the dark. I will watch over her until you return.' },
  ],
  ch6_end: [
    { who: 'elowen', text: 'Prismaris... the poor thing has always been afraid of the dark. He used to borrow my candles and never give them back.', mood: 'sad' },
    { who: 'elowen', text: "Go home to Mira. She's been waiting for you longer than she'll admit. Tell her the biscuits were good. She'll know." },
  ],
  // ----- Chapter 7 -----
  ch7_open: [
    { card: 'Chapter 10', sub: 'The Crystal King' },
    { who: 'mira', text: "Look at you! Taller somehow. Or maybe I'm just proud again. Have you been eating? Sit. Tea.", mood: 'happy' },
    { who: 'mira', text: 'The cave has gone completely dark, dear. Talk to Rook. And then... bring the light home.' },
  ],
  ch7_rook: [
    { who: 'player', text: 'Rook says Prismaris has been drinking every bit of light on the island.' },
    { who: 'mira', text: "Then that's where Hayate's light went. Down a crystal king's throat.", mood: 'sad' },
    { together: [{ walk: 'mira', to: 'player', gap: 30, speed: 70 }, { face: 'mira', to: 'player' }] },
    { who: 'mira', text: "One last tip, I promise. You don't have to beat him. Just turn the lights back on. Most scary things are only scary in the dark.", mood: 'happy' },
    { who: 'mira', text: "...And the map is on M. That one's tradition now.", mood: 'happy' },
  ],
  ch7_end: [
    { who: 'crystalking', text: "Don't... don't turn off the light. Please. It was so dark when she stopped singing.", mood: 'sad' },
    { who: 'player', text: "She stopped because she had no light left. Give it back, and she'll sing again. For you too." },
    { who: 'crystalking', text: '...Can I keep a nightlight?', mood: 'sad' },
    { who: 'player', text: 'You can keep a nightlight.' },
    { who: null, text: 'The crystals dim, one by one, and a warm glow rises up through the cave, up through the cloud, up to the moon.' },
    { who: 'hayate', text: '...little one... thank you. I hear the island again. I am... waking.' },
    { who: 'hayate', text: '...five more minutes...' },
    { who: 'mira', text: 'The wind chime! Did you hear it? Oh, I made too much tea. I always make too much tea. Today it is exactly right.', mood: 'happy' },
    { card: 'To be continued', sub: 'Hayate is waking' },
  ],
};

// The side quests' and job advancements' scenes (data/scenes.js) play the same way.
Object.assign(SCENES, SIDE_SCENES, HOLLOW_SCENES, HOLLOW_BOSS_SCENES, MANOR_SCENES, AQUA_SCENES, CARNIVAL_SCENES, OBS_SCENES, VOLCANO_SCENES, THEATRE_SCENES, WHALE_SCENES);
for (const [k, v] of Object.entries(JOB_SCENES)) SCENES[`job_${k}`] = v;

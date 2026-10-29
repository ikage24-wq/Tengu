// The main story: seven chapters from level 1 to 50 (see docs/design/progression-plan.md). Cozy,
// with heart. Hayate, the great Tengu who guards the island, has fallen into a deep sleep and her
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

import { SIDE_SCENES, JOB_SCENES, HOLLOW_SCENES } from './scenes.js';

export const CHAPTERS = [
  { n: 1, title: 'A New Breeze', levels: '1-10' },
  { n: 2, title: 'Roots Run Deep', levels: '10-15' },
  { n: 3, title: 'Whispers in the Glade', levels: '15-22' },
  { n: 4, title: 'Foxfire at Dusk', levels: '22-30' },
  { n: 5, title: 'Steam and Roses', levels: '30-40' },
  { n: 6, title: 'Moon over Starfall', levels: '40-50' },
  { n: 7, title: 'The Crystal King', levels: '45-50' },
];

const s = (id, chapter, fields) => ({ id, story: true, chapter, ...fields });

export const STORY_QUESTS = {
  // ---------- Chapter 1: A New Breeze ----------
  story_1_1: s('story_1_1', 1, {
    name: 'Welcome to Sprout', giver: 'mira', minLevel: 1,
    text: "Every new face in Sprout Village gets a proper hello. Go say hi to Pip at the shop and Kestrel at the Archer Lodge, then come back to me!",
    objectives: [
      { type: 'talk', npc: 'pip', say: "A new adventurer! Welcome, welcome. Tonics are on the shelf if you need them." },
      { type: 'talk', npc: 'kestrel', say: "Hm. Good posture. You'll do fine here, newcomer." },
    ],
    rewards: { exp: 30, gold: 100, items: [{ id: 'red_potion', qty: 10 }] },
    scenes: { accept: 'ch1_open', done: 'ch1_hello' },
  }),
  story_1_2: s('story_1_2', 1, {
    name: 'The Wind Has Stopped', giver: 'mira', minLevel: 3, prereq: 'story_1_1',
    text: "The Moss Tortoises in Petal Meadow used to be the sleepiest things on the island. Now they snap at everyone. Could you calm 10 of them and see for yourself?",
    objectives: [{ type: 'kill', mob: 'snailbun', count: 10 }],
    rewards: { exp: 200, gold: 300, items: [{ id: 'orange_potion', qty: 10 }] },
    scenes: { done: 'ch1_wind' },
  }),
  story_1_3: s('story_1_3', 1, {
    name: 'Grumbling Hills', giver: 'mira', minLevel: 6, prereq: 'story_1_2',
    text: "Clover Hills is worse. The Toadstool Goblins have been stealing laundry right off the lines! Calm 12 of them and bring me 5 of their caps. I want to see if they're... sour.",
    objectives: [{ type: 'kill', mob: 'mushkin', count: 12 }, { type: 'collect', item: 'mushcap', count: 5 }],
    rewards: { exp: 900, gold: 600, items: [{ id: 'scroll_def_60', qty: 1 }] },
    scenes: { done: 'ch1_sour' },
  }),
  story_1_4: s('story_1_4', 1, {
    name: 'A Path of Your Own', giver: 'mira', minLevel: 10, prereq: 'story_1_3',
    text: "You're ready for a path of your own. Visit an instructor: Kestrel here, Brann in Ember Crag, Vex in Pastel Harbor, or Elowen in Moonleaf Grove (M opens the world map). Then come home and tell me everything!",
    objectives: [{ type: 'job', tier: 1 }],
    rewards: { exp: 2000, gold: 1500, items: [{ id: 'ear_10', qty: 1, variant: 'roll' }] },
    scenes: { done: 'ch1_end' },
  }),

  // ---------- Chapter 2: Roots Run Deep ----------
  story_2_1: s('story_2_1', 2, {
    name: 'Rumbles Underfoot', giver: 'rook', minLevel: 10, prereq: 'story_1_4',
    text: "Mira sent you? Good. The whole harbor shakes at night, and it's coming from under Windy Canyon. Go up there and find Bramble at the Hollow Gate. He knows the old roots.",
    objectives: [{ type: 'visit', map: 'canyon' }, { type: 'talk', npc: 'bramble', say: "Rook's right. Gnarlroot, the old heart of the Hollow, is tossing in his sleep. Something's troubling him." }],
    rewards: { exp: 2500, gold: 1200, items: [{ id: 'orange_potion', qty: 20 }] },
    scenes: { accept: 'ch2_open' },
  }),
  story_2_2: s('story_2_2', 2, {
    name: 'Heart of the Hollow', giver: 'bramble', minLevel: 12, prereq: 'story_2_1',
    text: "Gather a group and go down into Rootwood Hollow. Gnarlroot isn't wicked, he's frightened. Calm him, and the canyon will rest again.",
    objectives: [{ type: 'kill', mob: 'gnarlroot', count: 1 }],
    rewards: { exp: 6000, gold: 3000, items: [{ id: 'warrior_gloves_10', qty: 1, forJob: true, variant: 'roll' }] },
    scenes: { done: 'ch2_end' },
  }),

  // ---------- Chapter 3: Whispers in the Glade ----------
  story_3_1: s('story_3_1', 3, {
    name: 'A Song Out of Tune', giver: 'elowen', minLevel: 16, prereq: 'story_2_2',
    text: "Listen... can you hear it? Someone is crying in the Whispering Glade, past Mossy Woods. The Sylphs have gone wild with it. Go gently: calm 15 of them, and find out who is weeping.",
    objectives: [{ type: 'visit', map: 'glade' }, { type: 'kill', mob: 'sylph', count: 15 }],
    rewards: { exp: 8000, gold: 3000, items: [{ id: 'mana_elixir', qty: 5 }] },
    scenes: { accept: 'ch3_open', done: 'ch3_crying' },
  }),
  story_3_2: s('story_3_2', 3, {
    name: 'The Dryad Queen', giver: 'elowen', minLevel: 20, prereq: 'story_3_1',
    text: "It's Sylvana, the Dryad Queen. Her bower is at the far end of the glade. She won't listen to words right now... show her your heart, and don't be afraid to stand your ground.",
    objectives: [{ type: 'kill', mob: 'sylvana', count: 1 }],
    trial: 'bower',
    rewards: { exp: 30000, gold: 8000, items: [{ id: 'warrior_hat_20', qty: 1, forJob: true, variant: 'roll' }, { id: 'elixir', qty: 3 }] },
    scenes: { accept: 'ch3_trial', win: 'ch3_win', done: 'ch3_end' },
  }),

  // ---------- Chapter 4: Foxfire at Dusk ----------
  story_4_1: s('story_4_1', 4, {
    name: 'Tricks on the Road', giver: 'vex', minLevel: 22, prereq: 'story_3_2',
    text: "Travelers on the Fox Shrine Path, past the Twilight Ruins, keep coming back with empty pockets and leaves in their purses. Fox tricks. Calm 20 Nekomata and look around.",
    objectives: [{ type: 'visit', map: 'shrine' }, { type: 'kill', mob: 'nekomata', count: 20 }],
    rewards: { exp: 14000, gold: 5000, items: [{ id: 'white_potion', qty: 15 }] },
    scenes: { accept: 'ch4_open' },
  }),
  story_4_2: s('story_4_2', 4, {
    name: 'A Forgotten Shrine', giver: 'vex', minLevel: 25, prereq: 'story_4_1',
    text: "There's a little shrine on the top terrace up there. Nobody's left an offering in years. Relight its lanterns with 10 Wisp Flames from the Kitsune Miko, and say a prayer while you're there.",
    objectives: [{ type: 'collect', item: 'wisp_flame', count: 10 }, { type: 'visit', map: 'shrine', above: 530, place: 'the shrine on the top terrace' }],
    rewards: { exp: 22000, gold: 6000, items: [{ id: 'scroll_luck_60', qty: 1 }] },
    scenes: { done: 'ch4_shrine' },
  }),
  story_4_3: s('story_4_3', 4, {
    name: 'The Nine-Tailed Empress', giver: 'vex', minLevel: 28, prereq: 'story_4_2',
    text: "The prayer woke her. Tamamo, the Nine-Tailed Empress, waits in her sanctum at the end of the path. She plays rough and she plays tricks. Don't trust what you see.",
    objectives: [{ type: 'kill', mob: 'tamamo', count: 1 }],
    trial: 'sanctum',
    rewards: { exp: 60000, gold: 12000, items: [{ id: 'warrior_cape_25', qty: 1, forJob: true, variant: 'roll' }, { id: 'elixir', qty: 5 }] },
    scenes: { accept: 'ch4_trial', win: 'ch4_win', done: 'ch4_end' },
  }),

  // ---------- Chapter 5: Steam and Roses ----------
  story_5_1: s('story_5_1', 5, {
    name: 'Cold Springs', giver: 'nim', minLevel: 31, prereq: 'story_4_3',
    text: "T-the hot springs past the Crystal Cave are going cold! Without them, my moonberries won't grow. Could you go and see? The Lamia there are in a terrible mood.",
    objectives: [{ type: 'visit', map: 'springs' }, { type: 'kill', mob: 'lamia', count: 20 }],
    rewards: { exp: 40000, gold: 9000, items: [{ id: 'mana_elixir', qty: 10 }] },
    scenes: { accept: 'ch5_open', done: 'ch5_cold' },
  }),
  story_5_2: s('story_5_2', 5, {
    name: 'Frost on the Mountain', giver: 'nim', minLevel: 34, prereq: 'story_5_1',
    text: "The cold is coming down from Frozen Peak... or going up to it? The Yuki-onna are carrying the warmth away in icy gems. Bring me 12 of them. I want to know where they're taking it.",
    objectives: [{ type: 'visit', map: 'peak' }, { type: 'collect', item: 'crystal_gel', count: 12 }],
    rewards: { exp: 60000, gold: 12000, items: [{ id: 'warrior_shoes_35', qty: 1, forJob: true, variant: 'roll' }] },
    scenes: { done: 'ch5_gems' },
  }),
  story_5_3: s('story_5_3', 5, {
    name: 'The Rose Grotto', giver: 'nim', minLevel: 37, prereq: 'story_5_2',
    text: "The gems glow with rose light... it's Lilith! She's taking the springs' warmth down to her grotto, behind the waterfall in Serpent Springs. Please, bring the warmth home.",
    objectives: [{ type: 'kill', mob: 'lilith', count: 1 }],
    trial: 'grotto',
    rewards: { exp: 110000, gold: 20000, items: [{ id: 'warrior_top_35', qty: 1, forJob: true, variant: 'roll' }, { id: 'elixir', qty: 8 }] },
    scenes: { accept: 'ch5_trial', win: 'ch5_win', done: 'ch5_end' },
  }),

  // ---------- Chapter 6: Moon over Starfall ----------
  story_6_1: s('story_6_1', 6, {
    name: 'The Sleeping Wind', giver: 'elowen', minLevel: 40, prereq: 'story_5_3',
    text: "Every queen has said the same thing: the wind stopped. The great Tengu, Hayate, sleeps somewhere above the clouds. Climb to the top of the Sky Garden and calm 20 Sky Harpies; they've been guarding the way up.",
    objectives: [{ type: 'visit', map: 'sky', above: 570, place: 'the top of the Sky Garden' }, { type: 'kill', mob: 'windbird', count: 20 }],
    rewards: { exp: 120000, gold: 25000, items: [{ id: 'elixir', qty: 10 }] },
    scenes: { accept: 'ch6_open' },
  }),
  story_6_2: s('story_6_2', 6, {
    name: 'Where Stars Fall', giver: 'elowen', minLevel: 44, prereq: 'story_6_1',
    text: "Above the garden lies Starfall Heights, where the moon comes close. Gather 10 Stardust there; Selene, the Moon Valkyrie, will only meet someone who carries the stars.",
    objectives: [{ type: 'visit', map: 'starfall' }, { type: 'collect', item: 'stardust', count: 10 }],
    rewards: { exp: 160000, gold: 30000, items: [{ id: 'warrior_gloves_45', qty: 1, forJob: true, variant: 'roll' }] },
  }),
  story_6_3: s('story_6_3', 6, {
    name: 'The Moon Valkyrie', giver: 'elowen', minLevel: 48, prereq: 'story_6_2',
    text: "Selene guards Hayate's sleep on the Moon Terrace at the far end of Starfall Heights. She will test you, and she won't hold back. Show her the island is worth waking for.",
    objectives: [{ type: 'kill', mob: 'selene', count: 1 }],
    trial: 'terrace',
    rewards: { exp: 300000, gold: 50000, items: [{ id: 'warrior_cape_45', qty: 1, forJob: true, variant: 'gilded' }, { id: 'elixir', qty: 10 }] },
    scenes: { accept: 'ch6_trial', win: 'ch6_win', done: 'ch6_end' },
  }),

  // ---------- Chapter 7: The Crystal King ----------
  story_7_1: s('story_7_1', 7, {
    name: 'Home Again', giver: 'mira', minLevel: 45, prereq: 'story_6_3',
    text: "You're back! Oh, look at you. Tell me everything... and then, I'm afraid, there's one more thing. Captain Rook says the Crystal Cave has gone completely dark.",
    objectives: [{ type: 'talk', npc: 'rook', say: "The throne room's dark as a pocket. Prismaris has been drinking every bit of light on the island. Go easy on him, kid... but go." }],
    rewards: { exp: 100000, gold: 20000, items: [{ id: 'elixir', qty: 10 }] },
    scenes: { accept: 'ch7_open' },
  }),
  story_7_2: s('story_7_2', 7, {
    name: 'Heart of Crystal', giver: 'mira', minLevel: 45, prereq: 'story_7_1',
    text: "Prismaris, the Crystal King, sits on his throne deep in the Crystal Cave. Bring the light home. I'll have a pot of tea waiting.",
    objectives: [{ type: 'kill', mob: 'crystalking', count: 1 }],
    rewards: { exp: 400000, gold: 80000, items: [{ id: 'warrior_hat_50', qty: 1, forJob: true, variant: 'gilded' }, { id: 'elixir', qty: 20 }] },
    scenes: { done: 'ch7_end' },
  }),
};

// The regions the story opens: a portal on the way stays shut until its chapter's quest has been
// accepted (or finished). `note` is what you're told at the door.
export const STORY_LOCKS = {
  'woods.glade': { quest: 'story_3_1', note: 'A wall of wild wind blows you back. Follow the story (★) to Chapter 3.' },
  'glade.bower': { quest: 'story_3_2', note: 'Thorny vines close the way to the bower.' },
  'ruins.shrine': { quest: 'story_4_1', note: 'Fox-fire illusions turn you round in circles. Follow the story (★) to Chapter 4.' },
  'shrine.sanctum': { quest: 'story_4_3', note: 'The sanctum gate is sealed with a fox charm.' },
  'cave.springs': { quest: 'story_5_1', note: 'A rockfall blocks the tunnel. Follow the story (★) to Chapter 5.' },
  'sky.peak': { quest: 'story_5_1', note: 'A blizzard blocks the way down the mountain.' },
  'springs.grotto': { quest: 'story_5_3', note: 'Roses grow thick behind the waterfall.' },
  'sky.starfall': { quest: 'story_6_2', note: 'The stairs to the stars fade in and out of sight. Follow the story (★) to Chapter 6.' },
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
  ch1_open: [
    { card: 'Chapter 1', sub: 'A New Breeze' },
    { who: null, text: 'Sprout Village. Warm bread, cherry petals, and a wind chime that has not rung in weeks.' },
    { who: 'mira', text: "You made it! Welcome, welcome. I'm Mira. I look after newcomers around here.", mood: 'happy' },
    { who: 'mira', text: "It's a little quiet lately. The wind used to sing through the village every morning..." },
    { who: 'mira', text: "Oh, but listen to me! First things first: everyone should meet their neighbors.", mood: 'happy' },
  ],
  ch1_hello: [
    { who: 'mira', text: 'Pip already likes you, I can tell. And Kestrel nodded? That means he likes you too.', mood: 'happy' },
    { who: 'player', text: 'Mira... why did the wind stop?' },
    { who: 'mira', text: "That's a story for tea. For now, let's see how you do out in the meadow." },
  ],
  ch1_wind: [
    { who: 'mira', text: "So you saw it. The sleepiest tortoises on the island, snapping like crabs.", mood: 'sad' },
    { who: 'mira', text: 'This island has a guardian: Hayate, the great Tengu. Her wind carries songs, seeds, and good moods.' },
    { who: 'mira', text: "A few weeks ago, her wind just... stopped. And the spirits have been getting lonely and sour ever since." },
  ],
  ch1_sour: [
    { who: 'mira', text: 'Sour all right. These caps are as grumpy as a rainy Monday.', mood: 'sad' },
    { who: 'mira', text: "I think Hayate is asleep. Deeply. And I can't climb mountains anymore, but you..." },
    { who: 'mira', text: "You could find her. But first, you'll need a path of your own.", mood: 'happy' },
  ],
  ch1_end: [
    { who: 'mira', text: "Look at you! A real adventurer. I'm so proud I could burst.", mood: 'happy' },
    { who: 'mira', text: "Here. This earring belonged to me when I was young. It always caught the wind." },
    { who: null, text: 'For a moment, the earring trembles, as if a breeze far away had remembered your name.' },
    { who: 'mira', text: "Captain Rook in Pastel Harbor has been asking for help. Go on, and write me!" },
  ],
  // ----- Chapter 2 -----
  ch2_open: [
    { card: 'Chapter 2', sub: 'Roots Run Deep' },
    { who: 'rook', text: "Every night, BOOM. Every night! My tea jumps right out of the cup.", mood: 'angry' },
    { who: 'rook', text: "It's coming from under Windy Canyon. Bramble at the Hollow Gate will know more." },
  ],
  ch2_end: [
    { who: 'bramble', text: 'The canyon is quiet. Listen... is that... snoring?', mood: 'surprised' },
    { who: 'gnarlroot', text: '...lullaby... the wind used to sing me a lullaby... so quiet now...' },
    { who: 'bramble', text: "Poor old root. He wasn't angry. He just couldn't sleep without her song.", mood: 'sad' },
    { who: 'bramble', text: "Elowen in Moonleaf Grove reads the spirits. She'll want to hear about this." },
  ],
  // ----- Chapter 3 -----
  ch3_open: [
    { card: 'Chapter 3', sub: 'Whispers in the Glade' },
    { who: 'elowen', text: 'Gnarlroot missed a lullaby... and now someone in the woods is crying. Can you hear it?' },
    { who: 'elowen', text: 'The wind wall around the Whispering Glade has thinned. Go, quickly, and go gently.' },
  ],
  ch3_crying: [
    { who: 'elowen', text: 'The Sylphs said a name: Sylvana. The Dryad Queen.', mood: 'sad' },
    { who: 'elowen', text: "Her trees can't talk to each other without the wind. She's been alone in her bower for weeks." },
  ],
  ch3_trial: [
    { who: null, text: 'The vines part, just a little. Beyond them, a bower of white flowers and green light.' },
    { who: 'sylvana', text: "Another one? Go away! The trees don't sing anymore, and neither will I!", mood: 'angry' },
  ],
  ch3_win: [
    { who: 'sylvana', text: '...you stayed. Even when I threw the whole forest at you, you stayed.', mood: 'sad' },
    { who: 'sylvana', text: "I was so lonely. Without Hayate's wind my trees can't whisper. I thought everyone had forgotten us." },
    { who: 'player', text: "We'll wake her. I promise." },
    { who: 'sylvana', text: "Then take my blessing. And... visit sometimes? I'll be waiting for a rematch!", mood: 'happy' },
  ],
  ch3_end: [
    { who: 'elowen', text: 'Sylvana is smiling again. The glade is singing on its own, softly.', mood: 'happy' },
    { who: 'elowen', text: "But she's the first, not the last. Vex has been asking for you in Pastel Harbor." },
  ],
  // ----- Chapter 4 -----
  ch4_open: [
    { card: 'Chapter 4', sub: 'Foxfire at Dusk' },
    { who: 'vex', text: "Somebody's picking pockets on my roads, and it isn't me. That's personal.", mood: 'angry' },
    { who: 'vex', text: 'Leaves in purses, footprints that go in circles. Foxes. Check the Fox Shrine Path.' },
  ],
  ch4_shrine: [
    { who: null, text: 'The little shrine glows. The lanterns flicker, then hold. Somewhere above, nine tails stir.' },
    { who: 'vex', text: "You lit it? Then she knows we're here. Whoever 'she' is.", mood: 'surprised' },
  ],
  ch4_trial: [
    { who: null, text: 'Foxfire lanterns light the sanctum one by one. Something laughs, everywhere and nowhere.' },
    { who: 'tamamo', text: "A visitor! How rare. How DELIGHTFUL. Let's play a game, little one.", mood: 'happy' },
    { who: 'tamamo', text: "If you can catch the real me, I'll tell you a secret. If not... you'll make a lovely statue." },
  ],
  ch4_win: [
    { who: 'tamamo', text: 'Oh, you caught me. How embarrassing. How... wonderful.', mood: 'happy' },
    { who: 'tamamo', text: "Do you know why I played tricks? No one has visited my shrine since the wind stopped carrying their prayers." },
    { who: 'tamamo', text: 'A tricked traveler at least remembers you.', mood: 'sad' },
    { who: 'player', text: "I'll remember you without the tricks." },
    { who: 'tamamo', text: "...Then here's my secret: something is pulling the island's warmth downhill. Toward the springs.", mood: 'surprised' },
  ],
  ch4_end: [
    { who: 'vex', text: "Pockets are full again, and the foxes leave little gifts instead. I could get used to that.", mood: 'happy' },
    { who: 'vex', text: 'Nim in Moonleaf Grove sent a panicked note. Something about cold water. Go.' },
  ],
  // ----- Chapter 5 -----
  ch5_open: [
    { card: 'Chapter 5', sub: 'Steam and Roses' },
    { who: 'nim', text: "The springs are going c-cold! My moonberries need the steam, and... and the Lamia are so grumpy...", mood: 'sad' },
  ],
  ch5_cold: [
    { who: 'nim', text: "The Lamia said the warmth is being 'taken.' Taken! Where would warmth go?", mood: 'surprised' },
    { who: 'nim', text: 'Snow has been falling on Frozen Peak in summer. Maybe that is a clue?' },
  ],
  ch5_gems: [
    { who: 'nim', text: 'These gems... they glow pink inside. Rose pink.', mood: 'surprised' },
    { who: 'nim', text: "Lilith, the Rose Queen. She keeps a night garden in a grotto behind the springs' waterfall." },
  ],
  ch5_trial: [
    { who: null, text: 'Behind the waterfall, roses bloom in the dark, every one of them warm as a hearth.' },
    { who: 'lilith', text: "Darling, you're dripping on my roses. Do you know how hard it is to keep a garden alive?", mood: 'angry' },
    { who: 'lilith', text: "Without the wind there's no spring, no summer. So I borrowed a little warmth. Is that so terrible?" },
  ],
  ch5_win: [
    { who: 'lilith', text: 'My roses... they were all I had left of the sunshine.', mood: 'sad' },
    { who: 'player', text: "When Hayate wakes, the summer will come back. For everyone. Your roses too." },
    { who: 'lilith', text: "...Fine. I'll give the warmth back. But you'll come smell them in the summer. That's an order.", mood: 'happy' },
    { who: 'lilith', text: "And darling? Ask Selene about Hayate. The Moon Valkyrie knows where she sleeps." },
  ],
  ch5_end: [
    { who: 'nim', text: 'The springs are steaming again! My moonberries are fat as plums!', mood: 'happy' },
    { who: 'nim', text: 'Elowen wants to see you. She said... she said the moon has been watching you.' },
  ],
  // ----- Chapter 6 -----
  ch6_open: [
    { card: 'Chapter 6', sub: 'Moon over Starfall' },
    { who: 'elowen', text: 'Three queens, three hearts calmed. And each one says the same thing: find Hayate.' },
    { who: 'elowen', text: 'She sleeps above the clouds, past the Sky Garden. Selene, the Moon Valkyrie, guards the way.' },
  ],
  ch6_trial: [
    { who: null, text: 'The Moon Terrace. Stars fall like slow snow. A knight in silver stands between you and the sky.' },
    { who: 'selene', text: 'Hayate sleeps. She is tired, traveler. Tired of a world that only takes.', mood: 'sad' },
    { who: 'selene', text: 'Show me this island is worth waking for. Hold nothing back. I will not.' },
  ],
  ch6_win: [
    { who: 'selene', text: 'You fight like someone with friends behind you. A glade, a shrine, a garden... I see them all.', mood: 'happy' },
    { who: 'selene', text: "Hayate did not choose to sleep. Her light was stolen. Prismaris, the Crystal King, has been drinking it." },
    { who: 'selene', text: 'Go home first. Then go down into the dark. I will watch over her until you return.' },
  ],
  ch6_end: [
    { who: 'elowen', text: 'Prismaris... the poor thing has always been afraid of the dark.', mood: 'sad' },
    { who: 'elowen', text: 'Go home to Mira. She has been waiting for you longer than she will admit.' },
  ],
  // ----- Chapter 7 -----
  ch7_open: [
    { card: 'Chapter 7', sub: 'The Crystal King' },
    { who: 'mira', text: "Look at you. Taller somehow. Or maybe I'm just proud again.", mood: 'happy' },
    { who: 'mira', text: "The cave has gone completely dark, dear. Talk to Rook. And then... bring the light home." },
  ],
  ch7_end: [
    { who: 'crystalking', text: "Don't... don't turn off the light. Please. It was so dark when she stopped singing.", mood: 'sad' },
    { who: 'player', text: "She stopped because she had no light left. Give it back, and she'll sing again. For you too." },
    { who: null, text: 'The crystals dim, one by one, and a warm glow rises up through the cave, up through the cloud, up to the moon.' },
    { who: 'hayate', text: '...little one... thank you. I hear the island again. I am... waking.' },
    { who: 'mira', text: 'The wind chime! Did you hear it? Oh, I made too much tea...', mood: 'happy' },
    { card: 'To be continued', sub: 'Hayate is waking' },
  ],
};

// The side quests' and job advancements' scenes (data/scenes.js) play the same way.
Object.assign(SCENES, SIDE_SCENES, HOLLOW_SCENES);
for (const [k, v] of Object.entries(JOB_SCENES)) SCENES[`job_${k}`] = v;

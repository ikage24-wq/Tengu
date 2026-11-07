// Sweethearts (docs/design/sweethearts.md): six new townsfolk you can befriend or date, each in a
// town of their own. Hearts (0-10, 100 points each: `char.hearts[id].pts`) grow by talking to them
// each day, a gift a day (what they love, like or dislike is their own), dates (world/dates.js)
// and their heart scenes. Friendship goes all the way to ten hearts; romance starts when you give
// a Promise Bouquet (from 6 hearts), and at ten hearts as sweethearts a Seashell Ring asks them to
// move in with you on your island (world/sweethearts.js). One sweetheart at a time; breaking up is
// gentle, and you can make up later.
//
//   map, x      where they stand in town (their idle bits: render/town.js)
//   late        what they say when you visit them at home at night
//   house       where their house stands on that map (render/sweethouses.js); its door leads to
//               their room inside (MAPS.swh_<id>)
//   loves       gifts that mean the most (+80); likes (+45); dislikes (-20); anything else +20
//   date        the kind of date they love most (world/dates.js: fish, ride, stars, cook, dance)
//   talk        what they say when you chat, by how close you are (0-2, 3-5, 6-8 hearts, 9+, and
//               as sweethearts and living together)
//   scenes      heart scenes at 2, 4 and 6 hearts, then 8 and 10 as friends or as sweethearts

export const HEART = 100;
export const MAX_HEARTS = 10;
export const BOUQUET_AT = 6;
export const GIFT_PTS = { love: 80, like: 45, neutral: 20, dislike: -20 };
export const TALK_PTS = 20;

export const SWEETHEARTS = {
  poppy: {
    dateLines: { great: "That was the best day I've had in ages. My cheeks hurt from smiling!", good: "That was so nice. Same time tomorrow? I'm joking. Unless?", okay: 'Hee, that was a little chaotic. I liked it anyway!' },
    id: 'poppy', name: 'Poppy', title: 'Sunny Baker', map: 'sprout', x: 945, color: '#ff8fae',
    house: 850,
    // At home late (world/goinghome.js): a friend, close, sweethearts.
    late: [
      "Oh! Hello! I'm setting the dough for the morning. Mind the flour, it gets everywhere.",
      "Came by this late? Sit, sit. There's a warm bun on the table with your name on it.",
      "I hoped you'd knock. I baked one heart-shaped tonight. Don't tell anyone. It's yours.",
    ],
    outfit: 'swbaker', date: 'cook',
    look: { hairStyle: 'ribbonbuns', hairColor: '#ffc07a', hairTip: '#ff9a6a', skinTone: '#ffe2cc', eyeColor: '#d07a2a', eyeStyle: 'sparkle', browStyle: 'stubby', face: 'grin' },
    about: "Sprout's baker, up before the sun. Hugs first, asks later. Secretly afraid her bakes aren't good enough.",
    loves: ['wild_strawberry', 'dish_shortcake', 'dish_cherrytart', 'honeycomb'],
    likes: ['cherry', 'dish_scones', 'dish_clovertea', 'cotton', 'dish_wishcake'],
    dislikes: ['duskcap', 'fish_puffer', 'copper_ore'],
    gift: {
      love: ["You remembered! I'm going to cry into the dough. Happy tears!", 'Oh my gosh, oh my gosh. This is going straight into something wonderful.'],
      like: ['Ooh, thank you! I can already smell what this will become.', 'For me? You sweet thing.'],
      neutral: ["Aw, thanks! I'll find a use for it. Probably.", 'A present! Every present is a good present.'],
      dislike: ["Oh! It's... very... I'll put it somewhere safe. Far from the oven.", "Thank you! ...Is it supposed to smell like that?"],
    },
    talk: [
      ['Morning! Want to smell something nice? Here. Cinnamon. You\'re welcome.', 'I burnt the first batch again. The birds are very happy about it.'],
      ['I saved you the crusty end of the loaf. Everyone says that\'s the worst bit. Everyone is wrong.', 'Do you think the windmill will turn again soon? Flour by hand is SO slow.'],
      ['When you come by, the dough rises better. That\'s science. Probably.', 'Can I tell you a secret? I practise my smile in the oven door before I open the shop.'],
      ['I made a tiny cake shaped like you. I ate it. Sorry. I\'ll make another!', 'You\'re my favourite customer. You never even buy anything!'],
      ['Every morning I put the first roll aside for you. Even when you don\'t come. Especially then.', 'You\'re the sugar in my... no, that\'s awful. You\'re the yeast! No. Hold on.'],
      ['Breakfast\'s on the table! I used the good butter.', 'Our hut smells like bread now. I think that means it\'s home.'],
    ],
    scenes: {
      2: [{ who: 'poppy', text: "Taste this. Honestly. Is it too sweet? Not sweet enough? Be brutal!", mood: 'happy' }, { who: 'player', text: "It's... really good, Poppy." }, { who: 'poppy', text: "You're just saying that! ...You're not just saying that? Hee!", mood: 'happy' }],
      4: [{ who: null, text: "Poppy sits on the bakery step, flour in her hair, staring at an empty tray." }, { who: 'poppy', text: "Grandma's recipe book got rained on. Half of it's just smudges now.", mood: 'sad' }, { who: 'poppy', text: "But you know what? Some of my best bakes are guesses. Maybe I'll guess the rest. With you tasting?" }],
      6: [{ who: 'poppy', text: "I entered the Sprout fair. First prize! Look, a ribbon! A REAL one!", mood: 'happy' }, { who: 'poppy', text: "I almost didn't go. Then I thought, {name} would tell me to. So I did." }],
      8: [{ who: 'poppy', text: "Best friends get a key to the bakery. That's the rule. I just made it up. Here!", mood: 'happy' }],
      '8r': [{ who: 'poppy', text: "I made a heart-shaped loaf and then got too shy to give it to you, so I ate half.", mood: 'happy' }, { who: 'poppy', text: "Here's the other half. It means the same thing. Probably more, actually." }],
      10: [{ who: 'poppy', text: "If I ever open a second bakery, it'll be called Poppy & {name}. You don't even have to bake. Just be there.", mood: 'happy' }],
      '10r': [{ who: null, text: 'At dawn the bakery is warm and gold. Poppy hands you the first roll of the day, still steaming.' }, { who: 'poppy', text: "Every day for the rest of forever, okay? The first one's yours.", mood: 'happy' }],
    },
  },
  lark: {
    dateLines: { great: "I'm going to write about today. All of it. Every second.", good: 'That was... really lovely. Thank you for asking me.', okay: 'It was nice just being out with you, even like that.' },
    id: 'lark', name: 'Lark', title: 'Lighthouse Poet', map: 'lagoon', x: 1954, color: '#8fc8c8',
    house: 2178,
    // At home late (world/goinghome.js): a friend, close, sweethearts.
    late: [
      "...You found my house. Um. Please don't read the papers on the desk.",
      "The beam goes past the window every few seconds. I count them when I can't sleep. Forty so far.",
      "I wrote something tonight. It's about you. You can't read it. ...Maybe later.",
    ],
    outfit: 'swpoet', date: 'stars',
    look: { hairStyle: 'swoop', hairColor: '#4a5a8a', hairTip: '#7f9ad0', skinTone: '#fff0e6', eyeColor: '#5a7ab8', eyeStyle: 'droopy', face: 'shy' },
    about: 'Helps Granny Kelp keep the lighthouse and writes poems nobody is allowed to read. Says more on paper than out loud.',
    loves: ['moonpetal', 'fish_lumen', 'starbloom', 'dish_moontea'],
    likes: ['sea_kelp', 'fish_seapony', 'shell', 'rose_quartz', 'dish_minttea'],
    dislikes: ['dish_hotpot', 'fish_tuna', 'steam_ginger'],
    gift: {
      love: ['...oh. I... I\'ll write about this. If that\'s all right.', 'You noticed. Nobody notices. Thank you.'],
      like: ['That\'s... thoughtful. Thank you.', 'I\'ll keep it by the window.'],
      neutral: ['Oh. Thank you.', '...Thanks. Really.'],
      dislike: ['Ah. It\'s... a lot. Thank you anyway.', 'I\'m sure someone would love this. Maybe the gulls.'],
    },
    talk: [
      ['...Hello.', 'The light needs polishing. The gulls don\'t help.'],
      ['I wrote a line about the tide today. Just one. It took all morning.', 'You can stand there. If you want. It\'s a good spot for the sunset.'],
      ['Granny Kelp says I talk to you more than to her. She\'s not wrong.', 'I left a poem under a shell on the cove. It\'s not about you. ...It\'s a little about you.'],
      ['When the beam goes round, I count to ten and think of something nice. Lately it\'s you every time.', 'You make the quiet feel less lonely.'],
      ['I keep starting poems with your name. Then I can\'t find a word that rhymes with how I feel.', 'Stay for the evening light? It\'s better with two.'],
      ['I pinned a poem by the bed. Read it when I\'m out. Not before.', 'Our island hums at night. Did you know? I didn\'t, till I lived here.'],
    ],
    scenes: {
      2: [{ who: 'lark', text: '...you can read this one. Only this one.', mood: 'sad' }, { who: null, text: '"The sea forgets my footprints. The light remembers every boat."' }, { who: 'lark', text: "It's about Granny. She remembers everyone." }],
      4: [{ who: null, text: 'Wind tears a page from Lark\'s notebook. You catch it on the cliff\'s edge.' }, { who: 'lark', text: "You caught it. I'd have let it go. I always let them go.", mood: 'surprised' }, { who: 'lark', text: 'Maybe I should keep some. ...Will you keep this one for me?' }],
      6: [{ who: 'lark', text: 'I read a poem out loud at the noodle stall. Out LOUD. People clapped.', mood: 'happy' }, { who: 'lark', text: 'I looked for your face the whole time. It was the only one I could read to.' }],
      8: [{ who: 'lark', text: "I wrote a whole book of poems. There's one about a friend who catches pages. Guess who.", mood: 'happy' }],
      '8r': [{ who: 'lark', text: 'I wrote you a poem. I\'m going to read it to you. Please don\'t look at me.', mood: 'sad' }, { who: null, text: '"You came like the light comes: slowly, then all at once, and everywhere."' }],
      10: [{ who: 'lark', text: "You're the friend I wrote about wanting, years before I met you.", mood: 'happy' }],
      '10r': [{ who: null, text: 'At the top of the lighthouse, the beam sweeps out over the sea and back to you.' }, { who: 'lark', text: "I don't need to write this one down. I'll remember it.", mood: 'happy' }],
    },
  },
  rowan: {
    dateLines: { great: "Best. Day. Ever. I'm going to tell Brann about it until he begs me to stop.", good: "That was grand! You're good company, you know that?", okay: "Ha, we'll get it right next time. I had fun anyway!" },
    id: 'rowan', name: 'Rowan', title: 'Gentle Giant Knight', map: 'crag', x: 2310, color: '#8fb8e8',
    house: 2410,
    // At home late (world/goinghome.js): a friend, close, sweethearts.
    late: [
      "Ah! A visitor! Mind your head. Well, you don't have to. I do.",
      "Sit by the fire. I'm polishing. The sword likes the company. So do I.",
      "The fire's warmer when you're here. That's not how fires work. I checked.",
    ],
    outfit: 'swknight', date: 'ride',
    look: { hairStyle: 'messycrop', hairColor: '#a8603a', skinTone: '#e7b48f', eyeColor: '#3f9a5a', eyeStyle: 'round', browStyle: 'thick', face: 'smile' },
    about: "Ember Crag's biggest knight and its softest heart. Guards the arena, grows daisies in his helmet, burns water.",
    loves: ['dish_feast', 'chanterelle', 'dish_stew', 'temple_mint'],
    likes: ['dish_grilled', 'dish_onigiri', 'oak_log', 'iron_ore', 'clover'],
    dislikes: ['dish_sorbet', 'fish_minnow', 'cloud_cotton'],
    gift: {
      love: ['For ME? I... I don\'t know what to say. That\'s a lie, I\'m going to say thank you forty times.', 'You know me better than my own sword does.'],
      like: ['Ha! That\'s grand. Thank you, friend.', 'I\'ll treasure it. Carefully. I break things.'],
      neutral: ['Oh, how kind! Thank you!', 'A gift! I\'ll find the perfect shelf. I\'ll build the shelf.'],
      dislike: ['Ah... it\'s, um... very small. Thank you though!', 'I\'ll... keep it safe. From me.'],
    },
    talk: [
      ['Mind the arena floor, it\'s hot. Not me. The floor.', 'I tried to make tea. The kettle caught fire. Brann laughed for an hour.'],
      ['Would you like to see my daisies? I keep them in my old helmet. They like it in there.', 'People think big means brave. I just stand in front of things. It\'s easy when you\'re tall.'],
      ['I sparred with Brann and thought about our chat the whole time. Lost three rounds. Worth it.', 'If anything ever chases you, run my way. I\'m very good at being in the way.'],
      ['My mum used to say a knight\'s first duty is kindness. You make that duty easy.', 'You\'re the only one who never asks me to carry things. I\'d carry anything for you.'],
      ['I polished my armour until I could see my face in it. Then I practised saying nice things to you.', 'You make me feel small. In a good way. Like I can rest.'],
      ['I fixed the hut\'s door! Mostly. It opens both ways now. That\'s a feature.', 'Let me get the high shelf. That\'s what I\'m for. Well. Also hugging.'],
    ],
    scenes: {
      2: [{ who: 'rowan', text: 'Would you... taste my soup? I followed the recipe. I think the recipe was wrong.', mood: 'sad' }, { who: null, text: 'It tastes like charcoal and good intentions.' }, { who: 'rowan', text: "Your face says everything. Let's go get noodles. My treat.", mood: 'happy' }],
      4: [{ who: null, text: 'A kitten is stuck on the arena gate. Rowan lifts you up on his shoulders to reach it.' }, { who: 'rowan', text: "We make a good team! You reach, I lift. That's knighthood, really.", mood: 'happy' }],
      6: [{ who: 'rowan', text: 'They asked me to lead the crag guard. Me! I nearly said no.', mood: 'surprised' }, { who: 'rowan', text: "Then I thought, {name} would say I'm ready. So I said yes. ...Am I ready?" }],
      8: [{ who: 'rowan', text: "This is my old shield. It's too small for me now. It's the right size for my best friend.", mood: 'happy' }],
      '8r': [{ who: 'rowan', text: 'I picked you the biggest daisy in the crag. I carried it all day so it wouldn\'t get squashed.', mood: 'happy' }, { who: 'rowan', text: 'It got a little squashed. My hands are big. But my heart\'s bigger, I promise.' }],
      10: [{ who: 'rowan', text: 'Knights swear oaths, you know. I swear to always be your friend. There. Sworn. No take-backs.', mood: 'happy' }],
      '10r': [{ who: null, text: 'Rowan kneels, which makes him only a little taller than you.' }, { who: 'rowan', text: "I'll stand in front of everything for you. And sometimes, I'll stand beside you. That's the best place.", mood: 'happy' }],
    },
  },
  yuzu: {
    dateLines: { great: "Okay that was SO fun. You're not allowed to be this fun. It's my job!", good: 'Hee, not bad, human. Not bad at all. Again soon?', okay: "Pfft, you were hopeless. ...I had fun though. Don't tell anyone." },
    id: 'yuzu', name: 'Yuzu', title: 'Playful Fox Spirit', map: 'grove', x: 440, color: '#ff7a4a',
    house: 335,
    // At home late (world/goinghome.js): a friend, close, sweethearts.
    late: [
      "You came to MY house? At night? Bold. I like it. Sit on a cushion. Not that one, that's a trap.",
      "Want tea? It's in a teacup I definitely bought. From somewhere.",
      "I left the lanterns on for you. Spirits do that. ...Fine, I do that.",
    ],
    outfit: 'swfox', date: 'dance',
    look: { hairStyle: 'feathertips', hairColor: '#ff9a4f', hairTip: '#fff4e0', skinTone: '#fff0e6', eyeColor: '#e0602a', eyeStyle: 'cat', earStyle: 'fox', earTip: '#fff4e0', tail: 'fox', tailTip: '#fff4e0', face: 'playful' },
    about: 'A young fox spirit who lives in the Moon Tree and borrows things. Teases everyone; goes pink when teased back.',
    loves: ['foxfire_lily', 'dish_foxfiretea', 'shrine_plum', 'dish_koimochi'],
    likes: ['whisperberry', 'fish_koi', 'dish_onigiri', 'amethyst', 'moon_thyme'],
    dislikes: ['fish_catfish', 'iron_ore', 'dish_gratin'],
    gift: {
      love: ['Eeeeh?! For me?! You\'re going to make my tail fluff up! ...It already did. Don\'t look!', 'Okay, okay, you win this round. This is perfect. Hmph.'],
      like: ['Ooh, shiny! Mine now. No take-backs!', 'Not bad, human. Not bad at all.'],
      neutral: ['A present! I\'ll trade it to a tanuki for something better. Kidding! Mostly.', 'Hm? Well, I\'ll hide it in my secret stash.'],
      dislike: ['Bleh! Is this a prank? It\'s a prank. You\'re pranking ME?', '...I\'m giving this to the crows.'],
    },
    talk: [
      ['Boo! Ha, gotcha. Again.', "You're new. You smell like the meadow. And snacks."],
      ['Want to see a trick? Close your eyes. ...Now your bag is lighter. Kidding! Here.', 'The Moon Tree hums at midnight. Only spirits can hear it. And you, if you\'re lucky.'],
      ["I left a leaf on your head this morning and you didn't notice ALL DAY. Hee!", "Don't tell Elowen I've been borrowing her teacups. She knows. She pretends not to."],
      ["You're fun to tease. Even more fun when you tease back. Do it again!", 'Foxes pick one person to never prank. ...I haven\'t decided. Maybe.'],
      ["I let you win at tag on purpose. ...Okay, I didn't. You're fast. Rude.", "When you're around my tail won't stay still. It's very embarrassing!"],
      ['I hid a surprise somewhere in the hut. It\'s me. I\'m the surprise. Under the bed!', 'Our island has the BEST hiding spots. The hammock is mine now, by the way.'],
    ],
    scenes: {
      2: [{ who: 'yuzu', text: "Bet you can't catch me! Loser buys the dumplings!", mood: 'happy' }, { who: null, text: 'She darts round the Moon Tree three times, then trips over her own tail.' }, { who: 'yuzu', text: "That didn't happen. You saw nothing. ...I'll buy the dumplings.", mood: 'sad' }],
      4: [{ who: null, text: 'Yuzu sits alone in the Moon Tree, her ears down.' }, { who: 'yuzu', text: "The other spirits say I'm too young to be taken seriously. So I play. Playing's easier.", mood: 'sad' }, { who: 'yuzu', text: '...You take me seriously, though. Weird human. I like it.' }],
      6: [{ who: 'yuzu', text: 'Look! A second tail! Okay, it\'s a fluffy scarf. But one day! One day it\'ll be real.', mood: 'happy' }, { who: 'yuzu', text: "Foxes grow tails when they're loved, you know. I think I'm getting close." }],
      8: [{ who: 'yuzu', text: "I've decided. You're the one person I'll never prank. Ever. ...Starting tomorrow.", mood: 'happy' }],
      '8r': [{ who: 'yuzu', text: "Close your eyes! It's not a trick this time. Promise. ...Fox promise.", mood: 'happy' }, { who: null, text: 'A warm foxfire lantern lands in your hands, glowing pink.' }, { who: 'yuzu', text: "It only glows near someone I really like. So it's going to glow all the time now. Ugh." }],
      10: [{ who: 'yuzu', text: "Best friends forever. Fox forever is longer than human forever, so you're stuck with me.", mood: 'happy' }],
      '10r': [{ who: null, text: 'Under the Moon Tree, a soft glow: a second tail, wispy and new, curling round you both.' }, { who: 'yuzu', text: "Told you. Foxes grow tails when they're loved. Don't you dare cry, I'll cry too!", mood: 'happy' }],
    },
  },
  celeste: {
    dateLines: { great: "I didn't fall asleep once. That's how much I liked it.", good: 'Mm... that was nice. The stars seemed closer.', okay: 'That was sweet. Even the sleepy parts. Especially those.' },
    id: 'celeste', name: 'Celeste', title: 'Sleepy Stargazer', map: 'grove', x: 1800, color: '#4a4aa8',
    house: 1690,
    // At home late (world/goinghome.js): a friend, close, sweethearts.
    late: [
      "Mm... oh, it's you. Come look, Saturn's up... I think. Or I dreamed it.",
      "Stay a while. The stars come out properly after midnight. So do I.",
      "I named a star after you tonight. The bright one. Don't check the charts.",
    ],
    outfit: 'swstar', date: 'stars',
    look: { hairStyle: 'cascade', hairColor: '#c9b6ff', hairTip: '#fff3c4', skinTone: '#fff0e6', eyeColor: '#7a52cc', eyeStyle: 'star', face: 'sleepy' },
    about: 'Charts the stars all night and naps all day, usually somewhere odd. Knows every constellation; forgets lunch.',
    loves: ['starbloom', 'fish_comet', 'starstone', 'dish_nebula'],
    likes: ['moonpetal', 'star_anise', 'dish_moontea', 'cloud_cotton', 'sapphire'],
    dislikes: ['dish_eel', 'fish_hotfish', 'copper_ore'],
    gift: {
      love: ['...is this a dream? It\'s the nicest dream. Thank you.', 'Oh! It shines like the Lantern Star. I\'ll name a star after you. I\'m allowed.'],
      like: ['Mm... lovely. Thank you.', "That's sweet. I'll put it under my pillow."],
      neutral: ['Oh... thank you. Zzz... no I\'m awake.', 'For me? How kind.'],
      dislike: ["Mm... it's very... earthy. I'm more of a sky person.", 'Thank you... I think? I\'ll look at it later. Much later.'],
    },
    talk: [
      ['...hm? Oh. Hello. Is it day? It\'s day.', 'Shh. I\'m resting my eyes. They\'ve been looking at stars all night.'],
      ['The Pebble Bear rises at midnight this week. It looks like a bear holding a pebble. That\'s it. That\'s the whole thing.', 'Did I eat today? You look like someone who\'d know.'],
      ['I saw a shooting star and wished for... I can\'t tell you. But it worked a little.', 'You can borrow my blanket if we stargaze. I have three. One for each of us and one for spare.'],
      ['When I find a new star, my first thought is "I should show {name}". That\'s new for me.', 'You keep me awake in the daytime. Not many people manage that.'],
      ['I charted a constellation shaped like your smile. It\'s small. It\'s my favourite.', 'Stay up with me tonight? The sky\'s better when I\'m not the only one awake.'],
      ['I put glow stars on our ceiling. I mapped them right. Of course I did.', "You fell asleep first last night. I watched the stars and you. Mostly you."],
    ],
    scenes: {
      2: [{ who: null, text: 'Celeste is asleep standing up, leaning on a lamp post.' }, { who: 'celeste', text: "...I'm awake. I was counting. The insides of my eyelids have stars too, you know.", mood: 'happy' }],
      4: [{ who: 'celeste', text: "Look, there. That faint one. Nobody's named it yet.", mood: 'surprised' }, { who: 'celeste', text: "I'll call it the Little Lantern. Because you came out at night just to look with me." }],
      6: [{ who: 'celeste', text: "I made you a star chart. It's of the sky the night we met. I remembered every star.", mood: 'happy' }, { who: 'celeste', text: 'I usually forget my own birthday. Funny what sticks.' }],
      8: [{ who: 'celeste', text: "Best friends share telescopes. That's an astronomer's rule. Here. Half the sky is yours.", mood: 'happy' }],
      '8r': [{ who: null, text: 'A meteor shower lights the grove. Celeste takes your hand without looking at you.' }, { who: 'celeste', text: "I didn't make a wish. I didn't need to.", mood: 'happy' }],
      10: [{ who: 'celeste', text: "The stars are a long way off. You're right here. I like that better, I think.", mood: 'happy' }],
      '10r': [{ who: 'celeste', text: 'I named the brightest star in the east after you. Officially. I filled in a form.', mood: 'happy' }, { who: 'celeste', text: "Every night for the rest of my life, I'll look up and see you. And then look over and see you." }],
    },
  },
  marlowe: {
    dateLines: { great: "Now THAT'S what I call an adventure! Best crew ever!", good: 'Not bad, first mate. Not bad at all.', okay: 'Heh, rough waters today. Still the best company on the island.' },
    id: 'marlowe', name: 'Marlowe', title: 'Cheeky Young Sailor', map: 'harbor', x: 520, color: '#2f5fb8',
    house: 610,
    // At home late (world/goinghome.js): a friend, close, sweethearts.
    late: [
      "Ahoy! Welcome aboard. Well, below decks. Well, my house. Wipe your boots.",
      "Doing knots. Night watch, see? A sailor never sleeps. Much.",
      "Stay till the lamp goes out? I'll show you the map of where we're sailing someday.",
    ],
    outfit: 'swsailor', date: 'fish',
    look: { hairStyle: 'surfer', hairColor: '#3fb8b0', hairTip: '#bff0e8', skinTone: '#d9a07a', eyeColor: '#2f6ab8', eyeStyle: 'round', face: 'smug' },
    about: "Captain Rook's ward, fixing up an old boat on the docks. Boasts about the sea; has never sailed past the lighthouse.",
    loves: ['fish_marlin', 'fish_tuna', 'dish_tunasteak', 'dish_lanternskewer'],
    likes: ['fish_mackerel', 'fish_dorado', 'sea_kelp', 'maple_log', 'dish_twinnoodles'],
    dislikes: ['dish_clovertea', 'cotton', 'fish_minnow'],
    gift: {
      love: ['WHOA. Okay. Okay okay okay. You\'re officially my first mate. No arguments.', 'This is the best thing anyone\'s ever given me. Don\'t tell Rook I said that.'],
      like: ['Nice catch, matey!', 'Heh. You\'ve got good taste. Like me.'],
      neutral: ['Huh. Thanks! It\'s going in the treasure chest.', 'Cheers! Every sailor needs supplies.'],
      dislike: ['Ugh, landlubber stuff. ...Thanks though.', "What am I supposed to do with this? Use it as an anchor?"],
    },
    talk: [
      ['Ahoy! You look lost. I\'m never lost. I have a compass. Somewhere.', 'Mind the deck, it\'s wet. Everything\'s wet. That\'s boats.'],
      ['One day I\'ll sail round the whole island. Twice. Backwards.', 'I fixed the boat\'s sail today! It only has three holes now.'],
      ['Okay so maybe I\'ve never sailed past the lighthouse. Maybe I\'m saving it for a special trip.', "You're alright, for a landlubber. Better than alright."],
      ["Rook says I talk about you too much. I told him he talks about his compass too much. We're even.", 'When the boat\'s done, the first seat\'s yours. Captain\'s orders.'],
      ['I named a knot after you. It\'s the one that holds best.', "I'm not blushing, it's windburn. It's very windy. Shut up."],
      ['I moored the boat right by our dock! Morning sails, every day!', 'Island life suits me. Every direction\'s the sea.'],
    ],
    scenes: {
      2: [{ who: 'marlowe', text: 'Watch this! I can tie a bowline with my eyes closed!', mood: 'happy' }, { who: null, text: 'He ties his own sleeve to the railing.' }, { who: 'marlowe', text: "...That was a different knot. On purpose. Help me?", mood: 'sad' }],
      4: [{ who: null, text: 'Marlowe stands at the end of the pier, looking out past the lighthouse.' }, { who: 'marlowe', text: "My folks sailed out there and never came back. Rook took me in. That's why I haven't gone. Yet.", mood: 'sad' }, { who: 'marlowe', text: "...Don't make that face. I'm fine. I'm better with you around, anyway." }],
      6: [{ who: 'marlowe', text: 'She floats! The boat floats! I sailed her all the way to the lighthouse and back!', mood: 'happy' }, { who: 'marlowe', text: 'I waved at the lighthouse. Then I waved at you. You were the one waving back.' }],
      8: [{ who: 'marlowe', text: "Every captain needs a first mate. I'm putting your name on the boat. Right under mine. Okay, bigger than mine.", mood: 'happy' }],
      '8r': [{ who: 'marlowe', text: 'I painted the boat\'s name. Took me ages to decide. It\'s... it\'s your name. Don\'t laugh!', mood: 'surprised' }],
      10: [{ who: 'marlowe', text: "When I sail past the horizon, I'll come back. Because my best mate's here. That's how it works.", mood: 'happy' }],
      '10r': [{ who: null, text: 'At sunset, Marlowe sails you past the lighthouse for the very first time.' }, { who: 'marlowe', text: "I always thought I'd be scared out here. Turns out I just needed the right crew.", mood: 'happy' }],
    },
  },
};
export const SWEETHEART_IDS = Object.keys(SWEETHEARTS);

// Living together (world/sweethearts.js): where they spend the day on your island, the piece of
// their own they bring into the hut, the job they fight as when they come adventuring, and what
// they cook you some mornings.
export const AT_HOME = {
  poppy: { x: 910, piece: 'bake_cake', job: 'thief', dish: ['dish_shortcake', 'dish_scones', 'dish_cherrytart'] },
  lark: { x: 300, piece: 'sea_net', job: 'archer', dish: ['dish_moontea', 'dish_minttea', 'dish_kelpsoup'] },
  rowan: { x: 640, piece: 'star_lamp', job: 'warrior', dish: ['dish_onigiri', 'dish_stew', 'dish_grilled'] },
  yuzu: { x: 860, piece: 'bake_stool', job: 'thief', dish: ['dish_koimochi', 'dish_foxfiretea', 'dish_onigiri'] },
  celeste: { x: 1010, piece: 'star_globe', job: 'mage', dish: ['dish_moontea', 'dish_nebula', 'dish_clovertea'] },
  marlowe: { x: 250, piece: 'trophy_plaque', job: 'archer', dish: ['dish_lanternskewer', 'dish_tunasteak', 'dish_twinnoodles'] },
};

// The two special gifts (crafted at a bench, data/crafting.js): a bouquet to start romance, a
// ring to ask them to move in with you.
export const BOUQUET = 'promise_bouquet';
export const RING = 'seashell_ring';

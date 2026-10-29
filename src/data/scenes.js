// Cutscenes for the big moments outside the main story (the main story's are in story.js): the
// side quests that matter most (the end of the tutorial, the quest chains, the instructors'
// trials, the big hand-ins), and every job advancement. Same steps as the story's scenes; a line's
// text can say {name} (the hero) or {job} (the job just taken).

// Which quests play which scene, on accepting and on handing in.
export const QUEST_SCENES = {
  tut_farewell: { done: 'tut_bye' },
  pip_parcel: { done: 'pip_parcel_done' },
  mira_letter: { accept: 'letter_open', done: 'letter_done' },
  lulu_runway: { done: 'runway_done' },
  lulu_winter: { done: 'winter_done' },
  canyon_lookout: { done: 'lookout_done' },
  vex_rumor: { done: 'rumor_done' },
  nim_candles: { accept: 'candles_open', done: 'candles_done' },
  nim_stardust: { done: 'stardust_done' },
  tora_cores: { done: 'cores_done' },
  marlo_spa: { done: 'spa_done' },
  hollow_heart: { accept: 'hollow_open' },
  crystal_heart: { accept: 'king_open', done: 'king_done' },
  rook_stars: { done: 'stars_done' },
  warrior_trial: { accept: 'trial_brann', done: 'trial_brann_done' },
  archer_trial: { accept: 'trial_kestrel', done: 'trial_kestrel_done' },
  spiritmage_trial: { accept: 'trial_elowen', done: 'trial_elowen_done' },
  thief_trial: { accept: 'trial_vex', done: 'trial_vex_done' },
};

export const SIDE_SCENES = {
  // ----- The tutorial's goodbye -----
  tut_bye: [
    { who: 'kuro', text: "You've got the hang of it! Grandma Hayate would be proud. If she were awake, anyway.", mood: 'happy' },
    { who: 'kuro', text: "The boat goes to Sprout Village. Find Mira there. She makes the best tea on the island." },
    { who: 'player', text: 'Will I see you again?' },
    { who: 'kuro', text: "Of course! Tengu always find their friends. On the wind, you know.", mood: 'happy' },
  ],
  // ----- Sprout Village and the harbor -----
  pip_parcel_done: [
    { who: 'rook', text: 'Ohh, my new compass! Look at her shine.', mood: 'happy' },
    { who: 'rook', text: "Funny thing, though. She keeps pointing up. Not north. Up. Toward the clouds.", mood: 'surprised' },
    { who: 'rook', text: "Ah, never mind an old sailor. Tell Pip she's an angel." },
  ],
  letter_open: [
    { who: 'mira', text: 'Elowen and I were apprentices together, long ago. We had a silly falling out over a teapot.', mood: 'sad' },
    { who: 'mira', text: "I've written this letter a dozen times. Please... just make sure she reads it." },
  ],
  letter_done: [
    { who: null, text: 'Elowen reads the letter twice. Then a third time, more slowly.' },
    { who: 'elowen', text: '"I still have the lid. Do you still have the pot?" Oh, Mira.', mood: 'happy' },
    { who: 'elowen', text: "Tell her yes. Tell her I'll bring the lid at the spring festival. Thank you, {name}." },
  ],
  runway_done: [
    { who: 'lulu', text: 'Ta-daa! Fluffy trim, antler buttons, and a twirl that could stop traffic!', mood: 'happy' },
    { who: null, text: 'Lulu spins across the salon. Pip claps from the doorway. Kestrel pretends not to look.' },
    { who: 'lulu', text: "The very first piece is yours, darling. Wear it everywhere. That's free advertising!" },
  ],
  winter_done: [
    { who: 'lulu', text: 'A parka made of Pegasus mane and snow gems! It sparkles when you shiver!', mood: 'happy' },
    { who: 'lulu', text: "The winter line is going to be the talk of the island. Thank you for braving the cold for fashion." },
  ],
  lookout_done: [
    { who: 'bramble', text: 'Roots moving under the rock... rocks humming at night... Gnarlroot is restless.', mood: 'sad' },
    { who: 'bramble', text: "When you're ready, bring friends. The Hollow is no place to go alone." },
  ],
  rumor_done: [
    { who: 'vex', text: "A kid from the Grove selling 'escaped' Wisp Flames, and Nim losing her candles. That's not crime, that's comedy.", mood: 'happy' },
    { who: 'vex', text: 'Go help the poor thing before she cries into her potions. Moonleaf Grove, past the woods.' },
  ],
  candles_open: [
    { who: 'nim', text: "Y-you came! Vex sent you? Oh no, does everyone know?", mood: 'surprised' },
    { who: 'nim', text: "My floating candles got bored and floated away. Now they're Will-o'-Wisps in the Ruins and they won't come home!", mood: 'sad' },
  ],
  candles_done: [
    { who: null, text: 'Nim lines the flames up on her shelf. One by one they settle back into little candles, sulking.' },
    { who: 'nim', text: "There! All home. I'll read them a story tonight so they don't get bored again.", mood: 'happy' },
  ],
  stardust_done: [
    { who: 'nim', text: 'A wish candle! You light it, you make a wish, and the stars hear it.', mood: 'happy' },
    { who: null, text: 'The candle flickers silver. Nim closes her eyes and whispers something you don\'t quite catch.' },
    { who: 'nim', text: "I wished for the wind to come back. Don't tell anyone, or it won't come true!" },
  ],
  cores_done: [
    { who: 'tora', text: 'Geode Cores, in the forge! Stand back!', mood: 'happy' },
    { who: null, text: 'The anvil rings like a bell. Sparks fly in every color of the cave.' },
    { who: 'tora', text: 'Made for your hands and nobody else\'s. Take good care of them, {name}.' },
  ],
  spa_done: [
    { who: 'marlo', text: "Grand opening! Steam, towels, cucumber slices... I'm charging double for the view.", mood: 'happy' },
    { who: 'marlo', text: 'And for you? A towel, on the house. A tycoon never forgets a business partner.' },
  ],
  hollow_open: [
    { who: 'bramble', text: 'Down there, Gnarlroot tosses in his sleep, and every root in the Hollow tosses with him.' },
    { who: 'bramble', text: 'Bring a group of four. A tank to stand in front, a healer, and two to bring him down. Gently.' },
  ],
  king_open: [
    { who: 'rook', text: "Prismaris, the Crystal King. He's been sitting on that throne since before my grandfather sailed.", mood: 'sad' },
    { who: 'rook', text: "The cave's getting darker every week. Somebody has to go and ask him why." },
  ],
  king_done: [
    { who: 'rook', text: 'You did it! The cave is glittering again. I could see it from the harbor!', mood: 'happy' },
    { who: 'rook', text: "This calls for a song. I won't sing it. But it calls for one." },
  ],
  stars_done: [
    { who: 'rook', text: "A falling star, caught and bottled. My old crew won't believe it!", mood: 'happy' },
    { who: 'rook', text: "Here, kid. Make a wish on it first. It's only fair." },
  ],
  // ----- The instructors' trials -----
  trial_brann: [
    { who: 'brann', text: 'The Crystal Golems are slow, heavy, and they never back down. Neither should you.' },
    { who: 'brann', text: 'Twenty of them. Stand your ground the whole time. Then we talk about your future.' },
  ],
  trial_brann_done: [
    { who: 'brann', text: "Look at that. Not a step back. You've got a warrior's heart, {name}.", mood: 'happy' },
    { who: 'brann', text: 'Two paths now. The Paladin, who shields everyone. Or the Berserker, who ends fights fast. Choose with your heart.' },
  ],
  trial_kestrel: [
    { who: 'kestrel', text: 'Wraiths drift. They dodge. They vanish. A real archer hits them anyway.' },
    { who: 'kestrel', text: 'Fifteen. In the Crystal Cave. Breathe out before every shot.' },
  ],
  trial_kestrel_done: [
    { who: 'kestrel', text: '...Hm. Clean shots. Not bad at all.', mood: 'happy' },
    { who: 'kestrel', text: 'The Beastmaster hunts with friends who have fur and wings. The Stormcaller brings the lightning. Which are you?' },
  ],
  trial_elowen: [
    { who: 'elowen', text: "The Wraiths are spirits who forgot the way home. We don't fight them. We dance them home." },
    { who: 'elowen', text: 'Twenty of them. Be kind, but be firm. They are lost, not wicked.' },
  ],
  trial_elowen_done: [
    { who: 'elowen', text: 'I felt every one of them go home. Peacefully. You have a gift, {name}.', mood: 'happy' },
    { who: 'elowen', text: 'The Shrine Maiden purifies and protects. The Onmyoji commands talismans and spirits. Both are yours to choose.' },
  ],
  trial_vex: [
    { who: 'vex', text: "The Dullahans ride the Ruins at night. Twenty of them. They can't see you if you're fast enough." },
    { who: 'vex', text: "Don't get caught. That's the only rule of this trade." },
  ],
  trial_vex_done: [
    { who: 'vex', text: "Twenty, and not a scratch on you. I'd almost think you were me.", mood: 'happy' },
    { who: 'vex', text: 'The Shinobi works in ink and shadow. The Kitsune plays with fox fire and illusions. Pick your poison.' },
  ],
};

// ---------- Rootwood Hollow ----------
export const HOLLOW_SCENES = {
  // Gnarlroot, calmed at last.
  hollow_sleep: [
    { who: 'gnarlroot', text: '...so... quiet now... the little ones... cheering...', mood: 'sad' },
    { who: null, text: 'The great roots sag and settle. Somewhere deep in the Hollow, a lullaby starts up: the Sprouts, humming.' },
    { who: 'gnarlroot', text: '...thank you... sleep... at last...', mood: 'happy' },
    { who: null, text: 'Gnarlroot snores. The whole Hollow snores with him. The chest by the exit glows warm.' },
  ],
  // The run's result card ({grade}, {time}, {notes}, {bonus} filled in at the chest).
  hollow_results: [
    { card: 'Rootwood Hollow', sub: 'Rank {grade}  ·  {time}' },
    { who: null, text: '{notes}. Rank bonus on the treasure: +{bonus}.' },
  ],
};

// The bosses meet the group (each once a run), before the fight.
export const HOLLOW_BOSS_SCENES = {
  hollow_capper: [
    { who: 'mothercapper', text: 'Who is TRAMPLING my garden? My darlings were sleeping!', mood: 'angry' },
    { who: 'player', text: "We're sorry! We're here to help Gnarlroot sleep." },
    { who: 'mothercapper', text: "Help? Nobody HELPS anymore. Out, out, out! Spores, my sweets!", mood: 'angry' },
  ],
  hollow_boar: [
    { who: 'tuskar', text: "GRUNT. You smell like trouble. And acorns. Mostly trouble.", mood: 'angry' },
    { who: null, text: 'Tuskar paws the ground. The stone pillars of his den tremble.' },
    { who: 'tuskar', text: "Nobody gets past Tuskar! I'm the GATE. Well. The gate's guard. CHARGE!", mood: 'angry' },
  ],
  hollow_gnarl: [
    { who: null, text: 'The Heart of the Hollow. A great old root, tossing and turning, as tall as a house.' },
    { who: 'gnarlroot', text: 'Hrrmm... too noisy... too QUIET... the wind stopped singing... I cannot sleep...', mood: 'sad' },
    { who: 'player', text: "Then we'll help you rest. Hold still, old friend!" },
  ],
};

// Bramble on the root radio: short lines over the group's heads as they go (world/hollow.js).
// Each key has a few lines; one is picked.
export const HOLLOW_RADIO = {
  'enter:hollow1': ["It's dark in there. Light the glowcaps and stick together.", 'Hear me? Good. The roots carry my voice. Mind the dark.'],
  'enter:hollow2': ['The Myconid Queen keeps a garden there. She is... very protective of it.'],
  'enter:hollow3': ['Little Sprouts are trapped in those cages. Free them and they will cheer you on!', 'Low ceiling in the tunnels. Watch for falling roots.'],
  'enter:hollow4': ["Tuskar's den. Those stone pillars are older than me: let him crash into them, not you!"],
  'enter:hollow5': ['The sap rises from the floor in that chamber. When it bubbles, climb!', 'Bramble Bears hold the Root Keys. Take them, gently.'],
  'enter:hollow6': ['This is it. The Heart of the Hollow. Gnarlroot is just... tired. Be kind, be strong.'],
  'clear:hollow1': ['Lovely light! On you go.', 'The entrance glows again. Well done.'],
  'clear:hollow2': ["The garden's quiet. She'll forgive you. Probably."],
  'clear:hollow3': ['Listen to those Sprouts cheer! They will follow you all the way down.'],
  'clear:hollow4': ['Tuskar is snoring already. Ha! On to the Root Gate.'],
  'clear:hollow5': ['The Root Gate is open. The Heart is just ahead...'],
  wipe: ["Up you get! Everyone stumbles in the dark. Try again.", "That's alright. Catch your breath and go again."],
  flood: ['Sap rising! Get up high!', 'Here comes the sap! Ledges, now!'],
  lightsout: ["She's put the lights out! Stay close to each other's light!"],
  tide: ['Spores all over the floor! Use the bounce mushrooms!'],
  pillar: ['HA! Right into the pillar! Hit him while he sees stars!'],
  wargs: ['He called his Wargs! Tank, catch them!'],
  stampede: ["He's stampeding! Watch both ways!"],
  walls: ['The roots are closing in! Stay in the middle!'],
  heart: ['His heart is open! Get up high, strike it from above!'],
  cheer: ['Another Sprout! Hear them cheering?', 'Free! Look at it go!'],
};

// Taking a job: the instructor sends you off. `first` for a first job (by family), `path` for a
// second (by job).
export const JOB_SCENES = {
  warrior: [
    { card: 'A New Path', sub: 'Warrior' },
    { who: 'brann', text: 'Welcome to Ember Crag, {name}. From today, you stand in front so others can shine behind you.', mood: 'happy' },
    { who: 'brann', text: 'Heavy blows, steady feet, and a big heart. Now go hit something that deserves it!' },
  ],
  archer: [
    { card: 'A New Path', sub: 'Archer' },
    { who: 'kestrel', text: 'From today you are an Archer, {name}. Keep your distance and your aim true.' },
    { who: 'kestrel', text: '...And keep your bowstring dry. That part nobody tells you.', mood: 'happy' },
  ],
  thief: [
    { card: 'A New Path', sub: 'Thief' },
    { who: 'vex', text: "Welcome to the harbor's best-kept secret, {name}. Fast hands, light feet.", mood: 'happy' },
    { who: 'vex', text: 'Here, stars to throw. Lose them in a monster, not in a card game.' },
  ],
  spiritmage: [
    { card: 'A New Path', sub: 'Spirit Mage' },
    { who: 'elowen', text: 'The spirits have chosen you, {name}. Magic here is a dance: they strike for you, and you lead.', mood: 'happy' },
    { who: 'elowen', text: 'Listen to them, and they will always listen to you.' },
  ],
  path: [
    { card: 'A New Path', sub: '{job}' },
    { who: null, text: 'Something settles inside you, like a key turning in a lock you never knew you had.' },
    { who: 'player', text: 'I am a {job} now.', mood: 'happy' },
  ],
};

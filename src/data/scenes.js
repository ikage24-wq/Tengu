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
    { who: 'kestrel', text: 'The Phantom Trickster makes her arrows vanish and her own copies shoot beside her. The Arbalist Engineer builds her own crossbow and blows things up with it. Which are you?' },
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
    { who: 'vex', text: 'The Blade Dancer throws her rings and catches them on a turn. The Sky Dancer rides the wind and never touches the ground. Pick your stage.' },
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
  // The Myconid Queen, staged: you step up as the camera finds her fuming among her mushrooms,
  // she stamps so the garden shakes and puffs spores, you hop back, the two of you square up, and
  // she sets her spores on you.
  hollow_capper: [
    { together: [{ cam: 'mothercapper', dur: 1.1 }, { walk: 'player', to: 'mothercapper', gap: 96, speed: 110 }] },
    { together: [{ emote: 'mothercapper', kind: 'anger', dur: 2.4 }, { fx: 'spores', at: 'mothercapper', n: 10 }] },
    { who: 'mothercapper', text: 'Who is TRAMPLING my garden? My darlings were sleeping!', mood: 'angry' },
    { jump: 'mothercapper', height: 26 },
    { together: [{ shake: 4, dur: 0.5 }, { fx: 'spores', at: 'mothercapper' }, { emote: 'player', kind: '!' }] },
    { walk: 'player', away: 'mothercapper', by: 28, speed: 120 },
    { together: [{ cam: ['player', 'mothercapper'], dur: 0.8 }, { face: 'player', to: 'mothercapper' }] },
    { emote: 'player', kind: 'sweat', dur: 1.2, hold: true },
    { who: 'player', text: "We're sorry! We're here to help Gnarlroot sleep." },
    { face: 'mothercapper', to: 'player' },
    { emote: 'mothercapper', kind: '?', dur: 1, hold: true },
    { who: 'mothercapper', text: 'Help? Nobody HELPS anymore. Out, out, out! Spores, my sweets!', mood: 'angry' },
    { together: [{ jump: 'mothercapper', height: 18 }, { fx: 'spores', at: 'mothercapper', n: 30 }, { shake: 3, dur: 0.4 }] },
    { cam: 'player', dur: 0.7 },
  ],
  // Tuskar, staged: you come up on him bristling in his den; he paws the floor till the old
  // pillars shake loose rubble, winds up, and charges, skidding to a stop nose to nose with you.
  hollow_boar: [
    { together: [{ cam: 'tuskar', dur: 1.1 }, { walk: 'player', to: 'tuskar', gap: 150, speed: 110 }, { mood: 'tuskar', as: 'angry' }] },
    { together: [{ face: 'tuskar', to: 'player' }, { emote: 'tuskar', kind: 'anger', dur: 2.2 }, { fx: 'dust', at: 'tuskar', n: 6 }] },
    { who: 'tuskar', text: 'GRUNT. You smell like trouble. And acorns. Mostly trouble.', mood: 'angry' },
    { together: [{ act: 'tuskar', move: 'windup', dur: 1.6 }, { fx: 'dust', at: 'tuskar' }, { shake: 2, dur: 1.4 }, { fx: 'rubble', at: 'tuskar' }] },
    { who: null, text: 'Tuskar paws the ground. The stone pillars of his den tremble.' },
    { together: [{ emote: 'player', kind: 'sweat', dur: 1.2 }, { walk: 'player', away: 'tuskar', by: 20, speed: 60 }] },
    { who: 'tuskar', text: "Nobody gets past Tuskar! I'm the GATE. Well. The gate's guard. CHARGE!", mood: 'angry' },
    { act: 'tuskar', move: 'windup', dur: 0.5 },
    { together: [{ walk: 'tuskar', to: 'player', gap: 46, speed: 340 }, { act: 'tuskar', move: 'attack', dur: 0.45 }, { fx: 'dust', at: 'tuskar' }] },
    { together: [{ shake: 5, dur: 0.5 }, { fx: 'dust', at: 'tuskar', n: 16 }, { jump: 'player', height: 22 }, { emote: 'player', kind: '!' }] },
    { walk: 'player', away: 'tuskar', by: 40, speed: 160 },
    { cam: 'player', dur: 0.6 },
  ],
  // Gnarlroot, staged: the camera rises up the sleeping giant as he tosses and turns, shedding
  // leaves; he mumbles about the wind, you promise to help him rest, and he wakes cross and slams
  // his root arms down, shaking bark from the ceiling.
  hollow_gnarl: [
    { together: [{ mood: 'gnarlroot', as: 'blink' }, { emote: 'gnarlroot', kind: 'zzz', dur: 6 }, { cam: 'gnarlroot', up: 50, dur: 1.6 }] },
    { who: null, text: 'The Heart of the Hollow. A great old root, tossing and turning, as tall as a house.' },
    { together: [{ act: 'gnarlroot', move: 'sway', dur: 2.2, amp: 0.07, speed: 4 }, { fx: 'leaves', at: 'gnarlroot', top: true }] },
    { together: [{ mood: 'gnarlroot', as: 'sad' }, { walk: 'player', to: 'gnarlroot', gap: 130, speed: 90 }] },
    { who: 'gnarlroot', text: 'Hrrmm... too noisy... too QUIET... the wind stopped singing... I cannot sleep...', mood: 'sad' },
    { together: [{ cam: ['player', 'gnarlroot'], up: 20, dur: 0.9 }, { face: 'player', to: 'gnarlroot' }] },
    { emote: 'player', kind: 'heart', dur: 1.2, hold: true },
    { who: 'player', text: "Then we'll help you rest. Hold still, old friend!" },
    { together: [{ mood: 'gnarlroot', as: 'angry' }, { emote: 'gnarlroot', kind: 'anger', dur: 1.6 }] },
    { act: 'gnarlroot', move: 'attack', dur: 1, async: true },
    { wait: 0.3 },
    { together: [{ shake: 6, dur: 0.6 }, { fx: 'leaves', at: 'gnarlroot', top: true, n: 20 }, { fx: 'rubble', at: 'gnarlroot' }, { emote: 'player', kind: '!' }, { jump: 'player', height: 14 }] },
    { wait: 0.6 },
    { cam: 'player', dur: 0.7 },
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


// ---------- Moonlit Manor ----------
export const MANOR_SCENES = {
  manor_results: [
    { card: 'Moonlit Manor', sub: 'Rank {grade}  ·  {time}' },
    { who: null, text: '{notes}. Rank bonus on the treasure: +{bonus}.' },
  ],
  // The Armours, staged: a music box starts up, the two suits glide together, bow, and waltz
  // past each other and back in three-four time trailing music notes, then turn on you as one;
  // Rondo lunges with her rapier.
  manor_waltz: [
    { together: [{ cam: ['waltzrondo', 'waltzminuet'], up: 20, dur: 1.2 }, { walk: 'player', to: 'waltzrondo', gap: 170, speed: 110 }] },
    { who: null, text: 'The ballroom. A music box somewhere starts a waltz, and two suits of armour turn to face the door.' },
    { together: [{ fx: 'notes', at: 'waltzrondo', top: true }, { walk: 'waltzrondo', to: 'waltzminuet', gap: 34, speed: 50 }, { walk: 'waltzminuet', to: 'waltzrondo', gap: 34, speed: 50 }] },
    { together: [{ face: 'waltzrondo', to: 'waltzminuet' }, { face: 'waltzminuet', to: 'waltzrondo' }, { act: 'waltzrondo', move: 'sway', dur: 0.9, amp: 0.12, speed: 3.5 }, { act: 'waltzminuet', move: 'sway', dur: 0.9, amp: 0.12, speed: 3.5 }, { emote: 'waltzminuet', kind: 'heart', dur: 1.4 }] },
    { together: [{ walk: 'waltzrondo', by: 70, speed: 80 }, { walk: 'waltzminuet', by: -70, speed: 80 }, { act: 'waltzrondo', move: 'sway', dur: 0.9, amp: 0.1, speed: 7 }, { act: 'waltzminuet', move: 'sway', dur: 0.9, amp: 0.1, speed: 7 }, { fx: 'notes', at: 'waltzminuet', top: true }] },
    { together: [{ walk: 'waltzrondo', by: -70, speed: 80 }, { walk: 'waltzminuet', by: 70, speed: 80 }, { act: 'waltzrondo', move: 'sway', dur: 0.9, amp: 0.1, speed: 7 }, { act: 'waltzminuet', move: 'sway', dur: 0.9, amp: 0.1, speed: 7 }, { fx: 'notes', at: 'waltzrondo', top: true }] },
    { together: [{ face: 'waltzrondo', to: 'player' }, { face: 'waltzminuet', to: 'player' }, { mood: 'waltzrondo', as: 'happy' }, { mood: 'waltzminuet', as: 'happy' }] },
    { who: 'waltzrondo', text: 'Guests! At last. My lady, shall we show them how it is done?' },
    { together: [{ emote: 'player', kind: 'sweat', dur: 1.2 }, { mood: 'waltzrondo', as: 'angry' }, { mood: 'waltzminuet', as: 'angry' }] },
    { who: 'waltzminuet', text: 'Oh, we shall. One, two, three... one, two, THREE!', mood: 'happy' },
    { act: 'waltzrondo', move: 'attack', dur: 0.9, async: true },
    { wait: 0.3 },
    { together: [{ flash: '#e6f8ff' }, { shake: 3, dur: 0.3 }, { fx: 'notes', at: 'waltzrondo', top: true, n: 14 }, { walk: 'player', away: 'waltzrondo', by: 30, speed: 160 }, { emote: 'player', kind: '!' }] },
    { wait: 0.5 },
    { cam: 'player', dur: 0.7 },
  ],
  // Madame Velvet, staged: she glares down at the mud on her runner, wags a finger of a sleeve at
  // you, jingles her ring of keys, and hurls a teacup that bursts into china at your feet.
  manor_velvet: [
    { together: [{ cam: 'velvet', dur: 1.1 }, { walk: 'player', to: 'velvet', gap: 160, speed: 110 }, { mood: 'velvet', as: 'angry' }] },
    { together: [{ face: 'velvet', to: 'player' }, { emote: 'velvet', kind: '!' }, { jump: 'velvet', height: 10 }] },
    { who: 'velvet', text: 'Mud. On MY runner. Do you know how long it takes to beat a hundred-year-old rug?', mood: 'angry' },
    { together: [{ act: 'velvet', move: 'sway', dur: 1.2, amp: 0.08, speed: 12 }, { emote: 'velvet', kind: 'anger', dur: 1.6 }] },
    { together: [{ emote: 'player', kind: 'sweat', dur: 1.2 }, { face: 'player', to: -1 }] },
    { face: 'player', to: 'velvet' },
    { who: 'player', text: "We're here for the guests. They need to go home." },
    { together: [{ fx: 'sparkle', at: 'velvet', n: 8 }, { act: 'velvet', move: 'windup', dur: 0.8 }] },
    { who: 'velvet', text: "Nobody leaves the party before the hostess says so. House rules. Tea, anyone? It's scalding.", mood: 'angry' },
    { act: 'velvet', move: 'attack', dur: 0.9, async: true },
    { wait: 0.32 },
    { together: [{ fx: 'china', at: 'player', n: 16 }, { shake: 3, dur: 0.3 }, { jump: 'player', height: 20 }, { emote: 'player', kind: '!' }] },
    { wait: 0.6 },
    { cam: 'player', dur: 0.7 },
  ],
  // Lady Marigold, staged: the camera glides along her long table of sleepy guests to the hostess
  // under the huge moon; petals drift off her as she sways, sad; she holds out her hand for a last
  // waltz and sweeps a storm of petals.
  manor_marigold: [
    { together: [{ cam: 'marigold', up: 30, dur: 2.2 }, { walk: 'player', to: 'marigold', gap: 170, speed: 100 }, { mood: 'marigold', as: 'happy' }] },
    { who: null, text: 'The roof, under a moon far too big. A table is laid for a hundred, every chair taken by a guest who looks very, very tired.' },
    { together: [{ face: 'marigold', to: 'player' }, { jump: 'marigold', height: 12 }, { emote: 'marigold', kind: 'heart', dur: 1.6 }, { fx: 'petals', at: 'marigold', top: true }] },
    { who: 'marigold', text: 'Oh! More guests! How wonderful. Nobody ever stays, you know. So I make sure they do.' },
    { together: [{ cam: ['player', 'marigold'], up: 20, dur: 0.9 }, { face: 'player', to: 'marigold' }] },
    { who: 'player', text: "They want to go home, Lady Marigold. And I think you're lonely, not cruel." },
    { together: [{ mood: 'marigold', as: 'sad' }, { act: 'marigold', move: 'sway', dur: 2.4, amp: 0.06, speed: 2.4 }, { fx: 'petals', at: 'marigold', top: true, n: 8 }] },
    { who: 'marigold', text: "...Then dance with me. One last waltz. If you can keep up, I'll... think about it.", mood: 'sad' },
    { together: [{ walk: 'marigold', to: 'player', gap: 90, speed: 50 }, { fx: 'notes', at: 'marigold', top: true }, { emote: 'player', kind: 'heart', dur: 1.2 }] },
    { act: 'marigold', move: 'attack', dur: 1, async: true },
    { wait: 0.35 },
    { together: [{ flash: '#fff2c8' }, { fx: 'petals', at: 'marigold', n: 36 }, { shake: 2, dur: 0.4 }, { walk: 'player', away: 'marigold', by: 30, speed: 150 }] },
    { wait: 0.6 },
    { cam: 'player', dur: 0.7 },
  ],
  // She's freed at the end, not slain.
  manor_freed: [
    { who: 'marigold', text: '...You kept up. All of you. Nobody has danced with me like that in a hundred years.', mood: 'sad' },
    { who: null, text: 'One by one, the guests at the long table stand, stretch, and drift away down the hill toward home.' },
    { who: 'marigold', text: "Go on, then. All of you. Thank you for coming to my party. Truly.", mood: 'happy' },
    { who: null, text: 'The moon dims to its usual size. Lady Marigold fades with a smile, and the chest by the chimney stops glowing so coldly.' },
  ],
};

// Mr. Pumpkins shouting through the keyhole as the group goes (world/manor.js).
export const MANOR_RADIO = {
  'enter:manor1': ['Lanterns! Three of them in the garden. Light them so I can see you!', 'Mind the fountains: they spout when they please. Use them to get up the terraces!'],
  'enter:manor2': ["The gallery. Her Ladyship's family, all four of them, and none of them ever smiled. Set them to the crest!", 'Each portrait turns. Match them to the crest on the wall and they click into place.'],
  'enter:manor3': ["The ballroom! Those two suits of armour have been dancing since before I was born. Don't get between them."],
  'enter:manor4': ['Books flying about again. Catch the three lost ones. And hold on to something when the pages blow!'],
  'enter:manor5': ["The long hall. Madame Velvet's trolley... when it starts rolling, you RUN. Levers open the doors!"],
  'enter:manor6': ["The roof. She's up there. Be gentle with her... she's only lonely."],
  'clear:manor1': ['Ooh, lovely lanterns. Go on in. Wipe your feet.'],
  'clear:manor2': ['The portraits are smiling! First time in a century, I reckon.'],
  'clear:manor3': ['The music stopped! Good. That waltz has been stuck in my head for sixty years.'],
  'clear:manor4': ['Library sorted. Her Ladyship always did like things tidy.'],
  'clear:manor5': ['You beat Madame Velvet? Nobody beats Madame Velvet. Stairs to the roof are open!'],
  wipe: ["Up you get! Even I trip on those rugs.", "That's alright. Dust yourselves off and try again."],
  chase: ['RUN! Levers, levers, LEVERS!', "That's the trolley! Don't let it catch you!"],
  alone: ['Oh no, the other one is dancing alone now. Faster, and cross about it!'],
  bell: ["She's rung for the maids! They'll go for whoever's healing!"],
  guests: ["Her guests are crowding the roof! She won't come down till they're gone!"],
  lastwaltz: ['The Last Waltz! Get up on a chimney when the moonlight sweeps!'],
};


// ---------- Sunken Aquarium Palace ----------
export const AQUA_SCENES = {
  aquarium_results: [
    { card: 'Sunken Aquarium Palace', sub: 'Rank {grade}  ·  {time}' },
    { who: null, text: '{notes}. Rank bonus on the treasure: +{bonus}.' },
  ],
  // The Twin Morays, staged: the grotto goes still, both eels gone into their holes; Murri slides
  // up out of the floor in a gush of bubbles and peeks about, Ena rises on the far side, they
  // slither together delighted, and both rear up and lunge at you.
  aquarium_moray: [
    { fade: 'out', dur: 0.35, color: '#0e2a40' },
    { together: [{ act: 'moraymurri', move: 'sink' }, { act: 'morayena', move: 'sink' }, { cam: 'moraymurri', dur: 0.1 }] },
    { fade: 'in', dur: 0.6 },
    { who: null, text: 'A grotto full of holes. Something long and spotted slides out of one, and something long and golden watches from another.' },
    { together: [{ fx: 'bubbles', at: 'moraymurri', n: 18 }, { act: 'moraymurri', move: 'emerge', dur: 1.2 }, { mood: 'moraymurri', as: 'happy' }] },
    { together: [{ face: 'moraymurri', to: 'player' }, { emote: 'moraymurri', kind: '!' }] },
    { who: 'moraymurri', text: "Sister! Visitors! Nobody's visited since the palace went down.", mood: 'happy' },
    { together: [{ cam: 'morayena', dur: 1 }, { fx: 'bubbles', at: 'morayena', n: 18 }, { act: 'morayena', move: 'emerge', dur: 1.2 }, { mood: 'morayena', as: 'happy' }] },
    { together: [{ walk: 'morayena', to: 1110, speed: 120 }, { walk: 'moraymurri', to: 1030, speed: 120 }, { cam: ['moraymurri', 'morayena'], dur: 1.2 }] },
    { together: [{ emote: 'morayena', kind: 'heart', dur: 1.4 }, { act: 'moraymurri', move: 'sway', dur: 1.2, amp: 0.08, speed: 6 }, { act: 'morayena', move: 'sway', dur: 1.2, amp: 0.08, speed: 6 }] },
    { together: [{ face: 'morayena', to: 'player' }, { face: 'moraymurri', to: 'player' }, { walk: 'player', to: 'moraymurri', gap: 150, speed: 120 }] },
    { who: 'morayena', text: "Then let's keep them. One for you, one for me... and two to share.", mood: 'happy' },
    { together: [{ act: 'moraymurri', move: 'attack', dur: 0.9 }, { act: 'morayena', move: 'attack', dur: 0.9 }, { fx: 'bubbles', at: 'player', n: 16 }, { jump: 'player', height: 20 }, { emote: 'player', kind: '!' }] },
    { cam: 'player', dur: 0.7 },
  ],
  // Lady Abyssia, staged: the witch twirls her glowing pearl staff and giggles at the little
  // air-breathers, then raises it, and ink floods the room in a dark swirl.
  aquarium_abyssia: [
    { together: [{ cam: 'abyssia', up: 20, dur: 1.2 }, { walk: 'player', to: 'abyssia', gap: 170, speed: 110 }, { mood: 'abyssia', as: 'happy' }] },
    { together: [{ act: 'abyssia', move: 'sway', dur: 1.6, amp: 0.07, speed: 5 }, { fx: 'sparkle', at: 'abyssia', top: true, n: 10 }, { fx: 'bubbles', at: 'abyssia', n: 8 }] },
    { who: 'abyssia', text: 'Oh, little air-breathers, all the way down here? The wards are failing, you know. I am making sure of it.', mood: 'happy' },
    { together: [{ jump: 'abyssia', height: 10 }, { emote: 'abyssia', kind: 'note', dur: 1.2 }] },
    { together: [{ emote: 'player', kind: 'anger', dur: 1.2 }, { face: 'player', to: 'abyssia' }] },
    { who: 'player', text: "You're the one draining the wards? The whole palace is drowning!" },
    { together: [{ mood: 'abyssia', as: 'angry' }, { act: 'abyssia', move: 'windup', dur: 0.9 }, { fx: 'sparkle', at: 'abyssia', top: true, n: 14 }] },
    { who: 'abyssia', text: 'And when it does, the deep is mine. Ink, my darlings!', mood: 'angry' },
    { act: 'abyssia', move: 'attack', dur: 1, async: true },
    { wait: 0.3 },
    { together: [{ fx: 'ink', at: 'abyssia', n: 30 }, { shake: 3, dur: 0.4 }, { fade: 'out', dur: 0.35, color: '#1a1030' }] },
    { together: [{ fade: 'in', dur: 0.8 }, { walk: 'player', away: 'abyssia', by: 30, speed: 150 }, { emote: 'player', kind: 'sweat', dur: 1.2 }] },
    { cam: 'player', dur: 0.7 },
  ],
  // Queen Coralie, staged: she sleeps on her coral throne, bubbles drifting up off her; she wakes
  // slow and sad, looks at you a long moment, then rises and drives her trident down in a burst
  // of the sea.
  aquarium_coralie: [
    { together: [{ mood: 'coralie', as: 'blink' }, { emote: 'coralie', kind: 'zzz', dur: 7 }, { cam: 'coralie', up: 40, dur: 1.8 }, { walk: 'player', to: 'coralie', gap: 170, speed: 90 }] },
    { together: [{ fx: 'bubbles', at: 'coralie', top: true, n: 10 }, { act: 'coralie', move: 'sway', dur: 2.2, amp: 0.04, speed: 2 }] },
    { who: null, text: 'The throne room. A queen sits on a throne of coral, eyes closed, crown askew, the sea swirling slowly around her.' },
    { together: [{ mood: 'coralie', as: 'sad' }, { emote: 'coralie', kind: '?', dur: 1.2, hold: true }, { face: 'coralie', to: 'player' }] },
    { who: 'coralie', text: '...Who disturbs the drowned court? My people are cold. My palace is dark. I have been asleep so long.', mood: 'sad' },
    { together: [{ cam: ['player', 'coralie'], up: 20, dur: 0.9 }, { face: 'player', to: 'coralie' }] },
    { who: 'player', text: "We're here to wake you, your majesty. The wards can still be saved." },
    { together: [{ mood: 'coralie', as: 'angry' }, { jump: 'coralie', height: 18 }, { fx: 'bubbles', at: 'coralie', n: 20 }] },
    { who: 'coralie', text: 'Then prove you are stronger than the tide that took us!', mood: 'angry' },
    { act: 'coralie', move: 'attack', dur: 1, async: true },
    { wait: 0.32 },
    { together: [{ flash: '#bff0ff' }, { shake: 5, dur: 0.5 }, { fx: 'bubbles', at: 'coralie', n: 36 }, { fx: 'sparkle', at: 'coralie', n: 12 }, { jump: 'player', height: 18 }, { emote: 'player', kind: '!' }] },
    { wait: 0.5 },
    { cam: 'player', dur: 0.7 },
  ],
  aquarium_freed: [
    { who: 'coralie', text: '...The water is warm again. I remember. I remember the sun on the waves.', mood: 'sad' },
    { who: null, text: 'One by one, the bubble wards flicker back on. The palace lights up from the throne to the coral gate.' },
    { who: 'coralie', text: "Thank you, surface-friends. Come back and visit us. We'll leave the gate open.", mood: 'happy' },
  ],
};

// Marina talking through her bubble charm as the group dives (world/aquarium.js).
export const AQUA_RADIO = {
  'enter:aquarium1': ['Hear me through the bubble? Light the lantern corals so I can follow you down!', 'Those streams of bubbles go up: press Up in them to ride.'],
  'enter:aquarium2': ['Kelp gardens. Watch the currents: go with them, not against!'],
  'enter:aquarium3': ['The pearl vault! Listen to the bell: the clams open only in its order.'],
  'enter:aquarium4': ["The morays' grotto. Two of them, and the holes in the walls go deep..."],
  'enter:aquarium5': ['The abyss. The tide surges up that shaft: when it rushes in, climb!'],
  'enter:aquarium6': ["The throne room. The queen's been asleep a hundred years. Wake her gently, if you can."],
  'clear:aquarium1': ['The corals are lit! I can see you. Down you go.'],
  'clear:aquarium2': ['Out of the kelp! You lot swim like fish.'],
  'clear:aquarium3': ['The vault is open! Pearls everywhere... focus!'],
  'clear:aquarium4': ['Both morays down! The grotto is yours.'],
  'clear:aquarium5': ["Abyssia's gone back to the deep. The throne room is just below!"],
  wipe: ['Up you come, breathe, and try again!', 'Shake it off. The sea is big, and so is your heart.'],
  flood: ['The tide! Get up on a ledge!', 'Here it comes, climb!'],
  moraymad: ["The other sister's angry now! Watch her!"],
  anglers: ['Lights in the dark: anglers! Bring them down!'],
  whirl: ['A whirlpool! Swim against it!'],
  wave: ['The Great Wave! Jump, or get up high!'],
};


// ---------- Clockwork Carnival ----------
export const CARNIVAL_SCENES = {
  carnival_results: [
    { card: 'Clockwork Carnival', sub: 'Rank {grade}  ·  {time}' },
    { who: null, text: '{notes}. Rank bonus on the treasure: +{bonus}.' },
  ],
  // Leonie, staged: the Big Top goes dark, a drumroll, and a spotlight finds the lioness on her
  // star-print ball; she leaps sky-high in a shower of confetti, rolls up to you, bows to the
  // crowd and pounces.
  carnival_leonie: [
    { together: [{ cam: 'leonie', up: 20, dur: 1.2 }, { walk: 'player', to: 'leonie', gap: 180, speed: 110 }, { spot: 'leonie', r: 46, dur: 0.8 }, { mood: 'leonie', as: 'happy' }] },
    { together: [{ shake: 1.5, dur: 1.2 }, { act: 'leonie', move: 'windup', dur: 1.2 }] },
    { who: null, text: 'The Big Top. A drumroll from nowhere. A spotlight swings round and finds a lioness balancing on a star-print ball, grinning.' },
    { together: [{ jump: 'leonie', height: 70 }, { fx: 'confetti', at: 'leonie', top: true, n: 30 }, { emote: 'player', kind: '!' }] },
    { together: [{ fx: 'confetti', at: 'leonie', n: 20 }, { shake: 2, dur: 0.3 }, { spot: null, dur: 0.6 }] },
    { who: 'leonie', text: 'Ladies and gentlemen! Tonight, for one night only... YOU get to be the act!', mood: 'happy' },
    { together: [{ walk: 'leonie', to: 'player', gap: 110, speed: 140 }, { cam: ['player', 'leonie'], up: 20, dur: 1 }] },
    { together: [{ act: 'leonie', move: 'sway', dur: 0.9, amp: 0.15, speed: 3.5 }, { emote: 'leonie', kind: 'heart', dur: 1.2 }, { fx: 'sparkle', at: 'leonie', top: true }] },
    { who: 'leonie', text: 'Try not to be eaten. The crowd hates it when that happens.', mood: 'happy' },
    { act: 'leonie', move: 'attack', dur: 0.9, async: true },
    { wait: 0.3 },
    { together: [{ shake: 4, dur: 0.4 }, { fx: 'confetti', at: 'player', n: 16 }, { walk: 'player', away: 'leonie', by: 30, speed: 160 }, { emote: 'player', kind: 'sweat', dur: 1.2 }] },
    { wait: 0.4 },
    { cam: 'player', dur: 0.7 },
  ],
  // Madame Marionette, staged: she lowers herself on her thread from the rafters, her little
  // puppets dancing beneath her, coos over your lack of strings, then yanks hers.
  carnival_marionetta: [
    { fade: 'out', dur: 0.3, color: '#1e1430' },
    { together: [{ act: 'marionetta', move: 'hoist', from: 200 }, { mood: 'marionetta', as: 'happy' }] },
    { cam: 'marionetta', dur: 0 },
    { together: [{ fade: 'in', dur: 0.7 }, { act: 'marionetta', move: 'descend', dur: 2.4 }, { cam: { x: 760, y: 640 }, dur: 2.4 }, { walk: 'player', to: 'marionetta', gap: 170, speed: 100 }] },
    { together: [{ act: 'marionetta', move: 'sway', dur: 1.6, amp: 0.1, speed: 4 }, { fx: 'notes', at: 'marionetta' }, { fx: 'sparkle', at: 'marionetta', n: 8 }] },
    { who: 'marionetta', text: 'Oh, visitors. With arms and legs and everything. How... unfinished you look without strings.', mood: 'happy' },
    { together: [{ cam: ['player', 'marionetta'], up: 30, dur: 0.9 }, { emote: 'player', kind: 'sweat', dur: 1.2 }, { face: 'player', to: 'marionetta' }] },
    { who: 'player', text: "We're here to wind the Queen down. Let your toys rest." },
    { together: [{ mood: 'marionetta', as: 'angry' }, { emote: 'marionetta', kind: 'anger', dur: 1.6 }, { act: 'marionetta', move: 'windup', dur: 0.8 }] },
    { who: 'marionetta', text: 'Rest? A puppet that rests is just firewood. Dance for me!', mood: 'angry' },
    { act: 'marionetta', move: 'attack', dur: 0.9, async: true },
    { wait: 0.3 },
    { together: [{ shake: 3, dur: 0.3 }, { fx: 'sparkle', at: 'player', n: 12 }, { jump: 'player', height: 24 }, { emote: 'player', kind: '!' }] },
    { together: [{ jump: 'player', height: 14 }, { fx: 'notes', at: 'player' }] },
    { wait: 0.4 },
    { cam: 'player', dur: 0.7 },
  ],
  // Queen Gearheart, staged: under the great wheel the clockwork owl rocks on the beat, tick,
  // tock, shedding little brass gears, her key humming; she can't stop; then the clock strikes and
  // she beats her wings down in a burst of gears.
  carnival_gearheart: [
    { together: [{ cam: 'gearheart', up: 40, dur: 1.6 }, { walk: 'player', to: 'gearheart', gap: 180, speed: 100 }, { mood: 'gearheart', as: 'sad' }] },
    { together: [{ act: 'gearheart', move: 'sway', dur: 3, amp: 0.06, speed: 6.28 }, { fx: 'gears', at: 'gearheart', top: true, n: 8 }] },
    { who: null, text: 'Under the great wheel, a queen of brass and porcelain turns slowly, her key spinning so fast it hums.' },
    { together: [{ act: 'gearheart', move: 'sway', dur: 2, amp: 0.06, speed: 6.28 }, { emote: 'gearheart', kind: 'sweat', dur: 1.6 }] },
    { who: 'gearheart', text: 'Tick... tock... the show... must go on... I cannot stop... I was wound... too tight...', mood: 'sad' },
    { together: [{ cam: ['player', 'gearheart'], up: 30, dur: 0.9 }, { face: 'player', to: 'gearheart' }, { emote: 'player', kind: 'heart', dur: 1.2 }] },
    { who: 'player', text: "Then we'll help you stop. Hold on, your majesty!" },
    { together: [{ mood: 'gearheart', as: 'angry' }, { act: 'gearheart', move: 'windup', dur: 0.9 }, { fx: 'gears', at: 'gearheart', n: 10 }] },
    { who: 'gearheart', text: 'Then... keep up! TICK! TOCK!', mood: 'angry' },
    { act: 'gearheart', move: 'attack', dur: 1, async: true },
    { wait: 0.32 },
    { together: [{ flash: '#ffe8a0' }, { shake: 5, dur: 0.5 }, { fx: 'gears', at: 'gearheart', top: true, n: 24 }, { walk: 'player', away: 'gearheart', by: 30, speed: 160 }, { emote: 'player', kind: '!' }] },
    { wait: 0.5 },
    { cam: 'player', dur: 0.7 },
  ],
  carnival_freed: [
    { who: 'gearheart', text: '...tick... ...tock... Oh. It is quiet. I had forgotten what quiet sounds like.', mood: 'sad' },
    { who: null, text: 'Her key slows, and stops. All over the fairground, the toys sit down where they stand and sigh.' },
    { who: 'gearheart', text: 'Thank you. Come back tomorrow night. We will play one slow tune, just for you.', mood: 'happy' },
  ],
};

// Tock calling from the gate with a tin trumpet as the group goes round (world/carnival.js).
export const CARNIVAL_RADIO = {
  'enter:carnival1': ['The Midway! Wind the three music boxes and the gates open. Mind the carousel horses!', "Ride the horses up to the high stalls, that's how I do it."],
  'enter:carnival2': ['The Funhouse! Bounce on the springboards and pop the prize balloons up top.'],
  'enter:carnival3': ['The Coaster Yard! When the rail lights up, GET OFF THE TRACK!'],
  'enter:carnival4': ["The Big Top. Leonie's act. She jumps on you from the trapeze... watch for the spotlight!"],
  'enter:carnival5': ["The Workshop. Madame Marionette makes the puppets here. Don't let her get her strings on you!"],
  'enter:carnival6': ['The Ferris Wheel. Her Majesty is up there. Please... wind her down gently.'],
  'clear:carnival1': ['The music boxes are singing! On to the Funhouse!'],
  'clear:carnival2': ['All the prizes popped! Hee hee.'],
  'clear:carnival3': ['You beat the coaster! Nobody beats the coaster.'],
  'clear:carnival4': ["Leonie's taking a bow. Great show!"],
  'clear:carnival5': ['The strings are cut! The Ferris Wheel is next!'],
  wipe: ['Wind yourselves back up and try again!', 'Oof. Even toys fall over. Up you get!'],
  roar: ['She roared! Here comes the real act!'],
  puppets: ['Puppets on the belts! Get them!'],
  cars: ['The wheel cars are coming down! Move!'],
  overwound: ["She's overwound! It's now or never!"],
};


// ---------- Star Observatory ----------
export const OBS_SCENES = {
  observatory_results: [
    { card: 'Star Observatory', sub: 'Rank {grade}  ·  {time}' },
    { who: null, text: '{notes}. Rank bonus on the treasure: +{bonus}.' },
  ],
  // Folio, staged: the archivist is curled up reading, eyes shut, rocking gently on her huge
  // book; she turns very slowly, shushes you as pages flutter up, then rears and slams the book
  // shut in a gust that sends pages everywhere.
  observatory_folio: [
    { together: [{ cam: 'folio', up: 20, dur: 1.4 }, { walk: 'player', to: 'folio', gap: 180, speed: 100 }, { mood: 'folio', as: 'blink' }, { act: 'folio', move: 'sway', dur: 2.6, amp: 0.04, speed: 2.4 }] },
    { who: null, text: 'The Archive. A thousand shelves, and a librarian with an enormous book who turns very slowly to look at you.' },
    { together: [{ fx: 'pages', at: 'folio', n: 4 }, { wait: 0.6 }] },
    { together: [{ face: 'folio', to: 'player' }, { mood: 'folio', as: 'angry' }, { emote: 'folio', kind: 'anger', dur: 1.8 }] },
    { who: 'folio', text: 'Shhh. SHHHHH. You are stamping. In MY archive. Do you have a library card?', mood: 'angry' },
    { emote: 'player', kind: 'sweat', dur: 1.2, hold: true },
    { who: 'player', text: "We're going up to see Astraea." },
    { together: [{ act: 'folio', move: 'windup', dur: 0.9 }, { fx: 'pages', at: 'folio', top: true, n: 8 }] },
    { who: 'folio', text: 'Then your books are overdue. ALL of them. Fines are payable at once!', mood: 'angry' },
    { act: 'folio', move: 'attack', dur: 0.9, async: true },
    { wait: 0.3 },
    { together: [{ shake: 4, dur: 0.4 }, { fx: 'pages', at: 'folio', n: 24 }, { fx: 'wind', at: 'player' }, { walk: 'player', away: 'folio', by: 34, speed: 170 }, { emote: 'player', kind: '!' }] },
    { wait: 0.5 },
    { cam: 'player', dur: 0.7 },
  ],
  // The Eclipse Twins, staged: in the orrery the sun-fox flares gold and the moon-rabbit glows
  // silver; Luna glides in front of Sol, the room darkens to an eclipse with a ring of fire round
  // them, and they spring apart and pounce from both sides.
  observatory_eclipse: [
    { together: [{ cam: ['eclipsesol', 'eclipseluna'], up: 20, dur: 1.4 }, { walk: 'player', to: 'eclipsesol', gap: 180, speed: 100 }, { mood: 'eclipsesol', as: 'happy' }, { mood: 'eclipseluna', as: 'happy' }] },
    { who: null, text: 'The Orrery. Brass planets wheel slowly round a sun of glass. Two sisters float at its heart, one gold, one silver.' },
    { together: [{ jump: 'eclipsesol', height: 18 }, { fx: 'sparkle', at: 'eclipsesol', top: true, n: 14 }, { face: 'eclipsesol', to: 'player' }] },
    { who: 'eclipsesol', text: 'Visitors, Luna! On the one night our lady stopped the sky.', mood: 'happy' },
    { together: [{ jump: 'eclipseluna', height: 22 }, { fx: 'hearts', at: 'eclipseluna', n: 6 }, { face: 'eclipseluna', to: 'player' }] },
    { who: 'eclipseluna', text: "Then let's show them an eclipse they won't forget, Sol. Light and dark!", mood: 'happy' },
    { together: [{ walk: 'eclipseluna', to: 'eclipsesol', gap: 6, speed: 90 }, { fade: 'out', dur: 1.4, to: 0.62, color: '#0e0a24' }] },
    { together: [{ flash: '#ffd36b' }, { fx: 'sparkle', at: 'eclipsesol', n: 24 }, { shake: 2, dur: 0.6 }, { emote: 'player', kind: '!' }] },
    { wait: 0.6 },
    { together: [{ fade: 'in', dur: 0.6 }, { walk: 'eclipseluna', by: 120, speed: 200 }, { walk: 'eclipsesol', by: -40, speed: 120 }] },
    { together: [{ act: 'eclipsesol', move: 'attack', dur: 0.9 }, { act: 'eclipseluna', move: 'attack', dur: 0.9 }, { walk: 'player', away: 'eclipsesol', by: 26, speed: 150 }] },
    { cam: 'player', dur: 0.7 },
  ],
  // Astraea, staged: the camera looks up from the crown of the tower at stars that do not move,
  // then comes down to the starry stag, sad and still; she rears and stamps down a starburst, and
  // for a moment the stars start falling again.
  observatory_astraea: [
    { together: [{ cam: 'astraea', up: 150, dur: 0.01 }, { mood: 'astraea', as: 'sad' }] },
    { together: [{ cam: 'astraea', up: 30, dur: 2.6 }, { walk: 'player', to: 'astraea', gap: 180, speed: 90 }] },
    { who: null, text: 'The crown of the tower, open to the sky. The great telescope points straight up at stars that do not move.' },
    { together: [{ act: 'astraea', move: 'sway', dur: 2.2, amp: 0.04, speed: 2 }, { fx: 'sparkle', at: 'astraea', top: true, n: 8 }] },
    { who: 'astraea', text: 'Every night, stars fall. Every night, something I love burns out and is gone. So I stopped them.', mood: 'sad' },
    { together: [{ cam: ['player', 'astraea'], up: 30, dur: 0.9 }, { face: 'player', to: 'astraea' }] },
    { who: 'player', text: "But a sky that doesn't turn is a sky that's dying. Let them go." },
    { together: [{ mood: 'astraea', as: 'angry' }, { act: 'astraea', move: 'windup', dur: 1 }, { fx: 'sparkle', at: 'astraea', top: true, n: 16 }] },
    { who: 'astraea', text: '...Then show me. Show me something worth letting fall for!', mood: 'angry' },
    { act: 'astraea', move: 'attack', dur: 1, async: true },
    { wait: 0.32 },
    { together: [{ flash: '#fff6c8' }, { shake: 5, dur: 0.5 }, { fx: 'sparkle', at: 'astraea', n: 26 }, { fx: 'starfall', at: 'astraea' }, { walk: 'player', away: 'astraea', by: 30, speed: 160 }, { emote: 'player', kind: '!' }] },
    { wait: 1.2 },
    { cam: 'player', dur: 0.7 },
  ],
  observatory_freed: [
    { who: 'astraea', text: "...Look. They're moving again. And there, a shooting star. It's... beautiful, isn't it?", mood: 'sad' },
    { who: null, text: 'The great telescope swings slowly round. Above the tower the whole sky begins to turn, and stars fall like rain.' },
    { who: 'astraea', text: 'Make a wish, all of you. I think I finally will, too.', mood: 'happy' },
  ],
};

// Professor Lumen calling up through his speaking tube as the group climbs (world/observatory.js).
export const OBS_RADIO = {
  'enter:observatory1': ["Up the stair! Light the three star lamps, and mind the meteors, they fall where they like!"],
  'enter:observatory2': ["The Constellation Hall. Each lamp flips its neighbours too. Think before you light!", 'Five lamps. Light them all. It is a puzzle older than I am.'],
  'enter:observatory3': ['The reading room has no weight to it. Jump gently... or not, it is rather fun!'],
  'enter:observatory4': ["Folio's archive. Whatever you do, don't make a sound. ...Too late."],
  'enter:observatory5': ["The Orrery! Sol is hurt only in shadow, Luna only in light. Drag them across!"],
  'enter:observatory6': ["The crown. Astraea is up there. She's not cruel, you know. She's afraid."],
  'clear:observatory1': ['Lovely lamps. Onward and upward!'],
  'clear:observatory2': ['The constellation! I have waited forty years to see it lit.'],
  'clear:observatory3': ['Feet back on the floor? Good. Up you go.'],
  'clear:observatory4': ['You got past Folio? Return your books on time, next time.'],
  'clear:observatory5': ['The eclipse is over! The crown is right above you!'],
  wipe: ['Dust yourselves off, stargazers. Try again!', 'The stars will wait. Up you get.'],
  moths: ['Moths! Protect your healer!'],
  shelves: ["The shelves are closing in! Stay in the middle!"],
  lines: ['The constellations! Find the dark between the stars!'],
  nova: ["Supernova! Jump when it flares!"],
};


// ---------- Candy Volcano ----------
export const VOLCANO_SCENES = {
  volcano_results: [
    { card: 'Candy Volcano', sub: 'Rank {grade}  ·  {time}' },
    { who: null, text: '{notes}. Rank bonus on the treasure: +{bonus}.' },
  ],
  // Toffee, staged: the forge rings to her hammer, three strokes on the anvil in a spray of
  // sparks; she looks up through the steam and grins, then tests her new hammer on the floor in a
  // great splash of caramel.
  volcano_toffee: [
    { together: [{ cam: 'toffee', up: 20, dur: 1.2 }, { walk: 'player', to: 'toffee', gap: 190, speed: 100 }, { face: 'toffee', to: 1 }, { mood: 'toffee', as: 'happy' }] },
    { act: 'toffee', move: 'attack', dur: 0.75, async: true },
    { wait: 0.28 },
    { together: [{ fx: 'sparks', at: 'toffee' }, { shake: 1.5, dur: 0.2 }, { wait: 0.5 }] },
    { act: 'toffee', move: 'attack', dur: 0.75, async: true },
    { wait: 0.28 },
    { together: [{ fx: 'sparks', at: 'toffee' }, { shake: 1.5, dur: 0.2 }, { wait: 0.5 }] },
    { act: 'toffee', move: 'attack', dur: 0.75, async: true },
    { wait: 0.28 },
    { together: [{ fx: 'sparks', at: 'toffee', n: 24 }, { shake: 2, dur: 0.25 }, { wait: 0.5 }] },
    { who: null, text: 'The forge rings. A smith with a caramel hammer looks up from her anvil and grins through the steam.' },
    { together: [{ face: 'toffee', to: 'player' }, { emote: 'toffee', kind: '!' }, { jump: 'toffee', height: 12 }] },
    { who: 'toffee', text: "Visitors! You're just in time. I need something to test my new hammer on!", mood: 'happy' },
    { together: [{ cam: ['player', 'toffee'], up: 20, dur: 0.9 }, { emote: 'player', kind: 'sweat', dur: 1.4 }, { face: 'player', to: 'toffee' }] },
    { who: 'toffee', text: "Hold still. Or don't. Moving targets are more fun!", mood: 'happy' },
    { together: [{ act: 'toffee', move: 'windup', dur: 0.8 }, { walk: 'toffee', to: 'player', gap: 120, speed: 90 }] },
    { act: 'toffee', move: 'attack', dur: 0.9, async: true },
    { wait: 0.3 },
    { together: [{ shake: 5, dur: 0.5 }, { fx: 'caramel', at: 'toffee', n: 26 }, { fx: 'sparks', at: 'toffee' }, { jump: 'player', height: 24 }, { emote: 'player', kind: '!' }] },
    { wait: 0.5 },
    { cam: 'player', dur: 0.7 },
  ],
  // Gretel, staged: the gingerbread knight bars the way, beats her cookie shield three times in a
  // shower of crumbs, salutes with her candy-cane lance, backs off to the end of the lists like a
  // joust, and charges.
  volcano_gretel: [
    { together: [{ cam: 'gretel', up: 20, dur: 1.2 }, { walk: 'player', to: 'gretel', gap: 190, speed: 100 }, { mood: 'gretel', as: 'angry' }] },
    { together: [{ face: 'gretel', to: 'player' }, { emote: 'gretel', kind: '!' }] },
    { who: 'gretel', text: 'Halt! I am Gretel, Knight of the Gingerbread Wall. None shall pass to the crater!', mood: 'angry' },
    { together: [{ jump: 'gretel', height: 8 }, { fx: 'crumbs', at: 'gretel', n: 8 }, { shake: 1, dur: 0.15 }] },
    { together: [{ jump: 'gretel', height: 8 }, { fx: 'crumbs', at: 'gretel', n: 8 }, { shake: 1, dur: 0.15 }] },
    { together: [{ jump: 'gretel', height: 8 }, { fx: 'crumbs', at: 'gretel', n: 12 }, { shake: 1.5, dur: 0.2 }] },
    { who: 'player', text: "The Queen's going to bury the whole island in caramel. Let us through." },
    { together: [{ act: 'gretel', move: 'sway', dur: 0.8, amp: -0.12, speed: 4 }, { fx: 'sparkle', at: 'gretel', top: true }] },
    { together: [{ walk: 'gretel', away: 'player', by: 110, speed: 120 }, { cam: ['player', 'gretel'], up: 20, dur: 1 }] },
    { face: 'gretel', to: 'player' },
    { who: 'gretel', text: 'Then you will have to go through ME. En garde!', mood: 'angry' },
    { act: 'gretel', move: 'windup', dur: 0.6 },
    { together: [{ walk: 'gretel', to: 'player', gap: 60, speed: 360 }, { act: 'gretel', move: 'attack', dur: 0.5 }, { fx: 'crumbs', at: 'gretel', n: 10 }] },
    { together: [{ flash: '#fff2d8' }, { shake: 4, dur: 0.4 }, { fx: 'crumbs', at: 'gretel', n: 20 }, { walk: 'player', away: 'gretel', by: 36, speed: 200 }, { emote: 'player', kind: '!' }] },
    { wait: 0.4 },
    { cam: 'player', dur: 0.7 },
  ],
  // Queen Bonbon, staged: the cake queen rocks round and round stirring her lake of caramel as it
  // bubbles and spatters, bounces with glee, goes flustered at the word "buried", then scoops up
  // a great dollop of frosting and flings it at you.
  volcano_bonbon: [
    { together: [{ cam: 'bonbon', up: 30, dur: 1.4 }, { walk: 'player', to: 'bonbon', gap: 190, speed: 100 }, { mood: 'bonbon', as: 'happy' }, { act: 'bonbon', move: 'sway', dur: 2.6, amp: 0.07, speed: 4 }, { fx: 'caramel', at: 'bonbon', n: 8 }] },
    { who: null, text: 'The crater. A lake of bubbling caramel, islands of rock candy, and a queen in a gown of cake stirring it all with a giant spoon.' },
    { together: [{ act: 'bonbon', move: 'sway', dur: 2, amp: 0.07, speed: 4 }, { fx: 'caramel', at: 'bonbon', n: 10 }, { fx: 'sparks', at: 'bonbon', n: 8 }] },
    { together: [{ face: 'bonbon', to: 'player' }, { jump: 'bonbon', height: 14 }, { emote: 'bonbon', kind: 'heart', dur: 1.4 }] },
    { who: 'bonbon', text: 'More sugar! More heat! The biggest dessert in the WORLD, and everyone gets a slice!', mood: 'happy' },
    { together: [{ cam: ['player', 'bonbon'], up: 20, dur: 0.9 }, { face: 'player', to: 'bonbon' }] },
    { who: 'player', text: 'If it erupts, everyone gets buried in it!' },
    { together: [{ mood: 'bonbon', as: 'hurt' }, { emote: 'bonbon', kind: 'sweat', dur: 1.6, hold: true }] },
    { who: 'bonbon', text: "...Buried? Oh. Oh dear. Well, I'm not stopping now! Stir, stir, STIR!", mood: 'angry' },
    { together: [{ mood: 'bonbon', as: 'angry' }, { act: 'bonbon', move: 'windup', dur: 0.8 }] },
    { act: 'bonbon', move: 'attack', dur: 0.9, async: true },
    { wait: 0.3 },
    { together: [{ fx: 'caramel', at: 'player', n: 22 }, { shake: 3, dur: 0.3 }, { jump: 'player', height: 16 }, { emote: 'player', kind: 'sweat', dur: 1.4 }] },
    { wait: 0.5 },
    { cam: 'player', dur: 0.7 },
  ],
  volcano_freed: [
    { who: 'bonbon', text: "...Oh my. I got rather carried away, didn't I? It's just... nobody ever stays for dessert.", mood: 'sad' },
    { who: null, text: 'The caramel cools and settles. The volcano gives one last, gentle puff of pink sugar-steam.' },
    { who: 'bonbon', text: 'Stay a while? I make a VERY good cake. A normal-sized one. Probably.', mood: 'happy' },
  ],
};

// Chef Praline calling from the trail with a mixing-bowl megaphone (world/volcano.js).
export const VOLCANO_RADIO = {
  'enter:volcano1': ['Three sugar crystals in the valley! And mind the taffy, it sticks like nothing else.'],
  'enter:volcano2': ["The mine! Don't touch the caramel pit: ride the carts across!"],
  'enter:volcano3': ['My old kitchen! Follow the recipe exactly. One candy too many and it all boils over!'],
  'enter:volcano4': ["Toffee's forge. When she raises that hammer, JUMP."],
  'enter:volcano5': ["Gretel's wall. When her icing shield is up, get round behind her!"],
  'enter:volcano6': ['The crater! Cool her down, gently... she means well, really.'],
  'clear:volcano1': ['Lovely crystals. Onward!'],
  'clear:volcano2': ['Out of the mine! Not a single burnt toe, I hope.'],
  'clear:volcano3': ['Perfect recipe! You could have my job.'],
  'clear:volcano4': ["The forge has gone quiet. Toffee's sulking. Ha!"],
  'clear:volcano5': ['The wall is open! The crater is just above!'],
  wipe: ['Up you get, sugar! Try again.', 'Everyone falls in the taffy sometimes.'],
  bellows: ['The bellows! Hold on to something!'],
  shield: ['Shield up! Go round behind her!'],
  caramel: ['The caramel is rising! Islands, now!'],
  erupt: ['ERUPTION! Jump!'],
};

// ---------- Dream Theatre ----------
export const THEATRE_SCENES = {
  theatre_results: [
    { card: 'Dream Theatre', sub: 'Rank {grade}  ·  {time}' },
    { who: null, text: '{notes}. Rank bonus on the treasure: +{bonus}.' },
  ],
  // Persona, staged: the two-coated cat muse waltzes alone under the chandeliers; she can't
  // decide, so she flips between Comedy and Tragedy, the light flashing gold and blue faster and
  // faster, until she sweeps both masks round at you.
  theatre_persona: [
    { together: [{ cam: 'persona', up: 20, dur: 1.4 }, { walk: 'player', to: 'persona', gap: 190, speed: 100 }, { act: 'persona', move: 'sway', dur: 2.4, amp: 0.1, speed: 3.6 }, { fx: 'notes', at: 'persona', top: true }] },
    { who: null, text: 'The ballroom set glides in. Under the chandeliers a muse in a gown of two colours dances alone, a mask in each hand.' },
    { together: [{ walk: 'persona', by: 40, speed: 60 }, { act: 'persona', move: 'sway', dur: 1.2, amp: 0.12, speed: 5 }] },
    { together: [{ walk: 'persona', by: -40, speed: 60 }, { act: 'persona', move: 'sway', dur: 1.2, amp: 0.12, speed: 5 }] },
    { together: [{ face: 'persona', to: 'player' }, { mood: 'persona', as: 'happy' }, { flash: '#ffd36b' }, { fx: 'confetti', at: 'persona', top: true, n: 12 }] },
    { who: 'persona', text: 'Oh, an audience! Shall I make you laugh?', mood: 'happy' },
    { together: [{ mood: 'persona', as: 'sad' }, { flash: '#7fa8ff' }, { fx: 'sparkle', at: 'persona', top: true, n: 8 }] },
    { who: 'persona', text: '...Or shall I make you cry? I can never decide. Let us find out together!', mood: 'sad' },
    { together: [{ mood: 'persona', as: 'happy' }, { flash: '#ffd36b' }, { wait: 0.35 }] },
    { together: [{ mood: 'persona', as: 'sad' }, { flash: '#7fa8ff' }, { wait: 0.28 }] },
    { together: [{ mood: 'persona', as: 'happy' }, { flash: '#ffd36b' }, { wait: 0.22 }] },
    { together: [{ mood: 'persona', as: 'angry' }, { flash: '#7fa8ff' }, { act: 'persona', move: 'windup', dur: 0.5 }] },
    { act: 'persona', move: 'attack', dur: 0.9, async: true },
    { wait: 0.3 },
    { together: [{ shake: 4, dur: 0.4 }, { fx: 'confetti', at: 'player', n: 14 }, { walk: 'player', away: 'persona', by: 30, speed: 160 }, { emote: 'player', kind: '!' }] },
    { wait: 0.4 },
    { cam: 'player', dur: 0.7 },
  ],
  // Madame Directrice, staged: the parrot director spins round at the intrusion and bellows
  // through her megaphone, rings of sound and feathers flying; she snaps her clapperboard, the
  // take card cuts in, and ACTION.
  theatre_directrice: [
    { together: [{ cam: 'directrice', up: 20, dur: 1.2 }, { walk: 'player', to: 'directrice', gap: 190, speed: 100 }, { face: 'directrice', to: 1 }] },
    { together: [{ face: 'directrice', to: 'player' }, { jump: 'directrice', height: 16 }, { emote: 'directrice', kind: 'anger', dur: 2 }, { mood: 'directrice', as: 'angry' }, { fx: 'feathers', at: 'directrice', top: true }] },
    { together: [{ act: 'directrice', move: 'windup', dur: 0.7 }, { fx: 'shout', at: 'directrice' }, { shake: 3, dur: 0.6 }] },
    { who: 'directrice', text: 'Who let the audience backstage?! This is a CLOSED set!', mood: 'angry' },
    { together: [{ emote: 'player', kind: 'sweat', dur: 1.2 }, { walk: 'player', away: 'directrice', by: 16, speed: 60 }] },
    { who: 'player', text: 'Your play is making the whole island forget itself.' },
    { together: [{ act: 'directrice', move: 'sway', dur: 1, amp: 0.1, speed: 9 }, { fx: 'feathers', at: 'directrice', top: true, n: 6 }] },
    { who: 'directrice', text: 'Then you will be my extras. Places, everyone! And... ACTION!', mood: 'angry' },
    { together: [{ act: 'directrice', move: 'attack', dur: 0.8 }, { flash: '#ffffff' }, { fx: 'shout', at: 'directrice' }] },
    { card: 'Take 1', sub: 'ACTION!' },
    { together: [{ shake: 3, dur: 0.3 }, { fx: 'feathers', at: 'directrice', n: 14 }, { jump: 'player', height: 18 }, { emote: 'player', kind: '!' }] },
    { wait: 0.4 },
    { cam: 'player', dur: 0.7 },
  ],
  // The Phantom Playwright, staged: the great stage dark but for one spotlight on his desk; ink
  // wells up and the phantom rises out of it in a whirl of script pages; the final act's card is
  // written in, and he slashes a stroke of ink across the stage.
  theatre_playwright: [
    { fade: 'out', dur: 0.35, color: '#120c20' },
    { together: [{ act: 'playwright', move: 'sink' }, { cam: 'playwright', up: 20, dur: 0 }, { spot: 'playwright', r: 50, dur: 0 }] },
    { together: [{ fade: 'in', dur: 0.8 }, { walk: 'player', to: 'playwright', gap: 190, speed: 100 }] },
    { who: null, text: 'The great stage. A desk stands alone in a single spotlight, buried in pages. A pale figure in a half-mask lifts his quill.' },
    { together: [{ fx: 'ink', at: 'playwright', n: 14 }, { act: 'playwright', move: 'emerge', dur: 1.8 }, { fx: 'pages', at: 'playwright', n: 12 }] },
    { together: [{ fx: 'pages', at: 'playwright', top: true, n: 10 }, { face: 'playwright', to: 'player' }, { act: 'playwright', move: 'sway', dur: 1.4, amp: 0.05, speed: 3 }] },
    { who: 'playwright', text: 'Ah, my heroes arrive, exactly on cue. I wrote this scene for you.' },
    { together: [{ spot: null, dur: 0.8 }, { cam: ['player', 'playwright'], up: 30, dur: 0.9 }, { face: 'player', to: 'playwright' }] },
    { who: 'player', text: 'Then write it a different ending.' },
    { together: [{ mood: 'playwright', as: 'angry' }, { act: 'playwright', move: 'windup', dur: 0.9 }, { fx: 'pages', at: 'playwright', top: true, n: 14 }] },
    { who: 'playwright', text: 'Every story needs a villain, and every villain needs a final act. Let us find out who it is.', mood: 'angry' },
    { card: 'The Final Act', sub: 'as written by the Phantom' },
    { act: 'playwright', move: 'attack', dur: 1, async: true },
    { wait: 0.32 },
    { together: [{ fx: 'ink', at: 'player', n: 24 }, { shake: 5, dur: 0.5 }, { flash: '#2a1a3a' }, { walk: 'player', away: 'playwright', by: 30, speed: 160 }, { emote: 'player', kind: '!' }] },
    { wait: 0.5 },
    { cam: 'player', dur: 0.7 },
  ],
  theatre_freed: [
    { who: 'playwright', text: '...Applause? For them? Nobody has ever applauded my ending before.', mood: 'sad' },
    { who: null, text: 'The pages settle like snow. Out in the stalls, the audience blink and remember their own names.' },
    { who: 'playwright', text: 'Very well. One more draft. This time, a happy ending. For everyone.', mood: 'happy' },
  ],
};

// Madame Encore calling from the wings in a stage whisper (world/theatre.js).
export const THEATRE_RADIO = {
  'enter:theatre1': ['Three tickets lost somewhere in the lobby, darlings. And step into the spotlights: everything looks better in the light. Even the monsters, who hurt more there.'],
  'enter:theatre2': ['Act One! The deck rocks, so lean into it. And when the cannons mark the boards, MOVE.'],
  'enter:theatre3': ['Act Two. Watch the cue lamps, then play them back in order. Miss one and we start from the top!'],
  'enter:theatre4': ["Persona. Laughing she's quick and slippery; weeping she's slow and open. Strike when she cries."],
  'enter:theatre5': ['The Directrice. When she shouts "Cut!", you go back to your marks whether you like it or not. Get out of her circle!'],
  'enter:theatre6': ['The Playwright himself. Jump the curtain, mind the pages, and when the plot twists, switch sides!'],
  'clear:theatre1': ['Tickets found. Take your seats... I mean, on to the stage!'],
  'clear:theatre2': ['Land ho! Lovely sea legs, darlings.'],
  'clear:theatre3': ['Every cue, perfectly timed. Bravo!'],
  'clear:theatre4': ["The masks are down. She's smiling, I think. Truly."],
  'clear:theatre5': ["That's a wrap for her! The final curtain is ahead."],
  wipe: ['Everyone fluffs a line. From the top, darlings!', 'Up, up! The show must go on.'],
  both: ['Both masks at once! Watch everything!'],
  cut: ['CUT! Back to your marks, then out of her circle!'],
  curtain: ['The curtain! Jump it!'],
  twist: ['Plot twist! Swap sides when the stage turns!'],
};

// ---------- Sky Whale's Back ----------
export const WHALE_SCENES = {
  skywhale_results: [
    { card: "Sky Whale's Back", sub: 'Rank {grade}  ·  {time}' },
    { who: null, text: '{notes}. Rank bonus on the treasure: +{bonus}.' },
  ],
  // Captain Gale, staged: the red panda captain stands with her back to you on the deck of the
  // whale, spyglass to the sky as the wind snaps past; she lowers it, whirls round, swaggers up,
  // flashes her cutlass, and sweeps it in a scatter of gold.
  skywhale_gale: [
    { together: [{ cam: 'gale', up: 20, dur: 1.3 }, { walk: 'player', to: 'gale', gap: 200, speed: 100 }, { face: 'gale', to: 'player' }, { mood: 'gale', as: 'happy' }] },
    { face: 'gale', to: 1 },
    { together: [{ fx: 'wind', at: 'gale', top: true }, { act: 'gale', move: 'sway', dur: 1.6, amp: 0.05, speed: 3 }] },
    { who: null, text: 'A pirate airship is moored over the great blowhole, its sails snapping. On the rail, boot up, a captain lowers her spyglass.' },
    { together: [{ face: 'gale', to: 'player' }, { emote: 'gale', kind: '!' }, { jump: 'gale', height: 12 }] },
    { who: 'gale', text: "Well, well. Stowaways on MY whale? I'll have you know salvage rights are first come, first served.", mood: 'happy' },
    { together: [{ walk: 'gale', to: 'player', gap: 130, speed: 70 }, { act: 'gale', move: 'sway', dur: 1.2, amp: 0.08, speed: 6 }, { cam: ['player', 'gale'], up: 20, dur: 1 }] },
    { who: 'player', text: "She's not salvage. She's asleep, and she's sinking." },
    { together: [{ mood: 'gale', as: 'angry' }, { act: 'gale', move: 'windup', dur: 0.8 }, { fx: 'sparkle', at: 'gale', top: true, n: 6 }, { fx: 'coins', at: 'gale', n: 6 }] },
    { who: 'gale', text: 'All the more reason to take what we can before she drops! Crew, cutlasses out!', mood: 'angry' },
    { act: 'gale', move: 'attack', dur: 0.9, async: true },
    { wait: 0.3 },
    { together: [{ shake: 4, dur: 0.4 }, { fx: 'wind', at: 'player' }, { fx: 'coins', at: 'gale', n: 18 }, { walk: 'player', away: 'gale', by: 32, speed: 170 }, { emote: 'player', kind: '!' }] },
    { wait: 0.4 },
    { cam: 'player', dur: 0.7 },
  ],
  // The Barnacle Matriarch, staged: the snail queen taps her coral staff and her barnacle children
  // rattle in a scatter of shells; she sets off toward you at a snail's pace, very slowly, while
  // you wait; then she raises the staff and a wave of shells rolls out.
  skywhale_matriarch: [
    { together: [{ cam: 'matriarch', up: 20, dur: 1.3 }, { walk: 'player', to: 'matriarch', gap: 200, speed: 100 }, { mood: 'matriarch', as: 'angry' }] },
    { who: null, text: "Walls of shell and coral have grown right over the whale's back. On a throne of scallop, a lady crowned in conch shells taps her staff." },
    { together: [{ jump: 'matriarch', height: 5 }, { fx: 'shells', at: 'matriarch', n: 6 }, { shake: 1, dur: 0.15 }] },
    { together: [{ jump: 'matriarch', height: 5 }, { fx: 'shells', at: 'matriarch', n: 6 }, { shake: 1, dur: 0.15 }] },
    { together: [{ face: 'matriarch', to: 'player' }, { emote: 'matriarch', kind: 'anger', dur: 1.8 }] },
    { who: 'matriarch', text: 'We were here first, little landlubbers. Every barnacle on this whale is one of my children.', mood: 'angry' },
    { together: [{ walk: 'matriarch', to: 'player', gap: 140, speed: 14 }, { cam: ['player', 'matriarch'], up: 20, dur: 1.2 }, { emote: 'player', kind: 'sweat', dur: 2.6 }, { wait: 2.6 }] },
    { together: [{ emote: 'player', kind: '?', dur: 1.2 }, { face: 'player', to: 'matriarch' }] },
    { who: 'matriarch', text: 'If she sinks, we sink with her, and we LIKE it here. Go away.', mood: 'angry' },
    { act: 'matriarch', move: 'windup', dur: 0.8 },
    { act: 'matriarch', move: 'attack', dur: 1, async: true },
    { wait: 0.32 },
    { together: [{ shake: 4, dur: 0.5 }, { fx: 'shells', at: 'matriarch', n: 24 }, { fx: 'bubbles', at: 'matriarch', n: 10 }, { jump: 'player', height: 22 }, { emote: 'player', kind: '!' }] },
    { wait: 0.5 },
    { cam: 'player', dur: 0.7 },
  ],
  // The Whale's Dream, staged: the whale's sleeping spirit floats above the brow, humming, clouds
  // drifting off her; she rolls over in her sleep; she mumbles, gets cross at the noise, and
  // slaps her tail down in a gust that blows the clouds away.
  skywhale_whaledream: [
    { together: [{ cam: 'whaledream', up: 40, dur: 1.8 }, { walk: 'player', to: 'whaledream', gap: 200, speed: 90 }, { mood: 'whaledream', as: 'blink' }, { emote: 'whaledream', kind: 'zzz', dur: 8 }, { act: 'whaledream', move: 'float', dur: 2.4, height: 18, speed: 2.6 }] },
    { together: [{ fx: 'clouds', at: 'whaledream' }, { fx: 'notes', at: 'whaledream', top: true }] },
    { who: null, text: "The whale's brow, open to the wind above the clouds. A giant figure of soft sky-blue drifts there, eyes closed, humming in her sleep." },
    { together: [{ act: 'whaledream', move: 'sway', dur: 2.4, amp: 0.22, speed: 1.4 }, { fx: 'clouds', at: 'whaledream', n: 6 }] },
    { who: 'whaledream', text: '...mmh... just a little longer... the clouds are so warm down there...', mood: 'sad' },
    { together: [{ cam: ['player', 'whaledream'], up: 30, dur: 0.9 }, { face: 'player', to: 'whaledream' }, { act: 'whaledream', move: 'float', dur: 1.8, height: 14, speed: 3 }] },
    { who: 'player', text: "If you sink any lower, you'll crash into the island. Wake up!" },
    { together: [{ mood: 'whaledream', as: 'angry' }, { emote: 'whaledream', kind: 'anger', dur: 1.6 }, { act: 'whaledream', move: 'windup', dur: 0.8 }] },
    { who: 'whaledream', text: "...Who's that, singing so loud... let me sleep...", mood: 'angry' },
    { act: 'whaledream', move: 'attack', dur: 1, async: true },
    { wait: 0.32 },
    { together: [{ flash: '#d8f0ff' }, { shake: 5, dur: 0.5 }, { fx: 'clouds', at: 'whaledream', n: 12 }, { fx: 'wind', at: 'player' }, { walk: 'player', away: 'whaledream', by: 34, speed: 170 }, { emote: 'player', kind: '!' }] },
    { wait: 0.5 },
    { cam: 'player', dur: 0.7 },
  ],
  skywhale_woken: [
    { who: 'whaledream', text: "...Oh! Oh my. I was dreaming I was a pebble at the bottom of the sea. Have I been asleep long?", mood: 'happy' },
    { who: null, text: 'Somewhere far below, a great tail sweeps once. The whole back rises, and the clouds fall away beneath it.' },
    { who: 'whaledream', text: 'Thank you, little ones. Ride with me a while. I know a sunrise you have never seen.', mood: 'happy' },
  ],
};

// Skipper Nimbus calling from the pier with a conch horn (world/skywhale.js).
export const WHALE_RADIO = {
  'enter:skywhale1': ["The tail docks! Tie down three moorings. And when she lifts her tail, grab a rope or you'll slide right off!"],
  'enter:skywhale2': ['The spine market. Mind the gusts, and the blowholes: stand on one when it blows and up you go!'],
  'enter:skywhale3': ["Her lungs. Feel that? She's breathing. The air-blooms only open on the breath out."],
  'enter:skywhale4': ["Gale's ship. When she calls a broadside, get off that side of the deck, or ride the blowhole over it!"],
  'enter:skywhale5': ['The Matriarch. When she shells up, hit her hard and fast. If the shell holds, it bursts: jump!'],
  'enter:skywhale6': ["The brow. That's her, the whale herself, dreaming. Wake her gently... well, as gently as you can."],
  'clear:skywhale1': ["Moorings fast! She won't shake us off now."],
  'clear:skywhale2': ['Through the market! The lungs are just ahead.'],
  'clear:skywhale3': ["Listen to her breathe. She's calmer already."],
  'clear:skywhale4': ["Gale's ship is cast off. Good riddance!"],
  'clear:skywhale5': ['The fortress is open! Up to the brow!'],
  wipe: ["Up you get! She's a big whale, there's room to try again.", 'Hold on tighter this time!'],
  broadside: ['Broadside! Off that side, quick!'],
  encrust: ['Shell up! Hit her with everything!'],
  song: ["She's singing in her sleep. Watch which side the wind takes!"],
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
    { card: 'A New Path', sub: 'Wind Dancer' },
    { who: 'vex', text: "Every fight is a show, {name}, and from today you're the star of it. Light feet, big finish.", mood: 'happy' },
    { who: 'vex', text: 'Chakrams if you like it close, gloves if you like the wind. Either way: never stop moving.' },
  ],
  spiritmage: [
    { card: 'A New Path', sub: 'Star Witch' },
    { who: 'elowen', text: "The stars answer you, {name}. I've never seen anyone your age call them so easily.", mood: 'happy' },
    { who: 'elowen', text: "A wand for quick stars, a staff for comets. Show off a little. You've earned it." },
  ],
  path: [
    { card: 'A New Path', sub: '{job}' },
    { who: null, text: 'Something settles inside you, like a key turning in a lock you never knew you had.' },
    { who: 'player', text: 'I am a {job} now.', mood: 'happy' },
  ],
};

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


// ---------- Moonlit Manor ----------
export const MANOR_SCENES = {
  manor_results: [
    { card: 'Moonlit Manor', sub: 'Rank {grade}  ·  {time}' },
    { who: null, text: '{notes}. Rank bonus on the treasure: +{bonus}.' },
  ],
  // The Armours meet the group in the ballroom.
  manor_waltz: [
    { who: null, text: 'The ballroom. A music box somewhere starts a waltz, and two suits of armour turn to face the door.' },
    { who: 'waltzrondo', text: 'Guests! At last. My lady, shall we show them how it is done?' },
    { who: 'waltzminuet', text: 'Oh, we shall. One, two, three... one, two, THREE!', mood: 'happy' },
  ],
  manor_velvet: [
    { who: 'velvet', text: 'Mud. On MY runner. Do you know how long it takes to beat a hundred-year-old rug?', mood: 'angry' },
    { who: 'player', text: "We're here for the guests. They need to go home." },
    { who: 'velvet', text: "Nobody leaves the party before the hostess says so. House rules. Tea, anyone? It's scalding.", mood: 'angry' },
  ],
  manor_marigold: [
    { who: null, text: 'The roof, under a moon far too big. A table is laid for a hundred, every chair taken by a guest who looks very, very tired.' },
    { who: 'marigold', text: 'Oh! More guests! How wonderful. Nobody ever stays, you know. So I make sure they do.' },
    { who: 'player', text: "They want to go home, Lady Marigold. And I think you're lonely, not cruel." },
    { who: 'marigold', text: "...Then dance with me. One last waltz. If you can keep up, I'll... think about it.", mood: 'sad' },
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
  aquarium_moray: [
    { who: null, text: 'A grotto full of holes. Something long and spotted slides out of one, and something long and golden watches from another.' },
    { who: 'moraymurri', text: "Sister! Visitors! Nobody's visited since the palace went down.", mood: 'happy' },
    { who: 'morayena', text: "Then let's keep them. One for you, one for me... and two to share.", mood: 'happy' },
  ],
  aquarium_abyssia: [
    { who: 'abyssia', text: 'Oh, little air-breathers, all the way down here? The wards are failing, you know. I am making sure of it.', mood: 'happy' },
    { who: 'player', text: "You're the one draining the wards? The whole palace is drowning!" },
    { who: 'abyssia', text: 'And when it does, the deep is mine. Ink, my darlings!', mood: 'angry' },
  ],
  aquarium_coralie: [
    { who: null, text: 'The throne room. A queen sits on a throne of coral, eyes closed, crown askew, the sea swirling slowly around her.' },
    { who: 'coralie', text: '...Who disturbs the drowned court? My people are cold. My palace is dark. I have been asleep so long.', mood: 'sad' },
    { who: 'player', text: "We're here to wake you, your majesty. The wards can still be saved." },
    { who: 'coralie', text: 'Then prove you are stronger than the tide that took us!', mood: 'angry' },
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
  carnival_leonie: [
    { who: null, text: 'The Big Top. A drumroll from nowhere. A spotlight swings round and finds a lion-girl on a trapeze, upside down, grinning.' },
    { who: 'leonie', text: 'Ladies and gentlemen! Tonight, for one night only... YOU get to be the act!', mood: 'happy' },
    { who: 'leonie', text: 'Try not to be eaten. The crowd hates it when that happens.', mood: 'happy' },
  ],
  carnival_marionetta: [
    { who: 'marionetta', text: 'Oh, visitors. With arms and legs and everything. How... unfinished you look without strings.', mood: 'happy' },
    { who: 'player', text: "We're here to wind the Queen down. Let your toys rest." },
    { who: 'marionetta', text: 'Rest? A puppet that rests is just firewood. Dance for me!', mood: 'angry' },
  ],
  carnival_gearheart: [
    { who: null, text: 'Under the great wheel, a queen of brass and porcelain turns slowly, her key spinning so fast it hums.' },
    { who: 'gearheart', text: 'Tick... tock... the show... must go on... I cannot stop... I was wound... too tight...', mood: 'sad' },
    { who: 'player', text: "Then we'll help you stop. Hold on, your majesty!" },
    { who: 'gearheart', text: 'Then... keep up! TICK! TOCK!', mood: 'angry' },
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
  observatory_folio: [
    { who: null, text: 'The Archive. A thousand shelves, and a librarian with an enormous book who turns very slowly to look at you.' },
    { who: 'folio', text: 'Shhh. SHHHHH. You are stamping. In MY archive. Do you have a library card?', mood: 'angry' },
    { who: 'player', text: "We're going up to see Astraea." },
    { who: 'folio', text: 'Then your books are overdue. ALL of them. Fines are payable at once!', mood: 'angry' },
  ],
  observatory_eclipse: [
    { who: null, text: 'The Orrery. Brass planets wheel slowly round a sun of glass. Two sisters float at its heart, one gold, one silver.' },
    { who: 'eclipsesol', text: 'Visitors, Luna! On the one night our lady stopped the sky.', mood: 'happy' },
    { who: 'eclipseluna', text: "Then let's show them an eclipse they won't forget, Sol. Light and dark!", mood: 'happy' },
  ],
  observatory_astraea: [
    { who: null, text: 'The crown of the tower, open to the sky. The great telescope points straight up at stars that do not move.' },
    { who: 'astraea', text: 'Every night, stars fall. Every night, something I love burns out and is gone. So I stopped them.', mood: 'sad' },
    { who: 'player', text: "But a sky that doesn't turn is a sky that's dying. Let them go." },
    { who: 'astraea', text: "...Then show me. Show me something worth letting fall for!", mood: 'angry' },
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
  volcano_toffee: [
    { who: null, text: 'The forge rings. A smith with a caramel hammer looks up from her anvil and grins through the steam.' },
    { who: 'toffee', text: "Visitors! You're just in time. I need something to test my new hammer on!", mood: 'happy' },
    { who: 'toffee', text: 'Hold still. Or don\'t. Moving targets are more fun!', mood: 'happy' },
  ],
  volcano_gretel: [
    { who: 'gretel', text: 'Halt! I am Gretel, Knight of the Gingerbread Wall. None shall pass to the crater!', mood: 'angry' },
    { who: 'player', text: "The Queen's going to bury the whole island in caramel. Let us through." },
    { who: 'gretel', text: 'Then you will have to go through ME. En garde!', mood: 'angry' },
  ],
  volcano_bonbon: [
    { who: null, text: 'The crater. A lake of bubbling caramel, islands of rock candy, and a queen in a gown of cake stirring it all with a giant spoon.' },
    { who: 'bonbon', text: 'More sugar! More heat! The biggest dessert in the WORLD, and everyone gets a slice!', mood: 'happy' },
    { who: 'player', text: 'If it erupts, everyone gets buried in it!' },
    { who: 'bonbon', text: "...Buried? Oh. Oh dear. Well, I'm not stopping now! Stir, stir, STIR!", mood: 'angry' },
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
  theatre_persona: [
    { who: null, text: 'The ballroom set glides in. Under the chandeliers a muse in a gown of two colours dances alone, a mask in each hand.' },
    { who: 'persona', text: 'Oh, an audience! Shall I make you laugh?', mood: 'happy' },
    { who: 'persona', text: '...Or shall I make you cry? I can never decide. Let us find out together!', mood: 'sad' },
  ],
  theatre_directrice: [
    { who: 'directrice', text: 'Who let the audience backstage?! This is a CLOSED set!', mood: 'angry' },
    { who: 'player', text: 'Your play is making the whole island forget itself.' },
    { who: 'directrice', text: 'Then you will be my extras. Places, everyone! And... ACTION!', mood: 'angry' },
  ],
  theatre_playwright: [
    { who: null, text: 'The great stage. A desk stands alone in a single spotlight, buried in pages. A pale figure in a half-mask lifts his quill.' },
    { who: 'playwright', text: 'Ah, my heroes arrive, exactly on cue. I wrote this scene for you.' },
    { who: 'player', text: 'Then write it a different ending.' },
    { who: 'playwright', text: 'Every story needs a villain, and every villain needs a final act. Let us find out who it is.', mood: 'angry' },
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
  skywhale_gale: [
    { who: null, text: 'A pirate airship is moored over the great blowhole, its sails snapping. On the rail, boot up, a captain lowers her spyglass.' },
    { who: 'gale', text: "Well, well. Stowaways on MY whale? I'll have you know salvage rights are first come, first served.", mood: 'happy' },
    { who: 'player', text: "She's not salvage. She's asleep, and she's sinking." },
    { who: 'gale', text: 'All the more reason to take what we can before she drops! Crew, cutlasses out!', mood: 'angry' },
  ],
  skywhale_matriarch: [
    { who: null, text: 'Walls of shell and coral have grown right over the whale\'s back. On a throne of scallop, a lady crowned in conch shells taps her staff.' },
    { who: 'matriarch', text: 'We were here first, little landlubbers. Every barnacle on this whale is one of my children.', mood: 'angry' },
    { who: 'matriarch', text: 'If she sinks, we sink with her, and we LIKE it here. Go away.', mood: 'angry' },
  ],
  skywhale_whaledream: [
    { who: null, text: "The whale's brow, open to the wind above the clouds. A giant figure of soft sky-blue drifts there, eyes closed, humming in her sleep." },
    { who: 'whaledream', text: '...mmh... just a little longer... the clouds are so warm down there...', mood: 'sad' },
    { who: 'player', text: "If you sink any lower, you'll crash into the island. Wake up!" },
    { who: 'whaledream', text: '...Who\'s that, singing so loud... let me sleep...', mood: 'angry' },
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
